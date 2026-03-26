// apps/web/src/app/api/debug/sync-test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PostStatus, PlatformType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';
const FB_GRAPH_URL = 'https://graph.facebook.com/v18.0';

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(`${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`);
  };

  const results: Record<string, unknown> = {};

  try {
    log('=== SYNC TEST START ===');

    // Get published posts with externalPostId
    const posts = await prisma.generatedPost.findMany({
      where: { 
        status: PostStatus.PUBLISHED,
        externalPostId: { not: null },
      },
      include: { platform: true },
      take: 5,
      orderBy: { publishedAt: 'desc' },
    });

    log(`Found ${posts.length} posts with externalPostId`);
    results.postsFound = posts.length;

    if (posts.length === 0) {
      log('No posts to test!');
      return NextResponse.json({ logs, results, error: 'No posts with externalPostId' });
    }

    // Test each post
    for (const post of posts) {
      const postResult: Record<string, unknown> = {
        id: post.id,
        platform: post.platform?.type,
        externalPostId: post.externalPostId,
      };

      log(`\n--- Testing Post ${post.id} (${post.platform?.type}) ---`);
      log(`External ID: ${post.externalPostId}`);

      const connectionData = post.platform?.connectionData as Record<string, unknown> | null;

      if (!connectionData) {
        log('ERROR: No connection data');
        postResult.error = 'No connection data';
        results[post.id] = postResult;
        continue;
      }

      // Test FACEBOOK
      if (post.platform?.type === PlatformType.FACEBOOK) {
        const pageAccessToken = (connectionData.pageAccessToken || connectionData.accessToken) as string;
        
        log(`Token exists: ${!!pageAccessToken}, Length: ${pageAccessToken?.length || 0}`);
        postResult.tokenExists = !!pageAccessToken;

        if (pageAccessToken && post.externalPostId) {
          // First, try to get basic post info
          log('Fetching basic post info...');
          try {
            const basicUrl = `${FB_GRAPH_URL}/${post.externalPostId}?fields=id,message,created_time,shares,comments.summary(true),reactions.summary(true)&access_token=${pageAccessToken}`;
            const basicResponse = await fetch(basicUrl);
            const basicData = await basicResponse.json();
            
            log(`Basic info status: ${basicResponse.status}`);
            log(`Basic info response: ${JSON.stringify(basicData).substring(0, 500)}`);
            
            postResult.basicInfo = {
              status: basicResponse.status,
              data: basicData,
            };

            // Extract metrics from basic info
            if (basicResponse.ok) {
              const shares = basicData.shares?.count || 0;
              const comments = basicData.comments?.summary?.total_count || 0;
              const reactions = basicData.reactions?.summary?.total_count || 0;
              
              log(`Metrics from basic: reactions=${reactions}, comments=${comments}, shares=${shares}`);
              postResult.extractedMetrics = { reactions, comments, shares };
            }
          } catch (e) {
            log(`Basic info error: ${e instanceof Error ? e.message : String(e)}`);
            postResult.basicInfoError = String(e);
          }

          // Try insights endpoint
          log('Fetching insights...');
          try {
            const insightsUrl = `${FB_GRAPH_URL}/${post.externalPostId}/insights?metric=post_impressions,post_engaged_users&access_token=${pageAccessToken}`;
            const insightsResponse = await fetch(insightsUrl);
            const insightsData = await insightsResponse.json();
            
            log(`Insights status: ${insightsResponse.status}`);
            log(`Insights response: ${JSON.stringify(insightsData).substring(0, 500)}`);
            
            postResult.insights = {
              status: insightsResponse.status,
              data: insightsData,
            };
          } catch (e) {
            log(`Insights error: ${e instanceof Error ? e.message : String(e)}`);
            postResult.insightsError = String(e);
          }
        }
      }

      // Test LINKEDIN
      if (post.platform?.type === PlatformType.LINKEDIN) {
        const accessToken = connectionData.accessToken as string;
        const isOrgPost = connectionData.postingMode === 'organization';
        
        log(`Token exists: ${!!accessToken}, Length: ${accessToken?.length || 0}`);
        log(`Is org post: ${isOrgPost}`);
        postResult.tokenExists = !!accessToken;
        postResult.isOrgPost = isOrgPost;

        if (accessToken && post.externalPostId) {
          const postUrn = post.externalPostId;
          const encodedUrn = encodeURIComponent(postUrn);

          // Try socialActions for likes
          log('Fetching LinkedIn likes...');
          try {
            const likesUrl = `${LINKEDIN_API_URL}/socialActions/${encodedUrn}/likes?count=0`;
            const likesResponse = await fetch(likesUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
              },
            });
            const likesData = await likesResponse.json();
            
            log(`Likes status: ${likesResponse.status}`);
            log(`Likes response: ${JSON.stringify(likesData).substring(0, 300)}`);
            
            postResult.likes = {
              status: likesResponse.status,
              total: likesData.paging?.total || 0,
              data: likesData,
            };
          } catch (e) {
            log(`Likes error: ${e instanceof Error ? e.message : String(e)}`);
            postResult.likesError = String(e);
          }

          // Try socialActions for comments
          log('Fetching LinkedIn comments...');
          try {
            const commentsUrl = `${LINKEDIN_API_URL}/socialActions/${encodedUrn}/comments?count=0`;
            const commentsResponse = await fetch(commentsUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
              },
            });
            const commentsData = await commentsResponse.json();
            
            log(`Comments status: ${commentsResponse.status}`);
            log(`Comments response: ${JSON.stringify(commentsData).substring(0, 300)}`);
            
            postResult.comments = {
              status: commentsResponse.status,
              total: commentsData.paging?.total || 0,
              data: commentsData,
            };
          } catch (e) {
            log(`Comments error: ${e instanceof Error ? e.message : String(e)}`);
            postResult.commentsError = String(e);
          }

          // Try to get post directly
          log('Fetching LinkedIn post directly...');
          try {
            const postUrl = `${LINKEDIN_API_URL}/ugcPosts/${encodedUrn}`;
            const postResponse = await fetch(postUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
              },
            });
            const postData = await postResponse.json();
            
            log(`Post fetch status: ${postResponse.status}`);
            log(`Post response: ${JSON.stringify(postData).substring(0, 300)}`);
            
            postResult.postFetch = {
              status: postResponse.status,
              data: postData,
            };
          } catch (e) {
            log(`Post fetch error: ${e instanceof Error ? e.message : String(e)}`);
            postResult.postFetchError = String(e);
          }
        }
      }

      results[post.id] = postResult;
    }

    log('\n=== SYNC TEST END ===');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      logs,
      results,
    });
  } catch (error) {
    log(`FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logs,
      results,
    }, { status: 500 });
  }
}