// apps/web/src/app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Fetch all media for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const type = searchParams.get("type"); // IMAGE, VIDEO, GIF

    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    if (type) {
      where.type = type;
    }

    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST - Save uploaded media to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      filename,
      url,
      thumbnailUrl,
      type,
      mimeType,
      size,
      width,
      height,
      altText,
    } = body;

    // Validate required fields
    if (!companyId || !filename || !url || !type) {
      return NextResponse.json(
        { error: "Missing required fields: companyId, filename, url, type" },
        { status: 400 }
      );
    }

    const media = await prisma.media.create({
      data: {
        companyId,
        filename,
        url,
        thumbnailUrl,
        type,
        mimeType,
        size: size || 0,
        width,
        height,
        altText,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("Failed to save media:", error);
    return NextResponse.json(
      { error: "Failed to save media" },
      { status: 500 }
    );
  }
}