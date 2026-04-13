// apps/web/src/lib/intelligence/extractors/index.ts

/**
 * INTELLIGENCE EXTRACTORS
 * Interfaces and types for multi-source data extraction
 */

// ============================================
// EXTRACTION RESULT TYPES
// ============================================

export interface ExtractionResult {
    success: boolean;
    text: string;
    error?: string;
    metadata?: Record<string, unknown>;
  }
  
  export interface WebsiteExtractionResult extends ExtractionResult {
    pages: {
      url: string;
      title: string;
      content: string;
    }[];
    metadata?: {
      title?: string;
      description?: string;
      keywords?: string[];
      ogImage?: string;
    };
  }
  
  export interface LinkedInExtractionResult extends ExtractionResult {
    structured?: {
      name?: string;
      description?: string;
      industry?: string;
      size?: string;
      specialties?: string[];
      headquarters?: string;
      founded?: string;
      website?: string;
    };
  }
  
  export interface PDFExtractionResult extends ExtractionResult {
    pageCount?: number;
    metadata?: {
      title?: string;
      author?: string;
      creationDate?: string;
    };
  }
  
  // ============================================
  // DATA SOURCE TYPES
  // ============================================
  
  export interface DataSources {
    websiteUrl?: string;
    linkedinUrl?: string;
    pdfUrl?: string;
    pdfFile?: Buffer;
    manualDescription?: string;
  }
  
  export interface CombinedExtractionResult {
    success: boolean;
    combinedText: string;
    sourcesProcessed: string[];
    sourcesFailed: string[];
    errors: { source: string; error: string }[];
    extractions: {
      website?: WebsiteExtractionResult;
      linkedin?: LinkedInExtractionResult;
      pdf?: PDFExtractionResult;
      manual?: string;
    };
  }
  
  // ============================================
  // ANALYSIS TYPES
  // ============================================
  
  export interface ExtractedIndustry {
    code: string;          // e.g., "CONST_CE"
    name: string;          // e.g., "Civil Engineering"
    category: string;      // e.g., "Construction"
    confidence: number;    // 0-1
    cidbCode?: string;     // e.g., "CE"
    cidbGrade?: number;    // 1-9
  }
  
  export interface ExtractedService {
    name: string;
    description?: string;
    keywords: string[];
    isCore: boolean;
    relatedIndustry?: string;
  }
  
  export interface ExtractedUSP {
    point: string;
    category: 'certification' | 'experience' | 'capability' | 'location' | 'price' | 'quality' | 'other';
    evidence?: string;
  }
  
  export interface ExtractedAudience {
    businessType: 'B2B' | 'B2C' | 'B2B2C' | 'B2G';
    primarySectors: string[];
    secondarySectors: string[];
    decisionMakers: string[];
    companySize?: 'SME' | 'Mid-market' | 'Enterprise' | 'All';
    geographicFocus: string[];
    description: string;
  }
  
  export interface ExtractedVoice {
    formality: 'casual' | 'friendly' | 'professional' | 'corporate' | 'formal';
    personality: string[];
    technicalLevel: 'low' | 'medium' | 'high';
    warmth: 'cold' | 'moderate' | 'warm';
    traits?: {
      weAlwaysSay?: string[];
      weNeverSay?: string[];
      industryTermsUsed?: string[];
    };
  }
  
  export interface ExtractedSAContext {
    bbeeLevel?: number;           // 1-8
    cidbGrades?: Record<string, number>;  // { CE: 7, GB: 7, ME: 7 }
    provinces?: string[];
    localEmphasis?: boolean;
    industryBodies?: string[];
  }
  
  export interface ContentTheme {
    theme: string;
    purpose: string;
    topicExamples: string[];
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  }
  
  export interface CompanyAnalysis {
    industries: ExtractedIndustry[];
    services: ExtractedService[];
    uniqueSellingPoints: ExtractedUSP[];
    targetAudience: ExtractedAudience;
    brandVoice: ExtractedVoice;
    saContext: ExtractedSAContext;
    suggestedContentThemes: ContentTheme[];
    confidenceScore: number;
    dataQuality: 'low' | 'medium' | 'high';
    missingInformation: string[];
  }