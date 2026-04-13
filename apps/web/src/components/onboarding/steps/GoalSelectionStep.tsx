// apps/web/src/components/onboarding/steps/GoalSelectionStep.tsx

'use client'

import { useState } from 'react'
import {
  Target,
  Megaphone,
  Users,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface GoalSelectionStepProps {
  selectedGoal: string | null
  onSelectGoal: (goal: string) => void
  companyName: string
}

// ============================================
// GOAL OPTIONS
// ============================================

const GOALS = [
  {
    id: 'leads',
    icon: Target,
    title: 'Get More Leads & Clients',
    description: 'Generate enquiries and project opportunities',
    color: 'brand',
    contentFocus: [
      'Case studies & project showcases',
      'Testimonials & social proof',
      'Clear calls-to-action',
      'Problem-solution content',
    ],
    metrics: ['Enquiries', 'Quote requests', 'Contact form submissions'],
  },
  {
    id: 'awareness',
    icon: Megaphone,
    title: 'Build Brand Awareness',
    description: 'Increase visibility and reach more people',
    color: 'purple',
    contentFocus: [
      'Thought leadership articles',
      'Industry insights',
      'Educational content',
      'Shareable infographics',
    ],
    metrics: ['Reach', 'Impressions', 'Share count'],
  },
  {
    id: 'recruitment',
    icon: Users,
    title: 'Recruit Talent',
    description: 'Attract skilled employees to your team',
    color: 'amber',
    contentFocus: [
      'Company culture showcases',
      'Employee spotlights',
      'Career growth stories',
      'Day-in-the-life content',
    ],
    metrics: ['Job applications', 'Profile views', 'Follower growth'],
  },
  {
    id: 'engagement',
    icon: HeartHandshake,
    title: 'Stay Connected',
    description: 'Maintain relationships with existing clients',
    color: 'green',
    contentFocus: [
      'Updates & company news',
      'Behind-the-scenes content',
      'Client appreciation posts',
      'Community engagement',
    ],
    metrics: ['Engagement rate', 'Comments', 'Message responses'],
  },
]

const COLOR_CLASSES = {
  brand: {
    bg: 'bg-brand-500',
    bgLight: 'bg-brand-500/10',
    border: 'border-brand-500',
    text: 'text-brand-500',
    textLight: 'text-brand-600 dark:text-brand-400',
  },
  purple: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-500/10',
    border: 'border-purple-500',
    text: 'text-purple-500',
    textLight: 'text-purple-600 dark:text-purple-400',
  },
  amber: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    border: 'border-amber-500',
    text: 'text-amber-500',
    textLight: 'text-amber-600 dark:text-amber-400',
  },
  green: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-500/10',
    border: 'border-green-500',
    text: 'text-green-500',
    textLight: 'text-green-600 dark:text-green-400',
  },
}

// ============================================
// COMPONENT
// ============================================

export default function GoalSelectionStep({
  selectedGoal,
  onSelectGoal,
  companyName,
}: GoalSelectionStepProps) {
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null)
  
  const selectedGoalData = GOALS.find(g => g.id === selectedGoal)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
          <Target size={32} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          What's your main goal?
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">
          This helps us create content that drives real results for {companyName}
        </p>
      </div>

      {/* Goal Options */}
      <div className="grid gap-3">
        {GOALS.map((goal) => {
          const Icon = goal.icon
          const colors = COLOR_CLASSES[goal.color as keyof typeof COLOR_CLASSES]
          const isSelected = selectedGoal === goal.id
          const isHovered = hoveredGoal === goal.id
          
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onSelectGoal(goal.id)}
              onMouseEnter={() => setHoveredGoal(goal.id)}
              onMouseLeave={() => setHoveredGoal(null)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${colors.border} ${colors.bgLight}`
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSelected ? colors.bg : 'bg-[var(--bg-tertiary)]'
                }`}>
                  <Icon size={24} className={isSelected ? 'text-white' : 'text-[var(--text-tertiary)]'} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${
                      isSelected ? colors.textLight : 'text-[var(--text-primary)]'
                    }`}>
                      {goal.title}
                    </h3>
                    
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? `${colors.border} ${colors.bg}`
                        : 'border-[var(--border-default)]'
                    }`}>
                      {isSelected && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                  </div>
                  
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {goal.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Goal Details */}
      {selectedGoalData && (
        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-500" />
            <h4 className="font-semibold text-[var(--text-primary)]">
              Your Content Strategy
            </h4>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">Content Focus</p>
              <ul className="space-y-1.5">
                {selectedGoalData.contentFocus.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <ArrowRight size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">Key Metrics We'll Track</p>
              <ul className="space-y-1.5">
                {selectedGoalData.metrics.map((metric, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <BarChart3 size={14} className="text-green-500" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-start gap-2">
              <TrendingUp size={16} className="text-green-500 mt-0.5" />
              <p className="text-xs text-[var(--text-tertiary)]">
                <span className="font-medium text-[var(--text-secondary)]">Pro tip:</span> Companies 
                with a clear goal see 3x better engagement than those posting without direction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Selection Hint */}
      {!selectedGoal && (
        <div className="text-center py-4">
          <p className="text-sm text-[var(--text-tertiary)]">
            Select a goal to see how it shapes your content strategy
          </p>
        </div>
      )}
    </div>
  )
}