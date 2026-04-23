// apps/web/src/lib/ai/analytics-insights.ts
/**
 * Analytics Insights Service
 * Extracts performance patterns from past posts to inform AI content generation.
 * 
 * UPDATED: Added comprehensive fallback system for cold start scenarios
 */

import { prisma } from "@/lib/db";

export interface PerformanceInsights {
  hasData: boolean;
  dataSource: 'performance' | 'intelligence' | 'industry' | 'defaults';
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
  contentPillars: Array<{ name: string; topics: string[] }>;
  suggestedContentTypes: string[];
  brandGuidance: {
    personality: string[];
    tone: string;
    goals: string[];
    targetAudience: string | null;
    uniqueSellingPoints: string[];
  } | null;
  industryGuidance: {
    industry: string;
    bestDays: string[];
    bestTimes: Record<string, string[]>;
    avgEngagementRate: number | null;
    suggestedThemes: string[];
  } | null;
}

export interface InsightRequestParams {
  companyId: string;
  platformId?: string;
  platformType?: string;
  days?: number;
  minImpressions?: number;
}

// ============================================
// PROVEN DEFAULTS (Research-backed)
// ============================================

const PROVEN_DEFAULTS = {
  bestDays: ['tuesday', 'wednesday', 'thursday'],
  bestTimes: {
    linkedin: ['09:00', '12:00', '17:00'],
    facebook: ['09:00', '13:00', '16:00'],
    twitter: ['09:00', '12:00', '17:00'],
    instagram: ['11:00', '14:00', '19:00'],
    default: ['09:00', '12:00', '17:00'],
  } as Record<string, string[]>,
  contentMix: {
    educational: 40,
    engagement: 30,
    socialProof: 20,
    promotional: 10,
  },
  optimalContentLength: { min: 100, max: 300, avg: 200 },
  bestHashtagCount: { min: 3, max: 5, avg: 4 },
  avgEngagementRate: 2.5,
  tones: ['professional', 'friendly'],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function getTimingInfo(date: Date): { hour: number; dayOfWeek: number } {
  return {
    hour: date.getHours(),
    dayOfWeek: date.getDay(),
  };
}

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

// ============================================
// MAIN FUNCTION: Get Performance Insights with Fallbacks
// ============================================

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

  // Filter by platform type if specified
  const filteredPosts = platformType
    ? posts.filter((p) => p.platform?.type === platformType)
    : posts;

  // If we have performance data, use it
  if (filteredPosts.length >= 5) {
    return buildPerformanceBasedInsights(filteredPosts, companyId);
  }

  // FALLBACK: Try to get company intelligence
  const intelligence = await prisma.companyIntelligence.findUnique({
    where: { companyId },
    include: {
      contentPillars: {
        where: { isActive: true },
      },
    },
  });

  if (intelligence) {
    // Check for industry benchmark
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { industry: true },
    });

    let industryBenchmark = null;
    if (company?.industry) {
      industryBenchmark = await prisma.industryBenchmark.findFirst({
        where: {
          industry: { contains: company.industry, mode: 'insensitive' },
        },
      });
    }

    return buildIntelligenceBasedInsights(intelligence, industryBenchmark, filteredPosts);
  }

  // FINAL FALLBACK: Use proven defaults
  return buildDefaultInsights();
}

// ============================================
// BUILD INSIGHTS FROM PERFORMANCE DATA
// ============================================

interface PostWithPlatform {
  id: string;
  content: string;
  topic: string | null;
  tone: string | null;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  platform: {
    id: string;
    type: string;
    name: string;
  } | null;
}

async function buildPerformanceBasedInsights(
  posts: PostWithPlatform[],
  companyId: string
): Promise<PerformanceInsights> {
  // Calculate engagement rates
  const postsWithEngagement = posts.map((post) => ({
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

  // Hashtag count analysis
  const hashtagCounts = topQuartile.map((p) => p.hashtags?.length || 0);
  const bestHashtagCount = {
    min: Math.min(...hashtagCounts),
    max: Math.max(...hashtagCounts),
    avg: Math.round(hashtagCounts.reduce((a, b) => a + b, 0) / hashtagCounts.length),
  };

  // Best posting times
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

  // Top hashtags
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

  // Recent top posts
  const recentTopPosts = sortedByEngagement.slice(0, 3).map((p) => ({
    id: p.id,
    content: p.content.substring(0, 500),
    topic: p.topic,
    tone: p.tone,
    engagementRate: Math.round(p.engagementRate * 100) / 100,
    impressions: p.impressions,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
  }));

  // Get content pillars for additional context
  const intelligence = await prisma.companyIntelligence.findUnique({
    where: { companyId },
    include: { contentPillars: { where: { isActive: true } } },
  });

  return {
    hasData: true,
    dataSource: 'performance',
    totalPostsAnalyzed: posts.length,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    topPerformingTopics,
    bestPerformingTones,
    optimalContentLength,
    bestHashtagCount,
    bestPostingTimes,
    topHashtags,
    recentTopPosts,
    contentPillars: intelligence?.contentPillars.map(p => ({ name: p.name, topics: p.topics })) || [],
    suggestedContentTypes: ['educational', 'engagement', 'socialProof'],
    brandGuidance: intelligence ? {
      personality: intelligence.brandPersonality,
      tone: intelligence.defaultTone,
      goals: intelligence.primaryGoals,
      targetAudience: intelligence.targetAudience,
      uniqueSellingPoints: intelligence.uniqueSellingPoints,
    } : null,
    industryGuidance: null,
  };
}

// ============================================
// BUILD INSIGHTS FROM COMPANY INTELLIGENCE (FALLBACK 1)
// ============================================

interface IntelligenceWithPillars {
  brandPersonality: string[];
  defaultTone: string;
  primaryGoals: string[];
  targetAudience: string | null;
  uniqueSellingPoints: string[];
  learnedBestDays: string[];
  learnedBestTimes: unknown;
  preferredDays: string[];
  preferredTimes: unknown;
  contentPillars: Array<{
    name: string;
    topics: string[];
    contentTypes: string[];
    avgEngagement: number | null;
    totalPosts: number;
  }>;
}

interface IndustryBenchmarkRecord {
  industry: string;
  bestDays: string[];
  bestTimes: unknown;
  avgEngagementRate: number | null;
  topHashtags: string[];
  suggestedThemes: unknown;
}

function buildIntelligenceBasedInsights(
  intelligence: IntelligenceWithPillars,
  industryBenchmark: IndustryBenchmarkRecord | null,
  existingPosts: PostWithPlatform[]
): PerformanceInsights {
  const dayNameToNumber: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  // Use learned data if available, otherwise preferences, otherwise defaults
  const bestDays = intelligence.learnedBestDays?.length > 0
    ? intelligence.learnedBestDays
    : intelligence.preferredDays?.length > 0
    ? intelligence.preferredDays
    : industryBenchmark?.bestDays || PROVEN_DEFAULTS.bestDays;

  const bestTimes = (intelligence.learnedBestTimes || intelligence.preferredTimes || industryBenchmark?.bestTimes || PROVEN_DEFAULTS.bestTimes) as Record<string, string[]>;

  // Build posting times from preferences
  const bestPostingTimes: Array<{ hour: number; dayOfWeek: number; avgEngagement: number }> = [];
  for (const day of bestDays) {
    const dayNum = dayNameToNumber[day.toLowerCase()];
    if (dayNum === undefined) continue;

    const times = bestTimes[day.toLowerCase()] || bestTimes.default || ['09:00', '12:00'];
    for (const time of times.slice(0, 2)) {
      const hour = parseInt(time.split(':')[0], 10);
      bestPostingTimes.push({
        hour,
        dayOfWeek: dayNum,
        avgEngagement: industryBenchmark?.avgEngagementRate || PROVEN_DEFAULTS.avgEngagementRate,
      });
    }
  }

  // Get topics from content pillars
  const topPerformingTopics = intelligence.contentPillars
    .flatMap((p) => p.topics.map((topic: string) => ({
      topic,
      avgEngagement: p.avgEngagement || PROVEN_DEFAULTS.avgEngagementRate,
      postCount: p.totalPosts || 0,
    })))
    .slice(0, 5);

  // Build tone recommendations
  const bestPerformingTones = [
    { tone: intelligence.defaultTone || 'professional', avgEngagement: PROVEN_DEFAULTS.avgEngagementRate, postCount: 0 },
  ];
  if (intelligence.defaultTone !== 'friendly') {
    bestPerformingTones.push({ tone: 'friendly', avgEngagement: PROVEN_DEFAULTS.avgEngagementRate * 0.9, postCount: 0 });
  }

  // Industry guidance
  let industryGuidance: PerformanceInsights['industryGuidance'] = null;
  if (industryBenchmark) {
    const suggestedThemes: string[] = [];
    if (industryBenchmark.suggestedThemes) {
      const themes = industryBenchmark.suggestedThemes as Record<string, string[]>;
      for (const category of Object.values(themes)) {
        if (Array.isArray(category)) {
          suggestedThemes.push(...category.slice(0, 3));
        }
      }
    }

    industryGuidance = {
      industry: industryBenchmark.industry,
      bestDays: industryBenchmark.bestDays,
      bestTimes: industryBenchmark.bestTimes as Record<string, string[]>,
      avgEngagementRate: industryBenchmark.avgEngagementRate,
      suggestedThemes: suggestedThemes.slice(0, 10),
    };
  }

  return {
    hasData: true,
    dataSource: industryBenchmark ? 'industry' : 'intelligence',
    totalPostsAnalyzed: existingPosts.length,
    avgEngagementRate: industryBenchmark?.avgEngagementRate || PROVEN_DEFAULTS.avgEngagementRate,
    topPerformingTopics,
    bestPerformingTones,
    optimalContentLength: PROVEN_DEFAULTS.optimalContentLength,
    bestHashtagCount: PROVEN_DEFAULTS.bestHashtagCount,
    bestPostingTimes,
    topHashtags: industryBenchmark?.topHashtags || [],
    recentTopPosts: [],
    contentPillars: intelligence.contentPillars.map((p) => ({ name: p.name, topics: p.topics })),
    suggestedContentTypes: intelligence.contentPillars.flatMap((p) => p.contentTypes).slice(0, 5) || ['educational', 'engagement'],
    brandGuidance: {
      personality: intelligence.brandPersonality || [],
      tone: intelligence.defaultTone || 'professional',
      goals: intelligence.primaryGoals || [],
      targetAudience: intelligence.targetAudience,
      uniqueSellingPoints: intelligence.uniqueSellingPoints || [],
    },
    industryGuidance,
  };
}

// ============================================
// BUILD DEFAULT INSIGHTS (FINAL FALLBACK)
// ============================================

function buildDefaultInsights(): PerformanceInsights {
  const dayNameToNumber: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  const bestPostingTimes: Array<{ hour: number; dayOfWeek: number; avgEngagement: number }> = [];
  for (const day of PROVEN_DEFAULTS.bestDays) {
    const dayNum = dayNameToNumber[day];
    for (const time of PROVEN_DEFAULTS.bestTimes.default) {
      const hour = parseInt(time.split(':')[0], 10);
      bestPostingTimes.push({
        hour,
        dayOfWeek: dayNum,
        avgEngagement: PROVEN_DEFAULTS.avgEngagementRate,
      });
    }
  }

  return {
    hasData: true,
    dataSource: 'defaults',
    totalPostsAnalyzed: 0,
    avgEngagementRate: PROVEN_DEFAULTS.avgEngagementRate,
    topPerformingTopics: [
      { topic: 'Industry insights', avgEngagement: 3.0, postCount: 0 },
      { topic: 'Tips and tricks', avgEngagement: 2.8, postCount: 0 },
      { topic: 'Behind the scenes', avgEngagement: 2.5, postCount: 0 },
    ],
    bestPerformingTones: [
      { tone: 'professional', avgEngagement: 2.5, postCount: 0 },
      { tone: 'friendly', avgEngagement: 2.3, postCount: 0 },
    ],
    optimalContentLength: PROVEN_DEFAULTS.optimalContentLength,
    bestHashtagCount: PROVEN_DEFAULTS.bestHashtagCount,
    bestPostingTimes,
    topHashtags: [],
    recentTopPosts: [],
    contentPillars: [],
    suggestedContentTypes: ['educational', 'engagement', 'socialProof', 'promotional'],
    brandGuidance: null,
    industryGuidance: null,
  };
}

// ============================================
// FORMAT INSIGHTS FOR AI PROMPT (UPDATED)
// ============================================

export function formatInsightsForPrompt(insights: PerformanceInsights): string {
  if (!insights.hasData) {
    return "";
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let prompt = `\n**CONTENT INTELLIGENCE** (Source: ${insights.dataSource}):\n`;

  // Data source context
  if (insights.dataSource === 'performance') {
    prompt += `Based on ${insights.totalPostsAnalyzed} analyzed posts with real performance data.\n\n`;
  } else if (insights.dataSource === 'industry') {
    prompt += `Based on industry benchmarks and company preferences (building performance data).\n\n`;
  } else if (insights.dataSource === 'intelligence') {
    prompt += `Based on company preferences and content strategy (no performance data yet).\n\n`;
  } else {
    prompt += `Using proven social media best practices (new account).\n\n`;
  }

  // Average engagement
  prompt += `- Target engagement rate: ${insights.avgEngagementRate}%\n`;

  // Top topics
  if (insights.topPerformingTopics.length > 0) {
    const topics = insights.topPerformingTopics
      .map((t) => `"${t.topic}" (${t.avgEngagement}% eng.)`)
      .join(", ");
    prompt += `- ${insights.dataSource === 'performance' ? 'Top performing' : 'Recommended'} topics: ${topics}\n`;
  }

  // Best tones
  if (insights.bestPerformingTones.length > 0) {
    const tones = insights.bestPerformingTones
      .map((t) => `${t.tone} (${t.avgEngagement}% eng.)`)
      .join(", ");
    prompt += `- ${insights.dataSource === 'performance' ? 'Best performing' : 'Recommended'} tones: ${tones}\n`;
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
    prompt += `- ${insights.dataSource === 'performance' ? 'High-performing' : 'Recommended'} hashtags: #${insights.topHashtags.slice(0, 5).join(", #")}\n`;
  }

  // Content pillars
  if (insights.contentPillars.length > 0) {
    prompt += `\n**CONTENT PILLARS:**\n`;
    for (const pillar of insights.contentPillars.slice(0, 3)) {
      prompt += `- ${pillar.name}: ${pillar.topics.slice(0, 3).join(', ')}\n`;
    }
  }

  // Brand guidance
  if (insights.brandGuidance) {
    prompt += `\n**BRAND GUIDANCE:**\n`;
    if (insights.brandGuidance.personality.length > 0) {
      prompt += `- Brand personality: ${insights.brandGuidance.personality.join(', ')}\n`;
    }
    if (insights.brandGuidance.goals.length > 0) {
      prompt += `- Primary goals: ${insights.brandGuidance.goals.join(', ')}\n`;
    }
    if (insights.brandGuidance.targetAudience) {
      prompt += `- Target audience: ${insights.brandGuidance.targetAudience}\n`;
    }
    if (insights.brandGuidance.uniqueSellingPoints.length > 0) {
      prompt += `- Key differentiators: ${insights.brandGuidance.uniqueSellingPoints.slice(0, 3).join(', ')}\n`;
    }
  }

  // Industry guidance
  if (insights.industryGuidance) {
    prompt += `\n**INDUSTRY CONTEXT (${insights.industryGuidance.industry}):**\n`;
    if (insights.industryGuidance.avgEngagementRate) {
      prompt += `- Industry avg engagement: ${insights.industryGuidance.avgEngagementRate}%\n`;
    }
    if (insights.industryGuidance.suggestedThemes.length > 0) {
      prompt += `- Trending themes: ${insights.industryGuidance.suggestedThemes.slice(0, 5).join(', ')}\n`;
    }
  }

  // Example of top post (only if from performance data)
  if (insights.dataSource === 'performance' && insights.recentTopPosts.length > 0) {
    const topPost = insights.recentTopPosts[0];
    prompt += `\n**TOP PERFORMING POST EXAMPLE** (${topPost.engagementRate}% engagement, ${topPost.impressions} impressions):\n`;
    prompt += `Topic: ${topPost.topic || "General"} | Tone: ${topPost.tone || "Professional"}\n`;
    prompt += `"${topPost.content.substring(0, 300)}${topPost.content.length > 300 ? "..." : ""}"\n`;
  }

  prompt += `\n**RECOMMENDATION**: ${
    insights.dataSource === 'performance'
      ? 'Learn from these proven patterns to create content that resonates with this audience.'
      : insights.dataSource === 'industry'
      ? 'Follow industry best practices while building your own performance data.'
      : insights.dataSource === 'intelligence'
      ? 'Align with brand guidelines while experimenting to discover what works.'
      : 'Follow proven social media best practices to establish a strong foundation.'
  }\n`;

  return prompt;
}