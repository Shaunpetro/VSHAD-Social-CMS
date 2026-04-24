// apps/web/src/lib/ai/intelligence-health.ts

/**
 * INTELLIGENCE HEALTH CALCULATOR
 * Calculates how well-equipped the system is to generate optimal content
 */

import {
    CompanyWithIntelligence,
    PerformanceData,
    IndustryBenchmarkData,
    PlatformStats,
  } from './types';
  
  // ============================================
  // TYPES
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
  
  // ============================================
  // MAIN FUNCTION
  // ============================================
  
  export function calculateIntelligenceHealth(
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
    const benchmarkScore = industryBenchmark ? 10 : 0;
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