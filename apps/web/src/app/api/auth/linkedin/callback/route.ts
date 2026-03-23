// apps/web/src/app/api/auth/linkedin/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  decodeOAuthState,
  exchangeLinkedInCode,
  getLinkedInProfile,
  getLinkedInOrganizations,
  encodeOrganizations,
} from '@/lib/oauth/linkedin';

/**
 * Get the base app URL, normalized (no trailing slash)
 * Hardcoded fallback for production to avoid env var issues
 */
function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Hardcoded production URL as fallback
  const productionUrl = 'https://atgihubrobosocial.vercel.app';

  let baseUrl = envUrl || productionUrl;

  // Remove trailing slash if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  return baseUrl;
}

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

    // Fetch organizations the user can post to
    const organizations = await getLinkedInOrganizations(tokenData.access_token);

    console.log('[LinkedIn Callback] Profile:', profile.name);
    console.log('[LinkedIn Callback] Organizations found:', organizations.length);

    // Base connection data (will be updated with selection)
    const baseConnectionData = {
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scopes: tokenData.scope.split(' '),
      linkedinSub: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture || null,
      connectedAt: new Date().toISOString(),
      // These will be set based on selection
      postingMode: 'personal' as const,
      organizationId: null as string | null,
      organizationName: null as string | null,
    };

    // If user has organizations, redirect to selection page
    if (organizations.length > 0) {
      // Convert organizations to plain JSON-compatible objects
      const orgsForStorage = organizations.map(org => ({
        id: org.id,
        name: org.name,
        vanityName: org.vanityName || null,
        logoUrl: org.logoUrl || null,
      }));

      // Store pending connection data in the platform record
      const existing = await prisma.platform.findFirst({
        where: {
          type: 'LINKEDIN',
          companyId,
        },
      });

      const pendingData = {
        ...baseConnectionData,
        pendingSelection: true,
        availableOrganizations: orgsForStorage,
      };

      if (existing) {
        await prisma.platform.update({
          where: { id: existing.id },
          data: {
            username: profile.name || profile.email || 'LinkedIn Account',
            isConnected: false, // Not fully connected until selection
            connectionData: pendingData,
            lastSyncAt: new Date(),
          },
        });
      } else {
        await prisma.platform.create({
          data: {
            type: 'LINKEDIN',
            name: 'LinkedIn',
            username: profile.name || profile.email || 'LinkedIn Account',
            isConnected: false, // Not fully connected until selection
            connectionData: pendingData,
            lastSyncAt: new Date(),
            companyId,
          },
        });
      }

      // Redirect to selection page
      const orgsEncoded = encodeOrganizations(organizations);
      return NextResponse.redirect(
        new URL(`/platforms/linkedin/select?companyId=${companyId}&orgs=${orgsEncoded}`, appUrl)
      );
    }

    // No organizations - connect as personal profile directly
    const accountName = profile.name || profile.email || 'LinkedIn Account';

    const connectionData = {
      ...baseConnectionData,
      postingMode: 'personal' as const,
    };

    // Check if LinkedIn platform already exists for this company
    const existing = await prisma.platform.findFirst({
      where: {
        type: 'LINKEDIN',
        companyId,
      },
    });

    if (existing) {
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