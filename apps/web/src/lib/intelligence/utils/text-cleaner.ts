// apps/web/src/lib/intelligence/utils/text-cleaner.ts

/**
 * TEXT CLEANER UTILITY
 * Combines and cleans text from multiple sources for AI analysis
 */

import type { 
    DataSources, 
    CombinedExtractionResult,
    WebsiteExtractionResult,
    LinkedInExtractionResult,
    PDFExtractionResult 
  } from '../extractors';
  import { extractFromWebsite } from '../extractors/website';
  import { extractFromLinkedIn } from '../extractors/linkedin';
  import { extractFromPDFUrl, extractFromPDFBuffer } from '../extractors/pdf';
  
  /**
   * Combines text from multiple sources
   */
  export async function extractAndCombineText(
    sources: DataSources
  ): Promise<CombinedExtractionResult> {
    const sourcesProcessed: string[] = [];
    const sourcesFailed: string[] = [];
    const errors: { source: string; error: string }[] = [];
    const extractions: CombinedExtractionResult['extractions'] = {};
    const textParts: string[] = [];
  
    // Process website
    if (sources.websiteUrl) {
      console.log('[Intelligence] Extracting from website:', sources.websiteUrl);
      const result = await extractFromWebsite(sources.websiteUrl);
      extractions.website = result;
      
      if (result.success && result.text) {
        sourcesProcessed.push('website');
        textParts.push(`=== WEBSITE CONTENT ===\n${result.text}`);
      } else {
        sourcesFailed.push('website');
        if (result.error) {
          errors.push({ source: 'website', error: result.error });
        }
      }
    }
  
    // Process LinkedIn
    if (sources.linkedinUrl) {
      console.log('[Intelligence] Extracting from LinkedIn:', sources.linkedinUrl);
      const result = await extractFromLinkedIn(sources.linkedinUrl);
      extractions.linkedin = result;
      
      if (result.success && result.text) {
        sourcesProcessed.push('linkedin');
        textParts.push(`=== LINKEDIN PROFILE ===\n${result.text}`);
      } else {
        sourcesFailed.push('linkedin');
        if (result.error) {
          errors.push({ source: 'linkedin', error: result.error });
        }
      }
    }
  
    // Process PDF URL
    if (sources.pdfUrl) {
      console.log('[Intelligence] Extracting from PDF URL:', sources.pdfUrl);
      const result = await extractFromPDFUrl(sources.pdfUrl);
      extractions.pdf = result;
      
      if (result.success && result.text) {
        sourcesProcessed.push('pdf');
        textParts.push(`=== COMPANY DOCUMENT (PDF) ===\n${result.text}`);
      } else {
        sourcesFailed.push('pdf');
        if (result.error) {
          errors.push({ source: 'pdf', error: result.error });
        }
      }
    }
  
    // Process PDF file buffer
    if (sources.pdfFile) {
      console.log('[Intelligence] Extracting from PDF buffer');
      const result = await extractFromPDFBuffer(sources.pdfFile);
      extractions.pdf = result;
      
      if (result.success && result.text) {
        if (!sourcesProcessed.includes('pdf')) {
          sourcesProcessed.push('pdf');
        }
        textParts.push(`=== UPLOADED DOCUMENT (PDF) ===\n${result.text}`);
      } else {
        if (!sourcesFailed.includes('pdf')) {
          sourcesFailed.push('pdf');
        }
        if (result.error) {
          errors.push({ source: 'pdf_upload', error: result.error });
        }
      }
    }
  
    // Process manual description
    if (sources.manualDescription && sources.manualDescription.trim()) {
      console.log('[Intelligence] Adding manual description');
      sourcesProcessed.push('manual');
      extractions.manual = sources.manualDescription.trim();
      textParts.push(`=== USER PROVIDED DESCRIPTION ===\n${sources.manualDescription.trim()}`);
    }
  
    // Combine all text
    const combinedText = textParts.join('\n\n');
  
    // Calculate success
    const success = sourcesProcessed.length > 0;
  
    return {
      success,
      combinedText: success ? combinedText : '',
      sourcesProcessed,
      sourcesFailed,
      errors,
      extractions,
    };
  }
  
  /**
   * Calculates data quality score based on sources
   */
  export function calculateDataQuality(
    sourcesProcessed: string[],
    combinedTextLength: number
  ): 'low' | 'medium' | 'high' {
    // More sources = higher quality
    const sourceScore = sourcesProcessed.length;
    
    // Longer text = more data to analyze
    const lengthScore = combinedTextLength > 10000 ? 3 : 
                        combinedTextLength > 5000 ? 2 : 
                        combinedTextLength > 1000 ? 1 : 0;
    
    // Certain sources are more valuable
    const hasWebsite = sourcesProcessed.includes('website');
    const hasPdf = sourcesProcessed.includes('pdf');
    const qualityBonus = (hasWebsite ? 1 : 0) + (hasPdf ? 1 : 0);
    
    const totalScore = sourceScore + lengthScore + qualityBonus;
    
    if (totalScore >= 5) return 'high';
    if (totalScore >= 3) return 'medium';
    return 'low';
  }
  
  /**
   * Truncates text to fit within token limits
   */
  export function truncateForAnalysis(text: string, maxLength: number = 25000): string {
    if (text.length <= maxLength) return text;
    
    // Try to truncate at a natural break point
    const truncated = text.substring(0, maxLength);
    const lastBreak = Math.max(
      truncated.lastIndexOf('\n\n'),
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf('.\n')
    );
    
    if (lastBreak > maxLength * 0.8) {
      return truncated.substring(0, lastBreak) + '\n\n[Content truncated for analysis...]';
    }
    
    return truncated + '\n\n[Content truncated for analysis...]';
  }