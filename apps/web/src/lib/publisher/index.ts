// apps/web/src/lib/publisher/index.ts

import { prisma } from '@/lib/prisma';
import { createLinkedInPost, verifyLinkedInToken } from './linkedin';
import { createFacebookPost, verifyFacebookToken } from './facebook';

// ============================================
// TYPES
// ============================================

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  platform: string;
}

export interface PublishOptions {
  postId: string;
  dryRun?: boolean;
}

// ============================================
// MAIN PUBLISH FUNCTION
// ============================================

/**
 * Publish a GeneratedPost to its connected platform
 */
export async function publishPost(options: PublishOptions): Promise<PublishResult> {
  const { postId, dryRun = false } = options;

  // Fetch the post with platform and company info
  const post = await prisma.generatedPost.findUnique({
    where: { id: postId },
    include: {
      platform: true,
      company: true,
      postMedia: {
        include: {
          media: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!post) {
    return {
      success: false,
      error: 'Post not found',
      platform: 'unknown',
    };
  }

  if (post.status === 'PUBLISHED') {
    return {
      success: false,
      error: 'Post is already published',
      platform: post.platform.type.toLowerCase(),
    };
  }

  const platform = post.platform;
  const connectionData = platform.connectionData as Record<string, unknown> | null;

  if (!platform.isConnected || !connectionData) {
    return {
      success: false,
      error: `${platform.type} is not connected. Please reconnect the platform.`,
      platform: platform.type.toLowerCase(),
    };
  }

  // Build the content with hashtags
  let content = post.content;
  if (post.hashtags && post.hashtags.length > 0) {
    content += '\n\n' + post.hashtags.map(tag => 
      tag.startsWith('#') ? tag : `#${tag}`
    ).join(' ');
  }

  // Extract media URLs from postMedia relation
  const mediaUrls = post.postMedia
    .map(pm => pm.media?.url)
    .filter((url): url is string => !!url && url.trim().length > 0);

  console.log('[Publisher] Post media URLs:', mediaUrls);

  // Dry run - just validate without publishing
  if (dryRun) {
    return {
      success: true,
      platform: platform.type.toLowerCase(),
      postId: 'dry-run',
      postUrl: 'https://example.com/dry-run',
    };
  }

  // Update post status to PUBLISHING
  await prisma.generatedPost.update({
    where: { id: postId },
    data: {
      status: 'PUBLISHING',
    },
  });

  let result: PublishResult;

  try {
    switch (platform.type) {
      case 'LINKEDIN':
        result = await publishToLinkedIn(content, connectionData, mediaUrls);
        break;

      case 'FACEBOOK':
        result = await publishToFacebook(content, connectionData, mediaUrls);
        break;

      default:
        result = {
          success: false,
          error: `Publishing to ${platform.type} is not yet supported`,
          platform: platform.type.toLowerCase(),
        };
    }

    // Update post based on result
    if (result.success) {
      await prisma.generatedPost.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });
    } else {
      await prisma.generatedPost.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
        },
      });
    }

    return result;
  } catch (error) {
    // Handle unexpected errors
    await prisma.generatedPost.update({
      where: { id: postId },
      data: {
        status: 'FAILED',
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      platform: platform.type.toLowerCase(),
    };
  }
}

// ============================================
// PLATFORM-SPECIFIC PUBLISHERS
// ============================================

async function publishToLinkedIn(
  content: string,
  connectionData: Record<string, unknown>,
  mediaUrls: string[] = []
): Promise<PublishResult> {
  const accessToken = connectionData.accessToken as string;
  const linkedinSub = connectionData.linkedinSub as string;
  const postingMode = (connectionData.postingMode as 'personal' | 'organization') || 'personal';
  const organizationId = connectionData.organizationId as string | null;

  if (!accessToken || !linkedinSub) {
    return {
      success: false,
      error: 'LinkedIn credentials not found. Please reconnect your account.',
      platform: 'linkedin',
    };
  }

  // Verify token is still valid
  const tokenCheck = await verifyLinkedInToken(accessToken);
  if (!tokenCheck.valid) {
    return {
      success: false,
      error: `LinkedIn token invalid: ${tokenCheck.error}. Please reconnect your account.`,
      platform: 'linkedin',
    };
  }

  console.log('[LinkedIn Publisher] Publishing with mode:', postingMode, 'organizationId:', organizationId);

  // Create the post with organization support
  const result = await createLinkedInPost({
    accessToken,
    authorId: linkedinSub,
    content,
    mediaUrls,
    postingMode,
    organizationId,
  });

  return {
    ...result,
    platform: 'linkedin',
  };
}

async function publishToFacebook(
  content: string,
  connectionData: Record<string, unknown>,
  mediaUrls: string[] = []
): Promise<PublishResult> {
  const pageAccessToken = connectionData.accessToken as string;
  const pageId = connectionData.pageId as string;

  if (!pageAccessToken || !pageId) {
    return {
      success: false,
      error: 'Facebook Page credentials not found. Please reconnect your account.',
      platform: 'facebook',
    };
  }

  // Verify token is still valid
  const tokenCheck = await verifyFacebookToken(pageAccessToken);
  if (!tokenCheck.valid) {
    return {
      success: false,
      error: `Facebook token invalid: ${tokenCheck.error}. Please reconnect your account.`,
      platform: 'facebook',
    };
  }

  console.log('[Facebook Publisher] Publishing with', mediaUrls.length, 'media items');

  // Create the post WITH media URLs
  const result = await createFacebookPost({
    pageAccessToken,
    pageId,
    content,
    mediaUrls,
  });

  return {
    ...result,
    platform: 'facebook',
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a platform connection is valid and ready to publish
 */
export async function validatePlatformConnection(platformId: string): Promise<{
  valid: boolean;
  error?: string;
  platform?: string;
}> {
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!platform) {
    return { valid: false, error: 'Platform not found' };
  }

  if (!platform.isConnected) {
    return {
      valid: false,
      error: `${platform.type} is disconnected`,
      platform: platform.type.toLowerCase(),
    };
  }

  const connectionData = platform.connectionData as Record<string, unknown> | null;

  if (!connectionData) {
    return {
      valid: false,
      error: `${platform.type} connection data missing`,
      platform: platform.type.toLowerCase(),
    };
  }

  // Check token expiration if available
  const expiresAt = connectionData.expiresAt as string | undefined;
  if (expiresAt) {
    const expirationDate = new Date(expiresAt);
    if (expirationDate < new Date()) {
      return {
        valid: false,
        error: `${platform.type} token has expired. Please reconnect.`,
        platform: platform.type.toLowerCase(),
      };
    }
  }

  return {
    valid: true,
    platform: platform.type.toLowerCase(),
  };
}

/**
 * Bulk publish multiple posts
 */
export async function publishMultiplePosts(postIds: string[]): Promise<{
  results: PublishResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}> {
  const results: PublishResult[] = [];

  for (const postId of postIds) {
    const result = await publishPost({ postId });
    results.push(result);

    // Small delay between posts to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    results,
    summary: {
      total: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  };
}