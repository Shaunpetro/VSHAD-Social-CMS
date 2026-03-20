// apps/web/src/app/api/publish/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { publishPost, publishMultiplePosts, validatePlatformConnection } from '@/lib/publisher';

// ============================================
// POST: Publish one or more posts
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, postIds, dryRun = false } = body;

    // Single post publish
    if (postId) {
      const result = await publishPost({ postId, dryRun });

      return NextResponse.json({
        success: result.success,
        result,
      }, {
        status: result.success ? 200 : 400,
      });
    }

    // Bulk publish
    if (postIds && Array.isArray(postIds) && postIds.length > 0) {
      if (postIds.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 posts can be published at once' },
          { status: 400 }
        );
      }

      const { results, summary } = await publishMultiplePosts(postIds);

      return NextResponse.json({
        success: summary.failed === 0,
        results,
        summary,
      });
    }

    return NextResponse.json(
      { error: 'postId or postIds is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Publish API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET: Validate platform connection before publishing
// ============================================

export async function GET(request: NextRequest) {
  try {
    const platformId = request.nextUrl.searchParams.get('platformId');

    if (!platformId) {
      return NextResponse.json(
        { error: 'platformId is required' },
        { status: 400 }
      );
    }

    const validation = await validatePlatformConnection(platformId);

    return NextResponse.json({
      valid: validation.valid,
      platform: validation.platform,
      error: validation.error,
    });
  } catch (error) {
    console.error('Platform validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      },
      { status: 500 }
    );
  }
}