// apps/web/src/app/api/bulk-schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BulkScheduleStatus } from "@prisma/client";
import { generateSocialContent } from "@/lib/ai/openai";
import { generateTopicVariations, analyzeRecentPosts } from "@/lib/ai/topic-variations";

// Valid platform types that match the AI generator
type ValidPlatform = "linkedin" | "twitter" | "facebook" | "instagram" | "wordpress";
type ValidTone = "professional" | "casual" | "friendly" | "authoritative";

const VALID_PLATFORMS: ValidPlatform[] = ["linkedin", "twitter", "facebook", "instagram", "wordpress"];
const VALID_TONES: ValidTone[] = ["professional", "casual", "friendly", "authoritative"];

// Helper to normalize platform type
function normalizePlatform(platform: string): ValidPlatform | null {
  const normalized = platform.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "x") return "twitter";
  if (VALID_PLATFORMS.includes(normalized as ValidPlatform)) {
    return normalized as ValidPlatform;
  }
  return null;
}

// Helper to normalize tone
function normalizeTone(tone: string | undefined): ValidTone {
  if (!tone) return "professional";
  const normalized = tone.toLowerCase();
  if (VALID_TONES.includes(normalized as ValidTone)) {
    return normalized as ValidTone;
  }
  return "professional";
}

// ═══════════════════════════════════════════════════════════════
// MEDIA DISTRIBUTION HELPERS
// ═══════════════════════════════════════════════════════════════

interface MediaItem {
  id: string;
  type: string;
  url: string;
  filename: string;
}

/**
 * Distributes media across posts with smart randomization
 */
function distributeMedia(
  postsCount: number,
  userSelectedMedia: MediaItem[],
  libraryMedia: MediaItem[],
  options: {
    mediaPerPost: number;
    allowReuse: boolean;
    preferImages: boolean;
  } = { mediaPerPost: 1, allowReuse: true, preferImages: true }
): Array<MediaItem[]> {
  const { mediaPerPost, allowReuse, preferImages } = options;
  
  let availableMedia = [...userSelectedMedia];
  
  if (allowReuse || availableMedia.length < postsCount * mediaPerPost) {
    const selectedIds = new Set(userSelectedMedia.map(m => m.id));
    const additionalMedia = libraryMedia.filter(m => !selectedIds.has(m.id));
    availableMedia = [...availableMedia, ...additionalMedia];
  }

  if (preferImages) {
    availableMedia.sort((a, b) => {
      const aIsImage = a.type === "IMAGE" || a.type?.startsWith("image/");
      const bIsImage = b.type === "IMAGE" || b.type?.startsWith("image/");
      if (aIsImage && !bIsImage) return -1;
      if (!aIsImage && bIsImage) return 1;
      return 0;
    });
  }

  if (availableMedia.length === 0) {
    return Array(postsCount).fill([]);
  }

  const distribution: Array<MediaItem[]> = [];
  const usedRecently: string[] = [];
  const recentWindow = Math.min(3, Math.floor(availableMedia.length / 2));

  for (let i = 0; i < postsCount; i++) {
    const postMedia: MediaItem[] = [];
    
    let candidates = availableMedia.filter(m => !usedRecently.includes(m.id));
    
    if (candidates.length === 0) {
      candidates = [...availableMedia];
      candidates.sort(() => Math.random() - 0.5);
    }

    for (let j = 0; j < mediaPerPost && candidates.length > 0; j++) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const selected = candidates[randomIndex];
      
      postMedia.push(selected);
      candidates.splice(randomIndex, 1);
      
      usedRecently.push(selected.id);
      if (usedRecently.length > recentWindow) {
        usedRecently.shift();
      }
    }

    distribution.push(postMedia);
  }

  return distribution;
}

/**
 * Fetches media from company library with optional filtering
 */
async function fetchCompanyMedia(
  companyId: string,
  options: {
    limit?: number;
    types?: string[];
    excludeIds?: string[];
  } = {}
): Promise<MediaItem[]> {
  const { limit = 50, types, excludeIds = [] } = options;

  const where: Record<string, unknown> = { companyId };
  
  if (types && types.length > 0) {
    where.type = { in: types };
  }
  
  if (excludeIds.length > 0) {
    where.id = { notIn: excludeIds };
  }

  const media = await prisma.media.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      url: true,
      filename: true,
    },
  });

  return media.map(m => ({
    id: m.id,
    type: m.type,
    url: m.url,
    filename: m.filename,
  }));
}

// ═══════════════════════════════════════════════════════════════
// GET HANDLER
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const bulkSchedules = await prisma.bulkSchedule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bulkSchedules);
  } catch (error) {
    console.error("Error fetching bulk schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch bulk schedules" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST HANDLER
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      name,
      startDate,
      endDate,
      postsCount,
      timesPerDay,
      platforms,
      topic,
      tone,
      includeHashtags,
      includeEmojis,
      mediaIds = [],
      autoSelectMedia = true,
      mediaPerPost = 1,
      preferImages = true,
    } = body;

    // ═══════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════
    if (!companyId || !startDate || !endDate || !postsCount) {
      return NextResponse.json(
        { error: "Missing required fields: companyId, startDate, endDate, postsCount" },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: "At least one platform is required" },
        { status: 400 }
      );
    }

    if (!timesPerDay || !Array.isArray(timesPerDay) || timesPerDay.length === 0) {
      return NextResponse.json(
        { error: "At least one posting time is required" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // FETCH COMPANY & PLATFORMS
    // ═══════════════════════════════════════════════════════════════
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const allPlatformRecords = await prisma.platform.findMany({
      where: { companyId },
    });

    if (allPlatformRecords.length === 0) {
      return NextResponse.json(
        { error: "No platforms configured for this company" },
        { status: 400 }
      );
    }

    // Match requested platforms to database records
    const matchedPlatforms: Array<{
      record: typeof allPlatformRecords[0];
      normalizedType: ValidPlatform;
    }> = [];

    for (const requestedPlatform of platforms) {
      const normalizedType = normalizePlatform(requestedPlatform);
      if (!normalizedType) continue;

      const record = allPlatformRecords.find((p) => {
        const dbType = (p.type || "").toLowerCase();
        return dbType === normalizedType || dbType === requestedPlatform.toLowerCase();
      });

      if (record) {
        matchedPlatforms.push({ record, normalizedType });
      }
    }

    if (matchedPlatforms.length === 0) {
      return NextResponse.json(
        { error: `No matching platforms found. Requested: ${platforms.join(", ")}` },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // FETCH & PREPARE MEDIA
    // ═══════════════════════════════════════════════════════════════
    console.log(`🖼️ Preparing media for ${postsCount} posts...`);

    let userSelectedMedia: MediaItem[] = [];
    if (mediaIds && mediaIds.length > 0) {
      const selectedMedia = await prisma.media.findMany({
        where: {
          id: { in: mediaIds },
          companyId,
        },
        select: {
          id: true,
          type: true,
          url: true,
          filename: true,
        },
      });
      userSelectedMedia = selectedMedia.map(m => ({
        id: m.id,
        type: m.type,
        url: m.url,
        filename: m.filename,
      }));
      console.log(`  ✓ User selected ${userSelectedMedia.length} media items`);
    }

    let libraryMedia: MediaItem[] = [];
    if (autoSelectMedia) {
      libraryMedia = await fetchCompanyMedia(companyId, {
        limit: Math.max(50, postsCount * 2),
        excludeIds: mediaIds,
        types: preferImages ? ["IMAGE"] : undefined,
      });
      
      if (preferImages && libraryMedia.length < postsCount) {
        const additionalMedia = await fetchCompanyMedia(companyId, {
          limit: postsCount,
          excludeIds: [...mediaIds, ...libraryMedia.map(m => m.id)],
        });
        libraryMedia = [...libraryMedia, ...additionalMedia];
      }
      
      console.log(`  ✓ Library has ${libraryMedia.length} additional media items`);
    }

    const mediaDistribution = distributeMedia(
      postsCount,
      userSelectedMedia,
      libraryMedia,
      {
        mediaPerPost: Math.min(4, Math.max(1, mediaPerPost)),
        allowReuse: true,
        preferImages,
      }
    );

    const totalMediaToUse = mediaDistribution.flat().length;
    console.log(`  ✓ Distributed ${totalMediaToUse} media items across ${postsCount} posts`);

    // ═══════════════════════════════════════════════════════════════
    // ANALYZE PREVIOUS POSTS (Last 7 Days)
    // ═══════════════════════════════════════════════════════════════
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = await prisma.generatedPost.findMany({
      where: {
        companyId,
        createdAt: { gte: sevenDaysAgo },
        status: { in: ["PUBLISHED", "SCHEDULED"] },
      },
      include: {
        platform: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    let previousAnalysis = null;
    if (recentPosts.length > 0) {
      console.log(`📊 Analyzing ${recentPosts.length} recent posts for optimization...`);
      previousAnalysis = await analyzeRecentPosts(
        recentPosts.map((p) => ({
          content: p.content,
          topic: p.topic,
          tone: p.tone,
          hashtags: p.hashtags || [],
          status: p.status,
          platform: p.platform,
          createdAt: p.createdAt,
        }))
      );
    } else {
      console.log("📊 No recent posts found - creating fresh content baseline");
    }

    // ═══════════════════════════════════════════════════════════════
    // GENERATE TOPIC VARIATIONS
    // ═══════════════════════════════════════════════════════════════
    console.log(`🎯 Generating ${postsCount} unique topic variations...`);

    const topicVariations = await generateTopicVariations({
      mainTopic: topic || "company updates and industry insights",
      companyName: company.name,
      companyIndustry: company.industry || "",
      companyDescription: company.description || "",
      numberOfVariations: postsCount,
      platforms: matchedPlatforms.map((p) => p.normalizedType),
      tone: tone || "professional",
      previousAnalysis,
    });

    console.log(`✅ Generated ${topicVariations.length} unique variations`);

    // ═══════════════════════════════════════════════════════════════
    // CREATE BULK SCHEDULE RECORD
    // ═══════════════════════════════════════════════════════════════
    const bulkSchedule = await prisma.bulkSchedule.create({
      data: {
        companyId,
        name: name || `Bulk: ${topic || "Content Calendar"} (${new Date().toLocaleDateString()})`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        postsCount,
        timesPerDay: timesPerDay || [],
        platforms: platforms || [],
        status: BulkScheduleStatus.ACTIVE,
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // CALCULATE SCHEDULE SLOTS
    // ═══════════════════════════════════════════════════════════════
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const scheduleSlots: Array<{ date: Date; variationIndex: number }> = [];
    const currentDate = new Date(start);
    let variationIndex = 0;

    while (currentDate <= end && scheduleSlots.length < postsCount) {
      for (const time of timesPerDay) {
        if (scheduleSlots.length >= postsCount) break;

        const [hours, minutes] = time.split(":").map(Number);
        const slotDate = new Date(currentDate);
        slotDate.setHours(hours, minutes, 0, 0);

        if (slotDate > now) {
          scheduleSlots.push({
            date: slotDate,
            variationIndex: variationIndex % topicVariations.length,
          });
          variationIndex++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (scheduleSlots.length === 0) {
      await prisma.bulkSchedule.delete({ where: { id: bulkSchedule.id } });
      return NextResponse.json(
        { error: "No valid future time slots available in the selected date range" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // GENERATE & CREATE POSTS FOR EACH SLOT
    // ═══════════════════════════════════════════════════════════════
    const createdPosts = [];
    const errors: string[] = [];
    const normalizedTone = normalizeTone(tone);

    console.log(`📝 Creating ${scheduleSlots.length} unique posts with media...`);

    for (let i = 0; i < scheduleSlots.length; i++) {
      const slot = scheduleSlots[i];
      const variation = topicVariations[slot.variationIndex];
      const postMedia = mediaDistribution[i] || [];

      const targetPlatformType =
        normalizePlatform(variation.targetPlatform) ||
        matchedPlatforms[i % matchedPlatforms.length].normalizedType;

      const platformRecord =
        matchedPlatforms.find((p) => p.normalizedType === targetPlatformType)?.record ||
        matchedPlatforms[i % matchedPlatforms.length].record;

      try {
        const enhancedTopic = `${variation.title}

ANGLE: ${variation.angle}
KEY POINTS TO COVER:
${variation.keyPoints.map((p, idx) => `${idx + 1}. ${p}`).join("\n")}

CONTENT TYPE: ${variation.contentType}
SUGGESTED HASHTAGS: ${variation.suggestedHashtags.join(", ")}
${postMedia.length > 0 ? `\nNOTE: This post will include ${postMedia.length} image(s), so reference visual content naturally if appropriate.` : ""}`;

        const generated = await generateSocialContent({
          companyName: company.name,
          companyDescription: company.description || undefined,
          companyIndustry: company.industry || undefined,
          platform: targetPlatformType,
          topic: enhancedTopic,
          tone: normalizedTone,
          includeHashtags: includeHashtags !== false,
          includeEmojis: includeEmojis === true,
        });

        const combinedHashtags = [
          ...new Set([...(generated.hashtags || []), ...variation.suggestedHashtags]),
        ].slice(0, 10);

        const post = await prisma.generatedPost.create({
          data: {
            companyId,
            platformId: platformRecord.id,
            content: generated.content,
            hashtags: combinedHashtags,
            status: "SCHEDULED",
            scheduledFor: slot.date,
            topic: variation.title,
            tone: normalizedTone,
            generatedBy: "groq-llama-3.3",
            isPartOfBulk: true,
            bulkScheduleId: bulkSchedule.id,
            iteration: 1,
            prompt: JSON.stringify({
              mainTopic: topic,
              angle: variation.angle,
              contentType: variation.contentType,
              keyPoints: variation.keyPoints,
              mediaCount: postMedia.length,
            }),
          },
        });

        if (postMedia.length > 0) {
          await prisma.postMedia.createMany({
            data: postMedia.map((media, order) => ({
              postId: post.id,
              mediaId: media.id,
              order,
            })),
          });
        }

        createdPosts.push({
          ...post,
          variationAngle: variation.angle,
          contentType: variation.contentType,
          mediaCount: postMedia.length,
        });

        console.log(
          `  ✓ Post ${i + 1}/${scheduleSlots.length}: "${variation.title.substring(0, 40)}..." (${postMedia.length} media)`
        );

        if (i < scheduleSlots.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (genError) {
        console.error(`  ✗ Failed post ${i + 1}:`, genError);
        errors.push(
          `Post ${i + 1} (${variation.title}): ${genError instanceof Error ? genError.message : "Unknown error"}`
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // UPDATE BULK SCHEDULE & RETURN RESPONSE
    // ═══════════════════════════════════════════════════════════════
    await prisma.bulkSchedule.update({
      where: { id: bulkSchedule.id },
      data: {
        postsCount: createdPosts.length,
        status: createdPosts.length > 0 ? BulkScheduleStatus.ACTIVE : BulkScheduleStatus.FAILED,
      },
    });

    if (createdPosts.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to create any posts",
          details: errors,
          bulkScheduleId: bulkSchedule.id,
        },
        { status: 500 }
      );
    }

    const contentTypeSummary = createdPosts.reduce((acc, post) => {
      const type = post.contentType || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mediaStats = {
      totalMediaUsed: createdPosts.reduce((sum, p) => sum + (p.mediaCount || 0), 0),
      postsWithMedia: createdPosts.filter((p) => (p.mediaCount || 0) > 0).length,
      postsWithoutMedia: createdPosts.filter((p) => (p.mediaCount || 0) === 0).length,
    };

    return NextResponse.json({
      success: true,
      bulkScheduleId: bulkSchedule.id,
      requestedCount: postsCount,
      scheduledCount: createdPosts.length,
      message: `Successfully scheduled ${createdPosts.length} unique posts`,
      summary: {
        contentTypes: contentTypeSummary,
        media: mediaStats,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        platforms: matchedPlatforms.map((p) => p.normalizedType),
        analyzedPreviousPosts: recentPosts.length,
      },
      ...(errors.length > 0 && { warnings: errors }),
    });
  } catch (error) {
    console.error("Error creating bulk schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to create bulk schedule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}