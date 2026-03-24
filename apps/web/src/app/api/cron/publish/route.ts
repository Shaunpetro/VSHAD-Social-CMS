// apps/web/src/app/api/cron/publish/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPosts } from '@/lib/scheduler';

/**
 * Cron job endpoint for processing scheduled posts
 *
 * This endpoint is called by Vercel Cron (configured in vercel.json)
 * It processes all posts that are scheduled and due for publishing
 */
export async function GET(request: NextRequest) {
  try {
    // Log all headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('[Cron] Request headers:', JSON.stringify(headers, null, 2));

    // Check for Vercel cron header (multiple possible formats)
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    const isVercelCron = vercelCronHeader === '1' || vercelCronHeader === 'true' || !!vercelCronHeader;

    // Check for authorization header with CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isAuthorizedManual = cronSecret && authHeader === `Bearer ${cronSecret}`;

    // In development, allow without auth
    const isDev = process.env.NODE_ENV === 'development';

    // Also check for Vercel's internal request signature
    const vercelSignature = request.headers.get('x-vercel-signature');
    const hasVercelSignature = !!vercelSignature;

    console.log('[Cron] Auth check:', {
      isVercelCron,
      vercelCronHeader,
      isAuthorizedManual: !!isAuthorizedManual,
      isDev,
      hasVercelSignature,
    });

    // Allow if ANY of these conditions are true
    if (!isVercelCron && !isAuthorizedManual && !isDev && !hasVercelSignature) {
      // For now, let's also allow based on user-agent from Vercel
      const userAgent = request.headers.get('user-agent') || '';
      const isVercelUserAgent = userAgent.toLowerCase().includes('vercel');
      
      if (!isVercelUserAgent) {
        console.warn('[Cron] Unauthorized cron request attempted');
        console.warn('[Cron] Headers received:', headers);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron] Starting scheduled post processing...');
    console.log('[Cron] Triggered by:', 
      isVercelCron ? 'Vercel Cron Header' : 
      hasVercelSignature ? 'Vercel Signature' :
      isAuthorizedManual ? 'Manual (authorized)' : 
      'Other (allowed)'
    );

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

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}