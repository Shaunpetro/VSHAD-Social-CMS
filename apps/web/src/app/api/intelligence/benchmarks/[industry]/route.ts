import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ industry: string }>
}

// GET /api/intelligence/benchmarks/[industry] - Get specific industry benchmark
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { industry } = await params
    
    // Decode URL-encoded industry name (e.g., "Technology%20%26%20Software" -> "Technology & Software")
    const decodedIndustry = decodeURIComponent(industry)

    const benchmark = await prisma.industryBenchmark.findUnique({
      where: { industry: decodedIndustry }
    })

    if (!benchmark) {
      // Try case-insensitive search
      const benchmarkCaseInsensitive = await prisma.industryBenchmark.findFirst({
        where: {
          industry: {
            equals: decodedIndustry,
            mode: 'insensitive'
          }
        }
      })

      if (!benchmarkCaseInsensitive) {
        // Return list of available industries
        const availableIndustries = await prisma.industryBenchmark.findMany({
          select: { industry: true },
          orderBy: { industry: 'asc' }
        })

        return NextResponse.json(
          { 
            error: 'Industry benchmark not found',
            searchedFor: decodedIndustry,
            availableIndustries: availableIndustries.map(i => i.industry)
          },
          { status: 404 }
        )
      }

      return NextResponse.json(benchmarkCaseInsensitive)
    }

    return NextResponse.json(benchmark)
  } catch (error) {
    console.error('Error fetching industry benchmark:', error)
    return NextResponse.json(
      { error: 'Failed to fetch industry benchmark' },
      { status: 500 }
    )
  }
}