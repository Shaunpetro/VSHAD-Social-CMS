// apps/web/src/app/api/debug/check/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await prisma.generatedPost.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        externalPostId: true,
        externalPostUrl: true,
        publishedAt: true,
        likes: true,
        impressions: true,
        lastSyncedAt: true,
        platform: { select: { type: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      count: posts.length,
      withExternalId: posts.filter(p => p.externalPostId).length,
      withoutExternalId: posts.filter(p => !p.externalPostId).length,
      posts: posts.map(p => ({
        id: p.id,
        platform: p.platform?.type,
        externalPostId: p.externalPostId || 'MISSING!',
        externalPostUrl: p.externalPostUrl || 'MISSING!',
        publishedAt: p.publishedAt,
        likes: p.likes,
        impressions: p.impressions,
        lastSyncedAt: p.lastSyncedAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined 
    }, { status: 500 });
  }
}