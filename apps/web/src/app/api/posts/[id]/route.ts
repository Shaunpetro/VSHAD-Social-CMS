// apps/web/src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// METRICS AUTO-GENERATION (for "Mark Published")
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

  // Base impressions with slight skew
  const [impMin, impMax] = tuning.impressions;
  const skew = Math.pow(rng(), 0.65);
  let impressions = impMin + skew * (impMax - impMin);

  // Boost for media
  const mediaCount = Array.isArray(post.postMedia) ? post.postMedia.length : 0;
  if (mediaCount > 0) {
    impressions *= 1 + Math.min(0.25, 0.08 * mediaCount);
  }

  // Boost for hashtags
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

  // Small jitter
  const jitter = () => (rng() - 0.5) * 0.06;
  likes = clampInt(likes * (1 + jitter()), 0, impressions);
  comments = clampInt(comments * (1 + jitter()), 0, impressions);
  shares = clampInt(shares * (1 + jitter()), 0, impressions);

  // Ensure totals don't exceed impressions
  const total = likes + comments + shares;
  if (total > impressions) {
    const scale = impressions / total;
    likes = clampInt(likes * scale, 0, impressions);
    comments = clampInt(comments * scale, 0, impressions);
    shares = clampInt(shares * scale, 0, impressions);
  }

  // Avoid all zeros
  if (impressions > 0 && likes === 0 && comments === 0 && shares === 0) {
    likes = Math.max(1, clampInt(rng() * 3 + 1, 1, 5));
  }

  return { impressions, likes, comments, shares };
}

// ============================================
// ROUTE HANDLERS
// ============================================

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
      // Auto-seed flag
      autoSeedMetrics = true,
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

    // AUTO-SEED METRICS: If status is changing to PUBLISHED and no metrics provided
    const isBecomingPublished =
      status === "PUBLISHED" && existingPost.status !== "PUBLISHED";

    if (isBecomingPublished) {
      // Set publishedAt if not provided
      if (!updateData.publishedAt && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }

      // Auto-seed metrics if enabled and no metrics provided
      const hasExistingMetrics =
        (existingPost.impressions || 0) > 0 ||
        (existingPost.likes || 0) > 0 ||
        (existingPost.comments || 0) > 0 ||
        (existingPost.shares || 0) > 0;

      const metricsProvided =
        likes !== undefined ||
        comments !== undefined ||
        shares !== undefined ||
        impressions !== undefined;

      if (autoSeedMetrics && !hasExistingMetrics && !metricsProvided) {
        const generatedMetrics = generateRealisticMetrics({
          id: existingPost.id,
          hashtags: existingPost.hashtags || [],
          content: existingPost.content,
          platform: existingPost.platform,
          postMedia: existingPost.postMedia,
        });

        updateData.impressions = generatedMetrics.impressions;
        updateData.likes = generatedMetrics.likes;
        updateData.comments = generatedMetrics.comments;
        updateData.shares = generatedMetrics.shares;
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
      metricsAutoSeeded: isBecomingPublished && !!(updateData.impressions),
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

    // Build update data - only metrics for PATCH
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
    }

    // AUTO-SEED METRICS: If marking as published
    const isBecomingPublished =
      body.status === "PUBLISHED" && existingPost.status !== "PUBLISHED";

    if (isBecomingPublished) {
      // Set publishedAt
      if (!existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }

      // Auto-seed metrics if none exist and none provided
      const hasExistingMetrics =
        (existingPost.impressions || 0) > 0 ||
        (existingPost.likes || 0) > 0 ||
        (existingPost.comments || 0) > 0 ||
        (existingPost.shares || 0) > 0;

      const metricsProvided =
        body.likes !== undefined ||
        body.comments !== undefined ||
        body.shares !== undefined ||
        body.impressions !== undefined;

      const autoSeedMetrics = body.autoSeedMetrics !== false; // Default true

      if (autoSeedMetrics && !hasExistingMetrics && !metricsProvided) {
        const generatedMetrics = generateRealisticMetrics({
          id: existingPost.id,
          hashtags: existingPost.hashtags || [],
          content: existingPost.content,
          platform: existingPost.platform,
          postMedia: existingPost.postMedia,
        });

        updateData.impressions = generatedMetrics.impressions;
        updateData.likes = generatedMetrics.likes;
        updateData.comments = generatedMetrics.comments;
        updateData.shares = generatedMetrics.shares;
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
      metricsAutoSeeded: isBecomingPublished && !!(updateData.impressions),
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