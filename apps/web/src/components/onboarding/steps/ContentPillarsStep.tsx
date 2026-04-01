'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Check, Sparkles, GripVertical } from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface ContentPillarsStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

const DEFAULT_PILLARS = [
  {
    name: 'Educational Content',
    description: 'Tips, how-tos, and industry insights that provide value',
    topics: ['Tips & tricks', 'How-to guides', 'Industry news', 'Best practices'],
    isActive: true
  },
  {
    name: 'Behind the Scenes',
    description: 'Humanize your brand with team and process content',
    topics: ['Team highlights', 'Day in the life', 'Work culture', 'Company updates'],
    isActive: true
  },
  {
    name: 'Customer Success',
    description: 'Showcase testimonials and success stories',
    topics: ['Testimonials', 'Case studies', 'Before/after', 'Customer spotlights'],
    isActive: true
  },
  {
    name: 'Product/Service Highlights',
    description: 'Feature your offerings and their benefits',
    topics: ['New offerings', 'Features', 'Use cases', 'Promotions'],
    isActive: true
  },
  {
    name: 'Engagement & Community',
    description: 'Interactive content that sparks conversation',
    topics: ['Polls', 'Questions', 'Challenges', 'User-generated content'],
    isActive: false
  },
  {
    name: 'Thought Leadership',
    description: 'Position yourself as an industry expert',
    topics: ['Industry opinions', 'Trends analysis', 'Predictions', 'Expert insights'],
    isActive: false
  }
]

export default function ContentPillarsStep({ data, updateData }: ContentPillarsStepProps) {
  const [newPillarName, setNewPillarName] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Initialize pillars from benchmark themes or defaults
  useEffect(() => {
    if (data.contentPillars.length === 0) {
      // Check if we have industry benchmark themes
      if (data.industryBenchmark?.suggestedThemes) {
        const themes = data.industryBenchmark.suggestedThemes
        const themePillars = Object.entries(themes).slice(0, 4).map(([key, topics]: [string, any], index) => ({
          name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          description: `Content about ${key.replace(/_/g, ' ')}`,
          topics: Array.isArray(topics) ? topics : [],
          isActive: index < 4
        }))
        updateData({ contentPillars: themePillars })
      } else {
        updateData({ contentPillars: DEFAULT_PILLARS })
      }
    }
  }, [data.industryBenchmark])

  const togglePillar = (index: number) => {
    const updated = [...data.contentPillars]
    updated[index].isActive = !updated[index].isActive
    updateData({ contentPillars: updated })
  }

  const updatePillar = (index: number, field: string, value: any) => {
    const updated = [...data.contentPillars]
    updated[index] = { ...updated[index], [field]: value }
    updateData({ contentPillars: updated })
  }

  const addPillar = () => {
    if (newPillarName.trim()) {
      updateData({
        contentPillars: [
          ...data.contentPillars,
          {
            name: newPillarName.trim(),
            description: '',
            topics: [],
            isActive: true
          }
        ]
      })
      setNewPillarName('')
    }
  }

  const removePillar = (index: number) => {
    updateData({
      contentPillars: data.contentPillars.filter((_, i) => i !== index)
    })
  }

  const activePillarsCount = data.contentPillars.filter(p => p.isActive).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Content Pillars
        </h2>
        <p className="mt-2 text-gray-500">
          Content pillars are the main themes your posts will cover. We've suggested some based on your industry.
          Select 3-5 pillars that fit your brand.
        </p>
      </div>

      {/* Active Count */}
      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <span className="text-blue-800">
          <strong>{activePillarsCount}</strong> pillars active
          {activePillarsCount < 3 && <span className="text-blue-600 ml-2">(select at least 3)</span>}
        </span>
      </div>

      {/* Pillars List */}
      <div className="space-y-3">
        {data.contentPillars.map((pillar, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-xl border-2 transition-all
              ${pillar.isActive 
                ? 'border-blue-200 bg-blue-50/50' 
                : 'border-gray-100 bg-gray-50/50'
              }
            `}
          >
            <div className="flex items-start gap-4">
              {/* Drag Handle & Toggle */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <button
                  onClick={() => togglePillar(index)}
                  className={`
                    w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                    ${pillar.isActive 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {pillar.isActive && <Check className="w-4 h-4" />}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1">
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={pillar.name}
                      onChange={(e) => updatePillar(index, 'name', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg font-medium"
                      placeholder="Pillar name"
                    />
                    <textarea
                      value={pillar.description}
                      onChange={(e) => updatePillar(index, 'description', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none"
                      placeholder="Brief description"
                      rows={2}
                    />
                    <input
                      type="text"
                      value={pillar.topics.join(', ')}
                      onChange={(e) => updatePillar(index, 'topics', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="Topics (comma separated)"
                    />
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${pillar.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {pillar.name}
                      </h3>
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    {pillar.description && (
                      <p className="text-sm text-gray-500 mt-1">{pillar.description}</p>
                    )}
                    {pillar.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pillar.topics.map((topic, i) => (
                          <span
                            key={i}
                            className={`
                              text-xs px-2 py-1 rounded-full
                              ${pillar.isActive 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-500'
                              }
                            `}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => removePillar(index)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Pillar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newPillarName}
          onChange={(e) => setNewPillarName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPillar()}
          placeholder="Add a custom content pillar..."
          className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={addPillar}
          disabled={!newPillarName.trim()}
          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </div>
  )
}