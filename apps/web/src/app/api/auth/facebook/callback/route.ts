import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  decodeOAuthState,
  exchangeFacebookCode,
  getLongLivedToken,
  getFacebookPages,
} from '@/lib/oauth/facebook';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');
    const errorReason = request.nextUrl.searchParams.get('error_reason');

    if (error) {
      console.error('Facebook OAuth error:', error, errorReason);
      const msg = encodeURIComponent(errorReason || error);
      return NextResponse.redirect(
        new URL(`/platforms?error=facebook_denied&message=${msg}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/platforms?error=facebook_missing_params', request.url)
      );
    }

    const stateData = decodeOAuthState(state);
    const { companyId } = stateData;

    if (!companyId) {
      return NextResponse.redirect(
        new URL('/platforms?error=facebook_invalid_state', request.url)
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.redirect(
        new URL('/platforms?error=company_not_found', request.url)
      );
    }

    const shortToken = await exchangeFacebookCode(code);
    const longLived = await getLongLivedToken(shortToken.access_token);
    const pages = await getFacebookPages(longLived.access_token);

    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL('/platforms?error=no_facebook_pages', request.url)
      );
    }

    if (pages.length === 1) {
      const page = pages[0];

      await prisma.platformConnection.create({
        data: {
          platform: 'facebook',
          accountName: page.name,
          accessToken: page.access_token,
          expiresAt: new Date(Date.now() + (longLived.expires_in || 5184000) * 1000),
          scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
          status: 'connected',
          config: {
            pageId: page.id,
            pageName: page.name,
            pageCategory: page.category,
            connectedAt: new Date().toISOString(),
          },
          companyId,
        },
      });

      return NextResponse.redirect(
        new URL('/platforms?connected=facebook', request.url)
      );
    }

    const pendingConnection = await prisma.platformConnection.create({
      data: {
        platform: 'facebook',
        accountName: 'Pending page selection',
        accessToken: longLived.access_token,
        expiresAt: new Date(Date.now() + (longLived.expires_in || 5184000) * 1000),
        scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
        status: 'pending_page_selection',
        config: {
          userToken: longLived.access_token,
          pages: pages.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
          })),
          companyId,
          connectedAt: new Date().toISOString(),
        },
        companyId,
      },
    });

    return NextResponse.redirect(
      new URL(`/platforms?pending_facebook=${pendingConnection.id}`, request.url)
    );
  } catch (error) {
    console.error('Facebook callback failed:', error);
    const msg = encodeURIComponent(
      error instanceof Error ? error.message : 'Facebook connection failed'
    );
    return NextResponse.redirect(
      new URL(`/platforms?error=facebook_callback_failed&message=${msg}`, request.url)
    );
  }
}