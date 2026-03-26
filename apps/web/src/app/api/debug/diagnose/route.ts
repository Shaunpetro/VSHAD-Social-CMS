import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Direct PrismaClient import - avoids the @/lib/db vs @/lib/prisma issue
const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow enough time for all API calls

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    step1_database: {},
    step2_tokens: {},
    step3_linkedin: {},
    step4_facebook: {},
    step5_sync_simulation: {},
    summary: {},
  };

  try {
    // =============================================
    // STEP 1: DATABASE STRUCTURE
    // =============================================
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    results.step1_database.tables = tables.map((t: any) => t.table_name);

    // Find columns that might contain tokens
    const tokenColumns: any[] = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND (
          column_name ILIKE '%token%' 
          OR column_name ILIKE '%access%'
          OR column_name ILIKE '%secret%'
          OR column_name ILIKE '%provider%'
          OR column_name ILIKE '%platform%'
        )
      ORDER BY table_name, column_name
    `;
    results.step1_database.tokenRelatedColumns = tokenColumns;

    // =============================================
    // STEP 2: FIND ACCESS TOKENS
    // =============================================
    let linkedInToken: string | null = null;
    let facebookToken: string | null = null;
    let linkedInPersonUrn: string | null = null;
    let facebookPageId: string | null = null;

    // Try multiple possible table structures
    const tableNames = results.step1_database.tables as string[];

    // Strategy A: Look for "SocialAccount" table
    if (tableNames.includes('SocialAccount')) {
      try {
        const accounts: any[] = await prisma.$queryRaw`SELECT * FROM "SocialAccount"`;
        results.step2_tokens.source = 'SocialAccount';
        results.step2_tokens.count = accounts.length;
        results.step2_tokens.accounts = accounts.map((a: any) => {
          const redacted: Record<string, any> = {};
          for (const [key, value] of Object.entries(a)) {
            const strVal = String(value || '');
            if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
              redacted[key] = strVal.length > 8
                ? `${strVal.slice(0, 6)}...${strVal.slice(-4)} (${strVal.length} chars)`
                : strVal.length > 0 ? '[SHORT_TOKEN]' : '[EMPTY]';
              // But save the ACTUAL tokens for API testing
              if (strVal.length > 0) {
                if (String(a.platform || a.provider || '').toUpperCase().includes('LINKEDIN')) {
                  linkedInToken = strVal;
                }
                if (String(a.platform || a.provider || '').toUpperCase().includes('FACEBOOK')) {
                  facebookToken = strVal;
                }
              }
            } else {
              redacted[key] = value;
              // Capture provider-specific IDs
              if (key.toLowerCase().includes('provideraccount') || key.toLowerCase().includes('accountid')) {
                const platform = String(a.platform || a.provider || '').toUpperCase();
                if (platform.includes('LINKEDIN')) linkedInPersonUrn = strVal;
                if (platform.includes('FACEBOOK')) facebookPageId = strVal;
              }
            }
          }
          return redacted;
        });
      } catch (e: any) {
        results.step2_tokens.socialAccountError = e.message;
      }
    }

    // Strategy B: Look for "Account" table (NextAuth style)
    if (!linkedInToken && tableNames.includes('Account')) {
      try {
        const accounts: any[] = await prisma.$queryRaw`SELECT * FROM "Account"`;
        results.step2_tokens.source = 'Account';
        results.step2_tokens.count = accounts.length;
        results.step2_tokens.accounts = accounts.map((a: any) => {
          const redacted: Record<string, any> = {};
          for (const [key, value] of Object.entries(a)) {
            const strVal = String(value || '');
            if (key.toLowerCase().includes('token')) {
              redacted[key] = strVal.length > 8
                ? `${strVal.slice(0, 6)}...${strVal.slice(-4)} (${strVal.length} chars)`
                : strVal.length > 0 ? '[SHORT]' : '[EMPTY]';
              if (key === 'access_token' || key === 'accessToken') {
                if (String(a.provider || '').toLowerCase() === 'linkedin') linkedInToken = strVal;
                if (String(a.provider || '').toLowerCase() === 'facebook') facebookToken = strVal;
              }
            } else {
              redacted[key] = value;
              if (key === 'providerAccountId') {
                if (String(a.provider || '').toLowerCase() === 'linkedin') linkedInPersonUrn = strVal;
                if (String(a.provider || '').toLowerCase() === 'facebook') facebookPageId = strVal;
              }
            }
          }
          return redacted;
        });
      } catch (e: any) {
        results.step2_tokens.accountError = e.message;
      }
    }

    // Strategy C: Try any table with "account" or "social" in the name
    if (!linkedInToken) {
      const candidateTables = tableNames.filter(t =>
        t.toLowerCase().includes('account') ||
        t.toLowerCase().includes('social') ||
        t.toLowerCase().includes('connection') ||
        t.toLowerCase().includes('token')
      );
      results.step2_tokens.candidateTables = candidateTables;

      for (const tableName of candidateTables) {
        if (linkedInToken) break;
        try {
          const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}" LIMIT 5`);
          results.step2_tokens[`${tableName}_sample`] = rows.map((r: any) => {
            const redacted: Record<string, any> = {};
            for (const [key, value] of Object.entries(r)) {
              const strVal = String(value || '');
              if (strVal.length > 50 && !key.toLowerCase().includes('id')) {
                redacted[key] = `${strVal.slice(0, 6)}...${strVal.slice(-4)} (${strVal.length} chars) [POSSIBLE TOKEN]`;
              } else {
                redacted[key] = value;
              }
            }
            return redacted;
          });
        } catch { /* skip */ }
      }
    }

    results.step2_tokens.foundLinkedInToken = !!linkedInToken;
    results.step2_tokens.foundFacebookToken = !!facebookToken;
    results.step2_tokens.linkedInPersonUrn = linkedInPersonUrn;
    results.step2_tokens.facebookPageId = facebookPageId;

    // Get published posts for testing
    let publishedPosts: any[] = [];
    try {
      publishedPosts = await prisma.$queryRaw`
        SELECT id, platform, "externalPostId", "externalPostUrl", 
               "publishedAt", likes, comments, shares, impressions, 
               "lastSyncedAt"
        FROM "GeneratedPost"
        WHERE "externalPostId" IS NOT NULL
        ORDER BY "publishedAt" DESC
      `;
      results.step1_database.publishedPosts = publishedPosts;
    } catch (e: any) {
      results.step1_database.postsError = e.message;
    }

    // =============================================
    // STEP 3: LINKEDIN API TESTS
    // =============================================
    if (linkedInToken) {
      // Test 3a: Token validity - /v2/me
      try {
        const res = await fetch('https://api.linkedin.com/v2/me', {
          headers: {
            'Authorization': `Bearer ${linkedInToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });
        const data = await res.json();
        results.step3_linkedin.tokenTest = {
          endpoint: 'GET /v2/me',
          status: res.status,
          statusText: res.statusText,
          data,
          verdict: res.status === 200 ? '✅ TOKEN VALID' : '❌ TOKEN INVALID',
        };

        // Save person URN if we got it
        if (data.id) {
          linkedInPersonUrn = `urn:li:person:${data.id}`;
          results.step3_linkedin.personUrn = linkedInPersonUrn;
        }
      } catch (e: any) {
        results.step3_linkedin.tokenTestError = e.message;
      }

      // Test 3b: Check token scopes/permissions
      try {
        const res = await fetch('https://api.linkedin.com/v2/me?projection=(id,firstName,lastName)', {
          headers: {
            'Authorization': `Bearer ${linkedInToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });
        results.step3_linkedin.profileProjection = {
          status: res.status,
          data: await res.json(),
        };
      } catch (e: any) {
        results.step3_linkedin.profileProjectionError = e.message;
      }

      // Test 3c: Social Actions for each LinkedIn post
      const linkedInPosts = publishedPosts.filter((p: any) => p.platform === 'LINKEDIN');
      results.step3_linkedin.postCount = linkedInPosts.length;
      results.step3_linkedin.postTests = [];

      // Test first 2 posts to avoid rate limiting
      for (const post of linkedInPosts.slice(0, 2)) {
        const testResult: Record<string, any> = {
          dbPostId: post.id,
          externalPostId: post.externalPostId,
          currentMetrics: {
            likes: post.likes,
            impressions: post.impressions,
            lastSyncedAt: post.lastSyncedAt,
          },
          apiTests: {},
        };

        const urn = post.externalPostId;
        const encodedUrn = encodeURIComponent(urn);

        // Test: GET /v2/socialActions/{urn}
        try {
          const url = `https://api.linkedin.com/v2/socialActions/${encodedUrn}`;
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${linkedInToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          });
          const data = await res.json();
          testResult.apiTests.socialActions = {
            url,
            status: res.status,
            statusText: res.statusText,
            data,
            verdict: res.status === 200 ? '✅ ENDPOINT WORKS' : `❌ HTTP ${res.status}`,
          };
        } catch (e: any) {
          testResult.apiTests.socialActionsError = e.message;
        }

        // Test: GET /v2/socialActions/{urn}/likes
        try {
          const url = `https://api.linkedin.com/v2/socialActions/${encodedUrn}/likes?count=100`;
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${linkedInToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          });
          const data = await res.json();
          testResult.apiTests.likes = {
            url,
            status: res.status,
            data,
          };
        } catch (e: any) {
          testResult.apiTests.likesError = e.message;
        }

        // Test: GET /v2/socialActions/{urn}/comments
        try {
          const url = `https://api.linkedin.com/v2/socialActions/${encodedUrn}/comments?count=100`;
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${linkedInToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          });
          const data = await res.json();
          testResult.apiTests.comments = {
            url,
            status: res.status,
            data,
          };
        } catch (e: any) {
          testResult.apiTests.commentsError = e.message;
        }

        // Test: Network sizes / shares count (v2/shares endpoint)
        try {
          const shareId = urn.replace('urn:li:share:', '');
          const url = `https://api.linkedin.com/v2/shares/${shareId}`;
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${linkedInToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          });
          const data = await res.json();
          testResult.apiTests.shareDetails = {
            url,
            status: res.status,
            data,
          };
        } catch (e: any) {
          testResult.apiTests.shareDetailsError = e.message;
        }

        // Test: Organization Share Statistics (will likely fail for personal posts)
        if (linkedInPersonUrn) {
          try {
            const url = `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(linkedInPersonUrn)}&shares=List(${encodeURIComponent(urn)})`;
            const res = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${linkedInToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
              },
            });
            const data = await res.json();
            testResult.apiTests.orgShareStats = {
              url,
              status: res.status,
              data,
              note: 'This endpoint only works for Organization/Company pages, not personal profiles',
            };
          } catch (e: any) {
            testResult.apiTests.orgShareStatsError = e.message;
          }
        }

        // NEW: Test Community Management API (newer LinkedIn API)
        try {
          const url = `https://api.linkedin.com/rest/socialActions/${encodedUrn}`;
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${linkedInToken}`,
              'LinkedIn-Version': '202401',
              'X-Restli-Protocol-Version': '2.0.0',
            },
          });
          const data = await res.json();
          testResult.apiTests.restSocialActions = {
            url,
            status: res.status,
            data,
            note: 'Newer LinkedIn REST API format',
          };
        } catch (e: any) {
          testResult.apiTests.restSocialActionsError = e.message;
        }

        results.step3_linkedin.postTests.push(testResult);
      }
    } else {
      results.step3_linkedin.error = '❌ NO LINKEDIN TOKEN FOUND IN DATABASE';
      results.step3_linkedin.hint = 'Check step2_tokens to see what tables/columns were found';
    }

    // =============================================
    // STEP 4: FACEBOOK API TESTS
    // =============================================
    if (facebookToken) {
      // Test 4a: Token validity
      try {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${facebookToken}`
        );
        const data = await res.json();
        results.step4_facebook.tokenTest = {
          endpoint: 'GET /me',
          status: res.status,
          data,
          verdict: res.status === 200 ? '✅ TOKEN VALID' : '❌ TOKEN INVALID/EXPIRED',
        };
      } catch (e: any) {
        results.step4_facebook.tokenTestError = e.message;
      }

      // Test 4b: Debug token (shows permissions and expiry)
      try {
        const appToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
        const res = await fetch(
          `https://graph.facebook.com/v18.0/debug_token?input_token=${facebookToken}&access_token=${appToken}`
        );
        const data = await res.json();
        results.step4_facebook.tokenDebug = {
          status: res.status,
          data,
          note: 'Shows token type, permissions, expiry',
        };

        if (data.data) {
          results.step4_facebook.tokenInfo = {
            type: data.data.type,
            app_id: data.data.app_id,
            is_valid: data.data.is_valid,
            expires_at: data.data.expires_at ? new Date(data.data.expires_at * 1000).toISOString() : 'never',
            scopes: data.data.scopes,
          };
        }
      } catch (e: any) {
        results.step4_facebook.tokenDebugError = e.message;
      }

      // Test 4c: List pages the token has access to
      try {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${facebookToken}`
        );
        const data = await res.json();
        results.step4_facebook.pages = {
          status: res.status,
          data,
          note: 'Pages this user manages (needed for page post insights)',
        };

        // If we find pages, get page tokens
        if (data.data && data.data.length > 0) {
          results.step4_facebook.pageTokens = data.data.map((page: any) => ({
            pageId: page.id,
            pageName: page.name,
            hasAccessToken: !!page.access_token,
            tokenPreview: page.access_token
              ? `${page.access_token.slice(0, 6)}...${page.access_token.slice(-4)}`
              : 'NONE',
          }));
        }
      } catch (e: any) {
        results.step4_facebook.pagesError = e.message;
      }

      // Test 4d: Facebook post data
      const facebookPosts = publishedPosts.filter((p: any) => p.platform === 'FACEBOOK');
      results.step4_facebook.postCount = facebookPosts.length;
      results.step4_facebook.postTests = [];

      for (const post of facebookPosts) {
        const testResult: Record<string, any> = {
          dbPostId: post.id,
          externalPostId: post.externalPostId,
          externalPostUrl: post.externalPostUrl,
          currentMetrics: {
            likes: post.likes,
            impressions: post.impressions,
            lastSyncedAt: post.lastSyncedAt,
          },
          apiTests: {},
        };

        const postId = post.externalPostId;

        // Test: Basic post data with engagement
        try {
          const url = `https://graph.facebook.com/v18.0/${postId}?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&access_token=${facebookToken}`;
          const res = await fetch(url);
          const data = await res.json();
          testResult.apiTests.postData = {
            status: res.status,
            data,
            verdict: res.status === 200 ? '✅ CAN READ POST' : `❌ HTTP ${res.status}`,
          };
        } catch (e: any) {
          testResult.apiTests.postDataError = e.message;
        }

        // Test: Post insights (requires page token + read_insights)
        try {
          const url = `https://graph.facebook.com/v18.0/${postId}/insights?metric=post_impressions,post_impressions_unique,post_engaged_users,post_clicks&access_token=${facebookToken}`;
          const res = await fetch(url);
          const data = await res.json();
          testResult.apiTests.insights = {
            status: res.status,
            data,
            verdict: res.status === 200 ? '✅ CAN READ INSIGHTS' : `❌ HTTP ${res.status}`,
          };
        } catch (e: any) {
          testResult.apiTests.insightsError = e.message;
        }

        // Test: Try with just the post part of the ID (after underscore)
        if (postId.includes('_')) {
          const [pageId, justPostId] = postId.split('_');
          testResult.parsedIds = { pageId, justPostId };

          // Try getting page-specific token and using it
          try {
            const pageRes = await fetch(
              `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${facebookToken}`
            );
            const pageData = await pageRes.json();
            testResult.apiTests.pageTokenFetch = {
              status: pageRes.status,
              hasToken: !!pageData.access_token,
              data: pageData.access_token ? { ...pageData, access_token: '[REDACTED]' } : pageData,
            };

            // If we got a page token, retry insights with it
            if (pageData.access_token) {
              const insightsRes = await fetch(
                `https://graph.facebook.com/v18.0/${postId}/insights?metric=post_impressions,post_engaged_users&access_token=${pageData.access_token}`
              );
              const insightsData = await insightsRes.json();
              testResult.apiTests.insightsWithPageToken = {
                status: insightsRes.status,
                data: insightsData,
                verdict: insightsRes.status === 200 ? '✅ PAGE TOKEN WORKS' : `❌ HTTP ${insightsRes.status}`,
              };

              // Also try post data with page token
              const postRes2 = await fetch(
                `https://graph.facebook.com/v18.0/${postId}?fields=id,likes.summary(true),comments.summary(true),shares&access_token=${pageData.access_token}`
              );
              const postData2 = await postRes2.json();
              testResult.apiTests.postDataWithPageToken = {
                status: postRes2.status,
                data: postData2,
              };
            }
          } catch (e: any) {
            testResult.apiTests.pageTokenError = e.message;
          }
        }

        results.step4_facebook.postTests.push(testResult);
      }
    } else {
      results.step4_facebook.error = '❌ NO FACEBOOK TOKEN FOUND IN DATABASE';
    }

    // =============================================
    // STEP 5: SUMMARY & DIAGNOSIS
    // =============================================
    const summaryItems: string[] = [];

    // LinkedIn summary
    if (results.step3_linkedin.tokenTest?.status === 200) {
      summaryItems.push('✅ LinkedIn token is valid');
    } else if (results.step3_linkedin.tokenTest?.status) {
      summaryItems.push(`❌ LinkedIn token returned HTTP ${results.step3_linkedin.tokenTest.status}`);
    } else if (!linkedInToken) {
      summaryItems.push('❌ No LinkedIn token found in database');
    }

    const liPostTests = results.step3_linkedin.postTests || [];
    for (const pt of liPostTests) {
      const sa = pt.apiTests?.socialActions;
      if (sa?.status === 200) {
        const data = sa.data;
        summaryItems.push(`LinkedIn post ${pt.externalPostId}: socialActions returned status 200, likesCount=${JSON.stringify(data?.likesSummary?.totalLikes ?? data?.paging?.total ?? 'unknown')}`);
      } else if (sa?.status) {
        summaryItems.push(`❌ LinkedIn post socialActions returned HTTP ${sa.status}: ${JSON.stringify(sa.data)}`);
      }
    }

    // Facebook summary  
    if (results.step4_facebook.tokenTest?.status === 200) {
      summaryItems.push('✅ Facebook token is valid');
    } else if (results.step4_facebook.tokenTest?.status) {
      summaryItems.push(`❌ Facebook token returned HTTP ${results.step4_facebook.tokenTest.status}`);
    } else if (!facebookToken) {
      summaryItems.push('❌ No Facebook token found in database');
    }

    if (results.step4_facebook.tokenInfo) {
      summaryItems.push(`Facebook token type: ${results.step4_facebook.tokenInfo.type}, valid: ${results.step4_facebook.tokenInfo.is_valid}, expires: ${results.step4_facebook.tokenInfo.expires_at}`);
      summaryItems.push(`Facebook scopes: ${JSON.stringify(results.step4_facebook.tokenInfo.scopes)}`);
    }

    results.summary = {
      diagnosis: summaryItems,
      nextSteps: [
        'Look at step3_linkedin.postTests[].apiTests for exact API responses',
        'Look at step4_facebook.postTests[].apiTests for exact API responses',
        'If LinkedIn socialActions returns 200 but empty data → posts genuinely have 0 engagement',
        'If LinkedIn returns 403 → token lacks required scopes',
        'If Facebook token is expired → need to re-authenticate',
        'If Facebook insights return error → need read_insights permission or page token',
      ],
    };

  } catch (e: any) {
    results.criticalError = {
      message: e.message,
      stack: e.stack?.split('\n').slice(0, 5),
    };
  } finally {
    await prisma.$disconnect();
  }

  return NextResponse.json(results, { status: 200 });
}