// apps/web/src/app/api/posts/[id]/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch metrics for a single post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const post = await prisma.generatedPost.findUnique({
      where: { id },
      select: {
        id: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        status: true,
        publishedAt: true,
        content: true,
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
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

    // Calculate engagement rate
    const totalEngagement = post.likes + post.comments + post.shares;
    const engagementRate = post.impressions > 0 
      ? ((totalEngagement / post.impressions) * 100).toFixed(2)
      : "0.00";

    return NextResponse.json({
      id: post.id,
      metrics: {
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        impressions: post.impressions,
        totalEngagement,
        engagementRate: parseFloat(engagementRate),
      },
      status: post.status,
      publishedAt: post.publishedAt,
      platform: post.platform,
      contentPreview: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
    });
  } catch (error) {
    console.error("Error fetching post metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch post metrics" },
      { status: 500 }
    );
  }
}

// PUT - Update metrics for a single post
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { likes, comments, shares, impressions } = body;

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

    // Build update data - only update provided fields
    const updateData: {
      likes?: number;
      comments?: number;
      shares?: number;
      impressions?: number;
    } = {};

    if (likes !== undefined) updateData.likes = Math.max(0, parseInt(likes) || 0);
    if (comments !== undefined) updateData.comments = Math.max(0, parseInt(comments) || 0);
    if (shares !== undefined) updateData.shares = Math.max(0, parseInt(shares) || 0);
    if (impressions !== undefined) updateData.impressions = Math.max(0, parseInt(impressions) || 0);

    // Update the post metrics
    const updatedPost = await prisma.generatedPost.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        status: true,
        publishedAt: true,
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
          },
        },
      },
    });

    // Calculate engagement rate
    const totalEngagement = updatedPost.likes + updatedPost.comments + updatedPost.shares;
    const engagementRate = updatedPost.impressions > 0
      ? ((totalEngagement / updatedPost.impressions) * 100).toFixed(2)
      : "0.00";

    return NextResponse.json({
      success: true,
      id: updatedPost.id,
      metrics: {
        likes: updatedPost.likes,
        comments: updatedPost.comments,
        shares: updatedPost.shares,
        impressions: updatedPost.impressions,
        totalEngagement,
        engagementRate: parseFloat(engagementRate),
      },
      platform: updatedPost.platform,
    });
  } catch (error) {
    console.error("Error updating post metrics:", error);
    return NextResponse.json(
      { error: "Failed to update post metrics" },
      { status: 500 }
    );
  }
}

// PATCH - Increment metrics (useful for real-time updates)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { likes, comments, shares, impressions } = body;

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

    // Increment values (can be positive or negative)
    const updatedPost = await prisma.generatedPost.update({
      where: { id },
      data: {
        likes: likes !== undefined 
          ? { increment: parseInt(likes) || 0 }
          : undefined,
        comments: comments !== undefined 
          ? { increment: parseInt(comments) || 0 }
          : undefined,
        shares: shares !== undefined 
          ? { increment: parseInt(shares) || 0 }
          : undefined,
        impressions: impressions !== undefined 
          ? { increment: parseInt(impressions) || 0 }
          : undefined,
      },
      select: {
        id: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
      },
    });

    // Ensure no negative values
    const needsCorrection = 
      updatedPost.likes < 0 || 
      updatedPost.comments < 0 || 
      updatedPost.shares < 0 || 
      updatedPost.impressions < 0;

    if (needsCorrection) {
      const correctedPost = await prisma.generatedPost.update({
        where: { id },
        data: {
          likes: Math.max(0, updatedPost.likes),
          comments: Math.max(0, updatedPost.comments),
          shares: Math.max(0, updatedPost.shares),
          impressions: Math.max(0, updatedPost.impressions),
        },
        select: {
          id: true,
          likes: true,
          comments: true,
          shares: true,
          impressions: true,
        },
      });

      return NextResponse.json({
        success: true,
        metrics: correctedPost,
      });
    }

    return NextResponse.json({
      success: true,
      metrics: updatedPost,
    });
  } catch (error) {
    console.error("Error incrementing post metrics:", error);
    return NextResponse.json(
      { error: "Failed to increment post metrics" },
      { status: 500 }
    );
  }
}