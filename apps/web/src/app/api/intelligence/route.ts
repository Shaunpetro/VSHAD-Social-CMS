// apps/web/src/app/api/intelligence/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Type for industry defaults from benchmark
interface IndustryDefaults {
  postsPerWeek?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
  defaultTone?: string;
  humorEnabled?: boolean;
  industryHashtags?: string[];
  primaryKeywords?: string[];
  industryBenchmarks?: {
    optimalPostsMin: number;
    optimalPostsMax: number;
    platformPriority: string[];
    suggestedThemes: string[];
    avgEngagementRate: number;
  };
}

// GET /api/intelligence - List all company intelligences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (companyId) {
      // Get specific company's intelligence
      const intelligence = await prisma.companyIntelligence.findUnique({
        where: { companyId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              website: true
            }
          },
          contentPillars: {
            where: { isActive: true },
            orderBy: { frequencyWeight: 'desc' }
          },
          competitors: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!intelligence) {
        return NextResponse.json(
          { error: 'Intelligence not found for this company' },
          { status: 404 }
        )
      }

      return NextResponse.json(intelligence)
    }

    // List all intelligences
    const intelligences = await prisma.companyIntelligence.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        contentPillars: {
          where: { isActive: true }
        },
        _count: {
          select: {
            contentPillars: true,
            competitors: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(intelligences)
  } catch (error) {
    console.error('Error fetching intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intelligence data' },
      { status: 500 }
    )
  }
}

// POST /api/intelligence - Create company intelligence
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, ...intelligenceData } = body

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      )
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if intelligence already exists
    const existing = await prisma.companyIntelligence.findUnique({
      where: { companyId }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Intelligence already exists for this company. Use PUT to update.' },
        { status: 409 }
      )
    }

    // Get industry benchmark for smart defaults
    let industryDefaults: IndustryDefaults = {}
    if (company.industry) {
      const benchmark = await prisma.industryBenchmark.findUnique({
        where: { industry: company.industry }
      })

      if (benchmark) {
        industryDefaults = {
          postsPerWeek: benchmark.recommendedPostsPerWeek,
          preferredDays: (benchmark.bestDays as string[]) || [],
          preferredTimes: (benchmark.bestTimes as string[]) || [],
          defaultTone: benchmark.recommendedTone,
          humorEnabled: benchmark.humorAppropriate,
          industryHashtags: (benchmark.topHashtags as string[]) || [],
          primaryKeywords: (benchmark.seoKeywords as string[]) || [],
          industryBenchmarks: {
            optimalPostsMin: benchmark.optimalPostsMin,
            optimalPostsMax: benchmark.optimalPostsMax,
            platformPriority: (benchmark.platformPriority as string[]) || [],
            suggestedThemes: (benchmark.suggestedThemes as string[]) || [],
            avgEngagementRate: benchmark.avgEngagementRate
          }
        }
      }
    }

    // Create intelligence with smart defaults
    const intelligence = await prisma.companyIntelligence.create({
      data: {
        companyId,
        // Apply industry defaults first, then override with provided data
        ...industryDefaults,
        ...intelligenceData,
        // Ensure arrays are properly set
        brandPersonality: intelligenceData.brandPersonality || [],
        uniqueSellingPoints: intelligenceData.uniqueSellingPoints || [],
        primaryGoals: intelligenceData.primaryGoals || [],
        primaryKeywords: intelligenceData.primaryKeywords || industryDefaults.primaryKeywords || [],
        industryHashtags: intelligenceData.industryHashtags || industryDefaults.industryHashtags || [],
        brandedHashtags: intelligenceData.brandedHashtags || [],
        preferredDays: intelligenceData.preferredDays || industryDefaults.preferredDays || [],
        humorDays: intelligenceData.humorDays || ['Friday'],
        humorTimes: intelligenceData.humorTimes || ['12:00', '17:00'],
        learnedBestDays: [],
        avoidTopics: intelligenceData.avoidTopics || [],
        competitorGaps: []
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        contentPillars: true,
        competitors: true
      }
    })

    return NextResponse.json(intelligence, { status: 201 })
  } catch (error) {
    console.error('Error creating intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to create intelligence' },
      { status: 500 }
    )
  }
}