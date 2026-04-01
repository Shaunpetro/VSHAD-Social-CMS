'use client'

import { useState } from 'react'
import { Check, Sparkles, Users, Target } from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface BrandPersonalityStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  companyName: string
}

const PERSONALITY_TRAITS = [
  { id: 'professional', label: 'Professional', emoji: '👔', description: 'Formal and business-focused' },
  { id: 'friendly', label: 'Friendly', emoji: '😊', description: 'Warm and approachable' },
  { id: 'innovative', label: 'Innovative', emoji: '💡', description: 'Cutting-edge and forward-thinking' },
  { id: 'trustworthy', label: 'Trustworthy', emoji: '🤝', description: 'Reliable and dependable' },
  { id: 'playful', label: 'Playful', emoji: '🎉', description: 'Fun and lighthearted' },
  { id: 'authoritative', label: 'Authoritative', emoji: '📚', description: 'Expert and knowledgeable' },
  { id: 'caring', label: 'Caring', emoji: '❤️', description: 'Compassionate and supportive' },
  { id: 'bold', label: 'Bold', emoji: '🔥', description: 'Confident and daring' },
  { id: 'creative', label: 'Creative', emoji: '🎨', description: 'Artistic and imaginative' },
  { id: 'authentic', label: 'Authentic', emoji: '✨', description: 'Genuine and transparent' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡', description: 'Dynamic and lively' },
  { id: 'sophisticated', label: 'Sophisticated', emoji: '🥂', description: 'Elegant and refined' }
]

const BRAND_VOICES = [
  { id: 'conversational', label: 'Conversational', description: 'Like talking to a friend' },
  { id: 'educational', label: 'Educational', description: 'Informative and teaching-focused' },
  { id: 'inspirational', label: 'Inspirational', description: 'Motivating and uplifting' },
  { id: 'witty', label: 'Witty', description: 'Clever humor and wordplay' },
  { id: 'direct', label: 'Direct', description: 'Straight to the point' },
  { id: 'storytelling', label: 'Storytelling', description: 'Narrative-driven content' }
]

const PRIMARY_GOALS = [
  { id: 'brand_awareness', label: 'Brand Awareness', icon: Sparkles, description: 'Get your name out there' },
  { id: 'lead_generation', label: 'Lead Generation', icon: Target, description: 'Attract potential customers' },
  { id: 'community_building', label: 'Community Building', icon: Users, description: 'Build loyal followers' },
  { id: 'thought_leadership', label: 'Thought Leadership', icon: Sparkles, description: 'Establish expertise' },
  { id: 'customer_engagement', label: 'Customer Engagement', icon: Users, description: 'Interact with audience' },
  { id: 'sales_conversion', label: 'Sales & Conversion', icon: Target, description: 'Drive purchases' }
]

export default function BrandPersonalityStep({ 
  data, 
  updateData,
  companyName 
}: BrandPersonalityStepProps) {
  const [uspInput, setUspInput] = useState('')

  const togglePersonality = (trait: string) => {
    const current = data.brandPersonality
    if (current.includes(trait)) {
      updateData({ brandPersonality: current.filter(t => t !== trait) })
    } else if (current.length < 4) {
      updateData({ brandPersonality: [...current, trait] })
    }
  }

  const toggleGoal = (goal: string) => {
    const current = data.primaryGoals
    if (current.includes(goal)) {
      updateData({ primaryGoals: current.filter(g => g !== goal) })
    } else if (current.length < 3) {
      updateData({ primaryGoals: [...current, goal] })
    }
  }

  const addUSP = () => {
    if (uspInput.trim() && data.uniqueSellingPoints.length < 5) {
      updateData({ uniqueSellingPoints: [...data.uniqueSellingPoints, uspInput.trim()] })
      setUspInput('')
    }
  }

  const removeUSP = (index: number) => {
    updateData({ 
      uniqueSellingPoints: data.uniqueSellingPoints.filter((_, i) => i !== index) 
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Define {companyName}'s Brand Personality
        </h2>
        <p className="mt-2 text-gray-500">
          Select traits that describe your brand. This helps AI match your tone.
        </p>
      </div>

      {/* Personality Traits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Brand Personality Traits (select up to 4)
        </label>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {PERSONALITY_TRAITS.map((trait) => {
            const isSelected = data.brandPersonality.includes(trait.id)
            const isDisabled = !isSelected && data.brandPersonality.length >= 4
            
            return (
              <button
                key={trait.id}
                onClick={() => togglePersonality(trait.id)}
                disabled={isDisabled}
                className={`
                  relative p-3 rounded-xl border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : isDisabled
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-100 hover:border-gray-200'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-xl">{trait.emoji}</span>
                <span className={`block text-sm font-medium mt-1 ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                  {trait.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Brand Voice */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Brand Voice Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {BRAND_VOICES.map((voice) => {
            const isSelected = data.brandVoice === voice.id
            
            return (
              <button
                key={voice.id}
                onClick={() => updateData({ brandVoice: voice.id })}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-100 hover:border-gray-200'
                  }
                `}
              >
                <span className={`block font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                  {voice.label}
                </span>
                <span className="text-xs text-gray-500">{voice.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Primary Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Primary Goals (select up to 3)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PRIMARY_GOALS.map((goal) => {
            const Icon = goal.icon
            const isSelected = data.primaryGoals.includes(goal.id)
            const isDisabled = !isSelected && data.primaryGoals.length >= 3
            
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                disabled={isDisabled}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-50' 
                    : isDisabled
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-100 hover:border-gray-200'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`block font-medium mt-2 ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                  {goal.label}
                </span>
                <span className="text-xs text-gray-500">{goal.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Audience (who are you trying to reach?)
        </label>
        <textarea
          value={data.targetAudience}
          onChange={(e) => updateData({ targetAudience: e.target.value })}
          placeholder="e.g., Small business owners aged 25-45, interested in growing their online presence"
          className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={2}
        />
      </div>

      {/* Unique Selling Points */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What makes you unique? (add up to 5)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={uspInput}
            onChange={(e) => setUspInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUSP()}
            placeholder="e.g., 24/7 support, locally owned, eco-friendly"
            className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addUSP}
            disabled={!uspInput.trim() || data.uniqueSellingPoints.length >= 5}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {data.uniqueSellingPoints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.uniqueSellingPoints.map((usp, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg"
              >
                {usp}
                <button
                  onClick={() => removeUSP(index)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}