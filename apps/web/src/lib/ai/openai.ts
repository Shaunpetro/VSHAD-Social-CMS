// apps/web/src/lib/ai/openai.ts
// Using Groq (free Llama 3.1 70B)

import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Platform-specific configurations
const platformConfigs = {
  linkedin: {
    maxLength: 3000,
    style: "professional and insightful",
    format: "Use line breaks for readability. Can include bullet points. End with a call-to-action or thought-provoking question.",
    hashtagCount: "3-5 relevant industry hashtags",
  },
  twitter: {
    maxLength: 280,
    style: "concise, punchy, and engaging",
    format: "Single impactful message. Can use thread format indication if needed. Keep it shareable.",
    hashtagCount: "1-2 hashtags maximum",
  },
  facebook: {
    maxLength: 2000,
    style: "conversational and community-focused",
    format: "Friendly tone, can be longer form. Encourage comments and shares. Use emojis sparingly if appropriate.",
    hashtagCount: "2-3 hashtags",
  },
  instagram: {
    maxLength: 2200,
    style: "visual-first, lifestyle-oriented, authentic",
    format: "Caption that complements an image. Use line breaks, emojis encouraged. Hashtags at the end.",
    hashtagCount: "5-10 relevant hashtags",
  },
  wordpress: {
    maxLength: 5000,
    style: "informative, SEO-friendly, authoritative",
    format: "Blog post structure with introduction, body paragraphs, and conclusion. Use headers (##) for sections. Include a meta description.",
    hashtagCount: "3-5 tags/categories",
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
  companyName: string;
  companyDescription?: string;
  companyIndustry?: string;
  platform: "linkedin" | "twitter" | "facebook" | "instagram" | "wordpress";
  topic?: string;
  tone?: "professional" | "casual" | "friendly" | "authoritative";
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: string;
}

export async function generateSocialContent(
  params: GenerateContentParams
): Promise<GeneratedContent> {
  const {
    companyName,
    companyDescription,
    companyIndustry,
    platform,
    topic,
    tone = "professional",
    includeHashtags = true,
    includeEmojis = false,
  } = params;

  const config = platformConfigs[platform];
  const toneDesc = toneDescriptions[tone];

  const prompt = `You are a social media content expert. Generate a ${platform.toUpperCase()} post for the following company:

**Company Name:** ${companyName}
**Industry:** ${companyIndustry || "Not specified"}
**Company Description:** ${companyDescription || "Not provided"}

**Content Requirements:**
- Platform: ${platform.toUpperCase()}
- Maximum Length: ${config.maxLength} characters
- Style: ${config.style}
- Tone: ${toneDesc}
- Format Guidelines: ${config.format}
${topic ? `- Topic/Focus: ${topic}` : "- Topic: Create engaging content relevant to the company's industry and services"}
${includeEmojis ? "- Include relevant emojis to enhance engagement" : "- Minimal or no emojis"}
${includeHashtags ? `- Include ${config.hashtagCount} at the end` : "- Do not include hashtags"}

**IMPORTANT INSTRUCTIONS:**
1. Write ONLY the post content - no explanations, no "Here's your post:", no meta commentary
2. Make it sound natural and human, not AI-generated
3. Focus on providing value to the reader
4. Match the brand voice based on the company description
5. Keep within the character limit for ${platform}

Generate the post now:`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
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

    // Clean up any unwanted prefixes the AI might add
    content = content
      .replace(/^(Here's|Here is|Sure,|Okay,).*?:\s*/i, "")
      .replace(/^["']|["']$/g, "")
      .trim();

    // Extract hashtags from content
    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];

    return {
      content,
      hashtags: hashtags.map((tag) => tag.replace("#", "")),
      characterCount: content.length,
      platform,
    };
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error(
      `Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function regenerateContent(
  originalContent: string,
  feedback: string,
  platform: string
): Promise<GeneratedContent> {
  const config = platformConfigs[platform as keyof typeof platformConfigs] || platformConfigs.linkedin;

  const prompt = `You are a social media content expert. Improve the following ${platform.toUpperCase()} post based on the feedback provided.

**Original Post:**
${originalContent}

**Feedback/Instructions:**
${feedback}

**Platform Requirements:**
- Platform: ${platform.toUpperCase()}
- Maximum Length: ${config.maxLength} characters
- Style: ${config.style}

**IMPORTANT INSTRUCTIONS:**
1. Write ONLY the improved post content - no explanations, no commentary
2. Apply the feedback while maintaining the core message
3. Keep the same general tone unless feedback says otherwise
4. Stay within character limits

Generate the improved post now:`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
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

    // Clean up any unwanted prefixes
    content = content
      .replace(/^(Here's|Here is|Sure,|Okay,|Improved|Updated).*?:\s*/i, "")
      .replace(/^["']|["']$/g, "")
      .trim();

    // Extract hashtags
    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];

    return {
      content,
      hashtags: hashtags.map((tag) => tag.replace("#", "")),
      characterCount: content.length,
      platform,
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