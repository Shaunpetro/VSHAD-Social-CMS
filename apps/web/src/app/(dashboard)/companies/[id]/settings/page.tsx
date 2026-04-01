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
      intelligence: true,
      platforms: {
        select: {
          id: true,
          type: true,
          name: true  // Changed from platformName to name
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

  // Transform for client component
  const companyData = {
    id: company.id,
    name: company.name,
    logoUrl: company.logoUrl,
    website: company.website,
    description: company.description,
    industry: company.industry,
    intelligence: company.intelligence,
    platforms: company.platforms.map(p => ({
      id: p.id,
      type: p.type,
      platformName: p.name
    }))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CompanySettingsClient 
        company={companyData}
        industries={industries}
      />
    </div>
  )
}