// apps/web/src/app/api/posts/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================
// METRICS AUTO-GENERATION (shared logic)
// ============================================

interface PlatformTuning {
  impressions: [number, number];
  engagementRate: [number, number];
  commentShareSplit: { comments: [number, number]; shares: [number, number] };
}

const PLATFORM_TUNING: Record<string, PlatformTuning> = {
  LINKEDIN: {
    impressions: [800, 6000],
    engagementRate: [0.02, 0.065],
    commentShareSplit: { comments: [0.08, 0.16], shares: [0.12, 0.22] },
  },
  INSTAGRAM: {
    impressions: [1200, 9000],
    engagementRate: [0.03, 0.11],
    commentShareSplit: { comments: [0.06, 0.14], shares: [0.06, 0.14] },
  },
  TWITTER: {
    impressions: [600, 7000],
    engagementRate: [0.01, 0.055],
    commentShareSplit: { comments: [0.05, 0.12], shares: [0.08, 0.18] },
  },
  FACEBOOK: {
    impressions: [700, 8000],
    engagementRate: [0.01, 0.05],
    commentShareSplit: { comments: [0.06, 0.14], shares: [0.06, 0.16] },
  },
  WORDPRESS: {
    impressions: [250, 4500],
    engagementRate: [0.006, 0.03],
    commentShareSplit: { comments: [0.03, 0.08], shares: [0.03, 0.08] },
  },
  UNKNOWN: {
    impressions: [400, 5000],
    engagementRate: [0.01, 0.05],
    commentShareSplit: { comments: [0.05, 0.14], shares: [0.05, 0.18] },
  },
};

function hashStringToSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clampInt(n: number, min: number, max: number): number {
  const x = Math.round(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function randFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

interface PostForMetrics {
  id: string;
  hashtags: string[];
  content: string;
  platform?: { type: string } | null;
  postMedia?: unknown[];
}

function generateRealisticMetrics(post: PostForMetrics): {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
} {
  const platformType = post.platform?.type?.toUpperCase() || "UNKNOWN";
  const tuning = PLATFORM_TUNING[platformType] || PLATFORM_TUNING.UNKNOWN;

  const seed = hashStringToSeed(post.id + "-metrics");
  const rng = mulberry32(seed);

  const [impMin, impMax] = tuning.impressions;
  const skew = Math.pow(rng(), 0.65);
  let impressions = impMin + skew * (impMax - impMin);

  const mediaCount = Array.isArray(post.postMedia) ? post.postMedia.length : 0;
  if (mediaCount > 0) {
    impressions *= 1 + Math.min(0.25, 0.08 * mediaCount);
  }

  const hashtagCount = Array.isArray(post.hashtags) ? post.hashtags.length : 0;
  if (hashtagCount > 0) {
    impressions *= 1 + Math.min(0.15, 0.02 * hashtagCount);
  }

  impressions = clampInt(impressions, 10, 2_000_000);

  const [erMin, erMax] = tuning.engagementRate;
  const engagementRate = randFloat(rng, erMin, erMax);
  const engagements = clampInt(impressions * engagementRate, 0, impressions);

  const [cMin, cMax] = tuning.commentShareSplit.comments;
  const [sMin, sMax] = tuning.commentShareSplit.shares;

  const commentsShare = randFloat(rng, cMin, cMax);
  const sharesShare = randFloat(rng, sMin, sMax);

  const totalNonLike = Math.min(0.6, commentsShare + sharesShare);
  const normalizedComments = commentsShare / (commentsShare + sharesShare || 1);
  const normalizedShares = sharesShare / (commentsShare + sharesShare || 1);

  let comments = clampInt(engagements * totalNonLike * normalizedComments, 0, engagements);
  let shares = clampInt(engagements * totalNonLike * normalizedShares, 0, engagements);
  let likes = clampInt(engagements - comments - shares, 0, engagements);

  const jitter = () => (rng() - 0.5) * 0.06;
  likes = clampInt(likes * (1 + jitter()), 0, impressions);
  comments = clampInt(comments * (1 + jitter()), 0, impressions);
  shares = clampInt(shares * (1 + jitter()), 0, impressions);

  const total = likes + comments + shares;
  if (total > impressions) {
    const scale = impressions / total;
    likes = clampInt(likes * scale, 0, impressions);
    comments = clampInt(comments * scale, 0, impressions);
    shares = clampInt(shares * scale, 0, impressions);
  }

  if (impressions > 0 && likes === 0 && comments === 0 && shares === 0) {
    likes = Math.max(1, clampInt(rng() * 3 + 1, 1, 5));
  }

  return { impressions, likes, comments, shares };
}

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
    let metricsSeededCount = 0;

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
        const autoSeedMetrics = data.autoSeedMetrics !== false; // Default true

        // If marking as PUBLISHED, handle auto-seed metrics
        if (newStatus === "PUBLISHED" && autoSeedMetrics) {
          // Fetch posts that need metrics
          const posts = await prisma.generatedPost.findMany({
            where: {
              id: { in: postIds },
              status: { not: "PUBLISHED" },
            },
            include: {
              platform: true,
              postMedia: true,
            },
          });

          // Update each post individually to handle metrics
          for (const post of posts) {
            const hasExistingMetrics =
              (post.impressions || 0) > 0 ||
              (post.likes || 0) > 0 ||
              (post.comments || 0) > 0 ||
              (post.shares || 0) > 0;

            const updateData: Record<string, unknown> = {
              status: newStatus,
              publishedAt: post.publishedAt || new Date(),
            };

            if (!hasExistingMetrics) {
              const metrics = generateRealisticMetrics({
                id: post.id,
                hashtags: post.hashtags || [],
                content: post.content,
                platform: post.platform,
                postMedia: post.postMedia,
              });

              updateData.impressions = metrics.impressions;
              updateData.likes = metrics.likes;
              updateData.comments = metrics.comments;
              updateData.shares = metrics.shares;

              metricsSeededCount++;
            }

            await prisma.generatedPost.update({
              where: { id: post.id },
              data: updateData,
            });

            updatedCount++;
          }
        } else {
          // Simple status change without metrics
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
        }
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
      metricsSeededCount,
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