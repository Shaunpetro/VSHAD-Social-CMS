// apps/web/src/lib/intelligence/extractors/website.ts

/**
 * WEBSITE EXTRACTOR
 * Scrapes and extracts text content from company websites
 */

import * as cheerio from 'cheerio';
import type { WebsiteExtractionResult } from './index';

// Pages to attempt to scrape (in priority order)
const PAGES_TO_SCRAPE = [
  '',           // Homepage
  '/about',
  '/about-us',
  '/about-us/',
  '/services',
  '/our-services',
  '/what-we-do',
  '/projects',
  '/portfolio',
  '/contact',
  '/contact-us',
];

// Selectors for content extraction
const CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '.content',
  '.main-content',
  '#content',
  '#main-content',
  '.page-content',
  '.entry-content',
];

// Selectors to exclude (navigation, footer, etc.)
const EXCLUDE_SELECTORS = [
  'nav',
  'header',
  'footer',
  '.nav',
  '.navigation',
  '.menu',
  '.sidebar',
  '.footer',
  '.header',
  'script',
  'style',
  'noscript',
  '.cookie-banner',
  '.popup',
  '.modal',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
];

/**
 * Extracts text content from a single page
 */
async function extractPageContent(url: string): Promise<{
  success: boolean;
  title: string;
  content: string;
  error?: string;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RoboSocialBot/1.0; +https://robosocial.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      return {
        success: false,
        title: '',
        content: '',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove excluded elements
    EXCLUDE_SELECTORS.forEach(selector => {
      $(selector).remove();
    });

    // Get page title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  '';

    // Try to find main content area
    let content = '';
    
    for (const selector of CONTENT_SELECTORS) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text();
    }

    // Clean up the content
    content = cleanText(content);

    return {
      success: true,
      title,
      content,
    };
  } catch (error) {
    return {
      success: false,
      title: '',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cleans extracted text
 */
function cleanText(text: string): string {
  return text
    // Replace multiple whitespace with single space
    .replace(/\s+/g, ' ')
    // Remove common cookie consent text patterns
    .replace(/we use cookies.*?accept/gi, '')
    .replace(/cookie policy.*?privacy/gi, '')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}

/**
 * Extracts metadata from HTML
 */
function extractMetadata($: cheerio.CheerioAPI): WebsiteExtractionResult['metadata'] {
  return {
    title: $('title').text().trim() || undefined,
    description: $('meta[name="description"]').attr('content') || 
                 $('meta[property="og:description"]').attr('content') || 
                 undefined,
    keywords: $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || undefined,
    ogImage: $('meta[property="og:image"]').attr('content') || undefined,
  };
}

/**
 * Normalizes URL for consistent handling
 */
function normalizeUrl(baseUrl: string, path: string): string {
  try {
    // Remove trailing slash from base
    const cleanBase = baseUrl.replace(/\/$/, '');
    
    // Handle path
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${cleanBase}${cleanPath}`;
  } catch {
    return baseUrl;
  }
}

/**
 * Main extraction function
 */
export async function extractFromWebsite(websiteUrl: string): Promise<WebsiteExtractionResult> {
  try {
    // Validate and normalize URL
    let url: URL;
    try {
      url = new URL(websiteUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      // Try adding https:// if not present
      if (!websiteUrl.startsWith('http')) {
        url = new URL(`https://${websiteUrl}`);
      } else {
        return {
          success: false,
          text: '',
          pages: [],
          error: 'Invalid URL format',
        };
      }
    }

    const baseUrl = `${url.protocol}//${url.host}`;
    const pages: WebsiteExtractionResult['pages'] = [];
    const extractedTexts: string[] = [];
    let metadata: WebsiteExtractionResult['metadata'] | undefined;

    // Try to fetch homepage first to get metadata
    try {
      const homepageResponse = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RoboSocialBot/1.0; +https://robosocial.ai)',
        },
        signal: AbortSignal.timeout(15000),
      });
      
      if (homepageResponse.ok) {
        const html = await homepageResponse.text();
        const $ = cheerio.load(html);
        metadata = extractMetadata($);
      }
    } catch {
      // Continue without metadata
    }

    // Extract content from multiple pages
    const pagePromises = PAGES_TO_SCRAPE.map(async (path) => {
      const pageUrl = normalizeUrl(baseUrl, path);
      const result = await extractPageContent(pageUrl);
      
      if (result.success && result.content.length > 100) {
        return {
          url: pageUrl,
          title: result.title,
          content: result.content,
        };
      }
      return null;
    });

    const results = await Promise.all(pagePromises);
    
    // Filter successful extractions and deduplicate by content
    const seenContent = new Set<string>();
    
    for (const result of results) {
      if (result && !seenContent.has(result.content.substring(0, 500))) {
        seenContent.add(result.content.substring(0, 500));
        pages.push(result);
        extractedTexts.push(`--- ${result.title || result.url} ---\n${result.content}`);
      }
    }

    if (pages.length === 0) {
      return {
        success: false,
        text: '',
        pages: [],
        error: 'Could not extract content from any pages',
      };
    }

    // Combine all text
    const combinedText = extractedTexts.join('\n\n');

    // Limit text length to avoid token limits
    const maxLength = 15000;
    const truncatedText = combinedText.length > maxLength 
      ? combinedText.substring(0, maxLength) + '\n\n[Content truncated...]'
      : combinedText;

    return {
      success: true,
      text: truncatedText,
      pages,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      pages: [],
      error: error instanceof Error ? error.message : 'Unknown error during website extraction',
    };
  }
}