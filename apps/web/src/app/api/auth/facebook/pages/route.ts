// apps/web/src/app/api/auth/facebook/pages/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFacebookPages } from '@/lib/oauth/facebook';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface FacebookConnectionData {
  accessToken?: string;
  userAccessToken?: string;
  expiresAt?: string | number | null;
  scopes?: string[] | string | null;
  pageId?: string;
  pageName?: string;
  pageCategory?: string;
  connectedAt?: string;
  pendingPageSelection?: boolean;
  availablePages?: Array<{ id: string; name: string; category: string }>;
}

// ═══════════════════════════════════════════════════════════════
// GET: Fetch available pages for a pending connection
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const connectionId = request.nextUrl.searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    const platform = await prisma.platform.findUnique({
      where: { id: connectionId },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const connectionData = platform.connectionData as FacebookConnectionData | null;

    if (!connectionData?.pendingPageSelection) {
      return NextResponse.json(
        { error: 'Connection is not pending page selection' },
        { status: 400 }
      );
    }

    const pages = connectionData.availablePages || [];

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Failed to fetch Facebook pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Facebook pages' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST: Select a page to complete the connection
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, pageId } = body;

    if (!connectionId || !pageId) {
      return NextResponse.json(
        { error: 'Connection ID and Page ID are required' },
        { status: 400 }
      );
    }

    const platform = await prisma.platform.findUnique({
      where: { id: connectionId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const connectionData = platform.connectionData as FacebookConnectionData | null;

    if (!connectionData?.pendingPageSelection) {
      return NextResponse.json(
        { error: 'Connection is not pending page selection' },
        { status: 400 }
      );
    }

    const userToken = connectionData.userAccessToken;

    if (!userToken) {
      return NextResponse.json(
        { error: 'User token not found. Please reconnect Facebook.' },
        { status: 400 }
      );
    }

    // Fetch fresh page data with access tokens
    const pages = await getFacebookPages(userToken);
    const selectedPage = pages.find((p) => p.id === pageId);

    if (!selectedPage) {
      return NextResponse.json(
        { error: 'Selected page not found. You may not have admin access to this page.' },
        { status: 404 }
      );
    }

    // Update the platform with the selected page
    // Properly type the connection data for Prisma JSON field
    const updatedConnectionData: FacebookConnectionData = {
      accessToken: selectedPage.access_token,
      userAccessToken: userToken,
      expiresAt: connectionData.expiresAt ?? null,
      scopes: connectionData.scopes ?? null,
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      pageCategory: selectedPage.category,
      connectedAt: new Date().toISOString(),
      pendingPageSelection: false,
      // Don't include availablePages after selection
    };

    const updatedPlatform = await prisma.platform.update({
      where: { id: connectionId },
      data: {
        username: selectedPage.name,
        isConnected: true,
        connectionData: updatedConnectionData,
        lastSyncAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform to match expected frontend format
    const connection = {
      id: updatedPlatform.id,
      platform: updatedPlatform.type.toLowerCase(),
      accountName: updatedPlatform.username || updatedPlatform.name,
      status: 'connected',
      companyId: updatedPlatform.companyId,
      company: updatedPlatform.company,
      lastSyncAt: updatedPlatform.lastSyncAt,
      createdAt: updatedPlatform.createdAt,
      updatedAt: updatedPlatform.updatedAt,
    };

    return NextResponse.json(connection);
  } catch (error) {
    console.error('Failed to select Facebook page:', error);
    return NextResponse.json(
      { error: 'Failed to connect Facebook page' },
      { status: 500 }
    );
  }
}