// apps/web/src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const platformId = searchParams.get("platformId");
    const platformType = searchParams.get("platformType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};

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

    // Default to published posts for analytics (most meaningful)
    if (status) {
      where.status = status;
    } else {
      where.status = "PUBLISHED";
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

    // Fetch posts with metrics
    const posts = await prisma.generatedPost.findMany({
      where,
      select: {
        id: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        publishedAt: true,
        scheduledFor: true,
        status: true,
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
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // Calculate aggregated metrics
    const totalPosts = posts.length;
    
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

    // Calculate averages
    const averages = {
      likesPerPost: totalPosts > 0 ? Math.round((totals.likes / totalPosts) * 100) / 100 : 0,
      commentsPerPost: totalPosts > 0 ? Math.round((totals.comments / totalPosts) * 100) / 100 : 0,
      sharesPerPost: totalPosts > 0 ? Math.round((totals.shares / totalPosts) * 100) / 100 : 0,
      impressionsPerPost: totalPosts > 0 ? Math.round((totals.impressions / totalPosts) * 100) / 100 : 0,
      engagementPerPost: totalPosts > 0 ? Math.round((totalEngagement / totalPosts) * 100) / 100 : 0,
    };

    // Calculate engagement rate
    const engagementRate = totals.impressions > 0
      ? Math.round((totalEngagement / totals.impressions) * 10000) / 100
      : 0;

    // Group by platform type
    const byPlatform: Record<string, {
      posts: number;
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
      engagement: number;
      engagementRate: number;
    }> = {};

    posts.forEach((post) => {
      const platformType = post.platform.type;
      if (!byPlatform[platformType]) {
        byPlatform[platformType] = {
          posts: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          impressions: 0,
          engagement: 0,
          engagementRate: 0,
        };
      }
      byPlatform[platformType].posts += 1;
      byPlatform[platformType].likes += post.likes;
      byPlatform[platformType].comments += post.comments;
      byPlatform[platformType].shares += post.shares;
      byPlatform[platformType].impressions += post.impressions;
    });

    // Calculate engagement rate per platform
    Object.keys(byPlatform).forEach((platform) => {
      const data = byPlatform[platform];
      data.engagement = data.likes + data.comments + data.shares;
      data.engagementRate = data.impressions > 0
        ? Math.round((data.engagement / data.impressions) * 10000) / 100
        : 0;
    });

    // Group by topic (if available)
    const byTopic: Record<string, {
      posts: number;
      totalEngagement: number;
      avgEngagement: number;
    }> = {};

    posts.forEach((post) => {
      const topic = post.topic || "Uncategorized";
      if (!byTopic[topic]) {
        byTopic[topic] = {
          posts: 0,
          totalEngagement: 0,
          avgEngagement: 0,
        };
      }
      byTopic[topic].posts += 1;
      byTopic[topic].totalEngagement += post.likes + post.comments + post.shares;
    });

    // Calculate average engagement per topic
    Object.keys(byTopic).forEach((topic) => {
      const data = byTopic[topic];
      data.avgEngagement = data.posts > 0
        ? Math.round((data.totalEngagement / data.posts) * 100) / 100
        : 0;
    });

    // Sort topics by average engagement
    const topTopics = Object.entries(byTopic)
      .map(([topic, data]) => ({ topic, ...data }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 10);

    // Group by day of week (for best posting day analysis)
    const byDayOfWeek: Record<number, {
      day: string;
      posts: number;
      totalEngagement: number;
      avgEngagement: number;
    }> = {
      0: { day: "Sunday", posts: 0, totalEngagement: 0, avgEngagement: 0 },
      1: { day: "Monday", posts: 0, totalEngagement: 0, avgEngagement: 0 },
      2: { day: "Tuesday", posts: 0, totalEngagement: 0, avgEngagement: 0 },
      3: { day: "Wednesday", posts: 0, totalEngagement: 0, avgEngagement: 0 },
      4: { day: "Thursday", posts: 0, totalEngagement: 0, avgEngagement: 0 },
      5: { day: "Friday", posts: 0, totalEngagement: 0, avgEngagement: 0 },
      6: { day: "Saturday", posts: 0, totalEngagement: 0, avgEngagement: 0 },
    };

    posts.forEach((post) => {
      const date = post.publishedAt || post.scheduledFor;
      if (date) {
        const dayOfWeek = new Date(date).getDay();
        byDayOfWeek[dayOfWeek].posts += 1;
        byDayOfWeek[dayOfWeek].totalEngagement += post.likes + post.comments + post.shares;
      }
    });

    // Calculate average engagement per day
    Object.keys(byDayOfWeek).forEach((day) => {
      const data = byDayOfWeek[parseInt(day)];
      data.avgEngagement = data.posts > 0
        ? Math.round((data.totalEngagement / data.posts) * 100) / 100
        : 0;
    });

    // Find best performing day
    const bestDay = Object.values(byDayOfWeek)
      .filter((d) => d.posts > 0)
      .sort((a, b) => b.avgEngagement - a.avgEngagement)[0] || null;

    // Group by hour (for best posting time analysis)
    const byHour: Record<number, {
      posts: number;
      totalEngagement: number;
      avgEngagement: number;
    }> = {};

    for (let i = 0; i < 24; i++) {
      byHour[i] = { posts: 0, totalEngagement: 0, avgEngagement: 0 };
    }

    posts.forEach((post) => {
      const date = post.publishedAt || post.scheduledFor;
      if (date) {
        const hour = new Date(date).getHours();
        byHour[hour].posts += 1;
        byHour[hour].totalEngagement += post.likes + post.comments + post.shares;
      }
    });

    // Calculate average engagement per hour and find best hours
    Object.keys(byHour).forEach((hour) => {
      const data = byHour[parseInt(hour)];
      data.avgEngagement = data.posts > 0
        ? Math.round((data.totalEngagement / data.posts) * 100) / 100
        : 0;
    });

    const bestHours = Object.entries(byHour)
      .filter(([_, data]) => data.posts > 0)
      .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
      .slice(0, 3)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        label: `${hour.padStart(2, "0")}:00`,
        ...data,
      }));

    return NextResponse.json({
      summary: {
        totalPosts,
        totals,
        totalEngagement,
        engagementRate,
        averages,
      },
      byPlatform,
      topTopics,
      timing: {
        byDayOfWeek: Object.values(byDayOfWeek),
        bestDay,
        bestHours,
      },
      filters: {
        companyId,
        platformId,
        platformType,
        startDate,
        endDate,
        status: status || "PUBLISHED",
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}