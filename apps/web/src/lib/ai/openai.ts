// apps/web/src/lib/ai/openai.ts
// Using Groq (free Llama 3.3 70B) with Performance Analytics + Content Strategy Integration

import Groq from "groq-sdk";
import {
  getPerformanceInsights,
  formatInsightsForPrompt,
  type PerformanceInsights,
} from "./analytics-insights";

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Platform-specific configurations
const platformConfigs = {
  linkedin: {
    maxLength: 3000,
    style: "professional and insightful",
    format:
      "Use line breaks for readability. Can include bullet points. End with a call-to-action or thought-provoking question.",
    hashtagCount: "3-5 relevant industry hashtags",
    audienceContext: "Professional network - decision makers, industry peers, potential clients/employers",
  },
  twitter: {
    maxLength: 280,
    style: "concise, punchy, and engaging",
    format:
      "Single impactful message. Can use thread format indication if needed. Keep it shareable.",
    hashtagCount: "1-2 hashtags maximum",
    audienceContext: "Fast-scrolling audience - grab attention immediately, be memorable",
  },
  facebook: {
    maxLength: 2000,
    style: "conversational and community-focused",
    format:
      "Friendly tone, can be longer form. Encourage comments and shares. Use emojis sparingly if appropriate.",
    hashtagCount: "2-3 hashtags",
    audienceContext: "Community-oriented - friends, family, local connections, brand followers",
  },
  instagram: {
    maxLength: 2200,
    style: "visual-first, lifestyle-oriented, authentic",
    format:
      "Caption that complements an image. Use line breaks, emojis encouraged. Hashtags at the end.",
    hashtagCount: "5-10 relevant hashtags",
    audienceContext: "Visual-first audience - lifestyle focused, discovery-oriented, younger demographic",
  },
  wordpress: {
    maxLength: 5000,
    style: "informative, SEO-friendly, authoritative",
    format:
      "Blog post structure with introduction, body paragraphs, and conclusion. Use headers (##) for sections. Include a meta description.",
    hashtagCount: "3-5 tags/categories",
    audienceContext: "Readers seeking in-depth information - longer attention span, searching for solutions",
  },
};

// Tone descriptions for the AI
const toneDescriptions = {
  professional: "formal, business-appropriate, credible, and expert",
  casual: "relaxed, approachable, friendly, and conversational",
  friendly: "warm, personable, inclusive, and engaging",
  authoritative: "confident, expert, thought-leader, and decisive",
};

export interface GenerateContentParams {
  companyId?: string;
  companyName: string;
  companyDescription?: string;
  companyIndustry?: string;
  platform: "linkedin" | "twitter" | "facebook" | "instagram" | "wordpress";
  platformId?: string;
  topic?: string;
  tone?: "professional" | "casual" | "friendly" | "authoritative";
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  useAnalytics?: boolean;
  contentTypeContext?: string; // NEW: Content strategy context from auto-generate
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: string;
  analyticsUsed?: boolean;
  insights?: PerformanceInsights;
}

export async function generateSocialContent(
  params: GenerateContentParams
): Promise<GeneratedContent> {
  const {
    companyId,
    companyName,
    companyDescription,
    companyIndustry,
    platform,
    platformId,
    topic,
    tone = "professional",
    includeHashtags = true,
    includeEmojis = false,
    useAnalytics = true,
    contentTypeContext, // NEW
  } = params;

  const config = platformConfigs[platform];
  const toneDesc = toneDescriptions[tone];

  // Fetch performance insights if enabled and companyId provided
  let insights: PerformanceInsights | null = null;
  let insightsPrompt = "";

  if (useAnalytics && companyId) {
    try {
      insights = await getPerformanceInsights({
        companyId,
        platformId,
        platformType: platform.toUpperCase(),
        days: 90,
        minImpressions: 10,
      });

      if (insights.hasData) {
        insightsPrompt = formatInsightsForPrompt(insights);
      }
    } catch (error) {
      console.warn("Failed to fetch performance insights:", error);
      // Continue without insights
    }
  }

  // Build the enhanced prompt
  const prompt = buildEnhancedPrompt({
    companyName,
    companyDescription,
    companyIndustry,
    platform,
    config,
    toneDesc,
    tone,
    topic,
    includeEmojis,
    includeHashtags,
    insightsPrompt,
    contentTypeContext,
  });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.75, // Slightly higher for more creativity
      max_tokens: 1024,
    });

    let content = chatCompletion.choices[0]?.message?.content?.trim() || "";

    // Clean up any unwanted prefixes the AI might add
    content = cleanGeneratedContent(content);

    // Extract hashtags from content
    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];

    return {
      content,
      hashtags: hashtags.map((tag) => tag.replace("#", "")),
      characterCount: content.length,
      platform,
      analyticsUsed: insights?.hasData ?? false,
      insights: insights ?? undefined,
    };
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error(
      `Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Build the enhanced prompt with content strategy context
 */
function buildEnhancedPrompt(params: {
  companyName: string;
  companyDescription?: string;
  companyIndustry?: string;
  platform: string;
  config: typeof platformConfigs.linkedin;
  toneDesc: string;
  tone: string;
  topic?: string;
  includeEmojis: boolean;
  includeHashtags: boolean;
  insightsPrompt: string;
  contentTypeContext?: string;
}): string {
  const {
    companyName,
    companyDescription,
    companyIndustry,
    platform,
    config,
    toneDesc,
    tone,
    topic,
    includeEmojis,
    includeHashtags,
    insightsPrompt,
    contentTypeContext,
  } = params;

  let prompt = `Generate a ${platform.toUpperCase()} post for:

**COMPANY:**
- Name: ${companyName}
- Industry: ${companyIndustry || "Not specified"}
- Description: ${companyDescription || "Not provided"}

**PLATFORM REQUIREMENTS:**
- Platform: ${platform.toUpperCase()}
- Maximum Length: ${config.maxLength} characters
- Style: ${config.style}
- Tone: ${toneDesc}
- Format: ${config.format}
- Audience: ${config.audienceContext}
${topic ? `- Topic/Focus: ${topic}` : ""}
${includeEmojis ? "- Include relevant emojis to enhance engagement" : "- Minimal or no emojis"}
${includeHashtags ? `- Include ${config.hashtagCount} at the end` : "- Do not include hashtags"}
`;

  // Add content type context if provided (from auto-generate)
  if (contentTypeContext) {
    prompt += `
${contentTypeContext}
`;
  }

  // Add performance insights if available
  if (insightsPrompt) {
    prompt += `
${insightsPrompt}
`;
  }

  prompt += `
**CRITICAL INSTRUCTIONS:**
1. Write ONLY the post content - no explanations, no "Here's your post:", no meta commentary
2. Start with a STRONG HOOK - the first line must grab attention immediately
3. Make it sound natural and human, not AI-generated
4. Focus on providing value to the reader
5. Match the brand voice based on the company description
6. Keep within the character limit for ${platform}
7. End with engagement driver (question, CTA, or thought-provoker) when appropriate
${contentTypeContext ? "8. FOLLOW THE CONTENT TYPE GUIDANCE ABOVE - this determines the PURPOSE of the post" : ""}
${insightsPrompt ? "9. LEARN FROM PERFORMANCE INSIGHTS - incorporate patterns from successful posts" : ""}

Generate the post now:`;

  return prompt;
}

/**
 * Get system prompt for consistent AI behavior
 */
function getSystemPrompt(): string {
  return `You are an expert social media content strategist with deep knowledge of:
- Platform-specific best practices (LinkedIn, Facebook, Instagram, Twitter)
- Content psychology and engagement triggers
- Sales funnel awareness (awareness → interest → consideration → conversion)
- Brand voice adaptation
- Hook writing and attention capture

Your content should:
- Feel authentic and human, never robotic or template-like
- Provide genuine value to the reader
- Match the requested tone and content type precisely
- Drive the intended action (engage, educate, convert, etc.)

You never explain your work or add meta-commentary. You only output the final post content.`;
}

/**
 * Clean up generated content from common AI artifacts
 */
function cleanGeneratedContent(content: string): string {
  return content
    // Remove common prefixes
    .replace(/^(Here's|Here is|Sure,|Okay,|Certainly,|Of course,).*?:\s*/i, "")
    .replace(/^(Here's a|Here is a|I've created|I created).*?:\s*/i, "")
    .replace(/^["']|["']$/g, "")
    // Remove any "Post:" or similar labels
    .replace(/^(Post|Content|Caption|Tweet|Update):\s*/i, "")
    // Remove trailing explanations
    .replace(/\n\n(This post|I've|I hope|Let me know|Feel free).*$/is, "")
    .trim();
}

export async function regenerateContent(
  originalContent: string,
  feedback: string,
  platform: string,
  companyId?: string,
  platformId?: string
): Promise<GeneratedContent> {
  const config =
    platformConfigs[platform as keyof typeof platformConfigs] ||
    platformConfigs.linkedin;

  // Fetch performance insights if companyId provided
  let insights: PerformanceInsights | null = null;
  let insightsPrompt = "";

  if (companyId) {
    try {
      insights = await getPerformanceInsights({
        companyId,
        platformId,
        platformType: platform.toUpperCase(),
        days: 90,
        minImpressions: 10,
      });

      if (insights.hasData) {
        insightsPrompt = formatInsightsForPrompt(insights);
      }
    } catch (error) {
      console.warn("Failed to fetch performance insights:", error);
    }
  }

  const prompt = `Improve the following ${platform.toUpperCase()} post based on the feedback provided.

**ORIGINAL POST:**
${originalContent}

**FEEDBACK/INSTRUCTIONS:**
${feedback}
${insightsPrompt}
**PLATFORM REQUIREMENTS:**
- Platform: ${platform.toUpperCase()}
- Maximum Length: ${config.maxLength} characters
- Style: ${config.style}

**INSTRUCTIONS:**
1. Write ONLY the improved post content - no explanations, no commentary
2. Apply the feedback while maintaining the core message
3. Keep the same general tone unless feedback says otherwise
4. Ensure strong hook at the beginning
5. Stay within character limits
${insights?.hasData ? "6. Apply insights from high-performing posts to maximize engagement" : ""}

Generate the improved post now:`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    let content = chatCompletion.choices[0]?.message?.content?.trim() || "";
    content = cleanGeneratedContent(content);

    // Extract hashtags
    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];

    return {
      content,
      hashtags: hashtags.map((tag) => tag.replace("#", "")),
      characterCount: content.length,
      platform,
      analyticsUsed: insights?.hasData ?? false,
      insights: insights ?? undefined,
    };
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error(
      `Failed to regenerate content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Utility function to validate content length
export function validateContentLength(
  content: string,
  platform: keyof typeof platformConfigs
): { valid: boolean; message?: string } {
  const config = platformConfigs[platform];
  if (content.length > config.maxLength) {
    return {
      valid: false,
      message: `Content exceeds ${platform} limit of ${config.maxLength} characters (current: ${content.length})`,
    };
  }
  return { valid: true };
}

// Export platform configs for use elsewhere
export { platformConfigs };