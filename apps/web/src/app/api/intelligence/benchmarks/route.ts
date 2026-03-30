import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/intelligence/benchmarks - List all industry benchmarks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let whereClause: any = {}

    if (search) {
      whereClause.industry = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const benchmarks = await prisma.industryBenchmark.findMany({
      where: whereClause,
      orderBy: { industry: 'asc' },
      select: {
        id: true,
        industry: true,
        recommendedPostsPerWeek: true,
        optimalPostsMin: true,
        optimalPostsMax: true,
        bestDays: true,
        bestTimes: true,
        platformPriority: true,
        recommendedTone: true,
        humorAppropriate: true,
        avgEngagementRate: true,
        topHashtags: true,
        lastUpdated: true
      }
    })

    return NextResponse.json(benchmarks)
  } catch (error) {
    console.error('Error fetching benchmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch industry benchmarks' },
      { status: 500 }
    )
  }
}

// GET industries list (for dropdowns)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'list-industries') {
      const industries = await prisma.industryBenchmark.findMany({
        select: {
          industry: true
        },
        orderBy: { industry: 'asc' }
      })

      return NextResponse.json(industries.map(i => i.industry))
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}