// apps/web/src/lib/ai/volume-calculator.ts

/**
 * VOLUME CALCULATOR
 * Determines optimal posting frequency based on goals, industry, and performance
 */

import {
    CompanyWithIntelligence,
    IndustryBenchmarkData,
    GenerationPeriod,
    PlatformStats,
  } from './types';
  
  // ============================================
  // TYPES
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
  
  // ============================================
  // MAIN FUNCTION
  // ============================================
  
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