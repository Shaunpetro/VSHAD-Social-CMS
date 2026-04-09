// apps/web/src/app/api/queue/[id]/reject/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { QueueStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/queue/[id]/reject
 * Reject a queue item
 * 
 * Body (optional):
 * - reviewNotes: Reason for rejection
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    let body: { reviewNotes?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const { reviewNotes } = body;

    // Fetch the queue item
    const queueItem = await prisma.contentQueueItem.findUnique({
      where: { id },
    });

    if (!queueItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    if (queueItem.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot reject item with status: ${queueItem.status}` },
        { status: 400 }
      );
    }

    // Update the queue item
    const updatedItem = await prisma.contentQueueItem.update({
      where: { id },
      data: {
        status: QueueStatus.REJECTED,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || 'Rejected by user',
      },
    });

    console.log(`[Queue] Rejected queue item ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Content rejected',
      queueItem: {
        id: updatedItem.id,
        status: updatedItem.status,
        reviewedAt: updatedItem.reviewedAt,
        reviewNotes: updatedItem.reviewNotes,
      },
    });
  } catch (error) {
    console.error('[Queue API] Reject error:', error);
    return NextResponse.json(
      { error: 'Failed to reject queue item' },
      { status: 500 }
    );
  }
}