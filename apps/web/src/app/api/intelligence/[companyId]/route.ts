import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

// GET /api/intelligence/[companyId] - Get specific company intelligence
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { companyId } = await params

    const intelligence = await prisma.companyIntelligence.findUnique({
      where: { companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            description: true
          }
        },
        contentPillars: {
          orderBy: { frequencyWeight: 'desc' }
        },
        competitors: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!intelligence) {
      // Return empty state with company info if no intelligence exists yet
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          industry: true,
          website: true,
          description: true
        }
      })

      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        )
      }

      // Get industry benchmark for recommendations
      let benchmark = null
      if (company.industry) {
        benchmark = await prisma.industryBenchmark.findUnique({
          where: { industry: company.industry }
        })
      }

      return NextResponse.json({
        exists: false,
        company,
        industryBenchmark: benchmark,
        message: 'No intelligence configured yet. Complete onboarding to set up.'
      })
    }

    return NextResponse.json({
      exists: true,
      ...intelligence
    })
  } catch (error) {
    console.error('Error fetching company intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intelligence' },
      { status: 500 }
    )
  }
}

// PUT /api/intelligence/[companyId] - Update company intelligence
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { companyId } = await params
    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    const { id, company, contentPillars, competitors, createdAt, ...updateData } = body

    const intelligence = await prisma.companyIntelligence.findUnique({
      where: { companyId }
    })

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Intelligence not found. Create it first with POST /api/intelligence' },
        { status: 404 }
      )
    }

    const updated = await prisma.companyIntelligence.update({
      where: { companyId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        contentPillars: {
          where: { isActive: true },
          orderBy: { frequencyWeight: 'desc' }
        },
        competitors: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to update intelligence' },
      { status: 500 }
    )
  }
}

// DELETE /api/intelligence/[companyId] - Delete company intelligence
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { companyId } = await params

    const intelligence = await prisma.companyIntelligence.findUnique({
      where: { companyId }
    })

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Intelligence not found' },
        { status: 404 }
      )
    }

    // Delete related records first (cascading)
    await prisma.contentPillar.deleteMany({
      where: { intelligenceId: intelligence.id }
    })

    await prisma.competitor.deleteMany({
      where: { intelligenceId: intelligence.id }
    })

    await prisma.companyIntelligence.delete({
      where: { companyId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Intelligence and related data deleted' 
    })
  } catch (error) {
    console.error('Error deleting intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to delete intelligence' },
      { status: 500 }
    )
  }
}