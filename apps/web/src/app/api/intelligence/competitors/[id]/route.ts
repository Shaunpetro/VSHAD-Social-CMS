import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/intelligence/competitors/[id] - Get specific competitor
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: {
        intelligence: {
          select: {
            companyId: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Error fetching competitor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitor' },
      { status: 500 }
    )
  }
}

// PUT /api/intelligence/competitors/[id] - Update competitor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const { intelligence, createdAt, ...updateData } = body

    const competitor = await prisma.competitor.findUnique({
      where: { id }
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.competitor.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        intelligence: {
          select: {
            companyId: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating competitor:', error)
    return NextResponse.json(
      { error: 'Failed to update competitor' },
      { status: 500 }
    )
  }
}

// DELETE /api/intelligence/competitors/[id] - Delete competitor
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const competitor = await prisma.competitor.findUnique({
      where: { id }
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    await prisma.competitor.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Competitor deleted' 
    })
  } catch (error) {
    console.error('Error deleting competitor:', error)
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    )
  }
}