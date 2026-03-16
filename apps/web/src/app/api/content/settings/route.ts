import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════
// GET /api/content/settings?companyId=xxx
// Fetch content settings for a company
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    let settings = await db.contentSettings.findUnique({
      where: { companyId },
    });

    // Return defaults if no settings exist
    if (!settings) {
      const company = await db.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }

      // Return default settings (not saved yet)
      return NextResponse.json({
        companyId,
        tone: 'professional',
        topics: ['industry insights', 'company updates'],
        keywords: [company.name.toLowerCase()],
        postFrequency: 7,
        includeHashtags: true,
        includeEmojis: false,
        brandVoice: null,
        avoidTopics: [],
        isDefault: true,
      });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error fetching content settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content settings' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /api/content/settings
// Update content settings for a company
// ═══════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      tone,
      topics,
      keywords,
      postFrequency,
      includeHashtags,
      includeEmojis,
      brandVoice,
      avoidTopics,
    } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Validate tone
    const validTones = ['professional', 'casual', 'friendly', 'authoritative'];
    if (tone && !validTones.includes(tone)) {
      return NextResponse.json(
        { error: `Invalid tone. Must be one of: ${validTones.join(', ')}` },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await db.contentSettings.upsert({
      where: { companyId },
      update: {
        tone: tone || undefined,
        topics: topics || undefined,
        keywords: keywords || undefined,
        postFrequency: postFrequency || undefined,
        includeHashtags: includeHashtags !== undefined ? includeHashtags : undefined,
        includeEmojis: includeEmojis !== undefined ? includeEmojis : undefined,
        brandVoice: brandVoice !== undefined ? brandVoice : undefined,
        avoidTopics: avoidTopics || undefined,
      },
      create: {
        companyId,
        tone: tone || 'professional',
        topics: topics || ['industry insights', 'company updates'],
        keywords: keywords || [],
        postFrequency: postFrequency || 7,
        includeHashtags: includeHashtags !== undefined ? includeHashtags : true,
        includeEmojis: includeEmojis !== undefined ? includeEmojis : false,
        brandVoice: brandVoice || null,
        avoidTopics: avoidTopics || [],
      },
    });

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error updating content settings:', error);
    return NextResponse.json(
      { error: 'Failed to update content settings' },
      { status: 500 }
    );
  }
}