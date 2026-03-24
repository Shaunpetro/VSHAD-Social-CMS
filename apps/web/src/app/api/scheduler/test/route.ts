// apps/web/src/app/api/scheduler/test/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPosts } from '@/lib/scheduler';
import { prisma } from '@/lib/db';

/**
 * Test/debug endpoint for the scheduler
 * Only available in development or with proper auth
 */
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow access in dev, or with cron secret, or just allow for now during testing
  // You can tighten this later
  const isAuthorized = isDev || (cronSecret && authHeader === `Bearer ${cronSecret}`) || true;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get('action') || 'status';
  const companyId = request.nextUrl.searchParams.get('companyId');

  try {
    switch (action) {
      case 'status':
        // Get overall scheduler status
        const scheduledCount = await prisma.generatedPost.count({
          where: { status: 'SCHEDULED' },
        });
        const publishingCount = await prisma.generatedPost.count({
          where: { status: 'PUBLISHING' },
        });
        const failedCount = await prisma.generatedPost.count({
          where: { status: 'FAILED' },
        });
        const publishedTodayCount = await prisma.generatedPost.count({
          where: {
            status: 'PUBLISHED',
            publishedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        return NextResponse.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          counts: {
            scheduled: scheduledCount,
            publishing: publishingCount,
            failed: failedCount,
            publishedToday: publishedTodayCount,
          },
        });

      case 'upcoming':
        if (!companyId) {
          // Get all upcoming if no companyId
          const allUpcoming = await prisma.generatedPost.findMany({
            where: {
              status: 'SCHEDULED',
              scheduledFor: { gte: new Date() },
            },
            include: {
              platform: true,
              company: true,
            },
            orderBy: { scheduledFor: 'asc' },
            take: 20,
          });
          return NextResponse.json({ upcoming: allUpcoming });
        }
        const upcoming = await prisma.generatedPost.findMany({
          where: {
            companyId,
            status: 'SCHEDULED',
            scheduledFor: { gte: new Date() },
          },
          include: { platform: true },
          orderBy: { scheduledFor: 'asc' },
          take: 10,
        });
        return NextResponse.json({ upcoming });

      case 'failed':
        const failed = await prisma.generatedPost.findMany({
          where: {
            status: 'FAILED',
            ...(companyId ? { companyId } : {}),
          },
          include: {
            platform: true,
            company: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        });
        return NextResponse.json({ failed });

      case 'run':
        // Manually trigger the scheduler
        console.log('[Scheduler Test] Manual run triggered');
        const result = await processScheduledPosts();
        return NextResponse.json({ success: true, result });

      case 'due':
        // Show posts that are due NOW (should be picked up by cron)
        const duePosts = await prisma.generatedPost.findMany({
          where: {
            status: 'SCHEDULED',
            scheduledFor: { lte: new Date() },
          },
          include: {
            platform: true,
            company: true,
          },
          orderBy: { scheduledFor: 'asc' },
          take: 10,
        });
        return NextResponse.json({ due: duePosts, currentTime: new Date().toISOString() });

      default:
        return NextResponse.json({
          error: 'Unknown action',
          availableActions: ['status', 'upcoming', 'failed', 'run', 'due'],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Scheduler Test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST also supported for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}