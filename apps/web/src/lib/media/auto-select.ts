// apps/web/src/lib/media/auto-select.ts

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | "GIF";
  mimeType: string | null;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  pillarIds: string[];
  tags: string[];
  contentTypes: string[];
  expiresAt: Date | null;
  priority: number;
  createdAt: Date;
}

export interface MediaSelectionParams {
  companyId: string;
  pillarId?: string;
  contentType?: string; // educational, engagement, social_proof, promotional
  topic?: string;
  tags?: string[];
  preferredType?: "IMAGE" | "VIDEO" | "GIF";
  forceInclude?: boolean; // Override ratio check
}

export interface MediaSelectionResult {
  includeMedia: boolean;
  selectedMedia: MediaItem | null;
  score: number;
  matchReasons: string[];
  reason: string;
  availableCount: number;
  settings: MediaSettings;
}

export interface MediaSettings {
  mediaBalanceEnabled: boolean;
  mediaPostRatio: number;
  educationalMediaRatio: number;
  engagementMediaRatio: number;
  socialProofMediaRatio: number;
  promotionalMediaRatio: number;
  prioritizeExpiringMedia: boolean;
  expiryWarningDays: number;
}

export interface ScoredMedia {
  media: MediaItem;
  score: number;
  matchReasons: string[];
}

// ============================================
// DEFAULT SETTINGS
// ============================================

const DEFAULT_SETTINGS: MediaSettings = {
  mediaBalanceEnabled: true,
  mediaPostRatio: 60,
  educationalMediaRatio: 50,
  engagementMediaRatio: 30,
  socialProofMediaRatio: 80,
  promotionalMediaRatio: 70,
  prioritizeExpiringMedia: true,
  expiryWarningDays: 7,
};

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Get media settings for a company
 */
export async function getMediaSettings(companyId: string): Promise<MediaSettings> {
  const intelligence = await prisma.companyIntelligence.findUnique({
    where: { companyId },
    select: {
      mediaBalanceEnabled: true,
      mediaPostRatio: true,
      educationalMediaRatio: true,
      engagementMediaRatio: true,
      socialProofMediaRatio: true,
      promotionalMediaRatio: true,
      prioritizeExpiringMedia: true,
      expiryWarningDays: true,
    },
  });

  if (!intelligence) {
    return DEFAULT_SETTINGS;
  }

  return {
    mediaBalanceEnabled: intelligence.mediaBalanceEnabled ?? DEFAULT_SETTINGS.mediaBalanceEnabled,
    mediaPostRatio: intelligence.mediaPostRatio ?? DEFAULT_SETTINGS.mediaPostRatio,
    educationalMediaRatio: intelligence.educationalMediaRatio ?? DEFAULT_SETTINGS.educationalMediaRatio,
    engagementMediaRatio: intelligence.engagementMediaRatio ?? DEFAULT_SETTINGS.engagementMediaRatio,
    socialProofMediaRatio: intelligence.socialProofMediaRatio ?? DEFAULT_SETTINGS.socialProofMediaRatio,
    promotionalMediaRatio: intelligence.promotionalMediaRatio ?? DEFAULT_SETTINGS.promotionalMediaRatio,
    prioritizeExpiringMedia: intelligence.prioritizeExpiringMedia ?? DEFAULT_SETTINGS.prioritizeExpiringMedia,
    expiryWarningDays: intelligence.expiryWarningDays ?? DEFAULT_SETTINGS.expiryWarningDays,
  };
}

/**
 * Check if a post should include media based on company settings and content type
 */
export async function shouldIncludeMedia(
  companyId: string,
  contentType?: string,
  forceInclude?: boolean
): Promise<{ include: boolean; reason: string; ratio: number }> {
  // Force include overrides everything
  if (forceInclude) {
    return {
      include: true,
      reason: "Force include enabled",
      ratio: 100,
    };
  }

  const settings = await getMediaSettings(companyId);

  // Check if media balance is enabled
  if (!settings.mediaBalanceEnabled) {
    return {
      include: false,
      reason: "Media balance disabled for company",
      ratio: 0,
    };
  }

  // Check available media count
  const availableCount = await getAvailableMediaCount(companyId);
  if (availableCount === 0) {
    return {
      include: false,
      reason: "No available media in library",
      ratio: 0,
    };
  }

  // Get content-type specific ratio
  const ratioMap: Record<string, number> = {
    educational: settings.educationalMediaRatio,
    engagement: settings.engagementMediaRatio,
    social_proof: settings.socialProofMediaRatio,
    promotional: settings.promotionalMediaRatio,
  };

  const applicableRatio = contentType
    ? ratioMap[contentType] ?? settings.mediaPostRatio
    : settings.mediaPostRatio;

  // Random check against ratio
  const randomValue = Math.random() * 100;
  const include = randomValue < applicableRatio;

  return {
    include,
    reason: include
      ? `Random ${randomValue.toFixed(1)} < ${applicableRatio}% (include media)`
      : `Random ${randomValue.toFixed(1)} >= ${applicableRatio}% (text-only)`,
    ratio: applicableRatio,
  };
}

/**
 * Get count of available (unused, not expired) media for a company
 */
export async function getAvailableMediaCount(companyId: string): Promise<number> {
  const now = new Date();

  const availableWhere: Prisma.MediaWhereInput = {
    companyId,
    isUsed: false,
    autoSelect: true,
    OR: [
      { expiresAt: { equals: null } },
      { expiresAt: { gt: now } },
    ] as Prisma.MediaWhereInput[],
  };

  return prisma.media.count({ where: availableWhere });
}

/**
 * Get available media for a company
 */
export async function getAvailableMedia(companyId: string): Promise<MediaItem[]> {
  const now = new Date();

  const availableWhere: Prisma.MediaWhereInput = {
    companyId,
    isUsed: false,
    autoSelect: true,
    OR: [
      { expiresAt: { equals: null } },
      { expiresAt: { gt: now } },
    ] as Prisma.MediaWhereInput[],
  };

  const media = await prisma.media.findMany({
    where: availableWhere,
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  return media as MediaItem[];
}

/**
 * Score a media item based on matching criteria
 */
export function scoreMedia(
  media: MediaItem,
  params: MediaSelectionParams,
  settings: MediaSettings
): ScoredMedia {
  let score = media.priority; // Base score from priority field
  const matchReasons: string[] = [];

  const now = new Date();

  // Pillar match (+10 points)
  if (params.pillarId && media.pillarIds.includes(params.pillarId)) {
    score += 10;
    matchReasons.push("Matches content pillar");
  }

  // Content type match (+5 points)
  if (params.contentType && media.contentTypes.includes(params.contentType)) {
    score += 5;
    matchReasons.push(`Matches ${params.contentType} content type`);
  }

  // Tag matches (+2 points each, max 10)
  if (params.tags && params.tags.length > 0) {
    const matchingTags = media.tags.filter((t) =>
      params.tags!.some((pt) => t.toLowerCase().includes(pt.toLowerCase()))
    );
    const tagScore = Math.min(matchingTags.length * 2, 10);
    score += tagScore;
    if (matchingTags.length > 0) {
      matchReasons.push(`Matches ${matchingTags.length} tag(s): ${matchingTags.slice(0, 3).join(", ")}`);
    }
  }

  // Topic match in tags (+3 points)
  if (params.topic) {
    const topicLower = params.topic.toLowerCase();
    const topicMatch = media.tags.some((t) => t.toLowerCase().includes(topicLower));
    if (topicMatch) {
      score += 3;
      matchReasons.push(`Matches topic: ${params.topic}`);
    }

    // Also check filename for topic (+2 points)
    if (media.filename.toLowerCase().includes(topicLower)) {
      score += 2;
      matchReasons.push("Filename matches topic");
    }
  }

  // Preferred type match (+3 points)
  if (params.preferredType && media.type === params.preferredType) {
    score += 3;
    matchReasons.push(`Preferred type: ${params.preferredType}`);
  }

  // Expiring soon bonus (+5 points if prioritization enabled)
  if (settings.prioritizeExpiringMedia && media.expiresAt) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + settings.expiryWarningDays);

    if (media.expiresAt <= warningDate && media.expiresAt > now) {
      score += 5;
      const daysLeft = Math.ceil(
        (media.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      matchReasons.push(`Expiring soon (${daysLeft} days)`);
    }
  }

  // Recently uploaded bonus (+1 point if created in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (media.createdAt > sevenDaysAgo) {
    score += 1;
    matchReasons.push("Recently uploaded");
  }

  return { media, score, matchReasons };
}

/**
 * Select the best media for content generation
 * This is the main function to use during content generation
 */
export async function selectMedia(
  params: MediaSelectionParams
): Promise<MediaSelectionResult> {
  const { companyId, forceInclude } = params;

  // Get settings
  const settings = await getMediaSettings(companyId);

  // Check if we should include media
  const shouldInclude = await shouldIncludeMedia(
    companyId,
    params.contentType,
    forceInclude
  );

  if (!shouldInclude.include) {
    return {
      includeMedia: false,
      selectedMedia: null,
      score: 0,
      matchReasons: [],
      reason: shouldInclude.reason,
      availableCount: 0,
      settings,
    };
  }

  // Get available media
  const availableMedia = await getAvailableMedia(companyId);

  if (availableMedia.length === 0) {
    return {
      includeMedia: false,
      selectedMedia: null,
      score: 0,
      matchReasons: [],
      reason: "No available media in library",
      availableCount: 0,
      settings,
    };
  }

  // Score all media
  const scoredMedia = availableMedia.map((m) => scoreMedia(m, params, settings));

  // Sort by score (highest first)
  scoredMedia.sort((a, b) => b.score - a.score);

  // Select best match
  const best = scoredMedia[0];

  return {
    includeMedia: true,
    selectedMedia: best.media,
    score: best.score,
    matchReasons: best.matchReasons,
    reason: `Selected best match (score: ${best.score})`,
    availableCount: availableMedia.length,
    settings,
  };
}

/**
 * Get multiple media suggestions (for UI display)
 */
export async function getMediaSuggestions(
  params: MediaSelectionParams,
  limit: number = 5
): Promise<ScoredMedia[]> {
  const { companyId } = params;

  const settings = await getMediaSettings(companyId);
  const availableMedia = await getAvailableMedia(companyId);

  if (availableMedia.length === 0) {
    return [];
  }

  // Score all media
  const scoredMedia = availableMedia.map((m) => scoreMedia(m, params, settings));

  // Sort by score and return top matches
  scoredMedia.sort((a, b) => b.score - a.score);

  return scoredMedia.slice(0, limit);
}

/**
 * Mark media as used after post is published
 */
export async function markMediaAsUsed(
  mediaId: string,
  postId?: string
): Promise<void> {
  await prisma.media.update({
    where: { id: mediaId },
    data: {
      isUsed: true,
      usedAt: new Date(),
      usedInPostId: postId || null,
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}

/**
 * Mark multiple media as used
 */
export async function markMultipleMediaAsUsed(
  mediaIds: string[],
  postId?: string
): Promise<void> {
  await prisma.media.updateMany({
    where: { id: { in: mediaIds } },
    data: {
      isUsed: true,
      usedAt: new Date(),
      usedInPostId: postId || null,
      lastUsedAt: new Date(),
    },
  });

  // Increment usage count individually (updateMany doesn't support increment)
  for (const mediaId of mediaIds) {
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }
}

/**
 * Get expiring media for a company (for alerts/warnings)
 */
export async function getExpiringMedia(
  companyId: string,
  daysThreshold?: number
): Promise<MediaItem[]> {
  const settings = await getMediaSettings(companyId);
  const threshold = daysThreshold ?? settings.expiryWarningDays;

  const now = new Date();
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + threshold);

  const media = await prisma.media.findMany({
    where: {
      companyId,
      isUsed: false,
      expiresAt: {
        gt: now,
        lte: warningDate,
      },
    },
    orderBy: { expiresAt: "asc" },
  });

  return media as MediaItem[];
}

/**
 * Extend expiry date for media
 */
export async function extendMediaExpiry(
  mediaId: string,
  additionalDays: number = 30
): Promise<void> {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { expiresAt: true },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  const currentExpiry = media.expiresAt || new Date();
  const newExpiry = new Date(currentExpiry);
  newExpiry.setDate(newExpiry.getDate() + additionalDays);

  await prisma.media.update({
    where: { id: mediaId },
    data: {
      expiresAt: newExpiry,
      priority: 0, // Reset priority since it's no longer expiring soon
    },
  });
}

/**
 * Reset media to available (undo mark as used)
 */
export async function resetMediaToAvailable(mediaId: string): Promise<void> {
  await prisma.media.update({
    where: { id: mediaId },
    data: {
      isUsed: false,
      usedAt: null,
      usedInPostId: null,
    },
  });
}