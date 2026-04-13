// apps/web/src/app/api/intelligence/reanalyze/route.ts

/**
 * RE-ANALYSIS API
 * Handles re-analysis of company data and comparison with previous analysis
 * 
 * POST /api/intelligence/reanalyze
 * - Re-runs analysis with same or updated sources
 * - Compares with previous analysis
 * - Shows what changed
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeCompany, type AnalysisOptions } from '@/lib/intelligence/analyzer';
import type { 
  DataSources, 
  CompanyAnalysis
} from '@/lib/intelligence/extractors';

// ============================================
// TYPES
// ============================================

interface ReanalyzeRequestBody {
  companyId: string;
  
  // Optional: New/updated sources
  newSources?: {
    websiteUrl?: string;
    linkedinUrl?: string;
    pdfUrl?: string;
    manualDescription?: string;
  };
  
  // Whether to merge with existing sources or replace
  mergeWithExisting?: boolean;
}

interface ChangeItem {
  type: 'added' | 'removed' | 'updated';
  item: unknown;
  previous?: unknown;
}

interface Changes {
  industries: ChangeItem[];
  services: ChangeItem[];
  usps: ChangeItem[];
  saContext: ChangeItem[];
}

// Helper to convert typed objects to Prisma-compatible JSON
function toJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ReanalyzeRequestBody = await request.json();

    if (!body.companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Get existing intelligence
    const existing = await prisma.companyIntelligence.findUnique({
      where: { companyId: body.companyId },
      include: { company: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'No existing analysis found. Use /analyze endpoint first.' },
        { status: 404 }
      );
    }

    const previousAnalysis = existing.aiAnalysis as CompanyAnalysis | null;
    const existingSources = (existing.dataSources as DataSources) || {};

    // Build sources for re-analysis
    let sources: DataSources;
    
    if (body.mergeWithExisting) {
      // Merge new sources with existing
      sources = {
        ...existingSources,
        ...body.newSources,
      };
    } else if (body.newSources && Object.keys(body.newSources).length > 0) {
      // Use only new sources
      sources = body.newSources;
    } else {
      // Use existing sources
      sources = existingSources;
    }

    // Check we have at least one source
    const hasSource = sources.websiteUrl || 
                      sources.linkedinUrl || 
                      sources.pdfUrl || 
                      sources.manualDescription;

    if (!hasSource) {
      return NextResponse.json(
        { error: 'No data sources available for re-analysis' },
        { status: 400 }
      );
    }

    console.log(`[Reanalyze] Starting re-analysis for: ${existing.company.name}`);

    // Run new analysis
    const analysisOptions: AnalysisOptions = {
      companyName: existing.company.name,
      sources,
    };

    const result = await analyzeCompany(analysisOptions);

    if (!result.success || !result.analysis) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Re-analysis failed',
        sourcesProcessed: result.extraction.sourcesProcessed,
        sourcesFailed: result.extraction.sourcesFailed,
      }, { status: 422 });
    }

    // Compare with previous analysis
    const changes = compareAnalyses(previousAnalysis, result.analysis);
    const hasChanges = changes.industries.length > 0 || 
                       changes.services.length > 0 || 
                       changes.usps.length > 0 ||
                       changes.saContext.length > 0;

    // Save new analysis
    const newVersion = existing.analysisVersion + 1;
    
    await prisma.companyIntelligence.update({
      where: { companyId: body.companyId },
      data: {
        dataSources: toJson(sources),
        lastAnalyzedAt: new Date(),
        analysisVersion: newVersion,
        
        aiAnalysis: toJson(result.analysis),
        aiConfidenceScore: result.analysis.confidenceScore,
        
        extractedIndustries: toJson(result.analysis.industries),
        extractedServices: toJson(result.analysis.services),
        extractedUSPs: toJson(result.analysis.uniqueSellingPoints),
        extractedAudience: toJson(result.analysis.targetAudience),
        extractedVoice: toJson(result.analysis.brandVoice),
        extractedSAContext: toJson(result.analysis.saContext),
        
        generatedThemes: toJson(result.analysis.suggestedContentThemes),
        
        // Reset confirmations if there are changes
        industriesConfirmed: hasChanges ? false : existing.industriesConfirmed,
        servicesConfirmed: hasChanges ? false : existing.servicesConfirmed,
        uspsConfirmed: hasChanges ? false : existing.uspsConfirmed,
        audienceConfirmed: hasChanges ? false : existing.audienceConfirmed,
        voiceConfirmed: hasChanges ? false : existing.voiceConfirmed,
      },
    });

    // Update legacy industry field
    if (result.analysis.industries.length > 0) {
      const primaryIndustry = result.analysis.industries.reduce((prev, curr) => 
        curr.confidence > prev.confidence ? curr : prev
      );
      
      await prisma.company.update({
        where: { id: body.companyId },
        data: { industry: primaryIndustry.name },
      });
    }

    // Build change summary
    const changeSummary = buildChangeSummary(changes);

    console.log(`[Reanalyze] Complete. Version: ${newVersion}, Changes: ${hasChanges}`);

    return NextResponse.json({
      success: true,
      hasChanges,
      changes,
      changeSummary,
      newAnalysis: result.analysis,
      previousAnalysis,
      extraction: {
        sourcesProcessed: result.extraction.sourcesProcessed,
        sourcesFailed: result.extraction.sourcesFailed,
      },
      processingTime: result.processingTime,
      analysisVersion: newVersion,
      confirmationsReset: hasChanges,
      message: hasChanges 
        ? 'Changes detected. Please review and confirm the updated analysis.'
        : 'No significant changes detected.',
    });

  } catch (error) {
    console.error('[Reanalyze] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Re-analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function compareAnalyses(
  previous: CompanyAnalysis | null, 
  current: CompanyAnalysis
): Changes {
  const changes: Changes = {
    industries: [],
    services: [],
    usps: [],
    saContext: [],
  };

  if (!previous) {
    // No previous analysis - all items are "added"
    changes.industries = current.industries.map(i => ({ type: 'added', item: i }));
    changes.services = current.services.map(s => ({ type: 'added', item: s }));
    changes.usps = current.uniqueSellingPoints.map(u => ({ type: 'added', item: u }));
    return changes;
  }

  // Compare industries
  const prevIndustryCodes = new Set(previous.industries.map(i => i.code));
  const currIndustryCodes = new Set(current.industries.map(i => i.code));

  for (const industry of current.industries) {
    if (!prevIndustryCodes.has(industry.code)) {
      changes.industries.push({ type: 'added', item: industry });
    } else {
      // Check for updates (e.g., grade changes)
      const prevIndustry = previous.industries.find(i => i.code === industry.code);
      if (prevIndustry && prevIndustry.cidbGrade !== industry.cidbGrade) {
        changes.industries.push({ 
          type: 'updated', 
          item: industry, 
          previous: prevIndustry 
        });
      }
    }
  }

  for (const industry of previous.industries) {
    if (!currIndustryCodes.has(industry.code)) {
      changes.industries.push({ type: 'removed', item: industry });
    }
  }

  // Compare services
  const prevServiceNames = new Set(previous.services.map(s => s.name.toLowerCase()));
  const currServiceNames = new Set(current.services.map(s => s.name.toLowerCase()));

  for (const service of current.services) {
    if (!prevServiceNames.has(service.name.toLowerCase())) {
      changes.services.push({ type: 'added', item: service });
    }
  }

  for (const service of previous.services) {
    if (!currServiceNames.has(service.name.toLowerCase())) {
      changes.services.push({ type: 'removed', item: service });
    }
  }

  // Compare USPs
  const prevUSPs = new Set(previous.uniqueSellingPoints.map(u => u.point.toLowerCase()));
  const currUSPs = new Set(current.uniqueSellingPoints.map(u => u.point.toLowerCase()));

  for (const usp of current.uniqueSellingPoints) {
    if (!prevUSPs.has(usp.point.toLowerCase())) {
      changes.usps.push({ type: 'added', item: usp });
    }
  }

  for (const usp of previous.uniqueSellingPoints) {
    if (!currUSPs.has(usp.point.toLowerCase())) {
      changes.usps.push({ type: 'removed', item: usp });
    }
  }

  // Compare SA Context
  if (previous.saContext && current.saContext) {
    // Check CIDB grades
    const prevGrades = previous.saContext.cidbGrades || {};
    const currGrades = current.saContext.cidbGrades || {};
    
    for (const [code, grade] of Object.entries(currGrades)) {
      if (!prevGrades[code]) {
        changes.saContext.push({ 
          type: 'added', 
          item: { cidbGrade: { code, grade } }
        });
      } else if (prevGrades[code] !== grade) {
        changes.saContext.push({ 
          type: 'updated', 
          item: { cidbGrade: { code, grade } },
          previous: { cidbGrade: { code, grade: prevGrades[code] } }
        });
      }
    }

    // Check B-BBEE level
    if (previous.saContext.bbeeLevel !== current.saContext.bbeeLevel) {
      if (current.saContext.bbeeLevel) {
        changes.saContext.push({
          type: previous.saContext.bbeeLevel ? 'updated' : 'added',
          item: { bbeeLevel: current.saContext.bbeeLevel },
          previous: previous.saContext.bbeeLevel 
            ? { bbeeLevel: previous.saContext.bbeeLevel } 
            : undefined,
        });
      }
    }
  }

  return changes;
}

function buildChangeSummary(changes: Changes): string {
  const parts: string[] = [];

  const addedIndustries = changes.industries.filter(c => c.type === 'added').length;
  const removedIndustries = changes.industries.filter(c => c.type === 'removed').length;
  const updatedIndustries = changes.industries.filter(c => c.type === 'updated').length;

  if (addedIndustries > 0) parts.push(`${addedIndustries} new industry/industries detected`);
  if (removedIndustries > 0) parts.push(`${removedIndustries} industry/industries no longer detected`);
  if (updatedIndustries > 0) parts.push(`${updatedIndustries} industry/industries updated`);

  const addedServices = changes.services.filter(c => c.type === 'added').length;
  const removedServices = changes.services.filter(c => c.type === 'removed').length;

  if (addedServices > 0) parts.push(`${addedServices} new service(s) found`);
  if (removedServices > 0) parts.push(`${removedServices} service(s) no longer found`);

  const addedUSPs = changes.usps.filter(c => c.type === 'added').length;
  
  if (addedUSPs > 0) parts.push(`${addedUSPs} new selling point(s) identified`);

  if (changes.saContext.length > 0) {
    parts.push('SA context (CIDB/B-BBEE) updated');
  }

  if (parts.length === 0) {
    return 'No significant changes detected';
  }

  return parts.join('. ') + '.';
}