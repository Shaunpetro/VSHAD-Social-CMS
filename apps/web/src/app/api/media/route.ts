// apps/web/src/app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

// GET - List media with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const pillarId = searchParams.get("pillarId");
    const contentType = searchParams.get("contentType");
    const type = searchParams.get("type"); // IMAGE, VIDEO, GIF
    const tag = searchParams.get("tag");
    const unused = searchParams.get("unused"); // "true" to get only unused media

    // Build where clause
    const where: Record<string, unknown> = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (type) {
      where.type = type;
    }

    if (unused === "true") {
      where.usageCount = 0;
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
      orderBy: {
        createdAt: "desc",
      },
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

    return NextResponse.json(media);
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST - Upload new media
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const companyId = formData.get("companyId") as string | null;
    const pillarIdsJson = formData.get("pillarIds") as string | null;
    const contentTypesJson = formData.get("contentTypes") as string | null;
    const tagsJson = formData.get("tags") as string | null;
    const altText = formData.get("altText") as string | null;

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
    const tags = tagsJson ? JSON.parse(tagsJson) : [];

    // Determine media type
    const mimeType = file.type;
    let mediaType: "IMAGE" | "VIDEO" | "GIF" = "IMAGE";
    if (mimeType.startsWith("video/")) {
      mediaType = "VIDEO";
    } else if (mimeType === "image/gif") {
      mediaType = "GIF";
    }

    // Upload to Vercel Blob
    const filename = `${companyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Get image dimensions (basic approach - works for most images)
    let width: number | null = null;
    let height: number | null = null;

    // Create media record
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
        usageCount: 0,
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