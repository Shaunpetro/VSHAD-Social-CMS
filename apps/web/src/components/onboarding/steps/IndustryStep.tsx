// apps/web/src/components/onboarding/steps/IndustryStep.tsx
'use client'

import { useState, useEffect } from 'react'
import { Search, Building2, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react'
import type { OnboardingData } from '../OnboardingWizard'

interface Industry {
  id: string
  industry: string
  recommendedPostsPerWeek: number
  recommendedTone: string
  humorAppropriate: boolean
}

interface IndustryStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  industries: Industry[]
  companyName: string
}

export default function IndustryStep({ 
  data, 
  updateData, 
  industries,
  companyName 
}: IndustryStepProps) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [benchmark, setBenchmark] = useState<any>(null)

  // Filter industries based on search
  const filteredIndustries = industries.filter(ind =>
    ind.industry.toLowerCase().includes(search.toLowerCase())
  )

  // Fetch benchmark when industry is selected
  useEffect(() => {
    if (data.selectedIndustry) {
      fetchBenchmark(data.selectedIndustry)
    }
  }, [data.selectedIndustry])

  const fetchBenchmark = async (industry: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/intelligence/benchmarks/${encodeURIComponent(industry)}`)
      if (res.ok) {
        const benchmarkData = await res.json()
        setBenchmark(benchmarkData)
        updateData({ industryBenchmark: benchmarkData })
      }
    } catch (error) {
      console.error('Failed to fetch benchmark:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectIndustry = (industry: string) => {
    updateData({ selectedIndustry: industry })
  }

  // Group industries by first letter
  const groupedIndustries = filteredIndustries.reduce((acc, ind) => {
    const letter = ind.industry[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(ind)
    return acc
  }, {} as Record<string, Industry[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          What industry is {companyName} in?
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">
          This helps us tailor content recommendations and benchmarks for your business
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Industry Selection */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search industries..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Industry List */}
          <div className="h-[300px] overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)]">
            {Object.keys(groupedIndustries).sort().map(letter => (
              <div key={letter}>
                <div className="sticky top-0 px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">{letter}</span>
                </div>
                {groupedIndustries[letter].map(ind => (
                  <button
                    key={ind.id}
                    onClick={() => handleSelectIndustry(ind.industry)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-[var(--border-subtle)] last:border-0
                      ${data.selectedIndustry === ind.industry
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-[var(--text-tertiary)]" />
                      <span className="font-medium">{ind.industry}</span>
                    </div>
                    {data.selectedIndustry === ind.industry && (
                      <CheckCircle2 size={18} className="text-brand-500" />
                    )}
                  </button>
                ))}
              </div>
            ))}
            {filteredIndustries.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
                <Search size={32} className="mb-2 opacity-50" />
                <p>No industries found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Benchmark Preview */}
        <div className="space-y-4">
          {data.selectedIndustry ? (
            <>
              <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-brand-600" />
                  <span className="font-semibold text-[var(--text-primary)]">
                    {data.selectedIndustry} Insights
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Here's what we know about content performance in your industry
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-brand-500" />
                </div>
              ) : benchmark ? (
                <div className="space-y-4">
                  {/* Recommended Posts */}
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <p className="text-sm text-[var(--text-tertiary)] mb-1">Recommended Posts/Week</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {benchmark.optimalPostsMin || 3} - {benchmark.optimalPostsMax || 5}
                    </p>
                  </div>

                  {/* Engagement Rate */}
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <p className="text-sm text-[var(--text-tertiary)] mb-1">Avg Engagement Rate</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {benchmark.avgEngagementRate || '2.5'}%
                    </p>
                  </div>

                  {/* Best Platforms */}
                  {benchmark.platformPriority && benchmark.platformPriority.length > 0 && (
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                      <p className="text-sm text-[var(--text-tertiary)] mb-2">Best Platforms</p>
                      <div className="flex flex-wrap gap-2">
                        {benchmark.platformPriority.slice(0, 3).map((platform: string, i: number) => (
                          <span 
                            key={platform}
                            className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                          >
                            {i + 1}. {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Themes */}
                  {benchmark.suggestedThemes && benchmark.suggestedThemes.length > 0 && (
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                      <p className="text-sm text-[var(--text-tertiary)] mb-2">Popular Content Themes</p>
                      <div className="flex flex-wrap gap-2">
                        {benchmark.suggestedThemes.slice(0, 5).map((theme: string) => (
                          <span 
                            key={theme}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                  <p className="text-[var(--text-tertiary)]">
                    Loading industry data...
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                <Building2 size={32} className="text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Select Your Industry</h3>
              <p className="text-sm text-[var(--text-tertiary)] max-w-xs">
                Choose from the list to see tailored benchmarks and recommendations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}