// apps/web/src/app/api/content/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSocialContent } from "@/lib/ai/openai";

// ═══════════════════════════════════════════════════════════════
// POST /api/content/generate
// Generate AI content for selected platforms
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, platformIds, scheduleDate, topic } = body;

    // ─────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────
    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    if (!platformIds || !Array.isArray(platformIds) || platformIds.length === 0) {
      return NextResponse.json(
        { error: "At least one platform ID is required" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Fetch company with platforms and settings
    // ─────────────────────────────────────────────────────────────
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        platforms: {
          where: {
            id: { in: platformIds },
            isConnected: true,
          },
        },
        contentSettings: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    if (company.platforms.length === 0) {
      return NextResponse.json(
        { error: "No connected platforms found for the selected IDs" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Get or create content settings
    // ─────────────────────────────────────────────────────────────
    let contentSettings = company.contentSettings;

    if (!contentSettings) {
      contentSettings = await prisma.contentSettings.create({
        data: {
          companyId: company.id,
          tone: "professional",
          topics: ["industry insights", "company updates"],
          keywords: [company.name.toLowerCase()],
          postFrequency: 7,
          includeHashtags: true,
          includeEmojis: false,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Generate content for each platform
    // ─────────────────────────────────────────────────────────────
    const generatedPosts = [];
    const errors = [];

    // Calculate schedule date (default: tomorrow at 9 AM)
    const scheduledFor = scheduleDate
      ? new Date(scheduleDate)
      : getDefaultScheduleDate();

    for (const platform of company.platforms) {
      try {
        console.log(`Generating content for ${platform.type}...`);

        const platformType = platform.type.toLowerCase() as
          | "linkedin"
          | "facebook"
          | "twitter"
          | "instagram"
          | "wordpress";

        // Use generateSocialContent with correct parameters
        const content = await generateSocialContent({
          companyName: company.name,
          companyDescription: company.description || undefined,
          companyIndustry: company.industry || undefined,
          platform: platformType,
          tone: contentSettings.tone as
            | "professional"
            | "casual"
            | "friendly"
            | "authoritative",
          topic: topic || contentSettings.topics[0] || undefined,
          includeHashtags: contentSettings.includeHashtags,
          includeEmojis: contentSettings.includeEmojis,
        });

        // Save to database
        const generatedPost = await prisma.generatedPost.create({
          data: {
            companyId: company.id,
            platformId: platform.id,
            title: null,
            content: content.content,
            hashtags: content.hashtags,
            scheduledFor: scheduledFor,
            status: "DRAFT",
            generatedBy: "groq-llama-3.3",
            topic: topic || contentSettings.topics[0] || null,
            tone: contentSettings.tone,
            prompt: `Generated for ${platform.type} | Tone: ${contentSettings.tone} | Topic: ${topic || contentSettings.topics[0] || "general"}`,
            iteration: 1,
          },
          include: {
            platform: true,
          },
        });

        generatedPosts.push(generatedPost);
        console.log(`✅ Content generated for ${platform.type}`);
      } catch (error) {
        console.error(`❌ Error generating content for ${platform.type}:`, error);
        errors.push({
          platformId: platform.id,
          platformType: platform.type,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Return results
    // ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      generatedPosts,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated ${generatedPosts.length} of ${company.platforms.length} posts`,
    });
  } catch (error) {
    console.error("Error in content generation:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate content",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /api/content/generate
// Fetch previously generated posts
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const posts = await prisma.generatedPost.findMany({
      where,
      include: {
        platform: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching generated posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch generated posts" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

function getDefaultScheduleDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 9 AM
  return tomorrow;
}