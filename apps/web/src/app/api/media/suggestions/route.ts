// apps/web/src/app/api/media/suggestions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface ScoredMedia {
  media: {
    id: string;
    filename: string;
    url: string;
    thumbnailUrl: string | null;
    type: string;
    pillarIds: string[];
    tags: string[];
    contentTypes: string[];
    expiresAt: Date | null;
    priority: number;
    createdAt: Date;
  };
  score: number;
  matchReasons: string[];
}

// GET /api/media/suggestions - Get smart media suggestions for content generation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get("companyId");
    const pillarId = searchParams.get("pillarId");
    const contentType = searchParams.get("contentType"); // educational, engagement, social_proof, promotional
    const topic = searchParams.get("topic");
    const tagsParam = searchParams.get("tags"); // comma-separated
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if company has media balance enabled
    const intelligence = await prisma.companyIntelligence.findUnique({
      where: { companyId },
      select: {
        mediaBalanceEnabled: true,
        mediaPostRatio: true,
        educationalMediaRatio: true,
        engagementMediaRatio: true,
        socialProofMediaRatio: true,
        promotionalMediaRatio: true,
        prioritizeExpiringMedia: true,
        expiryWarningDays: true,
      },
    });

    // Default settings if no intelligence record
    const settings = {
      mediaBalanceEnabled: intelligence?.mediaBalanceEnabled ?? true,
      mediaPostRatio: intelligence?.mediaPostRatio ?? 60,
      educationalMediaRatio: intelligence?.educationalMediaRatio ?? 50,
      engagementMediaRatio: intelligence?.engagementMediaRatio ?? 30,
      socialProofMediaRatio: intelligence?.socialProofMediaRatio ?? 80,
      promotionalMediaRatio: intelligence?.promotionalMediaRatio ?? 70,
      prioritizeExpiringMedia: intelligence?.prioritizeExpiringMedia ?? true,
      expiryWarningDays: intelligence?.expiryWarningDays ?? 7,
    };

    if (!settings.mediaBalanceEnabled) {
      return NextResponse.json({
        suggestions: [],
        shouldIncludeMedia: false,
        reason: "Media balance is disabled for this company",
        settings,
      });
    }

    // Determine if this post should include media based on content type ratio
    const ratioMap: Record<string, number> = {
      educational: settings.educationalMediaRatio,
      engagement: settings.engagementMediaRatio,
      social_proof: settings.socialProofMediaRatio,
      promotional: settings.promotionalMediaRatio,
    };

    const applicableRatio = contentType
      ? ratioMap[contentType] ?? settings.mediaPostRatio
      : settings.mediaPostRatio;

    const randomValue = Math.random() * 100;
    const shouldIncludeMedia = randomValue < applicableRatio;

    // Query available media with proper typed where clause
    const now = new Date();
    const availableWhere: Prisma.MediaWhereInput = {
      companyId,
      isUsed: false,
      autoSelect: true,
      OR: [
        { expiresAt: { equals: null } },
        { expiresAt: { gt: now } },
      ] as Prisma.MediaWhereInput[],
    };

    const availableMedia = await prisma.media.findMany({
      where: availableWhere,
      select: {
        id: true,
        filename: true,
        url: true,
        thumbnailUrl: true,
        type: true,
        pillarIds: true,
        tags: true,
        contentTypes: true,
        expiresAt: true,
        priority: true,
        createdAt: true,
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    if (availableMedia.length === 0) {
      return NextResponse.json({
        suggestions: [],
        shouldIncludeMedia: false,
        reason: "No available media in library",
        settings,
        availableCount: 0,
      });
    }

    // Parse tags from request
    const requestTags = tagsParam
      ? tagsParam.split(",").map((t) => t.toLowerCase().trim())
      : [];

    // Calculate warning date for expiring media
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + settings.expiryWarningDays);

    // Score each media item
    const scoredMedia: ScoredMedia[] = availableMedia.map((m) => {
      let score = m.priority; // Base score from priority field
      const matchReasons: string[] = [];

      // Pillar match (+10 points)
      if (pillarId && m.pillarIds.includes(pillarId)) {
        score += 10;
        matchReasons.push("Matches content pillar");
      }

      // Content type match (+5 points)
      if (contentType && m.contentTypes.includes(contentType)) {
        score += 5;
        matchReasons.push(`Matches ${contentType} content type`);
      }

      // Tag matches (+2 points each, max 10)
      if (requestTags.length > 0) {
        const matchingTags = m.tags.filter((t) =>
          requestTags.some((rt) => t.toLowerCase().includes(rt))
        );
        const tagScore = Math.min(matchingTags.length * 2, 10);
        score += tagScore;
        if (matchingTags.length > 0) {
          matchReasons.push(`Matches ${matchingTags.length} tag(s): ${matchingTags.join(", ")}`);
        }
      }

      // Topic match in tags (+3 points)
      if (topic) {
        const topicLower = topic.toLowerCase();
        const topicMatch = m.tags.some((t) => t.toLowerCase().includes(topicLower));
        if (topicMatch) {
          score += 3;
          matchReasons.push(`Matches topic: ${topic}`);
        }

        // Also check filename for topic
        if (m.filename.toLowerCase().includes(topicLower)) {
          score += 2;
          matchReasons.push("Filename matches topic");
        }
      }

      // Expiring soon bonus (+5 points if prioritization enabled)
      if (settings.prioritizeExpiringMedia && m.expiresAt) {
        if (m.expiresAt <= warningDate && m.expiresAt > now) {
          score += 5;
          const daysLeft = Math.ceil(
            (m.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          matchReasons.push(`Expiring soon (${daysLeft} days)`);
        }
      }

      // Newer media gets slight boost (+1 point if created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (m.createdAt > sevenDaysAgo) {
        score += 1;
        matchReasons.push("Recently uploaded");
      }

      return { media: m, score, matchReasons };
    });

    // Sort by score (highest first)
    scoredMedia.sort((a, b) => b.score - a.score);

    // Take top suggestions
    const suggestions = scoredMedia.slice(0, limit);

    // Calculate stats
    const expiringCount = availableMedia.filter((m) => {
      if (!m.expiresAt) return false;
      return m.expiresAt <= warningDate && m.expiresAt > now;
    }).length;

    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        ...s.media,
        score: s.score,
        matchReasons: s.matchReasons,
      })),
      shouldIncludeMedia,
      reason: shouldIncludeMedia
        ? `Random value ${randomValue.toFixed(1)} < ${applicableRatio}% ratio`
        : `Random value ${randomValue.toFixed(1)} >= ${applicableRatio}% ratio (text-only post)`,
      settings,
      availableCount: availableMedia.length,
      expiringCount,
      query: {
        pillarId,
        contentType,
        topic,
        tags: requestTags,
      },
    });
  } catch (error) {
    console.error("Failed to get media suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get media suggestions" },
      { status: 500 }
    );
  }
}

// POST /api/media/suggestions - Check if should include media and get best match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      pillarId,
      contentType,
      topic,
      tags,
      forceInclude, // Override ratio check
    } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Reuse GET logic internally
    const intelligence = await prisma.companyIntelligence.findUnique({
      where: { companyId },
    });

    // Build available media where clause with proper typing
    const now = new Date();
    const availableWhere: Prisma.MediaWhereInput = {
      companyId,
      isUsed: false,
      autoSelect: true,
      OR: [
        { expiresAt: { equals: null } },
        { expiresAt: { gt: now } },
      ] as Prisma.MediaWhereInput[],
    };

    const availableMedia = await prisma.media.findMany({
      where: availableWhere,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
    });

    if (availableMedia.length === 0) {
      return NextResponse.json({
        includeMedia: false,
        selectedMedia: null,
        reason: "No available media",
      });
    }

    // Check ratio
    const ratioMap: Record<string, number> = {
      educational: intelligence?.educationalMediaRatio ?? 50,
      engagement: intelligence?.engagementMediaRatio ?? 30,
      social_proof: intelligence?.socialProofMediaRatio ?? 80,
      promotional: intelligence?.promotionalMediaRatio ?? 70,
    };

    const applicableRatio = contentType
      ? ratioMap[contentType] ?? (intelligence?.mediaPostRatio ?? 60)
      : (intelligence?.mediaPostRatio ?? 60);

    const shouldInclude = forceInclude || Math.random() * 100 < applicableRatio;

    if (!shouldInclude) {
      return NextResponse.json({
        includeMedia: false,
        selectedMedia: null,
        reason: "Ratio check: text-only post",
        availableCount: availableMedia.length,
      });
    }

    // Score and select best match
    let bestMedia = availableMedia[0];
    let bestScore = 0;

    for (const m of availableMedia) {
      let score = m.priority;

      if (pillarId && m.pillarIds.includes(pillarId)) score += 10;
      if (contentType && m.contentTypes.includes(contentType)) score += 5;
      if (tags) {
        const matchCount = m.tags.filter((t) =>
          tags.some((tag: string) => t.toLowerCase().includes(tag.toLowerCase()))
        ).length;
        score += matchCount * 2;
      }
      if (topic) {
        if (m.tags.some((t) => t.toLowerCase().includes(topic.toLowerCase()))) {
          score += 3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMedia = m;
      }
    }

    return NextResponse.json({
      includeMedia: true,
      selectedMedia: bestMedia,
      score: bestScore,
      reason: "Best match selected",
      availableCount: availableMedia.length,
    });
  } catch (error) {
    console.error("Failed to select media:", error);
    return NextResponse.json(
      { error: "Failed to select media" },
      { status: 500 }
    );
  }
}