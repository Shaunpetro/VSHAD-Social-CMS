// apps/web/src/app/api/generate/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSocialContent } from '@/lib/ai/openai';
import { PostStatus, QueueStatus, PlatformType } from '@prisma/client';
import {
  generateContentPlan,
  generateTopicSuggestions,
  predictEngagement,
  type CompanyWithIntelligence,
  type PerformanceData,
  type IndustryBenchmarkData,
  type GenerationPeriod,
} from '@/lib/ai/intelligence-engine';
import {
  getContentTypePromptEnhancement,
} from '@/lib/ai/content-strategy';

/**
 * POST /api/generate/bulk
 * 
 * Generates multiple posts based on intelligent content plan.
 * 
 * Request body:
 * - companyId: string (required)
 * - platforms: string[] (required) - Platform types to generate for
 * - period: 'weekly' | 'biweekly' | 'monthly' (default: 'weekly')
 * - postCount: number (optional) - Override recommended post count
 * - topicMode: 'auto' | 'manual' (default: 'auto')
 * - manualTopics: string[] (optional) - Topics when mode is 'manual'
 * - tone: string (optional) - Override default tone
 */

interface BulkGenerateRequest {
  companyId: string;
  platforms: string[];
  period?: GenerationPeriod;
  postCount?: number;
  topicMode?: 'auto' | 'manual';
  manualTopics?: string[];
  tone?: string;
}

interface GenerationResult {
  postsGenerated: number;
  postsQueued: number;
  postsScheduled: number;
  contentMix: Record<string, number>;
  errors: string[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: BulkGenerateRequest = await request.json();
    const {
      companyId,
      platforms: requestedPlatforms,
      period = 'weekly',
      postCount,
      topicMode = 'auto',
      manualTopics = [],
      tone: overrideTone,
    } = body;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }
    if (!requestedPlatforms || requestedPlatforms.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one platform is required' }, { status: 400 });
    }

    console.log('[BulkGenerate] ========================================');
    console.log('[BulkGenerate] Starting bulk generation');
    console.log('[BulkGenerate] Company:', companyId);
    console.log('[BulkGenerate] Platforms:', requestedPlatforms.join(', '));
    console.log('[BulkGenerate] Period:', period);
    console.log('[BulkGenerate] Topic mode:', topicMode);

    // Fetch company with all related data
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        intelligence: {
          include: {
            contentPillars: {
              where: { isActive: true },
            },
          },
        },
        platforms: true,
      },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    if (!company.intelligence?.onboardingCompleted) {
      return NextResponse.json({ success: false, error: 'Company onboarding not completed' }, { status: 400 });
    }

    const intel = company.intelligence;

    // Filter to requested connected platforms
    const platforms = company.platforms.filter(
      p => p.isConnected && requestedPlatforms.map(rp => rp.toUpperCase()).includes(p.type)
    );

    if (platforms.length === 0) {
      return NextResponse.json({ success: false, error: 'No matching connected platforms' }, { status: 400 });
    }

    console.log('[BulkGenerate] Connected platforms:', platforms.map(p => p.type).join(', '));

    // Fetch performance data
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const publishedPosts = await prisma.generatedPost.findMany({
      where: {
        companyId,
        status: 'PUBLISHED',
        publishedAt: { gte: sixtyDaysAgo },
      },
      include: { platform: true },
      orderBy: { publishedAt: 'desc' },
    });

    const performanceData: PerformanceData | null = publishedPosts.length > 0
      ? {
          posts: publishedPosts.map(post => {
            const publishedAt = post.publishedAt || post.createdAt;
            const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][publishedAt.getDay()];
            const timeOfDay = `${publishedAt.getHours().toString().padStart(2, '0')}:00`;
            const totalEngagement = post.likes + post.comments + post.shares;
            const engagementRate = post.impressions > 0 ? (totalEngagement / post.impressions) * 100 : 0;

            return {
              id: post.id,
              contentType: post.contentType,
              pillar: post.pillar,
              topic: post.topic,
              tone: post.tone,
              hook: post.hook,
              platformType: post.platform.type,
              publishedAt,
              dayOfWeek,
              timeOfDay,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              impressions: post.impressions,
              engagementRate,
            };
          }),
        }
      : null;

    // Fetch industry benchmark
    let industryBenchmark: IndustryBenchmarkData | null = null;
    if (company.industry) {
      const benchmark = await prisma.industryBenchmark.findFirst({
        where: {
          industry: { contains: company.industry, mode: 'insensitive' },
        },
      });

      if (benchmark) {
        industryBenchmark = {
          recommendedPostsPerWeek: benchmark.recommendedPostsPerWeek,
          optimalPostsMin: benchmark.optimalPostsMin,
          optimalPostsMax: benchmark.optimalPostsMax,
          bestDays: benchmark.bestDays,
          bestTimes: benchmark.bestTimes as Record<string, string[]>,
          avgEngagementRate: benchmark.avgEngagementRate,
          contentMixRecommendation: benchmark.contentMixRecommendation as Record<string, number> | null,
          growthBenchmarks: benchmark.growthBenchmarks as Record<string, number> | null,
        };
      }
    }

    // Build company data for intelligence engine
    const companyData: CompanyWithIntelligence = {
      id: company.id,
      name: company.name,
      industry: company.industry,
      intelligence: {
        postsPerWeek: intel.postsPerWeek,
        preferredDays: intel.preferredDays,
        preferredTimes: intel.preferredTimes as Record<string, string[]> | null,
        primaryGoals: intel.primaryGoals,
        defaultTone: intel.defaultTone,
        autoApprove: intel.autoApprove,
        timezone: intel.timezone,
        intelligenceScore: intel.intelligenceScore,
        engagementTrend: intel.engagementTrend,
        avgEngagementRate: intel.avgEngagementRate,
        topPerformingTypes: intel.topPerformingTypes as Record<string, number> | null,
        topPerformingTopics: intel.topPerformingTopics as Record<string, number> | null,
        topicUsageHistory: intel.topicUsageHistory as Record<string, { lastUsed: string; count: number }> | null,
        contentTypePerformance: intel.contentTypePerformance as Record<string, any> | null,
        platformPerformance: intel.platformPerformance as Record<string, any> | null,
        learnedBestDays: intel.learnedBestDays,
        learnedBestTimes: intel.learnedBestTimes as Record<string, string[]> | null,
        learnedBestPillars: intel.learnedBestPillars as Record<string, number> | null,
        weeklyPostTarget: intel.weeklyPostTarget,
        lastIntelligenceUpdate: intel.lastIntelligenceUpdate,
        contentPillars: intel.contentPillars.map(pillar => ({
          id: pillar.id,
          name: pillar.name,
          topics: pillar.topics,
          contentTypes: pillar.contentTypes,
          frequencyWeight: pillar.frequencyWeight,
          avgEngagement: pillar.avgEngagement,
          lastUsed: pillar.lastUsed,
          performanceTrend: pillar.performanceTrend,
        })),
        uniqueSellingPoints: intel.uniqueSellingPoints,
        targetAudience: intel.targetAudience,
        brandPersonality: intel.brandPersonality,
      },
      platforms: platforms.map(p => ({
        id: p.id,
        type: p.type,
        name: p.name,
        isConnected: p.isConnected,
      })),
    };

    // Generate content plan
    const startDate = new Date();
    const daysUntilMonday = (8 - startDate.getDay()) % 7;
    if (daysUntilMonday > 0 && daysUntilMonday < 7) {
      startDate.setDate(startDate.getDate() + daysUntilMonday);
    }
    startDate.setHours(0, 0, 0, 0);

    const contentPlan = generateContentPlan(
      companyData,
      performanceData,
      industryBenchmark,
      period,
      startDate
    );

    // Determine actual post count
    const targetPostCount = postCount || contentPlan.volume.recommended;
    console.log('[BulkGenerate] Target post count:', targetPostCount);

    // Get slots, limited to target count
    const slots = contentPlan.schedule.slots.slice(0, targetPostCount);

    // If manual topics provided, distribute them across slots
    let topicQueue = [...manualTopics];

    // Initialize result tracking
    const result: GenerationResult = {
      postsGenerated: 0,
      postsQueued: 0,
      postsScheduled: 0,
      contentMix: {},
      errors: [],
    };

    // Generate content for each slot
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];

      try {
        // Find matching platform
        const platform = platforms.find(p => p.type === slot.platform);
        if (!platform) {
          // Fallback to first available platform
          const fallbackPlatform = platforms[i % platforms.length];
          if (!fallbackPlatform) {
            result.errors.push(`No platform available for slot ${i + 1}`);
            continue;
          }
        }
        const targetPlatform = platform || platforms[i % platforms.length];

        // Determine topic
        let topic: string | undefined;
        if (topicMode === 'manual' && topicQueue.length > 0) {
          topic = topicQueue.shift();
        } else if (topicMode === 'auto') {
          // Get AI-suggested topic
          const suggestions = generateTopicSuggestions(companyData, slot.contentType, 3);
          topic = suggestions[0]?.topic || slot.topic || undefined;
        }

        // Determine tone
        const tone = overrideTone || determineToneForSlot(
          slot.dayOfWeek,
          slot.contentType,
          intel.defaultTone,
          intel.dayToneSchedule as Record<string, string> | null,
          intel.humorEnabled,
          intel.humorDays
        );

        // Get content type context for AI
        const contentTypeContext = getContentTypePromptEnhancement(
          slot.contentType as any,
          slot.dayOfWeek,
          getFunnelStage(slot.contentType),
          intel.primaryGoals
        );

        // Map platform type for generation
        const platformTypeMap: Record<PlatformType, 'linkedin' | 'facebook' | 'twitter' | 'instagram' | 'wordpress'> = {
          LINKEDIN: 'linkedin',
          FACEBOOK: 'facebook',
          TWITTER: 'twitter',
          INSTAGRAM: 'instagram',
          WORDPRESS: 'wordpress',
        };

        console.log(`[BulkGenerate] Generating ${i + 1}/${slots.length}: ${slot.contentType} for ${targetPlatform.type}`);

        // Generate content
        const generated = await generateSocialContent({
          companyId: company.id,
          companyName: company.name,
          companyDescription: company.description || undefined,
          companyIndustry: company.industry || undefined,
          platform: platformTypeMap[targetPlatform.type],
          platformId: targetPlatform.id,
          topic,
          tone: tone as 'professional' | 'casual' | 'friendly' | 'authoritative',
          includeHashtags: true,
          includeEmojis: targetPlatform.type === 'INSTAGRAM' || targetPlatform.type === 'FACEBOOK',
          useAnalytics: true,
          contentTypeContext,
        });

        result.postsGenerated++;
        result.contentMix[slot.contentType] = (result.contentMix[slot.contentType] || 0) + 1;

        // Predict engagement for this post
        const prediction = predictEngagement(
          companyData,
          slot.contentType,
          slot.dayOfWeek,
          slot.time,
          topic || null,
          targetPlatform.type
        );

        // Find matching pillar
        const matchingPillar = findMatchingPillar(slot.contentType, intel.contentPillars);

        // Merge hashtags
        const finalHashtags = mergeHashtags(
          generated.hashtags,
          intel.industryHashtags,
          intel.brandedHashtags
        );

        // Extract hook
        const hook = extractHook(generated.content);

        if (intel.autoApprove) {
          // Create directly as scheduled post
          await prisma.generatedPost.create({
            data: {
              companyId: company.id,
              platformId: targetPlatform.id,
              content: generated.content,
              hashtags: finalHashtags,
              topic: topic || slot.topic || null,
              tone,
              pillar: matchingPillar?.name || null,
              contentType: slot.contentType,
              scheduledFor: new Date(slot.date),
              status: PostStatus.SCHEDULED,
              generatedBy: 'groq-llama-3.3-bulk',
              hook,
              isPartOfBulk: true,
            },
          });
          result.postsScheduled++;
          console.log(`[BulkGenerate] Scheduled: ${slot.contentType} for ${slot.date}`);
        } else {
          // Create as queue item for review
          await prisma.contentQueueItem.create({
            data: {
              companyId: company.id,
              platformId: targetPlatform.id,
              content: generated.content,
              hashtags: finalHashtags,
              keywords: intel.primaryKeywords,
              pillar: matchingPillar?.name || null,
              contentType: slot.contentType,
              tone,
              suggestedDate: new Date(slot.date),
              suggestedTime: slot.time,
              status: QueueStatus.PENDING,
              hook,
              engagementPrediction: prediction.level,
              predictedScore: prediction.score,
              generationContext: {
                contentType: slot.contentType,
                funnelStage: getFunnelStage(slot.contentType),
                dayPsychology: slot.reason,
                topic: topic || slot.topic,
                platform: targetPlatform.type,
                confidence: slot.confidence,
                predictionFactors: prediction.factors,
                generatedAt: new Date().toISOString(),
                bulkGeneration: true,
                periodType: period,
              },
            },
          });
          result.postsQueued++;
          console.log(`[BulkGenerate] Queued: ${slot.contentType} for review`);
        }

        // Update pillar usage
        if (matchingPillar) {
          await prisma.contentPillar.update({
            where: { id: matchingPillar.id },
            data: {
              totalPosts: { increment: 1 },
              lastUsed: new Date(),
            },
          });
        }

        // Update topic usage history
        if (topic) {
          const currentHistory = (intel.topicUsageHistory as Record<string, any>) || {};
          const topicKey = topic.toLowerCase();
          currentHistory[topicKey] = {
            lastUsed: new Date().toISOString(),
            count: (currentHistory[topicKey]?.count || 0) + 1,
          };

          await prisma.companyIntelligence.update({
            where: { id: intel.id },
            data: {
              topicUsageHistory: currentHistory,
            },
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (slotError) {
        const errorMsg = slotError instanceof Error ? slotError.message : 'Unknown error';
        result.errors.push(`Slot ${i + 1} (${slot.contentType}): ${errorMsg}`);
        console.error(`[BulkGenerate] Slot ${i + 1} error:`, errorMsg);
      }
    }

    const duration = Date.now() - startTime;

    console.log('[BulkGenerate] ========================================');
    console.log(`[BulkGenerate] Completed in ${duration}ms`);
    console.log(`[BulkGenerate] Generated: ${result.postsGenerated}`);
    console.log(`[BulkGenerate] Queued: ${result.postsQueued}`);
    console.log(`[BulkGenerate] Scheduled: ${result.postsScheduled}`);
    console.log(`[BulkGenerate] Errors: ${result.errors.length}`);
    console.log('[BulkGenerate] ========================================');

    return NextResponse.json({
      success: true,
      ...result,
      duration: `${duration}ms`,
      period,
      targetPostCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[BulkGenerate] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content',
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function determineToneForSlot(
  dayOfWeek: string,
  contentType: string,
  defaultTone: string,
  dayToneSchedule: Record<string, string> | null,
  humorEnabled: boolean,
  humorDays: string[]
): string {
  // Check day-specific tone schedule
  if (dayToneSchedule && dayToneSchedule[dayOfWeek.toLowerCase()]) {
    return dayToneSchedule[dayOfWeek.toLowerCase()];
  }

  // Content type specific tones
  const contentTypeTones: Record<string, string> = {
    behindTheScenes: 'casual',
    engagement: 'friendly',
    community: 'friendly',
    motivational: 'authoritative',
    promotional: 'professional',
  };

  if (contentTypeTones[contentType]) {
    return contentTypeTones[contentType];
  }

  // Check humor days
  if (humorEnabled && humorDays.includes(dayOfWeek.toLowerCase())) {
    const casualTypes = ['behindTheScenes', 'engagement', 'community'];
    if (casualTypes.includes(contentType)) {
      return 'casual';
    }
  }

  return defaultTone;
}

function getFunnelStage(contentType: string): string {
  const mapping: Record<string, string> = {
    educational: 'awareness',
    tips: 'awareness',
    news: 'awareness',
    motivational: 'awareness',
    engagement: 'interest',
    community: 'interest',
    behindTheScenes: 'interest',
    caseStudy: 'consideration',
    testimonial: 'consideration',
    socialProof: 'consideration',
    promotional: 'conversion',
  };
  return mapping[contentType] || 'awareness';
}

function findMatchingPillar(
  contentType: string,
  pillars: { id: string; name: string; contentTypes: string[] }[]
): { id: string; name: string } | null {
  // Find pillar that includes this content type
  const matching = pillars.find(p => p.contentTypes.includes(contentType));
  if (matching) {
    return { id: matching.id, name: matching.name };
  }

  // Fallback to first pillar
  if (pillars.length > 0) {
    return { id: pillars[0].id, name: pillars[0].name };
  }

  return null;
}

function mergeHashtags(
  generated: string[],
  industry: string[],
  branded: string[]
): string[] {
  const allHashtags = new Set<string>();

  // Add generated hashtags (priority)
  for (const tag of generated.slice(0, 5)) {
    allHashtags.add(tag.toLowerCase().replace(/^#/, ''));
  }

  // Add branded hashtags (always include)
  for (const tag of branded) {
    allHashtags.add(tag.toLowerCase().replace(/^#/, ''));
  }

  // Add industry hashtags
  for (const tag of industry.slice(0, 3)) {
    if (allHashtags.size < 10) {
      allHashtags.add(tag.toLowerCase().replace(/^#/, ''));
    }
  }

  return Array.from(allHashtags).slice(0, 10);
}

function extractHook(content: string): string {
  const firstLine = content.split('\n')[0];
  const firstSentence = content.split(/[.!?]/)[0];

  if (firstLine.length > 0 && firstLine.length <= firstSentence.length) {
    return firstLine.substring(0, 150);
  }

  return firstSentence.substring(0, 150);
}