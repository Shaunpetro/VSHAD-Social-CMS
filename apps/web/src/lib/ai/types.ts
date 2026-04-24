// apps/web/src/lib/ai/types.ts

/**
 * SHARED TYPES
 * Common type definitions used across intelligence modules
 */

import { PlatformType } from '@prisma/client';

// ============================================
// COMPANY & INTELLIGENCE TYPES
// ============================================

export interface ContentPillarData {
  id: string;
  name: string;
  topics: string[];
  contentTypes: string[];
  frequencyWeight: number;
  avgEngagement: number | null;
  lastUsed: Date | null;
  performanceTrend: string | null;
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

export interface CompanyIntelligenceData {
  postsPerWeek: number;
  preferredDays: string[];
  preferredTimes: string[] | Record<string, string[]> | null;
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
  contentPillars: ContentPillarData[];
  // Brand
  uniqueSellingPoints: string[];
  targetAudience: string | null;
  brandPersonality: string[];
}

export interface PlatformData {
  id: string;
  type: PlatformType;
  name: string;
  isConnected: boolean;
}

export interface CompanyWithIntelligence {
  id: string;
  name: string;
  industry: string | null;
  intelligence: CompanyIntelligenceData | null;
  platforms: PlatformData[];
}

// ============================================
// INDUSTRY BENCHMARK
// ============================================

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

// ============================================
// PERFORMANCE DATA
// ============================================

export interface PerformancePost {
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
}

export interface PerformanceData {
  posts: PerformancePost[];
}

// ============================================
// GENERATION TYPES
// ============================================

export type GenerationPeriod = 'weekly' | 'biweekly' | 'monthly' | 'custom';

export type FunnelStage = 'awareness' | 'interest' | 'consideration' | 'conversion';

// ============================================
// CONSTANTS
// ============================================

export const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DAY_CONTENT_PSYCHOLOGY: Record<string, string[]> = {
  monday: ['motivational', 'educational', 'tips'],
  tuesday: ['educational', 'tips', 'caseStudy'],
  wednesday: ['educational', 'caseStudy', 'engagement'],
  thursday: ['engagement', 'community', 'behindTheScenes'],
  friday: ['behindTheScenes', 'engagement', 'community'],
  saturday: ['community', 'engagement', 'behindTheScenes'],
  sunday: ['motivational', 'community', 'engagement'],
};

// Content type to funnel stage mapping
export const CONTENT_TYPE_FUNNEL: Record<string, FunnelStage> = {
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