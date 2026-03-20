// apps/web/src/app/api/auth/facebook/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  decodeOAuthState,
  exchangeFacebookCode,
  getLongLivedToken,
  getFacebookPages,
} from '@/lib/oauth/facebook';

const getAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();

  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');
    const errorReason = request.nextUrl.searchParams.get('error_reason');

    if (error) {
      console.error('Facebook OAuth error:', error, errorReason);
      const msg = encodeURIComponent(errorReason || error);
      return NextResponse.redirect(
        new URL(`/platforms?error=facebook_denied&message=${msg}`, appUrl)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/platforms?error=facebook_missing_params', appUrl)
      );
    }

    const stateData = decodeOAuthState(state);
    const { companyId } = stateData;

    if (!companyId) {
      return NextResponse.redirect(
        new URL('/platforms?error=facebook_invalid_state', appUrl)
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.redirect(
        new URL('/platforms?error=company_not_found', appUrl)
      );
    }

    // Exchange code for tokens
    const shortToken = await exchangeFacebookCode(code);
    const longLived = await getLongLivedToken(shortToken.access_token);
    const pages = await getFacebookPages(longLived.access_token);

    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL('/platforms?error=no_facebook_pages', appUrl)
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

      // Check if Facebook platform already exists for this company
      const existing = await prisma.platform.findFirst({
        where: {
          type: 'FACEBOOK',
          companyId,
        },
      });

      if (existing) {
        // Update existing platform connection
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
        // Create new platform connection
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
        new URL('/platforms?connected=facebook', appUrl)
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

    // Check if Facebook platform already exists for this company
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
      new URL(`/platforms?pending_facebook=${platformId}`, appUrl)
    );
  } catch (error) {
    console.error('Facebook callback failed:', error);
    const msg = encodeURIComponent(
      error instanceof Error ? error.message : 'Facebook connection failed'
    );
    return NextResponse.redirect(
      new URL(`/platforms?error=facebook_callback_failed&message=${msg}`, appUrl)
    );
  }
}