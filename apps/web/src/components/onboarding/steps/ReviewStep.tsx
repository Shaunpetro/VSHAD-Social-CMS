'use client'

import { 
  Building2, 
  Palette, 
  LayoutGrid, 
  Calendar, 
  Target,
  Check,
  Sparkles,
  Clock,
  Zap,
  FileText,
  ArrowRight,
  Users,
  Hash,
  MessageSquare
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface ReviewStepProps {
  data: OnboardingData
  companyName: string
}

export default function ReviewStep({ data, companyName }: ReviewStepProps) {
  const activePillars = data.contentPillars.filter(p => p.isActive)
  const postsPerPillar = Math.ceil(data.postsPerWeek / Math.max(activePillars.length, 1))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Review Your Setup
        </h2>
        <p className="mt-2 text-gray-500">
          Here's a summary of your content intelligence configuration for {companyName}.
        </p>
      </div>

      {/* Success Preview */}
      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-900 text-lg">Ready to Generate!</h3>
            <p className="text-green-700 text-sm">
              After setup, click "Generate This Week" to create your first batch of posts
            </p>
          </div>
        </div>
      </div>

      {/* What Will Be Generated - THE KEY SECTION */}
      <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">What AI Will Generate Each Week</h4>
            <p className="text-sm text-gray-600">{data.postsPerWeek} posts across {activePillars.length} content types</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {activePillars.map((pillar, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                {postsPerPillar}
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-800">{pillar.name}</span>
                {pillar.topics.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Topics: {pillar.topics.slice(0, 3).join(', ')}
                    {pillar.topics.length > 3 && ` +${pillar.topics.length - 3} more`}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400">post{postsPerPillar > 1 ? 's' : ''}/week</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total posts per week:</span>
            <span className="font-bold text-blue-700 text-lg">{data.postsPerWeek}</span>
          </div>
        </div>
      </div>

      {/* Configuration Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Industry */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Industry</h4>
          </div>
          <p className="text-lg font-medium text-gray-700">{data.selectedIndustry || 'Not selected'}</p>
          {data.industryBenchmark && (
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              <p>📊 Avg. engagement: {data.industryBenchmark.avgEngagementRate}%</p>
              <p>🎯 Recommended: {data.industryBenchmark.recommendedPostsPerWeek} posts/week</p>
            </div>
          )}
        </div>

        {/* Brand Personality */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Brand Personality</h4>
          </div>
          {data.brandPersonality.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {data.brandPersonality.map((trait) => (
                <span
                  key={trait}
                  className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm capitalize"
                >
                  {trait}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Not configured</p>
          )}
          {data.brandVoice && (
            <p className="text-sm text-gray-500 mt-2">
              Voice: <span className="capitalize font-medium">{data.brandVoice}</span>
            </p>
          )}
        </div>

        {/* Goals */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-rose-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Primary Goals</h4>
          </div>
          {data.primaryGoals.length > 0 ? (
            <div className="space-y-2">
              {data.primaryGoals.map((goal) => (
                <div key={goal} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700 text-sm capitalize">
                    {goal.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Not configured</p>
          )}
        </div>

        {/* Tone & Humor */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Tone & Style</h4>
          </div>
          <p className="text-gray-700">
            <span className="font-medium capitalize">{data.defaultTone}</span> tone
          </p>
          {data.humorEnabled ? (
            <p className="text-sm text-amber-600 mt-2">
              😄 Humor enabled on: {data.humorDays.join(', ') || 'selected days'}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-2">Humor disabled</p>
          )}
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Posting Schedule</h4>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{data.postsPerWeek}</div>
            <div className="text-xs text-gray-500">posts/week</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{data.preferredDays.length}</div>
            <div className="text-xs text-gray-500">active days</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{activePillars.length}</div>
            <div className="text-xs text-gray-500">content types</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900 capitalize">{data.defaultTone}</div>
            <div className="text-xs text-gray-500">tone</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              Posting on: <strong>{data.preferredDays.map(d => d.slice(0, 3)).join(', ') || 'Not set'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Target Audience */}
      {data.targetAudience && (
        <div className="p-5 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-700">Target Audience</h4>
          </div>
          <p className="text-gray-600">{data.targetAudience}</p>
        </div>
      )}

      {/* USPs */}
      {data.uniqueSellingPoints.length > 0 && (
        <div className="p-5 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-700">Unique Selling Points</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.uniqueSellingPoints.map((usp, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
              >
                ✓ {usp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Industry Hashtags Preview */}
      {data.industryBenchmark?.topHashtags && (
        <div className="p-5 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-700">Industry Hashtags (auto-included)</h4>
          </div>
          <div className="flex flex-wrap gap-1">
            {data.industryBenchmark.topHashtags.slice(0, 8).map((tag: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm"
              >
                {tag}
              </span>
            ))}
            {data.industryBenchmark.topHashtags.length > 8 && (
              <span className="px-2 py-1 text-gray-400 text-sm">
                +{data.industryBenchmark.topHashtags.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* What Happens Next */}
      <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-4">What happens after you complete setup?</h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-blue-900">AI learns your brand</p>
              <p className="text-sm text-blue-700">Your settings are saved and used for all content generation</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-blue-300" />
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-blue-900">Click "Generate This Week"</p>
              <p className="text-sm text-blue-700">
                AI creates {data.postsPerWeek} posts ({activePillars.map(p => p.name).join(', ')})
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-blue-300" />
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-blue-900">Review, Edit & Approve</p>
              <p className="text-sm text-blue-700">Quick review queue → Approve or tweak → Auto-schedule</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-blue-300" />
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="font-medium text-green-800">Posts publish automatically!</p>
              <p className="text-sm text-green-700">Sit back while your content goes live on schedule</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Savings Highlight */}
      <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h4 className="font-bold text-purple-900">Time Saved: ~4-5 hours/week</h4>
            <p className="text-purple-700 text-sm">
              Creating {data.postsPerWeek} quality posts manually takes 30-40 min each. 
              With AI: <strong>5 minutes to review & approve.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA Hint */}
      <div className="text-center py-4">
        <p className="text-gray-500">
          Click <strong className="text-purple-600">"Complete Setup"</strong> below to save your configuration and start generating content!
        </p>
      </div>
    </div>
  )
}