// apps/web/src/app/api/companies/[id]/platforms/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Get all platforms for this company
    const platforms = await prisma.platform.findMany({
      where: { companyId },
      orderBy: { type: "asc" },
    });

    // Transform to the format expected by the generate page
    const formattedPlatforms = platforms.map((p) => ({
      id: p.id,
      type: p.type, // e.g., "FACEBOOK", "LINKEDIN"
      name: p.name || p.username || p.type,
      isConnected: p.isConnected,
      username: p.username,
      lastSyncAt: p.lastSyncAt,
    }));

    // If no platforms exist, return empty array (not an error)
    // The UI should handle this gracefully
    return NextResponse.json(formattedPlatforms);
  } catch (error) {
    console.error("Failed to fetch company platforms:", error);
    return NextResponse.json(
      { error: "Failed to fetch platforms" },
      { status: 500 }
    );
  }
}