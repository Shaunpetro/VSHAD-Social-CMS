// apps/web/src/lib/ai/analytics-insights.ts
/**
 * Analytics Insights Service
 * Extracts performance patterns from past posts to inform AI content generation.
 */

import { prisma } from "@/lib/db";

export interface PerformanceInsights {
  hasData: boolean;
  totalPostsAnalyzed: number;
  avgEngagementRate: number;
  topPerformingTopics: Array<{ topic: string; avgEngagement: number; postCount: number }>;
  bestPerformingTones: Array<{ tone: string; avgEngagement: number; postCount: number }>;
  optimalContentLength: { min: number; max: number; avg: number };
  bestHashtagCount: { min: number; max: number; avg: number };
  bestPostingTimes: Array<{ hour: number; dayOfWeek: number; avgEngagement: number }>;
  topHashtags: string[];
  recentTopPosts: Array<{
    id: string;
    content: string;
    topic: string | null;
    tone: string | null;
    engagementRate: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
}

export interface InsightRequestParams {
  companyId: string;
  platformId?: string;
  platformType?: string;
  days?: number;
  minImpressions?: number;
}

/**
 * Calculate engagement rate from metrics
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
 * Extract hour and day of week from a date
 */
function getTimingInfo(date: Date): { hour: number; dayOfWeek: number } {
  return {
    hour: date.getHours(),
    dayOfWeek: date.getDay(), // 0 = Sunday, 6 = Saturday
  };
}

/**
 * Group and average by a key
 */
function groupAndAverage<T>(
  items: T[],
  keyFn: (item: T) => string | null,
  valueFn: (item: T) => number
): Array<{ key: string; avg: number; count: number }> {
  const groups: Record<string, { total: number; count: number }> = {};

  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;

    if (!groups[key]) {
      groups[key] = { total: 0, count: 0 };
    }
    groups[key].total += valueFn(item);
    groups[key].count += 1;
  }

  return Object.entries(groups)
    .map(([key, { total, count }]) => ({
      key,
      avg: count > 0 ? total / count : 0,
      count,
    }))
    .sort((a, b) => b.avg - a.avg);
}

/**
 * Fetch performance insights for a company/platform
 */
export async function getPerformanceInsights(
  params: InsightRequestParams
): Promise<PerformanceInsights> {
  const {
    companyId,
    platformId,
    platformType,
    days = 90,
    minImpressions = 10,
  } = params;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Build where clause
  const where: Record<string, unknown> = {
    companyId,
    impressions: { gte: minImpressions },
    OR: [
      { publishedAt: { gte: cutoffDate } },
      { scheduledFor: { gte: cutoffDate } },
      { createdAt: { gte: cutoffDate } },
    ],
  };

  if (platformId) {
    where.platformId = platformId;
  }

  // Fetch posts with metrics
  const posts = await prisma.generatedPost.findMany({
    where,
    include: {
      platform: {
        select: {
          id: true,
          type: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by platform type if specified (after fetch, since type is on relation)
  const filteredPosts = platformType
    ? posts.filter((p) => p.platform?.type === platformType)
    : posts;

  if (filteredPosts.length === 0) {
    return {
      hasData: false,
      totalPostsAnalyzed: 0,
      avgEngagementRate: 0,
      topPerformingTopics: [],
      bestPerformingTones: [],
      optimalContentLength: { min: 0, max: 0, avg: 0 },
      bestHashtagCount: { min: 0, max: 0, avg: 0 },
      bestPostingTimes: [],
      topHashtags: [],
      recentTopPosts: [],
    };
  }

  // Calculate engagement rates
  const postsWithEngagement = filteredPosts.map((post) => ({
    ...post,
    engagementRate: calculateEngagementRate(post),
  }));

  // Average engagement rate
  const totalEngagement = postsWithEngagement.reduce((sum, p) => sum + p.engagementRate, 0);
  const avgEngagementRate = totalEngagement / postsWithEngagement.length;

  // Top performing topics
  const topicGroups = groupAndAverage(
    postsWithEngagement,
    (p) => p.topic,
    (p) => p.engagementRate
  );
  const topPerformingTopics = topicGroups.slice(0, 5).map((g) => ({
    topic: g.key,
    avgEngagement: Math.round(g.avg * 100) / 100,
    postCount: g.count,
  }));

  // Best performing tones
  const toneGroups = groupAndAverage(
    postsWithEngagement,
    (p) => p.tone,
    (p) => p.engagementRate
  );
  const bestPerformingTones = toneGroups.slice(0, 4).map((g) => ({
    tone: g.key,
    avgEngagement: Math.round(g.avg * 100) / 100,
    postCount: g.count,
  }));

  // Content length analysis (top 25% by engagement)
  const sortedByEngagement = [...postsWithEngagement].sort(
    (a, b) => b.engagementRate - a.engagementRate
  );
  const topQuartile = sortedByEngagement.slice(
    0,
    Math.max(1, Math.ceil(sortedByEngagement.length * 0.25))
  );
  const lengths = topQuartile.map((p) => p.content.length);
  const optimalContentLength = {
    min: Math.min(...lengths),
    max: Math.max(...lengths),
    avg: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
  };

  // Hashtag count analysis (top 25%)
  const hashtagCounts = topQuartile.map((p) => p.hashtags?.length || 0);
  const bestHashtagCount = {
    min: Math.min(...hashtagCounts),
    max: Math.max(...hashtagCounts),
    avg: Math.round(hashtagCounts.reduce((a, b) => a + b, 0) / hashtagCounts.length),
  };

  // Best posting times (top 25%)
  const timingMap: Record<string, { total: number; count: number }> = {};
  for (const post of topQuartile) {
    const postDate = post.publishedAt || post.scheduledFor;
    if (!postDate) continue;

    const { hour, dayOfWeek } = getTimingInfo(new Date(postDate));
    const key = `${dayOfWeek}-${hour}`;

    if (!timingMap[key]) {
      timingMap[key] = { total: 0, count: 0 };
    }
    timingMap[key].total += post.engagementRate;
    timingMap[key].count += 1;
  }

  const bestPostingTimes = Object.entries(timingMap)
    .map(([key, { total, count }]) => {
      const [dayOfWeek, hour] = key.split("-").map(Number);
      return {
        hour,
        dayOfWeek,
        avgEngagement: Math.round((total / count) * 100) / 100,
      };
    })
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 5);

  // Top hashtags from high-performing posts
  const hashtagFrequency: Record<string, number> = {};
  for (const post of topQuartile) {
    for (const tag of post.hashtags || []) {
      const normalized = tag.toLowerCase().replace(/^#/, "");
      hashtagFrequency[normalized] = (hashtagFrequency[normalized] || 0) + 1;
    }
  }
  const topHashtags = Object.entries(hashtagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // Recent top posts (for examples in prompt)
  const recentTopPosts = sortedByEngagement.slice(0, 3).map((p) => ({
    id: p.id,
    content: p.content.substring(0, 500), // Truncate for prompt size
    topic: p.topic,
    tone: p.tone,
    engagementRate: Math.round(p.engagementRate * 100) / 100,
    impressions: p.impressions,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
  }));

  return {
    hasData: true,
    totalPostsAnalyzed: filteredPosts.length,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    topPerformingTopics,
    bestPerformingTones,
    optimalContentLength,
    bestHashtagCount,
    bestPostingTimes,
    topHashtags,
    recentTopPosts,
  };
}

/**
 * Format insights into a prompt-friendly string
 */
export function formatInsightsForPrompt(insights: PerformanceInsights): string {
  if (!insights.hasData) {
    return "";
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let prompt = `\n**PERFORMANCE INSIGHTS** (based on ${insights.totalPostsAnalyzed} analyzed posts):\n`;

  // Average engagement
  prompt += `- Average engagement rate: ${insights.avgEngagementRate}%\n`;

  // Top topics
  if (insights.topPerformingTopics.length > 0) {
    const topics = insights.topPerformingTopics
      .map((t) => `"${t.topic}" (${t.avgEngagement}% eng.)`)
      .join(", ");
    prompt += `- Top performing topics: ${topics}\n`;
  }

  // Best tones
  if (insights.bestPerformingTones.length > 0) {
    const tones = insights.bestPerformingTones
      .map((t) => `${t.tone} (${t.avgEngagement}% eng.)`)
      .join(", ");
    prompt += `- Best performing tones: ${tones}\n`;
  }

  // Content length
  if (insights.optimalContentLength.avg > 0) {
    prompt += `- Optimal content length: ${insights.optimalContentLength.min}-${insights.optimalContentLength.max} characters (avg: ${insights.optimalContentLength.avg})\n`;
  }

  // Hashtag count
  if (insights.bestHashtagCount.avg > 0) {
    prompt += `- Optimal hashtag count: ${insights.bestHashtagCount.min}-${insights.bestHashtagCount.max} (avg: ${insights.bestHashtagCount.avg})\n`;
  }

  // Best posting times
  if (insights.bestPostingTimes.length > 0) {
    const times = insights.bestPostingTimes
      .slice(0, 3)
      .map((t) => `${dayNames[t.dayOfWeek]} ${t.hour}:00`)
      .join(", ");
    prompt += `- Best posting times: ${times}\n`;
  }

  // Top hashtags
  if (insights.topHashtags.length > 0) {
    prompt += `- High-performing hashtags: #${insights.topHashtags.slice(0, 5).join(", #")}\n`;
  }

  // Example of top post
  if (insights.recentTopPosts.length > 0) {
    const topPost = insights.recentTopPosts[0];
    prompt += `\n**TOP PERFORMING POST EXAMPLE** (${topPost.engagementRate}% engagement, ${topPost.impressions} impressions):\n`;
    prompt += `Topic: ${topPost.topic || "General"} | Tone: ${topPost.tone || "Professional"}\n`;
    prompt += `"${topPost.content.substring(0, 300)}${topPost.content.length > 300 ? "..." : ""}"\n`;
  }

  prompt += `\n**RECOMMENDATION**: Learn from these patterns to create content that resonates with this audience.\n`;

  return prompt;
}