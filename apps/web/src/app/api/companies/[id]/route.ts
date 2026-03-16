// apps/web/src/app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch single company by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        platforms: true,
        contentSettings: true,
        _count: {
          select: {
            platforms: true,
            generatedPosts: true,
            media: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PUT - Update a company
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, website, industry, description, logo } = body;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Build update data - only include fields that are provided
    const updateData: any = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Company name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (website !== undefined) {
      updateData.website = website?.trim() || null;
    }

    if (industry !== undefined) {
      updateData.industry = industry?.trim() || null;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (logo !== undefined) {
      updateData.logo = logo || null;
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        platforms: true,
        contentSettings: true,
        _count: {
          select: {
            platforms: true,
            generatedPosts: true,
            media: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a company
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            platforms: true,
            generatedPosts: true,
            media: true,
          },
        },
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Delete related records first (cascade might not be set in schema)
    // Delete in order: PostMedia -> GeneratedPost -> Platform -> Media -> ContentSettings -> Company

    // Delete all PostMedia for this company's posts
    await prisma.postMedia.deleteMany({
      where: {
        post: {
          companyId: id,
        },
      },
    });

    // Delete all generated posts
    await prisma.generatedPost.deleteMany({
      where: { companyId: id },
    });

    // Delete all bulk schedules
    await prisma.bulkSchedule.deleteMany({
      where: { companyId: id },
    });

    // Delete all platforms
    await prisma.platform.deleteMany({
      where: { companyId: id },
    });

    // Delete all media
    await prisma.media.deleteMany({
      where: { companyId: id },
    });

    // Delete content settings if exists
    await prisma.contentSettings.deleteMany({
      where: { companyId: id },
    });

    // Finally delete the company
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Company and all related data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}