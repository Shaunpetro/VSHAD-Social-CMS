// apps/web/src/app/(dashboard)/companies/[id]/onboarding/page.tsx
import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Company Onboarding | RoboSocial',
  description: 'Set up your content intelligence in under 5 minutes'
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OnboardingPage({ params }: PageProps) {
  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      platforms: true,
      intelligence: {
        include: {
          contentPillars: true,
          competitors: true
        }
      }
    }
  })

  if (!company) {
    notFound()
  }

  // Only redirect if intelligence EXISTS and onboarding is EXPLICITLY true
  // When intelligence is null, we stay here (that's the whole point - user needs to onboard)
  if (company.intelligence !== null && company.intelligence.onboardingCompleted === true) {
    redirect(`/companies/${id}`)
  }

  const industries = await prisma.industryBenchmark.findMany({
    select: {
      id: true,
      industry: true,
      recommendedPostsPerWeek: true,
      recommendedTone: true,
      humorAppropriate: true
    },
    orderBy: { industry: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {company.logoUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Set Up {company.name}
              </h1>
              <p className="text-gray-500">
                Configure your content intelligence in under 5 minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OnboardingWizard 
          company={company}
          industries={industries}
          existingIntelligence={company.intelligence}
        />
      </div>
    </div>
  )
}