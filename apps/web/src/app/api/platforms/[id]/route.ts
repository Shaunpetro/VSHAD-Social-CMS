import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEMP_USER_ID = 'temp-user-001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const platform = await prisma.platform.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    if (platform.company.userId !== TEMP_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Transform to match expected frontend format
    const connection = {
      id: platform.id,
      platform: platform.type.toLowerCase(),
      accountName: platform.username || platform.name,
      status: platform.isConnected ? 'connected' : 'disconnected',
      companyId: platform.companyId,
      company: platform.company,
      lastSyncAt: platform.lastSyncAt,
      createdAt: platform.createdAt,
      updatedAt: platform.updatedAt,
    };

    return NextResponse.json(connection);
  } catch (error) {
    console.error('Failed to fetch platform connection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform connection' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, accountName } = body;

    const existing = await prisma.platform.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    if (existing.company.userId !== TEMP_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Map status string to isConnected boolean
    let isConnected = existing.isConnected;
    if (status === 'connected') {
      isConnected = true;
    } else if (status === 'disconnected') {
      isConnected = false;
    }

    const platform = await prisma.platform.update({
      where: { id },
      data: {
        isConnected,
        ...(accountName !== undefined && { username: accountName.trim() }),
        ...(status === 'connected' && { lastSyncAt: new Date() }),
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
      id: platform.id,
      platform: platform.type.toLowerCase(),
      accountName: platform.username || platform.name,
      status: platform.isConnected ? 'connected' : 'disconnected',
      companyId: platform.companyId,
      company: platform.company,
      lastSyncAt: platform.lastSyncAt,
      createdAt: platform.createdAt,
      updatedAt: platform.updatedAt,
    };

    return NextResponse.json(connection);
  } catch (error) {
    console.error('Failed to update platform connection:', error);
    return NextResponse.json(
      { error: 'Failed to update platform connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.platform.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    if (existing.company.userId !== TEMP_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.platform.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Platform connection removed' });
  } catch (error) {
    console.error('Failed to delete platform connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete platform connection' },
      { status: 500 }
    );
  }
}