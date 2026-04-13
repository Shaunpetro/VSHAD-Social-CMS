// apps/web/src/app/api/intelligence/confirm/route.ts

/**
 * ANALYSIS CONFIRMATION API
 * Handles user confirmation/editing of AI-extracted data
 * 
 * POST /api/intelligence/confirm
 * - Saves user-confirmed/edited analysis data
 * - Marks sections as confirmed
 * - Saves posting preferences
 * - Generates content strategy based on confirmed data
 * - Marks onboarding as complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateContentThemes } from '@/lib/intelligence/analyzer';
import type { CompanyAnalysis } from '@/lib/intelligence/extractors';

// ============================================
// TYPES
// ============================================

interface ConfirmRequestBody {
  companyId: string;
  
  // ============================================
  // FORMAT 1: Nested structure (original)
  // ============================================
  confirmSections?: {
    industries?: boolean;
    services?: boolean;
    usps?: boolean;
    audience?: boolean;
    voice?: boolean;
  };
  
  edits?: {
    industries?: CompanyAnalysis['industries'];
    services?: CompanyAnalysis['services'];
    usps?: CompanyAnalysis['uniqueSellingPoints'];
    audience?: CompanyAnalysis['targetAudience'];
    voice?: CompanyAnalysis['brandVoice'];
    saContext?: CompanyAnalysis['saContext'];
  };
  
  completeOnboarding?: boolean;
  
  // ============================================
  // FORMAT 2: Flat structure (from OnboardingWizard)
  // ============================================
  // Confirmation flags (flat)
  industriesConfirmed?: boolean;
  servicesConfirmed?: boolean;
  uspsConfirmed?: boolean;
  audienceConfirmed?: boolean;
  voiceConfirmed?: boolean;
  
  // Extracted data (flat)
  extractedIndustries?: CompanyAnalysis['industries'];
  extractedServices?: CompanyAnalysis['services'];
  extractedUSPs?: CompanyAnalysis['uniqueSellingPoints'];
  extractedAudience?: CompanyAnalysis['targetAudience'];
  extractedVoice?: CompanyAnalysis['brandVoice'];
  extractedSAContext?: CompanyAnalysis['saContext'];
  
  // Onboarding completion (flat)
  onboardingCompleted?: boolean;
  
  // ============================================
  // COMMON FIELDS
  // ============================================
  // Business goal
  primaryBusinessGoal?: 'leads' | 'awareness' | 'recruitment' | 'engagement' | string;
  secondaryGoals?: string[];
  
  // Posting preferences
  defaultTone?: string;
  humorEnabled?: boolean;
  humorDays?: string[];
  humorTimes?: string[];
  postsPerWeek?: number;
  preferredDays?: string[];
  preferredTimes?: Record<string, string[]>;
  timezone?: string;
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmRequestBody = await request.json();

    if (!body.companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Get current intelligence
    const intelligence = await prisma.companyIntelligence.findUnique({
      where: { companyId: body.companyId },
      include: { company: true },
    });

    if (!intelligence) {
      // Create intelligence if it doesn't exist
      await prisma.companyIntelligence.create({
        data: {
          companyId: body.companyId,
        },
      });
    }

    // Build update data
    const updateData: any = {};

    // ============================================
    // HANDLE CONFIRMATION FLAGS (both formats)
    // ============================================
    
    // Format 1: Nested
    if (body.confirmSections) {
      if (body.confirmSections.industries !== undefined) {
        updateData.industriesConfirmed = body.confirmSections.industries;
      }
      if (body.confirmSections.services !== undefined) {
        updateData.servicesConfirmed = body.confirmSections.services;
      }
      if (body.confirmSections.usps !== undefined) {
        updateData.uspsConfirmed = body.confirmSections.usps;
      }
      if (body.confirmSections.audience !== undefined) {
        updateData.audienceConfirmed = body.confirmSections.audience;
      }
      if (body.confirmSections.voice !== undefined) {
        updateData.voiceConfirmed = body.confirmSections.voice;
      }
    }
    
    // Format 2: Flat (overwrites if both present)
    if (body.industriesConfirmed !== undefined) {
      updateData.industriesConfirmed = body.industriesConfirmed;
    }
    if (body.servicesConfirmed !== undefined) {
      updateData.servicesConfirmed = body.servicesConfirmed;
    }
    if (body.uspsConfirmed !== undefined) {
      updateData.uspsConfirmed = body.uspsConfirmed;
    }
    if (body.audienceConfirmed !== undefined) {
      updateData.audienceConfirmed = body.audienceConfirmed;
    }
    if (body.voiceConfirmed !== undefined) {
      updateData.voiceConfirmed = body.voiceConfirmed;
    }

    // ============================================
    // HANDLE EXTRACTED DATA (both formats)
    // ============================================
    
    // Format 1: Nested edits
    if (body.edits) {
      if (body.edits.industries) {
        updateData.extractedIndustries = body.edits.industries;
      }
      if (body.edits.services) {
        updateData.extractedServices = body.edits.services;
      }
      if (body.edits.usps) {
        updateData.extractedUSPs = body.edits.usps;
        updateData.uniqueSellingPoints = body.edits.usps.map((u: any) => u.point || u);
      }
      if (body.edits.audience) {
        updateData.extractedAudience = body.edits.audience;
        updateData.targetAudience = body.edits.audience.description;
      }
      if (body.edits.voice) {
        updateData.extractedVoice = body.edits.voice;
        updateData.defaultTone = body.edits.voice.formality;
        updateData.brandPersonality = body.edits.voice.personality;
      }
      if (body.edits.saContext) {
        updateData.extractedSAContext = body.edits.saContext;
      }
    }
    
    // Format 2: Flat extracted data (overwrites if both present)
    if (body.extractedIndustries) {
      updateData.extractedIndustries = body.extractedIndustries;
    }
    if (body.extractedServices) {
      updateData.extractedServices = body.extractedServices;
    }
    if (body.extractedUSPs) {
      updateData.extractedUSPs = body.extractedUSPs;
      updateData.uniqueSellingPoints = body.extractedUSPs.map((u: any) => 
        typeof u === 'string' ? u : (u.point || u)
      );
    }
    if (body.extractedAudience) {
      updateData.extractedAudience = body.extractedAudience;
      if (body.extractedAudience.description) {
        updateData.targetAudience = body.extractedAudience.description;
      }
    }
    if (body.extractedVoice) {
      updateData.extractedVoice = body.extractedVoice;
      if (body.extractedVoice.formality) {
        updateData.brandVoice = body.extractedVoice.formality;
      }
      if (body.extractedVoice.personality) {
        updateData.brandPersonality = body.extractedVoice.personality;
      }
    }
    if (body.extractedSAContext) {
      updateData.extractedSAContext = body.extractedSAContext;
    }

    // ============================================
    // UPDATE PRIMARY INDUSTRY ON COMPANY
    // ============================================
    
    const industriesData = body.extractedIndustries || body.edits?.industries;
    if (industriesData && Array.isArray(industriesData) && industriesData.length > 0) {
      const primaryIndustry = industriesData.reduce((prev: any, curr: any) => 
        (curr.confidence || 0) > (prev.confidence || 0) ? curr : prev
      , industriesData[0]);
      
      if (primaryIndustry?.name) {
        await prisma.company.update({
          where: { id: body.companyId },
          data: { industry: primaryIndustry.name },
        });
      }
    }

    // ============================================
    // HANDLE BUSINESS GOAL
    // ============================================
    
    if (body.primaryBusinessGoal) {
      updateData.primaryBusinessGoal = body.primaryBusinessGoal;
      
      // Map goal to primary goals array for compatibility
      const goalMapping: Record<string, string[]> = {
        leads: ['lead_generation', 'sales'],
        awareness: ['brand_awareness', 'reach'],
        recruitment: ['talent_acquisition', 'employer_branding'],
        engagement: ['community_building', 'customer_retention'],
      };
      updateData.primaryGoals = goalMapping[body.primaryBusinessGoal] || [body.primaryBusinessGoal];
    }

    if (body.secondaryGoals) {
      updateData.secondaryGoals = body.secondaryGoals;
    }

    // ============================================
    // HANDLE POSTING PREFERENCES
    // ============================================
    
    if (body.defaultTone !== undefined) {
      updateData.defaultTone = body.defaultTone;
    }
    if (body.humorEnabled !== undefined) {
      updateData.humorEnabled = body.humorEnabled;
    }
    if (body.humorDays !== undefined) {
      updateData.humorDays = body.humorDays;
    }
    if (body.humorTimes !== undefined) {
      updateData.humorTimes = body.humorTimes;
    }
    if (body.postsPerWeek !== undefined) {
      updateData.postsPerWeek = body.postsPerWeek;
    }
    if (body.preferredDays !== undefined) {
      updateData.preferredDays = body.preferredDays;
    }
    if (body.preferredTimes !== undefined) {
      updateData.preferredTimes = body.preferredTimes;
    }
    if (body.timezone !== undefined) {
      updateData.timezone = body.timezone;
    }

    // ============================================
    // HANDLE ONBOARDING COMPLETION (both formats)
    // ============================================
    
    if (body.completeOnboarding || body.onboardingCompleted) {
      updateData.onboardingCompleted = true;
    }

    // ============================================
    // UPDATE DATABASE
    // ============================================
    
    const updatedIntelligence = await prisma.companyIntelligence.update({
      where: { companyId: body.companyId },
      data: updateData,
    });

    // ============================================
    // GENERATE CONTENT THEMES
    // ============================================
    
    let generatedThemes = null;
    
    const hasGoal = body.primaryBusinessGoal || updatedIntelligence.primaryBusinessGoal;
    const hasIndustries = updatedIntelligence.industriesConfirmed || body.industriesConfirmed;
    const hasServices = updatedIntelligence.servicesConfirmed || body.servicesConfirmed;
    
    if (hasGoal && hasIndustries && hasServices) {
      try {
        const currentAnalysis = updatedIntelligence.aiAnalysis as CompanyAnalysis | null;
        
        if (currentAnalysis) {
          // Use edited/extracted data if available, otherwise use original
          const industries = (
            body.extractedIndustries || 
            body.edits?.industries || 
            currentAnalysis.industries
          ) as CompanyAnalysis['industries'];
          
          const services = (
            body.extractedServices || 
            body.edits?.services || 
            currentAnalysis.services
          ) as CompanyAnalysis['services'];
          
          const audience = (
            body.extractedAudience || 
            body.edits?.audience || 
            currentAnalysis.targetAudience
          ) as CompanyAnalysis['targetAudience'];
          
          const analysisForThemes: CompanyAnalysis = {
            ...currentAnalysis,
            industries,
            services,
            targetAudience: audience,
          };

          const goal = (body.primaryBusinessGoal || updatedIntelligence.primaryBusinessGoal) as 'leads' | 'awareness' | 'recruitment' | 'engagement';
          
          generatedThemes = await generateContentThemes(
            intelligence?.company?.name || 'Company',
            analysisForThemes,
            goal
          );

          // Save generated themes
          if (generatedThemes && generatedThemes.length > 0) {
            await prisma.companyIntelligence.update({
              where: { companyId: body.companyId },
              data: {
                generatedThemes: generatedThemes as any,
              },
            });
          }
        }
      } catch (themeError) {
        console.error('[Confirm] Failed to generate themes:', themeError);
        // Continue without themes - not critical
      }
    }

    // ============================================
    // CALCULATE COMPLETION STATUS
    // ============================================
    
    const confirmationStatus = {
      industries: updatedIntelligence.industriesConfirmed,
      services: updatedIntelligence.servicesConfirmed,
      usps: updatedIntelligence.uspsConfirmed,
      audience: updatedIntelligence.audienceConfirmed,
      voice: updatedIntelligence.voiceConfirmed,
      goal: !!updatedIntelligence.primaryBusinessGoal,
    };
    
    const confirmedCount = Object.values(confirmationStatus).filter(Boolean).length;
    const totalSections = Object.keys(confirmationStatus).length;
    const completionPercentage = Math.round((confirmedCount / totalSections) * 100);

    return NextResponse.json({
      success: true,
      confirmationStatus,
      completionPercentage,
      onboardingCompleted: updatedIntelligence.onboardingCompleted,
      generatedThemes: generatedThemes ? generatedThemes.length : 0,
      message: completionPercentage === 100 
        ? 'All sections confirmed! Ready to generate content.'
        : `${completionPercentage}% complete. Confirm remaining sections.`,
    });

  } catch (error) {
    console.error('[Confirm] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save confirmation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}