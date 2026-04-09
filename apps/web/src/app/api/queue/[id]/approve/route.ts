// apps/web/src/app/api/queue/[id]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PostStatus, QueueStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/queue/[id]/approve
 * Approve a queue item and create a GeneratedPost (DRAFT or SCHEDULED)
 * 
 * Body (optional):
 * - scheduledFor: ISO date string (if provided, post will be SCHEDULED)
 * - content: Override content (if edited before approval)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    let body: { scheduledFor?: string; content?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const { scheduledFor, content: overrideContent } = body;

    // Fetch the queue item
    const queueItem = await prisma.contentQueueItem.findUnique({
      where: { id },
      include: {
        platform: true,
        company: {
          include: {
            intelligence: true,
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

    if (queueItem.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot approve item with status: ${queueItem.status}` },
        { status: 400 }
      );
    }

    // Determine if we should schedule or just draft
    const shouldSchedule = scheduledFor || (queueItem.suggestedDate && queueItem.suggestedTime);
    
    let scheduleDateTime: Date | null = null;
    if (shouldSchedule) {
      if (scheduledFor) {
        scheduleDateTime = new Date(scheduledFor);
      } else if (queueItem.suggestedDate && queueItem.suggestedTime) {
        // Combine suggested date and time
        const date = new Date(queueItem.suggestedDate);
        const [hours, minutes] = queueItem.suggestedTime.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
        scheduleDateTime = date;
      }
    }

    // Create the GeneratedPost
    const generatedPost = await prisma.generatedPost.create({
      data: {
        companyId: queueItem.companyId,
        platformId: queueItem.platformId,
        content: overrideContent || queueItem.content,
        hashtags: queueItem.hashtags,
        scheduledFor: scheduleDateTime,
        status: scheduleDateTime ? PostStatus.SCHEDULED : PostStatus.DRAFT,
        generatedBy: 'groq-llama-3.3',
        topic: queueItem.pillar,
        tone: queueItem.tone,
        pillar: queueItem.pillar,
        contentType: queueItem.contentType,
        includesHumor: queueItem.includesHumor,
        hook: queueItem.hook,
      },
    });

    // Update the queue item
    await prisma.contentQueueItem.update({
      where: { id },
      data: {
        status: scheduleDateTime ? QueueStatus.SCHEDULED : QueueStatus.APPROVED,
        reviewedAt: new Date(),
        generatedPostId: generatedPost.id,
      },
    });

    console.log(`[Queue] Approved queue item ${id} -> Post ${generatedPost.id} (${generatedPost.status})`);

    return NextResponse.json({
      success: true,
      message: scheduleDateTime 
        ? `Content approved and scheduled for ${scheduleDateTime.toISOString()}`
        : 'Content approved and saved as draft',
      queueItem: {
        id: queueItem.id,
        status: scheduleDateTime ? 'SCHEDULED' : 'APPROVED',
      },
      post: {
        id: generatedPost.id,
        status: generatedPost.status,
        scheduledFor: generatedPost.scheduledFor,
      },
    });
  } catch (error) {
    console.error('[Queue API] Approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve queue item' },
      { status: 500 }
    );
  }
}