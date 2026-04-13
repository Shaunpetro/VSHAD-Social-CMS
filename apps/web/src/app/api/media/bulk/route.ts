// apps/web/src/app/api/media/bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";

type BulkAction = "delete" | "move" | "update" | "markUsed" | "markAvailable";

interface BulkRequestBody {
  action: BulkAction;
  mediaIds: string[];
  // For move action
  targetCompanyId?: string;
  // For update action
  updates?: {
    pillarIds?: string[];
    contentTypes?: string[];
    tags?: string[];
    autoSelect?: boolean;
    priority?: number;
  };
}

// POST /api/media/bulk - Perform bulk operations on media
export async function POST(request: NextRequest) {
  try {
    const body: BulkRequestBody = await request.json();
    const { action, mediaIds, targetCompanyId, updates } = body;

    // Validate request
    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: "Media IDs array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate media exists
    const existingMedia = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
      select: {
        id: true,
        url: true,
        filename: true,
        companyId: true,
        isUsed: true,
      },
    });

    if (existingMedia.length === 0) {
      return NextResponse.json(
        { error: "No valid media found" },
        { status: 404 }
      );
    }

    const foundIds = existingMedia.map((m) => m.id);
    const notFoundIds = mediaIds.filter((id) => !foundIds.includes(id));

    // Execute action
    let result: Record<string, unknown>;

    switch (action) {
      case "delete":
        result = await handleBulkDelete(existingMedia);
        break;

      case "move":
        if (!targetCompanyId) {
          return NextResponse.json(
            { error: "Target company ID is required for move action" },
            { status: 400 }
          );
        }
        result = await handleBulkMove(foundIds, targetCompanyId);
        break;

      case "update":
        if (!updates || Object.keys(updates).length === 0) {
          return NextResponse.json(
            { error: "Updates object is required for update action" },
            { status: 400 }
          );
        }
        result = await handleBulkUpdate(foundIds, updates);
        break;

      case "markUsed":
        result = await handleBulkMarkUsed(foundIds, true);
        break;

      case "markAvailable":
        result = await handleBulkMarkUsed(foundIds, false);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      requested: mediaIds.length,
      processed: existingMedia.length,
      notFound: notFoundIds,
      ...result,
    });
  } catch (error) {
    console.error("Failed to perform bulk operation:", error);
    return NextResponse.json(
      { 
        error: "Failed to perform bulk operation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle bulk delete
async function handleBulkDelete(
  media: { id: string; url: string; filename: string }[]
): Promise<Record<string, unknown>> {
  const blobResults = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Delete from Vercel Blob
  for (const m of media) {
    try {
      await del(m.url);
      blobResults.success++;
    } catch (error) {
      blobResults.failed++;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      blobResults.errors.push(`${m.filename}: ${errorMsg}`);
      console.error(`Failed to delete blob for ${m.id}:`, error);
    }
  }

  // Delete from database
  const deleteResult = await prisma.media.deleteMany({
    where: { id: { in: media.map((m) => m.id) } },
  });

  return {
    deleted: deleteResult.count,
    blobCleanup: blobResults,
    deletedFiles: media.map((m) => ({
      id: m.id,
      filename: m.filename,
    })),
  };
}

// Handle bulk move to another company
async function handleBulkMove(
  mediaIds: string[],
  targetCompanyId: string
): Promise<Record<string, unknown>> {
  // Verify target company exists
  const targetCompany = await prisma.company.findUnique({
    where: { id: targetCompanyId },
    select: { id: true, name: true },
  });

  if (!targetCompany) {
    throw new Error(`Target company not found: ${targetCompanyId}`);
  }

  // Get source companies for reporting
  const sourceMedia = await prisma.media.findMany({
    where: { id: { in: mediaIds } },
    select: {
      id: true,
      companyId: true,
      company: { select: { name: true } },
    },
  });

  // Update company ID
  const updateResult = await prisma.media.updateMany({
    where: { id: { in: mediaIds } },
    data: {
      companyId: targetCompanyId,
      // Clear pillar associations since pillars are company-specific
      pillarIds: [],
    },
  });

  // Group by source company for reporting
  const sourceCompanies: Record<string, { name: string; count: number }> = {};
  for (const m of sourceMedia) {
    if (!sourceCompanies[m.companyId]) {
      sourceCompanies[m.companyId] = {
        name: m.company.name,
        count: 0,
      };
    }
    sourceCompanies[m.companyId].count++;
  }

  return {
    moved: updateResult.count,
    targetCompany: {
      id: targetCompany.id,
      name: targetCompany.name,
    },
    sourceCompanies: Object.entries(sourceCompanies).map(([id, data]) => ({
      id,
      ...data,
    })),
    note: "Pillar associations were cleared since pillars are company-specific",
  };
}

// Handle bulk update
async function handleBulkUpdate(
  mediaIds: string[],
  updates: {
    pillarIds?: string[];
    contentTypes?: string[];
    tags?: string[];
    autoSelect?: boolean;
    priority?: number;
  }
): Promise<Record<string, unknown>> {
  // Build update data
  const updateData: Record<string, unknown> = {};

  if (updates.pillarIds !== undefined) {
    updateData.pillarIds = updates.pillarIds;
  }

  if (updates.contentTypes !== undefined) {
    updateData.contentTypes = updates.contentTypes;
  }

  if (updates.tags !== undefined) {
    updateData.tags = updates.tags.map((t) => t.toLowerCase().trim());
  }

  if (updates.autoSelect !== undefined) {
    updateData.autoSelect = updates.autoSelect;
  }

  if (updates.priority !== undefined) {
    updateData.priority = updates.priority;
  }

  const updateResult = await prisma.media.updateMany({
    where: { id: { in: mediaIds } },
    data: updateData,
  });

  return {
    updated: updateResult.count,
    appliedUpdates: updateData,
  };
}

// Handle bulk mark as used/available
async function handleBulkMarkUsed(
  mediaIds: string[],
  isUsed: boolean
): Promise<Record<string, unknown>> {
  const now = new Date();

  const updateData: Record<string, unknown> = {
    isUsed,
  };

  if (isUsed) {
    updateData.usedAt = now;
  } else {
    // Reset used fields when marking as available
    updateData.usedAt = null;
    updateData.usedInPostId = null;
  }

  const updateResult = await prisma.media.updateMany({
    where: { id: { in: mediaIds } },
    data: updateData,
  });

  return {
    updated: updateResult.count,
    newStatus: isUsed ? "used" : "available",
    timestamp: now.toISOString(),
  };
}

// GET /api/media/bulk - Get bulk operation options and validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaIdsParam = searchParams.get("mediaIds");

    if (!mediaIdsParam) {
      // Return available actions info
      return NextResponse.json({
        availableActions: [
          {
            action: "delete",
            description: "Permanently delete selected media from blob storage and database",
            requiredParams: ["mediaIds"],
          },
          {
            action: "move",
            description: "Move selected media to a different company",
            requiredParams: ["mediaIds", "targetCompanyId"],
            note: "Pillar associations will be cleared",
          },
          {
            action: "update",
            description: "Update metadata for selected media",
            requiredParams: ["mediaIds", "updates"],
            updateableFields: ["pillarIds", "contentTypes", "tags", "autoSelect", "priority"],
          },
          {
            action: "markUsed",
            description: "Mark selected media as used",
            requiredParams: ["mediaIds"],
          },
          {
            action: "markAvailable",
            description: "Mark selected media as available (reset used status)",
            requiredParams: ["mediaIds"],
          },
        ],
        example: {
          delete: {
            action: "delete",
            mediaIds: ["id1", "id2"],
          },
          move: {
            action: "move",
            mediaIds: ["id1", "id2"],
            targetCompanyId: "company123",
          },
          update: {
            action: "update",
            mediaIds: ["id1", "id2"],
            updates: {
              tags: ["new-tag"],
              autoSelect: true,
            },
          },
        },
      });
    }

    // Validate provided media IDs
    const mediaIds = mediaIdsParam.split(",").filter(Boolean);

    const media = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
      select: {
        id: true,
        filename: true,
        companyId: true,
        isUsed: true,
        company: {
          select: { name: true },
        },
      },
    });

    const foundIds = media.map((m) => m.id);
    const notFoundIds = mediaIds.filter((id) => !foundIds.includes(id));

    // Group by company
    const byCompany: Record<string, { name: string; count: number; mediaIds: string[] }> = {};
    for (const m of media) {
      if (!byCompany[m.companyId]) {
        byCompany[m.companyId] = {
          name: m.company.name,
          count: 0,
          mediaIds: [],
        };
      }
      byCompany[m.companyId].count++;
      byCompany[m.companyId].mediaIds.push(m.id);
    }

    // Get available target companies for move
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      validation: {
        requested: mediaIds.length,
        found: media.length,
        notFound: notFoundIds,
      },
      media: media.map((m) => ({
        id: m.id,
        filename: m.filename,
        company: m.company.name,
        isUsed: m.isUsed,
      })),
      byCompany: Object.entries(byCompany).map(([id, data]) => ({
        companyId: id,
        ...data,
      })),
      availableTargetCompanies: companies,
    });
  } catch (error) {
    console.error("Failed to validate bulk operation:", error);
    return NextResponse.json(
      { error: "Failed to validate bulk operation" },
      { status: 500 }
    );
  }
}