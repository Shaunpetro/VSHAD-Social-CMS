// apps/web/src/app/(dashboard)/companies/[id]/settings/constants.ts

import {
    Building2,
    Palette,
    LayoutGrid,
    Calendar,
    Zap,
    AlertTriangle,
    LucideIcon
  } from 'lucide-react'
  
  // ============================================
  // TYPES
  // ============================================
  
  export interface ContentPillar {
    id: string
    name: string
    topics: string[]
    contentTypes: string[]
    frequencyWeight: number
    isActive: boolean
  }
  
  export interface IndustryItem {
    code: string
    name: string
    category?: string
    confidence?: number
  }
  
  export interface Intelligence {
    id: string
    companyId: string
    postsPerWeek: number
    preferredDays: string[]
    preferredTimes: unknown
    timezone: string
    autoApprove: boolean
    brandPersonality: string[]
    defaultTone: string
    uniqueSellingPoints: string[]
    targetAudience: string | null
    primaryGoals: string[]
    contentPillars: ContentPillar[]
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
    onboardingCompleted: boolean
    learnedBestDays: string[]
    learnedBestTimes: unknown
    learnedBestPillars: unknown
    createdAt: string
    updatedAt: string
  }
  
  export interface Company {
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
  
  export interface Industry {
    id: string
    industry: string
  }
  
  // Tab type
  export interface TabConfig {
    id: TabId
    label: string
    icon: LucideIcon
  }
  
  export type TabId = 'company' | 'brand' | 'content' | 'schedule' | 'automation' | 'danger'
  
  // ============================================
  // CONSTANTS
  // ============================================
  
  export const TABS: TabConfig[] = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'brand', label: 'Brand Voice', icon: Palette },
    { id: 'content', label: 'Content Strategy', icon: LayoutGrid },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ]
  
  export const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
  ]
  
  export const TIME_SLOTS = [
    { value: 'early_morning', label: '6-9 AM', description: 'Early risers' },
    { value: 'morning', label: '9-12 PM', description: 'Work hours start' },
    { value: 'lunch', label: '12-2 PM', description: 'Lunch break' },
    { value: 'afternoon', label: '2-5 PM', description: 'Afternoon focus' },
    { value: 'evening', label: '5-8 PM', description: 'After work' },
    { value: 'night', label: '8-11 PM', description: 'Evening wind-down' },
  ]
  
  export const PERSONALITY_TRAITS = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'innovative', label: 'Innovative' },
    { value: 'approachable', label: 'Approachable' },
    { value: 'bold', label: 'Bold' },
    { value: 'empathetic', label: 'Empathetic' },
    { value: 'playful', label: 'Playful' },
  ]
  
  export const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
    { value: 'conversational', label: 'Conversational', description: 'Casual and engaging' },
    { value: 'inspirational', label: 'Inspirational', description: 'Motivating and uplifting' },
    { value: 'educational', label: 'Educational', description: 'Informative and helpful' },
    { value: 'witty', label: 'Witty', description: 'Clever and humorous' },
  ]
  
  export const TIMEZONES = [
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
  
  export const CONTENT_TYPES = [
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
  // HELPER FUNCTIONS
  // ============================================
  
  export function parseExtractedIndustries(extracted: unknown): IndustryItem[] {
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
  
  export function parsePreferredTimes(times: unknown): string[] {
    if (Array.isArray(times)) {
      return times.filter(t => typeof t === 'string')
    }
    if (times && typeof times === 'object' && !Array.isArray(times)) {
      return Object.keys(times as Record<string, unknown>)
    }
    return ['morning', 'afternoon']
  }
  
  export function getInitials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  }