// apps/web/src/lib/ai/topic-variations.ts
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

interface PreviousPostAnalysis {
  recentTopics: string[];
  bestPerformingTones: string[];
  platformInsights: Record<string, {
    avgEngagement: number;
    bestPostingTimes: string[];
    topHashtags: string[];
  }>;
  avoidTopics: string[];
}

interface TopicVariationParams {
  mainTopic: string;
  companyName: string;
  companyIndustry: string;
  companyDescription: string;
  numberOfVariations: number;
  platforms: string[];
  tone: string;
  previousAnalysis?: PreviousPostAnalysis | null;
}

interface TopicVariation {
  angle: string;
  title: string;
  keyPoints: string[];
  suggestedHashtags: string[];
  targetPlatform: string;
  contentType: "educational" | "promotional" | "behind-the-scenes" | "industry-news" | "engagement" | "storytelling";
}

export async function generateTopicVariations(
  params: TopicVariationParams
): Promise<TopicVariation[]> {
  const {
    mainTopic,
    companyName,
    companyIndustry,
    companyDescription,
    numberOfVariations,
    platforms,
    tone,
    previousAnalysis,
  } = params;

  // Build context from previous analysis
  let analysisContext = "";
  if (previousAnalysis && previousAnalysis.recentTopics.length > 0) {
    analysisContext = `
**PREVIOUS CONTENT ANALYSIS (Last 7 Days):**
- Recently covered topics (AVOID repeating): ${previousAnalysis.recentTopics.join(", ")}
- Best performing tones: ${previousAnalysis.bestPerformingTones.join(", ") || "No data yet"}
- Topics to avoid: ${previousAnalysis.avoidTopics.join(", ") || "None identified"}
${Object.entries(previousAnalysis.platformInsights).map(([platform, data]) => `
- ${platform.toUpperCase()}: Top hashtags: ${data.topHashtags.join(", ") || "N/A"}
`).join("")}

Use this data to create FRESH, NON-REPETITIVE content that builds on what worked.
`;
  } else {
    analysisContext = `
**NOTE:** No previous post data available. Create diverse, engaging content to establish baseline performance.
`;
  }

  const prompt = `You are a social media content strategist. Generate ${numberOfVariations} UNIQUE topic variations for a content calendar.

**COMPANY CONTEXT:**
- Company: ${companyName}
- Industry: ${companyIndustry || "General Business"}
- Description: ${companyDescription || "Not provided"}
- Main Topic/Theme: ${mainTopic}
- Target Platforms: ${platforms.join(", ")}
- Preferred Tone: ${tone}

${analysisContext}

**REQUIREMENTS:**
1. Each variation must be a DIFFERENT angle/perspective on the main topic
2. Mix content types: educational, promotional, behind-the-scenes, industry news, engagement posts, storytelling
3. Make each variation platform-appropriate (short for Twitter, professional for LinkedIn, visual-friendly for Instagram)
4. Avoid repetition - each post should feel fresh and unique
5. Include specific, actionable angles - not generic content

**CONTENT TYPE DISTRIBUTION (aim for variety):**
- Educational (tips, how-tos, guides): 30-40%
- Industry News/Trends: 15-20%
- Behind-the-Scenes/Culture: 15-20%
- Engagement (questions, polls, discussions): 15-20%
- Promotional/Achievements: 10-15%

**OUTPUT FORMAT (JSON array):**
[
  {
    "angle": "Specific unique angle for this post",
    "title": "Catchy headline/hook for the post",
    "keyPoints": ["Point 1", "Point 2", "Point 3"],
    "suggestedHashtags": ["hashtag1", "hashtag2", "hashtag3"],
    "targetPlatform": "linkedin|twitter|facebook|instagram",
    "contentType": "educational|promotional|behind-the-scenes|industry-news|engagement|storytelling"
  }
]

Generate exactly ${numberOfVariations} variations. Return ONLY the JSON array, no other text.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8, // Higher for more creativity
      max_tokens: 4096,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "[]";
    
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes("```")) {
      const match = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      jsonText = match ? match[1].trim() : responseText;
    }

    const variations: TopicVariation[] = JSON.parse(jsonText);
    
    // Validate and ensure we have the right number
    if (!Array.isArray(variations)) {
      throw new Error("Invalid response format");
    }

    // Distribute platforms if more variations than platforms
    return variations.slice(0, numberOfVariations).map((v, index) => ({
      ...v,
      targetPlatform: v.targetPlatform || platforms[index % platforms.length],
      contentType: v.contentType || "educational",
    }));

  } catch (error) {
    console.error("Failed to generate topic variations:", error);
    
    // Fallback: Create basic variations
    return Array.from({ length: numberOfVariations }, (_, i) => ({
      angle: `${mainTopic} - Perspective ${i + 1}`,
      title: `${mainTopic}`,
      keyPoints: ["Key insight about this topic"],
      suggestedHashtags: [companyIndustry?.toLowerCase() || "business"],
      targetPlatform: platforms[i % platforms.length],
      contentType: "educational" as const,
    }));
  }
}

export async function analyzeRecentPosts(
  posts: Array<{
    content: string;
    topic?: string | null;
    tone?: string | null;
    hashtags: string[];
    status: string;
    platform: { type: string } | null;
    createdAt: Date;
    // Future: Add engagement metrics when available
    // likes?: number;
    // comments?: number;
    // shares?: number;
  }>
): Promise<PreviousPostAnalysis> {
  // Extract recent topics
  const recentTopics = posts
    .filter(p => p.topic)
    .map(p => p.topic!)
    .filter((topic, index, self) => self.indexOf(topic) === index)
    .slice(0, 10);

  // Extract tones used
  const tones = posts
    .filter(p => p.tone)
    .map(p => p.tone!);
  
  const toneCounts = tones.reduce((acc, tone) => {
    acc[tone] = (acc[tone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bestPerformingTones = Object.entries(toneCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([tone]) => tone);

  // Platform-specific insights
  const platformInsights: Record<string, {
    avgEngagement: number;
    bestPostingTimes: string[];
    topHashtags: string[];
  }> = {};

  const platformGroups = posts.reduce((acc, post) => {
    const platform = post.platform?.type?.toLowerCase() || "unknown";
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);

  for (const [platform, platformPosts] of Object.entries(platformGroups)) {
    // Collect all hashtags for this platform
    const allHashtags = platformPosts.flatMap(p => p.hashtags || []);
    const hashtagCounts = allHashtags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    platformInsights[platform] = {
      avgEngagement: 0, // Would need engagement data from social APIs
      bestPostingTimes: [], // Would need posting time analysis
      topHashtags,
    };
  }

  // Topics to avoid (recently covered heavily)
  const topicCounts = recentTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avoidTopics = Object.entries(topicCounts)
    .filter(([, count]) => count >= 2) // Covered 2+ times recently
    .map(([topic]) => topic);

  return {
    recentTopics,
    bestPerformingTones,
    platformInsights,
    avoidTopics,
  };
}