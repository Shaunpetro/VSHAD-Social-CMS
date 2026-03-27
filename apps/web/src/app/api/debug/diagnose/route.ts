import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    database: {},
    platforms: {},
    linkedin: {},
    facebook: {},
    diagnosis: [],
    fixes: [],
  };

  try {
    // 1. Get all companies
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
    });
    results.database.companies = companies;

    // 2. Get all platforms WITH connectionData
    const platforms = await prisma.platform.findMany({
      select: {
        id: true,
        type: true,
        name: true,
        isConnected: true,
        connectionData: true,
        companyId: true,
      },
    });

    results.platforms.count = platforms.length;
    results.platforms.list = platforms.map((p) => {
      const cd = (p.connectionData || {}) as Record<string, any>;
      const safe: Record<string, any> = {
        id: p.id,
        type: p.type,
        name: p.name,
        isConnected: p.isConnected,
        companyId: p.companyId,
        connectionDataKeys: Object.keys(cd),
      };
      // Show token lengths without exposing full tokens
      for (const [k, v] of Object.entries(cd)) {
        const s = String(v || "");
        if (k.toLowerCase().includes("token") || k.toLowerCase().includes("secret")) {
          safe[`cd_${k}`] = s.length > 8
            ? `${s.slice(0, 6)}...${s.slice(-4)} (${s.length} chars)`
            : s.length > 0 ? "[SHORT]" : "[EMPTY]";
        } else {
          safe[`cd_${k}`] = v;
        }
      }
      return safe;
    });

    // 3. Get published posts
    const posts = await prisma.generatedPost.findMany({
      where: { externalPostId: { not: null } },
      select: {
        id: true, platform: { select: { type: true, connectionData: true } },
        externalPostId: true, likes: true, comments: true,
        shares: true, impressions: true, lastSyncedAt: true,
      },
      orderBy: { publishedAt: "desc" },
    });
    results.database.publishedPosts = posts.map((p) => ({
      id: p.id,
      platform: p.platform.type,
      externalPostId: p.externalPostId,
      metrics: { likes: p.likes, comments: p.comments, shares: p.shares, impressions: p.impressions },
      lastSyncedAt: p.lastSyncedAt,
    }));

    // 4. LINKEDIN TESTS
    const liPlatform = platforms.find((p) => p.type === "LINKEDIN" && p.isConnected);
    if (liPlatform) {
      const cd = (liPlatform.connectionData || {}) as Record<string, any>;
      const token = cd.accessToken as string;
      const postingMode = cd.postingMode || "personal";
      const orgId = cd.organizationId || cd.companyId || null;

      results.linkedin.platformId = liPlatform.id;
      results.linkedin.postingMode = postingMode;
      results.linkedin.organizationId = orgId;
      results.linkedin.hasToken = !!token;
      results.linkedin.tokenLength = token?.length || 0;

      if (token) {
        // Test token validity
        try {
          const r = await fetch("https://api.linkedin.com/v2/me", {
            headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
          });
          const d = await r.json();
          results.linkedin.tokenStatus = r.status;
          results.linkedin.tokenValid = r.status === 200;
          results.linkedin.profile = r.status === 200
            ? { id: d.id, firstName: d.localizedFirstName, lastName: d.localizedLastName }
            : d;
          if (r.status === 200) results.diagnosis.push("✅ LinkedIn token is VALID");
          else results.diagnosis.push(`❌ LinkedIn token returned ${r.status}`);
        } catch (e: any) {
          results.linkedin.tokenError = e.message;
          results.diagnosis.push("❌ LinkedIn token test failed: " + e.message);
        }

        // Test userinfo (to check scopes)
        try {
          const r = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${token}` },
          });
          results.linkedin.userinfoStatus = r.status;
          results.linkedin.userinfo = await r.json();
        } catch (e: any) {
          results.linkedin.userinfoError = e.message;
        }

        // Test each LinkedIn post
        const liPosts = posts.filter((p) => p.platform.type === "LINKEDIN").slice(0, 2);
        results.linkedin.postTests = [];

        for (const post of liPosts) {
          const urn = post.externalPostId!;
          const enc = encodeURIComponent(urn);
          const t: Record<string, any> = {
            urn,
            currentMetrics: { likes: post.likes, impressions: post.impressions },
          };

          // Test 1: socialActions (base)
          try {
            const r = await fetch(`https://api.linkedin.com/v2/socialActions/${enc}`, {
              headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
            });
            t.socialActions = { status: r.status, body: await r.json() };
          } catch (e: any) { t.socialActionsErr = e.message; }

          // Test 2: likes with count=0 (what your code does)
          try {
            const r = await fetch(`https://api.linkedin.com/v2/socialActions/${enc}/likes?count=0`, {
              headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
            });
            t.likesCount0 = { status: r.status, body: await r.json() };
          } catch (e: any) { t.likesCount0Err = e.message; }

          // Test 3: likes with count=1 (alternative approach)
          try {
            const r = await fetch(`https://api.linkedin.com/v2/socialActions/${enc}/likes?count=1`, {
              headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
            });
            t.likesCount1 = { status: r.status, body: await r.json() };
          } catch (e: any) { t.likesCount1Err = e.message; }

          // Test 4: comments with count=0
          try {
            const r = await fetch(`https://api.linkedin.com/v2/socialActions/${enc}/comments?count=0`, {
              headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
            });
            t.commentsCount0 = { status: r.status, body: await r.json() };
          } catch (e: any) { t.commentsCount0Err = e.message; }

          // Test 5: ugcPosts endpoint (has socialDetail with counts)
          try {
            const r = await fetch(`https://api.linkedin.com/v2/ugcPosts/${enc}`, {
              headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
            });
            t.ugcPost = { status: r.status, body: await r.json() };
          } catch (e: any) { t.ugcPostErr = e.message; }

          results.linkedin.postTests.push(t);
        }

        // Analysis
        if (postingMode === "personal" || !postingMode) {
          results.diagnosis.push("⚠️ LinkedIn posting mode is PERSONAL - impressions will ALWAYS be 0 (API limitation)");
          results.fixes.push("LinkedIn impressions require a Company Page (organization posting mode)");
        }
      } else {
        results.diagnosis.push("❌ LinkedIn platform found but NO accessToken in connectionData");
      }
    } else {
      results.diagnosis.push("❌ No connected LinkedIn platform found");
    }

    // 5. FACEBOOK TESTS
    const fbPlatform = platforms.find((p) => p.type === "FACEBOOK" && p.isConnected);
    if (fbPlatform) {
      const cd = (fbPlatform.connectionData || {}) as Record<string, any>;
      const pageToken = (cd.pageAccessToken || cd.accessToken) as string;
      const pageId = cd.pageId as string;

      results.facebook.platformId = fbPlatform.id;
      results.facebook.hasPageToken = !!pageToken;
      results.facebook.tokenLength = pageToken?.length || 0;
      results.facebook.pageId = pageId;
      results.facebook.connectionDataKeys = Object.keys(cd);

      if (pageToken) {
        // Test token
        try {
          const r = await fetch(
            `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${pageToken}`
          );
          const d = await r.json();
          results.facebook.tokenStatus = r.status;
          results.facebook.tokenValid = r.status === 200 && !d.error;
          results.facebook.profile = d;
          if (r.status === 200 && !d.error) {
            results.diagnosis.push("✅ Facebook token is VALID");
          } else {
            results.diagnosis.push(`❌ Facebook token invalid: ${d.error?.message || r.status}`);
          }
        } catch (e: any) {
          results.facebook.tokenError = e.message;
          results.diagnosis.push("❌ Facebook token test failed: " + e.message);
        }

        // Debug token (shows permissions + expiry)
        try {
          const appToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
          const r = await fetch(
            `https://graph.facebook.com/v21.0/debug_token?input_token=${pageToken}&access_token=${appToken}`
          );
          const d = await r.json();
          if (d?.data) {
            results.facebook.tokenDebug = {
              type: d.data.type,
              app_id: d.data.app_id,
              is_valid: d.data.is_valid,
              expires: d.data.expires_at
                ? new Date(d.data.expires_at * 1000).toISOString()
                : "never",
              scopes: d.data.scopes,
            };
            if (d.data.scopes) {
              const hasReadInsights = d.data.scopes.includes("read_insights");
              const hasPagesReadEngagement = d.data.scopes.includes("pages_read_engagement");
              results.diagnosis.push(
                hasReadInsights
                  ? "✅ Facebook has read_insights permission"
                  : "❌ Facebook MISSING read_insights permission"
              );
              results.diagnosis.push(
                hasPagesReadEngagement
                  ? "✅ Facebook has pages_read_engagement permission"  
                  : "❌ Facebook MISSING pages_read_engagement permission"
              );
            }
            if (d.data.expires_at) {
              const expiresDate = new Date(d.data.expires_at * 1000);
              const isExpired = expiresDate < new Date();
              results.diagnosis.push(
                isExpired
                  ? `❌ Facebook token EXPIRED on ${expiresDate.toISOString()}`
                  : `✅ Facebook token expires ${expiresDate.toISOString()}`
              );
            }
          } else {
            results.facebook.tokenDebug = d;
          }
        } catch (e: any) {
          results.facebook.debugError = e.message;
        }

        // Test Facebook posts
        const fbPosts = posts.filter((p) => p.platform.type === "FACEBOOK");
        results.facebook.postTests = [];

        for (const post of fbPosts) {
          const pid = post.externalPostId!;
          const t: Record<string, any> = {
            externalId: pid,
            lastSyncedAt: post.lastSyncedAt,
          };

          // Test basic post data (works with most tokens)
          try {
            const r = await fetch(
              `https://graph.facebook.com/v21.0/${pid}?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&access_token=${pageToken}`
            );
            t.postData = { status: r.status, body: await r.json() };
          } catch (e: any) { t.postDataErr = e.message; }

          // Test insights (requires read_insights)
          try {
            const r = await fetch(
              `https://graph.facebook.com/v21.0/${pid}/insights?metric=post_impressions,post_engaged_users,post_reactions_by_type_total&access_token=${pageToken}`
            );
            t.insights = { status: r.status, body: await r.json() };
          } catch (e: any) { t.insightsErr = e.message; }

          results.facebook.postTests.push(t);
        }
      } else {
        results.diagnosis.push("❌ Facebook platform found but NO token in connectionData");
        results.facebook.allConnectionData = Object.keys(cd);
      }
    } else {
      results.diagnosis.push("❌ No connected Facebook platform found");
    }

    // 6. FINAL DIAGNOSIS
    results.fixes.push(
      "1. LinkedIn personal posts: impressions/shares are unavailable via API. Use Company Page for full metrics.",
      "2. LinkedIn likes/comments: Check if socialActions endpoint returns data (see postTests above).",
      "3. Facebook: Check token debug for permissions and expiry.",
      "4. If Facebook insights return error, need read_insights + pages_read_engagement permissions."
    );

  } catch (e: any) {
    results.criticalError = {
      message: e.message,
      stack: e.stack?.split("\n").slice(0, 5),
    };
  }

  return NextResponse.json(results);
}
