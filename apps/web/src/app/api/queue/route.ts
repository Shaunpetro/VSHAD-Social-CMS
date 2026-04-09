// apps/web/src/app/api/queue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/queue
 * List queue items for a company
 * Query params: companyId (required), status (optional), limit (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const queueItems = await prisma.contentQueueItem.findMany({
      where: {
        companyId,
        ...(status && { status: status as any }),
      },
      include: {
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { suggestedDate: 'asc' },
      ],
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json(queueItems);
  } catch (error) {
    console.error('[Queue API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/queue
 * Create a new queue item (manual addition)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      platformId,
      content,
      hashtags = [],
      keywords = [],
      suggestedDate,
      suggestedTime = '09:00',
      pillar,
      contentType,
      tone,
      includesHumor = false,
      hook,
      engagementPrediction,
      generationContext,
    } = body;

    if (!companyId || !platformId || !content) {
      return NextResponse.json(
        { error: 'companyId, platformId, and content are required' },
        { status: 400 }
      );
    }

    // Verify company and platform exist
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        companyId,
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found for this company' },
        { status: 404 }
      );
    }

    const queueItem = await prisma.contentQueueItem.create({
      data: {
        companyId,
        platformId,
        content,
        hashtags,
        keywords,
        suggestedDate: suggestedDate ? new Date(suggestedDate) : new Date(),
        suggestedTime,
        pillar,
        contentType,
        tone,
        includesHumor,
        hook,
        engagementPrediction,
        generationContext,
        status: 'PENDING',
      },
      include: {
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(queueItem, { status: 201 });
  } catch (error) {
    console.error('[Queue API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create queue item' },
      { status: 500 }
    );
  }
}