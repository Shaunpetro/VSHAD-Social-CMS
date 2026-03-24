// apps/web/src/lib/ai/generate-insights.ts

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export interface AnalyticsData {
  summary: {
    totalPosts: number;
    totalEngagement: number;
    engagementRate: number;
    totals: {
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
    };
    averages: {
      likesPerPost: number;
      commentsPerPost: number;
      sharesPerPost: number;
      impressionsPerPost: number;
      engagementPerPost: number;
    };
  };
  byPlatform: Record<
    string,
    {
      posts: number;
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
      engagement: number;
      engagementRate: number;
    }
  >;
  topPosts: Array<{
    content: string;
    platform: string;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    topic: string | null;
    tone: string | null;
    publishedAt: string | null;
  }>;
  timing?: {
    bestDay?: { day: string; avgEngagement: number };
    bestHours?: Array<{ hour: number; label: string; avgEngagement: number }>;
  };
  companyName?: string;
  dateRange?: string;
}

export interface GeneratedInsights {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  platformInsights: Record<string, string>;
  contentTips: string[];
  timingAdvice: string;
  generatedAt: string;
}

export async function generateAnalyticsInsights(
  data: AnalyticsData
): Promise<GeneratedInsights> {
  const prompt = buildInsightsPrompt(data);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert social media analytics consultant. Analyze the provided performance data and generate actionable insights. Be specific, data-driven, and provide clear recommendations. Format your response as valid JSON only, no markdown.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(responseText);

    return {
      summary: parsed.summary || "Unable to generate summary.",
      keyFindings: parsed.keyFindings || [],
      recommendations: parsed.recommendations || [],
      platformInsights: parsed.platformInsights || {},
      contentTips: parsed.contentTips || [],
      timingAdvice: parsed.timingAdvice || "",
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[AI Insights] Error generating insights:", error);
    return generateFallbackInsights(data);
  }
}

function buildInsightsPrompt(data: AnalyticsData): string {
  const { summary, byPlatform, topPosts, timing, companyName, dateRange } = data;

  let prompt = `Analyze the following social media performance data${companyName ? ` for ${companyName}` : ""}${dateRange ? ` (${dateRange})` : ""} and provide insights.\n\n`;

  prompt += `## OVERALL PERFORMANCE\n`;
  prompt += `- Total Posts: ${summary.totalPosts}\n`;
  prompt += `- Total Impressions: ${summary.totals.impressions.toLocaleString()}\n`;
  prompt += `- Total Engagement: ${summary.totalEngagement.toLocaleString()} (likes: ${summary.totals.likes}, comments: ${summary.totals.comments}, shares: ${summary.totals.shares})\n`;
  prompt += `- Engagement Rate: ${summary.engagementRate.toFixed(2)}%\n`;
  prompt += `- Average per Post: ${summary.averages.engagementPerPost.toFixed(1)} engagements, ${summary.averages.impressionsPerPost.toFixed(0)} impressions\n\n`;

  if (Object.keys(byPlatform).length > 0) {
    prompt += `## PLATFORM BREAKDOWN\n`;
    for (const [platform, metrics] of Object.entries(byPlatform)) {
      prompt += `### ${platform}\n`;
      prompt += `- Posts: ${metrics.posts}, Impressions: ${metrics.impressions.toLocaleString()}\n`;
      prompt += `- Engagement: ${metrics.engagement} (${metrics.engagementRate.toFixed(2)}% rate)\n`;
      prompt += `- Likes: ${metrics.likes}, Comments: ${metrics.comments}, Shares: ${metrics.shares}\n\n`;
    }
  }

  if (topPosts && topPosts.length > 0) {
    prompt += `## TOP PERFORMING POSTS\n`;
    topPosts.slice(0, 3).forEach((post, idx) => {
      const totalEng = post.likes + post.comments + post.shares;
      const engRate =
        post.impressions > 0 ? ((totalEng / post.impressions) * 100).toFixed(2) : "0";
      prompt += `### Post ${idx + 1} (${post.platform})\n`;
      prompt += `- Content: "${post.content.substring(0, 200)}${post.content.length > 200 ? "..." : ""}"\n`;
      prompt += `- Metrics: ${post.impressions} impressions, ${totalEng} engagements (${engRate}% rate)\n`;
      if (post.topic) prompt += `- Topic: ${post.topic}\n`;
      if (post.tone) prompt += `- Tone: ${post.tone}\n`;
      prompt += `\n`;
    });
  }

  if (timing) {
    prompt += `## TIMING DATA\n`;
    if (timing.bestDay) {
      prompt += `- Best Day: ${timing.bestDay.day} (${timing.bestDay.avgEngagement.toFixed(1)} avg engagement)\n`;
    }
    if (timing.bestHours && timing.bestHours.length > 0) {
      const hours = timing.bestHours
        .slice(0, 3)
        .map((h) => h.label)
        .join(", ");
      prompt += `- Best Hours: ${hours}\n`;
    }
    prompt += `\n`;
  }

  prompt += `## TASK\n`;
  prompt += `Based on this data, provide a JSON response with:\n`;
  prompt += `1. "summary": A 2-3 sentence executive summary of performance\n`;
  prompt += `2. "keyFindings": Array of 3-5 key data-driven findings\n`;
  prompt += `3. "recommendations": Array of 3-5 specific, actionable recommendations\n`;
  prompt += `4. "platformInsights": Object with platform names as keys and specific advice as values\n`;
  prompt += `5. "contentTips": Array of 2-3 content creation tips based on top posts\n`;
  prompt += `6. "timingAdvice": A sentence about optimal posting schedule\n`;

  return prompt;
}

function generateFallbackInsights(data: AnalyticsData): GeneratedInsights {
  const { summary, byPlatform, timing } = data;

  const keyFindings: string[] = [];
  const recommendations: string[] = [];
  const platformInsights: Record<string, string> = {};

  if (summary.totalPosts > 0) {
    keyFindings.push(
      `You've published ${summary.totalPosts} posts with an average engagement rate of ${summary.engagementRate.toFixed(2)}%.`
    );
  }

  if (summary.engagementRate >= 5) {
    keyFindings.push("Your engagement rate is above industry average (2-5%). Great work!");
  } else if (summary.engagementRate >= 2) {
    keyFindings.push("Your engagement rate is within industry average (2-5%).");
  } else if (summary.engagementRate > 0) {
    keyFindings.push(
      "Your engagement rate is below industry average. Consider testing different content types."
    );
  }

  for (const [platform, metrics] of Object.entries(byPlatform)) {
    if (metrics.posts > 0) {
      platformInsights[platform] = `${metrics.posts} posts with ${metrics.engagementRate.toFixed(2)}% engagement rate.`;

      if (metrics.engagementRate > summary.engagementRate) {
        recommendations.push(
          `${platform} is outperforming your average. Consider increasing posting frequency there.`
        );
      }
    }
  }

  let timingAdvice = "Post consistently to build audience expectations.";
  if (timing?.bestDay) {
    timingAdvice = `${timing.bestDay.day} shows the highest engagement. Prioritize posting on this day.`;
  }

  const contentTips = [
    "Posts with questions tend to drive more comments.",
    "Visual content typically receives higher engagement.",
    "Keep experimenting with different content formats.",
  ];

  if (recommendations.length === 0) {
    recommendations.push("Maintain a consistent posting schedule.");
    recommendations.push("Engage with comments to boost visibility.");
    recommendations.push("Test different content types to see what resonates.");
  }

  return {
    summary: `Over the analyzed period, you published ${summary.totalPosts} posts generating ${summary.totalEngagement.toLocaleString()} total engagements. Your overall engagement rate is ${summary.engagementRate.toFixed(2)}%.`,
    keyFindings,
    recommendations,
    platformInsights,
    contentTips,
    timingAdvice,
    generatedAt: new Date().toISOString(),
  };
}