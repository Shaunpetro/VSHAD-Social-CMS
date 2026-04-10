// apps/web/src/components/onboarding/steps/IndustryStep.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Building2, 
  TrendingUp, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import type { OnboardingData } from '../OnboardingWizard'

interface Industry {
  id: string
  industry: string
  recommendedPostsPerWeek: number
  recommendedTone: string
  humorAppropriate: boolean
}

interface SearchResult {
  industry: string
  score: number
  isSynonymMatch?: boolean
}

interface AISuggestion {
  suggestedIndustry: string | null
  confidence: number
  reason: string
  alternatives: string[]
  source: string
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [showAllIndustries, setShowAllIndustries] = useState(false)

  // Fetch AI suggestion on mount based on company name
  useEffect(() => {
    if (companyName && !data.selectedIndustry) {
      fetchAISuggestion()
    }
  }, [companyName])

  // Debounced search
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([])
      setShowAllIndustries(true)
      return
    }

    setShowAllIndustries(false)
    const timer = setTimeout(() => {
      performSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Fetch benchmark when industry is selected
  useEffect(() => {
    if (data.selectedIndustry) {
      fetchBenchmark(data.selectedIndustry)
    }
  }, [data.selectedIndustry])

  const fetchAISuggestion = async () => {
    setIsLoadingAI(true)
    try {
      const res = await fetch('/api/intelligence/suggest-industry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companyDescription: data.description || null
        })
      })
      
      if (res.ok) {
        const suggestion = await res.json()
        setAiSuggestion(suggestion)
        
        // Auto-select if high confidence and no existing selection
        if (suggestion.suggestedIndustry && suggestion.confidence >= 0.8 && !data.selectedIndustry) {
          // Don't auto-select, just show suggestion prominently
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestion:', error)
    } finally {
      setIsLoadingAI(false)
    }
  }

  const performSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const res = await fetch(`/api/intelligence/suggest-industry?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
        
        // If no results from fuzzy search, try AI
        if (data.results.length === 0 && query.length >= 3) {
          const aiRes = await fetch('/api/intelligence/suggest-industry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName,
              userQuery: query
            })
          })
          
          if (aiRes.ok) {
            const aiData = await aiRes.json()
            if (aiData.suggestedIndustry) {
              setSearchResults([
                { 
                  industry: aiData.suggestedIndustry, 
                  score: aiData.confidence * 100,
                  isSynonymMatch: true 
                },
                ...aiData.alternatives.map((alt: string, i: number) => ({
                  industry: alt,
                  score: 50 - (i * 10)
                }))
              ])
            }
          }
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

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
    setSearch('')
    setSearchResults([])
    setShowAllIndustries(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (!e.target.value) {
      setShowAllIndustries(true)
    }
  }

  // Group industries by first letter for full list view
  const groupedIndustries = industries.reduce((acc, ind) => {
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
          Type your industry or let AI suggest the best match
        </p>
      </div>

      {/* AI Suggestion Card */}
      {isLoadingAI ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-brand-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            <span className="text-[var(--text-secondary)]">AI is analyzing {companyName}...</span>
          </div>
        </div>
      ) : aiSuggestion?.suggestedIndustry && !data.selectedIndustry ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-brand-500/10 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  AI Suggestion
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  {Math.round(aiSuggestion.confidence * 100)}% confident
                </span>
              </div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                {aiSuggestion.suggestedIndustry}
              </p>
              <p className="text-sm text-[var(--text-tertiary)] mb-3">
                {aiSuggestion.reason}
              </p>
              <button
                onClick={() => handleSelectIndustry(aiSuggestion.suggestedIndustry!)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                Use this industry
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Alternative suggestions */}
          {aiSuggestion.alternatives.length > 0 && (
            <div className="mt-4 pt-3 border-t border-purple-500/20">
              <p className="text-xs text-[var(--text-tertiary)] mb-2">Or choose an alternative:</p>
              <div className="flex flex-wrap gap-2">
                {aiSuggestion.alternatives.map(alt => (
                  <button
                    key={alt}
                    onClick={() => handleSelectIndustry(alt)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-subtle)]"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Industry Selection */}
        <div className="space-y-4">
          {/* Smart Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Type any industry (e.g., soccer, tech, coffee shop)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            {isSearching && (
              <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-brand-500" />
            )}
          </div>

          {/* Search hint */}
          {!search && !data.selectedIndustry && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Lightbulb size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Tip:</strong> Type anything related to your business. Our AI will find the best matching industry category. Try "soccer", "coding bootcamp", or "vegan restaurant".
              </p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] overflow-hidden">
              <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  {searchResults.some(r => r.isSynonymMatch) ? 'AI-Matched Results' : 'Search Results'}
                </span>
              </div>
              {searchResults.map(result => (
                <button
                  key={result.industry}
                  onClick={() => handleSelectIndustry(result.industry)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-[var(--border-subtle)] last:border-0
                    ${data.selectedIndustry === result.industry
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {result.isSynonymMatch ? (
                      <Sparkles size={18} className="text-purple-500" />
                    ) : (
                      <Building2 size={18} className="text-[var(--text-tertiary)]" />
                    )}
                    <div>
                      <span className="font-medium">{result.industry}</span>
                      {result.isSynonymMatch && (
                        <span className="ml-2 text-xs text-purple-500">Best match for "{search}"</span>
                      )}
                    </div>
                  </div>
                  {data.selectedIndustry === result.industry && (
                    <CheckCircle2 size={18} className="text-brand-500" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Full Industry List */}
          {(showAllIndustries || (!search && !searchResults.length)) && (
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
            </div>
          )}

          {/* No results message */}
          {search && !isSearching && searchResults.length === 0 && (
            <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
              <Search size={32} className="mx-auto mb-2 text-[var(--text-tertiary)] opacity-50" />
              <p className="text-[var(--text-secondary)] mb-2">Searching for "{search}"...</p>
              <p className="text-sm text-[var(--text-tertiary)]">
                AI is finding the best match
              </p>
            </div>
          )}
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

                  {/* Change industry button */}
                  <button
                    onClick={() => {
                      updateData({ selectedIndustry: '', industryBenchmark: null })
                      setBenchmark(null)
                      setShowAllIndustries(true)
                    }}
                    className="w-full py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Change industry selection
                  </button>
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
                Type anything related to your business, and we'll find the best match with tailored benchmarks
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}