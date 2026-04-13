// apps/web/src/components/layout/CompanySidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

interface Platform {
  id: string
  type: string
  platformName: string
}

interface Intelligence {
  id: string
  onboardingCompleted: boolean
}

interface Company {
  id: string
  name: string
  logoUrl: string | null
  industry: string | null
  platforms: Platform[]
  intelligence: Intelligence | null
}

interface CompanySidebarProps {
  company: Company
}

const navItems = [
  {
    name: 'Overview',
    shortName: 'Home',
    href: '',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    showOnMobile: true,
  },
  {
    name: 'Platforms',
    shortName: 'Connect',
    href: '/platforms',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    showOnMobile: false,
  },
  {
    name: 'Generate',
    shortName: 'Generate',
    href: '/generate',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    showOnMobile: true,
  },
  {
    name: 'Content Queue',
    shortName: 'Queue',
    href: '/queue',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
    showOnMobile: true,
  },
  {
    name: 'Calendar',
    shortName: 'Calendar',
    href: '/calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    showOnMobile: false,
  },
  {
    name: 'Media',
    shortName: 'Media',
    href: '/media',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    showOnMobile: true,
  },
  {
    name: 'Analytics',
    shortName: 'Stats',
    href: '/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    showOnMobile: false,
  },
  {
    name: 'Settings',
    shortName: 'Settings',
    href: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    showOnMobile: false,
  },
]

// Items to show in mobile "More" menu
const moreMenuItems = navItems.filter(item => !item.showOnMobile)

export default function CompanySidebar({ company }: CompanySidebarProps) {
  const pathname = usePathname()
  const baseUrl = `/companies/${company.id}`

  const needsOnboarding = !company.intelligence?.onboardingCompleted

  const initials = company.name
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()

  // Mobile navigation items (filtered to show only key items + More)
  const mobileNavItems = navItems.filter(item => item.showOnMobile)

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-64 glass-subtle flex-col border-r border-[var(--border-default)]">
        {/* Company Header */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <Link
            href="/companies"
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] flex items-center gap-1 mb-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Companies
          </Link>

          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0 ring-2 ring-[var(--border-subtle)]">
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-[var(--brand-gradient)] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/20">
                <span className="text-white font-semibold text-sm">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-[var(--text-primary)] truncate">{company.name}</h2>
              {company.industry && (
                <p className="text-xs text-[var(--text-tertiary)] truncate">{company.industry}</p>
              )}
            </div>
          </div>
        </div>

        {/* Onboarding Alert */}
        {needsOnboarding && (
          <div className="mx-3 mt-3">
            <Link
              href={`${baseUrl}/onboarding`}
              className="block p-3 bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20 rounded-xl hover:from-brand-500/20 hover:to-purple-500/20 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">Complete Setup</p>
                  <p className="text-xs text-[var(--text-tertiary)]">5 min to unlock AI features</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const href = `${baseUrl}${item.href}`
            const isActive = item.href === ''
              ? pathname === baseUrl
              : pathname.startsWith(href)

            return (
              <Link
                key={item.name}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-brand-500/25'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }
                `}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Connected Platforms */}
        <div className="p-3 border-t border-[var(--border-subtle)]">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-3">
            Connected
          </p>
          {company.platforms.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] px-3">No platforms yet</p>
          ) : (
            <div className="space-y-1">
              {company.platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <span className="text-base">
                    {platform.type === 'LINKEDIN' ? '💼' :
                     platform.type === 'FACEBOOK' ? '📘' :
                     platform.type === 'INSTAGRAM' ? '📸' :
                     platform.type === 'TWITTER' ? '🐦' : '📱'}
                  </span>
                  <span className="truncate flex-1">{platform.platformName}</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 shadow-sm shadow-green-500/50" />
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header Bar - Visible only on mobile */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3 px-4 py-2">
          <Link
            href="/companies"
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          {company.logoUrl ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0">
              <Image
                src={company.logoUrl}
                alt={company.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-[var(--brand-gradient)] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">{initials}</span>
            </div>
          )}
          <span className="font-semibold text-[var(--text-primary)] truncate flex-1">{company.name}</span>
          {needsOnboarding && (
            <Link
              href={`${baseUrl}/onboarding`}
              className="px-2 py-1 text-xs font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg"
            >
              Setup ✨
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Visible only on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-default)] bg-[var(--bg-primary)]/95 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const href = `${baseUrl}${item.href}`
            const isActive = item.href === ''
              ? pathname === baseUrl
              : pathname.startsWith(href)

            return (
              <Link
                key={item.name}
                href={href}
                className={`
                  flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[56px] transition-all duration-200
                  ${isActive
                    ? 'text-[var(--brand-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }
                `}
              >
                <div className={`
                  p-1.5 rounded-lg transition-colors
                  ${isActive ? 'bg-brand-500/10' : ''}
                `}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium">{item.shortName}</span>
              </Link>
            )
          })}
          
          {/* More Menu Button */}
          <div className="relative group">
            <button
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[56px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-200"
            >
              <div className="p-1.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <span className="text-[10px] font-medium">More</span>
            </button>

            {/* More Menu Dropdown - Opens upward */}
            <div className="absolute bottom-full right-0 mb-2 w-48 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
              {moreMenuItems.map((item) => {
                const href = `${baseUrl}${item.href}`
                const isActive = pathname.startsWith(href)

                return (
                  <Link
                    key={item.name}
                    href={href}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                      ${isActive
                        ? 'text-[var(--brand-primary)] bg-brand-500/5'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                      }
                    `}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}