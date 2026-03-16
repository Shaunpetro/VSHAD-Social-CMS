import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════
// GET /api/companies
// Fetch all companies with their platforms
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        platforms: true,
        contentSettings: true,
        _count: {
          select: {
            platforms: true,
            generatedPosts: true,
          },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/companies
// Create a new company
// ═══════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, website, industry, description } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        description: description?.trim() || null,
        userId: 'temp-user-001', // TODO: Replace with real user ID from auth
      },
      include: {
        platforms: true,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}