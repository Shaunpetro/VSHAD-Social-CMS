// apps/web/src/app/api/auth/facebook/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  decodeOAuthState,
  exchangeFacebookCode,
  getLongLivedToken,
  getFacebookPages,
} from '@/lib/oauth/facebook';

function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const productionUrl = 'https://atgihubrobosocial.vercel.app';
  let baseUrl = envUrl || productionUrl;
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  return baseUrl;
}

/**
 * Build redirect URL to company platforms page
 */
function buildRedirectUrl(appUrl: string, companyId: string | null, params: string): string {
  if (companyId) {
    return `${appUrl}/companies/${companyId}/platforms?${params}`;
  }
  return `${appUrl}/companies?error=missing_company`;
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();

  // Extract state early to get companyId for error redirects
  const state = request.nextUrl.searchParams.get('state');
  let companyId: string | null = null;

  if (state) {
    try {
      const stateData = decodeOAuthState(state);
      companyId = stateData.companyId || null;
    } catch {
      // State decode failed, companyId stays null
    }
  }

  try {
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');
    const errorReason = request.nextUrl.searchParams.get('error_reason');

    console.log('[Facebook Callback] === CALLBACK DEBUG ===');
    console.log('[Facebook Callback] App URL:', appUrl);
    console.log('[Facebook Callback] Company ID:', companyId);
    console.log('[Facebook Callback] Has code:', !!code);
    console.log('[Facebook Callback] Has state:', !!state);

    if (error) {
      console.error('Facebook OAuth error:', error, errorReason);
      const msg = encodeURIComponent(errorReason || error);
      return NextResponse.redirect(
        new URL(buildRedirectUrl(appUrl, companyId, `error=facebook_denied&message=${msg}`))
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(buildRedirectUrl(appUrl, companyId, 'error=facebook_missing_params'))
      );
    }

    const stateData = decodeOAuthState(state);
    const { redirectUri: stateRedirectUri } = stateData;
    companyId = stateData.companyId;

    console.log('[Facebook Callback] Company ID from state:', companyId);
    console.log('[Facebook Callback] Redirect URI from state:', stateRedirectUri);

    if (!companyId) {
      return NextResponse.redirect(
        new URL(`${appUrl}/companies?error=facebook_invalid_state`)
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.redirect(
        new URL(`${appUrl}/companies?error=company_not_found`)
      );
    }

    // Exchange code for tokens
    const shortToken = await exchangeFacebookCode(code, stateRedirectUri);
    const longLived = await getLongLivedToken(shortToken.access_token);
    const pages = await getFacebookPages(longLived.access_token);

    console.log('[Facebook Callback] Token exchange successful');
    console.log('[Facebook Callback] Pages found:', pages.length);

    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL(buildRedirectUrl(appUrl, companyId, 'error=no_facebook_pages'))
      );
    }

    // If only one page, connect it directly
    if (pages.length === 1) {
      const page = pages[0];

      const connectionData = {
        accessToken: page.access_token,
        userAccessToken: longLived.access_token,
        expiresAt: new Date(Date.now() + (longLived.expires_in || 5184000) * 1000).toISOString(),
        scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
        pageId: page.id,
        pageName: page.name,
        pageCategory: page.category,
        connectedAt: new Date().toISOString(),
      };

      const existing = await prisma.platform.findFirst({
        where: {
          type: 'FACEBOOK',
          companyId,
        },
      });

      if (existing) {
        await prisma.platform.update({
          where: { id: existing.id },
          data: {
            username: page.name,
            isConnected: true,
            connectionData,
            lastSyncAt: new Date(),
          },
        });
      } else {
        await prisma.platform.create({
          data: {
            type: 'FACEBOOK',
            name: 'Facebook',
            username: page.name,
            isConnected: true,
            connectionData,
            lastSyncAt: new Date(),
            companyId,
          },
        });
      }

      return NextResponse.redirect(
        new URL(buildRedirectUrl(appUrl, companyId, 'connected=facebook'))
      );
    }

    // Multiple pages - create pending connection for page selection
    const connectionData = {
      userAccessToken: longLived.access_token,
      expiresAt: new Date(Date.now() + (longLived.expires_in || 5184000) * 1000).toISOString(),
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
      pendingPageSelection: true,
      availablePages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
      connectedAt: new Date().toISOString(),
    };

    const existing = await prisma.platform.findFirst({
      where: {
        type: 'FACEBOOK',
        companyId,
      },
    });

    let platformId: string;

    if (existing) {
      await prisma.platform.update({
        where: { id: existing.id },
        data: {
          username: 'Pending page selection',
          isConnected: false,
          connectionData,
          lastSyncAt: new Date(),
        },
      });
      platformId = existing.id;
    } else {
      const newPlatform = await prisma.platform.create({
        data: {
          type: 'FACEBOOK',
          name: 'Facebook',
          username: 'Pending page selection',
          isConnected: false,
          connectionData,
          lastSyncAt: new Date(),
          companyId,
        },
      });
      platformId = newPlatform.id;
    }

    return NextResponse.redirect(
      new URL(buildRedirectUrl(appUrl, companyId, `pending_facebook=${platformId}`))
    );
  } catch (error) {
    console.error('Facebook callback failed:', error);
    const msg = encodeURIComponent(
      error instanceof Error ? error.message : 'Facebook connection failed'
    );
    return NextResponse.redirect(
      new URL(buildRedirectUrl(appUrl, companyId, `error=facebook_callback_failed&message=${msg}`))
    );
  }
}
