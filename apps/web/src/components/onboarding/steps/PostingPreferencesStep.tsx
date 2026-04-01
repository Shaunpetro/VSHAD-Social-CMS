// apps/web/src/components/onboarding/steps/PostingPreferencesStep.tsx
'use client'

import { useEffect, useState } from 'react'
import { Check, Clock, Calendar, Smile, Volume2, Sparkles, Info } from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface PostingPreferencesStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

const DAYS_OF_WEEK = [
  { id: 'Monday', short: 'Mon' },
  { id: 'Tuesday', short: 'Tue' },
  { id: 'Wednesday', short: 'Wed' },
  { id: 'Thursday', short: 'Thu' },
  { id: 'Friday', short: 'Fri' },
  { id: 'Saturday', short: 'Sat' },
  { id: 'Sunday', short: 'Sun' }
]

const TIME_SLOTS = [
  { id: 'early_morning', label: 'Early Morning', time: '07:00', description: '7:00 AM' },
  { id: 'morning', label: 'Morning', time: '09:00', description: '9:00 AM' },
  { id: 'midday', label: 'Midday', time: '12:00', description: '12:00 PM' },
  { id: 'afternoon', label: 'Afternoon', time: '15:00', description: '3:00 PM' },
  { id: 'evening', label: 'Evening', time: '18:00', description: '6:00 PM' },
  { id: 'night', label: 'Night', time: '20:00', description: '8:00 PM' }
]

const TONES = [
  { id: 'professional', label: 'Professional', emoji: '👔', description: 'Formal and business-appropriate' },
  { id: 'friendly', label: 'Friendly', emoji: '😊', description: 'Warm and approachable' },
  { id: 'casual', label: 'Casual', emoji: '✌️', description: 'Relaxed and conversational' },
  { id: 'inspirational', label: 'Inspirational', emoji: '✨', description: 'Motivating and uplifting' },
  { id: 'educational', label: 'Educational', emoji: '📚', description: 'Informative and teaching-focused' },
  { id: 'witty', label: 'Witty', emoji: '😄', description: 'Clever with light humor' }
]

const TIMEZONES = [
  { id: 'Africa/Johannesburg', label: 'South Africa (SAST)', offset: '+02:00' },
  { id: 'Europe/London', label: 'London (GMT/BST)', offset: '+00:00' },
  { id: 'America/New_York', label: 'New York (EST/EDT)', offset: '-05:00' },
  { id: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: '-08:00' },
  { id: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: '+01:00' },
  { id: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
  { id: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+08:00' },
  { id: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: '+10:00' }
]

export default function PostingPreferencesStep({ data, updateData }: PostingPreferencesStepProps) {
  const [initialized, setInitialized] = useState(false)

  // Auto-populate from industry benchmark on first load
  useEffect(() => {
    if (!initialized && data.industryBenchmark) {
      const benchmark = data.industryBenchmark
      const updates: Partial<OnboardingData> = {}

      // Set recommended posts per week if not already set
      if (data.postsPerWeek === 4 && benchmark.optimalPostsMin) {
        updates.postsPerWeek = Math.round((benchmark.optimalPostsMin + (benchmark.optimalPostsMax || benchmark.optimalPostsMin)) / 2)
      }

      // Set recommended days if available and user hasn't customized
      if (data.preferredDays.length <= 4 && benchmark.bestDays && Array.isArray(benchmark.bestDays) && benchmark.bestDays.length > 0) {
        updates.preferredDays = benchmark.bestDays
      }

      // Set recommended times if available
      if (Object.keys(data.preferredTimes).length === 0 && benchmark.bestTimes) {
        const bestTimes = Array.isArray(benchmark.bestTimes) 
          ? benchmark.bestTimes 
          : (typeof benchmark.bestTimes === 'object' ? Object.values(benchmark.bestTimes).flat() : [])
        
        if (bestTimes.length > 0) {
          const times: Record<string, string[]> = {}
          const days = updates.preferredDays || data.preferredDays
          days.forEach(day => {
            times[day] = bestTimes as string[]
          })
          updates.preferredTimes = times
        }
      }

      // Set tone based on industry recommendation
      if (benchmark.recommendedTone && data.defaultTone === 'professional') {
        updates.defaultTone = benchmark.recommendedTone
      }

      // Set humor based on industry
      if (typeof benchmark.humorAppropriate === 'boolean') {
        updates.humorEnabled = benchmark.humorAppropriate
      }

      if (Object.keys(updates).length > 0) {
        updateData(updates)
      }
      
      setInitialized(true)
    }
  }, [data.industryBenchmark, initialized])

  const toggleDay = (day: string) => {
    const current = data.preferredDays
    if (current.includes(day)) {
      updateData({ preferredDays: current.filter(d => d !== day) })
    } else {
      updateData({ preferredDays: [...current, day] })
    }
  }

  const toggleHumorDay = (day: string) => {
    const current = data.humorDays
    if (current.includes(day)) {
      updateData({ humorDays: current.filter(d => d !== day) })
    } else {
      updateData({ humorDays: [...current, day] })
    }
  }

  const toggleTimeSlot = (time: string) => {
    const newTimes = { ...data.preferredTimes }
    
    // Check if this time is currently selected for any day
    const isCurrentlySelected = data.preferredDays.some(day => 
      (newTimes[day] || []).includes(time)
    )

    // Toggle for all preferred days
    data.preferredDays.forEach(day => {
      const dayTimes = newTimes[day] || []
      if (isCurrentlySelected) {
        newTimes[day] = dayTimes.filter(t => t !== time)
      } else {
        if (!dayTimes.includes(time)) {
          newTimes[day] = [...dayTimes, time].sort()
        }
      }
    })
    
    updateData({ preferredTimes: newTimes })
  }

  const isTimeSelected = (time: string) => {
    return data.preferredDays.some(day => 
      (data.preferredTimes[day] || []).includes(time)
    )
  }

  const getRecommendedDays = (): string[] => {
    if (data.industryBenchmark?.bestDays && Array.isArray(data.industryBenchmark.bestDays)) {
      return data.industryBenchmark.bestDays
    }
    return []
  }

  const getRecommendedTimes = (): string[] => {
    if (data.industryBenchmark?.bestTimes) {
      const bestTimes = data.industryBenchmark.bestTimes
      if (Array.isArray(bestTimes)) return bestTimes
      if (typeof bestTimes === 'object') return Object.values(bestTimes).flat() as string[]
    }
    return []
  }

  const recommendedDays = getRecommendedDays()
  const recommendedTimes = getRecommendedTimes()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Posting Schedule
        </h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          Set when and how often AI should generate and schedule your content
        </p>
      </div>

      {/* Industry Recommendation Banner */}
      {data.industryBenchmark && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Smart defaults applied for {data.selectedIndustry}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                We&apos;ve pre-filled recommended settings based on your industry. Feel free to customize!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Posts Per Week */}
      <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--text-primary)]">Posts Per Week</h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              AI will auto-generate this many posts for your review
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.postsPerWeek}</span>
            <span className="text-sm text-[var(--text-tertiary)] block">posts</span>
          </div>
        </div>
        
        <input
          type="range"
          min="1"
          max="14"
          value={data.postsPerWeek}
          onChange={(e) => updateData({ postsPerWeek: parseInt(e.target.value) })}
          className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        
        <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2">
          <span>1 post</span>
          <span>7 posts</span>
          <span>14 posts</span>
        </div>
        
        {data.industryBenchmark?.optimalPostsMin && (
          <div className="flex items-center gap-2 mt-3 text-sm text-green-600 dark:text-green-400">
            <Info className="w-4 h-4" />
            <span>
              Industry sweet spot: {data.industryBenchmark.optimalPostsMin}-{data.industryBenchmark.optimalPostsMax} posts/week
            </span>
          </div>
        )}
      </div>

      {/* Preferred Days */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          Which days should posts be scheduled?
        </label>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = data.preferredDays.includes(day.id)
            const isRecommended = recommendedDays.includes(day.id)
            
            return (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`
                  relative p-3 rounded-xl border-2 text-center transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-primary)]'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {isRecommended && !isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-[var(--text-primary)]'}`}>
                  {day.short}
                </span>
              </button>
            )
          })}
        </div>
        {recommendedDays.length > 0 && (
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            <Sparkles className="w-3 h-3 inline text-amber-400" /> = Recommended for your industry
          </p>
        )}
      </div>

      {/* Preferred Times */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          <Clock className="w-4 h-4 inline mr-2" />
          Best times to post (applied to selected days)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TIME_SLOTS.map((slot) => {
            const isSelected = isTimeSelected(slot.time)
            const isRecommended = recommendedTimes.includes(slot.time)
            
            return (
              <button
                key={slot.id}
                onClick={() => toggleTimeSlot(slot.time)}
                disabled={data.preferredDays.length === 0}
                className={`
                  relative p-3 rounded-xl border-2 text-center transition-all
                  ${data.preferredDays.length === 0 
                    ? 'opacity-50 cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-tertiary)]'
                    : isSelected 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-primary)]'
                  }
                `}
              >
                {isRecommended && !isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <span className={`block font-medium ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-[var(--text-primary)]'}`}>
                  {slot.label}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">{slot.description}</span>
              </button>
            )
          })}
        </div>
        {data.preferredDays.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            ⚠️ Select posting days first
          </p>
        )}
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Your Timezone
        </label>
        <select
          value={data.timezone}
          onChange={(e) => updateData({ timezone: e.target.value })}
          className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.label} (UTC{tz.offset})
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Posts will be scheduled in your local timezone
        </p>
      </div>

      {/* Default Tone */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          <Volume2 className="w-4 h-4 inline mr-2" />
          Default Content Tone
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TONES.map((tone) => {
            const isSelected = data.defaultTone === tone.id
            
            return (
              <button
                key={tone.id}
                onClick={() => updateData({ defaultTone: tone.id })}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-primary)]'
                  }
                `}
              >
                <span className="text-xl">{tone.emoji}</span>
                <span className={`block font-medium mt-1 ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-[var(--text-primary)]'}`}>
                  {tone.label}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">{tone.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Humor Settings */}
      <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Smile className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Humor in Content</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Allow playful, lighter posts on certain days?</p>
            </div>
          </div>
          
          <button
            onClick={() => updateData({ humorEnabled: !data.humorEnabled })}
            className={`
              relative w-14 h-8 rounded-full transition-colors
              ${data.humorEnabled ? 'bg-amber-500' : 'bg-[var(--bg-tertiary)]'}
            `}
          >
            <div className={`
              absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform
              ${data.humorEnabled ? 'translate-x-7' : 'translate-x-1'}
            `} />
          </button>
        </div>

        {data.humorEnabled && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Select days for lighter, more engaging content:
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = data.humorDays.includes(day.id)
                
                return (
                  <button
                    key={day.id}
                    onClick={() => toggleHumorDay(day.id)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${isSelected 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                      }
                    `}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              💡 Tip: Friday posts with humor typically see 20% higher engagement!
            </p>
          </div>
        )}
      </div>

      {/* Auto-Generation Summary */}
      <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
          🤖 Auto-Generation Preview
        </h4>
        <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
          <p>
            <strong>Weekly output:</strong> {data.postsPerWeek} AI-generated posts
          </p>
          <p>
            <strong>Schedule:</strong> {data.preferredDays.length > 0 
              ? data.preferredDays.map(d => d.slice(0, 3)).join(', ') 
              : 'No days selected'}
          </p>
          <p>
            <strong>Posting times:</strong> {
              Object.values(data.preferredTimes).flat().filter((v, i, a) => a.indexOf(v) === i).length > 0
                ? [...new Set(Object.values(data.preferredTimes).flat())].sort().join(', ')
                : 'Not set'
            }
          </p>
          <p>
            <strong>Tone:</strong> {data.defaultTone.charAt(0).toUpperCase() + data.defaultTone.slice(1)}
            {data.humorEnabled && data.humorDays.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {' '}+ Humor on {data.humorDays.map(d => d.slice(0, 3)).join(', ')}
              </span>
            )}
          </p>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-3">
          Click &quot;Generate This Week&quot; after setup to create your first batch!
        </p>
      </div>
    </div>
  )
}