// apps/web/src/components/onboarding/steps/ReviewStep.tsx

'use client'

import { 
  Building2, 
  Briefcase,
  Trophy,
  Users,
  MessageSquare,
  Target,
  Calendar, 
  Clock,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  MapPin,
  Volume2,
  BarChart3,
  Globe,
  FileText,
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

// ============================================
// TYPES
// ============================================

interface ReviewStepProps {
  data: OnboardingData
  companyName: string
}

// ============================================
// GOAL DISPLAY CONFIG
// ============================================

const GOAL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  leads: { label: 'Get More Leads & Clients', icon: Target, color: 'brand' },
  awareness: { label: 'Build Brand Awareness', icon: Globe, color: 'purple' },
  recruitment: { label: 'Recruit Talent', icon: Users, color: 'amber' },
  engagement: { label: 'Stay Connected', icon: MessageSquare, color: 'green' },
}

// ============================================
// COMPONENT
// ============================================

export default function ReviewStep({ data, companyName }: ReviewStepProps) {
  // Get data from AI analysis or confirmed edits
  const industries = data.confirmedData.industries || data.analysis?.industries || []
  const services = data.confirmedData.services || data.analysis?.services || []
  const usps = data.confirmedData.usps || data.analysis?.uniqueSellingPoints || []
  const audience = data.confirmedData.audience || data.analysis?.targetAudience
  const coreServices = services.filter((s: any) => s.isCore)
  
  // Goal display
  const goalConfig = data.primaryBusinessGoal ? GOAL_CONFIG[data.primaryBusinessGoal] : null
  
  // Calculate posts per service (for content pillars)
  const postsPerService = Math.ceil(data.postsPerWeek / Math.max(coreServices.length, 1))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <Check size={32} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Review Your Setup
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">
          Here's everything we've configured for {companyName}
        </p>
      </div>

      {/* Success Preview */}
      <div className="p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <Sparkles size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-green-700 dark:text-green-300 text-lg">Ready to Generate!</h3>
            <p className="text-green-600 dark:text-green-400 text-sm">
              After setup, click "Generate This Week" to create your first batch of posts
            </p>
          </div>
        </div>
      </div>

      {/* AI Analysis Summary */}
      {data.analysis && (
        <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand-500" />
              <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                AI Analysis Confidence
              </span>
            </div>
            <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
              {Math.round(data.analysis.confidenceScore * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* What AI Will Generate */}
      <div className="p-5 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)]">What AI Will Generate Each Week</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              {data.postsPerWeek} posts across {coreServices.length || 1} content themes
            </p>
          </div>
        </div>
        
        {coreServices.length > 0 ? (
          <div className="space-y-2">
            {coreServices.slice(0, 5).map((service: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                <div className="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {postsPerService}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-[var(--text-primary)]">{service.name}</span>
                  {service.keywords?.length > 0 && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                      Topics: {service.keywords.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">
                  post{postsPerService > 1 ? 's' : ''}/week
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-[var(--bg-primary)] rounded-lg text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Content will be generated based on your industry and goals
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-blue-500/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Total posts per week:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{data.postsPerWeek}</span>
          </div>
        </div>
      </div>

      {/* Configuration Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        
        {/* Industries */}
        <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">Industries</h4>
              <p className="text-xs text-[var(--text-tertiary)]">
                {industries.length} detected
                {data.confirmationStatus.industries && ' • Confirmed ✓'}
              </p>
            </div>
          </div>
          
          {industries.length > 0 ? (
            <div className="space-y-2">
              {industries.slice(0, 3).map((industry: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-primary)]">{industry.name}</span>
                  {industry.cidbGrade && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      CIDB L{industry.cidbGrade}
                    </span>
                  )}
                </div>
              ))}
              {industries.length > 3 && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  +{industries.length - 3} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              {data.selectedIndustry || 'Not configured'}
            </p>
          )}
        </div>

        {/* Business Goal */}
        <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-rose-500" />
            </div>
            <h4 className="font-semibold text-[var(--text-primary)]">Primary Goal</h4>
          </div>
          
          {goalConfig ? (
            <div className="flex items-center gap-2">
              <Check size={16} className="text-green-500" />
              <span className="text-[var(--text-primary)]">{goalConfig.label}</span>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">Not selected</p>
          )}
        </div>

        {/* Voice Configuration */}
        <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Volume2 size={20} className="text-purple-500" />
            </div>
            <h4 className="font-semibold text-[var(--text-primary)]">Brand Voice</h4>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-primary)]">
              <span className="text-[var(--text-tertiary)]">Formality:</span>{' '}
              <span className="capitalize font-medium">{data.voiceConfig.formality}</span>
            </p>
            
            {data.voiceConfig.personality.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.voiceConfig.personality.map((trait, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 capitalize"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-sm text-[var(--text-primary)]">
              <span className="text-[var(--text-tertiary)]">Technical:</span>{' '}
              <span className="capitalize font-medium">{data.voiceConfig.technicalLevel}</span>
            </p>
          </div>
        </div>

        {/* Tone & Humor */}
        <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-amber-500" />
            </div>
            <h4 className="font-semibold text-[var(--text-primary)]">Tone & Style</h4>
          </div>
          
          <p className="text-[var(--text-primary)]">
            <span className="font-medium capitalize">{data.defaultTone}</span> tone
          </p>
          
          {data.humorEnabled ? (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              😄 Humor on: {data.humorDays.join(', ') || 'selected days'}
            </p>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] mt-2">Humor disabled</p>
          )}
        </div>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Briefcase size={20} className="text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">Services</h4>
              <p className="text-xs text-[var(--text-tertiary)]">
                {services.length} services • {coreServices.length} core
                {data.confirmationStatus.services && ' • Confirmed ✓'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {services.slice(0, 8).map((service: any, i: number) => (
              <span 
                key={i}
                className={`px-3 py-1 rounded-full text-sm ${
                  service.isCore 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-medium' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                }`}
              >
                {service.isCore && '★ '}{service.name}
              </span>
            ))}
            {services.length > 8 && (
              <span className="px-3 py-1 text-[var(--text-tertiary)] text-sm">
                +{services.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* USPs */}
      {usps.length > 0 && (
        <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Trophy size={20} className="text-yellow-500" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">What Makes You Special</h4>
              <p className="text-xs text-[var(--text-tertiary)]">
                {usps.length} unique selling points
                {data.confirmationStatus.usps && ' • Confirmed ✓'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {usps.slice(0, 5).map((usp: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[var(--text-primary)]">{usp.point}</span>
              </div>
            ))}
            {usps.length > 5 && (
              <p className="text-xs text-[var(--text-tertiary)] ml-6">
                +{usps.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Target Audience */}
      {audience && (
        <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-indigo-500" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">Target Audience</h4>
              <p className="text-xs text-[var(--text-tertiary)]">
                {audience.businessType}
                {data.confirmationStatus.audience && ' • Confirmed ✓'}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {audience.primarySectors?.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Sectors</p>
                <div className="flex flex-wrap gap-1">
                  {audience.primarySectors.slice(0, 4).map((sector: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {audience.decisionMakers?.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Decision Makers</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {audience.decisionMakers.slice(0, 3).join(', ')}
                </p>
              </div>
            )}
            
            {audience.geographicFocus?.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  {audience.geographicFocus.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Summary */}
      <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
            <Calendar size={20} className="text-green-500" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">Posting Schedule</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-[var(--bg-primary)] rounded-lg">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{data.postsPerWeek}</div>
            <div className="text-xs text-[var(--text-tertiary)]">posts/week</div>
          </div>
          
          <div className="text-center p-3 bg-[var(--bg-primary)] rounded-lg">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{data.preferredDays.length}</div>
            <div className="text-xs text-[var(--text-tertiary)]">active days</div>
          </div>
          
          <div className="text-center p-3 bg-[var(--bg-primary)] rounded-lg">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{coreServices.length || '—'}</div>
            <div className="text-xs text-[var(--text-tertiary)]">content themes</div>
          </div>
          
          <div className="text-center p-3 bg-[var(--bg-primary)] rounded-lg">
            <div className="text-lg font-bold text-[var(--text-primary)] capitalize">{data.defaultTone}</div>
            <div className="text-xs text-[var(--text-tertiary)]">tone</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Clock size={16} />
            <span>
              Posting on: <strong className="text-[var(--text-primary)]">
                {data.preferredDays.map(d => d.slice(0, 3)).join(', ') || 'Not set'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="p-5 bg-blue-500/5 rounded-xl border border-blue-500/20">
        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-4">What happens after you complete setup?</h4>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">AI learns your brand</p>
              <p className="text-sm text-[var(--text-secondary)]">Your settings are saved and used for all content generation</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <ArrowRight size={16} className="text-blue-300" />
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Click "Generate This Week"</p>
              <p className="text-sm text-[var(--text-secondary)]">
                AI creates {data.postsPerWeek} posts tailored to your business
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <ArrowRight size={16} className="text-blue-300" />
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Review, Edit & Approve</p>
              <p className="text-sm text-[var(--text-secondary)]">Quick review → Approve or tweak → Auto-schedule</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <ArrowRight size={16} className="text-blue-300" />
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">Posts publish automatically!</p>
              <p className="text-sm text-green-600 dark:text-green-400">Sit back while your content goes live on schedule</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Savings */}
      <div className="p-5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Zap size={24} className="text-purple-500" />
          </div>
          <div>
            <h4 className="font-bold text-purple-700 dark:text-purple-300">Time Saved: ~4-5 hours/week</h4>
            <p className="text-purple-600 dark:text-purple-400 text-sm">
              Creating {data.postsPerWeek} quality posts manually takes 30-40 min each. 
              With AI: <strong>5 minutes to review & approve.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center py-4">
        <p className="text-[var(--text-secondary)]">
          Click <strong className="text-purple-600 dark:text-purple-400">"Complete Setup"</strong> below to save and start generating content!
        </p>
      </div>
    </div>
  )
}