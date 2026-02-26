import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';

// GET /api/companies/[id] — get single company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        topics: {
          orderBy: { scheduledFor: 'asc' },
        },
        connections: true,
        _count: {
          select: {
            topics: true,
            connections: true,
            posts: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Failed to fetch company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] — update company
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, website, industry, description, logo, brandVoice, keywords } = body;

    // Check company exists
    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Validation
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: 'Company name cannot be empty' },
        { status: 400 }
      );
    }

    if (website !== undefined && !website.trim()) {
      return NextResponse.json(
        { error: 'Website URL cannot be empty' },
        { status: 400 }
      );
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(website !== undefined && { website: website.trim() }),
        ...(industry !== undefined && { industry: industry?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(logo !== undefined && { logo: logo?.trim() || null }),
        ...(brandVoice !== undefined && { brandVoice }),
        ...(keywords !== undefined && { keywords }),
      },
      include: {
        _count: {
          select: {
            topics: true,
            connections: true,
            posts: true,
          },
        },
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Failed to update company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] — delete company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    console.error('Failed to delete company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}