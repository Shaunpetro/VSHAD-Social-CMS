import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.scheduledFor = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const posts = await prisma.generatedPost.findMany({
      where,
      include: {
        platform: true,
        postMedia: {
          include: {
            media: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts } = body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: "No posts provided" },
        { status: 400 }
      );
    }

    const createdPosts = [];

    for (const postData of posts) {
      const {
        companyId,
        platformId,
        content,
        title,
        hashtags,
        status,
        scheduledFor,
        topic,
        tone,
        generatedBy,
        isPartOfBulk,
        bulkScheduleId,
        mediaIds,
      } = postData;

      const post = await prisma.generatedPost.create({
        data: {
          companyId,
          platformId,
          content,
          title,
          hashtags: hashtags || [],
          status: status || "DRAFT",
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          topic,
          tone,
          generatedBy: generatedBy || "manual",
          isPartOfBulk: isPartOfBulk || false,
          bulkScheduleId,
        },
      });

      if (mediaIds && mediaIds.length > 0) {
        for (let i = 0; i < mediaIds.length; i++) {
          await prisma.postMedia.create({
            data: {
              postId: post.id,
              mediaId: mediaIds[i],
              order: i,
            },
          });
        }
      }

      createdPosts.push(post);
    }

    return NextResponse.json({
      success: true,
      count: createdPosts.length,
      posts: createdPosts,
    });
  } catch (error) {
    console.error("Error creating posts:", error);
    return NextResponse.json(
      { error: "Failed to create posts" },
      { status: 500 }
    );
  }
}