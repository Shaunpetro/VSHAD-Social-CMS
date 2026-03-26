// apps/web/src/app/api/posts/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLinkedInPost } from '@/lib/publisher/linkedin';
import { createFacebookPost } from '@/lib/publisher/facebook';
import { PostStatus, PlatformType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    console.log('[Publish API] Starting publish for post', id);

    const post = await prisma.generatedPost.findUnique({
      where: { id },
      include: {
        platform: true,
        company: true,
        postMedia: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.status === PostStatus.PUBLISHED && post.externalPostId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Post is already published',
          externalPostId: post.externalPostId,
          externalPostUrl: post.externalPostUrl,
        },
        { status: 400 }
      );
    }

    if (!post.platform.isConnected || !post.platform.connectionData) {
      return NextResponse.json(
        { success: false, error: 'Platform ' + post.platform.type + ' is not connected. Please connect it first.' },
        { status: 400 }
      );
    }

    await prisma.generatedPost.update({
      where: { id: post.id },
      data: { status: PostStatus.PUBLISHING },
    });

    const connectionData = post.platform.connectionData as Record<string, unknown>;
    const mediaUrls = post.postMedia?.map((pm) => pm.media.url) || [];

    console.log('[Publish API] Publishing post', id, 'to', post.platform.type);

    let publishResult: { success: boolean; postId?: string; postUrl?: string; error?: string };

    try {
      switch (post.platform.type) {
        case PlatformType.LINKEDIN: {
          const linkedinSub = connectionData.linkedinSub as string | undefined;
          const linkedinAccessToken = connectionData.accessToken as string | undefined;

          if (!linkedinSub || !linkedinAccessToken) {
            throw new Error('LinkedIn connection data missing. Please reconnect your account.');
          }

          publishResult = await createLinkedInPost({
            content: post.content,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
            accessToken: linkedinAccessToken,
            authorId: linkedinSub,
            postingMode: (connectionData.postingMode as 'personal' | 'organization') || 'personal',
            organizationId: connectionData.organizationId as string | null | undefined,
          });
          break;
        }

        case PlatformType.FACEBOOK: {
          const pageAccessToken = (connectionData.pageAccessToken || connectionData.accessToken) as string | undefined;
          const pageId = connectionData.pageId as string | undefined;

          if (!pageAccessToken || !pageId) {
            throw new Error('Facebook connection data missing. Please reconnect your account.');
          }

          publishResult = await createFacebookPost({
            content: post.content,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
            pageAccessToken: pageAccessToken,
            pageId: pageId,
          });
          break;
        }

        default:
          throw new Error('Unsupported platform: ' + post.platform.type);
      }
    } catch (publishError) {
      await prisma.generatedPost.update({
        where: { id: post.id },
        data: { status: PostStatus.DRAFT },
      });
      throw publishError;
    }

    if (publishResult.success) {
      const updatedPost = await prisma.generatedPost.update({
        where: { id: post.id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
          externalPostId: publishResult.postId || null,
          externalPostUrl: publishResult.postUrl || null,
        },
        include: {
          platform: true,
          company: true,
          postMedia: {
            include: {
              media: true,
            },
          },
        },
      });

      console.log('[Publish API] Success! postId:', publishResult.postId);

      return NextResponse.json({
        success: true,
        message: 'Post published successfully to ' + post.platform.type,
        post: updatedPost,
        externalPostId: publishResult.postId,
        externalPostUrl: publishResult.postUrl,
      });
    } else {
      await prisma.generatedPost.update({
        where: { id: post.id },
        data: { status: PostStatus.FAILED },
      });

      return NextResponse.json(
        { success: false, error: publishResult.error || 'Unknown publishing error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Publish API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to publish post' },
      { status: 500 }
    );
  }
}