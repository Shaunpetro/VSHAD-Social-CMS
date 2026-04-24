// apps/web/src/lib/ai/intelligence-engine.ts

/**
 * INTELLIGENCE ENGINE - ORCHESTRATOR
 * Combines all intelligence modules to generate comprehensive content plans
 * 
 * This file is now a thin orchestrator that imports from specialized modules.
 */

// Re-export types for backward compatibility
export * from './types';

// Re-export all module functions
export { calculateIntelligenceHealth, type IntelligenceHealth } from './intelligence-health';
export { calculateOptimalVolume, type VolumeRecommendation } from './volume-calculator';
export { calculateContentMix, type ContentMixRecommendation, type ContentMixItem } from './content-mix';
export { calculateOptimalSchedule, type ScheduleSlot, type ScheduleRecommendation } from './schedule-optimizer';
export { generateTopicSuggestions, type TopicSuggestion } from './topic-generator';
export { predictEngagement, type EngagementPrediction } from './engagement-predictor';

// Import for internal use
import { calculateIntelligenceHealth, IntelligenceHealth } from './intelligence-health';
import { calculateOptimalVolume, VolumeRecommendation } from './volume-calculator';
import { calculateContentMix, ContentMixRecommendation } from './content-mix';
import { calculateOptimalSchedule, ScheduleRecommendation } from './schedule-optimizer';
import {
  CompanyWithIntelligence,
  PerformanceData,
  IndustryBenchmarkData,
  GenerationPeriod,
} from './types';

// ============================================
// CONTENT GENERATION PLAN
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

// ============================================
// MAIN ORCHESTRATOR FUNCTION
// ============================================

export function generateContentPlan(
  company: CompanyWithIntelligence,
  performanceData: PerformanceData | null,
  industryBenchmark: IndustryBenchmarkData | null,
  period: GenerationPeriod = 'weekly',
  startDate: Date = new Date()
): ContentGenerationPlan {
  // Calculate intelligence health
  const intelligenceHealth = calculateIntelligenceHealth(company, performanceData, industryBenchmark);

  // Calculate optimal volume
  const volume = calculateOptimalVolume(company, industryBenchmark, period);

  // Calculate content mix
  const contentMix = calculateContentMix(company, volume.recommended, industryBenchmark);

  // Calculate optimal schedule (NOW USES FIXED SCHEDULING!)
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