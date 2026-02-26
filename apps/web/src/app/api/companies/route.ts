import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';  // Updated import path

// GET /api/companies — list all companies
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies — create a new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, website, industry, description, logo, brandVoice, keywords } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    if (!website || !website.trim()) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual authenticated user ID from Lucia
    const TEMP_USER_ID = 'temp-user-001';

    // Ensure temp user exists (development only)
    await prisma.user.upsert({
      where: { id: TEMP_USER_ID },
      update: {},
      create: {
        id: TEMP_USER_ID,
        email: 'dev@robosocial.app',
        name: 'Dev User',
      },
    });

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        website: website.trim(),
        industry: industry?.trim() || null,
        description: description?.trim() || null,
        logo: logo?.trim() || null,
        brandVoice: brandVoice || 'professional',
        keywords: keywords || [],
        userId: TEMP_USER_ID,
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

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Failed to create company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}