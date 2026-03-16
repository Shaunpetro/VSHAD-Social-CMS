import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLATFORMS } from "@/lib/platforms";

const TEMP_USER_ID = "temp-user-001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};

    if (companyId) {
      where.companyId = companyId;
    } else {
      where.company = {
        userId: TEMP_USER_ID,
      };
    }

    const platforms = await prisma.platform.findMany({
      where,
      orderBy: { type: "asc" },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform to match expected frontend format
    const connections = platforms.map((p) => {
      const connectionData = p.connectionData as Record<string, unknown> | null;
      return {
        id: p.id,
        platform: p.type.toLowerCase(),
        accountName: p.username || p.name,
        status: p.isConnected ? "connected" : "disconnected",
        companyId: p.companyId,
        company: p.company,
        lastSyncAt: p.lastSyncAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        scopes: (connectionData?.scopes as string[]) || [],
        expiresAt: connectionData?.expiresAt || null,
      };
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("Failed to fetch platform connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform connections" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, accountName, companyId } = body;

    if (!platform || !platform.trim()) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    if (!accountName || !accountName.trim()) {
      return NextResponse.json(
        { error: "Account name is required" },
        { status: 400 }
      );
    }

    if (!companyId || !companyId.trim()) {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 400 }
      );
    }

    const platformConfig = PLATFORMS[platform];
    if (!platformConfig) {
      return NextResponse.json(
        { error: `Unknown platform: ${platform}` },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.userId !== TEMP_USER_ID) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Convert platform string to PlatformType enum
    const platformType = platform.toUpperCase() as "LINKEDIN" | "FACEBOOK" | "TWITTER" | "INSTAGRAM" | "WORDPRESS";

    const existing = await prisma.platform.findFirst({
      where: {
        type: platformType,
        companyId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `${platformConfig.name} is already connected to this company`,
        },
        { status: 409 }
      );
    }

    const connectionData = {
      connectedVia: "manual",
      connectedAt: new Date().toISOString(),
      scopes: platformConfig.defaultScopes || [],
    };

    const newPlatform = await prisma.platform.create({
      data: {
        type: platformType,
        name: platformConfig.name,
        username: accountName.trim(),
        isConnected: true,
        connectionData,
        lastSyncAt: new Date(),
        companyId,
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

    // Transform to match expected frontend format
    const connection = {
      id: newPlatform.id,
      platform: newPlatform.type.toLowerCase(),
      accountName: newPlatform.username || newPlatform.name,
      status: newPlatform.isConnected ? "connected" : "disconnected",
      companyId: newPlatform.companyId,
      company: newPlatform.company,
      lastSyncAt: newPlatform.lastSyncAt,
      createdAt: newPlatform.createdAt,
      updatedAt: newPlatform.updatedAt,
      scopes: (connectionData?.scopes as string[]) || [],
      expiresAt: null,
    };

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error("Failed to create platform connection:", error);
    return NextResponse.json(
      { error: "Failed to create platform connection" },
      { status: 500 }
    );
  }
}