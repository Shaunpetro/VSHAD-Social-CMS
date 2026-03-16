// apps/web/src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT - Update a post
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
      topic,
      tone,
      platformId,
      mediaIds,
    } = body;

    // Check if post exists
    const existingPost = await prisma.generatedPost.findUnique({
      where: { id },
      include: {
        postMedia: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (content !== undefined) updateData.content = content;
    if (title !== undefined) updateData.title = title;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (status !== undefined) updateData.status = status;
    if (scheduledFor !== undefined) {
      updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    }
    if (topic !== undefined) updateData.topic = topic;
    if (tone !== undefined) updateData.tone = tone;
    if (platformId !== undefined) updateData.platformId = platformId;

    // Update iteration count if content changed
    if (content !== undefined && content !== existingPost.content) {
      updateData.iteration = existingPost.iteration + 1;
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
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
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
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}