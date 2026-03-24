// apps/web/src/app/api/analytics/insights/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PostStatus } from "@prisma/client";
import {
  generateAnalyticsInsights,
  type AnalyticsData,
} from "@/lib/ai/generate-insights";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST handler - must be exported
export async function POST(request: NextRequest) {
  console.log("[Analytics Insights] Generating insights...");

  try {
    const body = await request.json();
    const { companyId, platformType, dateRange = "30d" } = body;

    // Calculate date range
    let startDate: Date | undefined;
    const endDate = new Date();

    switch (dateRange) {
      case "7d":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = undefined;
        break;
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: PostStatus.PUBLISHED,
    };

    if (companyId) {
      where.companyId = companyId;
    }

    if (startDate) {
      where.publishedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (platformType && platformType !== "all") {
      where.platform = { type: platformType };
    }

    // Fetch published posts
    const posts = await prisma.generatedPost.findMany({
      where,
      include: {
        platform: {
          select: {
            type: true,
            name: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 100,
    });

    if (posts.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No published posts found for the selected criteria.",
        insights: null,
      });
    }

    // Calculate summary
    const totals = posts.reduce(
      (acc, post) => ({
        likes: acc.likes + post.likes,
        comments: acc.comments + post.comments,
        shares: acc.shares + post.shares,
        impressions: acc.impressions + post.impressions,
      }),
      { likes: 0, comments: 0, shares: 0, impressions: 0 }
    );

    const totalEngagement = totals.likes + totals.comments + totals.shares;
    const engagementRate =
      totals.impressions > 0 ? (totalEngagement / totals.impressions) * 100 : 0;

    const summary = {
      totalPosts: posts.length,
      totalEngagement,
      engagementRate,
      totals,
      averages: {
        likesPerPost: posts.length > 0 ? totals.likes / posts.length : 0,
        commentsPerPost: posts.length > 0 ? totals.comments / posts.length : 0,
        sharesPerPost: posts.length > 0 ? totals.shares / posts.length : 0,
        impressionsPerPost: posts.length > 0 ? totals.impressions / posts.length : 0,
        engagementPerPost: posts.length > 0 ? totalEngagement / posts.length : 0,
      },
    };

    // Calculate by platform
    const byPlatform: Record<string, {
      posts: number;
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
      engagement: number;
      engagementRate: number;
    }> = {};

    for (const post of posts) {
      const pType = post.platform?.type ? String(post.platform.type) : "UNKNOWN";

      if (!byPlatform[pType]) {
        byPlatform[pType] = {
          posts: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          impressions: 0,
          engagement: 0,
          engagementRate: 0,
        };
      }

      byPlatform[pType].posts += 1;
      byPlatform[pType].likes += post.likes;
      byPlatform[pType].comments += post.comments;
      byPlatform[pType].shares += post.shares;
      byPlatform[pType].impressions += post.impressions;
      byPlatform[pType].engagement += post.likes + post.comments + post.shares;
    }

    for (const platform of Object.keys(byPlatform)) {
      const data = byPlatform[platform];
      data.engagementRate =
        data.impressions > 0 ? (data.engagement / data.impressions) * 100 : 0;
    }

    // Get top posts
    const topPosts = [...posts]
      .sort((a, b) => {
        const engA = a.likes + a.comments + a.shares;
        const engB = b.likes + b.comments + b.shares;
        return engB - engA;
      })
      .slice(0, 5)
      .map((post) => ({
        content: post.content,
        platform: post.platform?.type ? String(post.platform.type) : "UNKNOWN",
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        impressions: post.impressions,
        topic: post.topic,
        tone: post.tone,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      }));

    // Calculate timing
    const dayEngagement: Record<string, { total: number; count: number }> = {};
    const hourEngagement: Record<number, { total: number; count: number }> = {};

    for (const post of posts) {
      if (!post.publishedAt) continue;

      const day = post.publishedAt.toLocaleDateString("en-US", { weekday: "long" });
      const hour = post.publishedAt.getHours();
      const engagement = post.likes + post.comments + post.shares;

      if (!dayEngagement[day]) {
        dayEngagement[day] = { total: 0, count: 0 };
      }
      dayEngagement[day].total += engagement;
      dayEngagement[day].count += 1;

      if (!hourEngagement[hour]) {
        hourEngagement[hour] = { total: 0, count: 0 };
      }
      hourEngagement[hour].total += engagement;
      hourEngagement[hour].count += 1;
    }

    let bestDay: { day: string; avgEngagement: number } | undefined;
    let maxDayEng = 0;
    for (const [day, data] of Object.entries(dayEngagement)) {
      const avg = data.count > 0 ? data.total / data.count : 0;
      if (avg > maxDayEng) {
        maxDayEng = avg;
        bestDay = { day, avgEngagement: avg };
      }
    }

    const bestHours = Object.entries(hourEngagement)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        label: `${parseInt(hour).toString().padStart(2, "0")}:00`,
        avgEngagement: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3);

    // Build data for AI
    const analyticsData: AnalyticsData = {
      summary,
      byPlatform,
      topPosts,
      timing: {
        bestDay,
        bestHours,
      },
      companyName: posts[0]?.company?.name,
      dateRange,
    };

    // Generate insights
    const insights = await generateAnalyticsInsights(analyticsData);

    console.log("[Analytics Insights] Generated successfully");

    return NextResponse.json({
      success: true,
      insights,
      meta: {
        postsAnalyzed: posts.length,
        dateRange,
        generatedAt: insights.generatedAt,
      },
    });
  } catch (error) {
    console.error("[Analytics Insights] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}