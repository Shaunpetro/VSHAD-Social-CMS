// apps/web/src/components/onboarding/OnboardingWizard.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  ImageIcon,
  Globe,
  Sparkles,
  CheckCircle,
  Target,
  MessageSquare,
  Calendar, 
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// Step Components
import LogoBasicsStep from './steps/LogoBasicsStep'
import DataSourcesStep, { type DataSourcesData } from './steps/DataSourcesStep'
import AnalysisLoadingStep from './steps/AnalysisLoadingStep'
import ConfirmAnalysisStep from './steps/ConfirmAnalysisStep'
import GoalSelectionStep from './steps/GoalSelectionStep'
import VoiceConfigStep from './steps/VoiceConfigStep'
import PostingPreferencesStep from './steps/PostingPreferencesStep'
import ReviewStep from './steps/ReviewStep'

// Types
import type { CompanyAnalysis } from '@/lib/intelligence/extractors'

// ============================================
// INTERFACES
// ============================================

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
  
  // Step 2: Data Sources
  dataSources: DataSourcesData
  
  // Step 3: Analysis Results (populated by API)
  analysis: CompanyAnalysis | null
  analysisError: string | null
  
  // Step 4: Confirmation Status
  confirmationStatus: {
    industries: boolean
    services: boolean
    usps: boolean
    audience: boolean
    voice: boolean
  }
  confirmedData: {
    industries: any[] | null
    services: any[] | null
    usps: any[] | null
    audience: any | null
    voice: any | null
  }
  
  // Step 5: Business Goal
  primaryBusinessGoal: string | null
  
  // Step 6: Voice Configuration
  voiceConfig: {
    formality: string
    personality: string[]
    technicalLevel: string
  }
  
  // Step 7: Posting Preferences (existing)
  postsPerWeek: number
  preferredDays: string[]
  preferredTimes: Record<string, string[]>
  timezone: string
  humorEnabled: boolean
  humorDays: string[]
  defaultTone: string
  
  // Legacy fields for compatibility
  selectedIndustry: string
  industryBenchmark: any | null
  brandPersonality: string[]
  brandVoice: string
  uniqueSellingPoints: string[]
  targetAudience: string
  contentPillars: {
    name: string
    description: string
    topics: string[]
    isActive: boolean
  }[]
  primaryGoals: string[]
}

// ============================================
// STEP CONFIGURATION
// ============================================

const STEPS = [
  { id: 1, name: 'Basics', icon: ImageIcon },
  { id: 2, name: 'Sources', icon: Globe },
  { id: 3, name: 'Analyzing', icon: Sparkles, isAutoAdvance: true },
  { id: 4, name: 'Confirm', icon: CheckCircle },
  { id: 5, name: 'Goal', icon: Target },
  { id: 6, name: 'Voice', icon: MessageSquare },
  { id: 7, name: 'Schedule', icon: Calendar },
  { id: 8, name: 'Review', icon: ClipboardCheck },
]

// ============================================
// COMPONENT
// ============================================

export default function OnboardingWizard({ 
  company, 
  industries,
  existingIntelligence 
}: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Analysis status for step 3
  const [analysisStatus, setAnalysisStatus] = useState<{
    stage: 'extracting' | 'analyzing' | 'complete' | 'error'
    progress: number
    currentSource?: string
    sourcesComplete: string[]
    sourcesFailed: string[]
    error?: string
  }>({
    stage: 'extracting',
    progress: 0,
    sourcesComplete: [],
    sourcesFailed: [],
  })

  // Initialize data state
  const [data, setData] = useState<OnboardingData>({
    // Step 1: Logo & Basics
    logoUrl: company.logoUrl || '',
    description: company.description || '',
    
    // Step 2: Data Sources
    dataSources: {
      websiteUrl: company.website || '',
      linkedinUrl: '',
      pdfUrl: '',
      pdfFile: null,
      manualDescription: '',
      selectedSources: company.website ? ['website'] : [],
    },
    
    // Step 3: Analysis Results
    analysis: null,
    analysisError: null,
    
    // Step 4: Confirmation Status
    confirmationStatus: {
      industries: false,
      services: false,
      usps: false,
      audience: false,
      voice: false,
    },
    confirmedData: {
      industries: null,
      services: null,
      usps: null,
      audience: null,
      voice: null,
    },
    
    // Step 5: Business Goal
    primaryBusinessGoal: existingIntelligence?.primaryBusinessGoal || null,
    
    // Step 6: Voice Configuration
    voiceConfig: {
      formality: existingIntelligence?.extractedVoice?.formality || 'professional',
      personality: existingIntelligence?.extractedVoice?.personality || [],
      technicalLevel: existingIntelligence?.extractedVoice?.technicalLevel || 'medium',
    },
    
    // Step 7: Posting Preferences
    postsPerWeek: existingIntelligence?.postsPerWeek || 4,
    preferredDays: existingIntelligence?.preferredDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    preferredTimes: existingIntelligence?.preferredTimes || {},
    timezone: existingIntelligence?.timezone || 'Africa/Johannesburg',
    humorEnabled: existingIntelligence?.humorEnabled ?? true,
    humorDays: existingIntelligence?.humorDays || ['Friday'],
    defaultTone: existingIntelligence?.defaultTone || 'professional',
    
    // Legacy fields
    selectedIndustry: company.industry || '',
    industryBenchmark: null,
    brandPersonality: existingIntelligence?.brandPersonality || [],
    brandVoice: existingIntelligence?.brandVoice || '',
    uniqueSellingPoints: existingIntelligence?.uniqueSellingPoints || [],
    targetAudience: existingIntelligence?.targetAudience || '',
    contentPillars: [],
    primaryGoals: existingIntelligence?.primaryGoals || [],
  })

  // Update data helper
  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }, [])

  // ============================================
  // ANALYSIS API CALL (Step 2 → Step 3)
  // ============================================

  const runAnalysis = useCallback(async () => {
    setAnalysisStatus({
      stage: 'extracting',
      progress: 0,
      sourcesComplete: [],
      sourcesFailed: [],
    })

    try {
      // Prepare form data for PDF upload if needed
      let pdfBlobUrl: string | null = null
      
      if (data.dataSources.pdfFile && data.dataSources.selectedSources.includes('pdf')) {
        setAnalysisStatus(prev => ({ ...prev, currentSource: 'pdf', progress: 10 }))
        
        const formData = new FormData()
        formData.append('file', data.dataSources.pdfFile)
        formData.append('companyId', company.id)
        formData.append('type', 'company_profile')
        
        const uploadRes = await fetch('/api/intelligence/upload-document', {
          method: 'POST',
          body: formData,
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          pdfBlobUrl = uploadData.url
          setAnalysisStatus(prev => ({
            ...prev,
            sourcesComplete: [...prev.sourcesComplete, 'pdf'],
            progress: 20,
          }))
        } else {
          setAnalysisStatus(prev => ({
            ...prev,
            sourcesFailed: [...prev.sourcesFailed, 'pdf'],
          }))
        }
      }

      // Update progress for each source
      const sources = data.dataSources.selectedSources.filter(s => s !== 'pdf')
      let progress = 20
      const progressIncrement = 40 / Math.max(sources.length, 1)

      for (const source of sources) {
        setAnalysisStatus(prev => ({ ...prev, currentSource: source, progress }))
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulated delay for UX
        setAnalysisStatus(prev => ({
          ...prev,
          sourcesComplete: [...prev.sourcesComplete, source],
        }))
        progress += progressIncrement
      }

      // Call main analysis endpoint
      setAnalysisStatus(prev => ({ ...prev, stage: 'analyzing', progress: 60 }))

      const analysisPayload = {
        companyId: company.id,
        companyName: company.name,
        dataSources: {
          website: data.dataSources.selectedSources.includes('website') ? data.dataSources.websiteUrl : null,
          linkedin: data.dataSources.selectedSources.includes('linkedin') ? data.dataSources.linkedinUrl : null,
          pdfUrl: data.dataSources.selectedSources.includes('pdf') ? (pdfBlobUrl || data.dataSources.pdfUrl) : null,
          manual: data.dataSources.selectedSources.includes('manual') ? data.dataSources.manualDescription : null,
        },
      }

      setAnalysisStatus(prev => ({ ...prev, progress: 70 }))

      const analysisRes = await fetch('/api/intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisPayload),
      })

      setAnalysisStatus(prev => ({ ...prev, progress: 90 }))

      if (!analysisRes.ok) {
        const err = await analysisRes.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const analysisResult = await analysisRes.json()

      // Update data with analysis results
      updateData({
        analysis: analysisResult.analysis,
        analysisError: null,
        voiceConfig: {
          formality: analysisResult.analysis?.brandVoice?.formality || 'professional',
          personality: analysisResult.analysis?.brandVoice?.personality || [],
          technicalLevel: analysisResult.analysis?.brandVoice?.technicalLevel || 'medium',
        },
      })

      setAnalysisStatus(prev => ({ ...prev, stage: 'complete', progress: 100 }))

      // Auto-advance to next step after short delay
      setTimeout(() => {
        setCurrentStep(4)
      }, 1500)

    } catch (err) {
      console.error('Analysis error:', err)
      setAnalysisStatus(prev => ({
        ...prev,
        stage: 'error',
        error: err instanceof Error ? err.message : 'Analysis failed',
      }))
      updateData({ analysisError: err instanceof Error ? err.message : 'Analysis failed' })
    }
  }, [company.id, company.name, data.dataSources, updateData])

  // Trigger analysis when entering step 3
  useEffect(() => {
    if (currentStep === 3 && analysisStatus.stage === 'extracting' && analysisStatus.progress === 0) {
      runAnalysis()
    }
  }, [currentStep, analysisStatus.stage, analysisStatus.progress, runAnalysis])

  // ============================================
  // NAVIGATION
  // ============================================

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
      setError(null)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      // Skip back over the auto-advance step
      if (currentStep === 4) {
        setCurrentStep(2)
      } else {
        setCurrentStep(prev => prev - 1)
      }
      setError(null)
    }
  }

  // Handle confirmation from ConfirmAnalysisStep
  const handleConfirmSection = (section: string, confirmed: boolean, edits?: any) => {
    updateData({
      confirmationStatus: {
        ...data.confirmationStatus,
        [section]: confirmed,
      },
      confirmedData: {
        ...data.confirmedData,
        [section]: edits || (data.analysis ? (data.analysis as any)[section] : null),
      },
    })
  }

  // ============================================
  // VALIDATION
  // ============================================

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true // Logo & description are optional
      case 2:
        // Must have at least one valid source
        const ds = data.dataSources
        return (
          (ds.selectedSources.includes('website') && ds.websiteUrl) ||
          (ds.selectedSources.includes('linkedin') && ds.linkedinUrl) ||
          (ds.selectedSources.includes('pdf') && (ds.pdfFile || ds.pdfUrl)) ||
          (ds.selectedSources.includes('manual') && ds.manualDescription?.trim())
        )
      case 3:
        // Analysis step - auto advances
        return analysisStatus.stage === 'complete'
      case 4:
        // Must confirm at least industries
        return data.confirmationStatus.industries
      case 5:
        // Must select a goal
        return data.primaryBusinessGoal !== null
      case 6:
        // Voice config - at least formality should be set
        return data.voiceConfig.formality !== ''
      case 7:
        return data.preferredDays.length > 0 && data.postsPerWeek > 0
      case 8:
        return true
      default:
        return false
    }
  }

  // ============================================
  // SUBMIT
  // ============================================

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
          industry: data.confirmedData.industries?.[0]?.name || data.selectedIndustry,
        })
      })

      // 2. Confirm intelligence with all data
      const confirmPayload = {
        companyId: company.id,
        
        // Confirmed data from AI analysis
        extractedIndustries: data.confirmedData.industries || data.analysis?.industries,
        extractedServices: data.confirmedData.services || data.analysis?.services,
        extractedUSPs: data.confirmedData.usps || data.analysis?.uniqueSellingPoints,
        extractedAudience: data.confirmedData.audience || data.analysis?.targetAudience,
        extractedVoice: data.voiceConfig,
        
        // Confirmation flags
        industriesConfirmed: data.confirmationStatus.industries,
        servicesConfirmed: data.confirmationStatus.services,
        uspsConfirmed: data.confirmationStatus.usps,
        audienceConfirmed: data.confirmationStatus.audience,
        voiceConfirmed: data.confirmationStatus.voice,
        
        // Business goal
        primaryBusinessGoal: data.primaryBusinessGoal,
        
        // Posting preferences
        defaultTone: data.defaultTone,
        humorEnabled: data.humorEnabled,
        humorDays: data.humorDays,
        humorTimes: ['12:00', '17:00'],
        postsPerWeek: data.postsPerWeek,
        preferredDays: data.preferredDays,
        preferredTimes: data.preferredTimes,
        timezone: data.timezone,
        
        // Mark as complete
        onboardingCompleted: true,
      }

      const confirmRes = await fetch('/api/intelligence/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmPayload),
      })

      if (!confirmRes.ok) {
        const err = await confirmRes.json()
        throw new Error(err.error || 'Failed to save intelligence')
      }

      // 3. Auto-generate content pillars from confirmed services
      const services = data.confirmedData.services || data.analysis?.services || []
      for (const service of services.slice(0, 5)) { // Max 5 pillars
        if (service.isCore) {
          await fetch('/api/intelligence/pillars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId: company.id,
              name: service.name,
              description: service.description || `Content about ${service.name}`,
              topics: service.keywords || [],
              keywords: service.keywords || [],
              contentTypes: ['post', 'carousel', 'video'],
              frequencyWeight: 1.0,
              isActive: true,
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

  // ============================================
  // RENDER STEPS
  // ============================================

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <LogoBasicsStep 
            data={{ logoUrl: data.logoUrl, description: data.description }}
            updateData={updateData}
            companyId={company.id}
            companyName={company.name}
            companyWebsite={company.website}
          />
        )
      
      case 2:
        return (
          <DataSourcesStep 
            data={data.dataSources}
            updateData={(updates) => updateData({ dataSources: { ...data.dataSources, ...updates } })}
            companyName={company.name}
          />
        )
      
      case 3:
        return (
          <AnalysisLoadingStep 
            companyName={company.name}
            selectedSources={data.dataSources.selectedSources}
            onComplete={(success, error) => {
              if (success) {
                setCurrentStep(4)
              } else if (error) {
                updateData({ analysisError: error })
              }
            }}
            analysisStatus={analysisStatus}
          />
        )
      
      case 4:
        if (!data.analysis) {
          return (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4 text-amber-500" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Analysis Not Available
              </h3>
              <p className="text-[var(--text-secondary)] mt-2">
                Go back and run the analysis first, or continue with manual setup.
              </p>
            </div>
          )
        }
        return (
          <ConfirmAnalysisStep 
            analysis={data.analysis}
            onConfirm={handleConfirmSection}
            confirmationStatus={data.confirmationStatus}
          />
        )
      
      case 5:
        return (
          <GoalSelectionStep 
            selectedGoal={data.primaryBusinessGoal}
            onSelectGoal={(goal) => updateData({ primaryBusinessGoal: goal })}
            companyName={company.name}
          />
        )
      
      case 6:
        return (
          <VoiceConfigStep 
            initialVoice={data.analysis?.brandVoice ? {
              formality: data.analysis.brandVoice.formality,
              personality: data.analysis.brandVoice.personality,
              technicalLevel: data.analysis.brandVoice.technicalLevel,
            } : undefined}
            onUpdate={(voice) => updateData({ voiceConfig: voice })}
            companyName={company.name}
          />
        )
      
      case 7:
        return (
          <PostingPreferencesStep 
            data={data} 
            updateData={updateData}
          />
        )
      
      case 8:
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

  // ============================================
  // RENDER
  // ============================================

  const isAutoAdvanceStep = STEPS[currentStep - 1]?.isAutoAdvance

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
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all
                      ${isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                        : isCompleted 
                          ? 'bg-green-500 text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <span className={`
                    mt-2 text-xs font-medium whitespace-nowrap hidden sm:block
                    ${isActive ? 'text-brand-600 dark:text-brand-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-tertiary)]'}
                  `}>
                    {step.name}
                  </span>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div 
                    className={`
                      w-4 sm:w-8 md:w-12 h-1 mx-1 sm:mx-2 rounded-full transition-all flex-shrink-0
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
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 sm:p-8 shadow-sm border border-[var(--border-default)] min-h-[400px]">
        {renderStep()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-600 dark:text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      {!isAutoAdvanceStep && (
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
      )}

      {/* Skip Analysis Option (shown only on error) */}
      {currentStep === 3 && analysisStatus.stage === 'error' && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setAnalysisStatus({
                stage: 'extracting',
                progress: 0,
                sourcesComplete: [],
                sourcesFailed: [],
              })
              runAnalysis()
            }}
            className="px-6 py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => setCurrentStep(7)} // Skip to posting preferences
            className="px-6 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Skip & Continue Manually
          </button>
        </div>
      )}
    </div>
  )
}