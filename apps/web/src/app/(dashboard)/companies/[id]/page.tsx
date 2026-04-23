// apps/web/src/app/(dashboard)/companies/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Calendar,
  ClipboardList,
  BarChart3,
  Settings,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Target,
  Users,
  FileText,
  RefreshCw,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Platform {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
}

interface ContentPillar {
  id: string;
  name: string;
  totalPosts: number;
  avgEngagement: number | null;
}

interface Intelligence {
  intelligenceScore: number;
  postsPerWeek: number;
  preferredDays: string[];
  autoApprove: boolean;
  defaultTone: string;
  avgEngagementRate: number | null;
  engagementTrend: string | null;
  onboardingCompleted: boolean;
  contentPillars: ContentPillar[];
}

interface Stats {
  scheduledPosts: number;
  pendingPosts: number;
  publishedThisWeek: number;
  totalPosts: number;
}

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  website: string | null;
}

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

const platformColors: Record<string, string> = {
  LINKEDIN: 'text-[#0A66C2] bg-[#0A66C2]/10',
  FACEBOOK: 'text-[#1877F2] bg-[#1877F2]/10',
  TWITTER: 'text-[#1DA1F2] bg-[#1DA1F2]/10',
  INSTAGRAM: 'text-[#E4405F] bg-[#E4405F]/10',
  WORDPRESS: 'text-[#21759B] bg-[#21759B]/10',
};

// ============================================
// COMPONENTS
// ============================================

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  href,
}: {
  icon: typeof Calendar;
  label: string;
  value: number | string;
  subtext?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className={`p-5 rounded-xl border-2 border-border/60 bg-card hover:border-border hover:shadow-md transition-all ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
        {href && <ArrowRight size={16} className="text-muted-foreground" />}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function QuickAction({
  icon: Icon,
  label,
  description,
  href,
  color,
  primary,
}: {
  icon: typeof Sparkles;
  label: string;
  description: string;
  href: string;
  color: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-4 p-4 rounded-xl border-2 transition-all
        ${primary
          ? 'border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
          : 'border-border/60 bg-card hover:border-border hover:shadow-md'
        }
      `}
    >
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight size={18} className="text-muted-foreground" />
    </Link>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CompanyDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [intelligence, setIntelligence] = useState<Intelligence | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [companyRes, platformsRes, intelligenceRes, statsRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/companies/${companyId}/platforms`),
        fetch(`/api/companies/${companyId}/intelligence`),
        fetch(`/api/companies/${companyId}/stats`).catch(() => null),
      ]);

      if (!companyRes.ok) {
        throw new Error('Company not found');
      }

      const companyData = await companyRes.json();
      setCompany(companyData);

      if (platformsRes.ok) {
        const platformsData = await platformsRes.json();
        setPlatforms(platformsData);
      }

      if (intelligenceRes.ok) {
        const intelligenceData = await intelligenceRes.json();
        setIntelligence(intelligenceData);

        // Redirect to onboarding if not completed
        if (!intelligenceData.onboardingCompleted) {
          router.push(`/companies/${companyId}/onboarding`);
          return;
        }
      }

      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        // Default stats if API doesn't exist
        setStats({
          scheduledPosts: 0,
          pendingPosts: 0,
          publishedThisWeek: 0,
          totalPosts: 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed values
  const connectedPlatforms = platforms.filter(p => p.isConnected);
  const intelligenceScore = intelligence?.intelligenceScore || 0;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-500';
    if (score >= 40) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getTrendIcon = (trend: string | null) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-muted-foreground" />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <AlertCircle size={48} className="text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">{error || 'Company not found'}</h2>
        <p className="text-sm text-muted-foreground mt-2">Please try again or go back to companies</p>
        <Link
          href="/companies"
          className="mt-6 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
        >
          Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {company.logoUrl ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-border/60">
              <Image
                src={company.logoUrl}
                alt={company.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {company.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-sm text-muted-foreground">
              {company.industry || 'No industry set'}
              {company.website && (
                <span className="ml-2">
                  •{' '}
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {new URL(company.website).hostname}
                  </a>
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <RefreshCw size={18} />
          </button>
          <Link
            href={`/companies/${companyId}/settings`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 hover:bg-secondary/50 text-sm font-medium transition-all"
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>
      </div>

      {/* Intelligence Score Card */}
      <div className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-primary/5 to-purple-500/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Target size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Intelligence Score</h2>
              <p className="text-sm text-muted-foreground">AI readiness based on your data</p>
            </div>
          </div>
          <span className={`text-3xl font-bold ${getScoreColor(intelligenceScore)}`}>
            {intelligenceScore}%
          </span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getScoreBg(intelligenceScore)} rounded-full transition-all duration-1000`}
            style={{ width: `${intelligenceScore}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-muted-foreground" />
              {intelligence?.postsPerWeek || 0} posts/week
            </span>
            <span className="flex items-center gap-1">
              {getTrendIcon(intelligence?.engagementTrend || null)}
              {intelligence?.avgEngagementRate
                ? `${intelligence.avgEngagementRate.toFixed(1)}% engagement`
                : 'No data yet'}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            intelligence?.autoApprove
              ? 'bg-green-500/10 text-green-500'
              : 'bg-blue-500/10 text-blue-500'
          }`}>
            {intelligence?.autoApprove ? 'Auto-Schedule' : 'Manual Review'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Scheduled"
          value={stats?.scheduledPosts || 0}
          subtext="Ready to publish"
          color="bg-green-500/10 text-green-500"
          href={`/companies/${companyId}/calendar`}
        />
        <StatCard
          icon={ClipboardList}
          label="In Queue"
          value={stats?.pendingPosts || 0}
          subtext="Pending review"
          color="bg-amber-500/10 text-amber-500"
          href={`/companies/${companyId}/queue`}
        />
        <StatCard
          icon={CheckCircle2}
          label="This Week"
          value={stats?.publishedThisWeek || 0}
          subtext="Published posts"
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={BarChart3}
          label="Total Posts"
          value={stats?.totalPosts || 0}
          subtext="All time"
          color="bg-purple-500/10 text-purple-500"
          href={`/companies/${companyId}/analytics`}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <QuickAction
            icon={Sparkles}
            label="Generate Content"
            description="Create AI-powered posts for your platforms"
            href={`/companies/${companyId}/generate`}
            color="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary"
            primary
          />
          <QuickAction
            icon={ClipboardList}
            label="Review Queue"
            description={`${stats?.pendingPosts || 0} posts waiting for approval`}
            href={`/companies/${companyId}/queue`}
            color="bg-amber-500/10 text-amber-500"
          />
          <QuickAction
            icon={Calendar}
            label="View Calendar"
            description="See your scheduled content"
            href={`/companies/${companyId}/calendar`}
            color="bg-green-500/10 text-green-500"
          />
          <QuickAction
            icon={BarChart3}
            label="Analytics"
            description="Track your performance metrics"
            href={`/companies/${companyId}/analytics`}
            color="bg-blue-500/10 text-blue-500"
          />
        </div>
      </div>

      {/* Connected Platforms & Content Pillars */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Connected Platforms */}
        <div className="rounded-xl border-2 border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Connected Platforms</h2>
            <Link
              href={`/companies/${companyId}/platforms`}
              className="text-xs text-primary hover:underline"
            >
              Manage
            </Link>
          </div>
          {connectedPlatforms.length > 0 ? (
            <div className="space-y-2">
              {connectedPlatforms.map(platform => {
                const Icon = platformIcons[platform.type] || Globe;
                const colorClass = platformColors[platform.type] || 'text-gray-500 bg-gray-500/10';
                return (
                  <div
                    key={platform.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                    <span className="font-medium flex-1">{platform.name}</span>
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Connected
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Globe size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No platforms connected</p>
              <Link
                href={`/companies/${companyId}/platforms`}
                className="inline-block mt-3 text-sm text-primary hover:underline"
              >
                Connect a platform
              </Link>
            </div>
          )}
        </div>

        {/* Content Pillars */}
        <div className="rounded-xl border-2 border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Content Pillars</h2>
            <Link
              href={`/companies/${companyId}/settings`}
              className="text-xs text-primary hover:underline"
            >
              Edit
            </Link>
          </div>
          {intelligence?.contentPillars && intelligence.contentPillars.length > 0 ? (
            <div className="space-y-2">
              {intelligence.contentPillars.slice(0, 4).map(pillar => (
                <div
                  key={pillar.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText size={16} className="text-primary" />
                    </div>
                    <span className="font-medium">{pillar.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {pillar.totalPosts} posts
                  </span>
                </div>
              ))}
              {intelligence.contentPillars.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{intelligence.contentPillars.length - 4} more pillars
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No content pillars set</p>
              <Link
                href={`/companies/${companyId}/settings`}
                className="inline-block mt-3 text-sm text-primary hover:underline"
              >
                Set up pillars
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Automation Status */}
      <div className="rounded-xl border-2 border-border/60 bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10">
              <Zap size={20} className="text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold">Automation Status</h2>
              <p className="text-sm text-muted-foreground">
                {intelligence?.autoApprove
                  ? 'Posts are automatically scheduled to your calendar'
                  : 'Posts go to your queue for manual approval'}
              </p>
            </div>
          </div>
          <Link
            href={`/companies/${companyId}/settings`}
            className="px-4 py-2 rounded-lg border border-border/60 hover:bg-secondary/50 text-sm font-medium transition-all"
          >
            Change
          </Link>
        </div>
      </div>
    </div>
  );
}