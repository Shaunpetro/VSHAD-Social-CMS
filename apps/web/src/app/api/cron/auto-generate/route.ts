// apps/web/src/app/api/cron/auto-generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSocialContent } from '@/lib/ai/openai';
import { PostStatus, QueueStatus, PlatformType } from '@prisma/client';
import {
  generateWeeklyContentMix,
  getContentTypePromptEnhancement,
  CONTENT_TYPE_CONFIG,
  type ContentType,
  type ScheduledSlot,
} from '@/lib/ai/content-strategy';

/**
 * Enhanced Auto-Generate Cron Job
 * Runs weekly (Sunday 8 PM SAST) to generate content for the upcoming week
 * 
 * Features:
 * - Psychology-based content mix (40-30-20-10 rule)
 * - Day-of-week optimization (right content for right day)
 * - Funnel-stage awareness (awareness -> interest -> consideration -> conversion)
 * - Industry benchmark integration
 * - Goal-based content adjustment
 * - Self-learning from performance data
 * - Optional single-company targeting via ?companyId= parameter
 */

interface GenerationResult {
  companyId: string;
  companyName: string;
  postsGenerated: number;
  postsQueued: number;
  postsScheduled: number;
  contentMix: Record<string, number>;
  funnelMix: Record<string, number>;
  errors: string[];
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: GenerationResult[] = [];
  
  // Check for optional companyId parameter (for single-company generation from UI)
  const { searchParams } = new URL(request.url);
  const targetCompanyId = searchParams.get('companyId');
  
  console.log('[AutoGenerate] ========================================');
  console.log('[AutoGenerate] Starting enhanced weekly content generation...');
  console.log('[AutoGenerate] Time:', new Date().toISOString());
  if (targetCompanyId) {
    console.log('[AutoGenerate] Targeting specific company:', targetCompanyId);
  }
  
  try {
    // Find all companies with completed onboarding
    // If companyId provided, only process that specific company
    const companies = await prisma.company.findMany({
      where: {
        ...(targetCompanyId ? { id: targetCompanyId } : {}),
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
    
    if (targetCompanyId && companies.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Company not found or onboarding not completed',
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }
    
    for (const company of companies) {
      const result: GenerationResult = {
        companyId: company.id,
        companyName: company.name,
        postsGenerated: 0,
        postsQueued: 0,
        postsScheduled: 0,
        contentMix: {},
        funnelMix: {},
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
        console.log(`[AutoGenerate] Goals: ${intel.primaryGoals.join(', ') || 'none set'}`);
        console.log(`[AutoGenerate] Preferred days: ${intel.preferredDays.join(', ') || 'not set'}`);
        
        // Fetch industry benchmark for additional themes
        let industryThemes: Record<string, string[]> | null = null;
        let industryHashtags: string[] = [];
        
        if (company.industry) {
          const benchmark = await prisma.industryBenchmark.findFirst({
            where: {
              industry: {
                contains: company.industry,
                mode: 'insensitive',
              },
            },
          });
          
          if (benchmark) {
            industryThemes = benchmark.suggestedThemes as Record<string, string[]> | null;
            industryHashtags = benchmark.topHashtags || [];
            console.log(`[AutoGenerate] Found industry benchmark for: ${benchmark.industry}`);
          }
        }
        
        // Collect all topics from content pillars
        const pillarTopics: string[] = [];
        const pillarMap: Record<string, { id: string; name: string; topics: string[]; contentTypes: string[] }> = {};
        
        for (const pillar of intel.contentPillars) {
          pillarTopics.push(...pillar.topics);
          pillarMap[pillar.name] = {
            id: pillar.id,
            name: pillar.name,
            topics: pillar.topics,
            contentTypes: pillar.contentTypes,
          };
        }
        
        // Generate psychology-based content mix for the week
        const contentMix = generateWeeklyContentMix(
          intel.postsPerWeek,
          intel.preferredDays,
          intel.preferredTimes as Record<string, string[]> | null,
          intel.primaryGoals,
          pillarTopics,
          industryThemes,
          company.industry,
          intel.learnedBestPillars as Record<string, number> | null
        );
        
        console.log(`[AutoGenerate] Generated ${contentMix.slots.length} content slots`);
        console.log(`[AutoGenerate] Content mix:`, contentMix.mixBreakdown);
        console.log(`[AutoGenerate] Funnel mix:`, contentMix.funnelBreakdown);
        
        // Store mix breakdown in result
        result.contentMix = contentMix.mixBreakdown as Record<string, number>;
        result.funnelMix = contentMix.funnelBreakdown as Record<string, number>;
        
        // Generate content for each slot
        for (const slot of contentMix.slots) {
          try {
            // Select platform (rotate through connected platforms)
            const platformIndex = result.postsGenerated % company.platforms.length;
            const platform = company.platforms[platformIndex];
            
            // Map platform type
            const platformTypeMap: Record<PlatformType, 'linkedin' | 'facebook' | 'twitter' | 'instagram' | 'wordpress'> = {
              LINKEDIN: 'linkedin',
              FACEBOOK: 'facebook',
              TWITTER: 'twitter',
              INSTAGRAM: 'instagram',
              WORDPRESS: 'wordpress',
            };
            const platformType = platformTypeMap[platform.type];
            
            // Determine tone based on day and company settings
            const tone = determineTone(
              slot.dayOfWeek,
              slot.contentType,
              intel.defaultTone,
              intel.dayToneSchedule as Record<string, string> | null,
              intel.humorEnabled,
              intel.humorDays
            );
            
            // Get content type prompt enhancement
            const contentTypeContext = getContentTypePromptEnhancement(
              slot.contentType,
              slot.dayOfWeek,
              slot.funnelStage,
              intel.primaryGoals
            );
            
            // Find matching pillar for this content
            const matchingPillar = findMatchingPillar(slot.contentType, pillarMap);
            
            console.log(`[AutoGenerate] Generating: ${slot.contentType} for ${slot.dayOfWeek} ${slot.time} on ${platform.type}`);
            
            // Generate content with enhanced context
            const generated = await generateSocialContent({
              companyId: company.id,
              companyName: company.name,
              companyDescription: company.description || undefined,
              companyIndustry: company.industry || undefined,
              platform: platformType,
              platformId: platform.id,
              topic: slot.topicSuggestion,
              tone: tone as 'professional' | 'casual' | 'friendly' | 'authoritative',
              includeHashtags: true,
              includeEmojis: platformType === 'instagram' || platformType === 'facebook',
              useAnalytics: true,
              // Enhanced context passed to AI
              contentTypeContext,
            });
            
            result.postsGenerated++;
            
            // Merge industry hashtags with generated ones
            const finalHashtags = mergeHashtags(
              generated.hashtags,
              industryHashtags,
              intel.industryHashtags,
              intel.brandedHashtags
            );
            
            if (intel.autoApprove) {
              // Create GeneratedPost directly with SCHEDULED status
              await prisma.generatedPost.create({
                data: {
                  companyId: company.id,
                  platformId: platform.id,
                  content: generated.content,
                  hashtags: finalHashtags,
                  topic: slot.topicSuggestion,
                  tone,
                  pillar: matchingPillar?.name || null,
                  contentType: slot.contentType,
                  scheduledFor: slot.date,
                  status: PostStatus.SCHEDULED,
                  generatedBy: 'groq-llama-3.3-auto-v2',
                  hook: extractHook(generated.content),
                },
              });
              
              result.postsScheduled++;
              console.log(`[AutoGenerate] Scheduled: ${slot.contentType} for ${slot.date.toISOString()}`);
            } else {
              // Create ContentQueueItem for review
              await prisma.contentQueueItem.create({
                data: {
                  companyId: company.id,
                  platformId: platform.id,
                  content: generated.content,
                  hashtags: finalHashtags,
                  keywords: intel.primaryKeywords,
                  pillar: matchingPillar?.name || null,
                  contentType: slot.contentType,
                  tone,
                  suggestedDate: slot.date,
                  suggestedTime: slot.time,
                  status: QueueStatus.PENDING,
                  hook: extractHook(generated.content),
                  engagementPrediction: predictEngagement(slot.contentType, slot.funnelStage),
                  generationContext: {
                    contentType: slot.contentType,
                    funnelStage: slot.funnelStage,
                    dayPsychology: slot.toneGuidance,
                    topicSuggestion: slot.topicSuggestion,
                    analyticsUsed: generated.analyticsUsed,
                    generatedAt: new Date().toISOString(),
                  },
                },
              });
              
              result.postsQueued++;
              console.log(`[AutoGenerate] Queued: ${slot.contentType} for review (${slot.date.toISOString()})`);
            }
            
            // Update pillar post count if matched
            if (matchingPillar) {
              await prisma.contentPillar.update({
                where: { id: matchingPillar.id },
                data: { totalPosts: { increment: 1 } },
              });
            }
            
          } catch (slotError) {
            const errorMsg = slotError instanceof Error ? slotError.message : 'Unknown error';
            result.errors.push(`${slot.contentType} generation failed: ${errorMsg}`);
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
    
    // Aggregate content mix across all companies
    const aggregateContentMix: Record<string, number> = {};
    const aggregateFunnelMix: Record<string, number> = {};
    
    for (const r of results) {
      for (const [type, count] of Object.entries(r.contentMix)) {
        aggregateContentMix[type] = (aggregateContentMix[type] || 0) + count;
      }
      for (const [stage, count] of Object.entries(r.funnelMix)) {
        aggregateFunnelMix[stage] = (aggregateFunnelMix[stage] || 0) + count;
      }
    }
    
    console.log('[AutoGenerate] ========================================');
    console.log(`[AutoGenerate] Completed in ${duration}ms`);
    console.log(`[AutoGenerate] Generated: ${totals.generated}, Queued: ${totals.queued}, Scheduled: ${totals.scheduled}`);
    console.log(`[AutoGenerate] Content Mix:`, aggregateContentMix);
    console.log(`[AutoGenerate] Funnel Mix:`, aggregateFunnelMix);
    console.log('[AutoGenerate] ========================================');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        ...totals,
        contentMix: aggregateContentMix,
        funnelMix: aggregateFunnelMix,
      },
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

// Support POST as well (for manual triggers from UI)
export async function POST(request: NextRequest) {
  return GET(request);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determine tone based on day, content type, and company settings
 */
function determineTone(
  dayOfWeek: string,
  contentType: ContentType,
  defaultTone: string,
  dayToneSchedule: Record<string, string> | null,
  humorEnabled: boolean,
  humorDays: string[]
): string {
  // Check day-specific tone schedule first
  if (dayToneSchedule && dayToneSchedule[dayOfWeek.toLowerCase()]) {
    return dayToneSchedule[dayOfWeek.toLowerCase()];
  }
  
  // Content type specific tone adjustments
  const contentTypeTones: Partial<Record<ContentType, string>> = {
    behindTheScenes: 'casual',
    engagement: 'friendly',
    community: 'friendly',
    motivational: 'authoritative',
    promotional: 'professional',
  };
  
  if (contentTypeTones[contentType]) {
    return contentTypeTones[contentType]!;
  }
  
  // Check if humor is appropriate
  if (humorEnabled && humorDays.includes(dayOfWeek.toLowerCase())) {
    const casualTypes: ContentType[] = ['behindTheScenes', 'engagement', 'community'];
    if (casualTypes.includes(contentType)) {
      return 'casual';
    }
  }
  
  return defaultTone;
}

/**
 * Find a matching pillar for the content type
 */
function findMatchingPillar(
  contentType: ContentType,
  pillarMap: Record<string, { id: string; name: string; topics: string[]; contentTypes: string[] }>
): { id: string; name: string } | null {
  // Find pillar that includes this content type
  for (const [name, pillar] of Object.entries(pillarMap)) {
    if (pillar.contentTypes.includes(contentType)) {
      return { id: pillar.id, name: pillar.name };
    }
  }
  
  // Fallback: return first pillar if any exist
  const firstPillar = Object.values(pillarMap)[0];
  return firstPillar ? { id: firstPillar.id, name: firstPillar.name } : null;
}

/**
 * Merge and deduplicate hashtags from multiple sources
 */
function mergeHashtags(
  generated: string[],
  industry: string[],
  companyIndustry: string[],
  branded: string[]
): string[] {
  const allHashtags = new Set<string>();
  
  // Add generated hashtags first (priority)
  for (const tag of generated.slice(0, 5)) {
    allHashtags.add(tag.toLowerCase().replace(/^#/, ''));
  }
  
  // Add branded hashtags (always include)
  for (const tag of branded) {
    allHashtags.add(tag.toLowerCase().replace(/^#/, ''));
  }
  
  // Add some company industry hashtags
  for (const tag of companyIndustry.slice(0, 2)) {
    allHashtags.add(tag.toLowerCase().replace(/^#/, ''));
  }
  
  // Add some general industry hashtags
  for (const tag of industry.slice(0, 2)) {
    if (allHashtags.size < 10) {
      allHashtags.add(tag.toLowerCase().replace(/^#/, ''));
    }
  }
  
  return Array.from(allHashtags).slice(0, 10);
}

/**
 * Extract the hook (first sentence/line) from content
 */
function extractHook(content: string): string {
  // Try to get first sentence or first line
  const firstLine = content.split('\n')[0];
  const firstSentence = content.split(/[.!?]/)[0];
  
  // Return whichever is shorter (but not empty)
  if (firstLine.length > 0 && firstLine.length <= firstSentence.length) {
    return firstLine.substring(0, 150);
  }
  
  return firstSentence.substring(0, 150);
}

/**
 * Predict engagement level based on content type and funnel stage
 */
function predictEngagement(contentType: ContentType, funnelStage: string): string {
  const highEngagementTypes: ContentType[] = ['engagement', 'community', 'behindTheScenes'];
  const mediumEngagementTypes: ContentType[] = ['educational', 'tips', 'motivational'];
  
  if (highEngagementTypes.includes(contentType)) {
    return 'high';
  }
  
  if (mediumEngagementTypes.includes(contentType)) {
    return 'medium';
  }
  
  return 'medium';
}