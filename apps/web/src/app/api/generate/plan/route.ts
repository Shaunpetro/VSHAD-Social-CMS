// apps/web/src/app/api/generate/plan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateContentPlan,
  type CompanyWithIntelligence,
  type PerformanceData,
  type IndustryBenchmarkData,
  type GenerationPeriod,
} from '@/lib/ai/intelligence-engine';

/**
 * GET /api/generate/plan
 * 
 * Generates an intelligent content plan based on company data,
 * performance history, and industry benchmarks.
 * 
 * Query params:
 * - companyId: string (required)
 * - period: 'weekly' | 'biweekly' | 'monthly' (default: 'weekly')
 * - platforms: comma-separated platform types (optional, uses all connected if not provided)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const period = (searchParams.get('period') || 'weekly') as GenerationPeriod;
    const platformsParam = searchParams.get('platforms');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Fetch company with intelligence data
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
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (!company.intelligence?.onboardingCompleted) {
      return NextResponse.json(
        { error: 'Company onboarding not completed' },
        { status: 400 }
      );
    }

    // Filter platforms if specified
    let platforms = company.platforms.filter(p => p.isConnected);
    if (platformsParam) {
      const requestedPlatforms = platformsParam.split(',').map(p => p.trim().toUpperCase());
      platforms = platforms.filter(p => requestedPlatforms.includes(p.type));
    }

    if (platforms.length === 0) {
      return NextResponse.json(
        { error: 'No connected platforms available' },
        { status: 400 }
      );
    }

    // Fetch performance data (last 60 days of published posts)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const publishedPosts = await prisma.generatedPost.findMany({
      where: {
        companyId,
        status: 'PUBLISHED',
        publishedAt: {
          gte: sixtyDaysAgo,
        },
      },
      include: {
        platform: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Transform posts to performance data
    const performanceData: PerformanceData | null = publishedPosts.length > 0
      ? {
          posts: publishedPosts.map(post => {
            const publishedAt = post.publishedAt || post.createdAt;
            const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][publishedAt.getDay()];
            const timeOfDay = `${publishedAt.getHours().toString().padStart(2, '0')}:00`;
            const totalEngagement = post.likes + post.comments + post.shares;
            const engagementRate = post.impressions > 0 
              ? (totalEngagement / post.impressions) * 100 
              : 0;

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
          industry: {
            contains: company.industry,
            mode: 'insensitive',
          },
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

    // Transform company data for intelligence engine
    const companyData: CompanyWithIntelligence = {
      id: company.id,
      name: company.name,
      industry: company.industry,
      intelligence: company.intelligence ? {
        postsPerWeek: company.intelligence.postsPerWeek,
        preferredDays: company.intelligence.preferredDays,
        preferredTimes: company.intelligence.preferredTimes as Record<string, string[]> | null,
        primaryGoals: company.intelligence.primaryGoals,
        defaultTone: company.intelligence.defaultTone,
        autoApprove: company.intelligence.autoApprove,
        timezone: company.intelligence.timezone,
        intelligenceScore: company.intelligence.intelligenceScore,
        engagementTrend: company.intelligence.engagementTrend,
        avgEngagementRate: company.intelligence.avgEngagementRate,
        topPerformingTypes: company.intelligence.topPerformingTypes as Record<string, number> | null,
        topPerformingTopics: company.intelligence.topPerformingTopics as Record<string, number> | null,
        topicUsageHistory: company.intelligence.topicUsageHistory as Record<string, { lastUsed: string; count: number }> | null,
        contentTypePerformance: company.intelligence.contentTypePerformance as Record<string, any> | null,
        platformPerformance: company.intelligence.platformPerformance as Record<string, any> | null,
        learnedBestDays: company.intelligence.learnedBestDays,
        learnedBestTimes: company.intelligence.learnedBestTimes as Record<string, string[]> | null,
        learnedBestPillars: company.intelligence.learnedBestPillars as Record<string, number> | null,
        weeklyPostTarget: company.intelligence.weeklyPostTarget,
        lastIntelligenceUpdate: company.intelligence.lastIntelligenceUpdate,
        contentPillars: company.intelligence.contentPillars.map(pillar => ({
          id: pillar.id,
          name: pillar.name,
          topics: pillar.topics,
          contentTypes: pillar.contentTypes,
          frequencyWeight: pillar.frequencyWeight,
          avgEngagement: pillar.avgEngagement,
          lastUsed: pillar.lastUsed,
          performanceTrend: pillar.performanceTrend,
        })),
        uniqueSellingPoints: company.intelligence.uniqueSellingPoints,
        targetAudience: company.intelligence.targetAudience,
        brandPersonality: company.intelligence.brandPersonality,
      } : null,
      platforms: platforms.map(p => ({
        id: p.id,
        type: p.type,
        name: p.name,
        isConnected: p.isConnected,
      })),
    };

    // Generate content plan
    const startDate = new Date();
    // Start from next Monday if today is not Monday
    const daysUntilMonday = (8 - startDate.getDay()) % 7;
    if (daysUntilMonday > 0) {
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

    // Convert dates to strings for JSON response
    const response = {
      ...contentPlan,
      startDate: contentPlan.startDate.toISOString(),
      endDate: contentPlan.endDate.toISOString(),
      schedule: {
        ...contentPlan.schedule,
        slots: contentPlan.schedule.slots.map(slot => ({
          ...slot,
          date: slot.date.toISOString(),
        })),
      },
      intelligenceHealth: {
        ...contentPlan.intelligenceHealth,
        dataAge: {
          ...contentPlan.intelligenceHealth.dataAge,
          lastPost: contentPlan.intelligenceHealth.dataAge.lastPost?.toISOString() || null,
          lastAnalysis: contentPlan.intelligenceHealth.dataAge.lastAnalysis?.toISOString() || null,
        },
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[ContentPlan] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content plan' },
      { status: 500 }
    );
  }
}