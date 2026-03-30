import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/intelligence/pillars - List pillars (optionally filtered by intelligenceId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const intelligenceId = searchParams.get('intelligenceId')
    const companyId = searchParams.get('companyId')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

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

    if (activeOnly) {
      whereClause.isActive = true
    }

    const pillars = await prisma.contentPillar.findMany({
      where: whereClause,
      orderBy: [
        { frequencyWeight: 'desc' },
        { name: 'asc' }
      ],
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

    return NextResponse.json(pillars)
  } catch (error) {
    console.error('Error fetching pillars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content pillars' },
      { status: 500 }
    )
  }
}

// POST /api/intelligence/pillars - Create a content pillar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, intelligenceId, ...pillarData } = body

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

    if (!pillarData.name) {
      return NextResponse.json(
        { error: 'Pillar name is required' },
        { status: 400 }
      )
    }

    const pillar = await prisma.contentPillar.create({
      data: {
        intelligenceId: targetIntelligenceId,
        name: pillarData.name,
        description: pillarData.description || null,
        topics: pillarData.topics || [],
        keywords: pillarData.keywords || [],
        contentTypes: pillarData.contentTypes || ['educational', 'thought_leadership'],
        frequencyWeight: pillarData.frequencyWeight || 1.0,
        preferredDays: pillarData.preferredDays || [],
        isActive: pillarData.isActive !== false
      },
      include: {
        intelligence: {
          select: {
            companyId: true
          }
        }
      }
    })

    return NextResponse.json(pillar, { status: 201 })
  } catch (error) {
    console.error('Error creating pillar:', error)
    return NextResponse.json(
      { error: 'Failed to create content pillar' },
      { status: 500 }
    )
  }
}