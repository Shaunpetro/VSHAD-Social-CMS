// apps/web/src/app/api/companies/[id]/intelligence/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/companies/[id]/intelligence
 *
 * Fetches the company's intelligence data including:
 * - Brand identity & goals
 * - Content pillars
 * - Learned performance data
 * - Intelligence score
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const intelligence = await prisma.companyIntelligence.findUnique({
      where: { companyId },
      include: {
        contentPillars: {
          where: { isActive: true },
          orderBy: { frequencyWeight: 'desc' },
        },
        competitors: true,
      },
    });

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Intelligence data not found. Please complete onboarding.' },
        { status: 404 }
      );
    }

    // Calculate real-time intelligence score if not recently updated
    const shouldRecalculate = !intelligence.lastIntelligenceUpdate ||
      (Date.now() - intelligence.lastIntelligenceUpdate.getTime()) > 24 * 60 * 60 * 1000;

    let intelligenceScore = intelligence.intelligenceScore;

    if (shouldRecalculate) {
      intelligenceScore = await calculateIntelligenceScore(companyId, intelligence);

      prisma.companyIntelligence.update({
        where: { id: intelligence.id },
        data: {
          intelligenceScore,
          lastIntelligenceUpdate: new Date(),
        },
      }).catch(err => console.error('Failed to update intelligence score:', err));
    }

    const response = {
      id: intelligence.id,
      companyId: intelligence.companyId,
      onboardingCompleted: intelligence.onboardingCompleted,

      // Industries (NEW)
      extractedIndustries: intelligence.extractedIndustries,
      industriesConfirmed: intelligence.industriesConfirmed,

      // Brand Identity
      brandPersonality: intelligence.brandPersonality,
      brandVoice: intelligence.brandVoice,
      uniqueSellingPoints: intelligence.uniqueSellingPoints,
      targetAudience: intelligence.targetAudience,

      // Goals
      primaryGoals: intelligence.primaryGoals,
      communityFocus: intelligence.communityFocus,

      // Content Pillars
      contentPillars: intelligence.contentPillars.map(pillar => ({
        id: pillar.id,
        name: pillar.name,
        description: pillar.description,
        topics: pillar.topics,
        keywords: pillar.keywords,
        contentTypes: pillar.contentTypes,
        frequencyWeight: pillar.frequencyWeight,
        preferredDays: pillar.preferredDays,
        totalPosts: pillar.totalPosts,
        avgEngagement: pillar.avgEngagement,
        lastUsed: pillar.lastUsed,
        performanceTrend: pillar.performanceTrend,
        bestPerformingType: pillar.bestPerformingType,
        isActive: pillar.isActive,
      })),

      // Keywords & Hashtags
      primaryKeywords: intelligence.primaryKeywords,
      industryHashtags: intelligence.industryHashtags,
      brandedHashtags: intelligence.brandedHashtags,

      // Tone Settings
      defaultTone: intelligence.defaultTone,
      humorEnabled: intelligence.humorEnabled,
      humorStyle: intelligence.humorStyle,
      humorDays: intelligence.humorDays,
      humorTimes: intelligence.humorTimes,
      dayToneSchedule: intelligence.dayToneSchedule,

      // Posting Preferences
      postsPerWeek: intelligence.postsPerWeek,
      preferredDays: intelligence.preferredDays,
      preferredTimes: intelligence.preferredTimes,
      timezone: intelligence.timezone,
      autoApprove: intelligence.autoApprove,

      // Learned Performance Data
      intelligenceScore,
      engagementTrend: intelligence.engagementTrend,
      avgEngagementRate: intelligence.avgEngagementRate,
      topPerformingTypes: intelligence.topPerformingTypes,
      topPerformingTopics: intelligence.topPerformingTopics,
      topPerformingHooks: intelligence.topPerformingHooks,
      topicUsageHistory: intelligence.topicUsageHistory,
      contentTypePerformance: intelligence.contentTypePerformance,
      platformPerformance: intelligence.platformPerformance,
      learnedBestDays: intelligence.learnedBestDays,
      learnedBestTimes: intelligence.learnedBestTimes,
      learnedBestPillars: intelligence.learnedBestPillars,
      weeklyPostTarget: intelligence.weeklyPostTarget,
      lastIntelligenceUpdate: intelligence.lastIntelligenceUpdate,

      // Avoid
      avoidTopics: intelligence.avoidTopics,

      // Competitor Intelligence
      competitors: intelligence.competitors.map(comp => ({
        id: comp.id,
        name: comp.name,
        linkedinUrl: comp.linkedinUrl,
        facebookUrl: comp.facebookUrl,
        websiteUrl: comp.websiteUrl,
        postingFrequency: comp.postingFrequency,
        avgEngagement: comp.avgEngagement,
        followerCount: comp.followerCount,
        topContentTypes: comp.topContentTypes,
        topHashtags: comp.topHashtags,
        strengths: comp.strengths,
        weaknesses: comp.weaknesses,
        lastAnalyzed: comp.lastAnalyzed,
      })),
      competitorGaps: intelligence.competitorGaps,

      // Industry Data
      industryBenchmarks: intelligence.industryBenchmarks,
      industryTrends: intelligence.industryTrends,

      // Timestamps
      createdAt: intelligence.createdAt,
      updatedAt: intelligence.updatedAt,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Intelligence API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch intelligence data' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/companies/[id]/intelligence
 *
 * Full update of intelligence settings (used by Settings page)
 * Handles contentPillars CRUD and extractedIndustries
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Find existing intelligence
    const existing = await prisma.companyIntelligence.findUnique({
      where: { companyId },
      include: { contentPillars: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Intelligence data not found' },
        { status: 404 }
      );
    }

    // Extract contentPillars for separate handling
    const { contentPillars, ...intelligenceData } = body;

    // Build update data for intelligence
    const updateData: Record<string, unknown> = {};

    // Allowed direct fields
    const directFields = [
      'extractedIndustries',
      'industriesConfirmed',
      'brandPersonality',
      'brandVoice',
      'uniqueSellingPoints',
      'targetAudience',
      'primaryGoals',
      'communityFocus',
      'primaryKeywords',
      'industryHashtags',
      'brandedHashtags',
      'defaultTone',
      'humorEnabled',
      'humorStyle',
      'humorDays',
      'humorTimes',
      'dayToneSchedule',
      'postsPerWeek',
      'preferredDays',
      'preferredTimes',
      'timezone',
      'autoApprove',
      'avoidTopics',
      'competitorGaps',
    ];

    for (const field of directFields) {
      if (field in intelligenceData) {
        updateData[field] = intelligenceData[field];
      }
    }

    // Update intelligence record
    await prisma.companyIntelligence.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Handle content pillars if provided
    if (contentPillars && Array.isArray(contentPillars)) {
      const existingPillarIds = existing.contentPillars.map(p => p.id);
      const incomingPillarIds: string[] = [];

      for (const pillar of contentPillars) {
        if (pillar.id && !pillar.id.startsWith('new-')) {
          // Update existing pillar
          incomingPillarIds.push(pillar.id);
          await prisma.contentPillar.update({
            where: { id: pillar.id },
            data: {
              name: pillar.name,
              topics: pillar.topics || [],
              contentTypes: pillar.contentTypes || [],
              frequencyWeight: pillar.frequencyWeight ?? 1.0,
              isActive: pillar.isActive ?? true,
            },
          });
        } else {
          // Create new pillar
          const newPillar = await prisma.contentPillar.create({
            data: {
              intelligenceId: existing.id,
              name: pillar.name,
              topics: pillar.topics || [],
              contentTypes: pillar.contentTypes || [],
              frequencyWeight: pillar.frequencyWeight ?? 1.0,
              isActive: pillar.isActive ?? true,
              keywords: [],
              preferredDays: [],
            },
          });
          incomingPillarIds.push(newPillar.id);
        }
      }

      // Delete pillars that were removed
      const pillarsToDelete = existingPillarIds.filter(id => !incomingPillarIds.includes(id));
      if (pillarsToDelete.length > 0) {
        await prisma.contentPillar.deleteMany({
          where: { id: { in: pillarsToDelete } },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Intelligence settings updated successfully',
    });

  } catch (error) {
    console.error('[Intelligence API] PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update intelligence data' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/companies/[id]/intelligence
 *
 * Updates specific intelligence fields (legacy support)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const updates = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.companyIntelligence.findUnique({
      where: { companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Intelligence data not found' },
        { status: 404 }
      );
    }

    const allowedFields = [
      'extractedIndustries',
      'industriesConfirmed',
      'brandPersonality',
      'brandVoice',
      'uniqueSellingPoints',
      'targetAudience',
      'primaryGoals',
      'communityFocus',
      'primaryKeywords',
      'industryHashtags',
      'brandedHashtags',
      'defaultTone',
      'humorEnabled',
      'humorStyle',
      'humorDays',
      'humorTimes',
      'dayToneSchedule',
      'postsPerWeek',
      'preferredDays',
      'preferredTimes',
      'timezone',
      'autoApprove',
      'avoidTopics',
      'competitorGaps',
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await prisma.companyIntelligence.update({
      where: { id: existing.id },
      data: filteredUpdates,
    });

    return NextResponse.json({
      success: true,
      updated: Object.keys(filteredUpdates),
    });

  } catch (error) {
    console.error('[Intelligence API] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update intelligence data' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER: Calculate Intelligence Score
// ============================================

async function calculateIntelligenceScore(
  companyId: string,
  intelligence: {
    primaryGoals: string[];
    uniqueSellingPoints: string[];
    targetAudience: string | null;
    brandPersonality: string[];
    contentPillars?: { topics?: string[] }[];
    learnedBestDays?: string[];
    topPerformingTypes?: unknown;
    avgEngagementRate?: number | null;
    industryBenchmarks?: unknown;
  }
): Promise<number> {
  let score = 0;

  // 1. Profile completeness (20 points)
  if (intelligence.primaryGoals.length > 0) score += 5;
  if (intelligence.uniqueSellingPoints.length > 0) score += 5;
  if (intelligence.targetAudience) score += 5;
  if (intelligence.brandPersonality.length > 0) score += 5;

  // 2. Content pillars (20 points)
  const pillarCount = intelligence.contentPillars?.length || 0;
  if (pillarCount >= 3) score += 10;
  else if (pillarCount >= 1) score += 5;

  const totalTopics = intelligence.contentPillars?.reduce(
    (sum: number, p) => sum + (p.topics?.length || 0),
    0
  ) || 0;
  if (totalTopics >= 10) score += 10;
  else if (totalTopics >= 5) score += 5;

  // 3. Platform connections (20 points)
  const platforms = await prisma.platform.findMany({
    where: { companyId, isConnected: true },
  });
  const connectedCount = platforms.length;
  if (connectedCount >= 3) score += 20;
  else if (connectedCount >= 2) score += 15;
  else if (connectedCount >= 1) score += 10;

  // 4. Performance data (30 points)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const publishedPosts = await prisma.generatedPost.count({
    where: {
      companyId,
      status: 'PUBLISHED',
      publishedAt: { gte: thirtyDaysAgo },
    },
  });

  if (publishedPosts >= 20) score += 15;
  else if (publishedPosts >= 10) score += 10;
  else if (publishedPosts >= 5) score += 5;

  if (intelligence.learnedBestDays && intelligence.learnedBestDays.length > 0) score += 5;
  if (intelligence.topPerformingTypes && typeof intelligence.topPerformingTypes === 'object' && Object.keys(intelligence.topPerformingTypes as object).length > 0) score += 5;
  if (intelligence.avgEngagementRate && intelligence.avgEngagementRate > 0) score += 5;

  // 5. Industry benchmark (10 points)
  if (intelligence.industryBenchmarks) score += 10;

  return Math.min(100, score);
}