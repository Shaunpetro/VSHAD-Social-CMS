// apps/web/src/lib/ai/brand-voice-loader.ts
// Bridges company intelligence with generation - closes the brand-blindness loophole

import { prisma } from "@/lib/db";

export interface BrandVoiceProfile {
  // Tone override (if intelligence suggests)
  overrideTone?: "professional" | "casual" | "friendly" | "authoritative" | "cheeky" | "banter" | "ultra-short" | "local";
  // Supplementary brand personality traits to inject
  personalityHints: string[];
  // Language and cultural flavour hints
  languageStyle: string;
  // Experimentation flag when no data exists
  experimentationMode: boolean;
  // Whether to incorporate competitor tone cues
  competitorCues: string[];
  // Recommended max length for posts (can shorten even on LinkedIn)
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
  // Fetch company with full intelligence, competitor data, and recent post analytics
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
    const bp = intel.brandPersonality as any;
    if (bp.traits?.weAlwaysSay) {
      profile.personalityHints.push(...bp.traits.weAlwaysSay.map((w: string) => `Always mention: ${w}`));
    }
    if (bp.traits?.weNeverSay) {
      profile.personalityHints.push(...bp.traits.weNeverSay.map((w: string) => `Avoid: ${w}`));
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
    profile.additionalContext = `⚠️ This company has no performance history. 
- Vary your tone across posts (try cheeky, ultra-short, local). 
- Keep posts extremely short to test engagement. 
- Observe what resonates and learn.`;
    profile.overrideTone = "ultra-short"; // default test tone
  }

  // --- Competitor cues (check competitor benchmarks) ---
  try {
    const competitors = await prisma.competitor.findMany({
      where: { companyId },
      select: { toneCues: true, successfulTopics: true },
      take: 2,
    });
    for (const comp of competitors) {
      if (comp.toneCues && Array.isArray(comp.toneCues)) {
        profile.competitorCues.push(...comp.toneCues);
      }
    }
    if (profile.competitorCues.length > 0) {
      profile.additionalContext += `\n Competitor tone cues: ${profile.competitorCues.join(', ')}.`;
    }
  } catch (e) {
    // competitor table might not exist yet, ignore
  }

  // --- Hashtag advice from intelligence ---
  if (intel?.brandedHashtags && intel.brandedHashtags.length > 0) {
    profile.hashtagAdvice = `Always include branded hashtags: #${intel.brandedHashtags.join(', #')}.`;
  }

  // --- Local language hints if target audience is local ---
  if (intel?.targetAudience && typeof intel.targetAudience === "object") {
    const ta = intel.targetAudience as any;
    if (ta.geographicFocus?.some((g: string) => ['Gauteng', 'Western Cape', 'KwaZulu-Natal'].includes(g))) {
      profile.languageStyle = "Add one naturally placed local slang (e.g., 'eish', 'sho', 'sharp') when appropriate.";
    }
  }

  // --- Intelligence-led tone severity ---
  if (intel?.defaultTone) {
    // Use intelligence default tone unless experimentation overrides
    if (!profile.overrideTone) {
      profile.overrideTone = intel.defaultTone as any;
    }
  }

  // --- Timezone hint for timeliness ---
  if (intel?.timezone) {
    profile.additionalContext += ` The audience is in timezone ${intel.timezone}.`;
  }

  return profile;
}