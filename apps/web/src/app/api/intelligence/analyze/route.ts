// apps/web/src/app/api/intelligence/analyze/route.ts

/**
 * COMPANY ANALYSIS API
 * Main endpoint for AI-powered company intelligence extraction
 * 
 * POST /api/intelligence/analyze
 * - Accepts multiple data sources (website, LinkedIn, PDF, manual text)
 * - Extracts and combines content
 * - Analyzes with Groq AI
 * - Saves results to CompanyIntelligence
 * 
 * Supports two payload formats for flexibility:
 * - Format 1 (original): { sources: { websiteUrl, linkedinUrl, ... } }
 * - Format 2 (wizard): { dataSources: { website, linkedin, ... } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeCompany, type AnalysisOptions } from '@/lib/intelligence/analyzer';
import type { DataSources } from '@/lib/intelligence/extractors';

// ============================================
// TYPES
// ============================================

interface AnalyzeRequestBody {
  companyId: string;
  companyName: string;
  
  // Format 1: Original structure
  sources?: {
    websiteUrl?: string;
    linkedinUrl?: string;
    pdfUrl?: string;
    manualDescription?: string;
  };
  
  // Format 2: OnboardingWizard structure
  dataSources?: {
    website?: string | null;
    linkedin?: string | null;
    pdfUrl?: string | null;
    manual?: string | null;
  };
  
  forceReanalyze?: boolean;
}

// ============================================
// HELPER: Normalize sources to standard format
// ============================================

function normalizeSources(body: AnalyzeRequestBody): {
  websiteUrl?: string;
  linkedinUrl?: string;
  pdfUrl?: string;
  manualDescription?: string;
} {
  // Prefer Format 1 if provided
  if (body.sources) {
    return {
      websiteUrl: body.sources.websiteUrl || undefined,
      linkedinUrl: body.sources.linkedinUrl || undefined,
      pdfUrl: body.sources.pdfUrl || undefined,
      manualDescription: body.sources.manualDescription || undefined,
    };
  }
  
  // Fall back to Format 2 (OnboardingWizard)
  if (body.dataSources) {
    return {
      websiteUrl: body.dataSources.website || undefined,
      linkedinUrl: body.dataSources.linkedin || undefined,
      pdfUrl: body.dataSources.pdfUrl || undefined,
      manualDescription: body.dataSources.manual || undefined,
    };
  }
  
  return {};
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await request.json();
    
    // Validate required fields
    if (!body.companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }
    
    if (!body.companyName) {
      return NextResponse.json(
        { error: 'companyName is required' },
        { status: 400 }
      );
    }
    
    // Normalize sources from either format
    const sources = normalizeSources(body);
    
    // Check that at least one source is provided
    const hasSource = sources.websiteUrl || 
                      sources.linkedinUrl || 
                      sources.pdfUrl || 
                      sources.manualDescription;
    
    if (!hasSource) {
      return NextResponse.json(
        { error: 'At least one data source is required (website, LinkedIn, PDF, or description)' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: body.companyId },
      include: { intelligence: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if analysis already exists and not forcing reanalyze
    if (company.intelligence?.aiAnalysis && !body.forceReanalyze) {
      const lastAnalyzed = company.intelligence.lastAnalyzedAt;
      const hoursSinceAnalysis = lastAnalyzed 
        ? (Date.now() - new Date(lastAnalyzed).getTime()) / (1000 * 60 * 60)
        : Infinity;
      
      // If analyzed within last 24 hours, return existing
      if (hoursSinceAnalysis < 24) {
        return NextResponse.json({
          success: true,
          cached: true,
          analysis: company.intelligence.aiAnalysis,
          lastAnalyzedAt: company.intelligence.lastAnalyzedAt,
          message: 'Returning cached analysis. Use forceReanalyze=true to re-analyze.',
        });
      }
    }

    console.log(`[API] Starting analysis for company: ${body.companyName} (${body.companyId})`);
    console.log(`[API] Sources:`, {
      website: sources.websiteUrl ? 'provided' : 'none',
      linkedin: sources.linkedinUrl ? 'provided' : 'none',
      pdf: sources.pdfUrl ? 'provided' : 'none',
      manual: sources.manualDescription ? `${sources.manualDescription.length} chars` : 'none',
    });

    // Build data sources object for analyzer
    const dataSources: DataSources = {
      websiteUrl: sources.websiteUrl,
      linkedinUrl: sources.linkedinUrl,
      pdfUrl: sources.pdfUrl,
      manualDescription: sources.manualDescription,
    };

    // Run analysis
    const analysisOptions: AnalysisOptions = {
      companyName: body.companyName,
      sources: dataSources,
    };

    const result = await analyzeCompany(analysisOptions);

    if (!result.success || !result.analysis) {
      console.error(`[API] Analysis failed for ${body.companyId}:`, result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Analysis failed',
        sourcesProcessed: result.extraction?.sourcesProcessed || [],
        sourcesFailed: result.extraction?.sourcesFailed || [],
        errors: result.extraction?.errors || [],
      }, { status: 422 });
    }

    // Save analysis to database
    const currentVersion = company.intelligence?.analysisVersion || 0;
    
    // Store sources in both formats for compatibility
    const storedSources = {
      // Format 1 (original)
      websiteUrl: sources.websiteUrl,
      linkedinUrl: sources.linkedinUrl,
      pdfUrl: sources.pdfUrl,
      manualDescription: sources.manualDescription,
      // Format 2 (wizard) - for easier debugging
      website: sources.websiteUrl,
      linkedin: sources.linkedinUrl,
      manual: sources.manualDescription,
    };
    
    const updatedIntelligence = await prisma.companyIntelligence.upsert({
      where: { companyId: body.companyId },
      create: {
        companyId: body.companyId,
        
        // Data sources
        dataSources: storedSources,
        lastAnalyzedAt: new Date(),
        analysisVersion: 1,
        
        // AI Analysis
        aiAnalysis: result.analysis as any,
        aiConfidenceScore: result.analysis.confidenceScore,
        
        // Extracted data (separate fields for easier querying)
        extractedIndustries: result.analysis.industries as any,
        extractedServices: result.analysis.services as any,
        extractedUSPs: result.analysis.uniqueSellingPoints as any,
        extractedAudience: result.analysis.targetAudience as any,
        extractedVoice: result.analysis.brandVoice as any,
        extractedSAContext: result.analysis.saContext as any,
        
        // Generated content strategy
        generatedThemes: result.analysis.suggestedContentThemes as any,
        
        // Confirmation status (all false initially)
        industriesConfirmed: false,
        servicesConfirmed: false,
        uspsConfirmed: false,
        audienceConfirmed: false,
        voiceConfirmed: false,
        
        // Set some defaults from analysis
        targetAudience: result.analysis.targetAudience.description,
        uniqueSellingPoints: result.analysis.uniqueSellingPoints.map(u => u.point),
        defaultTone: result.analysis.brandVoice.formality,
        brandPersonality: result.analysis.brandVoice.personality,
      },
      update: {
        // Data sources
        dataSources: storedSources,
        lastAnalyzedAt: new Date(),
        analysisVersion: currentVersion + 1,
        
        // AI Analysis
        aiAnalysis: result.analysis as any,
        aiConfidenceScore: result.analysis.confidenceScore,
        
        // Extracted data
        extractedIndustries: result.analysis.industries as any,
        extractedServices: result.analysis.services as any,
        extractedUSPs: result.analysis.uniqueSellingPoints as any,
        extractedAudience: result.analysis.targetAudience as any,
        extractedVoice: result.analysis.brandVoice as any,
        extractedSAContext: result.analysis.saContext as any,
        
        // Generated content strategy
        generatedThemes: result.analysis.suggestedContentThemes as any,
        
        // Reset confirmation status on re-analysis
        industriesConfirmed: false,
        servicesConfirmed: false,
        uspsConfirmed: false,
        audienceConfirmed: false,
        voiceConfirmed: false,
        
        // Update defaults from analysis
        targetAudience: result.analysis.targetAudience.description,
        uniqueSellingPoints: result.analysis.uniqueSellingPoints.map(u => u.point),
        defaultTone: result.analysis.brandVoice.formality,
        brandPersonality: result.analysis.brandVoice.personality,
      },
    });

    // Also update company's legacy industry field with primary industry
    if (result.analysis.industries.length > 0) {
      const primaryIndustry = result.analysis.industries.reduce((prev, curr) => 
        curr.confidence > prev.confidence ? curr : prev
      );
      
      await prisma.company.update({
        where: { id: body.companyId },
        data: {
          industry: primaryIndustry.name,
          // Update website if provided and not already set
          website: sources.websiteUrl && !company.website ? sources.websiteUrl : undefined,
        },
      });
    }

    console.log(`[API] Analysis complete for ${body.companyId}. Version: ${updatedIntelligence.analysisVersion}`);

    return NextResponse.json({
      success: true,
      cached: false,
      analysis: result.analysis,
      extraction: {
        sourcesProcessed: result.extraction.sourcesProcessed,
        sourcesFailed: result.extraction.sourcesFailed,
        errors: result.extraction.errors,
      },
      processingTime: result.processingTime,
      analysisVersion: updatedIntelligence.analysisVersion,
      lastAnalyzedAt: updatedIntelligence.lastAnalyzedAt,
    });

  } catch (error) {
    console.error('[API] Analysis endpoint error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET HANDLER - Retrieve existing analysis
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const intelligence = await prisma.companyIntelligence.findUnique({
      where: { companyId },
      select: {
        aiAnalysis: true,
        aiConfidenceScore: true,
        extractedIndustries: true,
        extractedServices: true,
        extractedUSPs: true,
        extractedAudience: true,
        extractedVoice: true,
        extractedSAContext: true,
        generatedThemes: true,
        dataSources: true,
        lastAnalyzedAt: true,
        analysisVersion: true,
        industriesConfirmed: true,
        servicesConfirmed: true,
        uspsConfirmed: true,
        audienceConfirmed: true,
        voiceConfirmed: true,
        primaryBusinessGoal: true,
      },
    });

    if (!intelligence) {
      return NextResponse.json(
        { error: 'No analysis found for this company' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: intelligence.aiAnalysis,
      extracted: {
        industries: intelligence.extractedIndustries,
        services: intelligence.extractedServices,
        usps: intelligence.extractedUSPs,
        audience: intelligence.extractedAudience,
        voice: intelligence.extractedVoice,
        saContext: intelligence.extractedSAContext,
      },
      themes: intelligence.generatedThemes,
      confirmationStatus: {
        industries: intelligence.industriesConfirmed,
        services: intelligence.servicesConfirmed,
        usps: intelligence.uspsConfirmed,
        audience: intelligence.audienceConfirmed,
        voice: intelligence.voiceConfirmed,
      },
      dataSources: intelligence.dataSources,
      lastAnalyzedAt: intelligence.lastAnalyzedAt,
      analysisVersion: intelligence.analysisVersion,
      confidenceScore: intelligence.aiConfidenceScore,
      primaryBusinessGoal: intelligence.primaryBusinessGoal,
    });

  } catch (error) {
    console.error('[API] Get analysis error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}