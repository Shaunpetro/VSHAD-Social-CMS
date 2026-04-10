// apps/web/src/app/api/intelligence/suggest-industry/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

// Synonym mapping for common terms to industry categories
const INDUSTRY_SYNONYMS: Record<string, string[]> = {
  'Technology & Software': [
    'tech', 'software', 'saas', 'app', 'startup', 'it', 'computer', 'digital', 
    'ai', 'artificial intelligence', 'machine learning', 'cloud', 'cyber', 
    'data', 'analytics', 'automation', 'iot', 'blockchain', 'fintech'
  ],
  'Healthcare & Medical': [
    'health', 'medical', 'hospital', 'clinic', 'doctor', 'nurse', 'pharma',
    'pharmaceutical', 'biotech', 'wellness', 'therapy', 'dental', 'mental health',
    'fitness', 'nutrition', 'telehealth', 'healthcare'
  ],
  'Finance & Banking': [
    'finance', 'bank', 'banking', 'investment', 'insurance', 'accounting',
    'tax', 'wealth', 'trading', 'crypto', 'cryptocurrency', 'mortgage', 'loan',
    'credit', 'fintech', 'payment', 'financial'
  ],
  'E-commerce & Retail': [
    'ecommerce', 'e-commerce', 'retail', 'shop', 'store', 'mall', 'fashion',
    'clothing', 'apparel', 'jewelry', 'beauty', 'cosmetics', 'grocery',
    'marketplace', 'online store', 'dropshipping'
  ],
  'Education & Training': [
    'education', 'school', 'university', 'college', 'training', 'learning',
    'edtech', 'tutoring', 'course', 'academy', 'institute', 'certification',
    'e-learning', 'online learning', 'teaching'
  ],
  'Marketing & Advertising': [
    'marketing', 'advertising', 'ad', 'agency', 'branding', 'pr', 'public relations',
    'social media', 'seo', 'content', 'creative', 'media', 'digital marketing'
  ],
  'Real Estate & Property': [
    'real estate', 'property', 'housing', 'apartment', 'rental', 'commercial',
    'residential', 'construction', 'architecture', 'interior design', 'realty',
    'broker', 'agent', 'mortgage'
  ],
  'Food & Beverage': [
    'food', 'restaurant', 'cafe', 'coffee', 'catering', 'bakery', 'beverage',
    'drink', 'bar', 'brewery', 'wine', 'organic', 'vegan', 'fast food',
    'delivery', 'kitchen', 'chef', 'culinary'
  ],
  'Sports & Recreation': [
    'sport', 'sports', 'soccer', 'football', 'basketball', 'tennis', 'golf',
    'fitness', 'gym', 'athletics', 'recreation', 'outdoor', 'adventure',
    'gaming', 'esports', 'yoga', 'martial arts', 'swimming', 'running'
  ],
  'Entertainment & Media': [
    'entertainment', 'media', 'music', 'film', 'movie', 'video', 'streaming',
    'podcast', 'gaming', 'game', 'art', 'artist', 'creative', 'production',
    'studio', 'theater', 'events', 'concert'
  ],
  'Travel & Hospitality': [
    'travel', 'hotel', 'hospitality', 'tourism', 'vacation', 'airline',
    'booking', 'resort', 'accommodation', 'adventure', 'tour', 'cruise',
    'airbnb', 'destination', 'lodge'
  ],
  'Manufacturing & Industrial': [
    'manufacturing', 'industrial', 'factory', 'production', 'machinery',
    'equipment', 'automotive', 'car', 'vehicle', 'aerospace', 'engineering',
    'chemical', 'textile', 'steel', 'metal'
  ],
  'Legal & Professional Services': [
    'legal', 'law', 'lawyer', 'attorney', 'consulting', 'consultant',
    'advisory', 'professional', 'firm', 'practice', 'litigation', 'corporate law'
  ],
  'Non-Profit & NGO': [
    'nonprofit', 'non-profit', 'ngo', 'charity', 'foundation', 'volunteer',
    'social', 'cause', 'donation', 'humanitarian', 'community', 'advocacy'
  ],
  'Agriculture & Farming': [
    'agriculture', 'farm', 'farming', 'agri', 'crop', 'livestock', 'organic',
    'sustainable', 'food production', 'horticulture', 'dairy', 'poultry'
  ],
  'Energy & Utilities': [
    'energy', 'power', 'electricity', 'solar', 'renewable', 'oil', 'gas',
    'utility', 'utilities', 'green energy', 'wind', 'nuclear', 'sustainable'
  ],
  'Logistics & Transportation': [
    'logistics', 'transport', 'transportation', 'shipping', 'delivery',
    'freight', 'supply chain', 'warehouse', 'trucking', 'courier', 'fleet'
  ],
  'Beauty & Personal Care': [
    'beauty', 'salon', 'spa', 'skincare', 'haircare', 'cosmetics', 'makeup',
    'nail', 'barber', 'grooming', 'personal care', 'aesthetic'
  ],
  'Automotive': [
    'auto', 'automotive', 'car', 'vehicle', 'dealership', 'mechanic',
    'repair', 'parts', 'motor', 'truck', 'motorcycle', 'ev', 'electric vehicle'
  ],
  'Telecommunications': [
    'telecom', 'telecommunications', 'mobile', 'wireless', 'network',
    'internet', 'broadband', 'cellular', 'phone', '5g', 'connectivity'
  ]
}

// Find matching industry from synonyms
function findIndustryFromSynonyms(query: string): string | null {
  const lowerQuery = query.toLowerCase().trim()
  
  for (const [industry, synonyms] of Object.entries(INDUSTRY_SYNONYMS)) {
    // Check exact industry name match
    if (industry.toLowerCase().includes(lowerQuery) || lowerQuery.includes(industry.toLowerCase())) {
      return industry
    }
    
    // Check synonyms
    for (const synonym of synonyms) {
      if (lowerQuery.includes(synonym) || synonym.includes(lowerQuery)) {
        return industry
      }
    }
  }
  
  return null
}

// Fuzzy search with scoring
function fuzzySearchIndustries(query: string, industries: string[]): Array<{ industry: string; score: number }> {
  const lowerQuery = query.toLowerCase().trim()
  const results: Array<{ industry: string; score: number }> = []
  
  for (const industry of industries) {
    const lowerIndustry = industry.toLowerCase()
    let score = 0
    
    // Exact match
    if (lowerIndustry === lowerQuery) {
      score = 100
    }
    // Starts with query
    else if (lowerIndustry.startsWith(lowerQuery)) {
      score = 80
    }
    // Contains query
    else if (lowerIndustry.includes(lowerQuery)) {
      score = 60
    }
    // Query contains industry word
    else if (lowerQuery.includes(lowerIndustry.split(' ')[0].toLowerCase())) {
      score = 40
    }
    // Check synonym match
    else {
      const synonymMatch = findIndustryFromSynonyms(lowerQuery)
      if (synonymMatch === industry) {
        score = 70
      }
    }
    
    if (score > 0) {
      results.push({ industry, score })
    }
  }
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score)
}

export async function POST(request: NextRequest) {
  try {
    const { companyName, companyDescription, userQuery } = await request.json()
    
    // Get all industries from database
    const industryBenchmarks = await prisma.industryBenchmark.findMany({
      select: { industry: true },
      orderBy: { industry: 'asc' }
    })
    
    const availableIndustries = industryBenchmarks.map(i => i.industry)
    
    // If user typed a query, try fuzzy match first
    if (userQuery) {
      // Check synonym mapping first
      const synonymMatch = findIndustryFromSynonyms(userQuery)
      if (synonymMatch && availableIndustries.includes(synonymMatch)) {
        return NextResponse.json({
          suggestedIndustry: synonymMatch,
          confidence: 0.9,
          reason: `"${userQuery}" is commonly associated with ${synonymMatch}`,
          alternatives: fuzzySearchIndustries(userQuery, availableIndustries)
            .filter(r => r.industry !== synonymMatch)
            .slice(0, 3)
            .map(r => r.industry),
          source: 'synonym'
        })
      }
      
      // Try fuzzy search
      const fuzzyResults = fuzzySearchIndustries(userQuery, availableIndustries)
      if (fuzzyResults.length > 0 && fuzzyResults[0].score >= 40) {
        return NextResponse.json({
          suggestedIndustry: fuzzyResults[0].industry,
          confidence: fuzzyResults[0].score / 100,
          reason: `Best match for "${userQuery}"`,
          alternatives: fuzzyResults.slice(1, 4).map(r => r.industry),
          source: 'fuzzy'
        })
      }
    }
    
    // If no match found or need AI suggestion based on company info
    if (companyName || companyDescription) {
      const prompt = `You are an industry classification expert. Based on the company information provided, determine the SINGLE best matching industry from the available list.

Company Name: ${companyName || 'Not provided'}
Company Description: ${companyDescription || 'Not provided'}
${userQuery ? `User's industry input: ${userQuery}` : ''}

Available Industries (you MUST choose from this list):
${availableIndustries.map((ind, i) => `${i + 1}. ${ind}`).join('\n')}

Respond in JSON format only:
{
  "suggestedIndustry": "Exact industry name from the list above",
  "confidence": 0.0 to 1.0,
  "reason": "Brief explanation why this industry fits",
  "alternatives": ["Second best match", "Third best match"]
}

IMPORTANT: 
- The suggestedIndustry MUST exactly match one from the Available Industries list
- If the company doesn't clearly fit any industry, choose the closest match
- alternatives should also be from the Available Industries list`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 500
      })

      const responseText = completion.choices[0]?.message?.content || ''
      
      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        // Validate that suggested industry exists in our list
        if (availableIndustries.includes(parsed.suggestedIndustry)) {
          return NextResponse.json({
            ...parsed,
            source: 'ai'
          })
        }
        
        // If AI returned invalid industry, find closest match
        const closest = fuzzySearchIndustries(parsed.suggestedIndustry, availableIndustries)
        if (closest.length > 0) {
          return NextResponse.json({
            suggestedIndustry: closest[0].industry,
            confidence: parsed.confidence * 0.8,
            reason: parsed.reason,
            alternatives: closest.slice(1, 4).map(r => r.industry),
            source: 'ai_corrected'
          })
        }
      }
    }
    
    // Fallback: return no suggestion
    return NextResponse.json({
      suggestedIndustry: null,
      confidence: 0,
      reason: 'Could not determine industry. Please select from the list.',
      alternatives: availableIndustries.slice(0, 5),
      source: 'none'
    })
    
  } catch (error) {
    console.error('Industry suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to suggest industry' },
      { status: 500 }
    )
  }
}

// GET endpoint for fuzzy search while typing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }
    
    // Get all industries
    const industryBenchmarks = await prisma.industryBenchmark.findMany({
      select: { industry: true },
      orderBy: { industry: 'asc' }
    })
    
    const availableIndustries = industryBenchmarks.map(i => i.industry)
    
    // Check synonym first
    const synonymMatch = findIndustryFromSynonyms(query)
    
    // Get fuzzy results
    const fuzzyResults = fuzzySearchIndustries(query, availableIndustries)
    
    // If synonym found and not already in top results, add it
    if (synonymMatch && !fuzzyResults.find(r => r.industry === synonymMatch)) {
      fuzzyResults.unshift({ industry: synonymMatch, score: 75 })
    }
    
    return NextResponse.json({
      results: fuzzyResults.slice(0, 8).map(r => ({
        industry: r.industry,
        score: r.score,
        isSynonymMatch: r.industry === synonymMatch
      })),
      synonymMatch
    })
    
  } catch (error) {
    console.error('Industry search error:', error)
    return NextResponse.json({ results: [] })
  }
}