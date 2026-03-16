import { NextRequest, NextResponse } from 'next/server';

interface ScrapeResult {
  name: string;
  description: string;
  industry: string;
  keywords: string[];
  logo: string;
}

// Extract domain name and format as company name (fallback)
function domainToName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.replace(/^www\./, '').split('.');
    const commonSecondLevel = ['co', 'com', 'org', 'net', 'ac', 'gov'];
    let nameParts = parts.slice(0, -1);
    if (parts.length >= 3 && commonSecondLevel.includes(parts[parts.length - 2])) {
      nameParts = parts.slice(0, -2);
    }
    return nameParts
      .join(' ')
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return '';
  }
}

// Detect industry from text content
function detectIndustry(text: string): string {
  const lower = text.toLowerCase();

  const industryKeywords: Record<string, string[]> = {
    'Technology': ['software', 'tech', 'digital', 'saas', 'app', 'platform', 'cloud', 'data', 'ai', 'machine learning'],
    'Engineering': ['engineering', 'construction', 'building', 'civil', 'mechanical', 'electrical', 'structural', 'contractor'],
    'Healthcare': ['health', 'medical', 'hospital', 'clinic', 'pharma', 'wellness', 'care'],
    'Finance': ['finance', 'banking', 'investment', 'insurance', 'fintech', 'trading', 'capital'],
    'Education': ['education', 'learning', 'school', 'university', 'training', 'course', 'academy'],
    'E-Commerce': ['shop', 'store', 'ecommerce', 'e-commerce', 'retail', 'buy', 'marketplace'],
    'Marketing': ['marketing', 'advertising', 'agency', 'brand', 'creative', 'media', 'pr'],
    'Real Estate': ['real estate', 'property', 'properties', 'realty', 'housing', 'rental'],
    'Food & Beverage': ['restaurant', 'food', 'catering', 'cafe', 'beverage', 'dining'],
    'Manufacturing': ['manufacturing', 'factory', 'production', 'industrial', 'fabrication'],
    'Consulting': ['consulting', 'consultancy', 'advisory', 'strategy', 'management consulting'],
    'Legal': ['law', 'legal', 'attorney', 'lawyer', 'advocate', 'litigation'],
    'Transportation': ['transport', 'logistics', 'shipping', 'freight', 'delivery', 'fleet'],
    'Energy': ['energy', 'solar', 'power', 'renewable', 'electricity', 'mining', 'oil', 'gas'],
  };

  let bestIndustry = '';
  let bestScore = 0;

  for (const [industry, words] of Object.entries(industryKeywords)) {
    const score = words.filter((word) => lower.includes(word)).length;
    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
    }
  }

  return bestScore >= 2 ? bestIndustry : '';
}

// Extract keywords from text content
function extractKeywords(text: string, maxKeywords: number = 15): string[] {
  const lower = text.toLowerCase();

  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'them',
    'than', 'its', 'over', 'such', 'that', 'this', 'with', 'will', 'each',
    'from', 'they', 'were', 'which', 'their', 'what', 'there', 'when', 'your',
    'about', 'would', 'make', 'like', 'just', 'into', 'could', 'time', 'very',
    'more', 'also', 'come', 'made', 'after', 'many', 'then', 'them', 'these',
    'other', 'only', 'most', 'where', 'being', 'those', 'much', 'should',
    'here', 'home', 'page', 'site', 'website', 'click', 'read', 'learn',
    'contact', 'menu', 'navigation', 'footer', 'header', 'copyright',
  ]);

  const words = lower
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  return Object.entries(freq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// POST /api/scrape — scrape a website URL using Firecrawl REST API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize URL
    const normalizedUrl = url.trim().startsWith('http')
      ? url.trim()
      : `https://${url.trim()}`;

    const fallbackName = domainToName(normalizedUrl);

    // Check for Firecrawl API key
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey || apiKey === 'fc-your-key') {
      return NextResponse.json({
        success: true,
        data: {
          name: fallbackName,
          description: '',
          industry: '',
          keywords: [],
          logo: '',
        },
        source: 'domain',
        message: 'Firecrawl API key not configured — using domain analysis only',
      });
    }

    // Call Firecrawl REST API directly
    const firecrawlRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: normalizedUrl,
        formats: ['markdown', 'html'],
      }),
    });

    if (!firecrawlRes.ok) {
      const errData = await firecrawlRes.json().catch(() => ({}));
      const errMsg = (errData as { error?: string }).error || `Firecrawl returned ${firecrawlRes.status}`;
      throw new Error(errMsg);
    }

    const firecrawlData = await firecrawlRes.json();

    // Firecrawl response structure: { success, data: { markdown, html, metadata } }
    const pageData = (firecrawlData as {
      success: boolean;
      data?: {
        markdown?: string;
        html?: string;
        metadata?: Record<string, string>;
      };
    }).data || {};

    const metadata = pageData.metadata || {};
    const markdown = pageData.markdown || '';

    // Build result
    const result: ScrapeResult = {
      name: '',
      description: '',
      industry: '',
      keywords: [],
      logo: '',
    };

    // Name: from OG title, title tag, or domain
    const ogTitle = metadata.ogTitle || metadata['og:title'] || '';
    const pageTitle = metadata.title || '';

    if (ogTitle) {
      result.name = ogTitle.split(/\s*[|–—-]\s*/)[0].trim();
    } else if (pageTitle) {
      result.name = pageTitle.split(/\s*[|–—-]\s*/)[0].trim();
    }
    if (!result.name) {
      result.name = fallbackName;
    }

    // Description: from OG description or meta description
    const ogDesc = metadata.ogDescription || metadata['og:description'] || '';
    const metaDesc = metadata.description || '';

    result.description = ogDesc || metaDesc;

    // Logo: from OG image
    const ogImage = metadata.ogImage || metadata['og:image'] || '';
    if (ogImage) {
      // Make relative URLs absolute
      if (ogImage.startsWith('/')) {
        try {
          const base = new URL(normalizedUrl);
          result.logo = `${base.protocol}//${base.host}${ogImage}`;
        } catch {
          result.logo = ogImage;
        }
      } else {
        result.logo = ogImage;
      }
    }

    // Industry: detect from full content
    const fullText = `${result.name} ${result.description} ${markdown}`;
    result.industry = detectIndustry(fullText);

    // Keywords: from meta keywords or extracted from content
    const metaKeywords = metadata.keywords || '';
    if (metaKeywords) {
      result.keywords = metaKeywords
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 1 && k.length < 50)
        .slice(0, 20);
    }

    // If no meta keywords, extract from markdown content
    if (result.keywords.length === 0 && markdown) {
      result.keywords = extractKeywords(markdown);
    }

    return NextResponse.json({
      success: true,
      data: result,
      source: 'firecrawl',
    });
  } catch (error) {
    console.error('Scrape failed:', error);

    const message = error instanceof Error ? error.message : 'Failed to scrape website';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}