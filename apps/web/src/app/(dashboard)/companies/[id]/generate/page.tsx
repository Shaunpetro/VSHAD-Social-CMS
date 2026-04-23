// apps/web/src/app/(dashboard)/companies/[id]/generate/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Calendar,
  Target,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
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
  RefreshCw,
  Settings2,
  Check,
  X,
  PlusCircle,
  Flame,
  Clock,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Company {
  id: string;
  name: string;
  industry: string | null;
}

interface Platform {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
}

interface ContentPillar {
  id: string;
  name: string;
  topics: string[];
  contentTypes: string[];
  avgEngagement: number | null;
}

interface Intelligence {
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

interface IntelligenceHealth {
  overallScore: number;
  breakdown: Record<string, { score: number; status: string; message: string }>;
  recommendations: string[];
  dataAge: {
    daysOfData: number;
  };
}

interface VolumeRecommendation {
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

interface ContentMixItem {
  percentage: number;
  count: number;
  reasoning: string;
  suggestedTopics: string[];
  performanceNote: string | null;
}

interface ContentMixRecommendation {
  mix: Record<string, ContentMixItem>;
  totalPosts: number;
  isPerformanceBased: boolean;
  adjustments: string[];
  funnelBreakdown: Record<string, number>;
}

interface ScheduleSlot {
  dayOfWeek: string;
  date: string;
  time: string;
  platform: string;
  contentType: string;
  topic: string | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface ContentPlan {
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

type GenerationMode = 'single' | 'bulk';
type GenerationPeriod = 'weekly' | 'biweekly' | 'monthly';
type TopicMode = 'auto' | 'manual';

// ============================================
// CONSTANTS
// ============================================

const platformIcons: Record<string, typeof Linkedin> = {
  LINKEDIN: Linkedin,
  FACEBOOK: Facebook,
  TWITTER: Twitter,
  INSTAGRAM: Instagram,
  WORDPRESS: Globe,
};

const platformColors: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  LINKEDIN: { bg: 'bg-[#0A66C2]/10', border: 'border-[#0A66C2]', text: 'text-[#0A66C2]', ring: 'ring-[#0A66C2]/30' },
  FACEBOOK: { bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]', text: 'text-[#1877F2]', ring: 'ring-[#1877F2]/30' },
  TWITTER: { bg: 'bg-[#1DA1F2]/10', border: 'border-[#1DA1F2]', text: 'text-[#1DA1F2]', ring: 'ring-[#1DA1F2]/30' },
  INSTAGRAM: { bg: 'bg-[#E4405F]/10', border: 'border-[#E4405F]', text: 'text-[#E4405F]', ring: 'ring-[#E4405F]/30' },
  WORDPRESS: { bg: 'bg-[#21759B]/10', border: 'border-[#21759B]', text: 'text-[#21759B]', ring: 'ring-[#21759B]/30' },
};

const contentTypeIcons: Record<string, typeof FileText> = {
  educational: Lightbulb,
  engagement: MessageSquare,
  socialProof: Award,
  promotional: Megaphone,
  tips: FileText,
  behindTheScenes: Camera,
  community: Users,
  motivational: Heart,
};

const contentTypeColors: Record<string, string> = {
  educational: 'text-blue-500 bg-blue-500/10',
  engagement: 'text-purple-500 bg-purple-500/10',
  socialProof: 'text-amber-500 bg-amber-500/10',
  promotional: 'text-green-500 bg-green-500/10',
  tips: 'text-cyan-500 bg-cyan-500/10',
  behindTheScenes: 'text-pink-500 bg-pink-500/10',
  community: 'text-indigo-500 bg-indigo-500/10',
  motivational: 'text-red-500 bg-red-500/10',
};

const periodConfig: Record<GenerationPeriod, { label: string; description: string; days: number }> = {
  weekly: { label: 'Weekly', description: '7 days of content', days: 7 },
  biweekly: { label: 'Bi-weekly', description: '14 days of content', days: 14 },
  monthly: { label: 'Monthly', description: '30 days of content', days: 30 },
};

const toneOptions = [
  { value: 'professional', label: 'Professional', description: 'Polished & business-focused' },
  { value: 'casual', label: 'Casual', description: 'Relaxed & approachable' },
  { value: 'friendly', label: 'Friendly', description: 'Warm & personable' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert & confident' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDays(days: string[]): string {
  if (!days || days.length === 0) return 'Not set';
  return days.slice(0, 3).map(d => capitalizeFirst(d.slice(0, 3))).join(', ');
}

function getTopContentType(types: Record<string, number> | null | undefined): string {
  if (!types || Object.keys(types).length === 0) return 'Educational';
  const sorted = Object.entries(types).sort((a, b) => b[1] - a[1]);
  return capitalizeFirst(sorted[0]?.[0] || 'Educational');
}

// ============================================
// REUSABLE COMPONENTS
// ============================================

// Selection Card Component - Consistent across all selections
interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
}

function SelectionCard({ 
  selected, 
  onClick, 
  disabled, 
  children, 
  className = '', 
  size = 'md',
  accentColor,
}: SelectionCardProps) {
  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
  };

  const borderColor = accentColor || 'border-primary';
  const bgColor = accentColor ? accentColor.replace('border-', 'bg-').replace(']', '/10]') : 'bg-primary/5';

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
            ? `${borderColor} ${bgColor} shadow-lg shadow-primary/10 scale-[1.02]`
            : 'border-border/60 hover:border-border hover:bg-secondary/30 hover:scale-[1.01]'
        }
        ${className}
      `}
    >
      {/* Selection indicator */}
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

function ExpandableSection({ 
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
        <div className={`p-1.5 rounded-lg transition-all duration-200 ${expanded ? 'bg-primary/10 rotate-0' : 'hover:bg-secondary rotate-0'}`}>
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
function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function EnhancedGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  // Data state
  const [company, setCompany] = useState<Company | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [intelligence, setIntelligence] = useState<Intelligence | null>(null);
  const [contentPlan, setContentPlan] = useState<ContentPlan | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Generation settings
  const [mode, setMode] = useState<GenerationMode>('bulk');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [period, setPeriod] = useState<GenerationPeriod>('weekly');
  const [topicMode, setTopicMode] = useState<TopicMode>('auto');
  const [manualTopics, setManualTopics] = useState('');
  const [customPostCount, setCustomPostCount] = useState<number | null>(null);
  const [tone, setTone] = useState('professional');

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    intelligence: true,
    volume: true,
    mix: true,
    schedule: false,
  });

  // Single post state (for single mode)
  const [singleTopic, setSingleTopic] = useState('');
  const [singlePlatform, setSinglePlatform] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchCompanyData = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [companyRes, platformsRes, intelligenceRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/companies/${companyId}/platforms`),
        fetch(`/api/companies/${companyId}/intelligence`),
      ]);

      if (!companyRes.ok) throw new Error('Failed to fetch company');

      const companyData = await companyRes.json();
      setCompany(companyData);

      if (platformsRes.ok) {
        const platformsData = await platformsRes.json();
        console.log('Platforms loaded:', platformsData);
        setPlatforms(platformsData);
        
        // Auto-select connected platforms
        const connected = platformsData.filter((p: Platform) => p.isConnected).map((p: Platform) => p.type);
        setSelectedPlatforms(connected);
        
        // Set single platform to first connected
        if (connected.length > 0) {
          setSinglePlatform(connected[0]);
        }
      } else {
        console.error('Failed to fetch platforms:', await platformsRes.text());
      }

      if (intelligenceRes.ok) {
        const intelligenceData = await intelligenceRes.json();
        console.log('Intelligence loaded:', intelligenceData);
        setIntelligence(intelligenceData);
        setTone(intelligenceData.defaultTone || 'professional');
      } else {
        console.error('Failed to fetch intelligence:', await intelligenceRes.text());
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const fetchContentPlan = useCallback(async () => {
    if (!companyId || selectedPlatforms.length === 0) return;

    try {
      setIsPlanLoading(true);

      const res = await fetch(`/api/generate/plan?companyId=${companyId}&period=${period}&platforms=${selectedPlatforms.join(',')}`);
      
      if (res.ok) {
        const planData = await res.json();
        setContentPlan(planData);
        
        // Set custom post count to recommended if not already set
        if (customPostCount === null) {
          setCustomPostCount(planData.volume.recommended);
        }
      }
    } catch (err) {
      console.error('Failed to fetch content plan:', err);
    } finally {
      setIsPlanLoading(false);
    }
  }, [companyId, period, selectedPlatforms, customPostCount]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  useEffect(() => {
    if (mode === 'bulk' && selectedPlatforms.length > 0 && !isLoading) {
      fetchContentPlan();
    }
  }, [mode, selectedPlatforms, period, isLoading, fetchContentPlan]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ============================================
  // ACTIONS
  // ============================================

  const togglePlatform = (platformType: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformType)
        ? prev.filter(p => p !== platformType)
        : [...prev, platformType]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBulkGenerate = async () => {
    if (selectedPlatforms.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one platform' });
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Preparing content strategy...');
    setNotification(null);

    try {
      // Simulate progress steps
      const steps = [
        'Analyzing your brand intelligence...',
        'Optimizing content mix...',
        'Generating AI content...',
        'Scheduling posts...',
      ];
      
      let stepIndex = 0;
      const stepInterval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length;
        setGenerationStep(steps[stepIndex]);
      }, 2000);

      const res = await fetch('/api/generate/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          platforms: selectedPlatforms,
          period,
          postCount: customPostCount || contentPlan?.volume.recommended,
          topicMode,
          manualTopics: topicMode === 'manual' ? manualTopics.split('\n').filter(t => t.trim()) : undefined,
          tone,
        }),
      });

      clearInterval(stepInterval);
      
      const data = await res.json();

      if (res.ok && data.success) {
        setGenerationStep('Complete!');
        setNotification({
          type: 'success',
          message: `Generated ${data.postsGenerated} posts! ${data.postsQueued} pending review, ${data.postsScheduled} auto-scheduled.`,
        });
        
        // Redirect to queue after short delay
        setTimeout(() => {
          router.push(`/companies/${companyId}/queue`);
        }, 2000);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate content',
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleSingleGenerate = async () => {
    if (!singlePlatform) {
      setNotification({ type: 'error', message: 'Please select a platform' });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          platformId: platforms.find(p => p.type === singlePlatform)?.id,
          platform: singlePlatform.toLowerCase() as 'linkedin' | 'facebook' | 'twitter' | 'instagram' | 'wordpress',
          topic: singleTopic || undefined,
          tone,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setGeneratedContent(data.content);
        setNotification({ type: 'success', message: 'Content generated successfully!' });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate content',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Get best days - prefer learned, fallback to preferred
  const bestDays = intelligence?.learnedBestDays?.length 
    ? intelligence.learnedBestDays 
    : intelligence?.preferredDays || [];

  // Get top content type - prefer learned, fallback to default
  const topContentType = getTopContentType(intelligence?.topPerformingTypes);

  // Connected platforms count
  const connectedPlatforms = platforms.filter(p => p.isConnected);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderIntelligenceScore = () => {
    const score = contentPlan?.intelligenceHealth.overallScore || intelligence?.intelligenceScore || 0;
    const getScoreColor = (s: number) => {
      if (s >= 70) return 'text-green-500';
      if (s >= 40) return 'text-amber-500';
      return 'text-red-500';
    };
    const getScoreBg = (s: number) => {
      if (s >= 70) return 'bg-gradient-to-r from-green-500 to-emerald-500';
      if (s >= 40) return 'bg-gradient-to-r from-amber-500 to-orange-500';
      return 'bg-gradient-to-r from-red-500 to-rose-500';
    };

    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${getScoreBg(score)} rounded-full`}
          />
        </div>
        <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}%</span>
      </div>
    );
  };

  const renderTrendIcon = (trend: string | null) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-muted-foreground" />;
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Loading intelligence data...</p>
            <p className="text-xs text-muted-foreground mt-1">Preparing your smart content generator</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <AlertCircle size={48} className="text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">{error || 'Company not found'}</h3>
          <p className="text-sm text-muted-foreground mt-1">Please try again or contact support</p>
          <Link 
            href="/companies" 
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={20} className="shrink-0" />
            ) : (
              <AlertCircle size={20} className="shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{notification.message}</p>
            <button 
              onClick={() => setNotification(null)} 
              className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-all"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link
            href={`/companies/${companyId}`}
            className="hover:text-foreground transition-colors flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:bg-secondary"
          >
            <ArrowLeft size={14} />
            {company.name}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Brain className="text-primary" size={28} />
              </div>
              Smart Content Generator
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              AI-powered content creation based on your performance data
            </p>
          </div>
          <button
            onClick={fetchContentPlan}
            disabled={isPlanLoading}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
            title="Refresh plan"
          >
            <RefreshCw size={18} className={isPlanLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 p-1.5 bg-secondary/50 rounded-xl w-fit">
        <button
          onClick={() => setMode('single')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            mode === 'single'
              ? 'bg-background text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText size={16} />
          Single Post
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            mode === 'bulk'
              ? 'bg-background text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap size={16} />
          Bulk Generate
        </button>
      </div>

      {/* ============================================ */}
      {/* SINGLE POST MODE */}
      {/* ============================================ */}

      {mode === 'single' && (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-border/60 bg-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Generate Single Post</h2>
                <p className="text-sm text-muted-foreground">Create one piece of content</p>
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Select Platform</label>
              {connectedPlatforms.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {connectedPlatforms.map(plat => {
                    const Icon = platformIcons[plat.type] || Globe;
                    const colors = platformColors[plat.type] || platformColors.LINKEDIN;
                    const isSelected = singlePlatform === plat.type;

                    return (
                      <SelectionCard
                        key={plat.id}
                        selected={isSelected}
                        onClick={() => setSinglePlatform(plat.type)}
                        size="md"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <Icon size={20} className={colors.text} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold">{plat.name}</p>
                            <p className="text-xs text-muted-foreground">Connected</p>
                          </div>
                        </div>
                      </SelectionCard>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">No platforms connected</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Connect a platform to start generating content.
                  </p>
                  <Link
                    href={`/companies/${companyId}/platforms`}
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                  >
                    <PlusCircle size={14} />
                    Connect Platform
                  </Link>
                </div>
              )}
            </div>

            {/* Topic */}
            <div>
              <label className="text-sm font-medium mb-2 block">Topic (optional)</label>
              <input
                type="text"
                value={singleTopic}
                onChange={(e) => setSingleTopic(e.target.value)}
                placeholder="Leave empty for AI to choose based on your pillars..."
                className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* Tone */}
            <div>
              <label className="text-sm font-medium mb-3 block">Tone</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {toneOptions.map(t => (
                  <SelectionCard
                    key={t.value}
                    selected={tone === t.value}
                    onClick={() => setTone(t.value)}
                    size="sm"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                  </SelectionCard>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleSingleGenerate}
              disabled={isGenerating || !singlePlatform}
              className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Post
                </>
              )}
            </button>

            {/* Generated Content */}
            <AnimatePresence>
              {generatedContent && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-2 border-green-500/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-500" />
                      <span className="text-sm font-semibold">Generated Content</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedContent);
                        setNotification({ type: 'success', message: 'Copied to clipboard!' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{generatedContent}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* BULK GENERATE MODE */}
      {/* ============================================ */}

      {mode === 'bulk' && (
        <div className="space-y-6">
          {/* Intelligence Summary Card */}
          <ExpandableSection
            title="Intelligence Summary"
            subtitle="Data quality score and AI recommendations"
            icon={<Brain size={20} className="text-primary" />}
            iconBg="bg-gradient-to-br from-primary/20 to-purple-500/20"
            expanded={expandedSections.intelligence}
            onToggle={() => toggleSection('intelligence')}
            hasData={!!intelligence}
            badge={
              contentPlan?.intelligenceHealth.overallScore ? (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  contentPlan.intelligenceHealth.overallScore >= 70 
                    ? 'bg-green-500/10 text-green-500'
                    : contentPlan.intelligenceHealth.overallScore >= 40
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-red-500/10 text-red-500'
                }`}>
                  {contentPlan.intelligenceHealth.overallScore}% Ready
                </span>
              ) : null
            }
          >
            <div className="space-y-4">
              {/* Score Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Data Quality</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {contentPlan?.intelligenceHealth.dataAge.daysOfData || 0} days of data
                  </span>
                </div>
                {renderIntelligenceScore()}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Avg Engagement</span>
                  </div>
                  <p className="text-lg font-bold">
                    {intelligence?.avgEngagementRate 
                      ? `${intelligence.avgEngagementRate.toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                  <div className="flex items-center gap-2 mb-1">
                    {renderTrendIcon(intelligence?.engagementTrend || null)}
                    <span className="text-xs text-muted-foreground">Trend</span>
                  </div>
                  <p className="text-lg font-bold capitalize">
                    {intelligence?.engagementTrend || 'Stable'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Best Days</span>
                  </div>
                  <p className="text-sm font-medium truncate">
                    {formatDays(bestDays)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Top Type</span>
                  </div>
                  <p className="text-sm font-medium truncate">
                    {topContentType}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {contentPlan?.intelligenceHealth.recommendations && 
               contentPlan.intelligenceHealth.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        Recommendations
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {contentPlan.intelligenceHealth.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ExpandableSection>

          {/* Platform Selection */}
          <div className="rounded-xl border-2 border-border/60 bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Platforms</h2>
                <p className="text-sm text-muted-foreground">Select where to post</p>
              </div>
            </div>
            
            {platforms.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {platforms.map(plat => {
                  const Icon = platformIcons[plat.type] || Globe;
                  const colors = platformColors[plat.type] || platformColors.LINKEDIN;
                  const isSelected = selectedPlatforms.includes(plat.type);
                  const isConnected = plat.isConnected;

                  return (
                    <SelectionCard
                      key={plat.id}
                      selected={isSelected}
                      onClick={() => isConnected && togglePlatform(plat.type)}
                      disabled={!isConnected}
                      size="lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isConnected ? colors.bg : 'bg-muted'}`}>
                          <Icon size={24} className={isConnected ? colors.text : 'text-muted-foreground'} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">{plat.name}</p>
                          <p className={`text-xs ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {isConnected ? '✓ Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                    </SelectionCard>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle size={18} />
                  <span className="text-sm font-semibold">No platforms found</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Connect a social media platform to start generating content.
                </p>
                <Link
                  href={`/companies/${companyId}/platforms`}
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                >
                  <PlusCircle size={14} />
                  Connect Platform
                </Link>
              </div>
            )}
            
            {platforms.length > 0 && selectedPlatforms.length === 0 && (
              <p className="text-sm text-amber-500 mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10">
                <AlertCircle size={16} />
                Select at least one platform to continue
              </p>
            )}
          </div>

          {/* Period Selection */}
          <div className="rounded-xl border-2 border-border/60 bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar size={20} className="text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Generation Period</h2>
                <p className="text-sm text-muted-foreground">How much content to create</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(periodConfig) as GenerationPeriod[]).map(p => {
                const config = periodConfig[p];
                const isSelected = period === p;
                
                return (
                  <SelectionCard
                    key={p}
                    selected={isSelected}
                    onClick={() => {
                      setPeriod(p);
                      setCustomPostCount(null); // Reset to let it recalculate
                    }}
                    size="lg"
                  >
                    <div className="text-center">
                      <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                        isSelected ? 'bg-primary/20' : 'bg-secondary'
                      }`}>
                        <span className="text-lg font-bold">{config.days}</span>
                      </div>
                      <p className="text-sm font-semibold">{config.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                    </div>
                  </SelectionCard>
                );
              })}
            </div>
          </div>

          {/* Volume Calculation */}
          {contentPlan && (
            <ExpandableSection
              title="Calculated Volume"
              subtitle={`Recommended: ${contentPlan.volume.recommended} posts`}
              icon={<BarChart3 size={20} className="text-blue-500" />}
              iconBg="bg-blue-500/10"
              expanded={expandedSections.volume}
              onToggle={() => toggleSection('volume')}
              badge={
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                  {contentPlan.volume.recommended} posts
                </span>
              }
            >
              <div className="space-y-4">
                {/* Breakdown */}
                <div className="p-4 rounded-xl bg-secondary/30 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Base (your setting)</span>
                    <span className="font-semibold">{contentPlan.volume.breakdown.base}/week</span>
                  </div>
                  {contentPlan.volume.breakdown.industryModifier !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Industry adjustment</span>
                      <span className={`font-semibold ${contentPlan.volume.breakdown.industryModifier > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {contentPlan.volume.breakdown.industryModifier > 0 ? '+' : ''}{contentPlan.volume.breakdown.industryModifier}
                      </span>
                    </div>
                  )}
                  {contentPlan.volume.breakdown.goalModifier !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Goal modifier</span>
                      <span className={`font-semibold ${contentPlan.volume.breakdown.goalModifier > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {contentPlan.volume.breakdown.goalModifier > 0 ? '+' : ''}{contentPlan.volume.breakdown.goalModifier}
                      </span>
                    </div>
                  )}
                  {contentPlan.volume.breakdown.performanceModifier !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Performance trend</span>
                      <span className={`font-semibold ${contentPlan.volume.breakdown.performanceModifier > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {contentPlan.volume.breakdown.performanceModifier > 0 ? '+' : ''}{contentPlan.volume.breakdown.performanceModifier}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border/60 pt-3 mt-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total for {period}</span>
                      <span className="text-primary text-lg">{contentPlan.volume.recommended} posts</span>
                    </div>
                  </div>
                </div>

                {/* Custom Override */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/60">
                  <span className="text-sm font-medium">Override post count:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCustomPostCount(Math.max(1, (customPostCount || contentPlan.volume.recommended) - 1))}
                      className="p-2 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center text-xl font-bold">
                      {customPostCount || contentPlan.volume.recommended}
                    </span>
                    <button
                      onClick={() => setCustomPostCount((customPostCount || contentPlan.volume.recommended) + 1)}
                      className="p-2 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                {customPostCount !== contentPlan.volume.recommended && customPostCount !== null && (
                  <button
                    onClick={() => setCustomPostCount(null)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    Reset to recommended
                  </button>
                )}

                {/* Platform Distribution */}
                {Object.keys(contentPlan.volume.breakdown.platformDistribution).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3">Platform Distribution</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(contentPlan.volume.breakdown.platformDistribution).map(([plat, count]) => {
                        const Icon = platformIcons[plat] || Globe;
                        const colors = platformColors[plat] || platformColors.LINKEDIN;
                        return (
                          <div
                            key={plat}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}
                          >
                            <Icon size={16} className={colors.text} />
                            <span className="text-sm font-semibold">{count} posts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                <div className="text-xs text-muted-foreground space-y-1.5">
                  {contentPlan.volume.reasoning.map((reason, i) => (
                    <p key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {reason}
                    </p>
                  ))}
                </div>
              </div>
            </ExpandableSection>
          )}

          {/* Content Mix */}
          {contentPlan && (
            <ExpandableSection
              title="Content Strategy"
              subtitle={contentPlan.contentMix.isPerformanceBased
                ? '✨ Optimized based on your performance'
                : 'Using industry best practices'}
              icon={<Target size={20} className="text-purple-500" />}
              iconBg="bg-purple-500/10"
              expanded={expandedSections.mix}
              onToggle={() => toggleSection('mix')}
              badge={
                contentPlan.contentMix.isPerformanceBased ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 flex items-center gap-1">
                    <Sparkles size={10} />
                    AI Optimized
                  </span>
                ) : null
              }
            >
              <div className="space-y-4">
                {/* Topic Mode Selection */}
                <div className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-sm font-semibold mb-3">Topic Selection</p>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectionCard
                      selected={topicMode === 'auto'}
                      onClick={() => setTopicMode('auto')}
                      size="md"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${topicMode === 'auto' ? 'bg-primary/20' : 'bg-secondary'}`}>
                          <Brain size={20} className={topicMode === 'auto' ? 'text-primary' : 'text-muted-foreground'} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">AI Optimized</p>
                          <p className="text-xs text-muted-foreground">Based on performance & pillars</p>
                        </div>
                      </div>
                    </SelectionCard>
                    <SelectionCard
                      selected={topicMode === 'manual'}
                      onClick={() => setTopicMode('manual')}
                      size="md"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${topicMode === 'manual' ? 'bg-primary/20' : 'bg-secondary'}`}>
                          <Settings2 size={20} className={topicMode === 'manual' ? 'text-primary' : 'text-muted-foreground'} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">Manual</p>
                          <p className="text-xs text-muted-foreground">I&apos;ll provide topics</p>
                        </div>
                      </div>
                    </SelectionCard>
                  </div>

                  <AnimatePresence>
                    {topicMode === 'manual' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <textarea
                          value={manualTopics}
                          onChange={(e) => setManualTopics(e.target.value)}
                          placeholder="Enter topics (one per line)..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                                {/* Content Mix Breakdown */}
                                <div className="space-y-3">
                  {Object.entries(contentPlan.contentMix.mix).map(([type, item]) => {
                    const Icon = contentTypeIcons[type] || FileText;
                    const colorClass = contentTypeColors[type] || 'text-gray-500 bg-gray-500/10';

                    return (
                      <div key={type} className="p-4 rounded-xl bg-background border border-border/40 hover:border-border transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl ${colorClass}`}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold capitalize">{type}</span>
                                <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                                  {item.percentage}%
                                </span>
                                {item.performanceNote && (
                                  <span className="text-xs text-green-500 flex items-center gap-1">
                                    <TrendingUp size={10} />
                                    {item.performanceNote}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{item.reasoning}</p>
                              {item.suggestedTopics.length > 0 && topicMode === 'auto' && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {item.suggestedTopics.map((topic, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 rounded-lg bg-secondary/80 text-[11px] font-medium"
                                    >
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold text-primary">{item.count}</span>
                            <span className="text-[10px] text-muted-foreground">posts</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Funnel Breakdown */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 border border-border/40">
                  <p className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Marketing Funnel Distribution</p>
                  <div className="flex items-center gap-1">
                    {Object.entries(contentPlan.contentMix.funnelBreakdown).map(([stage, count], index, arr) => {
                      const widthPercent = (count / contentPlan.contentMix.totalPosts) * 100;
                      const colors = {
                        awareness: 'bg-blue-500',
                        consideration: 'bg-purple-500',
                        conversion: 'bg-green-500',
                        retention: 'bg-amber-500',
                      };
                      const bgColor = colors[stage as keyof typeof colors] || 'bg-gray-500';
                      
                      return (
                        <div key={stage} className="flex-1 text-center">
                          <div className={`h-2 ${bgColor} ${index === 0 ? 'rounded-l-full' : ''} ${index === arr.length - 1 ? 'rounded-r-full' : ''}`} />
                          <p className="text-lg font-bold mt-2">{count}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{stage}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Adjustments */}
                {contentPlan.contentMix.adjustments.length > 0 && (
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Sparkles size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">AI Adjustments</p>
                        <ul className="mt-2 space-y-1.5">
                          {contentPlan.contentMix.adjustments.map((adj, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {adj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ExpandableSection>
          )}

          {/* Schedule Preview */}
          {contentPlan && contentPlan.schedule.slots.length > 0 && (
            <ExpandableSection
              title="Schedule Preview"
              subtitle={`${contentPlan.schedule.slots.length} posts planned`}
              icon={<Calendar size={20} className="text-green-500" />}
              iconBg="bg-green-500/10"
              expanded={expandedSections.schedule}
              onToggle={() => toggleSection('schedule')}
              badge={
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                  {contentPlan.schedule.slots.length} slots
                </span>
              }
            >
              <div className="space-y-4">
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 -mr-2">
                  {contentPlan.schedule.slots.map((slot, i) => {
                    const Icon = platformIcons[slot.platform] || Globe;
                    const colors = platformColors[slot.platform] || platformColors.LINKEDIN;
                    const typeColor = contentTypeColors[slot.contentType] || 'bg-gray-500/10 text-gray-500';

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/40 hover:border-border hover:shadow-sm transition-all"
                      >
                        <div className="text-center min-w-[70px] p-2 rounded-lg bg-secondary/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{slot.dayOfWeek.slice(0, 3)}</p>
                          <p className="text-sm font-bold">{slot.time}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon size={16} className={colors.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${typeColor}`}>
                              {slot.contentType}
                            </span>
                            <ConfidenceBadge confidence={slot.confidence} />
                          </div>
                          {slot.topic && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{slot.topic}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {contentPlan.schedule.optimizationNotes.length > 0 && (
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground">Optimization Notes</p>
                    <div className="space-y-1">
                      {contentPlan.schedule.optimizationNotes.map((note, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <Info size={10} className="mt-0.5 shrink-0" />
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ExpandableSection>
          )}

          {/* Generate Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 p-6 shadow-lg shadow-primary/5"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Zap className="text-primary" size={20} />
                  Ready to Generate
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">{customPostCount || contentPlan?.volume.recommended || 0}</span> posts • 
                  <span className="font-semibold text-foreground"> {selectedPlatforms.length}</span> platform{selectedPlatforms.length !== 1 ? 's' : ''} • 
                  <span className="font-semibold text-foreground"> {periodConfig[period].label}</span>
                </p>
                {contentPlan?.summary.estimatedEngagement === 'above_average' && (
                  <p className="text-xs text-green-500 mt-2 flex items-center gap-1.5 font-medium">
                    <TrendingUp size={14} />
                    Estimated engagement: Above your average
                  </p>
                )}
              </div>
              <button
                onClick={handleBulkGenerate}
                disabled={isGenerating || selectedPlatforms.length === 0 || isPlanLoading}
                className="relative flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    <div className="text-left">
                      <span className="block">Generating...</span>
                      {generationStep && (
                        <span className="block text-xs font-normal opacity-80">{generationStep}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Zap size={24} className="group-hover:scale-110 transition-transform" />
                    Generate {customPostCount || contentPlan?.volume.recommended || 0} Posts
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Auto-approve info */}
          {intelligence?.autoApprove && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Auto-approve is enabled</p>
                <p className="text-xs text-muted-foreground">Generated posts will be automatically scheduled for publishing.</p>
              </div>
            </div>
          )}

          {!intelligence?.autoApprove && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Info size={18} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Manual approval required</p>
                <p className="text-xs text-muted-foreground">Generated posts will go to your review queue before publishing.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
