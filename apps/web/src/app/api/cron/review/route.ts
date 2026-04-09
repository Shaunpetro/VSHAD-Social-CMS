// apps/web/src/app/api/cron/review/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PostStatus } from '@prisma/client';

/**
 * Self-Review Cron Job
 * Runs weekly (Saturday 6 AM) to analyze past week's performance and update learnings
 * 
 * Flow:
 * 1. For each company with onboardingCompleted=true
 * 2. Fetch last 7 days of published posts with engagement data
 * 3. Calculate performance by day, time, pillar, tone
 * 4. Update CompanyIntelligence with learned patterns:
 *    - learnedBestDays
 *    - learnedBestTimes
 *    - learnedBestPillars
 * 5. Update ContentPillar.avgEngagement for each pillar
 * 6. These learnings are automatically used by generateSocialContent() next week
 */

interface DayPerformance {
  day: string;
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
}

interface TimePerformance {
  hour: number;
  totalPosts: number;
  avgEngagementRate: number;
}

interface PillarPerformance {
  pillar: string;
  totalPosts: number;
  avgEngagementRate: number;
}

interface TonePerformance {
  tone: string;
  totalPosts: number;
  avgEngagementRate: number;
}

interface ReviewResult {
  companyId: string;
  companyName: string;
  postsAnalyzed: number;
  avgEngagementRate: number;
  bestDays: string[];
  bestTimes: Record<string, string[]>;
  bestPillars: Record<string, number>;
  bestTones: string[];
  pillarsUpdated: number;
  errors: string[];
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
 * Analyze performance by day of week
 */
function analyzeByDay(posts: Array<{
  publishedAt: Date | null;
  scheduledFor: Date | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}>): DayPerformance[] {
  const dayStats: Record<string, { total: number; engagement: number; count: number }> = {};
  
  for (const post of posts) {
    const postDate = post.publishedAt || post.scheduledFor;
    if (!postDate) continue;
    
    const dayName = DAY_NAMES[new Date(postDate).getDay()];
    const engagementRate = calculateEngagementRate(post);
    
    if (!dayStats[dayName]) {
      dayStats[dayName] = { total: 0, engagement: 0, count: 0 };
    }
    
    dayStats[dayName].total++;
    dayStats[dayName].engagement += engagementRate;
    dayStats[dayName].count++;
  }
  
  return Object.entries(dayStats)
    .map(([day, stats]) => ({
      day,
      totalPosts: stats.total,
      totalEngagement: stats.engagement,
      avgEngagementRate: stats.count > 0 ? stats.engagement / stats.count : 0,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Analyze performance by hour of day
 */
function analyzeByTime(posts: Array<{
  publishedAt: Date | null;
  scheduledFor: Date | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}>): TimePerformance[] {
  const timeStats: Record<number, { total: number; engagement: number }> = {};
  
  for (const post of posts) {
    const postDate = post.publishedAt || post.scheduledFor;
    if (!postDate) continue;
    
    const hour = new Date(postDate).getHours();
    const engagementRate = calculateEngagementRate(post);
    
    if (!timeStats[hour]) {
      timeStats[hour] = { total: 0, engagement: 0 };
    }
    
    timeStats[hour].total++;
    timeStats[hour].engagement += engagementRate;
  }
  
  return Object.entries(timeStats)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      totalPosts: stats.total,
      avgEngagementRate: stats.total > 0 ? stats.engagement / stats.total : 0,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Analyze performance by content pillar
 */
function analyzeByPillar(posts: Array<{
  pillar: string | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}>): PillarPerformance[] {
  const pillarStats: Record<string, { total: number; engagement: number }> = {};
  
  for (const post of posts) {
    if (!post.pillar) continue;
    
    const engagementRate = calculateEngagementRate(post);
    
    if (!pillarStats[post.pillar]) {
      pillarStats[post.pillar] = { total: 0, engagement: 0 };
    }
    
    pillarStats[post.pillar].total++;
    pillarStats[post.pillar].engagement += engagementRate;
  }
  
  return Object.entries(pillarStats)
    .map(([pillar, stats]) => ({
      pillar,
      totalPosts: stats.total,
      avgEngagementRate: stats.total > 0 ? stats.engagement / stats.total : 0,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Analyze performance by tone
 */
function analyzeByTone(posts: Array<{
  tone: string | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}>): TonePerformance[] {
  const toneStats: Record<string, { total: number; engagement: number }> = {};
  
  for (const post of posts) {
    if (!post.tone) continue;
    
    const engagementRate = calculateEngagementRate(post);
    
    if (!toneStats[post.tone]) {
      toneStats[post.tone] = { total: 0, engagement: 0 };
    }
    
    toneStats[post.tone].total++;
    toneStats[post.tone].engagement += engagementRate;
  }
  
  return Object.entries(toneStats)
    .map(([tone, stats]) => ({
      tone,
      totalPosts: stats.total,
      avgEngagementRate: stats.total > 0 ? stats.engagement / stats.total : 0,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Convert hour to time string
 */
function hourToTimeString(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * Build best times by day structure
 */
function buildBestTimesByDay(
  dayPerformance: DayPerformance[],
  timePerformance: TimePerformance[]
): Record<string, string[]> {
  const bestTimesByDay: Record<string, string[]> = {};
  
  // Get top 3 best performing days
  const topDays = dayPerformance.slice(0, 3).map(d => d.day);
  
  // Get top 3 best performing hours
  const topHours = timePerformance.slice(0, 3).map(t => hourToTimeString(t.hour));
  
  // Assign best times to best days
  for (const day of topDays) {
    bestTimesByDay[day] = topHours;
  }
  
  return bestTimesByDay;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: ReviewResult[] = [];
  
  console.log('[Review] ========================================');
  console.log('[Review] Starting weekly performance review...');
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
        bestPillars: {},
        bestTones: [],
        pillarsUpdated: 0,
        errors: [],
      };
      
      try {
        const intel = company.intelligence;
        
        if (!intel) {
          result.errors.push('No intelligence data found');
          results.push(result);
          continue;
        }
        
        // Fetch published posts from last 7 days with impressions > 0
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
            pillar: true,
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
        
        // Analyze by different dimensions
        const dayPerformance = analyzeByDay(posts);
        const timePerformance = analyzeByTime(posts);
        const pillarPerformance = analyzeByPillar(posts);
        const tonePerformance = analyzeByTone(posts);
        
        // Extract best performers
        result.bestDays = dayPerformance.slice(0, 3).map(d => d.day);
        result.bestTimes = buildBestTimesByDay(dayPerformance, timePerformance);
        result.bestPillars = Object.fromEntries(
          pillarPerformance.map(p => [p.pillar, Math.round(p.avgEngagementRate * 100) / 100])
        );
        result.bestTones = tonePerformance.slice(0, 2).map(t => t.tone);
        
        console.log(`[Review] ${company.name}: Best days: ${result.bestDays.join(', ')}`);
        console.log(`[Review] ${company.name}: Avg engagement: ${result.avgEngagementRate}%`);
        
        // Update CompanyIntelligence with learned patterns
        await prisma.companyIntelligence.update({
          where: { id: intel.id },
          data: {
            learnedBestDays: result.bestDays,
            learnedBestTimes: result.bestTimes,
            learnedBestPillars: result.bestPillars,
            lastResearchSync: new Date(),
          },
        });
        
        console.log(`[Review] ${company.name}: Updated intelligence with learned patterns`);
        
        // Update individual pillar engagement averages
        for (const pillarPerf of pillarPerformance) {
          const pillar = intel.contentPillars.find(p => p.name === pillarPerf.pillar);
          if (pillar) {
            await prisma.contentPillar.update({
              where: { id: pillar.id },
              data: {
                avgEngagement: Math.round(pillarPerf.avgEngagementRate * 100) / 100,
              },
            });
            result.pillarsUpdated++;
          }
        }
        
        console.log(`[Review] ${company.name}: Updated ${result.pillarsUpdated} pillar engagement rates`);
        
      } catch (companyError) {
        const errorMsg = companyError instanceof Error ? companyError.message : 'Unknown error';
        result.errors.push(`Review failed: ${errorMsg}`);
        console.error(`[Review] Company error for ${company.name}:`, errorMsg);
      }
      
      results.push(result);
    }
    
    const duration = Date.now() - startTime;
    
    // Calculate totals
    const totals = {
      companiesReviewed: results.length,
      totalPostsAnalyzed: results.reduce((sum, r) => sum + r.postsAnalyzed, 0),
      avgEngagementRate: results.length > 0
        ? Math.round((results.reduce((sum, r) => sum + r.avgEngagementRate, 0) / results.length) * 100) / 100
        : 0,
      pillarsUpdated: results.reduce((sum, r) => sum + r.pillarsUpdated, 0),
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
    };
    
    console.log('[Review] ========================================');
    console.log(`[Review] Completed in ${duration}ms`);
    console.log(`[Review] Companies: ${totals.companiesReviewed}, Posts: ${totals.totalPostsAnalyzed}, Avg Eng: ${totals.avgEngagementRate}%`);
    console.log('[Review] ========================================');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: totals,
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