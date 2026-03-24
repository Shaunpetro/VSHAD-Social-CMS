// apps/web/src/lib/scheduler/index.ts

import { prisma } from '@/lib/db';
import { createLinkedInPost } from '@/lib/publisher/linkedin';
import { createFacebookPost } from '@/lib/publisher/facebook';
import { PostStatus, PlatformType } from '@prisma/client';

export interface SchedulerResult {
  processed: number;
  published: number;
  failed: number;
  errors: Array<{ postId: string; error: string }>;
  debug?: {
    queryTime: string;
    postsFound: number;
    query: object;
  };
}

/**
 * Process all posts that are scheduled and due for publishing
 */
export async function processScheduledPosts(): Promise<SchedulerResult> {
  const result: SchedulerResult = {
    processed: 0,
    published: 0,
    failed: 0,
    errors: [],
  };

  const now = new Date();

  console.log(`[Scheduler] Starting scheduled post processing at ${now.toISOString()}`);
  console.log(`[Scheduler] PostStatus.SCHEDULED value: "${PostStatus.SCHEDULED}"`);

  try {
    // Build the query explicitly for debugging
    const whereClause = {
      status: PostStatus.SCHEDULED,
      scheduledFor: {
        lte: now,
      },
    };

    console.log(`[Scheduler] Query where clause:`, JSON.stringify(whereClause, null, 2));

    // First, let's do a simple count to see if posts exist
    const countAll = await prisma.generatedPost.count({
      where: { status: PostStatus.SCHEDULED },
    });
    console.log(`[Scheduler] Total SCHEDULED posts (any time): ${countAll}`);

    const countDue = await prisma.generatedPost.count({
      where: whereClause,
    });
    console.log(`[Scheduler] SCHEDULED posts due now: ${countDue}`);

    // Also try with string literal to compare
    const countDueString = await prisma.generatedPost.count({
      where: {
        status: 'SCHEDULED' as PostStatus,
        scheduledFor: { lte: now },
      },
    });
    console.log(`[Scheduler] SCHEDULED (string literal) posts due now: ${countDueString}`);

    // Find all posts that are SCHEDULED and due (scheduledFor <= now)
    const duePosts = await prisma.generatedPost.findMany({
      where: whereClause,
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
      // Process up to 10 posts per cron run to avoid timeout
      take: 10,
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    console.log(`[Scheduler] Found ${duePosts.length} posts due for publishing`);

    // Log each post found
    duePosts.forEach((post, index) => {
      console.log(`[Scheduler] Post ${index + 1}: id=${post.id}, status=${post.status}, scheduledFor=${post.scheduledFor?.toISOString()}, company=${post.company?.name}`);
    });

    // Add debug info to result
    result.debug = {
      queryTime: now.toISOString(),
      postsFound: duePosts.length,
      query: whereClause,
    };

    for (const post of duePosts) {
      result.processed++;

      try {
        // Mark as PUBLISHING to prevent duplicate processing
        await prisma.generatedPost.update({
          where: { id: post.id },
          data: { status: PostStatus.PUBLISHING },
        });

        console.log(`[Scheduler] Publishing post ${post.id} to ${post.platform.type}`);
        console.log(`[Scheduler] Post has ${post.postMedia?.length || 0} media attachments`);

        // Get media URLs
        const mediaUrls = post.postMedia?.map((pm) => pm.media.url) || [];

        // Check if platform is connected
        if (!post.platform.isConnected || !post.platform.connectionData) {
          throw new Error(`Platform ${post.platform.type} is not connected`);
        }

        const connectionData = post.platform.connectionData as Record<string, unknown>;

        // Publish based on platform type
        let publishResult: { success: boolean; postId?: string; postUrl?: string; error?: string };

        switch (post.platform.type) {
          case PlatformType.LINKEDIN:
            // Verify we have required LinkedIn data
            const linkedinSub = connectionData.linkedinSub as string | undefined;
            const linkedinAccessToken = connectionData.accessToken as string | undefined;

            if (!linkedinSub || !linkedinAccessToken) {
              throw new Error('LinkedIn connection data missing. Please reconnect.');
            }

            console.log(`[Scheduler] LinkedIn: Publishing to ${connectionData.postingMode || 'personal'} profile`);
            console.log(`[Scheduler] LinkedIn: Author ID: ${linkedinSub}`);
            console.log(`[Scheduler] LinkedIn: Media URLs: ${mediaUrls.length > 0 ? mediaUrls.join(', ') : 'none'}`);

            publishResult = await createLinkedInPost({
              content: post.content,
              mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
              accessToken: linkedinAccessToken,
              authorId: linkedinSub,
              postingMode: (connectionData.postingMode as 'personal' | 'organization') || 'personal',
              organizationId: connectionData.organizationId as string | null | undefined,
            });
            break;

          case PlatformType.FACEBOOK:
            // Verify we have required Facebook data
            // Note: Token might be stored as 'accessToken' or 'pageAccessToken'
            const pageAccessToken = (connectionData.pageAccessToken || connectionData.accessToken) as string | undefined;
            const pageId = connectionData.pageId as string | undefined;

            if (!pageAccessToken || !pageId) {
              throw new Error('Facebook connection data missing. Please reconnect.');
            }

            console.log(`[Scheduler] Facebook: Publishing to page ${pageId}`);
            console.log(`[Scheduler] Facebook: Media URLs: ${mediaUrls.length > 0 ? mediaUrls.join(', ') : 'none'}`);

            publishResult = await createFacebookPost({
              content: post.content,
              mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
              pageAccessToken: pageAccessToken,
              pageId: pageId,
            });
            break;

          default:
            throw new Error(`Unsupported platform: ${post.platform.type}`);
        }

        if (publishResult.success) {
          // Mark as PUBLISHED
          await prisma.generatedPost.update({
            where: { id: post.id },
            data: {
              status: PostStatus.PUBLISHED,
              publishedAt: new Date(),
            },
          });

          console.log(`[Scheduler] ✅ Successfully published post ${post.id}`, {
            postId: publishResult.postId,
            postUrl: publishResult.postUrl,
          });
          result.published++;
        } else {
          throw new Error(publishResult.error || 'Unknown publishing error');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Scheduler] ❌ Failed to publish post ${post.id}:`, errorMessage);

        // Mark as FAILED
        await prisma.generatedPost.update({
          where: { id: post.id },
          data: { status: PostStatus.FAILED },
        });

        result.failed++;
        result.errors.push({
          postId: post.id,
          error: errorMessage,
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler] Fatal error:', error);
    throw error;
  }

  console.log(
    `[Scheduler] Completed: ${result.processed} processed, ${result.published} published, ${result.failed} failed`
  );

  return result;
}

/**
 * Get upcoming scheduled posts for a company
 */
export async function getUpcomingScheduledPosts(companyId: string, limit = 10) {
  return prisma.generatedPost.findMany({
    where: {
      companyId,
      status: PostStatus.SCHEDULED,
      scheduledFor: {
        gte: new Date(),
      },
    },
    include: {
      platform: true,
      postMedia: {
        include: {
          media: true,
        },
      },
    },
    orderBy: {
      scheduledFor: 'asc',
    },
    take: limit,
  });
}

/**
 * Get failed posts for retry
 */
export async function getFailedPosts(companyId: string, limit = 10) {
  return prisma.generatedPost.findMany({
    where: {
      companyId,
      status: PostStatus.FAILED,
    },
    include: {
      platform: true,
      postMedia: {
        include: {
          media: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Retry a failed post
 */
export async function retryFailedPost(postId: string): Promise<boolean> {
  try {
    await prisma.generatedPost.update({
      where: { id: postId },
      data: {
        status: PostStatus.SCHEDULED,
        scheduledFor: new Date(), // Retry immediately
      },
    });
    return true;
  } catch (error) {
    console.error(`[Scheduler] Failed to retry post ${postId}:`, error);
    return false;
  }
}

/**
 * Schedule a post for a specific time
 */
export async function schedulePost(postId: string, scheduledFor: Date): Promise<boolean> {
  try {
    await prisma.generatedPost.update({
      where: { id: postId },
      data: {
        status: PostStatus.SCHEDULED,
        scheduledFor,
      },
    });
    return true;
  } catch (error) {
    console.error(`[Scheduler] Failed to schedule post ${postId}:`, error);
    return false;
  }
}

/**
 * Cancel a scheduled post (revert to draft)
 */
export async function cancelScheduledPost(postId: string): Promise<boolean> {
  try {
    await prisma.generatedPost.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
        scheduledFor: null,
      },
    });
    return true;
  } catch (error) {
    console.error(`[Scheduler] Failed to cancel scheduled post ${postId}:`, error);
    return false;
  }
}