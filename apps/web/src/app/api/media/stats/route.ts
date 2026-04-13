// apps/web/src/app/api/media/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/media/stats - Get media usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7);

    // Date ranges for trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Build base where clause with proper Prisma types
    const baseWhere: Prisma.MediaWhereInput = {};
    if (companyId) {
      baseWhere.companyId = companyId;
    }

    // Build the available where clause with proper null handling
    const availableWhere: Prisma.MediaWhereInput = {
      ...baseWhere,
      isUsed: false,
      OR: [
        { expiresAt: { equals: null } },
        { expiresAt: { gt: now } },
      ] as Prisma.MediaWhereInput[],
    };

    // Get all counts in parallel
    const [
      totalCount,
      availableCount,
      usedCount,
      expiringCount,
      expiredCount,
      imageCount,
      videoCount,
      gifCount,
      uploadedLast7Days,
      uploadedLast30Days,
      usedLast7Days,
      usedLast30Days,
      mediaByPillar,
      mediaByContentType,
      topTags,
      companySummaries,
    ] = await Promise.all([
      // Total media
      prisma.media.count({ where: baseWhere }),

      // Available (not used, not expired)
      prisma.media.count({ where: availableWhere }),

      // Used
      prisma.media.count({
        where: { ...baseWhere, isUsed: true },
      }),

      // Expiring soon (within warning period)
      prisma.media.count({
        where: {
          ...baseWhere,
          isUsed: false,
          expiresAt: {
            gt: now,
            lte: warningDate,
          },
        },
      }),

      // Already expired (expiresAt < now, and expiresAt is not null)
      // Note: { lt: now } naturally excludes null values in SQL
      prisma.media.count({
        where: {
          ...baseWhere,
          expiresAt: { lt: now },
        },
      }),

      // By type: Images
      prisma.media.count({
        where: { ...baseWhere, type: "IMAGE" },
      }),

      // By type: Videos
      prisma.media.count({
        where: { ...baseWhere, type: "VIDEO" },
      }),

      // By type: GIFs
      prisma.media.count({
        where: { ...baseWhere, type: "GIF" },
      }),

      // Uploaded in last 7 days
      prisma.media.count({
        where: {
          ...baseWhere,
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // Uploaded in last 30 days
      prisma.media.count({
        where: {
          ...baseWhere,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Used in last 7 days
      prisma.media.count({
        where: {
          ...baseWhere,
          usedAt: { gte: sevenDaysAgo },
        },
      }),

      // Used in last 30 days
      prisma.media.count({
        where: {
          ...baseWhere,
          usedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Media grouped by pillar (get all media and count in memory)
      prisma.media.findMany({
        where: baseWhere,
        select: {
          pillarIds: true,
          isUsed: true,
        },
      }),

      // Media grouped by content type
      prisma.media.findMany({
        where: baseWhere,
        select: {
          contentTypes: true,
          isUsed: true,
        },
      }),

      // Get all tags for analysis
      prisma.media.findMany({
        where: baseWhere,
        select: {
          tags: true,
        },
      }),

      // Company summaries (if no companyId filter)
      companyId
        ? null
        : prisma.company.findMany({
            select: {
              id: true,
              name: true,
              logoUrl: true,
              _count: {
                select: {
                  media: true,
                },
              },
            },
          }),
    ]);

    // Process pillar stats
    const pillarStats: Record<string, { total: number; available: number; used: number }> = {};
    for (const media of mediaByPillar) {
      for (const pillarId of media.pillarIds) {
        if (!pillarStats[pillarId]) {
          pillarStats[pillarId] = { total: 0, available: 0, used: 0 };
        }
        pillarStats[pillarId].total++;
        if (media.isUsed) {
          pillarStats[pillarId].used++;
        } else {
          pillarStats[pillarId].available++;
        }
      }
    }

    // Process content type stats
    const contentTypeStats: Record<string, { total: number; available: number; used: number }> = {};
    for (const media of mediaByContentType) {
      for (const ct of media.contentTypes) {
        if (!contentTypeStats[ct]) {
          contentTypeStats[ct] = { total: 0, available: 0, used: 0 };
        }
        contentTypeStats[ct].total++;
        if (media.isUsed) {
          contentTypeStats[ct].used++;
        } else {
          contentTypeStats[ct].available++;
        }
      }
    }

    // Process top tags
    const tagCounts: Record<string, number> = {};
    for (const media of topTags) {
      for (const tag of media.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    // Get pillar names if companyId provided
    let pillarNames: Record<string, string> = {};
    if (companyId) {
      const pillars = await prisma.contentPillar.findMany({
        where: {
          intelligence: {
            companyId,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
      pillarNames = Object.fromEntries(pillars.map((p) => [p.id, p.name]));
    }

    // Enrich pillar stats with names
    const enrichedPillarStats = Object.entries(pillarStats).map(([id, stats]) => ({
      pillarId: id,
      pillarName: pillarNames[id] || "Unknown",
      ...stats,
    }));

    // Calculate usage rate
    const usageRate = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

    // Calculate average days to use
    const usedMedia = await prisma.media.findMany({
      where: {
        ...baseWhere,
        isUsed: true,
        usedAt: { not: undefined },
      },
      select: {
        createdAt: true,
        usedAt: true,
      },
    });

    let avgDaysToUse: number | null = null;
    if (usedMedia.length > 0) {
      const totalDays = usedMedia.reduce((sum, m) => {
        if (m.usedAt) {
          const days = (m.usedAt.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      avgDaysToUse = Math.round(totalDays / usedMedia.length);
    }

    // Process company summaries
    let companyBreakdown = null;
    if (companySummaries) {
      companyBreakdown = companySummaries
        .filter((c) => c._count.media > 0)
        .map((c) => ({
          id: c.id,
          name: c.name,
          logoUrl: c.logoUrl,
          mediaCount: c._count.media,
        }))
        .sort((a, b) => b.mediaCount - a.mediaCount);
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      companyId: companyId || "all",

      // Overview
      overview: {
        total: totalCount,
        available: availableCount,
        used: usedCount,
        expiring: expiringCount,
        expired: expiredCount,
        usageRate: `${usageRate}%`,
        avgDaysToUse,
      },

      // By type
      byType: {
        image: imageCount,
        video: videoCount,
        gif: gifCount,
      },

      // Trends
      trends: {
        uploadedLast7Days,
        uploadedLast30Days,
        usedLast7Days,
        usedLast30Days,
        uploadRate7d: `${Math.round(uploadedLast7Days / 7 * 10) / 10}/day`,
        usageRate7d: `${Math.round(usedLast7Days / 7 * 10) / 10}/day`,
      },

      // By pillar
      byPillar: enrichedPillarStats,

      // By content type
      byContentType: Object.entries(contentTypeStats).map(([type, stats]) => ({
        contentType: type,
        ...stats,
      })),

      // Top tags
      topTags: sortedTags,

      // Company breakdown (only if viewing all companies)
      ...(companyBreakdown && { companyBreakdown }),
    });
  } catch (error) {
    console.error("Failed to get media stats:", error);
    return NextResponse.json(
      { error: "Failed to get media stats" },
      { status: 500 }
    );
  }
}