// apps/web/src/app/api/media/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { Prisma } from "@prisma/client";

// GET - List media with filters (ENHANCED with lifecycle support)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const pillarId = searchParams.get("pillarId");
    const contentType = searchParams.get("contentType");
    const type = searchParams.get("type"); // IMAGE, VIDEO, GIF
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // available, used, expiring, expired, all
    const unused = searchParams.get("unused"); // Legacy: "true" to get only unused media
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause with proper Prisma types
    const where: Prisma.MediaWhereInput = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (type) {
      where.type = type as "IMAGE" | "VIDEO" | "GIF";
    }

    // Legacy support for unused parameter
    if (unused === "true") {
      where.usageCount = 0;
      where.isUsed = false;
    }

    // New status filters
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7);

    if (status === "available") {
      where.isUsed = false;
      where.OR = [
        { expiresAt: { equals: null } },
        { expiresAt: { gt: now } },
      ] as Prisma.MediaWhereInput[];
    } else if (status === "used") {
      where.isUsed = true;
    } else if (status === "expiring") {
      where.isUsed = false;
      where.expiresAt = {
        gt: now,
        lte: warningDate,
      };
    } else if (status === "expired") {
      where.expiresAt = { lt: now };
    }

    // Search filter
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { altText: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch media
    let media = await prisma.media.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        _count: {
          select: {
            postMedia: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    });

    // Filter by pillarId (since it's an array field)
    if (pillarId) {
      media = media.filter((m) => m.pillarIds.includes(pillarId));
    }

    // Filter by contentType (since it's an array field)
    if (contentType) {
      media = media.filter((m) => m.contentTypes.includes(contentType));
    }

    // Filter by tag (since it's an array field)
    if (tag) {
      const tagLower = tag.toLowerCase();
      media = media.filter((m) =>
        m.tags.some((t) => t.toLowerCase().includes(tagLower))
      );
    }

    // Get total count for pagination
    const total = await prisma.media.count({ where });

    // Get stats if companyId provided
    let stats = null;
    if (companyId) {
      stats = await getMediaStats(companyId);
    }

    return NextResponse.json({
      media,
      total,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST - Upload new media (ENHANCED with lifecycle fields)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const companyId = formData.get("companyId") as string | null;
    const pillarIdsJson = formData.get("pillarIds") as string | null;
    const contentTypesJson = formData.get("contentTypes") as string | null;
    const tagsJson = formData.get("tags") as string | null;
    const altText = formData.get("altText") as string | null;
    const autoSelectValue = formData.get("autoSelect") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Parse arrays
    const pillarIds = pillarIdsJson ? JSON.parse(pillarIdsJson) : [];
    const contentTypes = contentTypesJson ? JSON.parse(contentTypesJson) : [];
    const tags = tagsJson 
      ? JSON.parse(tagsJson).map((t: string) => t.toLowerCase().trim()) 
      : [];

    // Parse autoSelect (default true)
    const autoSelect = autoSelectValue !== "false";

    // Determine media type
    const mimeType = file.type;
    let mediaType: "IMAGE" | "VIDEO" | "GIF" = "IMAGE";
    if (mimeType.startsWith("video/")) {
      mediaType = "VIDEO";
    } else if (mimeType === "image/gif") {
      mediaType = "GIF";
    }

    // Upload to Vercel Blob
    const filename = `media/${companyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Calculate expiry date (2 months from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 2);

    // Get image dimensions (basic approach - works for most images)
    const width: number | null = null;
    const height: number | null = null;

    // Create media record with lifecycle fields
    const media = await prisma.media.create({
      data: {
        companyId,
        filename: file.name,
        url: blob.url,
        type: mediaType,
        mimeType,
        size: file.size,
        width,
        height,
        altText,
        pillarIds,
        contentTypes,
        tags,
        // Lifecycle fields
        isUsed: false,
        usedAt: null,
        usedInPostId: null,
        expiresAt,
        // Auto-selection fields
        autoSelect,
        priority: 0,
        // Usage tracking
        usageCount: 0,
        lastUsedAt: null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("Failed to upload media:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}

// Helper function to get media stats for a company
async function getMediaStats(companyId: string) {
  const now = new Date();
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + 7);

  // Build the "available" where clause with proper typing
  const availableWhere: Prisma.MediaWhereInput = {
    companyId,
    isUsed: false,
    OR: [
      { expiresAt: { equals: null } },
      { expiresAt: { gt: now } },
    ] as Prisma.MediaWhereInput[],
  };

  const [total, available, used, expiring] = await Promise.all([
    prisma.media.count({ where: { companyId } }),
    prisma.media.count({ where: availableWhere }),
    prisma.media.count({
      where: { companyId, isUsed: true },
    }),
    prisma.media.count({
      where: {
        companyId,
        isUsed: false,
        expiresAt: {
          gt: now,
          lte: warningDate,
        },
      },
    }),
  ]);

  return { total, available, used, expiring };
}