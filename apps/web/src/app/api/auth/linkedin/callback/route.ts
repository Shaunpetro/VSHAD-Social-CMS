import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  decodeOAuthState,
  exchangeLinkedInCode,
  getLinkedInProfile,
} from '@/lib/oauth/linkedin';

const getAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
  
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');
    const errorDescription = request.nextUrl.searchParams.get('error_description');

    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      const msg = encodeURIComponent(errorDescription || error);
      return NextResponse.redirect(
        new URL(`/platforms?error=linkedin_denied&message=${msg}`, appUrl)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/platforms?error=linkedin_missing_params', appUrl)
      );
    }

    const stateData = decodeOAuthState(state);
    const { companyId } = stateData;

    if (!companyId) {
      return NextResponse.redirect(
        new URL('/platforms?error=linkedin_invalid_state', appUrl)
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
    const tokenData = await exchangeLinkedInCode(code);
    const profile = await getLinkedInProfile(tokenData.access_token);

    const accountName = profile.name || profile.email || 'LinkedIn Account';

    // Store OAuth data in connectionData JSON field
    const connectionData = {
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scopes: ['openid', 'profile', 'email', 'w_member_social'],
      linkedinSub: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture || null,
      connectedAt: new Date().toISOString(),
    };

    // Check if LinkedIn platform already exists for this company
    const existing = await prisma.platform.findFirst({
      where: {
        type: 'LINKEDIN',
        companyId,
      },
    });

    if (existing) {
      // Update existing platform connection
      await prisma.platform.update({
        where: { id: existing.id },
        data: {
          username: accountName,
          isConnected: true,
          connectionData,
          lastSyncAt: new Date(),
        },
      });
    } else {
      // Create new platform connection
      await prisma.platform.create({
        data: {
          type: 'LINKEDIN',
          name: 'LinkedIn',
          username: accountName,
          isConnected: true,
          connectionData,
          lastSyncAt: new Date(),
          companyId,
        },
      });
    }

    return NextResponse.redirect(
      new URL('/platforms?connected=linkedin', appUrl)
    );
  } catch (error) {
    console.error('LinkedIn callback failed:', error);
    const msg = encodeURIComponent(
      error instanceof Error ? error.message : 'LinkedIn connection failed'
    );
    return NextResponse.redirect(
      new URL(`/platforms?error=linkedin_callback_failed&message=${msg}`, appUrl)
    );
  }
}