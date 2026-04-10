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
  Calendar,
  Clock,
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
  HelpCircle,
  RefreshCw,
  Settings2,
  Play,
  Check,
  X,
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

const platformColors: Record<string, { bg: string; border: string; text: string }> = {
  LINKEDIN: { bg: 'bg-[#0A66C2]/10', border: 'border-[#0A66C2]/30', text: 'text-[#0A66C2]' },
  FACEBOOK: { bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]/30', text: 'text-[#1877F2]' },
  TWITTER: { bg: 'bg-[#1DA1F2]/10', border: 'border-[#1DA1F2]/30', text: 'text-[#1DA1F2]' },
  INSTAGRAM: { bg: 'bg-[#E4405F]/10', border: 'border-[#E4405F]/30', text: 'text-[#E4405F]' },
  WORDPRESS: { bg: 'bg-[#21759B]/10', border: 'border-[#21759B]/30', text: 'text-[#21759B]' },
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

const periodLabels: Record<GenerationPeriod, { label: string; description: string }> = {
  weekly: { label: 'Weekly', description: '7 days of content' },
  biweekly: { label: 'Bi-weekly', description: '14 days of content' },
  monthly: { label: 'Monthly', description: '30 days of content' },
};

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
        setPlatforms(platformsData);
        // Auto-select connected platforms
        const connected = platformsData.filter((p: Platform) => p.isConnected).map((p: Platform) => p.type);
        setSelectedPlatforms(connected);
        if (connected.length > 0) {
          setSinglePlatform(connected[0]);
        }
      }

      if (intelligenceRes.ok) {
        const intelligenceData = await intelligenceRes.json();
        setIntelligence(intelligenceData);
        setTone(intelligenceData.defaultTone || 'professional');
      }
    } catch (err) {
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
    setNotification(null);

    try {
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

      const data = await res.json();

      if (res.ok && data.success) {
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
      if (s >= 70) return 'bg-green-500';
      if (s >= 40) return 'bg-amber-500';
      return 'bg-red-500';
    };

    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full ${getScoreBg(score)} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</span>
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading intelligence data...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle size={48} className="text-destructive/50 mb-4" />
          <h3 className="text-lg font-medium">{error || 'Company not found'}</h3>
          <Link href="/companies" className="mt-4 text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft size={14} />
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 p-4 rounded-lg border ${
              notification.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <p className="text-sm font-medium flex-1">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="opacity-60 hover:opacity-100">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link
            href={`/companies/${companyId}`}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            {company.name}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Brain className="text-primary" size={28} />
              Smart Content Generator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered content creation based on your performance data
            </p>
          </div>
          <button
            onClick={fetchContentPlan}
            disabled={isPlanLoading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Refresh plan"
          >
            <RefreshCw size={18} className={isPlanLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-secondary/30 rounded-lg w-fit">
        <button
          onClick={() => setMode('single')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText size={16} />
          Single Post
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'bulk'
              ? 'bg-background text-foreground shadow-sm'
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
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Generate Single Post</h2>

            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <div className="flex flex-wrap gap-2">
                {platforms.filter(p => p.isConnected).map(platform => {
                  const Icon = platformIcons[platform.type] || Globe;
                  const colors = platformColors[platform.type] || platformColors.LINKEDIN;
                  const isSelected = singlePlatform === platform.type;

                  return (
                    <button
                      key={platform.id}
                      onClick={() => setSinglePlatform(platform.type)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.border} ${colors.text} border-2`
                          : 'border-border/60 hover:border-border'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{platform.name}</span>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="text-sm font-medium mb-2 block">Topic (optional)</label>
              <input
                type="text"
                value={singleTopic}
                onChange={(e) => setSingleTopic(e.target.value)}
                placeholder="Leave empty for AI to choose based on your pillars..."
                className="w-full px-4 py-2 rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Tone */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tone</label>
              <div className="flex flex-wrap gap-2">
                {['professional', 'casual', 'friendly', 'authoritative'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      tone === t
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border/60 hover:border-border'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleSingleGenerate}
              disabled={isGenerating || !singlePlatform}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Post
                </>
              )}
            </button>

            {/* Generated Content */}
            {generatedContent && (
              <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Generated Content</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedContent)}
                    className="text-xs text-primary hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* BULK GENERATE MODE */}
      {/* ============================================ */}

      {mode === 'bulk' && (
        <div className="space-y-6">
          {/* Intelligence Summary Card */}
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-purple-500/5 p-6">
            <button
              onClick={() => toggleSection('intelligence')}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain size={20} className="text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold">Intelligence Summary</h2>
                  <p className="text-sm text-muted-foreground">
                    Data quality score and AI recommendations
                  </p>
                </div>
              </div>
              {expandedSections.intelligence ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <AnimatePresence>
              {expandedSections.intelligence && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-4">
                    {/* Score Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Data Quality</span>
                        <span className="text-xs text-muted-foreground">
                          {contentPlan?.intelligenceHealth.dataAge.daysOfData || 0} days of data
                        </span>
                      </div>
                      {renderIntelligenceScore()}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                        <div className="flex items-center gap-2 mb-1">
                          <Target size={14} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Avg Engagement</span>
                        </div>
                        <p className="text-lg font-bold">
                          {intelligence?.avgEngagementRate?.toFixed(1) || '—'}%
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                        <div className="flex items-center gap-2 mb-1">
                          {renderTrendIcon(intelligence?.engagementTrend || null)}
                          <span className="text-xs text-muted-foreground">Trend</span>
                        </div>
                        <p className="text-lg font-bold capitalize">
                          {intelligence?.engagementTrend || 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 size={14} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Best Days</span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {intelligence?.learnedBestDays?.slice(0, 2).join(', ') || 'Learning...'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={14} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Top Type</span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {intelligence?.topPerformingTypes
                            ? Object.entries(intelligence.topPerformingTypes)
                                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                            : 'Learning...'}
                        </p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {contentPlan?.intelligenceHealth.recommendations && 
                     contentPlan.intelligenceHealth.recommendations.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                              Recommendations
                            </p>
                            <ul className="mt-1 space-y-1">
                              {contentPlan.intelligenceHealth.recommendations.map((rec, i) => (
                                <li key={i} className="text-xs text-muted-foreground">• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Platform Selection */}
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Platforms</h2>
            <div className="flex flex-wrap gap-3">
              {platforms.map(platform => {
                const Icon = platformIcons[platform.type] || Globe;
                const colors = platformColors[platform.type] || platformColors.LINKEDIN;
                const isSelected = selectedPlatforms.includes(platform.type);
                const isConnected = platform.isConnected;

                return (
                  <button
                    key={platform.id}
                    onClick={() => isConnected && togglePlatform(platform.type)}
                    disabled={!isConnected}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                      !isConnected
                        ? 'opacity-50 cursor-not-allowed border-border/40'
                        : isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text}`
                        : 'border-border/60 hover:border-border'
                    }`}
                  >
                    <Icon size={24} className={isConnected ? colors.text : 'text-muted-foreground'} />
                    <div className="text-left">
                      <p className="text-sm font-medium">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isConnected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                    {isSelected && (
                      <div className={`absolute -top-1 -right-1 p-0.5 rounded-full ${colors.bg} border-2 ${colors.border}`}>
                        <Check size={12} className={colors.text} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedPlatforms.length === 0 && (
              <p className="text-sm text-amber-500 mt-3 flex items-center gap-2">
                <AlertCircle size={14} />
                Select at least one platform to continue
              </p>
            )}
          </div>

          {/* Period Selection */}
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Generation Period</h2>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(periodLabels) as GenerationPeriod[]).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setCustomPostCount(null); // Reset to let it recalculate
                  }}
                  className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 transition-all ${
                    period === p
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <span className="text-sm font-semibold">{periodLabels[p].label}</span>
                  <span className="text-xs text-muted-foreground">{periodLabels[p].description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Volume Calculation */}
          {contentPlan && (
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <button
                onClick={() => toggleSection('volume')}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <BarChart3 size={20} className="text-blue-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">Calculated Volume</h2>
                    <p className="text-sm text-muted-foreground">
                      Recommended: {contentPlan.volume.recommended} posts
                    </p>
                  </div>
                </div>
                {expandedSections.volume ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              <AnimatePresence>
                {expandedSections.volume && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4">
                      {/* Breakdown */}
                      <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Base (your setting)</span>
                          <span className="font-medium">{contentPlan.volume.breakdown.base}/week</span>
                        </div>
                        {contentPlan.volume.breakdown.industryModifier !== 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Industry adjustment</span>
                            <span className={`font-medium ${contentPlan.volume.breakdown.industryModifier > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {contentPlan.volume.breakdown.industryModifier > 0 ? '+' : ''}{contentPlan.volume.breakdown.industryModifier}
                            </span>
                          </div>
                        )}
                        {contentPlan.volume.breakdown.goalModifier !== 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Goal modifier</span>
                            <span className={`font-medium ${contentPlan.volume.breakdown.goalModifier > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {contentPlan.volume.breakdown.goalModifier > 0 ? '+' : ''}{contentPlan.volume.breakdown.goalModifier}
                            </span>
                          </div>
                        )}
                        {contentPlan.volume.breakdown.performanceModifier !== 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Performance trend</span>
                            <span className={`font-medium ${contentPlan.volume.breakdown.performanceModifier > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {contentPlan.volume.breakdown.performanceModifier > 0 ? '+' : ''}{contentPlan.volume.breakdown.performanceModifier}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-border/60 pt-2 mt-2">
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Total for {period}</span>
                            <span className="text-primary">{contentPlan.volume.recommended} posts</span>
                          </div>
                        </div>
                      </div>

                      {/* Custom Override */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Override post count:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCustomPostCount(Math.max(1, (customPostCount || contentPlan.volume.recommended) - 1))}
                            className="p-1 rounded border border-border/60 hover:bg-secondary/50"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-bold">
                            {customPostCount || contentPlan.volume.recommended}
                          </span>
                          <button
                            onClick={() => setCustomPostCount((customPostCount || contentPlan.volume.recommended) + 1)}
                            className="p-1 rounded border border-border/60 hover:bg-secondary/50"
                          >
                            <TrendingUp size={16} />
                          </button>
                        </div>
                        {customPostCount !== contentPlan.volume.recommended && customPostCount !== null && (
                          <button
                            onClick={() => setCustomPostCount(null)}
                            className="text-xs text-primary hover:underline"
                          >
                            Reset to recommended
                          </button>
                        )}
                      </div>

                      {/* Platform Distribution */}
                      {Object.keys(contentPlan.volume.breakdown.platformDistribution).length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Platform Distribution</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(contentPlan.volume.breakdown.platformDistribution).map(([platform, count]) => {
                              const Icon = platformIcons[platform] || Globe;
                              const colors = platformColors[platform] || platformColors.LINKEDIN;
                              return (
                                <div
                                  key={platform}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg}`}
                                >
                                  <Icon size={14} className={colors.text} />
                                  <span className="text-sm font-medium">{count} posts</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Reasoning */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        {contentPlan.volume.reasoning.map((reason, i) => (
                          <p key={i}>• {reason}</p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Content Mix */}
          {contentPlan && (
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <button
                onClick={() => toggleSection('mix')}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Target size={20} className="text-purple-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">Content Strategy</h2>
                    <p className="text-sm text-muted-foreground">
                      {contentPlan.contentMix.isPerformanceBased
                        ? '✨ Optimized based on your performance'
                        : 'Using industry best practices'}
                    </p>
                  </div>
                </div>
                {expandedSections.mix ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              <AnimatePresence>
                {expandedSections.mix && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4">
                      {/* Topic Mode Selection */}
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <p className="text-sm font-medium mb-3">Topic Selection</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setTopicMode('auto')}
                            className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                              topicMode === 'auto'
                                ? 'bg-primary/10 border-primary'
                                : 'border-border/60 hover:border-border'
                            }`}
                          >
                            <Brain size={18} className={topicMode === 'auto' ? 'text-primary' : 'text-muted-foreground'} />
                            <div className="text-left">
                              <p className="text-sm font-medium">AI Optimized</p>
                              <p className="text-xs text-muted-foreground">Based on performance & pillars</p>
                            </div>
                          </button>
                          <button
                            onClick={() => setTopicMode('manual')}
                            className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                              topicMode === 'manual'
                                ? 'bg-primary/10 border-primary'
                                : 'border-border/60 hover:border-border'
                            }`}
                          >
                            <Settings2 size={18} className={topicMode === 'manual' ? 'text-primary' : 'text-muted-foreground'} />
                            <div className="text-left">
                              <p className="text-sm font-medium">Manual</p>
                              <p className="text-xs text-muted-foreground">I'll provide topics</p>
                            </div>
                          </button>
                        </div>

                        {topicMode === 'manual' && (
                          <div className="mt-3">
                            <textarea
                              value={manualTopics}
                              onChange={(e) => setManualTopics(e.target.value)}
                              placeholder="Enter topics (one per line)..."
                              rows={4}
                              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        )}
                      </div>

                      {/* Content Mix Breakdown */}
                      <div className="space-y-3">
                        {Object.entries(contentPlan.contentMix.mix).map(([type, item]) => {
                          const Icon = contentTypeIcons[type] || FileText;
                          const colorClass = contentTypeColors[type] || 'text-gray-500 bg-gray-500/10';

                          return (
                            <div key={type} className="p-3 rounded-lg bg-secondary/20 border border-border/40">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon size={16} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold capitalize">{type}</span>
                                      <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                                      {item.performanceNote && (
                                        <span className="text-xs">{item.performanceNote}</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.reasoning}</p>
                                    {item.suggestedTopics.length > 0 && topicMode === 'auto' && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {item.suggestedTopics.map((topic, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-full bg-secondary text-[10px]"
                                          >
                                            {topic}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span className="text-lg font-bold text-primary">{item.count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Funnel Breakdown */}
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10">
                        <p className="text-xs font-medium mb-2">Marketing Funnel Distribution</p>
                        <div className="flex items-center gap-2">
                          {Object.entries(contentPlan.contentMix.funnelBreakdown).map(([stage, count]) => (
                            <div key={stage} className="flex-1 text-center">
                              <p className="text-lg font-bold">{count}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{stage}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Adjustments */}
                      {contentPlan.contentMix.adjustments.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p className="font-medium">AI Adjustments:</p>
                          {contentPlan.contentMix.adjustments.map((adj, i) => (
                            <p key={i}>• {adj}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Schedule Preview */}
          {contentPlan && contentPlan.schedule.slots.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <button
                onClick={() => toggleSection('schedule')}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Calendar size={20} className="text-green-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">Schedule Preview</h2>
                    <p className="text-sm text-muted-foreground">
                      {contentPlan.schedule.slots.length} posts planned
                    </p>
                  </div>
                </div>
                {expandedSections.schedule ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              <AnimatePresence>
                {expandedSections.schedule && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                      {contentPlan.schedule.slots.map((slot, i) => {
                        const Icon = platformIcons[slot.platform] || Globe;
                        const colors = platformColors[slot.platform] || platformColors.LINKEDIN;
                        const typeColor = contentTypeColors[slot.contentType] || 'bg-gray-500/10 text-gray-500';

                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/40"
                          >
                            <div className="text-center min-w-[60px]">
                              <p className="text-xs text-muted-foreground capitalize">{slot.dayOfWeek.slice(0, 3)}</p>
                              <p className="text-sm font-medium">{slot.time}</p>
                            </div>
                            <div className={`p-1.5 rounded ${colors.bg}`}>
                              <Icon size={14} className={colors.text} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeColor}`}>
                                  {slot.contentType}
                                </span>
                                {slot.confidence === 'high' && (
                                  <span className="text-[10px] text-green-500">🔥 High confidence</span>
                                )}
                              </div>
                              {slot.topic && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{slot.topic}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {contentPlan.schedule.optimizationNotes.length > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        {contentPlan.schedule.optimizationNotes.map((note, i) => (
                          <p key={i}>• {note}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Generate Button */}
          <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground">
                  {customPostCount || contentPlan?.volume.recommended || 0} posts • {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} • {periodLabels[period].label}
                </p>
                {contentPlan?.summary.estimatedEngagement === 'above_average' && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <TrendingUp size={12} />
                    Estimated engagement: Above your average
                  </p>
                )}
              </div>
              <button
                onClick={handleBulkGenerate}
                disabled={isGenerating || selectedPlatforms.length === 0 || isPlanLoading}
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-semibold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap size={24} />
                    Generate {customPostCount || contentPlan?.volume.recommended || 0} Posts
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}