// apps/web/src/lib/ai/topic-generator.ts

/**
 * TOPIC GENERATOR
 * Suggests relevant topics based on pillars, performance, and freshness
 */

import { CompanyWithIntelligence } from './types';

// ============================================
// TYPES
// ============================================

export interface TopicSuggestion {
  topic: string;
  source: 'pillar' | 'performance' | 'industry' | 'usp' | 'goal';
  relevanceScore: number;
  lastUsed: Date | null;
  usageCount: number;
  performanceNote: string | null;
}

// ============================================
// MAIN FUNCTION
// ============================================

export function generateTopicSuggestions(
  company: CompanyWithIntelligence,
  contentType: string,
  count: number = 5
): TopicSuggestion[] {
  const intel = company.intelligence;
  const suggestions: TopicSuggestion[] = [];

  if (!intel) {
    return [];
  }

  // 1. High-performing topics
  const topTopics = intel.topPerformingTopics as Record<string, number> | null;
  if (topTopics) {
    for (const [topic, engagement] of Object.entries(topTopics)) {
      suggestions.push({
        topic,
        source: 'performance',
        relevanceScore: 90 + Math.min(10, engagement),
        lastUsed: null,
        usageCount: 0,
        performanceNote: `${engagement.toFixed(1)}% engagement`,
      });
    }
  }

  // 2. Pillar topics
  const pillars = intel.contentPillars || [];
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
  const usps = intel.uniqueSellingPoints || [];
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
  const topicHistory = intel.topicUsageHistory as Record<string, { lastUsed: string; count: number }> | null;
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