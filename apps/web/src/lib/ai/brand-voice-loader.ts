// apps/web/src/lib/ai/brand-voice-loader.ts
// Bridges company intelligence with generation - closes the brand-blindness loophole

import { prisma } from "@/lib/db";

export interface BrandVoiceProfile {
  // Tone override (if intelligence suggests)
  overrideTone?:
    | "professional"
    | "casual"
    | "friendly"
    | "authoritative"
    | "cheeky"
    | "banter"
    | "ultra-short"
    | "local";
  // Supplementary brand personality traits to inject
  personalityHints: string[];
  // Language and cultural flavour hints
  languageStyle: string;
  // Experimentation flag when no performance data exists
  experimentationMode: boolean;
  // Competitor tone cues (deliberately left empty for now)
  competitorCues: string[];
  // Recommended max length for posts (optional)
  maxLengthHint?: number;
  // Hashtag instructions
  hashtagAdvice: string;
  // Additional context to inject into the prompt
  additionalContext: string;
}

/**
 * Load brand voice dynamically from intelligence data.
 * Falls back gracefully if no data exists.
 */
export async function loadBrandVoiceProfile(
  companyId: string
): Promise<BrandVoiceProfile> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      intelligence: {
        include: { contentPillars: { where: { isActive: true } } },
      },
    },
  });

  const intel = company?.intelligence;
  const profile: BrandVoiceProfile = {
    personalityHints: [],
    languageStyle: "",
    experimentationMode: false,
    competitorCues: [],
    hashtagAdvice: "",
    additionalContext: "",
  };

  // --- Extract brand personality from intelligence ---
  if (intel?.brandPersonality && typeof intel.brandPersonality === "object") {
    const bp = intel.brandPersonality as { traits?: { weAlwaysSay?: string[]; weNeverSay?: string[] }; formality?: string; warmth?: string };
    if (bp.traits?.weAlwaysSay) {
      profile.personalityHints.push(
        ...bp.traits.weAlwaysSay.map((w: string) => `Always mention: ${w}`)
      );
    }
    if (bp.traits?.weNeverSay) {
      profile.personalityHints.push(
        ...bp.traits.weNeverSay.map((w: string) => `Avoid: ${w}`)
      );
    }
    if (bp.formality) {
      if (bp.formality === "casual" || bp.formality === "informal") {
        profile.overrideTone = "casual";
      } else if (bp.formality === "very formal") {
        profile.overrideTone = "professional";
      }
    }
    if (bp.warmth === "high") {
      profile.personalityHints.push("Be warm and personable");
    }
  }

  // --- If no performance data yet → experimentation mode ---
  if (!intel?.avgEngagementRate && !intel?.topPerformingTopics) {
    profile.experimentationMode = true;
    profile.additionalContext += `⚠️ This company has no performance history. 
- Vary your tone across posts (try cheeky, ultra-short, local). 
- Keep posts extremely short to test engagement. 
- Observe what resonates and learn.`;
    // Default to ultra-short as the most attention-grabbing tone
    profile.overrideTone = "ultra-short";
  }

  // --- Competitor cues ---
  // Competitor model requires intelligenceId, not companyId.
  // To load competitor tone cues, first fetch the companyIntelligence record,
  // then query competitors by intelligenceId. This is left for a future update.

  // --- Hashtag advice from intelligence ---
  if (intel?.brandedHashtags && intel.brandedHashtags.length > 0) {
    profile.hashtagAdvice = `Always include branded hashtags: #${intel.brandedHashtags.join(', #')}.`;
  }

  // --- Local language hints if target audience is local ---
  if (intel?.targetAudience && typeof intel.targetAudience === "object") {
    const ta = intel.targetAudience as { geographicFocus?: string[] };
    if (
      ta.geographicFocus?.some((g: string) =>
        ["Gauteng", "Western Cape", "KwaZulu-Natal"].includes(g)
      )
    ) {
      profile.languageStyle =
        "Add one naturally placed local slang (e.g., 'eish', 'sho', 'sharp') when appropriate.";
    }
  }

  // --- Intelligence-led tone severity ---
  if (intel?.defaultTone && !profile.overrideTone) {
    const toneMap: Record<string, string> = {
      professional: "professional",
      casual: "casual",
      friendly: "friendly",
      authoritative: "authoritative",
      cheeky: "cheeky",
      banter: "banter",
      "ultra-short": "ultra-short",
      local: "local",
    };
    profile.overrideTone = (toneMap[intel.defaultTone] ||
      "professional") as BrandVoiceProfile["overrideTone"];
  }

  // --- Timezone hint for timeliness ---
  if (intel?.timezone) {
    profile.additionalContext += ` The audience is in timezone ${intel.timezone}.`;
  }

  return profile;
}