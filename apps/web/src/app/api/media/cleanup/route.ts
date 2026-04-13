// apps/web/src/app/api/media/cleanup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";

// POST /api/media/cleanup - Cron job to cleanup expired/used media
// Called daily at 3 AM SAST (1 AM UTC) via Vercel Cron
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow local development without secret
    const isDev = process.env.NODE_ENV === "development";
    
    if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cleanup attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const startTime = Date.now();

    console.log(`[Media Cleanup] Starting at ${now.toISOString()}`);

    // Step 1: Find media to delete (used OR expired)
    const mediaToDelete = await prisma.media.findMany({
      where: {
        OR: [
          { isUsed: true }, // Already used in a post
          { 
            expiresAt: { 
              lt: now,
              not: undefined,
            } 
          }, // Expired
        ],
      },
      select: {
        id: true,
        url: true,
        filename: true,
        companyId: true,
        isUsed: true,
        expiresAt: true,
      },
    });

    console.log(`[Media Cleanup] Found ${mediaToDelete.length} media items to delete`);

    // Step 2: Delete from Vercel Blob
    const blobResults = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const media of mediaToDelete) {
      try {
        await del(media.url);
        blobResults.success++;
      } catch (error) {
        blobResults.failed++;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        blobResults.errors.push(`${media.id}: ${errorMsg}`);
        console.error(`[Media Cleanup] Failed to delete blob for ${media.id}:`, error);
        // Continue with other deletions even if one fails
      }
    }

    // Step 3: Delete from database
    const deleteResult = await prisma.media.deleteMany({
      where: {
        id: { in: mediaToDelete.map((m) => m.id) },
      },
    });

    // Step 4: Update priority for media expiring soon
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7); // 7 days warning

    const priorityUpdate = await prisma.media.updateMany({
      where: {
        isUsed: false,
        expiresAt: {
          gt: now,
          lte: warningDate,
        },
        priority: { lt: 10 }, // Only update if not already high priority
      },
      data: {
        priority: 10, // High priority for expiring soon
      },
    });

    // Step 5: Get cleanup stats by company
    const companyStats: Record<string, { used: number; expired: number }> = {};
    
    for (const media of mediaToDelete) {
      if (!companyStats[media.companyId]) {
        companyStats[media.companyId] = { used: 0, expired: 0 };
      }
      if (media.isUsed) {
        companyStats[media.companyId].used++;
      } else {
        companyStats[media.companyId].expired++;
      }
    }

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      timestamp: now.toISOString(),
      duration: `${duration}ms`,
      deleted: {
        total: deleteResult.count,
        used: mediaToDelete.filter((m) => m.isUsed).length,
        expired: mediaToDelete.filter((m) => !m.isUsed).length,
      },
      blobCleanup: blobResults,
      priorityUpdated: priorityUpdate.count,
      companyStats,
    };

    console.log(`[Media Cleanup] Completed:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Media Cleanup] Failed:", error);
    return NextResponse.json(
      { 
        error: "Failed to cleanup media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/media/cleanup - Preview what would be cleaned up (for debugging)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7);

    // Build where clause
    const baseWhere: Record<string, unknown> = {};
    if (companyId) {
      baseWhere.companyId = companyId;
    }

    // Find media that would be deleted
    const [usedMedia, expiredMedia, expiringMedia] = await Promise.all([
      // Used media (would be deleted)
      prisma.media.findMany({
        where: {
          ...baseWhere,
          isUsed: true,
        },
        select: {
          id: true,
          filename: true,
          url: true,
          usedAt: true,
          usedInPostId: true,
          company: {
            select: { name: true },
          },
        },
        orderBy: { usedAt: "desc" },
      }),
      // Expired media (would be deleted)
      prisma.media.findMany({
        where: {
          ...baseWhere,
          isUsed: false,
          expiresAt: {
            lt: now,
            not: undefined,
          },
        },
        select: {
          id: true,
          filename: true,
          url: true,
          expiresAt: true,
          company: {
            select: { name: true },
          },
        },
        orderBy: { expiresAt: "asc" },
      }),
      // Expiring soon (would get priority boost)
      prisma.media.findMany({
        where: {
          ...baseWhere,
          isUsed: false,
          expiresAt: {
            gt: now,
            lte: warningDate,
          },
        },
        select: {
          id: true,
          filename: true,
          url: true,
          expiresAt: true,
          priority: true,
          company: {
            select: { name: true },
          },
        },
        orderBy: { expiresAt: "asc" },
      }),
    ]);

    return NextResponse.json({
      preview: true,
      timestamp: now.toISOString(),
      wouldDelete: {
        used: usedMedia,
        expired: expiredMedia,
        totalCount: usedMedia.length + expiredMedia.length,
      },
      wouldPrioritize: {
        expiring: expiringMedia,
        count: expiringMedia.length,
      },
      note: "Use POST to actually run the cleanup",
    });
  } catch (error) {
    console.error("Failed to preview cleanup:", error);
    return NextResponse.json(
      { error: "Failed to preview cleanup" },
      { status: 500 }
    );
  }
}