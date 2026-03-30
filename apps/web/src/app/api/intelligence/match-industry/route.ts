import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const GROQ_API_KEY = process.env.GROQ_API_KEY

// GET /api/intelligence/match-industry?q=bakery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required. Example: /api/intelligence/match-industry?q=bakery' },
        { status: 400 }
      )
    }

    // Get all available industries
    const benchmarks = await prisma.industryBenchmark.findMany({
      select: {
        id: true,
        industry: true,
        recommendedTone: true,
        humorAppropriate: true,
        recommendedPostsPerWeek: true,
        topHashtags: true
      },
      orderBy: { industry: 'asc' }
    })

    const industries = benchmarks.map(b => b.industry)

    // First try exact or partial match (fast, no AI needed)
    const lowerQuery = query.toLowerCase()
    
    // Exact match
    const exactMatch = benchmarks.find(
      b => b.industry.toLowerCase() === lowerQuery
    )
    
    if (exactMatch) {
      const fullBenchmark = await prisma.industryBenchmark.findUnique({
        where: { id: exactMatch.id }
      })
      
      return NextResponse.json({
        query,
        match: {
          matchedIndustry: exactMatch.industry,
          confidence: "exact",
          reasoning: "Exact industry match found",
          alternativeMatch: null,
          customRecommendations: null
        },
        benchmark: fullBenchmark,
        allIndustries: industries
      })
    }

    // Partial match (industry contains query or query contains industry)
    const partialMatch = benchmarks.find(
      b => b.industry.toLowerCase().includes(lowerQuery) ||
           lowerQuery.includes(b.industry.toLowerCase().split(' ')[0])
    )

    if (partialMatch) {
      const fullBenchmark = await prisma.industryBenchmark.findUnique({
        where: { id: partialMatch.id }
      })
      
      return NextResponse.json({
        query,
        match: {
          matchedIndustry: partialMatch.industry,
          confidence: "high",
          reasoning: `"${query}" matches "${partialMatch.industry}" category`,
          alternativeMatch: null,
          customRecommendations: null
        },
        benchmark: fullBenchmark,
        allIndustries: industries
      })
    }

    // Use AI to find best match for non-obvious queries
    if (!GROQ_API_KEY) {
      // Fallback to General Business if no API key
      const fallback = await prisma.industryBenchmark.findUnique({
        where: { industry: "General Business" }
      })
      
      return NextResponse.json({
        query,
        match: {
          matchedIndustry: "General Business",
          confidence: "low",
          reasoning: "No close match found, using general category",
          alternativeMatch: null,
          customRecommendations: {
            suggestedHashtags: ["#SmallBusiness", "#LocalBusiness", `#${query.replace(/\s+/g, '')}`],
            contentTips: ["Share your unique story", "Highlight what makes you different"]
          }
        },
        benchmark: fallback,
        allIndustries: industries
      })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an industry classification expert. Given a business type or industry description, match it to the most appropriate category from the provided list.

Available categories:
${industries.map((ind, i) => `${i + 1}. ${ind}`).join('\n')}

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks, just pure JSON):
{
  "matchedIndustry": "exact industry name from list above",
  "confidence": "high",
  "reasoning": "brief explanation why this is the best match",
  "alternativeMatch": "second best option from the list" or null,
  "customRecommendations": {
    "suggestedHashtags": ["3-5 specific hashtags for their niche"],
    "contentTips": ["2-3 specific content ideas for their business type"]
  }
}`
          },
          {
            role: 'user',
            content: `Find the best industry match for this business: "${query}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const aiResult = await response.json()
    const aiContent = aiResult.choices[0]?.message?.content

    // Parse AI response
    let matchResult
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = aiContent.trim()
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```json?\n?/g, '').replace(/```/g, '')
      }
      
      matchResult = JSON.parse(cleanContent)
      
      // Validate the matched industry exists
      const validMatch = industries.find(
        i => i.toLowerCase() === matchResult.matchedIndustry?.toLowerCase()
      )
      
      if (!validMatch) {
        matchResult.matchedIndustry = "General Business"
        matchResult.confidence = "low"
      } else {
        matchResult.matchedIndustry = validMatch // Use exact casing
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent)
      matchResult = {
        matchedIndustry: "General Business",
        confidence: "low",
        reasoning: "Could not determine best match, using general category",
        alternativeMatch: null,
        customRecommendations: {
          suggestedHashtags: ["#SmallBusiness", "#LocalBusiness", "#Entrepreneur"],
          contentTips: ["Share your unique story", "Highlight customer success"]
        }
      }
    }

    // Get the full benchmark data for the matched industry
    const fullBenchmark = await prisma.industryBenchmark.findUnique({
      where: { industry: matchResult.matchedIndustry }
    })

    return NextResponse.json({
      query,
      match: matchResult,
      benchmark: fullBenchmark,
      allIndustries: industries
    })
  } catch (error) {
    console.error('Industry matching error:', error)
    return NextResponse.json(
      { error: 'Failed to match industry', details: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/intelligence/match-industry - Get all industries list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'list-industries') {
      const industries = await prisma.industryBenchmark.findMany({
        select: {
          id: true,
          industry: true,
          recommendedTone: true,
          humorAppropriate: true,
          avgEngagementRate: true
        },
        orderBy: { industry: 'asc' }
      })

      return NextResponse.json({
        count: industries.length,
        industries
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use { "action": "list-industries" }' },
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