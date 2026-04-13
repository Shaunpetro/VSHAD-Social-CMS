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
  Globe,
  Palette,
  LayoutGrid,
  Calendar,
  Target
} from 'lucide-react'
import LogoCropper from '@/components/ui/LogoCropper'
import CurrentAnalysisCard from '@/components/intelligence/CurrentAnalysisCard'

interface Intelligence {
  id: string
  dataSources: unknown
  lastAnalyzedAt: string | null
  analysisVersion: number
  aiConfidenceScore: number | null
  extractedIndustries: unknown
  extractedServices: unknown
  extractedUSPs: unknown
  extractedAudience: unknown
  primaryBusinessGoal: string | null
  industriesConfirmed: boolean
  servicesConfirmed: boolean
  uspsConfirmed: boolean
  audienceConfirmed: boolean
  voiceConfirmed: boolean
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

export default function CompanySettingsClient({ company, industries }: CompanySettingsClientProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [name, setName] = useState(company.name)
  const [website, setWebsite] = useState(company.website || '')
  const [description, setDescription] = useState(company.description || '')
  const [industry, setIndustry] = useState(company.industry || '')
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '')

  // Logo upload state
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [uploading, setUploading] = useState(false)

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
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          website: website.trim() || null,
          description: description.trim() || null,
          industry: industry || null,
          logoUrl: logoUrl || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to save')
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

  // Transform intelligence data for the card
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
            <p className="text-sm text-[var(--text-secondary)]">Edit your company profile and preferences</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-lg shadow-brand-500/25"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Changes'}
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
          Settings saved successfully!
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid gap-6">
        {/* Basic Info Card */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Building2 size={18} />
              Basic Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Logo */}
            <div className="flex items-start gap-6">
              <div className="relative group">
                {logoUrl ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[var(--border-default)]">
                    <Image src={logoUrl} alt={name} fill className="object-cover" />
                    <button
                      onClick={() => setLogoUrl('')}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
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
                    {uploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </span>
                </label>
                <p className="text-xs text-[var(--text-tertiary)] mt-2">PNG, JPG or GIF • Max 10MB</p>
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
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                  placeholder="example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select industry...</option>
                {industries.map((ind) => (
                  <option key={ind.id} value={ind.industry}>{ind.industry}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your company..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            </div>
          </div>
        </div>

        {/* AI Intelligence Card */}
        <CurrentAnalysisCard
          companyId={company.id}
          companyName={company.name}
          intelligence={intelligenceData}
          onRefresh={handleReanalyzeComplete}
        />

        {/* Quick Links Card */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <h2 className="font-semibold text-[var(--text-primary)]">Edit Other Settings</h2>
          </div>
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => router.push(`/companies/${company.id}/onboarding`)}
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <Palette size={20} className="text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Brand Voice</p>
                <p className="text-xs text-[var(--text-tertiary)]">Edit personality & tone</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push(`/companies/${company.id}/onboarding`)}
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <LayoutGrid size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Content Pillars</p>
                <p className="text-xs text-[var(--text-tertiary)]">Edit topics & themes</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push(`/companies/${company.id}/onboarding`)}
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Posting Schedule</p>
                <p className="text-xs text-[var(--text-tertiary)]">Edit days & times</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push(`/companies/${company.id}/platforms`)}
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Target size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Platforms</p>
                <p className="text-xs text-[var(--text-tertiary)]">Manage connections</p>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-red-500/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/10 bg-red-500/5">
            <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text-primary)]">Delete Company</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Permanently delete this company and all its data
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
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete Company
              </button>
            </div>
          </div>
        </div>
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
    </div>
  )
}