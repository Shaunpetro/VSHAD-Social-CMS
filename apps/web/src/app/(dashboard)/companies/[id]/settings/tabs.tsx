// apps/web/src/app/(dashboard)/companies/[id]/settings/tabs.tsx
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
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
  Factory,
  Loader2
} from 'lucide-react'
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
} from './components'
import {
  Company,
  ContentPillar,
  IndustryItem,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  PERSONALITY_TRAITS,
  TONE_OPTIONS,
  TIMEZONES,
  CONTENT_TYPES,
  getInitials,
} from './constants'

// ============================================
// SHARED TAB PROPS
// ============================================

interface BaseTabProps {
  company: Company
}

// ============================================
// COMPANY INFO TAB
// ============================================

interface CompanyInfoTabProps extends BaseTabProps {
  name: string
  setName: (v: string) => void
  website: string
  setWebsite: (v: string) => void
  description: string
  setDescription: (v: string) => void
  logoUrl: string
  setLogoUrl: (v: string) => void
  logoError: boolean
  setLogoError: (v: boolean) => void
  selectedIndustries: IndustryItem[]
  setSelectedIndustries: (v: IndustryItem[]) => void
  uploading: boolean
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onReanalyzeComplete: () => void
}

export function CompanyInfoTab({
  company,
  name,
  setName,
  website,
  setWebsite,
  description,
  setDescription,
  logoUrl,
  setLogoUrl,
  logoError,
  setLogoError,
  selectedIndustries,
  setSelectedIndustries,
  uploading,
  handleFileSelect,
  onReanalyzeComplete,
}: CompanyInfoTabProps) {
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
        onRefresh={onReanalyzeComplete}
      />
    </div>
  )
}

// ============================================
// BRAND VOICE TAB
// ============================================

interface BrandVoiceTabProps {
  brandPersonality: string[]
  setBrandPersonality: (v: string[]) => void
  defaultTone: string
  setDefaultTone: (v: string) => void
  uniqueSellingPoints: string[]
  setUniqueSellingPoints: (v: string[]) => void
  targetAudience: string
  setTargetAudience: (v: string) => void
}

export function BrandVoiceTab({
  brandPersonality,
  setBrandPersonality,
  defaultTone,
  setDefaultTone,
  uniqueSellingPoints,
  setUniqueSellingPoints,
  targetAudience,
  setTargetAudience,
}: BrandVoiceTabProps) {
  return (
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
  )
}

// ============================================
// CONTENT STRATEGY TAB
// ============================================

interface ContentStrategyTabProps {
  contentPillars: ContentPillar[]
  onAddPillar: () => void
  onEditPillar: (pillar: ContentPillar) => void
  onDeletePillar: (id: string) => void
  onTogglePillarActive: (id: string) => void
}

export function ContentStrategyTab({
  contentPillars,
  onAddPillar,
  onEditPillar,
  onDeletePillar,
  onTogglePillarActive,
}: ContentStrategyTabProps) {
  return (
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
                  onEdit={() => onEditPillar(pillar)}
                  onDelete={() => onDeletePillar(pillar.id)}
                  onToggleActive={() => onTogglePillarActive(pillar.id)}
                />
              ))}
            </div>
          )}

          <button
            onClick={onAddPillar}
            className="flex items-center gap-2 px-4 py-3 w-full rounded-xl border-2 border-dashed border-[var(--border-default)] text-[var(--text-secondary)] hover:border-violet-500 hover:text-violet-600 transition-colors"
          >
            <Plus size={18} />
            Add Content Pillar
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

// ============================================
// SCHEDULE TAB
// ============================================

interface ScheduleTabProps extends BaseTabProps {
  postsPerWeek: number
  setPostsPerWeek: (v: number) => void
  preferredDays: string[]
  setPreferredDays: (v: string[]) => void
  preferredTimes: string[]
  setPreferredTimes: (v: string[]) => void
  timezone: string
  setTimezone: (v: string) => void
}

export function ScheduleTab({
  company,
  postsPerWeek,
  setPostsPerWeek,
  preferredDays,
  setPreferredDays,
  preferredTimes,
  setPreferredTimes,
  timezone,
  setTimezone,
}: ScheduleTabProps) {
  return (
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

      {/* AI Learned Insights */}
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
  )
}

// ============================================
// AUTOMATION TAB
// ============================================

interface AutomationTabProps extends BaseTabProps {
  autoApprove: boolean
  setAutoApprove: (v: boolean) => void
}

export function AutomationTab({
  company,
  autoApprove,
  setAutoApprove,
}: AutomationTabProps) {
  const router = useRouter()

  return (
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
  )
}

// ============================================
// DANGER ZONE TAB
// ============================================

interface DangerZoneTabProps extends BaseTabProps {
  setError: (v: string | null) => void
}

export function DangerZoneTab({ company, setError }: DangerZoneTabProps) {
  const router = useRouter()

  return (
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
  )
}

// ============================================
// PILLAR EDIT MODAL
// ============================================

interface PillarModalProps {
  pillar: ContentPillar
  setPillar: (p: ContentPillar) => void
  onSave: () => void
  onClose: () => void
}

export function PillarModal({ pillar, setPillar, onSave, onClose }: PillarModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-elevated)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="font-semibold text-lg text-[var(--text-primary)]">
            {pillar.id.startsWith('new-') ? 'Add Content Pillar' : 'Edit Content Pillar'}
          </h3>
          <button
            onClick={onClose}
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
              value={pillar.name}
              onChange={(e) => setPillar({ ...pillar, name: e.target.value })}
              placeholder="e.g., Thought Leadership"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* Topics */}
          <TagInput
            tags={pillar.topics}
            onChange={(topics) => setPillar({ ...pillar, topics })}
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
                  selected={pillar.contentTypes.includes(type.value)}
                  onClick={() => {
                    if (pillar.contentTypes.includes(type.value)) {
                      setPillar({
                        ...pillar,
                        contentTypes: pillar.contentTypes.filter(t => t !== type.value)
                      })
                    } else {
                      setPillar({
                        ...pillar,
                        contentTypes: [...pillar.contentTypes, type.value]
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
            value={pillar.frequencyWeight}
            onChange={(frequencyWeight) => setPillar({ ...pillar, frequencyWeight })}
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
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!pillar.name.trim()}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {pillar.id.startsWith('new-') ? 'Add Pillar' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}