// apps/web/src/components/onboarding/OnboardingWizard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Palette, 
  LayoutGrid, 
  Calendar, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  ImageIcon
} from 'lucide-react'
import LogoBasicsStep from './steps/LogoBasicsStep'
import IndustryStep from './steps/IndustryStep'
import BrandPersonalityStep from './steps/BrandPersonalityStep'
import ContentPillarsStep from './steps/ContentPillarsStep'
import PostingPreferencesStep from './steps/PostingPreferencesStep'
import ReviewStep from './steps/ReviewStep'

interface Industry {
  id: string
  industry: string
  recommendedPostsPerWeek: number
  recommendedTone: string
  humorAppropriate: boolean
}

interface Company {
  id: string
  name: string
  industry: string | null
  website: string | null
  description: string | null
  logoUrl: string | null
}

interface OnboardingWizardProps {
  company: Company
  industries: Industry[]
  existingIntelligence: any | null
}

export interface OnboardingData {
  // Step 1: Logo & Basics
  logoUrl: string
  description: string
  
  // Step 2: Industry
  selectedIndustry: string
  industryBenchmark: any | null
  
  // Step 3: Brand Personality
  brandPersonality: string[]
  brandVoice: string
  uniqueSellingPoints: string[]
  targetAudience: string
  
  // Step 4: Content Pillars
  contentPillars: {
    name: string
    description: string
    topics: string[]
    isActive: boolean
  }[]
  
  // Step 5: Posting Preferences
  postsPerWeek: number
  preferredDays: string[]
  preferredTimes: Record<string, string[]>
  timezone: string
  humorEnabled: boolean
  humorDays: string[]
  defaultTone: string
  
  // Step 6: Goals
  primaryGoals: string[]
}

const STEPS = [
  { id: 1, name: 'Basics', icon: ImageIcon },
  { id: 2, name: 'Industry', icon: Building2 },
  { id: 3, name: 'Brand', icon: Palette },
  { id: 4, name: 'Pillars', icon: LayoutGrid },
  { id: 5, name: 'Schedule', icon: Calendar },
  { id: 6, name: 'Review', icon: CheckCircle }
]

export default function OnboardingWizard({ 
  company, 
  industries,
  existingIntelligence 
}: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [data, setData] = useState<OnboardingData>({
    // Step 1: Logo & Basics
    logoUrl: company.logoUrl || '',
    description: company.description || '',
    
    // Step 2: Industry
    selectedIndustry: company.industry || '',
    industryBenchmark: null,
    
    // Step 3: Brand Personality
    brandPersonality: existingIntelligence?.brandPersonality || [],
    brandVoice: existingIntelligence?.brandVoice || '',
    uniqueSellingPoints: existingIntelligence?.uniqueSellingPoints || [],
    targetAudience: existingIntelligence?.targetAudience || '',
    
    // Step 4: Content Pillars
    contentPillars: [],
    
    // Step 5: Posting Preferences
    postsPerWeek: existingIntelligence?.postsPerWeek || 4,
    preferredDays: existingIntelligence?.preferredDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    preferredTimes: existingIntelligence?.preferredTimes || {},
    timezone: existingIntelligence?.timezone || 'Africa/Johannesburg',
    humorEnabled: existingIntelligence?.humorEnabled ?? true,
    humorDays: existingIntelligence?.humorDays || ['Friday'],
    defaultTone: existingIntelligence?.defaultTone || 'professional',
    
    // Step 6: Goals
    primaryGoals: existingIntelligence?.primaryGoals || []
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
      setError(null)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // 1. Update company with logo and description
      await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: data.logoUrl || null,
          description: data.description || null,
          industry: data.selectedIndustry
        })
      })

      // 2. Create/Update Company Intelligence
      const intelligencePayload = {
        companyId: company.id,
        brandPersonality: data.brandPersonality,
        brandVoice: data.brandVoice,
        uniqueSellingPoints: data.uniqueSellingPoints,
        targetAudience: data.targetAudience,
        primaryGoals: data.primaryGoals,
        defaultTone: data.defaultTone,
        humorEnabled: data.humorEnabled,
        humorDays: data.humorDays,
        humorTimes: ['12:00', '17:00'],
        postsPerWeek: data.postsPerWeek,
        preferredDays: data.preferredDays,
        preferredTimes: data.preferredTimes,
        timezone: data.timezone,
        industryHashtags: data.industryBenchmark?.topHashtags || [],
        primaryKeywords: data.industryBenchmark?.seoKeywords || [],
        industryBenchmarks: data.industryBenchmark ? {
          industry: data.selectedIndustry,
          optimalPostsMin: data.industryBenchmark.optimalPostsMin,
          optimalPostsMax: data.industryBenchmark.optimalPostsMax,
          platformPriority: data.industryBenchmark.platformPriority,
          suggestedThemes: data.industryBenchmark.suggestedThemes,
          avgEngagementRate: data.industryBenchmark.avgEngagementRate
        } : null,
        onboardingCompleted: true
      }

      const intelligenceRes = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intelligencePayload)
      })

      if (!intelligenceRes.ok) {
        const err = await intelligenceRes.json()
        throw new Error(err.error || 'Failed to save intelligence')
      }

      // 3. Create Content Pillars
      for (const pillar of data.contentPillars) {
        if (pillar.isActive) {
          await fetch('/api/intelligence/pillars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId: company.id,
              name: pillar.name,
              description: pillar.description,
              topics: pillar.topics,
              keywords: [],
              contentTypes: ['post', 'carousel', 'video'],
              frequencyWeight: 1.0,
              isActive: true
            })
          })
        }
      }

      // Success - redirect to company page
      router.push(`/companies/${company.id}`)
      router.refresh()
      
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <LogoBasicsStep 
            data={{ logoUrl: data.logoUrl, description: data.description }}
            updateData={updateData}
            companyId={company.id}        // ✅ ADDED THIS LINE
            companyName={company.name}
            companyWebsite={company.website}
          />
        )
      case 2:
        return (
          <IndustryStep 
            data={data} 
            updateData={updateData}
            industries={industries}
            companyName={company.name}
          />
        )
      case 3:
        return (
          <BrandPersonalityStep 
            data={data} 
            updateData={updateData}
            companyName={company.name}
          />
        )
      case 4:
        return (
          <ContentPillarsStep 
            data={data} 
            updateData={updateData}
          />
        )
      case 5:
        return (
          <PostingPreferencesStep 
            data={data} 
            updateData={updateData}
          />
        )
      case 6:
        return (
          <ReviewStep 
            data={data}
            companyName={company.name}
          />
        )
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true // Logo & description are optional
      case 2:
        return data.selectedIndustry !== ''
      case 3:
        return data.brandPersonality.length > 0
      case 4:
        return data.contentPillars.filter(p => p.isActive).length > 0
      case 5:
        return data.preferredDays.length > 0 && data.postsPerWeek > 0
      case 6:
        return true
      default:
        return false
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 shadow-sm border border-[var(--border-default)]">
        <div className="flex items-center justify-between overflow-x-auto">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                        : isCompleted 
                          ? 'bg-green-500 text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isActive ? 'text-brand-600 dark:text-brand-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-tertiary)]'}
                  `}>
                    {step.name}
                  </span>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div 
                    className={`
                      w-8 md:w-16 h-1 mx-2 rounded-full transition-all flex-shrink-0
                      ${currentStep > step.id ? 'bg-green-500' : 'bg-[var(--bg-tertiary)]'}
                    `}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-8 shadow-sm border border-[var(--border-default)] min-h-[400px]">
        {renderStep()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            ${currentStep === 1 
              ? 'text-[var(--text-tertiary)] cursor-not-allowed' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {currentStep < STEPS.length ? (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all
              ${canProceed()
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/25'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
              }
            `}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-medium hover:from-brand-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Complete Setup
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}