// apps/web/src/app/(dashboard)/layout.tsx
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import CompanySwitcher from '@/components/layout/CompanySwitcher'
import GlobalNav from '@/components/layout/GlobalNav'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      industry: true
    }
  })

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="h-16 glass sticky top-0 z-40">
        <div className="h-full max-w-[1800px] mx-auto px-4 flex items-center justify-between">
          {/* Left: Logo + Global Nav */}
          <div className="flex items-center gap-6">
            <Link href="/companies" className="flex items-center gap-3 group">
              {/* Logo Image */}
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-lg group-hover:shadow-xl transition-shadow">
                <Image
                  src="/vshad-logo.png"
                  alt="VSHAD RoboSocial"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span className="font-bold text-[var(--text-primary)] hidden sm:inline text-lg">
                RoboSocial
              </span>
            </Link>
            
            <div className="divider-vertical hidden md:block" />
            
            <GlobalNav />
          </div>

          {/* Right: Company Switcher + Actions */}
          <div className="flex items-center gap-3">
            <CompanySwitcher companies={companies} />
            
            <div className="divider-vertical" />

            {/* Help */}
            <button className="p-2 rounded-xl transition-all duration-200 hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* User avatar */}
            <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-shadow">
              U
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children}
    </div>
  )
}