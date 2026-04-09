// apps/web/src/app/api/cron/review/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PostStatus } from '@prisma/client';

/**
 * Enhanced Self-Review Cron Job
 * Runs weekly (Saturday 6 AM SAST) to analyze performance and update learnings
 * 
 * Features:
 * - Analyzes performance by day, time, content type, funnel stage, pillar, tone
 * - Updates CompanyIntelligence with learned patterns
 * - Updates ContentPillar engagement averages
 * - Identifies top-performing content patterns
 * - Provides actionable insights for next week's generation
 */

interface PerformanceMetrics {
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
}

interface DayPerformance extends PerformanceMetrics {
  day: string;
}

interface TimePerformance extends PerformanceMetrics {
  hour: number;
}

interface ContentTypePerformance extends PerformanceMetrics {
  contentType: string;
}

interface FunnelPerformance extends PerformanceMetrics {
  funnelStage: string;
}

interface PillarPerformance extends PerformanceMetrics {
  pillar: string;
}

interface TonePerformance extends PerformanceMetrics {
  tone: string;
}

interface ReviewResult {
  companyId: string;
  companyName: string;
  postsAnalyzed: number;
  avgEngagementRate: number;
  
  // Performance breakdowns
  bestDays: string[];
  bestTimes: Record<string, string[]>;
  bestContentTypes: Array<{ type: string; avgEngagement: number }>;
  bestFunnelStages: Array<{ stage: string; avgEngagement: number }>;
  bestPillars: Record<string, number>;
  bestTones: string[];
  
  // Insights
  topPerformingPost: {
    content: string;
    contentType: string | null;
    engagement: number;
  } | null;
  
  recommendations: string[];
  
  // Updates made
  pillarsUpdated: number;
  intelligenceUpdated: boolean;
  
  errors: string[];
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Funnel stage mapping based on content types
const CONTENT_TYPE_TO_FUNNEL: Record<string, string> = {
  educational: 'awareness',
  tips: 'awareness',
  news: 'awareness',
  motivational: 'awareness',
  engagement: 'interest',
  community: 'interest',
  behindTheScenes: 'interest',
  caseStudy: 'consideration',
  testimonial: 'consideration',
  promotional: 'conversion',
};

/**
 * Calculate engagement rate from post metrics
 */
function calculateEngagementRate(post: {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}): number {
  if (!post.impressions || post.impressions === 0) return 0;
  const engagements = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
  return (engagements / post.impressions) * 100;
}

/**
 * Group posts and calculate average engagement by a key
 */
function analyzeByKey<T extends string | number>(
  posts: Array<{
    key: T | null;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  }>,
  keyExtractor: (post: typeof posts[0]) => T | null
): Array<{ key: T; metrics: PerformanceMetrics }> {
  const groups: Record<string, { total: number; engagement: number; count: number }> = {};
  
  for (const post of posts) {
    const key = keyExtractor(post);
    if (key === null || key === undefined) continue;
    
    const keyStr = String(key);
    const engagementRate = calculateEngagementRate(post);
    
    if (!groups[keyStr]) {
      groups[keyStr] = { total: 0, engagement: 0, count: 0 };
    }
    
    groups[keyStr].total++;
    groups[keyStr].engagement += engagementRate;
    groups[keyStr].count++;
  }
  
  return Object.entries(groups)
    .map(([key, stats]) => ({
      key: key as unknown as T,
      metrics: {
        totalPosts: stats.total,
        totalEngagement: stats.engagement,
        avgEngagementRate: stats.count > 0 ? Math.round((stats.engagement / stats.count) * 100) / 100 : 0,
      },
    }))
    .sort((a, b) => b.metrics.avgEngagementRate - a.metrics.avgEngagementRate);
}

/**
 * Build best times by day structure from performance data
 */
function buildBestTimesByDay(
  dayPerformance: DayPerformance[],
  timePerformance: TimePerformance[]
): Record<string, string[]> {
  const bestTimesByDay: Record<string, string[]> = {};
  
  // Get top 3 performing days
  const topDays = dayPerformance.slice(0, 3).map(d => d.day);
  
  // Get top 4 performing hours
  const topHours = timePerformance
    .slice(0, 4)
    .map(t => `${t.hour.toString().padStart(2, '0')}:00`);
  
  // Assign top hours to top days
  for (const day of topDays) {
    bestTimesByDay[day] = topHours;
  }
  
  // Also assign to other days with fewer times
  for (const day of DAY_NAMES) {
    if (!bestTimesByDay[day]) {
      bestTimesByDay[day] = topHours.slice(0, 2);
    }
  }
  
  return bestTimesByDay;
}

/**
 * Generate recommendations based on performance analysis
 */
function generateRecommendations(
  dayPerformance: DayPerformance[],
  contentTypePerformance: ContentTypePerformance[],
  funnelPerformance: FunnelPerformance[],
  avgEngagement: number
): string[] {
  const recommendations: string[] = [];
  
  // Day recommendations
  if (dayPerformance.length >= 2) {
    const bestDay = dayPerformance[0];
    const worstDay = dayPerformance[dayPerformance.length - 1];
    
    if (bestDay.avgEngagementRate > worstDay.avgEngagementRate * 1.5) {
      recommendations.push(
        `Focus more posts on ${bestDay.day} (${bestDay.avgEngagementRate}% avg engagement) and reduce ${worstDay.day} (${worstDay.avgEngagementRate}%)`
      );
    }
  }
  
  // Content type recommendations
  if (contentTypePerformance.length >= 2) {
    const topTypes = contentTypePerformance.slice(0, 2);
    recommendations.push(
      `Top performing content types: ${topTypes.map(t => `${t.contentType} (${t.avgEngagementRate}%)`).join(', ')} - consider increasing frequency`
    );
    
    const lowTypes = contentTypePerformance.filter(t => t.avgEngagementRate < avgEngagement * 0.5);
    if (lowTypes.length > 0) {
      recommendations.push(
        `Consider reducing: ${lowTypes.map(t => t.contentType).join(', ')} - performing below average`
      );
    }
  }
  
  // Funnel balance recommendations
  if (funnelPerformance.length > 0) {
    const awarenessPerf = funnelPerformance.find(f => f.funnelStage === 'awareness');
    const conversionPerf = funnelPerformance.find(f => f.funnelStage === 'conversion');
    
    if (awarenessPerf && conversionPerf) {
      if (conversionPerf.avgEngagementRate > awarenessPerf.avgEngagementRate) {
        recommendations.push(
          `Your audience responds well to conversion content - your community is warmed up and ready for offers`
        );
      } else if (awarenessPerf.avgEngagementRate > conversionPerf.avgEngagementRate * 2) {
        recommendations.push(
          `Strong awareness engagement but low conversion - consider more case studies and testimonials to bridge the gap`
        );
      }
    }
  }
  
  // Engagement rate recommendations
  if (avgEngagement < 1) {
    recommendations.push(
      `Overall engagement is low (<1%) - focus on engagement and community content types to build interaction`
    );
  } else if (avgEngagement > 3) {
    recommendations.push(
      `Excellent engagement (>${avgEngagement.toFixed(1)}%) - your content strategy is working well, maintain consistency`
    );
  }
  
  return recommendations;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: ReviewResult[] = [];
  
  console.log('[Review] ========================================');
  console.log('[Review] Starting enhanced weekly performance review...');
  console.log('[Review] Time:', new Date().toISOString());
  
  try {
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    console.log(`[Review] Analyzing posts from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
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
            contentPillars: true,
          },
        },
      },
    });
    
    console.log(`[Review] Found ${companies.length} active companies`);
    
    for (const company of companies) {
      const result: ReviewResult = {
        companyId: company.id,
        companyName: company.name,
        postsAnalyzed: 0,
        avgEngagementRate: 0,
        bestDays: [],
        bestTimes: {},
        bestContentTypes: [],
        bestFunnelStages: [],
        bestPillars: {},
        bestTones: [],
        topPerformingPost: null,
        recommendations: [],
        pillarsUpdated: 0,
        intelligenceUpdated: false,
        errors: [],
      };
      
      try {
        const intel = company.intelligence;
        
        if (!intel) {
          result.errors.push('No intelligence data found');
          results.push(result);
          continue;
        }
        
        // Fetch published posts from last 7 days
        const posts = await prisma.generatedPost.findMany({
          where: {
            companyId: company.id,
            status: PostStatus.PUBLISHED,
            impressions: { gt: 0 },
            OR: [
              { publishedAt: { gte: startDate, lte: endDate } },
              { scheduledFor: { gte: startDate, lte: endDate } },
            ],
          },
          select: {
            id: true,
            content: true,
            pillar: true,
            contentType: true,
            tone: true,
            publishedAt: true,
            scheduledFor: true,
            likes: true,
            comments: true,
            shares: true,
            impressions: true,
          },
        });
        
        result.postsAnalyzed = posts.length;
        console.log(`[Review] ${company.name}: Found ${posts.length} posts to analyze`);
        
        if (posts.length === 0) {
          result.errors.push('No posts with engagement data found');
          results.push(result);
          continue;
        }
        
        // Calculate overall average engagement
        const totalEngagement = posts.reduce((sum, p) => sum + calculateEngagementRate(p), 0);
        result.avgEngagementRate = Math.round((totalEngagement / posts.length) * 100) / 100;
        
        // Prepare posts with extracted keys for analysis
        const postsWithKeys = posts.map(post => {
          const postDate = post.publishedAt || post.scheduledFor;
          return {
            ...post,
            dayOfWeek: postDate ? DAY_NAMES[new Date(postDate).getDay()] : null,
            hour: postDate ? new Date(postDate).getHours() : null,
            funnelStage: post.contentType ? CONTENT_TYPE_TO_FUNNEL[post.contentType] || 'awareness' : null,
          };
        });
        
        // Analyze by day
        const dayAnalysis = analyzeByKey(postsWithKeys, p => p.dayOfWeek);
        const dayPerformance: DayPerformance[] = dayAnalysis.map(d => ({
          day: d.key as string,
          ...d.metrics,
        }));
        result.bestDays = dayPerformance.slice(0, 3).map(d => d.day);
        
        // Analyze by hour
        const timeAnalysis = analyzeByKey(postsWithKeys, p => p.hour);
        const timePerformance: TimePerformance[] = timeAnalysis.map(t => ({
          hour: Number(t.key),
          ...t.metrics,
        }));
        result.bestTimes = buildBestTimesByDay(dayPerformance, timePerformance);
        
        // Analyze by content type
        const contentTypeAnalysis = analyzeByKey(postsWithKeys, p => p.contentType);
        const contentTypePerformance: ContentTypePerformance[] = contentTypeAnalysis.map(c => ({
          contentType: c.key as string,
          ...c.metrics,
        }));
        result.bestContentTypes = contentTypePerformance.slice(0, 5).map(c => ({
          type: c.contentType,
          avgEngagement: c.avgEngagementRate,
        }));
        
        // Analyze by funnel stage
        const funnelAnalysis = analyzeByKey(postsWithKeys, p => p.funnelStage);
        const funnelPerformance: FunnelPerformance[] = funnelAnalysis.map(f => ({
          funnelStage: f.key as string,
          ...f.metrics,
        }));
        result.bestFunnelStages = funnelPerformance.map(f => ({
          stage: f.funnelStage,
          avgEngagement: f.avgEngagementRate,
        }));
        
        // Analyze by pillar
        const pillarAnalysis = analyzeByKey(postsWithKeys, p => p.pillar);
        const pillarPerformance: PillarPerformance[] = pillarAnalysis.map(p => ({
          pillar: p.key as string,
          ...p.metrics,
        }));
        result.bestPillars = Object.fromEntries(
          pillarPerformance.map(p => [p.pillar, p.avgEngagementRate])
        );
        
        // Analyze by tone
        const toneAnalysis = analyzeByKey(postsWithKeys, p => p.tone);
        const tonePerformance: TonePerformance[] = toneAnalysis.map(t => ({
          tone: t.key as string,
          ...t.metrics,
        }));
        result.bestTones = tonePerformance.slice(0, 2).map(t => t.tone);
        
        // Find top performing post
        const sortedByEngagement = [...postsWithKeys].sort(
          (a, b) => calculateEngagementRate(b) - calculateEngagementRate(a)
        );
        
        if (sortedByEngagement.length > 0) {
          const topPost = sortedByEngagement[0];
          result.topPerformingPost = {
            content: topPost.content.substring(0, 200) + (topPost.content.length > 200 ? '...' : ''),
            contentType: topPost.contentType,
            engagement: Math.round(calculateEngagementRate(topPost) * 100) / 100,
          };
        }
        
        // Generate recommendations
        result.recommendations = generateRecommendations(
          dayPerformance,
          contentTypePerformance,
          funnelPerformance,
          result.avgEngagementRate
        );
        
        console.log(`[Review] ${company.name}: Best days: ${result.bestDays.join(', ')}`);
        console.log(`[Review] ${company.name}: Best content types: ${result.bestContentTypes.map(c => c.type).join(', ')}`);
        console.log(`[Review] ${company.name}: Avg engagement: ${result.avgEngagementRate}%`);
        
        // Build learned best pillars with content type performance
        const learnedBestPillars: Record<string, number | Record<string, number>> = {
          ...result.bestPillars,
          _contentTypes: Object.fromEntries(
            contentTypePerformance.map(c => [c.contentType, c.avgEngagementRate])
          ),
          _funnelStages: Object.fromEntries(
            funnelPerformance.map(f => [f.funnelStage, f.avgEngagementRate])
          ),
        };
        
        // Update CompanyIntelligence with learned patterns
        await prisma.companyIntelligence.update({
          where: { id: intel.id },
          data: {
            learnedBestDays: result.bestDays,
            learnedBestTimes: result.bestTimes,
            learnedBestPillars: learnedBestPillars,
            lastResearchSync: new Date(),
          },
        });
        
        result.intelligenceUpdated = true;
        console.log(`[Review] ${company.name}: Updated intelligence with learned patterns`);
        
        // Update individual pillar engagement averages
        for (const pillarPerf of pillarPerformance) {
          const pillar = intel.contentPillars.find(p => p.name === pillarPerf.pillar);
          if (pillar) {
            await prisma.contentPillar.update({
              where: { id: pillar.id },
              data: {
                avgEngagement: pillarPerf.avgEngagementRate,
              },
            });
            result.pillarsUpdated++;
          }
        }
        
        console.log(`[Review] ${company.name}: Updated ${result.pillarsUpdated} pillar engagement rates`);
        
      } catch (companyError) {
        const errorMsg = companyError instanceof Error ? companyError.message : 'Unknown error';
        result.errors.push(`Review failed: ${errorMsg}`);
        console.error(`[Review] ❌ Company error for ${company.name}:`, errorMsg);
      }
      
      results.push(result);
    }
    
    const duration = Date.now() - startTime;
    
    // Calculate totals
    const totals = {
      companiesReviewed: results.length,
      totalPostsAnalyzed: results.reduce((sum, r) => sum + r.postsAnalyzed, 0),
      avgEngagementRate: results.length > 0
        ? Math.round((results.reduce((sum, r) => sum + r.avgEngagementRate, 0) / results.filter(r => r.postsAnalyzed > 0).length) * 100) / 100
        : 0,
      intelligenceUpdates: results.filter(r => r.intelligenceUpdated).length,
      pillarsUpdated: results.reduce((sum, r) => sum + r.pillarsUpdated, 0),
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
    };
    
    // Aggregate best content types across all companies
    const aggregateContentTypes: Record<string, { count: number; totalEngagement: number }> = {};
    for (const r of results) {
      for (const ct of r.bestContentTypes) {
        if (!aggregateContentTypes[ct.type]) {
          aggregateContentTypes[ct.type] = { count: 0, totalEngagement: 0 };
        }
        aggregateContentTypes[ct.type].count++;
        aggregateContentTypes[ct.type].totalEngagement += ct.avgEngagement;
      }
    }
    
    const topContentTypesOverall = Object.entries(aggregateContentTypes)
      .map(([type, stats]) => ({
        type,
        avgEngagement: Math.round((stats.totalEngagement / stats.count) * 100) / 100,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);
    
    console.log('[Review] ========================================');
    console.log(`[Review] Completed in ${duration}ms`);
    console.log(`[Review] Companies: ${totals.companiesReviewed}, Posts: ${totals.totalPostsAnalyzed}`);
    console.log(`[Review] Avg Engagement: ${totals.avgEngagementRate}%`);
    console.log(`[Review] Top Content Types:`, topContentTypesOverall);
    console.log('[Review] ========================================');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        ...totals,
        topContentTypesOverall,
      },
      companies: results,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Review] Fatal error:', error);
    
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