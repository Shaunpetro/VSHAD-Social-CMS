import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/intelligence/competitors - List competitors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const intelligenceId = searchParams.get('intelligenceId')
    const companyId = searchParams.get('companyId')

    let whereClause: any = {}

    if (intelligenceId) {
      whereClause.intelligenceId = intelligenceId
    } else if (companyId) {
      const intelligence = await prisma.companyIntelligence.findUnique({
        where: { companyId }
      })
      if (intelligence) {
        whereClause.intelligenceId = intelligence.id
      } else {
        return NextResponse.json([])
      }
    }

    const competitors = await prisma.competitor.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        intelligence: {
          select: {
            companyId: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(competitors)
  } catch (error) {
    console.error('Error fetching competitors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    )
  }
}

// POST /api/intelligence/competitors - Create competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, intelligenceId, ...competitorData } = body

    // Determine intelligenceId
    let targetIntelligenceId = intelligenceId

    if (!targetIntelligenceId && companyId) {
      const intelligence = await prisma.companyIntelligence.findUnique({
        where: { companyId }
      })
      
      if (!intelligence) {
        return NextResponse.json(
          { error: 'Company intelligence not found. Complete onboarding first.' },
          { status: 404 }
        )
      }
      
      targetIntelligenceId = intelligence.id
    }

    if (!targetIntelligenceId) {
      return NextResponse.json(
        { error: 'Either companyId or intelligenceId is required' },
        { status: 400 }
      )
    }

    if (!competitorData.name) {
      return NextResponse.json(
        { error: 'Competitor name is required' },
        { status: 400 }
      )
    }

    const competitor = await prisma.competitor.create({
      data: {
        intelligenceId: targetIntelligenceId,
        name: competitorData.name,
        linkedinUrl: competitorData.linkedinUrl || null,
        facebookUrl: competitorData.facebookUrl || null,
        websiteUrl: competitorData.websiteUrl || null,
        postingFrequency: competitorData.postingFrequency || null,
        avgEngagement: competitorData.avgEngagement || null,
        followerCount: competitorData.followerCount || null,
        topContentTypes: competitorData.topContentTypes || [],
        topHashtags: competitorData.topHashtags || [],
        strengths: competitorData.strengths || [],
        weaknesses: competitorData.weaknesses || []
      },
      include: {
        intelligence: {
          select: {
            companyId: true
          }
        }
      }
    })

    return NextResponse.json(competitor, { status: 201 })
  } catch (error) {
    console.error('Error creating competitor:', error)
    return NextResponse.json(
      { error: 'Failed to create competitor' },
      { status: 500 }
    )
  }
}