// apps/web/src/app/(dashboard)/companies/[id]/settings/CompanySettingsClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import LogoCropper from '@/components/ui/LogoCropper'
import {
  Company,
  Industry,
  ContentPillar,
  IndustryItem,
  TabId,
  TABS,
  parseExtractedIndustries,
  parsePreferredTimes,
} from './constants'
import {
  CompanyInfoTab,
  BrandVoiceTab,
  ContentStrategyTab,
  ScheduleTab,
  AutomationTab,
  DangerZoneTab,
  PillarModal,
} from './tabs'

// ============================================
// PROPS
// ============================================

interface CompanySettingsClientProps {
  company: Company
  industries: Industry[]
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CompanySettingsClient({ company }: CompanySettingsClientProps) {
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

  // ===== Industries State =====
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryItem[]>(() => {
    const extracted = parseExtractedIndustries(company.intelligence?.extractedIndustries)
    if (extracted.length > 0) return extracted
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
  const [postsPerWeek, setPostsPerWeek] = useState(company.intelligence?.postsPerWeek || 4)
  const [preferredDays, setPreferredDays] = useState<string[]>(
    company.intelligence?.preferredDays || ['monday', 'wednesday', 'friday']
  )
  const [preferredTimes, setPreferredTimes] = useState<string[]>(() =>
    parsePreferredTimes(company.intelligence?.preferredTimes)
  )
  const [timezone, setTimezone] = useState(company.intelligence?.timezone || 'Africa/Johannesburg')

  // ===== Automation State =====
  const [autoApprove, setAutoApprove] = useState(company.intelligence?.autoApprove || false)

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
      // Save company basic info
      const companyRes = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          website: website.trim() || null,
          description: description.trim() || null,
          industry: selectedIndustries[0]?.name || null,
          logoUrl: logoUrl || null,
        }),
      })

      if (!companyRes.ok) {
        const data = await companyRes.json()
        throw new Error(data.message || data.error || 'Failed to save company info')
      }

      // Save intelligence settings
      if (company.intelligence) {
        const intelligenceRes = await fetch(`/api/companies/${company.id}/intelligence`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extractedIndustries: selectedIndustries.map(ind => ({
              code: ind.code,
              name: ind.name,
              category: ind.category,
              confidence: ind.confidence || 1.0,
            })),
            industriesConfirmed: true,
            brandPersonality,
            defaultTone,
            uniqueSellingPoints,
            targetAudience: targetAudience.trim() || null,
            postsPerWeek,
            preferredDays,
            preferredTimes,
            timezone,
            autoApprove,
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
          throw new Error(data.message || data.error || 'Failed to save intelligence settings')
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

  const handleReanalyzeComplete = () => router.refresh()

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
      setContentPillars(contentPillars.map(p => p.id === editingPillar.id ? editingPillar : p))
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
    setContentPillars(contentPillars.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))
  }

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
        {activeTab === 'company' && (
          <CompanyInfoTab
            company={company}
            name={name}
            setName={setName}
            website={website}
            setWebsite={setWebsite}
            description={description}
            setDescription={setDescription}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            logoError={logoError}
            setLogoError={setLogoError}
            selectedIndustries={selectedIndustries}
            setSelectedIndustries={setSelectedIndustries}
            uploading={uploading}
            handleFileSelect={handleFileSelect}
            onReanalyzeComplete={handleReanalyzeComplete}
          />
        )}

        {activeTab === 'brand' && (
          <BrandVoiceTab
            brandPersonality={brandPersonality}
            setBrandPersonality={setBrandPersonality}
            defaultTone={defaultTone}
            setDefaultTone={setDefaultTone}
            uniqueSellingPoints={uniqueSellingPoints}
            setUniqueSellingPoints={setUniqueSellingPoints}
            targetAudience={targetAudience}
            setTargetAudience={setTargetAudience}
          />
        )}

        {activeTab === 'content' && (
          <ContentStrategyTab
            contentPillars={contentPillars}
            onAddPillar={handleAddPillar}
            onEditPillar={handleEditPillar}
            onDeletePillar={handleDeletePillar}
            onTogglePillarActive={handleTogglePillarActive}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab
            company={company}
            postsPerWeek={postsPerWeek}
            setPostsPerWeek={setPostsPerWeek}
            preferredDays={preferredDays}
            setPreferredDays={setPreferredDays}
            preferredTimes={preferredTimes}
            setPreferredTimes={setPreferredTimes}
            timezone={timezone}
            setTimezone={setTimezone}
          />
        )}

        {activeTab === 'automation' && (
          <AutomationTab
            company={company}
            autoApprove={autoApprove}
            setAutoApprove={setAutoApprove}
          />
        )}

        {activeTab === 'danger' && (
          <DangerZoneTab
            company={company}
            setError={setError}
          />
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
        <PillarModal
          pillar={editingPillar}
          setPillar={setEditingPillar}
          onSave={handleSavePillar}
          onClose={() => {
            setShowPillarModal(false)
            setEditingPillar(null)
          }}
        />
      )}
    </div>
  )
}