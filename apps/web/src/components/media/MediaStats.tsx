// apps/web/src/components/media/MediaStats.tsx

"use client";

import { useState, useEffect } from "react";
import {
  ImageIcon,
  VideoIcon,
  Film,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Layers,
  Tag,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface MediaStatsData {
  timestamp: string;
  companyId: string;
  overview: {
    total: number;
    available: number;
    used: number;
    expiring: number;
    expired: number;
    usageRate: string;
    avgDaysToUse: number | null;
  };
  byType: {
    image: number;
    video: number;
    gif: number;
  };
  trends: {
    uploadedLast7Days: number;
    uploadedLast30Days: number;
    usedLast7Days: number;
    usedLast30Days: number;
    uploadRate7d: string;
    usageRate7d: string;
  };
  byPillar: {
    pillarId: string;
    pillarName: string;
    total: number;
    available: number;
    used: number;
  }[];
  byContentType: {
    contentType: string;
    total: number;
    available: number;
    used: number;
  }[];
  topTags: {
    tag: string;
    count: number;
  }[];
  companyBreakdown?: {
    id: string;
    name: string;
    logoUrl: string | null;
    mediaCount: number;
  }[];
}

interface MediaStatsProps {
  companyId?: string; // Optional - if not provided, shows global stats
  compact?: boolean; // Compact mode for sidebar/widgets
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const CONTENT_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  educational: { label: "Educational", emoji: "📚" },
  engagement: { label: "Engagement", emoji: "💬" },
  social_proof: { label: "Social Proof", emoji: "⭐" },
  promotional: { label: "Promotional", emoji: "📢" },
};

// ============================================
// HELPER COMPONENTS
// ============================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

function StatCard({ icon, label, value, subtext, color = "text-primary" }: StatCardProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

function ProgressBar({ label, value, max, color = "bg-primary" }: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value} / {max} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MediaStats({ companyId, compact = false, className = "" }: MediaStatsProps) {
  const [stats, setStats] = useState<MediaStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = companyId
        ? `/api/media/stats?companyId=${companyId}`
        : "/api/media/stats";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch media stats:", err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [companyId]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-3" />
        <p className="text-muted-foreground">{error || "No data available"}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Compact mode
  if (compact) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Quick overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.overview.available}
            </p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {stats.overview.used}
            </p>
            <p className="text-xs text-muted-foreground">Used</p>
          </div>
        </div>

        {/* Expiring warning */}
        {stats.overview.expiring > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-500">
              {stats.overview.expiring} media expiring soon
            </p>
          </div>
        )}

        {/* Usage rate */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Usage Rate</span>
            <span className="text-sm font-medium">{stats.overview.usageRate}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: stats.overview.usageRate }}
            />
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchStats}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
    );
  }

  // Full stats view
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Media Statistics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {companyId ? "Company media overview" : "Global media overview"}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ImageIcon className="w-5 h-5" />}
          label="Total Media"
          value={stats.overview.total}
          color="text-blue-500"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Available"
          value={stats.overview.available}
          subtext="Ready to use"
          color="text-green-500"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Used"
          value={stats.overview.used}
          subtext={stats.overview.usageRate}
          color="text-blue-500"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Expiring Soon"
          value={stats.overview.expiring}
          subtext="Within 7 days"
          color="text-amber-500"
        />
      </div>

      {/* Two column layout */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* By Type */}
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              By Type
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  <span>Images</span>
                </div>
                <span className="font-medium">{stats.byType.image}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 text-purple-500" />
                  <span>Videos</span>
                </div>
                <span className="font-medium">{stats.byType.video}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-pink-500" />
                  <span>GIFs</span>
                </div>
                <span className="font-medium">{stats.byType.gif}</span>
              </div>
            </div>
          </div>

          {/* Trends */}
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-primary">
                    {stats.trends.uploadedLast7Days}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded (7d)
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-green-500">
                    {stats.trends.usedLast7Days}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Used (7d)
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Upload rate: {stats.trends.uploadRate7d}</p>
                <p>Usage rate: {stats.trends.usageRate7d}</p>
              </div>
              {stats.overview.avgDaysToUse !== null && (
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="text-lg font-bold text-primary">
                    {stats.overview.avgDaysToUse} days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg. time to use
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* By Pillar */}
          {stats.byPillar.length > 0 && (
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                By Content Pillar
              </h3>
              <div className="space-y-3">
                {stats.byPillar.map((pillar) => (
                  <ProgressBar
                    key={pillar.pillarId}
                    label={pillar.pillarName}
                    value={pillar.available}
                    max={pillar.total}
                    color="bg-primary"
                  />
                ))}
              </div>
            </div>
          )}

          {/* By Content Type */}
          {stats.byContentType.length > 0 && (
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-medium mb-4">By Content Type</h3>
              <div className="space-y-3">
                {stats.byContentType.map((ct) => {
                  const typeInfo = CONTENT_TYPE_LABELS[ct.contentType] || {
                    label: ct.contentType,
                    emoji: "📄",
                  };
                  return (
                    <ProgressBar
                      key={ct.contentType}
                      label={`${typeInfo.emoji} ${typeInfo.label}`}
                      value={ct.available}
                      max={ct.total}
                      color="bg-green-500"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Tags */}
          {stats.topTags.length > 0 && (
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Top Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.topTags.slice(0, 15).map((tagItem) => (
                  <span
                    key={tagItem.tag}
                    className="px-2 py-1 rounded-lg bg-muted text-sm"
                  >
                    #{tagItem.tag}
                    <span className="ml-1 text-muted-foreground">
                      ({tagItem.count})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Company breakdown (global view only) */}
      {stats.companyBreakdown && stats.companyBreakdown.length > 0 && (
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="font-medium mb-4">Media by Company</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.companyBreakdown.map((company) => (
              <div
                key={company.id}
                className="p-4 rounded-lg bg-muted/50 text-center"
              >
                <p className="text-xl font-bold">{company.mediaCount}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {company.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last updated */}
      <p className="text-xs text-center text-muted-foreground">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
      </p>
    </div>
  );
}

export default MediaStats;