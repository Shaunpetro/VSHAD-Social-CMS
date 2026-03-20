// apps/web/src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSocialContent, regenerateContent } from "@/lib/ai/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      platformId,
      platform,
      topic,
      tone,
      includeHashtags,
      includeEmojis,
      regenerate,
      originalContent,
      feedback,
      useAnalytics = true, // NEW: Default to using analytics
    } = body;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    // Fetch company details for context
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        description: true,
        industry: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let generatedContent;

    if (regenerate && originalContent && feedback) {
      // Regenerate based on feedback (now with analytics)
      generatedContent = await regenerateContent(
        originalContent,
        feedback,
        platform,
        companyId,
        platformId
      );
    } else {
      // Generate new content (now with analytics)
      generatedContent = await generateSocialContent({
        companyId, // NEW: Pass companyId for analytics
        companyName: company.name,
        companyDescription: company.description || undefined,
        companyIndustry: company.industry || undefined,
        platform,
        platformId, // NEW: Pass platformId for platform-specific analytics
        topic: topic || undefined,
        tone: tone || "professional",
        includeHashtags: includeHashtags ?? true,
        includeEmojis: includeEmojis ?? false,
        useAnalytics, // NEW: Allow toggling analytics
      });
    }

    // Return generated content (not saved to DB yet - user can preview/edit first)
    return NextResponse.json({
      success: true,
      content: generatedContent,
      company: {
        id: company.id,
        name: company.name,
      },
      analyticsUsed: generatedContent.analyticsUsed ?? false, // NEW: Indicate if analytics were used
    });
  } catch (error) {
    console.error("Content generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Save generated content to database
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      platformId,
      content,
      hashtags,
      topic,
      tone,
      scheduledFor,
      status = "DRAFT",
    } = body;

    // Validate required fields
    if (!companyId || !platformId || !content) {
      return NextResponse.json(
        { error: "Company ID, Platform ID, and content are required" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify platform exists and belongs to company
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        companyId,
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: "Platform not found or does not belong to this company" },
        { status: 404 }
      );
    }

    // Create the generated post
    const post = await prisma.generatedPost.create({
      data: {
        companyId,
        platformId,
        content,
        hashtags: hashtags || [],
        topic: topic || null,
        tone: tone || null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
        status,
        generatedBy: "groq-llama-3.3",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Failed to save generated content:", error);
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    );
  }
}

// Get generated posts for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const platformId = searchParams.get("platformId");

    const where: Record<string, unknown> = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status;
    }

    if (platformId) {
      where.platformId = platformId;
    }

    const posts = await prisma.generatedPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch generated posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}