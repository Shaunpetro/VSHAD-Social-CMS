// apps/web/src/app/api/debug/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlatformType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';
const FB_GRAPH_URL = 'https://graph.facebook.com/v18.0';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testApi = searchParams.get('testApi') === 'true';

  try {
    const posts = await prisma.generatedPost.findMany({
      where: { status: 'PUBLISHED' },
      include: { platform: true },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    const results = [];

    for (const post of posts) {
      const postInfo: Record<string, unknown> = {
        id: post.id,
        platform: post.platform?.type,
        externalPostId: post.externalPostId || 'MISSING!',
        externalPostUrl: post.externalPostUrl || 'MISSING!',
        publishedAt: post.publishedAt,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        impressions: post.impressions,
        lastSyncedAt: post.lastSyncedAt,
      };

      // Test API calls if requested and post has externalPostId
      if (testApi && post.externalPostId) {
        const connectionData = post.platform?.connectionData as Record<string, unknown> | null;

        if (connectionData) {
          // FACEBOOK TEST
          if (post.platform?.type === PlatformType.FACEBOOK) {
            const token = (connectionData.pageAccessToken || connectionData.accessToken) as string;
            if (token) {
              try {
                const url = `${FB_GRAPH_URL}/${post.externalPostId}?fields=id,shares,comments.summary(true),reactions.summary(true)&access_token=${token}`;
                const response = await fetch(url);
                const data = await response.json();
                
                postInfo.apiTest = {
                  status: response.status,
                  ok: response.ok,
                  data: data,
                  extractedMetrics: response.ok ? {
                    reactions: data.reactions?.summary?.total_count || 0,
                    comments: data.comments?.summary?.total_count || 0,
                    shares: data.shares?.count || 0,
                  } : null,
                };
              } catch (e) {
                postInfo.apiTest = { error: String(e) };
              }
            }
          }

          // LINKEDIN TEST
          if (post.platform?.type === PlatformType.LINKEDIN) {
            const token = connectionData.accessToken as string;
            if (token) {
              try {
                const encodedUrn = encodeURIComponent(post.externalPostId);
                
                // Get likes count
                const likesUrl = `${LINKEDIN_API_URL}/socialActions/${encodedUrn}/likes?count=0`;
                const likesRes = await fetch(likesUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                  },
                });
                const likesData = await likesRes.json();

                // Get comments count
                const commentsUrl = `${LINKEDIN_API_URL}/socialActions/${encodedUrn}/comments?count=0`;
                const commentsRes = await fetch(commentsUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                  },
                });
                const commentsData = await commentsRes.json();

                postInfo.apiTest = {
                  likesStatus: likesRes.status,
                  likesTotal: likesData.paging?.total || 0,
                  likesData: likesData,
                  commentsStatus: commentsRes.status,
                  commentsTotal: commentsData.paging?.total || 0,
                  commentsData: commentsData,
                };
              } catch (e) {
                postInfo.apiTest = { error: String(e) };
              }
            }
          }
        }
      }

      results.push(postInfo);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testApi,
      count: posts.length,
      withExternalId: posts.filter(p => p.externalPostId).length,
      withoutExternalId: posts.filter(p => !p.externalPostId).length,
      posts: results,
      hint: testApi ? 'API test results included' : 'Add ?testApi=true to test actual API calls',
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
    }, { status: 500 });
  }
}