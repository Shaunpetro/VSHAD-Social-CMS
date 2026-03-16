import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFacebookPages } from '@/lib/oauth/facebook';

export async function GET(request: NextRequest) {
  try {
    const connectionId = request.nextUrl.searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    const connection = await prisma.platformConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    if (connection.status !== 'pending_page_selection') {
      return NextResponse.json(
        { error: 'Connection is not pending page selection' },
        { status: 400 }
      );
    }

    const config = connection.config as Record<string, unknown>;
    const pages = (config?.pages as Array<{ id: string; name: string; category: string }>) || [];

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Failed to fetch Facebook pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Facebook pages' },
      { status: 500 }
    );
  }
}

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

    const connection = await prisma.platformConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    if (connection.status !== 'pending_page_selection') {
      return NextResponse.json(
        { error: 'Connection is not pending page selection' },
        { status: 400 }
      );
    }

    const config = connection.config as Record<string, unknown>;
    const userToken = (config?.userToken as string) || connection.accessToken;

    const pages = await getFacebookPages(userToken);
    const selectedPage = pages.find((p) => p.id === pageId);

    if (!selectedPage) {
      return NextResponse.json(
        { error: 'Selected page not found. You may not have admin access to this page.' },
        { status: 404 }
      );
    }

    const updatedConnection = await prisma.platformConnection.update({
      where: { id: connectionId },
      data: {
        accountName: selectedPage.name,
        accessToken: selectedPage.access_token,
        status: 'connected',
        config: {
          pageId: selectedPage.id,
          pageName: selectedPage.name,
          pageCategory: selectedPage.category,
          connectedAt: new Date().toISOString(),
        },
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

    return NextResponse.json(updatedConnection);
  } catch (error) {
    console.error('Failed to select Facebook page:', error);
    return NextResponse.json(
      { error: 'Failed to connect Facebook page' },
      { status: 500 }
    );
  }
}