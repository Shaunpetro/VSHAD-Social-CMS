// apps/web/src/app/api/cron/publish/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPosts } from '@/lib/scheduler';

/**
 * Cron job endpoint for processing scheduled posts
 *
 * This endpoint is called by Vercel Cron (configured in vercel.json)
 * It processes all posts that are scheduled and due for publishing
 *
 * Security: Vercel automatically adds authorization for cron requests
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    // Vercel sets this header automatically for cron jobs
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';

    // Also allow manual trigger with CRON_SECRET for testing
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isAuthorizedManual = cronSecret && authHeader === `Bearer ${cronSecret}`;

    // In development, allow without auth
    const isDev = process.env.NODE_ENV === 'development';

    if (!isVercelCron && !isAuthorizedManual && !isDev) {
      console.warn('[Cron] Unauthorized cron request attempted');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting scheduled post processing...');
    console.log('[Cron] Triggered by:', isVercelCron ? 'Vercel Cron' : isAuthorizedManual ? 'Manual (authorized)' : 'Development');

    const startTime = Date.now();
    const result = await processScheduledPosts();
    const duration = Date.now() - startTime;

    console.log(`[Cron] Completed in ${duration}ms:`, result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      result,
    });
  } catch (error) {
    console.error('[Cron] Failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers (e.g., from admin dashboard)
export async function POST(request: NextRequest) {
  return GET(request);
}