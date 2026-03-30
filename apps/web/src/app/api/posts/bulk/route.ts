// apps/web/src/app/api/posts/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ============================================
// BULK OPERATIONS
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { postIds, action, data } = body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { error: "postIds array is required" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    let deletedCount = 0;

    switch (action) {
      case "reschedule": {
        if (!data?.scheduledFor) {
          return NextResponse.json(
            { error: "scheduledFor is required for reschedule action" },
            { status: 400 }
          );
        }

        const scheduledDate = new Date(data.scheduledFor);

        await prisma.generatedPost.updateMany({
          where: {
            id: { in: postIds },
            status: { notIn: ["PUBLISHED", "PUBLISHING"] },
          },
          data: {
            scheduledFor: scheduledDate,
            status: "SCHEDULED",
          },
        });

        updatedCount = postIds.length;
        break;
      }

      case "changeStatus": {
        if (!data?.status) {
          return NextResponse.json(
            { error: "status is required for changeStatus action" },
            { status: 400 }
          );
        }

        const newStatus = data.status;

        const updateData: Record<string, unknown> = {
          status: newStatus,
        };

        // Set publishedAt if marking as published
        if (newStatus === "PUBLISHED") {
          updateData.publishedAt = new Date();
        }

        await prisma.generatedPost.updateMany({
          where: {
            id: { in: postIds },
          },
          data: updateData,
        });

        updatedCount = postIds.length;
        break;
      }

      case "delete": {
        // First delete associated PostMedia records
        await prisma.postMedia.deleteMany({
          where: {
            postId: { in: postIds },
          },
        });

        // Then delete the posts
        const result = await prisma.generatedPost.deleteMany({
          where: {
            id: { in: postIds },
          },
        });

        deletedCount = result.count;
        break;
      }

      case "archive": {
        await prisma.generatedPost.updateMany({
          where: {
            id: { in: postIds },
          },
          data: {
            status: "ARCHIVED",
          },
        });

        updatedCount = postIds.length;
        break;
      }

      case "duplicate": {
        // Fetch original posts
        const originalPosts = await prisma.generatedPost.findMany({
          where: {
            id: { in: postIds },
          },
          include: {
            postMedia: true,
          },
        });

        // Create duplicates
        for (const post of originalPosts) {
          const newPost = await prisma.generatedPost.create({
            data: {
              companyId: post.companyId,
              platformId: post.platformId,
              title: post.title ? `${post.title} (Copy)` : null,
              content: post.content,
              hashtags: post.hashtags,
              status: "DRAFT",
              topic: post.topic,
              tone: post.tone,
              generatedBy: post.generatedBy,
              prompt: post.prompt,
              iteration: 1,
              // Reset metrics for duplicates
              likes: 0,
              comments: 0,
              shares: 0,
              impressions: 0,
            },
          });

          // Copy media associations
          if (post.postMedia && post.postMedia.length > 0) {
            await prisma.postMedia.createMany({
              data: post.postMedia.map((pm) => ({
                postId: newPost.id,
                mediaId: pm.mediaId,
                order: pm.order,
              })),
            });
          }

          updatedCount++;
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      updatedCount,
      deletedCount,
      message: `Bulk ${action} completed successfully`,
    });
  } catch (error) {
    console.error("Bulk operation failed:", error);
    return NextResponse.json(
      {
        error: "Bulk operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET - Get multiple posts by IDs (useful for bulk preview)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postIds } = body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { error: "postIds array is required" },
        { status: 400 }
      );
    }

    const posts = await prisma.generatedPost.findMany({
      where: {
        id: { in: postIds },
      },
      include: {
        platform: true,
        company: true,
        postMedia: {
          include: {
            media: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}