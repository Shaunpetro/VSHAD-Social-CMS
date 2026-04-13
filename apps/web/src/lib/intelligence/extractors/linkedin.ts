// apps/web/src/lib/intelligence/extractors/linkedin.ts

/**
 * LINKEDIN EXTRACTOR
 * Extracts company information from LinkedIn company pages
 * 
 * NOTE: LinkedIn heavily restricts scraping. This extractor:
 * 1. Attempts basic meta tag extraction
 * 2. Falls back to URL parsing for company name
 * 3. Returns partial data that can be supplemented by user
 * 
 * For production use, consider LinkedIn's official Company API
 */

import * as cheerio from 'cheerio';
import type { LinkedInExtractionResult } from './index';

/**
 * Extracts company slug from LinkedIn URL
 */
function extractCompanySlug(url: string): string | null {
  try {
    const patterns = [
      /linkedin\.com\/company\/([^\/\?]+)/i,
      /linkedin\.com\/company\/([^\/\?]+)\//i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Attempts to extract company info from LinkedIn page
 */
export async function extractFromLinkedIn(linkedinUrl: string): Promise<LinkedInExtractionResult> {
  try {
    // Validate URL
    if (!linkedinUrl.includes('linkedin.com/company')) {
      return {
        success: false,
        text: '',
        error: 'Invalid LinkedIn company URL. Expected format: linkedin.com/company/company-name',
      };
    }

    // Extract company slug
    const companySlug = extractCompanySlug(linkedinUrl);
    
    if (!companySlug) {
      return {
        success: false,
        text: '',
        error: 'Could not extract company identifier from URL',
      };
    }

    // Attempt to fetch the page
    // Note: LinkedIn may block this request - we handle gracefully
    let pageContent = '';
    let structured: LinkedInExtractionResult['structured'] = {
      name: formatCompanyName(companySlug),
    };

    try {
      const response = await fetch(linkedinUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        // Try to extract meta tags (often available even without login)
        const ogTitle = $('meta[property="og:title"]').attr('content');
        const ogDescription = $('meta[property="og:description"]').attr('content');
        const description = $('meta[name="description"]').attr('content');

        if (ogTitle) {
          structured.name = ogTitle.replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
        }

        if (ogDescription || description) {
          structured.description = ogDescription || description;
          pageContent = structured.description || '';
        }

        // Try to extract JSON-LD data if available
        const jsonLd = $('script[type="application/ld+json"]').html();
        if (jsonLd) {
          try {
            const data = JSON.parse(jsonLd);
            if (data['@type'] === 'Organization' || data['@type'] === 'Corporation') {
              structured.name = data.name || structured.name;
              structured.description = data.description || structured.description;
              structured.industry = data.industry;
              structured.headquarters = data.address?.addressLocality;
              structured.website = data.url;
              
              if (data.description) {
                pageContent = data.description;
              }
            }
          } catch {
            // JSON-LD parsing failed, continue with what we have
          }
        }
      }
    } catch {
      // Fetch failed - this is common with LinkedIn
      // We still return partial data based on URL
    }

    // Build text content from what we extracted
    const textParts: string[] = [];
    
    if (structured.name) {
      textParts.push(`Company: ${structured.name}`);
    }
    if (structured.description) {
      textParts.push(`Description: ${structured.description}`);
    }
    if (structured.industry) {
      textParts.push(`Industry: ${structured.industry}`);
    }
    if (structured.specialties && structured.specialties.length > 0) {
      textParts.push(`Specialties: ${structured.specialties.join(', ')}`);
    }
    if (structured.headquarters) {
      textParts.push(`Headquarters: ${structured.headquarters}`);
    }
    if (structured.size) {
      textParts.push(`Company Size: ${structured.size}`);
    }

    const text = textParts.length > 0 
      ? textParts.join('\n') 
      : `LinkedIn Company: ${companySlug}`;

    return {
      success: true,
      text,
      structured,
      metadata: {
        source: 'linkedin',
        slug: companySlug,
        note: pageContent ? 'Extracted from public page' : 'Limited data - LinkedIn restricts scraping',
      },
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to extract from LinkedIn',
    };
  }
}

/**
 * Formats company slug into readable name
 * e.g., "acme-solutions-pty-ltd" -> "Acme Solutions Pty Ltd"
 */
function formatCompanyName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}