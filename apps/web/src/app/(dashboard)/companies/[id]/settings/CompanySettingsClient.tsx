// apps/web/src/app/(dashboard)/companies/[id]/settings/CompanySettingsClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  Building2,
  Palette,
  LayoutGrid,
  Calendar,
  Zap,
  AlertTriangle,
  Plus,
  Clock,
  Globe,
  Sparkles,
  Brain,
  Factory
} from 'lucide-react'
import LogoCropper from '@/components/ui/LogoCropper'
import CurrentAnalysisCard from '@/components/intelligence/CurrentAnalysisCard'
import {
  SelectionCard,
  ToggleSwitch,
  MultiSelectChips,
  TagInput,
  PillarCard,
  SectionCard,
  SliderInput,
  IndustrySelector,
  ContentPillar,
  IndustryItem
} from './components'

// ============================================
// TYPES
// ============================================

interface Intelligence {
  id: string
  companyId: string
  // Posting Preferences
  postsPerWeek: number
  preferredDays: string[]
  preferredTimes: unknown
  timezone: string
  autoApprove: boolean
  // Brand Identity
  brandPersonality: string[]
  defaultTone: string
  uniqueSellingPoints: string[]
  targetAudience: string | null
  primaryGoals: string[]
  // Content Pillars
  contentPillars: ContentPillar[]
  // AI Analysis
  dataSources: unknown
  lastAnalyzedAt: string | null
  analysisVersion: number
  aiConfidenceScore: number | null
  extractedIndustries: unknown
  extractedServices: unknown
  extractedUSPs: unknown
  extractedAudience: unknown
  primaryBusinessGoal: string | null
  // Confirmation Status
  industriesConfirmed: boolean
  servicesConfirmed: boolean
  uspsConfirmed: boolean
  audienceConfirmed: boolean
  voiceConfirmed: boolean
  onboardingCompleted: boolean
  // AI-Learned
  learnedBestDays: string[]
  learnedBestTimes: unknown
  learnedBestPillars: unknown
  // Timestamps
  createdAt: string
  updatedAt: string
}

interface Company {
  id: string
  name: string
  logoUrl: string | null
  website: string | null
  description: string | null
  industry: string | null
  intelligence: Intelligence | null
  platforms: {
    id: string
    type: string
    platformName: string
  }[]
}

interface Industry {
  id: string
  industry: string
}

interface CompanySettingsClientProps {
  company: Company
  industries: Industry[]
}

// ============================================
// CONSTANTS
// ============================================

const TABS = [
  { id: 'company', label: 'Company Info', icon: Building2 },
  { id: 'brand', label: 'Brand Voice', icon: Palette },
  { id: 'content', label: 'Content Strategy', icon: LayoutGrid },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
] as const

type TabId = typeof TABS[number]['id']

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

const TIME_SLOTS = [
  { value: 'early_morning', label: '6-9 AM', description: 'Early risers' },
  { value: 'morning', label: '9-12 PM', description: 'Work hours start' },
  { value: 'lunch', label: '12-2 PM', description: 'Lunch break' },
  { value: 'afternoon', label: '2-5 PM', description: 'Afternoon focus' },
  { value: 'evening', label: '5-8 PM', description: 'After work' },
  { value: 'night', label: '8-11 PM', description: 'Evening wind-down' },
]

const PERSONALITY_TRAITS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'innovative', label: 'Innovative' },
  { value: 'approachable', label: 'Approachable' },
  { value: 'bold', label: 'Bold' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'playful', label: 'Playful' },
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'conversational', label: 'Conversational', description: 'Casual and engaging' },
  { value: 'inspirational', label: 'Inspirational', description: 'Motivating and uplifting' },
  { value: 'educational', label: 'Educational', description: 'Informative and helpful' },
  { value: 'witty', label: 'Witty', description: 'Clever and humorous' },
]

const TIMEZONES = [
  { value: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

const CONTENT_TYPES = [
  { value: 'educational', label: 'Educational' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'behind-the-scenes', label: 'Behind the Scenes' },
  { value: 'industry-news', label: 'Industry News' },
  { value: 'case-study', label: 'Case Study' },
  { value: 'tips', label: 'Tips & How-to' },
  { value: 'storytelling', label: 'Storytelling' },
]

// ============================================
// HELPER: Parse extracted industries from JSON
// ============================================

function parseExtractedIndustries(extracted: unknown): IndustryItem[] {
  if (!extracted) return []
  if (Array.isArray(extracted)) {
    return extracted.map((item: { code?: string; name?: string; category?: string; confidence?: number }) => ({
      code: item.code || `IND_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: item.name || 'Unknown',
      category: item.category,
      confidence: item.confidence,
    }))
  }
  return []
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CompanySettingsClient({ company, industries }: CompanySettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('company')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // ===== Company Info State =====
  const [name, setName] = useState(company.name)
  const [website, setWebsite] = useState(company.website || '')
  const [description, setDescription] = useState(company.description || '')
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '')
  const [logoError, setLogoError] = useState(false)

  // ===== Industries State (Multi-select) =====
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryItem[]>(() => {
    // First try to load from extractedIndustries
    const extracted = parseExtractedIndustries(company.intelligence?.extractedIndustries)
    if (extracted.length > 0) return extracted
    
    // Fallback to legacy single industry field
    if (company.industry) {
      return [{
        code: `LEGACY_${company.industry.replace(/\s+/g, '_').toUpperCase()}`,
        name: company.industry,
        category: 'Legacy',
        confidence: 1.0,
      }]
    }
    return []
  })

  // ===== Brand Voice State =====
  const [brandPersonality, setBrandPersonality] = useState<string[]>(
    company.intelligence?.brandPersonality || []
  )
  const [defaultTone, setDefaultTone] = useState(
    company.intelligence?.defaultTone || 'professional'
  )
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState<string[]>(
    company.intelligence?.uniqueSellingPoints || []
  )
  const [targetAudience, setTargetAudience] = useState(
    company.intelligence?.targetAudience || ''
  )

  // ===== Content Strategy State =====
  const [contentPillars, setContentPillars] = useState<ContentPillar[]>(
    company.intelligence?.contentPillars || []
  )
  const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null)
  const [showPillarModal, setShowPillarModal] = useState(false)

  // ===== Schedule State =====
  const [postsPerWeek, setPostsPerWeek] = useState(
    company.intelligence?.postsPerWeek || 4
  )
  const [preferredDays, setPreferredDays] = useState<string[]>(
    company.intelligence?.preferredDays || ['monday', 'wednesday', 'friday']
  )
  const [preferredTimes, setPreferredTimes] = useState<string[]>(
    (company.intelligence?.preferredTimes as string[]) || ['morning', 'afternoon']
  )
  const [timezone, setTimezone] = useState(
    company.intelligence?.timezone || 'Africa/Johannesburg'
  )

  // ===== Automation State =====
  const [autoApprove, setAutoApprove] = useState(
    company.intelligence?.autoApprove || false
  )

  // ===== Logo Upload State =====
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [uploading, setUploading] = useState(false)

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFile(reader.result as string)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false)
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', croppedBlob, 'logo.png')
      formData.append('companyId', company.id)

      const res = await fetch('/api/companies/logo', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload logo')
      }

      const { logoUrl: newLogoUrl } = await res.json()
      setLogoUrl(newLogoUrl)
      setLogoError(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setUploading(false)
      setSelectedFile(null)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Company name is required')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Save company basic info (keep legacy industry for backward compatibility)
      const companyRes = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          website: website.trim() || null,
          description: description.trim() || null,
          industry: selectedIndustries[0]?.name || null, // Primary industry for legacy
          logoUrl: logoUrl || null,
        }),
      })

      if (!companyRes.ok) {
        const data = await companyRes.json()
        throw new Error(data.message || 'Failed to save company info')
      }

      // Save intelligence settings
      if (company.intelligence) {
        const intelligenceRes = await fetch(`/api/companies/${company.id}/intelligence`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Industries (multi-select)
            extractedIndustries: selectedIndustries.map(ind => ({
              code: ind.code,
              name: ind.name,
              category: ind.category,
              confidence: ind.confidence || 1.0,
            })),
            industriesConfirmed: true,
            // Brand Voice
            brandPersonality,
            defaultTone,
            uniqueSellingPoints,
            targetAudience: targetAudience.trim() || null,
            // Schedule
            postsPerWeek,
            preferredDays,
            preferredTimes,
            timezone,
            // Automation
            autoApprove,
            // Content Pillars
            contentPillars: contentPillars.map(p => ({
              id: p.id.startsWith('new-') ? undefined : p.id,
              name: p.name,
              topics: p.topics,
              contentTypes: p.contentTypes,
              frequencyWeight: p.frequencyWeight,
              isActive: p.isActive,
            })),
          }),
        })

        if (!intelligenceRes.ok) {
          const data = await intelligenceRes.json()
          throw new Error(data.message || 'Failed to save intelligence settings')
        }
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleReanalyzeComplete = () => {
    router.refresh()
  }

  const getInitials = (n: string) => {
    return n.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  }

  // Pillar handlers
  const handleAddPillar = () => {
    setEditingPillar({
      id: `new-${Date.now()}`,
      name: '',
      topics: [],
      contentTypes: [],
      frequencyWeight: 1.0,
      isActive: true,
    })
    setShowPillarModal(true)
  }

  const handleEditPillar = (pillar: ContentPillar) => {
    setEditingPillar({ ...pillar })
    setShowPillarModal(true)
  }

  const handleSavePillar = () => {
    if (!editingPillar || !editingPillar.name.trim()) return

    if (editingPillar.id.startsWith('new-')) {
      setContentPillars([...contentPillars, editingPillar])
    } else {
      setContentPillars(contentPillars.map(p => 
        p.id === editingPillar.id ? editingPillar : p
      ))
    }
    setShowPillarModal(false)
    setEditingPillar(null)
  }

  const handleDeletePillar = (id: string) => {
    if (confirm('Are you sure you want to delete this content pillar?')) {
      setContentPillars(contentPillars.filter(p => p.id !== id))
    }
  }

  const handleTogglePillarActive = (id: string) => {
    setContentPillars(contentPillars.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ))
  }

  // Transform intelligence data for the CurrentAnalysisCard
  const intelligenceData = company.intelligence ? {
    id: company.intelligence.id,
    dataSources: company.intelligence.dataSources as {
      websiteUrl?: string
      linkedinUrl?: string
      pdfUrl?: string
      manualDescription?: string
    } | null,
    lastAnalyzedAt: company.intelligence.lastAnalyzedAt,
    analysisVersion: company.intelligence.analysisVersion,
    aiConfidenceScore: company.intelligence.aiConfidenceScore,
    extractedIndustries: company.intelligence.extractedIndustries as Array<{ name: string; code: string; confidence: number }> | null,
    extractedServices: company.intelligence.extractedServices as Array<{ name: string; category: string }> | null,
    extractedUSPs: company.intelligence.extractedUSPs as Array<{ point: string }> | null,
    extractedAudience: company.intelligence.extractedAudience as { segments: Array<{ name: string }> } | null,
    primaryBusinessGoal: company.intelligence.primaryBusinessGoal,
    industriesConfirmed: company.intelligence.industriesConfirmed,
    servicesConfirmed: company.intelligence.servicesConfirmed,
    uspsConfirmed: company.intelligence.uspsConfirmed,
    audienceConfirmed: company.intelligence.audienceConfirmed,
    voiceConfirmed: company.intelligence.voiceConfirmed,
  } : null

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/companies/${company.id}`)}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Company Settings</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage your company profile, brand voice, and automation</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/25"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
          All settings saved successfully!
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isDanger = tab.id === 'danger'
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                ${isActive
                  ? isDanger
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                  : isDanger
                    ? 'text-red-500/60 hover:text-red-500 hover:bg-red-500/5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* ===== COMPANY INFO TAB ===== */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            <SectionCard
              title="Basic Information"
              description="Your company's public profile"
              icon={<Building2 size={20} className="text-violet-600" />}
            >
              <div className="space-y-6">
                {/* Logo */}
                <div className="flex items-start gap-6">
                  <div className="relative group">
                    {logoUrl && !logoError ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[var(--border-default)] bg-[var(--bg-secondary)]">
                        <Image 
                          src={logoUrl} 
                          alt={name} 
                          fill 
                          className="object-cover"
                          onError={() => setLogoError(true)}
                          unoptimized={logoUrl.includes('blob.vercel-storage.com')}
                        />
                        <button
                          onClick={() => {
                            setLogoUrl('')
                            setLogoError(false)
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">{getInitials(name)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Company Logo</label>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-default)] transition-colors">
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploading ? 'Uploading...' : logoUrl && !logoError ? 'Change Logo' : 'Upload Logo'}
                      </span>
                    </label>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">PNG, JPG or GIF • Max 10MB</p>
                    {logoError && (
                      <p className="text-xs text-amber-500 mt-1">Current logo failed to load. Please upload a new one.</p>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Website</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                {/* Industry - Multi-select */}
                <IndustrySelector
                  selectedIndustries={selectedIndustries}
                  onChange={setSelectedIndustries}
                  label="Industries"
                  maxIndustries={5}
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about your company..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                  />
                </div>
              </div>
            </SectionCard>

            {/* AI Intelligence Card */}
            <CurrentAnalysisCard
              companyId={company.id}
              companyName={company.name}
              intelligence={intelligenceData}
              onRefresh={handleReanalyzeComplete}
            />
          </div>
        )}

        {/* ===== BRAND VOICE TAB ===== */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            <SectionCard
              title="Brand Personality"
              description="Select traits that define your brand's character"
              icon={<Sparkles size={20} className="text-violet-600" />}
            >
              <MultiSelectChips
                options={PERSONALITY_TRAITS}
                selected={brandPersonality}
                onChange={setBrandPersonality}
                columns={4}
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-3">
                Select 2-4 traits that best represent your brand
              </p>
            </SectionCard>

            <SectionCard
              title="Default Tone"
              description="The primary voice used in your content"
              icon={<Palette size={20} className="text-purple-600" />}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TONE_OPTIONS.map((tone) => (
                  <SelectionCard
                    key={tone.value}
                    selected={defaultTone === tone.value}
                    onClick={() => setDefaultTone(tone.value)}
                    size="md"
                  >
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{tone.label}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{tone.description}</p>
                  </SelectionCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Unique Selling Points"
              description="What makes your brand special?"
              icon={<Brain size={20} className="text-pink-600" />}
            >
              <TagInput
                tags={uniqueSellingPoints}
                onChange={setUniqueSellingPoints}
                placeholder="Type a USP and press Enter..."
                maxTags={8}
              />
            </SectionCard>

            <SectionCard
              title="Target Audience"
              description="Who are you trying to reach?"
              icon={<Factory size={20} className="text-blue-600" />}
            >
              <textarea
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Describe your ideal customer or audience (e.g., Mining procurement managers, Government tender offices, Engineering firms in Gauteng...)"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
              />
            </SectionCard>
          </div>
        )}

        {/* ===== CONTENT STRATEGY TAB ===== */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <SectionCard
              title="Content Pillars"
              description="Topics and themes for your content strategy"
              icon={<LayoutGrid size={20} className="text-violet-600" />}
            >
              <div className="space-y-4">
                {contentPillars.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-tertiary)]">
                    <LayoutGrid size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No content pillars yet</p>
                    <p className="text-sm">Add pillars to organize your content strategy</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {contentPillars.map((pillar) => (
                      <PillarCard
                        key={pillar.id}
                        pillar={pillar}
                        onEdit={() => handleEditPillar(pillar)}
                        onDelete={() => handleDeletePillar(pillar.id)}
                        onToggleActive={() => handleTogglePillarActive(pillar.id)}
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={handleAddPillar}
                  className="flex items-center gap-2 px-4 py-3 w-full rounded-xl border-2 border-dashed border-[var(--border-default)] text-[var(--text-secondary)] hover:border-violet-500 hover:text-violet-600 transition-colors"
                >
                  <Plus size={18} />
                  Add Content Pillar
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ===== SCHEDULE TAB ===== */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <SectionCard
              title="Posts Per Week"
              description="How many posts do you want to publish?"
              icon={<Calendar size={20} className="text-violet-600" />}
            >
              <SliderInput
                value={postsPerWeek}
                onChange={setPostsPerWeek}
                min={1}
                max={14}
                label="Weekly posts"
                suffix=" posts"
              />
            </SectionCard>

            <SectionCard
              title="Preferred Days"
              description="Which days should we schedule posts?"
              icon={<Calendar size={20} className="text-green-600" />}
            >
              <MultiSelectChips
                options={DAYS_OF_WEEK}
                selected={preferredDays}
                onChange={setPreferredDays}
                columns={7}
              />
            </SectionCard>

            <SectionCard
              title="Preferred Times"
              description="Best times to reach your audience"
              icon={<Clock size={20} className="text-blue-600" />}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TIME_SLOTS.map((slot) => (
                  <SelectionCard
                    key={slot.value}
                    selected={preferredTimes.includes(slot.value)}
                    onClick={() => {
                      if (preferredTimes.includes(slot.value)) {
                        setPreferredTimes(preferredTimes.filter(t => t !== slot.value))
                      } else {
                        setPreferredTimes([...preferredTimes, slot.value])
                      }
                    }}
                    size="md"
                  >
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{slot.label}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{slot.description}</p>
                  </SelectionCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Timezone"
              description="All scheduled times will use this timezone"
              icon={<Globe size={20} className="text-purple-600" />}
            >
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </SectionCard>

            {/* AI Learned Insights (Read-only) */}
            {company.intelligence?.learnedBestDays && company.intelligence.learnedBestDays.length > 0 && (
              <SectionCard
                title="AI Learned Insights"
                description="Based on your post performance"
                icon={<Brain size={20} className="text-pink-600" />}
              >
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/20">
                  <div className="flex items-start gap-3">
                    <Sparkles size={18} className="text-violet-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Best performing days: {company.intelligence.learnedBestDays.join(', ')}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        This insight is automatically updated based on your post analytics
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ===== AUTOMATION TAB ===== */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <SectionCard
              title="Content Approval"
              description="Control how generated content is handled"
              icon={<Zap size={20} className="text-violet-600" />}
            >
              <div className="space-y-4">
                <ToggleSwitch
                  enabled={autoApprove}
                  onChange={setAutoApprove}
                  label="Auto-Approve Content"
                  description="Generated content will be automatically scheduled without review"
                />

                <div className={`p-4 rounded-xl border-2 transition-all ${
                  autoApprove 
                    ? 'bg-amber-500/5 border-amber-500/20' 
                    : 'bg-green-500/5 border-green-500/20'
                }`}>
                  <div className="flex items-start gap-3">
                    {autoApprove ? (
                      <>
                        <Zap size={18} className="text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            Auto-Schedule Mode Active
                          </p>
                          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                            Content will be automatically scheduled to your calendar without manual review.
                            Great for hands-off automation but less control over individual posts.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <LayoutGrid size={18} className="text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            Review Queue Mode Active
                          </p>
                          <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                            Generated content goes to your review queue for approval before scheduling.
                            Gives you full control over what gets published.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Connected Platforms"
              description="Manage your social media connections"
              icon={<Globe size={20} className="text-blue-600" />}
            >
              {company.platforms.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[var(--text-tertiary)]">No platforms connected</p>
                  <button
                    onClick={() => router.push(`/companies/${company.id}/platforms`)}
                    className="mt-3 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                  >
                    Connect Platforms
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {company.platforms.map((platform) => (
                    <div
                      key={platform.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                          {platform.type.toLowerCase() === 'linkedin' && <span className="text-blue-600 font-bold text-sm">in</span>}
                          {platform.type.toLowerCase() === 'facebook' && <span className="text-blue-500 font-bold text-sm">f</span>}
                          {platform.type.toLowerCase() === 'instagram' && <span className="text-pink-600 font-bold text-sm">ig</span>}
                          {platform.type.toLowerCase() === 'twitter' && <span className="text-sky-500 font-bold text-sm">X</span>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{platform.platformName}</p>
                          <p className="text-xs text-[var(--text-tertiary)] capitalize">{platform.type.toLowerCase()}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-medium">
                        Connected
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => router.push(`/companies/${company.id}/platforms`)}
                    className="flex items-center gap-2 px-4 py-2 w-full rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors text-sm"
                  >
                    <Plus size={16} />
                    Manage Platforms
                  </button>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ===== DANGER ZONE TAB ===== */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div className="bg-[var(--bg-elevated)] rounded-2xl border border-red-500/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-500/10 bg-red-500/5">
                <h2 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Danger Zone
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Delete Company</p>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Permanently delete this company and all its data including posts, analytics, and settings.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
                        fetch(`/api/companies/${company.id}`, { method: 'DELETE' })
                          .then(() => router.push('/companies'))
                          .catch(() => setError('Failed to delete company'))
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors whitespace-nowrap ml-4"
                  >
                    Delete Company
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logo Cropper Modal */}
      {showCropper && selectedFile && (
        <LogoCropper
          imageSrc={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setSelectedFile(null)
          }}
          aspectRatio={1}
        />
      )}

      {/* Pillar Edit Modal */}
      {showPillarModal && editingPillar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-elevated)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">
                {editingPillar.id.startsWith('new-') ? 'Add Content Pillar' : 'Edit Content Pillar'}
              </h3>
              <button
                onClick={() => {
                  setShowPillarModal(false)
                  setEditingPillar(null)
                }}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Pillar Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Pillar Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingPillar.name}
                  onChange={(e) => setEditingPillar({ ...editingPillar, name: e.target.value })}
                  placeholder="e.g., Thought Leadership"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              {/* Topics */}
              <TagInput
                tags={editingPillar.topics}
                onChange={(topics) => setEditingPillar({ ...editingPillar, topics })}
                label="Topics"
                placeholder="Add topics..."
                maxTags={10}
              />

              {/* Content Types */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">Content Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_TYPES.map((type) => (
                    <SelectionCard
                      key={type.value}
                      selected={editingPillar.contentTypes.includes(type.value)}
                      onClick={() => {
                        if (editingPillar.contentTypes.includes(type.value)) {
                          setEditingPillar({
                            ...editingPillar,
                            contentTypes: editingPillar.contentTypes.filter(t => t !== type.value)
                          })
                        } else {
                          setEditingPillar({
                            ...editingPillar,
                            contentTypes: [...editingPillar.contentTypes, type.value]
                          })
                        }
                      }}
                      size="sm"
                    >
                      <span className="text-sm text-[var(--text-primary)]">{type.label}</span>
                    </SelectionCard>
                  ))}
                </div>
              </div>

              {/* Frequency Weight */}
              <SliderInput
                value={editingPillar.frequencyWeight}
                onChange={(frequencyWeight) => setEditingPillar({ ...editingPillar, frequencyWeight })}
                min={0.5}
                max={2}
                step={0.1}
                label="Frequency Weight"
                suffix="x"
              />
              <p className="text-xs text-[var(--text-tertiary)] -mt-3">
                Higher weight = more posts from this pillar
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPillarModal(false)
                  setEditingPillar(null)
                }}
                className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePillar}
                disabled={!editingPillar.name.trim()}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {editingPillar.id.startsWith('new-') ? 'Add Pillar' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}