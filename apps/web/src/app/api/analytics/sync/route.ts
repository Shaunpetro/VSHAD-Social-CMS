// apps/web/src/app/api/analytics/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PostStatus, PlatformType } from '@prisma/client';
import { getFacebookPostInsights } from '@/lib/publisher/facebook';
import { getLinkedInPostInsights } from '@/lib/publisher/linkedin';

export const dynamic = 'force-dynamic';

interface SyncResult {
  postId: string;
  platform: string;
  success: boolean;
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
  error?: string;
}

/**
 * POST /api/analytics/sync
 * Sync analytics for published posts from Facebook and LinkedIn
 * 
 * Body (optional):
 * - companyId: string (required)
 * - postIds: string[] (optional - sync specific posts, otherwise sync all)
 * - forceRefresh: boolean (optional - sync even if recently synced)
 */
export async function POST(request: NextRequest) {
  console.log('[Analytics Sync] Starting sync...');

  try {
    const body = await request.json();
    const { companyId, postIds, forceRefresh = false } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Calculate the "recently synced" threshold (don't re-sync within 5 minutes unless forced)
    const recentThreshold = new Date(Date.now() - 5 * 60 * 1000);

    // Build query for posts to sync
    const whereClause: {
      companyId: string;
      status: PostStatus;
      externalPostId: { not: null };
      id?: { in: string[] };
      OR?: Array<{ lastSyncedAt: null } | { lastSyncedAt: { lt: Date } }>;
    } = {
      companyId,
      status: PostStatus.PUBLISHED,
      externalPostId: { not: null },
    };

    // If specific post IDs provided, filter to those
    if (postIds && postIds.length > 0) {
      whereClause.id = { in: postIds };
    }

    // Unless force refresh, only sync posts not recently synced
    if (!forceRefresh) {
      whereClause.OR = [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: recentThreshold } },
      ];
    }

    // Get posts to sync
    const postsToSync = await prisma.generatedPost.findMany({
      where: whereClause,
      include: {
        platform: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50, // Limit to prevent timeout
    });

    console.log(`[Analytics Sync] Found ${postsToSync.length} posts to sync`);

    if (postsToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts to sync',
        synced: 0,
        failed: 0,
        results: [],
      });
    }

    // Get platform connection data for each unique platform
    const platformIds = [...new Set(postsToSync.map(p => p.platformId))];
    const platforms = await prisma.platform.findMany({
      where: {
        id: { in: platformIds },
        isConnected: true,
      },
    });

    const platformMap = new Map(platforms.map(p => [p.id, p]));

    // Sync each post
    const results: SyncResult[] = [];
    let synced = 0;
    let failed = 0;

    for (const post of postsToSync) {
      const platform = platformMap.get(post.platformId);

      if (!platform || !platform.connectionData) {
        console.warn(`[Analytics Sync] Platform not found or not connected for post ${post.id}`);
        results.push({
          postId: post.id,
          platform: post.platform.type,
          success: false,
          error: 'Platform not connected',
        });
        failed++;
        continue;
      }

      const connectionData = platform.connectionData as Record<string, unknown>;
      const externalPostId = post.externalPostId!;

      console.log(`[Analytics Sync] Syncing post ${post.id} (${post.platform.type}): ${externalPostId}`);

      try {
        let metrics: {
          likes: number;
          comments: number;
          shares: number;
          impressions: number;
        } | undefined;

        switch (post.platform.type) {
          case PlatformType.FACEBOOK: {
            const pageAccessToken = (connectionData.pageAccessToken || connectionData.accessToken) as string;

            if (!pageAccessToken) {
              throw new Error('Facebook access token not found');
            }

            const fbResult = await getFacebookPostInsights(pageAccessToken, externalPostId);

            if (fbResult.success && fbResult.metrics) {
              metrics = {
                likes: fbResult.metrics.reactions || 0,
                comments: fbResult.metrics.comments || 0,
                shares: fbResult.metrics.shares || 0,
                impressions: fbResult.metrics.impressions || 0,
              };
            } else {
              throw new Error(fbResult.error || 'Failed to fetch Facebook insights');
            }
            break;
          }

          case PlatformType.LINKEDIN: {
            const accessToken = connectionData.accessToken as string;
            const isOrgPost = (connectionData.postingMode === 'organization');

            if (!accessToken) {
              throw new Error('LinkedIn access token not found');
            }

            const liResult = await getLinkedInPostInsights(accessToken, externalPostId, isOrgPost);

            if (liResult.success && liResult.metrics) {
              metrics = {
                likes: liResult.metrics.likes || 0,
                comments: liResult.metrics.comments || 0,
                shares: liResult.metrics.shares || 0,
                impressions: liResult.metrics.impressions || 0,
              };
            } else {
              throw new Error(liResult.error || 'Failed to fetch LinkedIn insights');
            }
            break;
          }

          default:
            throw new Error(`Unsupported platform: ${post.platform.type}`);
        }

        // Update the post with new metrics
        if (metrics) {
          await prisma.generatedPost.update({
            where: { id: post.id },
            data: {
              likes: metrics.likes,
              comments: metrics.comments,
              shares: metrics.shares,
              impressions: metrics.impressions,
              lastSyncedAt: new Date(),
            },
          });

          console.log(`[Analytics Sync] âœ… Updated post ${post.id}:`, metrics);

          results.push({
            postId: post.id,
            platform: post.platform.type,
            success: true,
            metrics,
          });
          synced++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Analytics Sync] âŒ Failed to sync post ${post.id}:`, errorMessage);

        results.push({
          postId: post.id,
          platform: post.platform.type,
          success: false,
          error: errorMessage,
        });
        failed++;
      }
    }

    console.log(`[Analytics Sync] Completed: ${synced} synced, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} posts, ${failed} failed`,
      synced,
      failed,
      total: postsToSync.length,
      results,
    });
  } catch (error) {
    console.error('[Analytics Sync] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/sync
 * Get sync status for a company's posts
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json(
      { error: 'companyId is required' },
      { status: 400 }
    );
  }

  try {
    // Get counts of posts by sync status
    const [totalPublished, withExternalId, recentlySynced, neverSynced] = await Promise.all([
      // Total published posts
      prisma.generatedPost.count({
        where: {
          companyId,
          status: PostStatus.PUBLISHED,
        },
      }),
      // Posts with external ID (can be synced)
      prisma.generatedPost.count({
        where: {
          companyId,
          status: PostStatus.PUBLISHED,
          externalPostId: { not: null },
        },
      }),
      // Recently synced (within last hour)
      prisma.generatedPost.count({
        where: {
          companyId,
          status: PostStatus.PUBLISHED,
          externalPostId: { not: null },
          lastSyncedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
      }),
      // Never synced
      prisma.generatedPost.count({
        where: {
          companyId,
          status: PostStatus.PUBLISHED,
          externalPostId: { not: null },
          lastSyncedAt: null,
        },
      }),
    ]);

    // Get last sync time
    const lastSyncedPost = await prisma.generatedPost.findFirst({
      where: {
        companyId,
        lastSyncedAt: { not: null },
      },
      orderBy: {
        lastSyncedAt: 'desc',
      },
      select: {
        lastSyncedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      status: {
        totalPublished,
        syncable: withExternalId,
        recentlySynced,
        pendingSync: withExternalId - recentlySynced,
        neverSynced,
        lastSyncedAt: lastSyncedPost?.lastSyncedAt || null,
      },
    });
  } catch (error) {
    console.error('[Analytics Sync] Status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
