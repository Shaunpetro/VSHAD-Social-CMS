// apps/web/src/app/api/media/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";

// GET - Get single media with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        postMedia: {
          include: {
            post: {
              select: {
                id: true,
                content: true,
                status: true,
                scheduledFor: true,
                publishedAt: true,
                pillar: true,
                contentType: true,
              },
            },
          },
          orderBy: {
            post: {
              createdAt: "desc",
            },
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (media.expiresAt) {
      const now = new Date();
      const diffTime = media.expiresAt.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Determine lifecycle status
    let lifecycleStatus: "available" | "used" | "expiring" | "expired" = "available";
    if (media.isUsed) {
      lifecycleStatus = "used";
    } else if (media.expiresAt) {
      const now = new Date();
      if (media.expiresAt < now) {
        lifecycleStatus = "expired";
      } else if (daysUntilExpiry !== null && daysUntilExpiry <= 7) {
        lifecycleStatus = "expiring";
      }
    }

    return NextResponse.json({
      ...media,
      daysUntilExpiry,
      lifecycleStatus,
    });
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// PATCH - Update media metadata and lifecycle settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      // Existing fields
      pillarIds,
      contentTypes,
      tags,
      altText,
      // New lifecycle fields
      autoSelect,
      priority,
      isUsed,
      usedAt,
      usedInPostId,
      expiresAt,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Existing fields
    if (pillarIds !== undefined) updateData.pillarIds = pillarIds;
    if (contentTypes !== undefined) updateData.contentTypes = contentTypes;
    if (tags !== undefined) {
      updateData.tags = tags.map((t: string) => t.toLowerCase().trim());
    }
    if (altText !== undefined) updateData.altText = altText;

    // Lifecycle fields
    if (autoSelect !== undefined) updateData.autoSelect = autoSelect;
    if (priority !== undefined) updateData.priority = priority;
    
    // Mark as used (typically called when media is attached to a published post)
    if (isUsed !== undefined) {
      updateData.isUsed = isUsed;
      if (isUsed) {
        updateData.usedAt = usedAt || new Date();
        updateData.usedInPostId = usedInPostId || null;
        // Increment usage count
        updateData.usageCount = { increment: 1 };
        updateData.lastUsedAt = new Date();
      }
    }

    // Allow manual expiry date override
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    const media = await prisma.media.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Failed to update media:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE - Delete media from blob storage and database
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get media to get blob URL
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        postMedia: true,
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check if media is attached to any posts (optional: prevent deletion)
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    if (media.postMedia.length > 0 && !force) {
      return NextResponse.json(
        {
          error: "Media is attached to posts",
          attachedPosts: media.postMedia.length,
          hint: "Use ?force=true to delete anyway",
        },
        { status: 400 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(media.url);
    } catch (blobError) {
      console.error("Failed to delete from blob storage:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database (cascade will handle postMedia)
    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        id: media.id,
        filename: media.filename,
      },
    });
  } catch (error) {
    console.error("Failed to delete media:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}

// POST - Mark media as used (convenience endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { postId } = body;

    const media = await prisma.media.update({
      where: { id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedInPostId: postId || null,
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("Failed to mark media as used:", error);
    return NextResponse.json(
      { error: "Failed to mark media as used" },
      { status: 500 }
    );
  }
}