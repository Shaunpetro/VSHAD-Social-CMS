// apps/web/src/components/onboarding/steps/ConfirmAnalysisStep.tsx

'use client'

import { useState } from 'react'
import {
  Building2,
  Briefcase,
  Trophy,
  Users,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Edit3,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import type { CompanyAnalysis, ExtractedIndustry, ExtractedService, ExtractedUSP } from '@/lib/intelligence/extractors'

// ============================================
// TYPES
// ============================================

interface ConfirmAnalysisStepProps {
  analysis: CompanyAnalysis
  onConfirm: (section: string, confirmed: boolean, edits?: any) => void
  confirmationStatus: {
    industries: boolean
    services: boolean
    usps: boolean
    audience: boolean
    voice: boolean
  }
}

// ============================================
// COMPONENT
// ============================================

export default function ConfirmAnalysisStep({
  analysis,
  onConfirm,
  confirmationStatus,
}: ConfirmAnalysisStepProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('industries')
  const [editingSection, setEditingSection] = useState<string | null>(null)
  
  // Editable state
  const [editedIndustries, setEditedIndustries] = useState<ExtractedIndustry[]>(analysis.industries)
  const [editedServices, setEditedServices] = useState<ExtractedService[]>(analysis.services)
  const [editedUSPs, setEditedUSPs] = useState<ExtractedUSP[]>(analysis.uniqueSellingPoints)

  // Calculate completion
  const confirmedCount = Object.values(confirmationStatus).filter(Boolean).length
  const totalSections = Object.keys(confirmationStatus).length
  const completionPercentage = Math.round((confirmedCount / totalSections) * 100)

  // Toggle section expand
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Confirm section
  const handleConfirm = (section: string) => {
    let edits = undefined
    
    if (section === 'industries' && editingSection === 'industries') {
      edits = editedIndustries
    } else if (section === 'services' && editingSection === 'services') {
      edits = editedServices
    } else if (section === 'usps' && editingSection === 'usps') {
      edits = editedUSPs
    }
    
    onConfirm(section, true, edits)
    setEditingSection(null)
  }

  // Remove item from editable list
  const removeIndustry = (index: number) => {
    setEditedIndustries(prev => prev.filter((_, i) => i !== index))
  }

  const removeService = (index: number) => {
    setEditedServices(prev => prev.filter((_, i) => i !== index))
  }

  const removeUSP = (index: number) => {
    setEditedUSPs(prev => prev.filter((_, i) => i !== index))
  }

  // Section component for reusability
  const SectionCard = ({ 
    id, 
    icon: Icon, 
    title, 
    subtitle, 
    confirmed,
    children 
  }: {
    id: string
    icon: React.ElementType
    title: string
    subtitle: string
    confirmed: boolean
    children: React.ReactNode
  }) => (
    <div className={`rounded-xl border-2 transition-colors ${
      confirmed 
        ? 'border-green-500 bg-green-500/5' 
        : 'border-[var(--border-default)]'
    }`}>
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            confirmed 
              ? 'bg-green-500 text-white' 
              : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
          }`}>
            <Icon size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="text-sm text-[var(--text-tertiary)]">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {confirmed && <CheckCircle2 size={20} className="text-green-500" />}
          {expandedSection === id ? (
            <ChevronUp size={20} className="text-[var(--text-tertiary)]" />
          ) : (
            <ChevronDown size={20} className="text-[var(--text-tertiary)]" />
          )}
        </div>
      </button>
      
      {expandedSection === id && (
        <div className="px-4 pb-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <Sparkles size={32} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Here's What We Learned
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">
          Review and confirm each section. Edit anything that's not quite right.
        </p>
      </div>

      {/* Completion Progress */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Sections Confirmed
          </span>
          <span className="text-sm font-bold text-brand-500">
            {confirmedCount}/{totalSections}
          </span>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Confidence Score */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-500/5 border border-brand-500/20">
        <div className="text-2xl font-bold text-brand-500">
          {Math.round(analysis.confidenceScore * 100)}%
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Analysis Confidence</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Based on {analysis.dataQuality} quality data sources
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        
        {/* Industries Section */}
        <SectionCard
          id="industries"
          icon={Building2}
          title="Industries"
          subtitle={`${editedIndustries.length} detected`}
          confirmed={confirmationStatus.industries}
        >
          <div className="space-y-2">
            {editedIndustries.map((industry, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]"
              >
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-primary)]">
                    {industry.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {industry.category}
                    </span>
                    {industry.cidbGrade && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        CIDB {industry.cidbCode} Level {industry.cidbGrade}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      {Math.round(industry.confidence * 100)}% match
                    </span>
                  </div>
                </div>
                
                {editingSection === 'industries' && (
                  <button
                    type="button"
                    onClick={() => removeIndustry(index)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            {editingSection === 'industries' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditedIndustries(analysis.industries)
                    setEditingSection(null)
                  }}
                  className="flex-1 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirm('industries')}
                  className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  Save & Confirm
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditingSection('industries')}
                  className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirm('industries')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    confirmationStatus.industries
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {confirmationStatus.industries ? '✓ Confirmed' : 'Confirm Industries'}
                </button>
              </>
            )}
          </div>
        </SectionCard>

        {/* Services Section */}
        <SectionCard
          id="services"
          icon={Briefcase}
          title="Services"
          subtitle={`${editedServices.length} detected`}
          confirmed={confirmationStatus.services}
        >
          <div className="space-y-2">
            {editedServices.map((service, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]"
              >
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-primary)]">
                    {service.name}
                  </p>
                  {service.description && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  {service.isCore && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      Core Service
                    </span>
                  )}
                </div>
                
                {editingSection === 'services' && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            {editingSection === 'services' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditedServices(analysis.services)
                    setEditingSection(null)
                  }}
                  className="flex-1 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirm('services')}
                  className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  Save & Confirm
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditingSection('services')}
                  className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirm('services')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    confirmationStatus.services
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {confirmationStatus.services ? '✓ Confirmed' : 'Confirm Services'}
                </button>
              </>
            )}
          </div>
        </SectionCard>

        {/* USPs Section */}
        <SectionCard
          id="usps"
          icon={Trophy}
          title="What Makes You Special"
          subtitle={`${editedUSPs.length} unique selling points`}
          confirmed={confirmationStatus.usps}
        >
          <div className="space-y-2">
            {editedUSPs.map((usp, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]"
              >
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-primary)]">
                    {usp.point}
                  </p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 capitalize">
                    {usp.category}
                  </span>
                </div>
                
                {editingSection === 'usps' && (
                  <button
                    type="button"
                    onClick={() => removeUSP(index)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            {editingSection === 'usps' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditedUSPs(analysis.uniqueSellingPoints)
                    setEditingSection(null)
                  }}
                  className="flex-1 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirm('usps')}
                  className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  Save & Confirm
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditingSection('usps')}
                  className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirm('usps')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    confirmationStatus.usps
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {confirmationStatus.usps ? '✓ Confirmed' : 'Confirm USPs'}
                </button>
              </>
            )}
          </div>
        </SectionCard>

        {/* Audience Section */}
        <SectionCard
          id="audience"
          icon={Users}
          title="Target Audience"
          subtitle={`${analysis.targetAudience.businessType} • ${analysis.targetAudience.primarySectors.slice(0, 2).join(', ')}`}
          confirmed={confirmationStatus.audience}
        >
          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Business Type</p>
              <p className="font-medium text-[var(--text-primary)]">{analysis.targetAudience.businessType}</p>
            </div>
            
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Primary Sectors</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.targetAudience.primarySectors.map((sector, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    {sector}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Decision Makers</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.targetAudience.decisionMakers.map((dm, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    {dm}
                  </span>
                ))}
              </div>
            </div>
            
            {analysis.targetAudience.geographicFocus.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[var(--text-secondary)]">
                  {analysis.targetAudience.geographicFocus.join(', ')}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Summary</p>
              <p className="text-sm text-[var(--text-primary)] mt-1">{analysis.targetAudience.description}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => handleConfirm('audience')}
            className={`w-full py-2 px-4 rounded-lg transition-colors ${
              confirmationStatus.audience
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {confirmationStatus.audience ? '✓ Confirmed' : 'Confirm Audience'}
          </button>
        </SectionCard>

        {/* Voice Section */}
        <SectionCard
          id="voice"
          icon={MessageSquare}
          title="Brand Voice"
          subtitle={`${analysis.brandVoice.formality} • ${analysis.brandVoice.personality.slice(0, 2).join(', ')}`}
          confirmed={confirmationStatus.voice}
        >
          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Formality</p>
              <p className="font-medium text-[var(--text-primary)] capitalize">{analysis.brandVoice.formality}</p>
            </div>
            
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Personality Traits</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.brandVoice.personality.map((trait, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 capitalize">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Technical Level</p>
              <p className="font-medium text-[var(--text-primary)] capitalize">{analysis.brandVoice.technicalLevel}</p>
            </div>
            
            {analysis.brandVoice.traits?.industryTermsUsed && analysis.brandVoice.traits.industryTermsUsed.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Industry Terms Used</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.brandVoice.traits.industryTermsUsed.map((term, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => handleConfirm('voice')}
            className={`w-full py-2 px-4 rounded-lg transition-colors ${
              confirmationStatus.voice
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {confirmationStatus.voice ? '✓ Confirmed' : 'Confirm Voice'}
          </button>
        </SectionCard>
      </div>

      {/* All Confirmed Message */}
      {completionPercentage === 100 && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
          <p className="font-medium text-green-600 dark:text-green-400">
            All sections confirmed!
          </p>
          <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
            Continue to set your business goal
          </p>
        </div>
      )}
    </div>
  )
}