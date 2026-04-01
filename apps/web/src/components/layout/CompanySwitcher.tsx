// apps/web/src/components/layout/CompanySwitcher.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'

interface Company {
  id: string
  name: string
  logoUrl: string | null
  industry: string | null
}

interface CompanySwitcherProps {
  companies: Company[]
}

export default function CompanySwitcher({ companies }: CompanySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Get current company from URL
  const currentCompanyId = pathname.match(/\/companies\/([^/]+)/)?.[1]
  const currentCompany = companies.find(c => c.id === currentCompanyId)

  // Filter companies based on search
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSelectCompany = (companyId: string) => {
    if (currentCompanyId) {
      const subPath = pathname.replace(`/companies/${currentCompanyId}`, '')
      router.push(`/companies/${companyId}${subPath}`)
    } else {
      router.push(`/companies/${companyId}`)
    }
    setIsOpen(false)
    setSearch('')
  }

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  if (companies.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200
          ${currentCompany 
            ? 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]' 
            : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
          }
        `}
      >
        {currentCompany ? (
          <>
            {currentCompany.logoUrl ? (
              <div className="w-6 h-6 rounded-lg overflow-hidden bg-[var(--bg-secondary)] flex-shrink-0">
                <Image
                  src={currentCompany.logoUrl}
                  alt={currentCompany.name}
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-xs">{getInitials(currentCompany.name)}</span>
              </div>
            )}
            <span className="text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate hidden sm:inline">
              {currentCompany.name}
            </span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
            <span className="text-sm hidden sm:inline">Select Company</span>
          </>
        )}
        <svg 
          className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2} 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 z-50 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] shadow-xl overflow-hidden animate-scale-in">
          {/* Search */}
          <div className="p-2 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                autoFocus
              />
            </div>
          </div>

          {/* Company List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredCompanies.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-[var(--text-tertiary)]">No companies found</p>
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${company.id === currentCompanyId 
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' 
                      : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                    }
                  `}
                >
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
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">{getInitials(company.name)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{company.name}</p>
                    {company.industry && (
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{company.industry}</p>
                    )}
                  </div>
                  {company.id === currentCompanyId && (
                    <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => {
                router.push('/companies')
                setIsOpen(false)
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              View All Companies
            </button>
          </div>
        </div>
      )}
    </div>
  )
}