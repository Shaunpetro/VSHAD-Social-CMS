// apps/web/src/lib/intelligence/extractors/pdf.ts

/**
 * PDF EXTRACTOR
 * Extracts text content from PDF documents (company profiles, brochures, etc.)
 */

import type { PDFExtractionResult } from './index';

// Dynamic import for pdf-parse (CommonJS module)
let pdfParse: ((buffer: Buffer) => Promise<{
  text: string;
  numpages: number;
  info?: {
    Title?: string;
    Author?: string;
    CreationDate?: string;
  };
}>) | null = null;

async function getPdfParser() {
  if (!pdfParse) {
    // @ts-expect-error - pdf-parse is a CommonJS module
    const pdfModule = await import('pdf-parse');
    pdfParse = pdfModule.default || pdfModule;
  }
  return pdfParse;
}

/**
 * Extracts text from a PDF buffer
 */
export async function extractFromPDFBuffer(buffer: Buffer): Promise<PDFExtractionResult> {
  try {
    const parser = await getPdfParser();
    
    if (!parser) {
      return {
        success: false,
        text: '',
        error: 'PDF parser not available',
      };
    }

    const data = await parser(buffer);

    // Clean the extracted text
    const cleanedText = cleanPDFText(data.text);

    // Limit text length
    const maxLength = 20000;
    const truncatedText = cleanedText.length > maxLength
      ? cleanedText.substring(0, maxLength) + '\n\n[Content truncated...]'
      : cleanedText;

    return {
      success: true,
      text: truncatedText,
      pageCount: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        creationDate: data.info?.CreationDate,
      },
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
    };
  }
}

/**
 * Extracts text from a PDF URL
 */
export async function extractFromPDFUrl(url: string): Promise<PDFExtractionResult> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        success: false,
        text: '',
        error: 'Invalid URL protocol',
      };
    }

    // Fetch the PDF
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RoboSocialBot/1.0)',
        'Accept': 'application/pdf,*/*',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout for large PDFs
    });

    if (!response.ok) {
      return {
        success: false,
        text: '',
        error: `Failed to fetch PDF: HTTP ${response.status}`,
      };
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      return {
        success: false,
        text: '',
        error: `Invalid content type: ${contentType}. Expected PDF.`,
      };
    }

    // Get PDF as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check file size (limit to 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return {
        success: false,
        text: '',
        error: 'PDF file too large (max 10MB)',
      };
    }

    // Extract text
    return await extractFromPDFBuffer(buffer);
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to extract from PDF URL',
    };
  }
}

/**
 * Cleans PDF extracted text
 */
function cleanPDFText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Fix common PDF extraction issues
    .replace(/([a-z])([A-Z])/g, '\$1 \$2') // Add space between camelCase from bad extraction
    .replace(/(\.)([A-Z])/g, '\$1 \$2')    // Add space after periods
    // Remove page numbers and headers/footers patterns
    .replace(/Page \d+ of \d+/gi, '')
    .replace(/^\d+\s*$/gm, '')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}