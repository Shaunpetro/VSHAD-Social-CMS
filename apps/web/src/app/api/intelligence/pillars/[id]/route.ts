import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/intelligence/pillars/[id] - Get specific pillar
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const pillar = await prisma.contentPillar.findUnique({
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

    if (!pillar) {
      return NextResponse.json(
        { error: 'Content pillar not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(pillar)
  } catch (error) {
    console.error('Error fetching pillar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content pillar' },
      { status: 500 }
    )
  }
}

// PUT /api/intelligence/pillars/[id] - Update pillar
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const { intelligence, createdAt, ...updateData } = body

    const pillar = await prisma.contentPillar.findUnique({
      where: { id }
    })

    if (!pillar) {
      return NextResponse.json(
        { error: 'Content pillar not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.contentPillar.update({
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
    console.error('Error updating pillar:', error)
    return NextResponse.json(
      { error: 'Failed to update content pillar' },
      { status: 500 }
    )
  }
}

// DELETE /api/intelligence/pillars/[id] - Delete pillar
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const pillar = await prisma.contentPillar.findUnique({
      where: { id }
    })

    if (!pillar) {
      return NextResponse.json(
        { error: 'Content pillar not found' },
        { status: 404 }
      )
    }

    await prisma.contentPillar.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Content pillar deleted' 
    })
  } catch (error) {
    console.error('Error deleting pillar:', error)
    return NextResponse.json(
      { error: 'Failed to delete content pillar' },
      { status: 500 }
    )
  }
}