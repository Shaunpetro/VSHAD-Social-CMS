// apps/web/src/components/onboarding/steps/AnalysisLoadingStep.tsx

'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  Linkedin,
  FileText,
  PenLine,
  CheckCircle2,
  Loader2,
  XCircle,
  Sparkles,
  Brain,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface AnalysisLoadingStepProps {
  companyName: string
  selectedSources: string[]
  onComplete: (success: boolean, error?: string) => void
  analysisStatus: {
    stage: 'extracting' | 'analyzing' | 'complete' | 'error'
    progress: number
    currentSource?: string
    sourcesComplete: string[]
    sourcesFailed: string[]
    error?: string
  }
}

// ============================================
// HELPER
// ============================================

const SOURCE_CONFIG = {
  website: { icon: Globe, label: 'Website', color: 'text-brand-500' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-[#0077B5]' },
  pdf: { icon: FileText, label: 'PDF Document', color: 'text-red-500' },
  manual: { icon: PenLine, label: 'Description', color: 'text-purple-500' },
}

const ANALYSIS_STAGES = [
  { key: 'extracting', label: 'Extracting content', icon: Globe },
  { key: 'analyzing', label: 'AI Analysis', icon: Brain },
  { key: 'complete', label: 'Complete', icon: CheckCircle2 },
]

// ============================================
// COMPONENT
// ============================================

export default function AnalysisLoadingStep({
  companyName,
  selectedSources,
  onComplete,
  analysisStatus,
}: AnalysisLoadingStepProps) {
  const [dots, setDots] = useState('')

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Get stage index for progress
  const stageIndex = ANALYSIS_STAGES.findIndex(s => s.key === analysisStatus.stage)
  const overallProgress = analysisStatus.stage === 'complete' 
    ? 100 
    : analysisStatus.stage === 'error'
    ? analysisStatus.progress
    : Math.min(95, analysisStatus.progress)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
          {analysisStatus.stage === 'error' ? (
            <XCircle size={40} className="text-white" />
          ) : analysisStatus.stage === 'complete' ? (
            <CheckCircle2 size={40} className="text-white" />
          ) : (
            <Sparkles size={40} className="text-white animate-pulse" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {analysisStatus.stage === 'error' 
            ? 'Analysis Failed'
            : analysisStatus.stage === 'complete'
            ? 'Analysis Complete!'
            : `Analyzing ${companyName}${dots}`
          }
        </h2>
        
        <p className="text-[var(--text-secondary)] mt-2">
          {analysisStatus.stage === 'error'
            ? 'We encountered an issue while analyzing your company'
            : analysisStatus.stage === 'complete'
            ? "We've learned about your business. Review the findings next."
            : analysisStatus.stage === 'extracting'
            ? 'Reading content from your data sources...'
            : 'Our AI is understanding your business...'
          }
        </p>
      </div>

      {/* Main Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Progress</span>
          <span className="font-medium text-[var(--text-primary)]">{overallProgress}%</span>
        </div>
        <div className="h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              analysisStatus.stage === 'error' 
                ? 'bg-red-500' 
                : analysisStatus.stage === 'complete'
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-brand-500 to-purple-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Source Progress */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          Data Sources
        </h3>
        
        <div className="space-y-3">
          {selectedSources.map(source => {
            const config = SOURCE_CONFIG[source as keyof typeof SOURCE_CONFIG]
            if (!config) return null
            
            const Icon = config.icon
            const isComplete = analysisStatus.sourcesComplete.includes(source)
            const isFailed = analysisStatus.sourcesFailed.includes(source)
            const isActive = analysisStatus.currentSource === source
            
            return (
              <div 
                key={source}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-500/10 border border-brand-500/20' 
                    : 'bg-[var(--bg-primary)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isComplete 
                    ? 'bg-green-500/10' 
                    : isFailed 
                    ? 'bg-red-500/10'
                    : isActive
                    ? 'bg-brand-500/10'
                    : 'bg-[var(--bg-tertiary)]'
                }`}>
                  <Icon size={20} className={
                    isComplete 
                      ? 'text-green-500' 
                      : isFailed 
                      ? 'text-red-500'
                      : isActive
                      ? config.color
                      : 'text-[var(--text-tertiary)]'
                  } />
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${
                    isComplete || isActive 
                      ? 'text-[var(--text-primary)]' 
                      : 'text-[var(--text-secondary)]'
                  }`}>
                    {config.label}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {isComplete 
                      ? 'Content extracted'
                      : isFailed
                      ? 'Failed to extract'
                      : isActive
                      ? 'Extracting...'
                      : 'Waiting...'
                    }
                  </p>
                </div>
                
                <div>
                  {isComplete ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : isFailed ? (
                    <XCircle size={20} className="text-red-500" />
                  ) : isActive ? (
                    <Loader2 size={20} className="text-brand-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--border-default)]" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Analysis Stages */}
      <div className="flex items-center justify-center gap-4">
        {ANALYSIS_STAGES.map((stage, index) => {
          const Icon = stage.icon
          const isComplete = stageIndex > index || analysisStatus.stage === 'complete'
          const isActive = stage.key === analysisStatus.stage
          const isError = analysisStatus.stage === 'error' && stage.key === 'analyzing'
          
          return (
            <div key={stage.key} className="flex items-center gap-2">
              {index > 0 && (
                <div className={`w-8 h-0.5 ${
                  isComplete ? 'bg-green-500' : 'bg-[var(--border-default)]'
                }`} />
              )}
              
              <div className={`flex flex-col items-center gap-1 ${
                isActive ? 'scale-110' : ''
              } transition-transform`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isComplete 
                    ? 'bg-green-500 text-white'
                    : isError
                    ? 'bg-red-500 text-white'
                    : isActive
                    ? 'bg-brand-500 text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                }`}>
                  {isActive && !isComplete && !isError ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                <span className={`text-xs ${
                  isComplete || isActive 
                    ? 'text-[var(--text-primary)] font-medium' 
                    : 'text-[var(--text-tertiary)]'
                }`}>
                  {stage.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Error Message */}
      {analysisStatus.stage === 'error' && analysisStatus.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            {analysisStatus.error}
          </p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-2">
            You can try again or continue with manual setup
          </p>
        </div>
      )}

      {/* Fun Facts While Waiting */}
      {analysisStatus.stage !== 'complete' && analysisStatus.stage !== 'error' && (
        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <p className="text-sm text-purple-600 dark:text-purple-400 text-center">
            💡 <span className="font-medium">Did you know?</span> Companies that post consistently 
            see 2x more engagement than those that post sporadically.
          </p>
        </div>
      )}
    </div>
  )
}