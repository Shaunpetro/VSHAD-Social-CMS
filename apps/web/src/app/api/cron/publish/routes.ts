// apps/web/src/app/api/scheduler/test/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPosts, getUpcomingScheduledPosts, getFailedPosts } from '@/lib/scheduler';
import { prisma } from '@/lib/db';

/**
 * Test/debug endpoint for the scheduler
 * Only available in development or with proper auth
 */
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!isDev && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
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
          counts: {
            scheduled: scheduledCount,
            publishing: publishingCount,
            failed: failedCount,
            publishedToday: publishedTodayCount,
          },
        });

      case 'upcoming':
        if (!companyId) {
          return NextResponse.json({ error: 'companyId required' }, { status: 400 });
        }
        const upcoming = await getUpcomingScheduledPosts(companyId);
        return NextResponse.json({ upcoming });

      case 'failed':
        if (!companyId) {
          return NextResponse.json({ error: 'companyId required' }, { status: 400 });
        }
        const failed = await getFailedPosts(companyId);
        return NextResponse.json({ failed });

      case 'run':
        // Manually trigger the scheduler
        const result = await processScheduledPosts();
        return NextResponse.json({ success: true, result });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Scheduler Test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}