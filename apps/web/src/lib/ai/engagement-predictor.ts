// apps/web/src/lib/ai/engagement-predictor.ts

/**
 * ENGAGEMENT PREDICTOR
 * Predicts how well content will perform based on historical data
 */

import {
    CompanyWithIntelligence,
    PlatformStats,
    DAY_CONTENT_PSYCHOLOGY,
  } from './types';
  
  // ============================================
  // TYPES
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
  
  // ============================================
  // MAIN FUNCTION
  // ============================================
  
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
  
    if (!intel) {
      return {
        level: 'medium',
        score: 50,
        confidence: 10,
        factors: [{ name: 'Data', impact: 'neutral', weight: 0, note: 'No intelligence data available' }],
      };
    }
  
    // Factor 1: Content type performance
    const typePerf = intel.topPerformingTypes as Record<string, number> | null;
    if (typePerf && typePerf[contentType]) {
      const avgPerf = intel.avgEngagementRate || 2;
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
    const bestDays = intel.learnedBestDays || [];
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
      const topTopics = intel.topPerformingTopics as Record<string, number> | null;
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
    const platformPerf = intel.platformPerformance as Record<string, PlatformStats> | null;
    if (platformPerf && platformPerf[platform.toLowerCase()]) {
      const platPerf = platformPerf[platform.toLowerCase()];
      const avgPerf = intel.avgEngagementRate || 2;
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