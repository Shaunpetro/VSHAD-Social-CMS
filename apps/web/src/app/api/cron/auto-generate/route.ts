// apps/web/src/app/api/cron/auto-generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSocialContent } from '@/lib/ai/openai';
import { PostStatus, QueueStatus, PlatformType } from '@prisma/client';

/**
 * Auto-Generate Cron Job
 * Runs weekly (Sunday 8 PM or Monday 6 AM) to generate content for the upcoming week
 * 
 * Flow:
 * 1. Find all companies with onboardingCompleted=true
 * 2. For each company, check postsPerWeek, preferredDays, preferredTimes
 * 3. Get content pillars with frequency weights
 * 4. Get connected platforms
 * 5. Generate content for each scheduled slot
 * 6. If autoApprove=true -> Create GeneratedPost with SCHEDULED status
 * 7. If autoApprove=false -> Create ContentQueueItem with PENDING status
 */

interface ScheduleSlot {
  date: Date;
  time: string;
  dayOfWeek: string;
}

interface GenerationResult {
  companyId: string;
  companyName: string;
  postsGenerated: number;
  postsQueued: number;
  postsScheduled: number;
  errors: string[];
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Get the next N days starting from tomorrow
 */
function getUpcomingDays(count: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  
  for (let i = 1; i <= count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }
  
  return days;
}

/**
 * Generate schedule slots based on company preferences
 */
function generateScheduleSlots(
  postsPerWeek: number,
  preferredDays: string[],
  preferredTimes: Record<string, string[]> | null,
  timezone: string
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const upcomingDays = getUpcomingDays(7);
  
  // Default times if none specified
  const defaultTimes = ['09:00', '14:00'];
  
  // Filter to preferred days only
  const validDays = upcomingDays.filter(date => {
    const dayName = DAY_NAMES[date.getDay()];
    return preferredDays.length === 0 || preferredDays.includes(dayName);
  });
  
  if (validDays.length === 0) {
    // Fallback to all weekdays if no preferred days
    validDays.push(...upcomingDays.filter(date => {
      const day = date.getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    }));
  }
  
  // Distribute posts across available days
  let postsAssigned = 0;
  let dayIndex = 0;
  
  while (postsAssigned < postsPerWeek && validDays.length > 0) {
    const date = validDays[dayIndex % validDays.length];
    const dayName = DAY_NAMES[date.getDay()];
    
    // Get times for this day
    const timesForDay = preferredTimes?.[dayName] || defaultTimes;
    const timeIndex = Math.floor(postsAssigned / validDays.length) % timesForDay.length;
    const time = timesForDay[timeIndex] || defaultTimes[0];
    
    slots.push({
      date: new Date(date),
      time,
      dayOfWeek: dayName,
    });
    
    postsAssigned++;
    dayIndex++;
  }
  
  return slots;
}

/**
 * Select a content pillar based on frequency weights
 */
function selectPillar(pillars: Array<{ id: string; name: string; frequencyWeight: number; topics: string[] }>): {
  pillarId: string;
  pillarName: string;
  topic: string;
} | null {
  if (pillars.length === 0) return null;
  
  // Weighted random selection
  const totalWeight = pillars.reduce((sum, p) => sum + p.frequencyWeight, 0);
  let random = Math.random() * totalWeight;
  
  for (const pillar of pillars) {
    random -= pillar.frequencyWeight;
    if (random <= 0) {
      // Select random topic from pillar
      const topic = pillar.topics.length > 0
        ? pillar.topics[Math.floor(Math.random() * pillar.topics.length)]
        : pillar.name;
      
      return {
        pillarId: pillar.id,
        pillarName: pillar.name,
        topic,
      };
    }
  }
  
  // Fallback to first pillar
  const firstPillar = pillars[0];
  return {
    pillarId: firstPillar.id,
    pillarName: firstPillar.name,
    topic: firstPillar.topics[0] || firstPillar.name,
  };
}

/**
 * Determine tone based on day and company settings
 */
function getToneForDay(
  dayOfWeek: string,
  defaultTone: string,
  dayToneSchedule: Record<string, string> | null,
  humorEnabled: boolean,
  humorDays: string[]
): string {
  // Check day-specific tone schedule
  if (dayToneSchedule && dayToneSchedule[dayOfWeek]) {
    return dayToneSchedule[dayOfWeek];
  }
  
  // Check if humor is appropriate for this day
  if (humorEnabled && humorDays.includes(dayOfWeek)) {
    // Add some variety on humor days
    const humorTones = ['casual', 'friendly'];
    return humorTones[Math.floor(Math.random() * humorTones.length)];
  }
  
  return defaultTone;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: GenerationResult[] = [];
  
  console.log('[AutoGenerate] ========================================');
  console.log('[AutoGenerate] Starting weekly content generation...');
  console.log('[AutoGenerate] Time:', new Date().toISOString());
  
  try {
    // Find all companies with completed onboarding
    const companies = await prisma.company.findMany({
      where: {
        intelligence: {
          onboardingCompleted: true,
        },
      },
      include: {
        intelligence: {
          include: {
            contentPillars: {
              where: { isActive: true },
            },
          },
        },
        platforms: {
          where: { isConnected: true },
        },
      },
    });
    
    console.log(`[AutoGenerate] Found ${companies.length} active companies`);
    
    for (const company of companies) {
      const result: GenerationResult = {
        companyId: company.id,
        companyName: company.name,
        postsGenerated: 0,
        postsQueued: 0,
        postsScheduled: 0,
        errors: [],
      };
      
      try {
        const intel = company.intelligence;
        
        if (!intel) {
          result.errors.push('No intelligence data found');
          results.push(result);
          continue;
        }
        
        if (company.platforms.length === 0) {
          result.errors.push('No connected platforms');
          results.push(result);
          continue;
        }
        
        console.log(`[AutoGenerate] Processing ${company.name}: ${intel.postsPerWeek} posts/week`);
        
        // Generate schedule slots
        const slots = generateScheduleSlots(
          intel.postsPerWeek,
          intel.preferredDays,
          intel.preferredTimes as Record<string, string[]> | null,
          intel.timezone
        );
        
        console.log(`[AutoGenerate] Generated ${slots.length} schedule slots`);
        
        // Get pillars for content variety
        const pillars = intel.contentPillars.map(p => ({
          id: p.id,
          name: p.name,
          frequencyWeight: p.frequencyWeight,
          topics: p.topics,
        }));
        
        for (const slot of slots) {
          try {
            // Select pillar and topic
            const pillarSelection = selectPillar(pillars);
            const topic = pillarSelection?.topic || `${company.industry || 'business'} insights`;
            
            // Determine tone for this day
            const tone = getToneForDay(
              slot.dayOfWeek,
              intel.defaultTone,
              intel.dayToneSchedule as Record<string, string> | null,
              intel.humorEnabled,
              intel.humorDays
            );
            
            // Select platform (rotate through connected platforms)
            const platformIndex = result.postsGenerated % company.platforms.length;
            const platform = company.platforms[platformIndex];
            
            // Map platform type to lowercase for generateSocialContent
            const platformTypeMap: Record<PlatformType, 'linkedin' | 'facebook' | 'twitter' | 'instagram' | 'wordpress'> = {
              LINKEDIN: 'linkedin',
              FACEBOOK: 'facebook',
              TWITTER: 'twitter',
              INSTAGRAM: 'instagram',
              WORDPRESS: 'wordpress',
            };
            
            const platformType = platformTypeMap[platform.type];
            
            // Generate content
            console.log(`[AutoGenerate] Generating for ${platform.type} - Topic: ${topic}, Tone: ${tone}`);
            
            const generated = await generateSocialContent({
              companyId: company.id,
              companyName: company.name,
              companyDescription: company.description || undefined,
              companyIndustry: company.industry || undefined,
              platform: platformType,
              platformId: platform.id,
              topic,
              tone: tone as 'professional' | 'casual' | 'friendly' | 'authoritative',
              includeHashtags: true,
              includeEmojis: platformType === 'instagram' || platformType === 'facebook',
              useAnalytics: true,
            });
            
            result.postsGenerated++;
            
            // Calculate scheduled datetime
            const scheduledFor = new Date(slot.date);
            const [hours, minutes] = slot.time.split(':').map(Number);
            scheduledFor.setHours(hours, minutes, 0, 0);
            
            if (intel.autoApprove) {
              // Create GeneratedPost directly with SCHEDULED status
              await prisma.generatedPost.create({
                data: {
                  companyId: company.id,
                  platformId: platform.id,
                  content: generated.content,
                  hashtags: generated.hashtags,
                  topic,
                  tone,
                  pillar: pillarSelection?.pillarName,
                  scheduledFor,
                  status: PostStatus.SCHEDULED,
                  generatedBy: 'groq-llama-3.3-auto',
                },
              });
              
              result.postsScheduled++;
              console.log(`[AutoGenerate] Scheduled post for ${scheduledFor.toISOString()}`);
            } else {
              // Create ContentQueueItem for review
              await prisma.contentQueueItem.create({
                data: {
                  companyId: company.id,
                  platformId: platform.id,
                  content: generated.content,
                  hashtags: generated.hashtags,
                  keywords: intel.primaryKeywords,
                  pillar: pillarSelection?.pillarName,
                  tone,
                  suggestedDate: scheduledFor,
                  suggestedTime: slot.time,
                  status: QueueStatus.PENDING,
                  engagementPrediction: generated.analyticsUsed ? 'high' : 'medium',
                  generationContext: {
                    topic,
                    pillarId: pillarSelection?.pillarId,
                    analyticsUsed: generated.analyticsUsed,
                    generatedAt: new Date().toISOString(),
                  },
                },
              });
              
              result.postsQueued++;
              console.log(`[AutoGenerate] Queued post for review (${scheduledFor.toISOString()})`);
            }
            
            // Update pillar post count
            if (pillarSelection?.pillarId) {
              await prisma.contentPillar.update({
                where: { id: pillarSelection.pillarId },
                data: { totalPosts: { increment: 1 } },
              });
            }
            
          } catch (slotError) {
            const errorMsg = slotError instanceof Error ? slotError.message : 'Unknown error';
            result.errors.push(`Slot generation failed: ${errorMsg}`);
            console.error(`[AutoGenerate] Slot error:`, errorMsg);
          }
        }
        
      } catch (companyError) {
        const errorMsg = companyError instanceof Error ? companyError.message : 'Unknown error';
        result.errors.push(`Company processing failed: ${errorMsg}`);
        console.error(`[AutoGenerate] Company error for ${company.name}:`, errorMsg);
      }
      
      results.push(result);
    }
    
    const duration = Date.now() - startTime;
    
    // Calculate totals
    const totals = results.reduce(
      (acc, r) => ({
        generated: acc.generated + r.postsGenerated,
        queued: acc.queued + r.postsQueued,
        scheduled: acc.scheduled + r.postsScheduled,
        errors: acc.errors + r.errors.length,
      }),
      { generated: 0, queued: 0, scheduled: 0, errors: 0 }
    );
    
    console.log('[AutoGenerate] ========================================');
    console.log(`[AutoGenerate] Completed in ${duration}ms`);
    console.log(`[AutoGenerate] Generated: ${totals.generated}, Queued: ${totals.queued}, Scheduled: ${totals.scheduled}, Errors: ${totals.errors}`);
    console.log('[AutoGenerate] ========================================');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: totals,
      companies: results,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AutoGenerate] Fatal error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

// Support POST as well (for manual triggers)
export async function POST(request: NextRequest) {
  return GET(request);
}