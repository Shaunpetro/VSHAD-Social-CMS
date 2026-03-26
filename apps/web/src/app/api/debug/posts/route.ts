// apps/web/src/app/api/debug/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get ALL published posts (not just those with externalPostId)
    const posts = await prisma.generatedPost.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        content: true,
        status: true,
        publishedAt: true,
        externalPostId: true,
        externalPostUrl: true,
        lastSyncedAt: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        createdAt: true,
        platform: {
          select: {
            type: true,
            name: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    const summary = {
      total: posts.length,
      withExternalId: posts.filter(p => p.externalPostId).length,
      withoutExternalId: posts.filter(p => !p.externalPostId).length,
      synced: posts.filter(p => p.lastSyncedAt).length,
      withMetrics: posts.filter(p => (p.likes || 0) > 0 || (p.comments || 0) > 0).length,
      breakdown: {
        linkedin: posts.filter(p => p.platform?.type === 'LINKEDIN').length,
        facebook: posts.filter(p => p.platform?.type === 'FACEBOOK').length,
      },
    };

    const analysis = {
      postsWithExternalId: posts.filter(p => p.externalPostId).map(p => ({
        id: p.id,
        platform: p.platform?.type,
        externalPostId: p.externalPostId,
        externalPostUrl: p.externalPostUrl,
        hasMetrics: (p.likes || 0) > 0 || (p.impressions || 0) > 0,
      })),
      postsWithoutExternalId: posts.filter(p => !p.externalPostId).map(p => ({
        id: p.id,
        platform: p.platform?.type,
        contentPreview: p.content?.substring(0, 50) + '...',
        publishedAt: p.publishedAt,
        problem: 'NO externalPostId - was marked published but not actually sent to platform API',
      })),
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary,
      diagnosis: summary.withExternalId === 0 
        ? '⚠️ NO posts have externalPostId! Analytics sync cannot work. Posts were marked as published but not actually sent to LinkedIn/Facebook APIs.'
        : `✅ ${summary.withExternalId} posts have externalPostId and can be synced.`,
      analysis,
      posts,
    });
  } catch (error) {
    console.error('[Debug Posts] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}