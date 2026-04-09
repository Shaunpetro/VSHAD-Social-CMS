// apps/web/src/app/api/queue/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/queue/[id]
 * Get a single queue item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const queueItem = await prisma.contentQueueItem.findUnique({
      where: { id },
      include: {
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
            username: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!queueItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(queueItem);
  } catch (error) {
    console.error('[Queue API] GET single error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue item' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/queue/[id]
 * Update a queue item (edit content before approval)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingItem = await prisma.contentQueueItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    // Only allow editing PENDING items
    if (existingItem.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only edit pending queue items' },
        { status: 400 }
      );
    }

    const {
      content,
      hashtags,
      keywords,
      suggestedDate,
      suggestedTime,
      pillar,
      contentType,
      tone,
      includesHumor,
      hook,
    } = body;

    const updatedItem = await prisma.contentQueueItem.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(hashtags !== undefined && { hashtags }),
        ...(keywords !== undefined && { keywords }),
        ...(suggestedDate && { suggestedDate: new Date(suggestedDate) }),
        ...(suggestedTime !== undefined && { suggestedTime }),
        ...(pillar !== undefined && { pillar }),
        ...(contentType !== undefined && { contentType }),
        ...(tone !== undefined && { tone }),
        ...(includesHumor !== undefined && { includesHumor }),
        ...(hook !== undefined && { hook }),
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

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('[Queue API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update queue item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/queue/[id]
 * Delete a queue item
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingItem = await prisma.contentQueueItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    await prisma.contentQueueItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Queue item deleted' });
  } catch (error) {
    console.error('[Queue API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete queue item' },
      { status: 500 }
    );
  }
}