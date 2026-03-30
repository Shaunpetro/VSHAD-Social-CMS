// apps/web/src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch single post by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const post = await prisma.generatedPost.findUnique({
      where: { id },
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

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

// PUT - Update a post (including metrics)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      content,
      title,
      hashtags,
      status,
      scheduledFor,
      publishedAt,
      topic,
      tone,
      platformId,
      mediaIds,
      // Engagement metrics
      likes,
      comments,
      shares,
      impressions,
    } = body;

    // Check if post exists
    const existingPost = await prisma.generatedPost.findUnique({
      where: { id },
      include: {
        postMedia: true,
        platform: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Content fields
    if (content !== undefined) updateData.content = content;
    if (title !== undefined) updateData.title = title;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (status !== undefined) updateData.status = status;
    if (scheduledFor !== undefined) {
      updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    }
    if (publishedAt !== undefined) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    }
    if (topic !== undefined) updateData.topic = topic;
    if (tone !== undefined) updateData.tone = tone;
    if (platformId !== undefined) updateData.platformId = platformId;

    // Engagement metrics (with validation)
    if (likes !== undefined) {
      const likesNum = parseInt(likes, 10);
      if (isNaN(likesNum) || likesNum < 0) {
        return NextResponse.json(
          { error: "Likes must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.likes = likesNum;
    }

    if (comments !== undefined) {
      const commentsNum = parseInt(comments, 10);
      if (isNaN(commentsNum) || commentsNum < 0) {
        return NextResponse.json(
          { error: "Comments must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.comments = commentsNum;
    }

    if (shares !== undefined) {
      const sharesNum = parseInt(shares, 10);
      if (isNaN(sharesNum) || sharesNum < 0) {
        return NextResponse.json(
          { error: "Shares must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.shares = sharesNum;
    }

    if (impressions !== undefined) {
      const impressionsNum = parseInt(impressions, 10);
      if (isNaN(impressionsNum) || impressionsNum < 0) {
        return NextResponse.json(
          { error: "Impressions must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.impressions = impressionsNum;
    }

    // Update iteration count if content changed
    if (content !== undefined && content !== existingPost.content) {
      updateData.iteration = existingPost.iteration + 1;
    }

    // Set publishedAt if status is changing to PUBLISHED
    const isBecomingPublished =
      status === "PUBLISHED" && existingPost.status !== "PUBLISHED";

    if (isBecomingPublished) {
      if (!updateData.publishedAt && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    // Update the post
    const updatedPost = await prisma.generatedPost.update({
      where: { id },
      data: updateData,
    });

    // Handle media updates if mediaIds provided
    if (mediaIds !== undefined) {
      // Remove existing media associations
      await prisma.postMedia.deleteMany({
        where: { postId: id },
      });

      // Create new media associations
      if (mediaIds.length > 0) {
        await prisma.postMedia.createMany({
          data: mediaIds.map((mediaId: string, index: number) => ({
            postId: id,
            mediaId,
            order: index,
          })),
        });
      }
    }

    // Fetch the updated post with relations
    const completePost = await prisma.generatedPost.findUnique({
      where: { id },
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

    return NextResponse.json({
      success: true,
      post: completePost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// PATCH - Partial update (optimized for metrics-only updates)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if post exists
    const existingPost = await prisma.generatedPost.findUnique({
      where: { id },
      include: {
        platform: true,
        postMedia: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Engagement metrics
    if (body.likes !== undefined) {
      const likesNum = parseInt(body.likes, 10);
      if (isNaN(likesNum) || likesNum < 0) {
        return NextResponse.json(
          { error: "Likes must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.likes = likesNum;
    }

    if (body.comments !== undefined) {
      const commentsNum = parseInt(body.comments, 10);
      if (isNaN(commentsNum) || commentsNum < 0) {
        return NextResponse.json(
          { error: "Comments must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.comments = commentsNum;
    }

    if (body.shares !== undefined) {
      const sharesNum = parseInt(body.shares, 10);
      if (isNaN(sharesNum) || sharesNum < 0) {
        return NextResponse.json(
          { error: "Shares must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.shares = sharesNum;
    }

    if (body.impressions !== undefined) {
      const impressionsNum = parseInt(body.impressions, 10);
      if (isNaN(impressionsNum) || impressionsNum < 0) {
        return NextResponse.json(
          { error: "Impressions must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.impressions = impressionsNum;
    }

    // Also allow status update via PATCH (for quick status changes)
    if (body.status !== undefined) {
      updateData.status = body.status;

      // Set publishedAt if marking as published
      if (body.status === "PUBLISHED" && existingPost.status !== "PUBLISHED") {
        if (!existingPost.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the post
    const updatedPost = await prisma.generatedPost.update({
      where: { id },
      data: updateData,
      include: {
        platform: true,
        company: true,
      },
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error patching post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE - Delete a post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if post exists
    const existingPost = await prisma.generatedPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete associated media links first (PostMedia)
    await prisma.postMedia.deleteMany({
      where: { postId: id },
    });

    // Delete the post
    await prisma.generatedPost.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}