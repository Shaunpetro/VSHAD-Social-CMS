// apps/web/src/components/onboarding/steps/DataSourcesStep.tsx

'use client'

import { useState, useRef } from 'react'
import {
  Globe,
  Linkedin,
  FileText,
  Upload,
  Link as LinkIcon,
  PenLine,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
  Loader2,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface DataSourcesData {
  websiteUrl: string
  linkedinUrl: string
  pdfUrl: string
  pdfFile: File | null
  manualDescription: string
  selectedSources: string[]
}

interface DataSourcesStepProps {
  data: DataSourcesData
  updateData: (updates: Partial<DataSourcesData>) => void
  companyName: string
}

// ============================================
// COMPONENT
// ============================================

export default function DataSourcesStep({
  data,
  updateData,
  companyName,
}: DataSourcesStepProps) {
  const [pdfInputMode, setPdfInputMode] = useState<'upload' | 'link'>('upload')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Toggle source selection
  const toggleSource = (source: string) => {
    const current = data.selectedSources || []
    const updated = current.includes(source)
      ? current.filter(s => s !== source)
      : [...current, source]
    updateData({ selectedSources: updated })
  }

  // Validate URL format
  const validateUrl = (url: string, type: string): boolean => {
    if (!url) return true // Empty is valid (optional)
    
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      
      if (type === 'linkedin' && !parsed.hostname.includes('linkedin.com')) {
        setUrlErrors(prev => ({ ...prev, linkedin: 'Must be a LinkedIn URL' }))
        return false
      }
      
      if (type === 'pdf' && !url.toLowerCase().endsWith('.pdf')) {
        setUrlErrors(prev => ({ ...prev, pdf: 'Must be a PDF file URL' }))
        return false
      }
      
      setUrlErrors(prev => ({ ...prev, [type]: '' }))
      return true
    } catch {
      setUrlErrors(prev => ({ ...prev, [type]: 'Invalid URL format' }))
      return false
    }
  }

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUrlErrors(prev => ({ ...prev, pdfFile: 'Only PDF files are allowed' }))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUrlErrors(prev => ({ ...prev, pdfFile: 'File size must be under 10MB' }))
      return
    }

    setUrlErrors(prev => ({ ...prev, pdfFile: '' }))
    updateData({ pdfFile: file })
    
    // Auto-select PDF source
    if (!data.selectedSources.includes('pdf')) {
      toggleSource('pdf')
    }
  }

  // Calculate data quality indicator
  const selectedCount = data.selectedSources?.length || 0
  const dataQuality = selectedCount >= 3 ? 'high' : selectedCount >= 2 ? 'medium' : selectedCount >= 1 ? 'low' : 'none'
  const qualityPercentage = Math.min(100, selectedCount * 30 + 10)

  // Check if at least one source is valid
  const hasValidSource = (
    (data.selectedSources.includes('website') && data.websiteUrl) ||
    (data.selectedSources.includes('linkedin') && data.linkedinUrl) ||
    (data.selectedSources.includes('pdf') && (data.pdfFile || data.pdfUrl)) ||
    (data.selectedSources.includes('manual') && data.manualDescription?.trim())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Help us understand {companyName}
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">
          Select your data sources. More sources = better content!
        </p>
      </div>

      {/* Data Quality Indicator */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Data Sources Selected: {selectedCount}
          </span>
          <span className={`text-sm font-medium ${
            dataQuality === 'high' ? 'text-green-500' :
            dataQuality === 'medium' ? 'text-amber-500' :
            dataQuality === 'low' ? 'text-orange-500' :
            'text-[var(--text-tertiary)]'
          }`}>
            Expected Accuracy: {qualityPercentage}%
          </span>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              dataQuality === 'high' ? 'bg-green-500' :
              dataQuality === 'medium' ? 'bg-amber-500' :
              dataQuality === 'low' ? 'bg-orange-500' :
              'bg-[var(--border-default)]'
            }`}
            style={{ width: `${qualityPercentage}%` }}
          />
        </div>
      </div>

      {/* Source Options */}
      <div className="space-y-4">
        
        {/* Website Source */}
        <div 
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            data.selectedSources.includes('website')
              ? 'border-brand-500 bg-brand-500/5'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
          }`}
          onClick={() => toggleSource('website')}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              data.selectedSources.includes('website')
                ? 'bg-brand-500 text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
            }`}>
              <Globe size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">Website</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  data.selectedSources.includes('website')
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-[var(--border-default)]'
                }`}>
                  {data.selectedSources.includes('website') && (
                    <CheckCircle2 size={16} className="text-white" />
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                We'll read your about page, services, and projects
              </p>
              
              {data.selectedSources.includes('website') && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <input
                    type="url"
                    value={data.websiteUrl}
                    onChange={e => {
                      updateData({ websiteUrl: e.target.value })
                      validateUrl(e.target.value, 'website')
                    }}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  {urlErrors.website && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {urlErrors.website}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LinkedIn Source */}
        <div 
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            data.selectedSources.includes('linkedin')
              ? 'border-brand-500 bg-brand-500/5'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
          }`}
          onClick={() => toggleSource('linkedin')}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              data.selectedSources.includes('linkedin')
                ? 'bg-[#0077B5] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
            }`}>
              <Linkedin size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">LinkedIn Company Page</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  data.selectedSources.includes('linkedin')
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-[var(--border-default)]'
                }`}>
                  {data.selectedSources.includes('linkedin') && (
                    <CheckCircle2 size={16} className="text-white" />
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Great for understanding your professional positioning
              </p>
              
              {data.selectedSources.includes('linkedin') && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <input
                    type="url"
                    value={data.linkedinUrl}
                    onChange={e => {
                      updateData({ linkedinUrl: e.target.value })
                      validateUrl(e.target.value, 'linkedin')
                    }}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  {urlErrors.linkedin && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {urlErrors.linkedin}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PDF Source */}
        <div 
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            data.selectedSources.includes('pdf')
              ? 'border-brand-500 bg-brand-500/5'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
          }`}
          onClick={() => toggleSource('pdf')}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              data.selectedSources.includes('pdf')
                ? 'bg-red-500 text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
            }`}>
              <FileText size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">Company Profile PDF</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  data.selectedSources.includes('pdf')
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-[var(--border-default)]'
                }`}>
                  {data.selectedSources.includes('pdf') && (
                    <CheckCircle2 size={16} className="text-white" />
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Capability statements, brochures, company profiles
              </p>
              
              {data.selectedSources.includes('pdf') && (
                <div className="mt-3 space-y-3" onClick={e => e.stopPropagation()}>
                  {/* Toggle between upload and link */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPdfInputMode('upload')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        pdfInputMode === 'upload'
                          ? 'bg-brand-500 text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <Upload size={14} />
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfInputMode('link')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        pdfInputMode === 'link'
                          ? 'bg-brand-500 text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <LinkIcon size={14} />
                      Link
                    </button>
                  </div>

                  {pdfInputMode === 'upload' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      
                      {data.pdfFile ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)]">
                          <FileText size={20} className="text-red-500" />
                          <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                            {data.pdfFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateData({ pdfFile: null })}
                            className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                          >
                            <X size={16} className="text-[var(--text-tertiary)]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full p-4 rounded-lg border-2 border-dashed border-[var(--border-default)] hover:border-brand-500 transition-colors text-center"
                        >
                          <Upload size={24} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
                          <p className="text-sm text-[var(--text-secondary)]">
                            Click to upload PDF (max 10MB)
                          </p>
                        </button>
                      )}
                      
                      {urlErrors.pdfFile && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {urlErrors.pdfFile}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={data.pdfUrl}
                        onChange={e => {
                          updateData({ pdfUrl: e.target.value })
                          validateUrl(e.target.value, 'pdf')
                        }}
                        placeholder="https://yourcompany.com/profile.pdf"
                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      />
                      {urlErrors.pdf && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {urlErrors.pdf}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Description Source */}
        <div 
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            data.selectedSources.includes('manual')
              ? 'border-brand-500 bg-brand-500/5'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
          }`}
          onClick={() => toggleSource('manual')}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              data.selectedSources.includes('manual')
                ? 'bg-purple-500 text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
            }`}>
              <PenLine size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">Describe Your Business</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  data.selectedSources.includes('manual')
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-[var(--border-default)]'
                }`}>
                  {data.selectedSources.includes('manual') && (
                    <CheckCircle2 size={16} className="text-white" />
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Perfect if you don't have an online presence yet
              </p>
              
              {data.selectedSources.includes('manual') && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <textarea
                    value={data.manualDescription}
                    onChange={e => updateData({ manualDescription: e.target.value })}
                    placeholder="Tell us about your business, what services you offer, who your customers are, what makes you different..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {data.manualDescription?.length || 0} characters
                    {data.manualDescription && data.manualDescription.length < 100 && (
                      <span className="text-amber-500 ml-2">
                        (Tip: More detail = better content)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {selectedCount > 0 && !hasValidSource && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Please complete the selected source(s)
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
              Enter the required information for the sources you've selected
            </p>
          </div>
        </div>
      )}

      {/* Tip */}
      {selectedCount === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Select at least one data source
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
              We recommend providing your website and a company profile PDF for best results
            </p>
          </div>
        </div>
      )}
    </div>
  )
}