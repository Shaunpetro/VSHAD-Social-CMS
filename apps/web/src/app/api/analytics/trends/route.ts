// apps/web/src/app/api/analytics/trends/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Granularity = "daily" | "weekly" | "monthly";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const platformId = searchParams.get("platformId");
    const platformType = searchParams.get("platformType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const granularity = (searchParams.get("granularity") || "daily") as Granularity;

    // Default date range: last 30 days
    const now = new Date();
    const defaultStartDate = new Date(now);
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const effectiveStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const effectiveEndDate = endDate ? new Date(endDate) : now;

    // Build where clause
    const where: any = {
      status: "PUBLISHED",
      publishedAt: {
        gte: effectiveStartDate,
        lte: effectiveEndDate,
      },
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

    // Fetch posts
    const posts = await prisma.generatedPost.findMany({
      where,
      select: {
        id: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        publishedAt: true,
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
          },
        },
      },
      orderBy: {
        publishedAt: "asc",
      },
    });

    // Group posts by time period
    const groupedData = groupByPeriod(posts, granularity);

    // Calculate trends (comparing to previous period)
    const trends = calculateTrends(groupedData);

    // Calculate cumulative totals
    const cumulative = calculateCumulative(groupedData);

    // Platform breakdown over time
    const platformTrends = calculatePlatformTrends(posts, granularity);

    // Calculate period-over-period growth
    const growth = calculateGrowth(groupedData);

    return NextResponse.json({
      data: groupedData,
      trends,
      cumulative,
      platformTrends,
      growth,
      meta: {
        granularity,
        startDate: effectiveStartDate.toISOString(),
        endDate: effectiveEndDate.toISOString(),
        totalPosts: posts.length,
        periodsCount: groupedData.length,
      },
      filters: {
        companyId,
        platformId,
        platformType,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics trends" },
      { status: 500 }
    );
  }
}

// Helper function to get period key based on granularity
function getPeriodKey(date: Date, granularity: Granularity): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  switch (granularity) {
    case "daily":
      return `${year}-${month}-${day}`;
    case "weekly":
      // Get the Monday of the week
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(date);
      monday.setDate(date.getDate() + mondayOffset);
      const mYear = monday.getFullYear();
      const mMonth = String(monday.getMonth() + 1).padStart(2, "0");
      const mDay = String(monday.getDate()).padStart(2, "0");
      return `${mYear}-${mMonth}-${mDay}`;
    case "monthly":
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

// Helper function to get period label
function getPeriodLabel(key: string, granularity: Granularity): string {
  const date = new Date(key + (granularity === "monthly" ? "-01" : ""));
  
  switch (granularity) {
    case "daily":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "weekly":
      const endOfWeek = new Date(date);
      endOfWeek.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    case "monthly":
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    default:
      return key;
  }
}

// Group posts by time period
function groupByPeriod(posts: any[], granularity: Granularity) {
  const grouped: Record<string, {
    period: string;
    label: string;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    engagement: number;
    engagementRate: number;
  }> = {};

  posts.forEach((post) => {
    if (!post.publishedAt) return;

    const periodKey = getPeriodKey(new Date(post.publishedAt), granularity);

    if (!grouped[periodKey]) {
      grouped[periodKey] = {
        period: periodKey,
        label: getPeriodLabel(periodKey, granularity),
        posts: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
        engagement: 0,
        engagementRate: 0,
      };
    }

    grouped[periodKey].posts += 1;
    grouped[periodKey].likes += post.likes;
    grouped[periodKey].comments += post.comments;
    grouped[periodKey].shares += post.shares;
    grouped[periodKey].impressions += post.impressions;
  });

  // Calculate engagement and engagement rate for each period
  Object.values(grouped).forEach((period) => {
    period.engagement = period.likes + period.comments + period.shares;
    period.engagementRate = period.impressions > 0
      ? Math.round((period.engagement / period.impressions) * 10000) / 100
      : 0;
  });

  // Sort by period and return as array
  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}

// Calculate trends (direction indicators)
function calculateTrends(data: any[]) {
  if (data.length < 2) {
    return {
      posts: { direction: "stable", change: 0, percentage: 0 },
      engagement: { direction: "stable", change: 0, percentage: 0 },
      impressions: { direction: "stable", change: 0, percentage: 0 },
      engagementRate: { direction: "stable", change: 0, percentage: 0 },
    };
  }

  const current = data[data.length - 1];
  const previous = data[data.length - 2];

  const calculateChange = (curr: number, prev: number) => {
    const change = curr - prev;
    const percentage = prev > 0 ? Math.round((change / prev) * 10000) / 100 : 0;
    const direction = change > 0 ? "up" : change < 0 ? "down" : "stable";
    return { direction, change, percentage };
  };

  return {
    posts: calculateChange(current.posts, previous.posts),
    engagement: calculateChange(current.engagement, previous.engagement),
    impressions: calculateChange(current.impressions, previous.impressions),
    engagementRate: calculateChange(current.engagementRate, previous.engagementRate),
  };
}

// Calculate cumulative totals over time
function calculateCumulative(data: any[]) {
  let cumulativePosts = 0;
  let cumulativeLikes = 0;
  let cumulativeComments = 0;
  let cumulativeShares = 0;
  let cumulativeImpressions = 0;

  return data.map((period) => {
    cumulativePosts += period.posts;
    cumulativeLikes += period.likes;
    cumulativeComments += period.comments;
    cumulativeShares += period.shares;
    cumulativeImpressions += period.impressions;

    const cumulativeEngagement = cumulativeLikes + cumulativeComments + cumulativeShares;

    return {
      period: period.period,
      label: period.label,
      posts: cumulativePosts,
      likes: cumulativeLikes,
      comments: cumulativeComments,
      shares: cumulativeShares,
      impressions: cumulativeImpressions,
      engagement: cumulativeEngagement,
    };
  });
}

// Calculate platform-specific trends
function calculatePlatformTrends(posts: any[], granularity: Granularity) {
  const platformData: Record<string, Record<string, {
    posts: number;
    engagement: number;
  }>> = {};

  posts.forEach((post) => {
    if (!post.publishedAt) return;

    const periodKey = getPeriodKey(new Date(post.publishedAt), granularity);
    const platformType = post.platform.type;

    if (!platformData[platformType]) {
      platformData[platformType] = {};
    }

    if (!platformData[platformType][periodKey]) {
      platformData[platformType][periodKey] = {
        posts: 0,
        engagement: 0,
      };
    }

    platformData[platformType][periodKey].posts += 1;
    platformData[platformType][periodKey].engagement += 
      post.likes + post.comments + post.shares;
  });

  // Convert to array format for each platform
  const result: Record<string, any[]> = {};

  Object.entries(platformData).forEach(([platform, periods]) => {
    result[platform] = Object.entries(periods)
      .map(([period, data]) => ({
        period,
        label: getPeriodLabel(period, granularity),
        ...data,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  });

  return result;
}

// Calculate period-over-period growth rates
function calculateGrowth(data: any[]) {
  if (data.length < 2) {
    return {
      averageEngagementGrowth: 0,
      averagePostsGrowth: 0,
      averageImpressionsGrowth: 0,
      consistentGrowth: false,
    };
  }

  const growthRates: {
    engagement: number[];
    posts: number[];
    impressions: number[];
  } = {
    engagement: [],
    posts: [],
    impressions: [],
  };

  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];

    if (previous.engagement > 0) {
      growthRates.engagement.push(
        ((current.engagement - previous.engagement) / previous.engagement) * 100
      );
    }

    if (previous.posts > 0) {
      growthRates.posts.push(
        ((current.posts - previous.posts) / previous.posts) * 100
      );
    }

    if (previous.impressions > 0) {
      growthRates.impressions.push(
        ((current.impressions - previous.impressions) / previous.impressions) * 100
      );
    }
  }

  const average = (arr: number[]) =>
    arr.length > 0
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100
      : 0;

  const averageEngagementGrowth = average(growthRates.engagement);
  const positiveGrowthPeriods = growthRates.engagement.filter((g) => g > 0).length;
  const consistentGrowth = positiveGrowthPeriods >= growthRates.engagement.length * 0.6;

  return {
    averageEngagementGrowth,
    averagePostsGrowth: average(growthRates.posts),
    averageImpressionsGrowth: average(growthRates.impressions),
    consistentGrowth,
    positiveGrowthPeriods,
    totalPeriods: growthRates.engagement.length,
  };
}