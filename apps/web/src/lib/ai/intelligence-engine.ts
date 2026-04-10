// apps/web/src/lib/ai/intelligence-engine.ts

/**
 * INTELLIGENCE ENGINE
 * The brain of the content generation system
 * 
 * Calculates optimal content strategy based on:
 * - Company intelligence (goals, pillars, preferences)
 * - Industry benchmarks
 * - Historical performance data
 * - Platform-specific optimization
 */

import { PlatformType } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface CompanyWithIntelligence {
  id: string;
  name: string;
  industry: string | null;
  intelligence: {
    postsPerWeek: number;
    preferredDays: string[];
    preferredTimes: Record<string, string[]> | null;
    primaryGoals: string[];
    defaultTone: string;
    autoApprove: boolean;
    timezone: string;
    // Learned data
    intelligenceScore: number;
    engagementTrend: string | null;
    avgEngagementRate: number | null;
    topPerformingTypes: Record<string, number> | null;
    topPerformingTopics: Record<string, number> | null;
    topicUsageHistory: Record<string, { lastUsed: string; count: number }> | null;
    contentTypePerformance: Record<string, ContentTypeStats> | null;
    platformPerformance: Record<string, PlatformStats> | null;
    learnedBestDays: string[];
    learnedBestTimes: Record<string, string[]> | null;
    learnedBestPillars: Record<string, number> | null;
    weeklyPostTarget: number | null;
    lastIntelligenceUpdate: Date | null;
    // Content pillars
    contentPillars: {
      id: string;
      name: string;
      topics: string[];
      contentTypes: string[];
      frequencyWeight: number;
      avgEngagement: number | null;
      lastUsed: Date | null;
      performanceTrend: string | null;
    }[];
    // Brand
    uniqueSellingPoints: string[];
    targetAudience: string | null;
    brandPersonality: string[];
  } | null;
  platforms: {
    id: string;
    type: PlatformType;
    name: string;
    isConnected: boolean;
  }[];
}

export interface IndustryBenchmarkData {
  recommendedPostsPerWeek: number;
  optimalPostsMin: number;
  optimalPostsMax: number;
  bestDays: string[];
  bestTimes: Record<string, string[]>;
  avgEngagementRate: number | null;
  contentMixRecommendation: Record<string, number> | null;
  growthBenchmarks: Record<string, number> | null;
}

export interface ContentTypeStats {
  totalPosts: number;
  avgEngagement: number;
  trend: 'up' | 'down' | 'stable';
  lastUsed: string | null;
}

export interface PlatformStats {
  totalPosts: number;
  avgEngagement: number;
  bestDay: string | null;
  bestTime: string | null;
}

export interface PerformanceData {
  posts: {
    id: string;
    contentType: string | null;
    pillar: string | null;
    topic: string | null;
    tone: string | null;
    hook: string | null;
    platformType: string;
    publishedAt: Date;
    dayOfWeek: string;
    timeOfDay: string;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    engagementRate: number;
  }[];
}

// ============================================
// INTELLIGENCE HEALTH SCORE
// ============================================

export interface IntelligenceHealth {
  overallScore: number; // 0-100
  breakdown: {
    companyProfile: { score: number; status: 'complete' | 'partial' | 'missing'; message: string };
    contentPillars: { score: number; status: 'complete' | 'partial' | 'missing'; message: string };
    platformConnections: { score: number; status: 'complete' | 'partial' | 'missing'; message: string };
    performanceData: { score: number; status: 'complete' | 'partial' | 'missing'; message: string };
    industryBenchmark: { score: number; status: 'complete' | 'partial' | 'missing'; message: string };
  };
  recommendations: string[];
  dataAge: {
    lastPost: Date | null;
    lastAnalysis: Date | null;
    daysOfData: number;
  };
}

export function calculateIntelligenceScore(
  company: CompanyWithIntelligence,
  performanceData: PerformanceData | null,
  industryBenchmark: IndustryBenchmarkData | null
): IntelligenceHealth {
  const intel = company.intelligence;
  const recommendations: string[] = [];

  // 1. Company Profile Score (20 points)
  let profileScore = 0;
  if (intel) {
    if (intel.primaryGoals.length > 0) profileScore += 5;
    if (intel.uniqueSellingPoints.length > 0) profileScore += 5;
    if (intel.targetAudience) profileScore += 5;
    if (intel.brandPersonality.length > 0) profileScore += 5;
  }
  const profileStatus = profileScore >= 15 ? 'complete' : profileScore >= 8 ? 'partial' : 'missing';
  if (profileScore < 15) {
    recommendations.push('Complete your company profile for better content targeting');
  }

  // 2. Content Pillars Score (20 points)
  let pillarsScore = 0;
  const pillars = intel?.contentPillars || [];
  if (pillars.length >= 3) pillarsScore += 10;
  else if (pillars.length >= 1) pillarsScore += 5;
  
  const totalTopics = pillars.reduce((sum, p) => sum + p.topics.length, 0);
  if (totalTopics >= 10) pillarsScore += 10;
  else if (totalTopics >= 5) pillarsScore += 5;
  
  const pillarsStatus = pillarsScore >= 15 ? 'complete' : pillarsScore >= 8 ? 'partial' : 'missing';
  if (pillarsScore < 15) {
    recommendations.push('Add more content pillars and topics for diverse content');
  }

  // 3. Platform Connections Score (20 points)
  const connectedPlatforms = company.platforms.filter(p => p.isConnected).length;
  let platformScore = 0;
  if (connectedPlatforms >= 3) platformScore = 20;
  else if (connectedPlatforms >= 2) platformScore = 15;
  else if (connectedPlatforms >= 1) platformScore = 10;
  
  const platformStatus = platformScore >= 15 ? 'complete' : platformScore >= 10 ? 'partial' : 'missing';
  if (platformScore < 15) {
    recommendations.push('Connect more platforms to maximize reach');
  }

  // 4. Performance Data Score (30 points - highest weight)
  let performanceScore = 0;
  const posts = performanceData?.posts || [];
  const daysOfData = posts.length > 0
    ? Math.ceil((Date.now() - new Date(posts[posts.length - 1].publishedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (posts.length >= 20) performanceScore += 15;
  else if (posts.length >= 10) performanceScore += 10;
  else if (posts.length >= 5) performanceScore += 5;

  if (daysOfData >= 30) performanceScore += 15;
  else if (daysOfData >= 14) performanceScore += 10;
  else if (daysOfData >= 7) performanceScore += 5;

  const performanceStatus = performanceScore >= 20 ? 'complete' : performanceScore >= 10 ? 'partial' : 'missing';
  if (performanceScore < 20) {
    if (posts.length < 10) {
      recommendations.push(`Publish more content to improve AI learning (${posts.length}/10 minimum)`);
    }
    if (daysOfData < 30) {
      recommendations.push(`Need ${30 - daysOfData} more days of data for optimal learning`);
    }
  }

  // 5. Industry Benchmark Score (10 points)
  let benchmarkScore = industryBenchmark ? 10 : 0;
  const benchmarkStatus = benchmarkScore === 10 ? 'complete' : 'missing';
  if (!industryBenchmark) {
    recommendations.push('Set your industry for benchmark comparisons');
  }

  // Calculate overall score
  const overallScore = profileScore + pillarsScore + platformScore + performanceScore + benchmarkScore;

  // Find last post date
  const lastPost = posts.length > 0 ? posts[0].publishedAt : null;
  const lastAnalysis = intel?.lastIntelligenceUpdate || null;

  return {
    overallScore,
    breakdown: {
      companyProfile: { score: profileScore, status: profileStatus, message: `${profileScore}/20 points` },
      contentPillars: { score: pillarsScore, status: pillarsStatus, message: `${pillars.length} pillars, ${totalTopics} topics` },
      platformConnections: { score: platformScore, status: platformStatus, message: `${connectedPlatforms} platforms connected` },
      performanceData: { score: performanceScore, status: performanceStatus, message: `${posts.length} posts, ${daysOfData} days of data` },
      industryBenchmark: { score: benchmarkScore, status: benchmarkStatus, message: industryBenchmark ? 'Matched' : 'Not set' },
    },
    recommendations,
    dataAge: {
      lastPost,
      lastAnalysis,
      daysOfData,
    },
  };
}

// ============================================
// VOLUME CALCULATION
// ============================================

export interface VolumeRecommendation {
  recommended: number;
  minimum: number;
  maximum: number;
  breakdown: {
    base: number;
    industryModifier: number;
    goalModifier: number;
    performanceModifier: number;
    platformDistribution: Record<string, number>;
  };
  reasoning: string[];
  periodMultiplier: Record<string, number>;
}

export type GenerationPeriod = 'weekly' | 'biweekly' | 'monthly' | 'custom';

export function calculateOptimalVolume(
  company: CompanyWithIntelligence,
  industryBenchmark: IndustryBenchmarkData | null,
  period: GenerationPeriod = 'weekly',
  customDays?: number
): VolumeRecommendation {
  const intel = company.intelligence;
  const reasoning: string[] = [];

  // Base: User setting
  const base = intel?.postsPerWeek || 4;
  reasoning.push(`Base: ${base} posts/week (your setting)`);

  // Industry modifier
  let industryModifier = 0;
  if (industryBenchmark) {
    const industryAvg = industryBenchmark.recommendedPostsPerWeek;
    if (base < industryAvg) {
      industryModifier = Math.min(2, industryAvg - base);
      reasoning.push(`Industry average is ${industryAvg}/week (+${industryModifier} recommended)`);
    } else if (base > industryBenchmark.optimalPostsMax) {
      industryModifier = industryBenchmark.optimalPostsMax - base;
      reasoning.push(`Industry max is ${industryBenchmark.optimalPostsMax}/week (${industryModifier} adjustment)`);
    }
  }

  // Goal modifier
  let goalModifier = 0;
  const goals = intel?.primaryGoals || [];
  if (goals.includes('aggressive_growth') || goals.includes('rapid_expansion')) {
    goalModifier = Math.ceil(base * 0.25);
    reasoning.push(`Aggressive growth goal (+${goalModifier} posts)`);
  } else if (goals.includes('brand_awareness')) {
    goalModifier = Math.ceil(base * 0.15);
    reasoning.push(`Brand awareness focus (+${goalModifier} posts)`);
  } else if (goals.includes('quality_focus') || goals.includes('thought_leadership')) {
    goalModifier = -Math.ceil(base * 0.15);
    reasoning.push(`Quality focus (${goalModifier} posts, prioritize depth)`);
  }

  // Performance modifier
  let performanceModifier = 0;
  const trend = intel?.engagementTrend;
  if (trend === 'up') {
    performanceModifier = 1;
    reasoning.push('Engagement trending up (+1 to capitalize)');
  } else if (trend === 'down') {
    performanceModifier = -1;
    reasoning.push('Engagement trending down (-1, focus on quality)');
  }

  // Calculate weekly total
  const weeklyTotal = Math.max(1, base + industryModifier + goalModifier + performanceModifier);
  const minimum = Math.max(1, weeklyTotal - 2);
  const maximum = weeklyTotal + 2;

  // Period multipliers
  const periodMultiplier: Record<string, number> = {
    weekly: 1,
    biweekly: 2,
    monthly: 4.33, // Average weeks per month
    custom: customDays ? customDays / 7 : 1,
  };

  const multiplier = periodMultiplier[period];
  const periodTotal = Math.round(weeklyTotal * multiplier);

  // Platform distribution
  const connectedPlatforms = company.platforms.filter(p => p.isConnected);
  const platformDistribution: Record<string, number> = {};
  
  if (connectedPlatforms.length > 0) {
    // Check for platform performance data
    const platformPerf = intel?.platformPerformance as Record<string, PlatformStats> | null;
    
    if (platformPerf && Object.keys(platformPerf).length > 0) {
      // Distribute based on performance
      const totalEngagement = Object.values(platformPerf).reduce((sum, p) => sum + (p.avgEngagement || 1), 0);
      
      for (const platform of connectedPlatforms) {
        const perf = platformPerf[platform.type.toLowerCase()];
        const weight = perf ? (perf.avgEngagement || 1) / totalEngagement : 1 / connectedPlatforms.length;
        platformDistribution[platform.type] = Math.max(1, Math.round(periodTotal * weight));
      }
    } else {
      // Equal distribution
      const perPlatform = Math.ceil(periodTotal / connectedPlatforms.length);
      for (const platform of connectedPlatforms) {
        platformDistribution[platform.type] = perPlatform;
      }
    }
    
    reasoning.push(`Distributing across ${connectedPlatforms.length} platforms`);
  }

  return {
    recommended: periodTotal,
    minimum: Math.round(minimum * multiplier),
    maximum: Math.round(maximum * multiplier),
    breakdown: {
      base,
      industryModifier,
      goalModifier,
      performanceModifier,
      platformDistribution,
    },
    reasoning,
    periodMultiplier,
  };
}

// ============================================
// CONTENT MIX CALCULATION
// ============================================

export interface ContentMixRecommendation {
  mix: Record<string, ContentMixItem>;
  totalPosts: number;
  isPerformanceBased: boolean;
  adjustments: string[];
  funnelBreakdown: Record<string, number>;
}

export interface ContentMixItem {
  percentage: number;
  count: number;
  reasoning: string;
  suggestedTopics: string[];
  performanceNote: string | null;
}

// Default 40-30-20-10 rule
const DEFAULT_CONTENT_MIX: Record<string, number> = {
  educational: 40,
  engagement: 30,
  socialProof: 20,
  promotional: 10,
};

// Content type to funnel stage mapping
const CONTENT_TYPE_FUNNEL: Record<string, string> = {
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

export function calculateContentMix(
  company: CompanyWithIntelligence,
  totalPosts: number,
  industryBenchmark: IndustryBenchmarkData | null
): ContentMixRecommendation {
  const intel = company.intelligence;
  const adjustments: string[] = [];
  let isPerformanceBased = false;

  // Start with default mix
  let mix: Record<string, number> = { ...DEFAULT_CONTENT_MIX };

  // Check for industry-specific mix
  if (industryBenchmark?.contentMixRecommendation) {
    mix = { ...industryBenchmark.contentMixRecommendation };
    adjustments.push('Using industry-specific content mix');
  }

  // Adjust based on performance data
  const typePerformance = intel?.topPerformingTypes as Record<string, number> | null;
  if (typePerformance && Object.keys(typePerformance).length >= 3) {
    isPerformanceBased = true;
    adjustments.push('Optimizing based on your performance data');

    // Find average performance
    const avgPerformance = Object.values(typePerformance).reduce((a, b) => a + b, 0) / Object.values(typePerformance).length;

    // Adjust percentages based on performance
    for (const [type, performance] of Object.entries(typePerformance)) {
      const normalizedType = normalizeContentType(type);
      if (mix[normalizedType] !== undefined) {
        const performanceRatio = performance / avgPerformance;
        
        if (performanceRatio > 1.2) {
          // High performer - increase by up to 10%
          const increase = Math.min(10, Math.round((performanceRatio - 1) * 15));
          mix[normalizedType] = Math.min(50, mix[normalizedType] + increase);
          adjustments.push(`↑ ${normalizedType}: +${increase}% (performing ${Math.round((performanceRatio - 1) * 100)}% above avg)`);
        } else if (performanceRatio < 0.8) {
          // Low performer - decrease by up to 10%
          const decrease = Math.min(10, Math.round((1 - performanceRatio) * 15));
          mix[normalizedType] = Math.max(5, mix[normalizedType] - decrease);
          adjustments.push(`↓ ${normalizedType}: -${decrease}% (performing ${Math.round((1 - performanceRatio) * 100)}% below avg)`);
        }
      }
    }
  }

  // Adjust based on goals
  const goals = intel?.primaryGoals || [];
  if (goals.includes('lead_generation')) {
    mix.promotional = Math.min(25, (mix.promotional || 10) + 5);
    mix.socialProof = Math.min(30, (mix.socialProof || 20) + 5);
    adjustments.push('Lead generation focus: +promotional, +social proof');
  }
  if (goals.includes('brand_awareness')) {
    mix.educational = Math.min(50, (mix.educational || 40) + 5);
    adjustments.push('Brand awareness focus: +educational content');
  }
  if (goals.includes('community_building')) {
    mix.engagement = Math.min(45, (mix.engagement || 30) + 10);
    adjustments.push('Community building focus: +engagement content');
  }

  // Normalize to 100%
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    for (const key of Object.keys(mix)) {
      mix[key] = Math.round((mix[key] / total) * 100);
    }
  }

  // Convert percentages to counts
  const result: Record<string, ContentMixItem> = {};
  const pillars = intel?.contentPillars || [];
  
  for (const [type, percentage] of Object.entries(mix)) {
    const count = Math.max(1, Math.round((percentage / 100) * totalPosts));
    
    // Get topics from relevant pillars
    const relevantPillars = pillars.filter(p => 
      p.contentTypes.some(ct => normalizeContentType(ct) === type)
    );
    const suggestedTopics = relevantPillars.flatMap(p => p.topics).slice(0, 3);
    
    // Get performance note
    let performanceNote: string | null = null;
    if (typePerformance && typePerformance[type]) {
      const perf = typePerformance[type];
      const avgPerf = intel?.avgEngagementRate || 2;
      if (perf > avgPerf * 1.2) {
        performanceNote = `🔥 High performer (+${Math.round((perf / avgPerf - 1) * 100)}%)`;
      } else if (perf < avgPerf * 0.8) {
        performanceNote = `📉 Below average (${Math.round((1 - perf / avgPerf) * 100)}% lower)`;
      }
    }

    result[type] = {
      percentage,
      count,
      reasoning: getContentTypeReasoning(type, goals),
      suggestedTopics: suggestedTopics.length > 0 ? suggestedTopics : getDefaultTopics(type, company),
      performanceNote,
    };
  }

  // Calculate funnel breakdown
  const funnelBreakdown: Record<string, number> = {
    awareness: 0,
    interest: 0,
    consideration: 0,
    conversion: 0,
  };
  
  for (const [type, item] of Object.entries(result)) {
    const funnelStage = CONTENT_TYPE_FUNNEL[type] || 'awareness';
    funnelBreakdown[funnelStage] += item.count;
  }

  return {
    mix: result,
    totalPosts,
    isPerformanceBased,
    adjustments,
    funnelBreakdown,
  };
}

// ============================================
// SCHEDULE OPTIMIZATION
// ============================================

export interface ScheduleRecommendation {
  slots: ScheduleSlot[];
  platformSchedules: Record<string, ScheduleSlot[]>;
  optimizationNotes: string[];
}

export interface ScheduleSlot {
  dayOfWeek: string;
  date: Date;
  time: string;
  platform: string;
  contentType: string;
  topic: string | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_CONTENT_PSYCHOLOGY: Record<string, string[]> = {
  monday: ['motivational', 'educational', 'tips'],
  tuesday: ['educational', 'tips', 'caseStudy'],
  wednesday: ['educational', 'caseStudy', 'engagement'],
  thursday: ['engagement', 'community', 'behindTheScenes'],
  friday: ['behindTheScenes', 'engagement', 'community'],
  saturday: ['community', 'engagement', 'behindTheScenes'],
  sunday: ['motivational', 'community', 'engagement'],
};

export function calculateOptimalSchedule(
  company: CompanyWithIntelligence,
  contentMix: ContentMixRecommendation,
  period: GenerationPeriod,
  startDate: Date = new Date()
): ScheduleRecommendation {
  const intel = company.intelligence;
  const optimizationNotes: string[] = [];
  const slots: ScheduleSlot[] = [];

  // Get preferred days or use learned best days
  let preferredDays = intel?.preferredDays || [];
  if (intel?.learnedBestDays && intel.learnedBestDays.length > 0) {
    preferredDays = intel.learnedBestDays;
    optimizationNotes.push('Using learned best days from performance data');
  }
  if (preferredDays.length === 0) {
    preferredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    optimizationNotes.push('Using default weekday schedule');
  }

  // Get preferred times
  let preferredTimes = intel?.preferredTimes as Record<string, string[]> | null;
  if (intel?.learnedBestTimes) {
    preferredTimes = intel.learnedBestTimes as Record<string, string[]>;
    optimizationNotes.push('Using learned optimal posting times');
  }
  const defaultTimes = ['09:00', '12:00', '17:00'];

  // Get platform distribution from volume calculation
  const connectedPlatforms = company.platforms.filter(p => p.isConnected);
  const platformPerf = intel?.platformPerformance as Record<string, PlatformStats> | null;

  // Determine period length in days
  const periodDays = period === 'weekly' ? 7 : period === 'biweekly' ? 14 : 30;

  // Create content type queue from mix
  const contentQueue: { type: string; count: number }[] = [];
  for (const [type, item] of Object.entries(contentMix.mix)) {
    contentQueue.push({ type, count: item.count });
  }

  // Sort days by preference/performance
  const sortedDays = [...preferredDays].sort((a, b) => {
    const aIndex = DAY_ORDER.indexOf(a.toLowerCase());
    const bIndex = DAY_ORDER.indexOf(b.toLowerCase());
    return aIndex - bIndex;
  });

  // Generate schedule
  let currentDate = new Date(startDate);
  let contentIndex = 0;
  let dayIndex = 0;
  const platformSchedules: Record<string, ScheduleSlot[]> = {};

  for (const platform of connectedPlatforms) {
    platformSchedules[platform.type] = [];
  }

  // Distribute posts across the period
  const totalPosts = contentMix.totalPosts;
  const postsPerDay = Math.ceil(totalPosts / Math.min(periodDays, sortedDays.length * Math.ceil(periodDays / 7)));

  for (let day = 0; day < periodDays && slots.length < totalPosts; day++) {
    const dayOfWeek = DAY_ORDER[(currentDate.getDay() + 6) % 7]; // Convert to Monday=0
    
    // Check if this is a preferred day
    if (sortedDays.map(d => d.toLowerCase()).includes(dayOfWeek)) {
      // Get times for this day
      const timesForDay = preferredTimes?.[dayOfWeek] || defaultTimes;
      
      for (const time of timesForDay) {
        if (slots.length >= totalPosts) break;

        // Get next content type
        while (contentIndex < contentQueue.length && contentQueue[contentIndex].count <= 0) {
          contentIndex++;
        }
        if (contentIndex >= contentQueue.length) break;

        const contentType = contentQueue[contentIndex].type;
        contentQueue[contentIndex].count--;

        // Select platform (round-robin or performance-based)
        const platformIndex = slots.length % connectedPlatforms.length;
        const platform = connectedPlatforms[platformIndex];

        // Get topic suggestion
        const topic = getSuggestedTopic(contentType, contentMix.mix[contentType]?.suggestedTopics || [], slots);

        // Determine confidence based on data availability
        let confidence: 'high' | 'medium' | 'low' = 'medium';
        let reason = 'Scheduled based on preferences';

        if (intel?.learnedBestDays?.includes(dayOfWeek)) {
          confidence = 'high';
          reason = `${dayOfWeek} is your best performing day`;
        }
        if (platformPerf?.[platform.type.toLowerCase()]?.bestTime === time) {
          confidence = 'high';
          reason = `${time} is optimal for ${platform.type}`;
        }
        if (!intel?.learnedBestDays?.length && !platformPerf) {
          confidence = 'low';
          reason = 'Limited performance data - will optimize as you publish';
        }

        // Check day psychology match
        const psychologyMatch = DAY_CONTENT_PSYCHOLOGY[dayOfWeek]?.includes(contentType);
        if (psychologyMatch) {
          reason += ` • ${contentType} works well on ${dayOfWeek}s`;
        }

        const slot: ScheduleSlot = {
          dayOfWeek,
          date: new Date(currentDate),
          time,
          platform: platform.type,
          contentType,
          topic,
          confidence,
          reason,
        };

        slots.push(slot);
        platformSchedules[platform.type].push(slot);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    slots,
    platformSchedules,
    optimizationNotes,
  };
}

// ============================================
// TOPIC SUGGESTIONS
// ============================================

export interface TopicSuggestion {
  topic: string;
  source: 'pillar' | 'performance' | 'industry' | 'usp' | 'goal';
  relevanceScore: number;
  lastUsed: Date | null;
  usageCount: number;
  performanceNote: string | null;
}

export function generateTopicSuggestions(
  company: CompanyWithIntelligence,
  contentType: string,
  count: number = 5
): TopicSuggestion[] {
  const intel = company.intelligence;
  const suggestions: TopicSuggestion[] = [];

  // 1. High-performing topics
  const topTopics = intel?.topPerformingTopics as Record<string, number> | null;
  if (topTopics) {
    for (const [topic, engagement] of Object.entries(topTopics)) {
      suggestions.push({
        topic,
        source: 'performance',
        relevanceScore: 90 + Math.min(10, engagement),
        lastUsed: null, // Would need to look up
        usageCount: 0,
        performanceNote: `${engagement.toFixed(1)}% engagement`,
      });
    }
  }

  // 2. Pillar topics
  const pillars = intel?.contentPillars || [];
  for (const pillar of pillars) {
    if (pillar.contentTypes.includes(contentType) || pillar.contentTypes.length === 0) {
      for (const topic of pillar.topics) {
        const existing = suggestions.find(s => s.topic.toLowerCase() === topic.toLowerCase());
        if (!existing) {
          suggestions.push({
            topic,
            source: 'pillar',
            relevanceScore: 70 + (pillar.avgEngagement || 0) * 5,
            lastUsed: pillar.lastUsed,
            usageCount: 0,
            performanceNote: pillar.avgEngagement ? `Pillar avg: ${pillar.avgEngagement.toFixed(1)}%` : null,
          });
        }
      }
    }
  }

  // 3. USP-based topics
  const usps = intel?.uniqueSellingPoints || [];
  for (const usp of usps) {
    suggestions.push({
      topic: usp,
      source: 'usp',
      relevanceScore: 75,
      lastUsed: null,
      usageCount: 0,
      performanceNote: 'Differentiator',
    });
  }

  // Check topic freshness
  const topicHistory = intel?.topicUsageHistory as Record<string, { lastUsed: string; count: number }> | null;
  if (topicHistory) {
    for (const suggestion of suggestions) {
      const history = topicHistory[suggestion.topic.toLowerCase()];
      if (history) {
        suggestion.lastUsed = new Date(history.lastUsed);
        suggestion.usageCount = history.count;
        
        // Penalize recently used topics
        const daysSinceUse = (Date.now() - new Date(history.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUse < 7) {
          suggestion.relevanceScore -= 20;
        } else if (daysSinceUse < 14) {
          suggestion.relevanceScore -= 10;
        }
      }
    }
  }

  // Sort by relevance and return top N
  return suggestions
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, count);
}

// ============================================
// ENGAGEMENT PREDICTION
// ============================================

export interface EngagementPrediction {
  level: 'high' | 'medium' | 'low';
  score: number; // 0-100
  confidence: number; // 0-100
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    note: string;
  }[];
}

export function predictEngagement(
  company: CompanyWithIntelligence,
  contentType: string,
  dayOfWeek: string,
  time: string,
  topic: string | null,
  platform: string
): EngagementPrediction {
  const intel = company.intelligence;
  const factors: EngagementPrediction['factors'] = [];
  let score = 50; // Start at neutral
  let confidenceFactors = 0;

  // Factor 1: Content type performance
  const typePerf = intel?.topPerformingTypes as Record<string, number> | null;
  if (typePerf && typePerf[contentType]) {
    const avgPerf = intel?.avgEngagementRate || 2;
    const typeRate = typePerf[contentType];
    const impact = typeRate > avgPerf ? 'positive' : typeRate < avgPerf * 0.8 ? 'negative' : 'neutral';
    const weight = Math.abs(typeRate - avgPerf) / avgPerf * 20;
    
    score += impact === 'positive' ? weight : impact === 'negative' ? -weight : 0;
    factors.push({
      name: 'Content Type',
      impact,
      weight: Math.round(weight),
      note: `${contentType} averages ${typeRate.toFixed(1)}% engagement`,
    });
    confidenceFactors++;
  }

  // Factor 2: Day of week
  const bestDays = intel?.learnedBestDays || [];
  if (bestDays.length > 0) {
    const isDayOptimal = bestDays.includes(dayOfWeek.toLowerCase());
    score += isDayOptimal ? 15 : -5;
    factors.push({
      name: 'Day of Week',
      impact: isDayOptimal ? 'positive' : 'neutral',
      weight: isDayOptimal ? 15 : 5,
      note: isDayOptimal ? `${dayOfWeek} is a top performing day` : `Best days: ${bestDays.join(', ')}`,
    });
    confidenceFactors++;
  }

  // Factor 3: Day psychology match
  const psychologyMatch = DAY_CONTENT_PSYCHOLOGY[dayOfWeek.toLowerCase()]?.includes(contentType);
  if (psychologyMatch) {
    score += 10;
    factors.push({
      name: 'Day Psychology',
      impact: 'positive',
      weight: 10,
      note: `${contentType} aligns with ${dayOfWeek} audience mindset`,
    });
  }

  // Factor 4: Topic performance
  if (topic) {
    const topTopics = intel?.topPerformingTopics as Record<string, number> | null;
    if (topTopics) {
      const topicPerf = Object.entries(topTopics).find(([t]) => 
        t.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(t.toLowerCase())
      );
      if (topicPerf) {
        score += 15;
        factors.push({
          name: 'Topic',
          impact: 'positive',
          weight: 15,
          note: `Similar topic "${topicPerf[0]}" performed at ${topicPerf[1].toFixed(1)}%`,
        });
        confidenceFactors++;
      }
    }
  }

  // Factor 5: Platform performance
  const platformPerf = intel?.platformPerformance as Record<string, PlatformStats> | null;
  if (platformPerf && platformPerf[platform.toLowerCase()]) {
    const platPerf = platformPerf[platform.toLowerCase()];
    const avgPerf = intel?.avgEngagementRate || 2;
    const isAboveAvg = platPerf.avgEngagement > avgPerf;
    
    score += isAboveAvg ? 10 : -5;
    factors.push({
      name: 'Platform',
      impact: isAboveAvg ? 'positive' : 'neutral',
      weight: isAboveAvg ? 10 : 5,
      note: `${platform} averages ${platPerf.avgEngagement.toFixed(1)}% engagement`,
    });
    confidenceFactors++;
  }

  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Calculate confidence based on available data
  const confidence = Math.min(95, 30 + confidenceFactors * 15);

  // Determine level
  let level: 'high' | 'medium' | 'low' = 'medium';
  if (score >= 70) level = 'high';
  else if (score <= 35) level = 'low';

  return {
    level,
    score: Math.round(score),
    confidence,
    factors,
  };
}

// ============================================
// FULL CONTENT PLAN
// ============================================

export interface ContentGenerationPlan {
  company: {
    id: string;
    name: string;
  };
  intelligenceHealth: IntelligenceHealth;
  volume: VolumeRecommendation;
  contentMix: ContentMixRecommendation;
  schedule: ScheduleRecommendation;
  period: GenerationPeriod;
  startDate: Date;
  endDate: Date;
  summary: {
    totalPosts: number;
    platforms: string[];
    topContentTypes: string[];
    estimatedEngagement: 'above_average' | 'average' | 'below_average';
  };
}

export function generateContentPlan(
  company: CompanyWithIntelligence,
  performanceData: PerformanceData | null,
  industryBenchmark: IndustryBenchmarkData | null,
  period: GenerationPeriod = 'weekly',
  startDate: Date = new Date()
): ContentGenerationPlan {
  // Calculate intelligence health
  const intelligenceHealth = calculateIntelligenceScore(company, performanceData, industryBenchmark);

  // Calculate optimal volume
  const volume = calculateOptimalVolume(company, industryBenchmark, period);

  // Calculate content mix
  const contentMix = calculateContentMix(company, volume.recommended, industryBenchmark);

  // Calculate optimal schedule
  const schedule = calculateOptimalSchedule(company, contentMix, period, startDate);

  // Calculate end date
  const periodDays = period === 'weekly' ? 7 : period === 'biweekly' ? 14 : 30;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + periodDays);

  // Determine estimated engagement
  let estimatedEngagement: 'above_average' | 'average' | 'below_average' = 'average';
  if (contentMix.isPerformanceBased && intelligenceHealth.overallScore >= 60) {
    estimatedEngagement = 'above_average';
  } else if (intelligenceHealth.overallScore < 40) {
    estimatedEngagement = 'below_average';
  }

  // Get top content types
  const topContentTypes = Object.entries(contentMix.mix)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([type]) => type);

  return {
    company: {
      id: company.id,
      name: company.name,
    },
    intelligenceHealth,
    volume,
    contentMix,
    schedule,
    period,
    startDate,
    endDate,
    summary: {
      totalPosts: volume.recommended,
      platforms: company.platforms.filter(p => p.isConnected).map(p => p.type),
      topContentTypes,
      estimatedEngagement,
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeContentType(type: string): string {
  const mapping: Record<string, string> = {
    'case_study': 'socialProof',
    'casestudy': 'socialProof',
    'case-study': 'socialProof',
    'testimonial': 'socialProof',
    'social_proof': 'socialProof',
    'behind_the_scenes': 'engagement',
    'behindthescenes': 'engagement',
    'community': 'engagement',
    'tips': 'educational',
    'news': 'educational',
    'motivational': 'educational',
  };
  
  return mapping[type.toLowerCase()] || type.toLowerCase();
}

function getContentTypeReasoning(type: string, goals: string[]): string {
  const reasonings: Record<string, string> = {
    educational: 'Builds authority and provides value to your audience',
    engagement: 'Drives interaction and community building',
    socialProof: 'Builds trust through real results and testimonials',
    promotional: 'Converts audience into leads/customers',
    tips: 'Quick value that encourages saves and shares',
    behindTheScenes: 'Humanizes your brand and builds connection',
    community: 'Strengthens relationships with your audience',
    motivational: 'Inspires and creates emotional connection',
  };

  let reasoning = reasonings[type] || 'Diversifies your content mix';

  // Add goal-specific context
  if (goals.includes('lead_generation') && type === 'promotional') {
    reasoning += ' (aligned with lead generation goal)';
  }
  if (goals.includes('brand_awareness') && type === 'educational') {
    reasoning += ' (aligned with brand awareness goal)';
  }

  return reasoning;
}

function getDefaultTopics(type: string, company: CompanyWithIntelligence): string[] {
  const defaults: Record<string, string[]> = {
    educational: ['Industry insights', 'How-to guides', 'Expert tips'],
    engagement: ['Questions for audience', 'Polls', 'Discussion starters'],
    socialProof: ['Client results', 'Success stories', 'Testimonials'],
    promotional: ['Service highlights', 'Special offers', 'Call to action'],
  };

  return defaults[type] || ['General content'];
}

function getSuggestedTopic(
  contentType: string,
  availableTopics: string[],
  existingSlots: ScheduleSlot[]
): string | null {
  // Filter out recently used topics
  const usedTopics = existingSlots.map(s => s.topic?.toLowerCase()).filter(Boolean);
  const unusedTopics = availableTopics.filter(t => !usedTopics.includes(t.toLowerCase()));
  
  return unusedTopics[0] || availableTopics[0] || null;
}