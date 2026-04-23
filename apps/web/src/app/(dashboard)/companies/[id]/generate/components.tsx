// apps/web/src/app/(dashboard)/companies/[id]/generate/components.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Globe,
  FileText,
  Users,
  MessageSquare,
  Award,
  Megaphone,
  Lightbulb,
  Heart,
  Camera,
  Check,
  ChevronDown,
  TrendingUp,
  Info,
  Flame,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface Company {
  id: string;
  name: string;
  industry: string | null;
}

export interface Platform {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
}

export interface ContentPillar {
  id: string;
  name: string;
  topics: string[];
  contentTypes: string[];
  avgEngagement: number | null;
}

export interface Intelligence {
  postsPerWeek: number;
  preferredDays: string[];
  primaryGoals: string[];
  defaultTone: string;
  autoApprove: boolean;
  intelligenceScore: number;
  engagementTrend: string | null;
  avgEngagementRate: number | null;
  topPerformingTypes: Record<string, number> | null;
  learnedBestDays: string[];
  learnedBestTimes: Record<string, string[]> | null;
  contentPillars: ContentPillar[];
  uniqueSellingPoints: string[];
  onboardingCompleted: boolean;
}

export interface IntelligenceHealth {
  overallScore: number;
  breakdown: Record<string, { score: number; status: string; message: string }>;
  recommendations: string[];
  dataAge: {
    daysOfData: number;
  };
}

export interface VolumeRecommendation {
  recommended: number;
  minimum: number;
  maximum: number;
  breakdown: {
    base: number;
    industryModifier: number;
    goalModifier: number;
    performanceModifier: number;
    platformDistribution: Record<string, number>;
  };
  reasoning: string[];
}

export interface ContentMixItem {
  percentage: number;
  count: number;
  reasoning: string;
  suggestedTopics: string[];
  performanceNote: string | null;
}

export interface ContentMixRecommendation {
  mix: Record<string, ContentMixItem>;
  totalPosts: number;
  isPerformanceBased: boolean;
  adjustments: string[];
  funnelBreakdown: Record<string, number>;
}

export interface ScheduleSlot {
  dayOfWeek: string;
  date: string;
  time: string;
  platform: string;
  contentType: string;
  topic: string | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ContentPlan {
  intelligenceHealth: IntelligenceHealth;
  volume: VolumeRecommendation;
  contentMix: ContentMixRecommendation;
  schedule: {
    slots: ScheduleSlot[];
    optimizationNotes: string[];
  };
  summary: {
    totalPosts: number;
    platforms: string[];
    topContentTypes: string[];
    estimatedEngagement: string;
  };
}

export type GenerationMode = 'single' | 'bulk';
export type GenerationPeriod = 'weekly' | 'biweekly' | 'monthly';
export type TopicMode = 'auto' | 'manual';

// ============================================
// CONSTANTS
// ============================================

export const platformIcons: Record<string, typeof Linkedin> = {
  LINKEDIN: Linkedin,
  FACEBOOK: Facebook,
  TWITTER: Twitter,
  INSTAGRAM: Instagram,
  WORDPRESS: Globe,
};

export const platformColors: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  LINKEDIN: { bg: 'bg-[#0A66C2]/10', border: 'border-[#0A66C2]', text: 'text-[#0A66C2]', ring: 'ring-[#0A66C2]/30' },
  FACEBOOK: { bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]', text: 'text-[#1877F2]', ring: 'ring-[#1877F2]/30' },
  TWITTER: { bg: 'bg-[#1DA1F2]/10', border: 'border-[#1DA1F2]', text: 'text-[#1DA1F2]', ring: 'ring-[#1DA1F2]/30' },
  INSTAGRAM: { bg: 'bg-[#E4405F]/10', border: 'border-[#E4405F]', text: 'text-[#E4405F]', ring: 'ring-[#E4405F]/30' },
  WORDPRESS: { bg: 'bg-[#21759B]/10', border: 'border-[#21759B]', text: 'text-[#21759B]', ring: 'ring-[#21759B]/30' },
};

export const contentTypeIcons: Record<string, typeof FileText> = {
  educational: Lightbulb,
  engagement: MessageSquare,
  socialProof: Award,
  promotional: Megaphone,
  tips: FileText,
  behindTheScenes: Camera,
  community: Users,
  motivational: Heart,
};

export const contentTypeColors: Record<string, string> = {
  educational: 'text-blue-500 bg-blue-500/10',
  engagement: 'text-purple-500 bg-purple-500/10',
  socialProof: 'text-amber-500 bg-amber-500/10',
  promotional: 'text-green-500 bg-green-500/10',
  tips: 'text-cyan-500 bg-cyan-500/10',
  behindTheScenes: 'text-pink-500 bg-pink-500/10',
  community: 'text-indigo-500 bg-indigo-500/10',
  motivational: 'text-red-500 bg-red-500/10',
};

export const periodConfig: Record<GenerationPeriod, { label: string; description: string; days: number }> = {
  weekly: { label: 'Weekly', description: '7 days of content', days: 7 },
  biweekly: { label: 'Bi-weekly', description: '14 days of content', days: 14 },
  monthly: { label: 'Monthly', description: '30 days of content', days: 30 },
};

export const toneOptions = [
  { value: 'professional', label: 'Professional', description: 'Polished & business-focused' },
  { value: 'casual', label: 'Casual', description: 'Relaxed & approachable' },
  { value: 'friendly', label: 'Friendly', description: 'Warm & personable' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert & confident' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDays(days: string[]): string {
  if (!days || days.length === 0) return 'Not set';
  return days.slice(0, 3).map(d => capitalizeFirst(d.slice(0, 3))).join(', ');
}

export function getTopContentType(types: Record<string, number> | null | undefined): string {
  if (!types || Object.keys(types).length === 0) return 'Educational';
  const sorted = Object.entries(types).sort((a, b) => b[1] - a[1]);
  return capitalizeFirst(sorted[0]?.[0] || 'Educational');
}

// ============================================
// REUSABLE COMPONENTS
// ============================================

// Selection Card Component
interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SelectionCard({ 
  selected, 
  onClick, 
  disabled, 
  children, 
  className = '', 
  size = 'md',
}: SelectionCardProps) {
  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded-xl border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background
        ${sizeClasses[size]}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed border-border/40 bg-muted/20' 
          : selected
            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]'
            : 'border-border/60 hover:border-border hover:bg-secondary/30 hover:scale-[1.01]'
        }
        ${className}
      `}
    >
      {selected && !disabled && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-primary text-primary-foreground shadow-md"
        >
          <Check size={10} strokeWidth={3} />
        </motion.div>
      )}
      {children}
    </button>
  );
}

// Expandable Section Component
interface ExpandableSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  hasData?: boolean;
  children: React.ReactNode;
}

export function ExpandableSection({ 
  title, 
  subtitle, 
  icon, 
  iconBg, 
  expanded, 
  onToggle, 
  badge,
  hasData = true,
  children 
}: ExpandableSectionProps) {
  return (
    <div className={`
      rounded-xl border-2 transition-all duration-200
      ${expanded 
        ? 'border-primary/40 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 shadow-lg shadow-primary/5' 
        : hasData 
          ? 'border-border/60 bg-card hover:border-primary/20 hover:shadow-md'
          : 'border-border/40 bg-card/50'
      }
    `}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg} transition-transform duration-200 ${expanded ? 'scale-110' : ''}`}>
            {icon}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{title}</h2>
              {badge}
            </div>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className={`p-1.5 rounded-lg transition-all duration-200 ${expanded ? 'bg-primary/10' : 'hover:bg-secondary'}`}>
          <ChevronDown size={20} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0">
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Confidence Badge Component
export function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { icon: Flame, text: 'High confidence', className: 'text-green-500 bg-green-500/10' },
    medium: { icon: TrendingUp, text: 'Medium', className: 'text-amber-500 bg-amber-500/10' },
    low: { icon: Info, text: 'Low', className: 'text-muted-foreground bg-secondary' },
  };
  
  const { icon: Icon, text, className } = config[confidence];
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${className}`}>
      <Icon size={10} />
      {text}
    </span>
  );
}