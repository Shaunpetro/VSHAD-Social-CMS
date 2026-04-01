// apps/web/src/app/(dashboard)/companies/[id]/layout.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import CompanySidebar from '@/components/layout/CompanySidebar'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function CompanyLayout({ children, params }: LayoutProps) {
  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      platforms: {
        select: {
          id: true,
          type: true,
          name: true  // Changed from platformName to name
        }
      },
      intelligence: {
        select: {
          id: true,
          onboardingCompleted: true
        }
      }
    }
  })

  if (!company) {
    notFound()
  }

  // Transform data to match component expectations
  const companyForSidebar = {
    ...company,
    platforms: company.platforms.map(p => ({
      id: p.id,
      type: p.type,
      platformName: p.name  // Map name to platformName for component
    }))
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <CompanySidebar company={companyForSidebar} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
        {children}
      </main>
    </div>
  )
}