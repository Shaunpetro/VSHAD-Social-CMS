// apps/web/src/app/(dashboard)/companies/[id]/settings/page.tsx
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import CompanySettingsClient from './CompanySettingsClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CompanySettingsPage({ params }: PageProps) {
  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      intelligence: {
        include: {
          contentPillars: {
            orderBy: { createdAt: 'asc' }
          }
        }
      },
      platforms: {
        select: {
          id: true,
          type: true,
          name: true
        }
      }
    }
  })

  if (!company) {
    notFound()
  }

  // If onboarding not completed, redirect to onboarding
  if (!company.intelligence?.onboardingCompleted) {
    redirect(`/companies/${id}/onboarding`)
  }

  const industries = await prisma.industryBenchmark.findMany({
    orderBy: { industry: 'asc' }
  })

  // Transform for client component - convert Date objects to ISO strings
  const companyData = {
    id: company.id,
    name: company.name,
    logoUrl: company.logoUrl,
    website: company.website,
    description: company.description,
    industry: company.industry,
    intelligence: company.intelligence ? {
      id: company.intelligence.id,
      companyId: company.intelligence.companyId,
      // Posting Preferences
      postsPerWeek: company.intelligence.postsPerWeek,
      preferredDays: company.intelligence.preferredDays,
      preferredTimes: company.intelligence.preferredTimes,
      timezone: company.intelligence.timezone,
      autoApprove: company.intelligence.autoApprove,
      // Brand Identity
      brandPersonality: company.intelligence.brandPersonality,
      defaultTone: company.intelligence.defaultTone,
      uniqueSellingPoints: company.intelligence.uniqueSellingPoints,
      targetAudience: company.intelligence.targetAudience,
      primaryGoals: company.intelligence.primaryGoals,
      // Content Pillars
      contentPillars: company.intelligence.contentPillars.map(pillar => ({
        id: pillar.id,
        name: pillar.name,
        topics: pillar.topics,
        contentTypes: pillar.contentTypes,
        frequencyWeight: pillar.frequencyWeight,
        isActive: pillar.isActive,
      })),
      // AI Analysis Data
      dataSources: company.intelligence.dataSources,
      lastAnalyzedAt: company.intelligence.lastAnalyzedAt?.toISOString() || null,
      analysisVersion: company.intelligence.analysisVersion,
      aiConfidenceScore: company.intelligence.aiConfidenceScore,
      extractedIndustries: company.intelligence.extractedIndustries,
      extractedServices: company.intelligence.extractedServices,
      extractedUSPs: company.intelligence.extractedUSPs,
      extractedAudience: company.intelligence.extractedAudience,
      primaryBusinessGoal: company.intelligence.primaryBusinessGoal,
      // Confirmation Status
      industriesConfirmed: company.intelligence.industriesConfirmed,
      servicesConfirmed: company.intelligence.servicesConfirmed,
      uspsConfirmed: company.intelligence.uspsConfirmed,
      audienceConfirmed: company.intelligence.audienceConfirmed,
      voiceConfirmed: company.intelligence.voiceConfirmed,
      onboardingCompleted: company.intelligence.onboardingCompleted,
      // AI-Learned Fields (read-only)
      learnedBestDays: company.intelligence.learnedBestDays,
      learnedBestTimes: company.intelligence.learnedBestTimes,
      learnedBestPillars: company.intelligence.learnedBestPillars,
      // Timestamps
      createdAt: company.intelligence.createdAt.toISOString(),
      updatedAt: company.intelligence.updatedAt.toISOString(),
    } : null,
    platforms: company.platforms.map(p => ({
      id: p.id,
      type: p.type,
      platformName: p.name
    }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <CompanySettingsClient
        company={companyData}
        industries={industries}
      />
    </div>
  )
}