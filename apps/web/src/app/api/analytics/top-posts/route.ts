// apps/web/src/app/api/analytics/top-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SortBy = "engagement" | "likes" | "comments" | "shares" | "impressions" | "engagementRate";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const platformId = searchParams.get("platformId");
    const platformType = searchParams.get("platformType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = (searchParams.get("sortBy") || "engagement") as SortBy;
    const topic = searchParams.get("topic");
    const tone = searchParams.get("tone");

    // Build where clause
    const where: any = {
      status: "PUBLISHED",
    };

    if (companyId) {
      where.companyId = companyId;
    }

    if (platformId) {
      where.platformId = platformId;
    }

    if (platformType) {
      where.platform = {
        type: platformType.toUpperCase(),
      };
    }

    if (topic) {
      where.topic = {
        contains: topic,
        mode: "insensitive",
      };
    }

    if (tone) {
      where.tone = {
        equals: tone,
        mode: "insensitive",
      };
    }

    // Date range filter
    if (startDate || endDate) {
      where.publishedAt = {};
      if (startDate) {
        where.publishedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.publishedAt.lte = new Date(endDate);
      }
    }

    // Fetch all published posts with metrics
    const posts = await prisma.generatedPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        hashtags: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        publishedAt: true,
        scheduledFor: true,
        topic: true,
        tone: true,
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        postMedia: {
          include: {
            media: {
              select: {
                id: true,
                url: true,
                thumbnailUrl: true,
                type: true,
                altText: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    // Calculate engagement metrics for each post
    const postsWithMetrics = posts.map((post) => {
      const totalEngagement = post.likes + post.comments + post.shares;
      const engagementRate = post.impressions > 0
        ? (totalEngagement / post.impressions) * 100
        : 0;

      return {
        ...post,
        metrics: {
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          impressions: post.impressions,
          totalEngagement,
          engagementRate: Math.round(engagementRate * 100) / 100,
        },
        media: post.postMedia.map((pm) => pm.media),
      };
    });

    // Sort based on sortBy parameter
    const sortedPosts = postsWithMetrics.sort((a, b) => {
      switch (sortBy) {
        case "likes":
          return b.likes - a.likes;
        case "comments":
          return b.comments - a.comments;
        case "shares":
          return b.shares - a.shares;
        case "impressions":
          return b.impressions - a.impressions;
        case "engagementRate":
          return b.metrics.engagementRate - a.metrics.engagementRate;
        case "engagement":
        default:
          return b.metrics.totalEngagement - a.metrics.totalEngagement;
      }
    });

    // Apply limit
    const topPosts = sortedPosts.slice(0, Math.min(limit, 50));

    // Calculate statistics about top posts
    const stats = {
      totalPostsAnalyzed: posts.length,
      returnedCount: topPosts.length,
      averageEngagement: topPosts.length > 0
        ? Math.round(
            topPosts.reduce((sum, p) => sum + p.metrics.totalEngagement, 0) / topPosts.length * 100
          ) / 100
        : 0,
      averageEngagementRate: topPosts.length > 0
        ? Math.round(
            topPosts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / topPosts.length * 100
          ) / 100
        : 0,
      topPlatform: getTopPlatform(topPosts),
      topTopic: getTopTopic(topPosts),
      topTone: getTopTone(topPosts),
      commonHashtags: getCommonHashtags(topPosts),
    };

    // Clean up response (remove redundant fields)
    const cleanedPosts = topPosts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      hashtags: post.hashtags,
      metrics: post.metrics,
      publishedAt: post.publishedAt,
      topic: post.topic,
      tone: post.tone,
      platform: post.platform,
      company: post.company,
      media: post.media,
    }));

    return NextResponse.json({
      posts: cleanedPosts,
      stats,
      filters: {
        companyId,
        platformId,
        platformType,
        startDate,
        endDate,
        limit,
        sortBy,
        topic,
        tone,
      },
    });
  } catch (error) {
    console.error("Error fetching top posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch top posts" },
      { status: 500 }
    );
  }
}

// Helper function to find most common platform in top posts
function getTopPlatform(posts: any[]): { type: string; count: number } | null {
  if (posts.length === 0) return null;

  const platformCounts: Record<string, number> = {};
  posts.forEach((post) => {
    const type = post.platform.type;
    platformCounts[type] = (platformCounts[type] || 0) + 1;
  });

  const sorted = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? { type: sorted[0][0], count: sorted[0][1] } : null;
}

// Helper function to find most common topic in top posts
function getTopTopic(posts: any[]): { topic: string; count: number } | null {
  const topicCounts: Record<string, number> = {};
  posts.forEach((post) => {
    if (post.topic) {
      topicCounts[post.topic] = (topicCounts[post.topic] || 0) + 1;
    }
  });

  const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? { topic: sorted[0][0], count: sorted[0][1] } : null;
}

// Helper function to find most common tone in top posts
function getTopTone(posts: any[]): { tone: string; count: number } | null {
  const toneCounts: Record<string, number> = {};
  posts.forEach((post) => {
    if (post.tone) {
      toneCounts[post.tone] = (toneCounts[post.tone] || 0) + 1;
    }
  });

  const sorted = Object.entries(toneCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? { tone: sorted[0][0], count: sorted[0][1] } : null;
}

// Helper function to find most common hashtags in top posts
function getCommonHashtags(posts: any[]): { hashtag: string; count: number }[] {
  const hashtagCounts: Record<string, number> = {};
  posts.forEach((post) => {
    if (post.hashtags && Array.isArray(post.hashtags)) {
      post.hashtags.forEach((tag: string) => {
        const normalizedTag = tag.toLowerCase().replace(/^#/, "");
        hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
      });
    }
  });

  return Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([hashtag, count]) => ({ hashtag, count }));
}