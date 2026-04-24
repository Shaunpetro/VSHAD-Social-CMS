// apps/web/src/lib/ai/content-mix.ts

/**
 * CONTENT MIX CALCULATOR
 * Determines optimal content type distribution based on 40-30-20-10 rule
 * Adjusts based on performance data and goals
 */

import {
    CompanyWithIntelligence,
    IndustryBenchmarkData,
  } from './types';
  
  // ============================================
  // TYPES
  // ============================================
  
  export interface ContentMixItem {
    percentage: number;
    count: number;
    reasoning: string;
    suggestedTopics: string[];
    performanceNote: string | null;
  }
  
  export interface ContentMixRecommendation {
    mix: Record<string, ContentMixItem>;
    totalPosts: number;
    isPerformanceBased: boolean;
    adjustments: string[];
    funnelBreakdown: Record<string, number>;
  }
  
  // ============================================
  // CONSTANTS
  // ============================================
  
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
  
  // ============================================
  // MAIN FUNCTION
  // ============================================
  
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
  
  // Export helper for use in other modules
  export { normalizeContentType };