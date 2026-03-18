// apps/web/src/app/api/analytics/bulk-update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface MetricsUpdate {
  postId: string;
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
}

interface BulkUpdateRequest {
  updates: MetricsUpdate[];
  mode?: "set" | "increment"; // set = replace values, increment = add to existing
}

export async function PUT(request: NextRequest) {
  try {
    const body: BulkUpdateRequest = await request.json();
    const { updates, mode = "set" } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided. Expected { updates: [{ postId, likes, comments, shares, impressions }] }" },
        { status: 400 }
      );
    }

    // Validate all post IDs exist
    const postIds = updates.map((u) => u.postId);
    const existingPosts = await prisma.generatedPost.findMany({
      where: { id: { in: postIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingPosts.map((p) => p.id));
    const missingIds = postIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { 
          error: "Some posts not found", 
          missingIds,
          hint: "Remove missing IDs from updates array and retry"
        },
        { status: 404 }
      );
    }

    // Process updates
    const results: {
      success: string[];
      failed: { postId: string; error: string }[];
    } = {
      success: [],
      failed: [],
    };

    for (const update of updates) {
      try {
        if (mode === "increment") {
          // Increment mode: add to existing values
          await prisma.generatedPost.update({
            where: { id: update.postId },
            data: {
              likes: update.likes !== undefined
                ? { increment: Math.max(0, update.likes) }
                : undefined,
              comments: update.comments !== undefined
                ? { increment: Math.max(0, update.comments) }
                : undefined,
              shares: update.shares !== undefined
                ? { increment: Math.max(0, update.shares) }
                : undefined,
              impressions: update.impressions !== undefined
                ? { increment: Math.max(0, update.impressions) }
                : undefined,
            },
          });
        } else {
          // Set mode: replace values
          const updateData: {
            likes?: number;
            comments?: number;
            shares?: number;
            impressions?: number;
          } = {};

          if (update.likes !== undefined) {
            updateData.likes = Math.max(0, update.likes);
          }
          if (update.comments !== undefined) {
            updateData.comments = Math.max(0, update.comments);
          }
          if (update.shares !== undefined) {
            updateData.shares = Math.max(0, update.shares);
          }
          if (update.impressions !== undefined) {
            updateData.impressions = Math.max(0, update.impressions);
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.generatedPost.update({
              where: { id: update.postId },
              data: updateData,
            });
          }
        }

        results.success.push(update.postId);
      } catch (error) {
        results.failed.push({
          postId: update.postId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Fetch updated metrics for successful posts
    const updatedPosts = await prisma.generatedPost.findMany({
      where: { id: { in: results.success } },
      select: {
        id: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        platform: {
          select: {
            type: true,
            name: true,
          },
        },
      },
    });

    // Calculate summary stats
    const summary = updatedPosts.reduce(
      (acc, post) => ({
        totalLikes: acc.totalLikes + post.likes,
        totalComments: acc.totalComments + post.comments,
        totalShares: acc.totalShares + post.shares,
        totalImpressions: acc.totalImpressions + post.impressions,
      }),
      { totalLikes: 0, totalComments: 0, totalShares: 0, totalImpressions: 0 }
    );

    return NextResponse.json({
      success: true,
      mode,
      results: {
        updated: results.success.length,
        failed: results.failed.length,
        total: updates.length,
      },
      failedDetails: results.failed.length > 0 ? results.failed : undefined,
      updatedPosts,
      summary,
    });
  } catch (error) {
    console.error("Error in bulk metrics update:", error);
    return NextResponse.json(
      { error: "Failed to update metrics" },
      { status: 500 }
    );
  }
}

// POST - Import metrics from external source (e.g., CSV data or API sync)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, platformType, metricsData } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    if (!metricsData || !Array.isArray(metricsData)) {
      return NextResponse.json(
        { error: "metricsData array is required" },
        { status: 400 }
      );
    }

    // Build where clause to find matching posts
    const where: any = {
      companyId,
      status: "PUBLISHED",
    };

    if (platformType) {
      where.platform = {
        type: platformType.toUpperCase(),
      };
    }

    // Fetch all published posts for this company
    const posts = await prisma.generatedPost.findMany({
      where,
      select: {
        id: true,
        content: true,
        publishedAt: true,
        platform: {
          select: {
            type: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // Match metrics data to posts
    // metricsData should have format: [{ content: "...", likes: 10, ... }] or [{ publishedAt: "...", likes: 10, ... }]
    const updates: MetricsUpdate[] = [];
    const unmatched: any[] = [];

    for (const metric of metricsData) {
      let matchedPost = null;

      // Try to match by content (first 100 chars)
      if (metric.content) {
        const contentStart = metric.content.substring(0, 100).toLowerCase();
        matchedPost = posts.find((p) => 
          p.content.substring(0, 100).toLowerCase() === contentStart
        );
      }

      // Try to match by publishedAt date
      if (!matchedPost && metric.publishedAt) {
        const targetDate = new Date(metric.publishedAt);
        matchedPost = posts.find((p) => {
          if (!p.publishedAt) return false;
          const postDate = new Date(p.publishedAt);
          // Match within 1 minute
          return Math.abs(postDate.getTime() - targetDate.getTime()) < 60000;
        });
      }

      // Try to match by postId directly
      if (!matchedPost && metric.postId) {
        matchedPost = posts.find((p) => p.id === metric.postId);
      }

      if (matchedPost) {
        updates.push({
          postId: matchedPost.id,
          likes: metric.likes,
          comments: metric.comments,
          shares: metric.shares,
          impressions: metric.impressions,
        });
      } else {
        unmatched.push(metric);
      }
    }

    // Apply updates
    let updatedCount = 0;
    for (const update of updates) {
      try {
        const updateData: any = {};
        if (update.likes !== undefined) updateData.likes = Math.max(0, update.likes);
        if (update.comments !== undefined) updateData.comments = Math.max(0, update.comments);
        if (update.shares !== undefined) updateData.shares = Math.max(0, update.shares);
        if (update.impressions !== undefined) updateData.impressions = Math.max(0, update.impressions);

        if (Object.keys(updateData).length > 0) {
          await prisma.generatedPost.update({
            where: { id: update.postId },
            data: updateData,
          });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Failed to update post ${update.postId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        matched: updates.length,
        updated: updatedCount,
        unmatched: unmatched.length,
        total: metricsData.length,
      },
      unmatchedData: unmatched.length > 0 ? unmatched.slice(0, 10) : undefined, // Return first 10 unmatched
      hint: unmatched.length > 0 
        ? "Unmatched entries could not be linked to existing posts. Ensure content or publishedAt matches."
        : undefined,
    });
  } catch (error) {
    console.error("Error importing metrics:", error);
    return NextResponse.json(
      { error: "Failed to import metrics" },
      { status: 500 }
    );
  }
}