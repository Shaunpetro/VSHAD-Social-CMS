// apps/web/src/app/(dashboard)/analytics/page.tsx
// CONTINUATION - This replaces the previous incomplete file

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  RefreshCw,
  Award,
  Clock,
  Target,
  Building2,
  ChevronDown,
  X,
  Check,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lightbulb,
  TrendingUp,
  ChevronRight,
  Zap,
  Download,
  FileSpreadsheet,
  FileText,
  Grid3X3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useCompany } from "@/app/contexts/company-context";

// Local imports
import {
  AnalyticsSummary,
  PlatformData,
  TopPost,
  TrendData,
  TimingData,
  SyncStatus,
  AIInsights,
  PlatformConnection,
  normalizePlatformType,
  getPlatformConfig,
  formatRelativeTime,
  exportToCSV,
  exportToPDF,
  ExportData,
} from "./analytics-utils";

import {
  PlatformIcon,
  EngagementPieChart,
  EngagementBreakdownPie,
  PostingHeatmap,
  CompactHeatmap,
} from "./analytics-charts";

export default function AnalyticsPage() {
  const { companies, isLoading: companiesLoading } = useCompany();

  // Local state for filters
  const [localCompanyId, setLocalCompanyId] = useState<string | "all">("all");
  const [availablePlatformTypes, setAvailablePlatformTypes] = useState<string[]>([]);
  const [selectedPlatformType, setSelectedPlatformType] = useState<string | "all">("all");
  const [platformsLoading, setPlatformsLoading] = useState(false);

  // Analytics state
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [byPlatform, setByPlatform] = useState<PlatformData>({});
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [timing, setTiming] = useState<TimingData | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("daily");

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    synced: number;
    failed: number;
  } | null>(null);

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Export state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Dropdown state
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  // Abort controller ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // ==================== EXPORT HANDLERS ====================

  const handleExportCSV = () => {
    if (!summary) return;
    setExporting(true);
    setExportDropdownOpen(false);

    try {
      const exportData: ExportData = {
        summary,
        byPlatform,
        topPosts,
        trends,
        timing,
        aiInsights,
        companyName: getCompanyName(),
        dateRange,
      };
      exportToCSV(exportData);
    } catch (error) {
      console.error("CSV export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (!summary) return;
    setExporting(true);
    setExportDropdownOpen(false);

    try {
      const exportData: ExportData = {
        summary,
        byPlatform,
        topPosts,
        trends,
        timing,
        aiInsights,
        companyName: getCompanyName(),
        dateRange,
      };
      exportToPDF(exportData);
    } catch (error) {
      console.error("PDF export error:", error);
    } finally {
      setExporting(false);
    }
  };

  // ==================== DATA FETCHING ====================

  const fetchSyncStatus = useCallback(async (companyId: string) => {
    if (companyId === "all") {
      setSyncStatus(null);
      return;
    }

    try {
      const res = await fetch(`/api/analytics/sync?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data.status || null);
      }
    } catch (error) {
      console.error("Error fetching sync status:", error);
    }
  }, []);

  const generateInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(null);

    try {
      const res = await fetch("/api/analytics/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: localCompanyId !== "all" ? localCompanyId : undefined,
          platformType: selectedPlatformType !== "all" ? selectedPlatformType : undefined,
          dateRange,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAiInsights(data.insights);
        setInsightsExpanded(true);
      } else {
        setInsightsError(data.error || "Failed to generate insights");
      }
    } catch (error) {
      setInsightsError(error instanceof Error ? error.message : "Failed to generate insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const syncAnalytics = async (forceRefresh = false) => {
    if (localCompanyId === "all") {
      setSyncing(true);
      setSyncResult(null);

      let totalSynced = 0;
      let totalFailed = 0;

      for (const company of companies) {
        try {
          const res = await fetch("/api/analytics/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId: company.id, forceRefresh }),
          });

          if (res.ok) {
            const data = await res.json();
            totalSynced += data.synced || 0;
            totalFailed += data.failed || 0;
          }
        } catch (error) {
          console.error(`Error syncing company ${company.id}:`, error);
        }
      }

      setSyncResult({
        success: totalFailed === 0,
        message: `Synced ${totalSynced} posts across all companies`,
        synced: totalSynced,
        failed: totalFailed,
      });

      setSyncing(false);
      if (totalSynced > 0) fetchAnalytics();
    } else {
      setSyncing(true);
      setSyncResult(null);

      try {
        const res = await fetch("/api/analytics/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: localCompanyId, forceRefresh }),
        });

        const data = await res.json();

        if (res.ok) {
          setSyncResult({
            success: data.failed === 0,
            message: data.message || `Synced ${data.synced} posts`,
            synced: data.synced || 0,
            failed: data.failed || 0,
          });
          fetchSyncStatus(localCompanyId);
          if (data.synced > 0) fetchAnalytics();
        } else {
          setSyncResult({
            success: false,
            message: data.error || "Sync failed",
            synced: 0,
            failed: 0,
          });
        }
      } catch (error) {
        setSyncResult({
          success: false,
          message: error instanceof Error ? error.message : "Sync failed",
          synced: 0,
          failed: 0,
        });
      } finally {
        setSyncing(false);
      }
    }

    setTimeout(() => setSyncResult(null), 5000);
  };

  // Fetch platforms when company changes
  useEffect(() => {
    if (companies.length === 0) {
      setAvailablePlatformTypes([]);
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchPlatforms = async () => {
      setPlatformsLoading(true);

      try {
        const seenTypes = new Set<string>();

        if (localCompanyId === "all") {
          const fetchPromises = companies.map((company) =>
            fetch(`/api/platforms?companyId=${company.id}`, { signal })
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => [])
          );

          const results = await Promise.all(fetchPromises);
          results.forEach((data) => {
            if (Array.isArray(data)) {
              data.forEach((p: PlatformConnection) => {
                if (p?.platform) seenTypes.add(normalizePlatformType(p.platform));
              });
            }
          });
        } else {
          const res = await fetch(`/api/platforms?companyId=${localCompanyId}`, { signal });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              data.forEach((p: PlatformConnection) => {
                if (p?.platform) seenTypes.add(normalizePlatformType(p.platform));
              });
            }
          }
        }

        if (!signal.aborted) setAvailablePlatformTypes(Array.from(seenTypes).sort());
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error fetching platforms:", error);
          setAvailablePlatformTypes([]);
        }
      } finally {
        if (!signal.aborted) setPlatformsLoading(false);
      }
    };

    fetchPlatforms();
    return () => abortControllerRef.current?.abort();
  }, [localCompanyId, companies.length]);

  // Fetch sync status when company changes
  useEffect(() => {
    if (localCompanyId !== "all") {
      fetchSyncStatus(localCompanyId);
    } else {
      setSyncStatus(null);
    }
  }, [localCompanyId, fetchSyncStatus]);

  // Reset filters and insights when company changes
  useEffect(() => {
    setSelectedPlatformType("all");
    setAiInsights(null);
  }, [localCompanyId]);

  // Calculate date range
  const getDateRange = useCallback(() => {
    const end = new Date().toISOString();
    let start: string = "";

    switch (dateRange) {
      case "7d":
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "30d":
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "90d":
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        start = "";
    }

    return { start, end };
  }, [dateRange]);

  const buildParams = useCallback(
    (extra: Record<string, string> = {}) => {
      const { start, end } = getDateRange();
      const params = new URLSearchParams();

      if (localCompanyId !== "all") params.set("companyId", localCompanyId);
      if (selectedPlatformType !== "all") params.set("platformType", selectedPlatformType);
      if (start) params.set("startDate", start);
      if (end) params.set("endDate", end);

      Object.entries(extra).forEach(([key, value]) => params.set(key, value));
      return params.toString();
    },
    [localCompanyId, selectedPlatformType, getDateRange]
  );

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      const analyticsRes = await fetch(`/api/analytics?${buildParams()}`);
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setSummary(data.summary || null);
        setByPlatform(data.byPlatform || {});
        setTiming(data.timing || null);
      } else {
        setSummary(null);
        setByPlatform({});
        setTiming(null);
      }

      const topPostsRes = await fetch(
        `/api/analytics/top-posts?${buildParams({ limit: "5", sortBy: "engagement" })}`
      );
      if (topPostsRes.ok) {
        const data = await topPostsRes.json();
        setTopPosts(Array.isArray(data.posts) ? data.posts : []);
      } else {
        setTopPosts([]);
      }

      const trendsRes = await fetch(`/api/analytics/trends?${buildParams({ granularity })}`);
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(Array.isArray(data.data) ? data.data : []);
      } else {
        setTrends([]);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setSummary(null);
      setByPlatform({});
      setTopPosts([]);
      setTrends([]);
      setTiming(null);
    } finally {
      setLoading(false);
    }
  }, [buildParams, granularity]);

  useEffect(() => {
    if (!companiesLoading) fetchAnalytics();
  }, [fetchAnalytics, companiesLoading]);

  const getCompanyName = () => {
    if (localCompanyId === "all") return "All Companies";
    const company = companies.find((c) => c.id === localCompanyId);
    return company?.name || "Select Company";
  };

  // ==================== RENDER ====================

  if (companiesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your content performance and engagement
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your content performance and engagement
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 size={48} className="text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No Companies Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create a company first to start tracking analytics
          </p>
        </div>
      </div>
    );
  }

  const platformChartData = Object.entries(byPlatform).map(([platform, data]) => ({
    name: getPlatformConfig(platform).label,
    engagement: data.engagement,
    posts: data.posts,
    engagementRate: data.engagementRate,
    fill: getPlatformConfig(platform).color,
  }));

  const dayOfWeekData = timing?.byDayOfWeek || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your content performance and engagement
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                disabled={!summary || loading || exporting}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border bg-background hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} className={exporting ? "animate-pulse" : ""} />
                Export
                <ChevronDown size={14} className={exportDropdownOpen ? "rotate-180" : ""} />
              </button>

              {exportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setExportDropdownOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 w-40 rounded-lg border border-border bg-popover shadow-lg z-20 py-1">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                    >
                      <FileSpreadsheet size={16} className="text-green-600" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                    >
                      <FileText size={16} className="text-red-600" />
                      Export PDF
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* AI Insights Button */}
            <button
              onClick={generateInsights}
              disabled={insightsLoading || loading || !summary?.totalPosts}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={16} className={insightsLoading ? "animate-pulse" : ""} />
              {insightsLoading ? "Analyzing..." : "AI Insights"}
            </button>

            {/* Sync Button */}
            <button
              onClick={() => syncAnalytics(false)}
              disabled={syncing || loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <CloudDownload size={16} className={syncing ? "animate-pulse" : ""} />
              {syncing ? "Syncing..." : "Sync"}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Sync Result Banner */}
        {syncResult && (
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              syncResult.success
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            }`}
          >
            {syncResult.success ? (
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 shrink-0" />
            )}
            <p
              className={`flex-1 text-sm font-medium ${
                syncResult.success
                  ? "text-green-700 dark:text-green-300"
                  : "text-yellow-700 dark:text-yellow-300"
              }`}
            >
              {syncResult.message}
            </p>
            <button
              onClick={() => setSyncResult(null)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Sync Status */}
        {syncStatus && localCompanyId !== "all" && (
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg border border-border/60 bg-secondary/30 text-sm">
            <div className="flex items-center gap-2">
              <CloudDownload size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Sync:</span>
            </div>
            <span>
              <strong>{syncStatus.syncable}</strong> syncable
            </span>
            {syncStatus.neverSynced > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {syncStatus.neverSynced} pending
              </span>
            )}
            {syncStatus.lastSyncedAt && (
              <span className="text-muted-foreground">
                Last: {formatRelativeTime(syncStatus.lastSyncedAt)}
              </span>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border/60 bg-card">
          {/* Company Selector */}
          <div className="relative">
            <button
              onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-colors min-w-[180px]"
            >
              <Building2 size={16} className="text-muted-foreground shrink-0" />
              <span className="flex-1 text-left text-sm truncate">{getCompanyName()}</span>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform shrink-0 ${
                  companyDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {companyDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCompanyDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] rounded-lg border border-border bg-popover shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setLocalCompanyId("all");
                      setCompanyDropdownOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary/50 transition-colors ${
                      localCompanyId === "all" ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                      <BarChart3 size={12} className="text-white" />
                    </div>
                    <span className="flex-1 text-left">All Companies</span>
                    {localCompanyId === "all" && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                  <div className="h-px bg-border my-1" />
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => {
                        setLocalCompanyId(company.id);
                        setCompanyDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary/50 transition-colors ${
                        localCompanyId === company.id ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 size={12} className="text-primary" />
                      </div>
                      <span className="flex-1 text-left truncate">{company.name}</span>
                      {localCompanyId === company.id && (
                        <Check size={14} className="text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          {/* Platform Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Platform:</span>
            <button
              onClick={() => setSelectedPlatformType("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedPlatformType === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              All
            </button>
            {platformsLoading ? (
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            ) : (
              availablePlatformTypes.map((type) => {
                const config = getPlatformConfig(type);
                const isSelected = selectedPlatformType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedPlatformType(isSelected ? "all" : type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected
                        ? "text-white"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    style={isSelected ? { backgroundColor: config.color } : undefined}
                  >
                    <PlatformIcon type={type} size={16} />
                    {config.label}
                  </button>
                );
              })
            )}
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Period:</span>
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
              {(["7d", "30d", "90d", "all"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    dateRange === range
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range === "all" ? "All" : range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(localCompanyId !== "all" || selectedPlatformType !== "all") && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {localCompanyId !== "all" && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                <Building2 size={12} />
                {companies.find((c) => c.id === localCompanyId)?.name}
                <button
                  onClick={() => setLocalCompanyId("all")}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 ml-1"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedPlatformType !== "all" && (
              <span
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white"
                style={{ backgroundColor: getPlatformConfig(selectedPlatformType).color }}
              >
                {getPlatformConfig(selectedPlatformType).label}
                <button
                  onClick={() => setSelectedPlatformType("all")}
                  className="hover:bg-white/20 rounded-full p-0.5 ml-1"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setLocalCompanyId("all");
                setSelectedPlatformType("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* AI Insights Panel */}
      {(aiInsights || insightsLoading || insightsError) && (
        <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 overflow-hidden">
          <button
            onClick={() => setInsightsExpanded(!insightsExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-purple-100/50 dark:hover:bg-purple-800/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                  AI-Powered Insights
                </h3>
                {aiInsights && (
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Generated {formatRelativeTime(aiInsights.generatedAt)}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight
              size={20}
              className={`text-purple-500 transition-transform ${insightsExpanded ? "rotate-90" : ""}`}
            />
          </button>

          {insightsExpanded && (
            <div className="px-4 pb-4 space-y-4">
              {insightsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-purple-500" />
                  <span className="ml-3 text-purple-600 dark:text-purple-400">
                    Analyzing your data with AI...
                  </span>
                </div>
              )}

              {insightsError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{insightsError}</p>
                </div>
              )}

              {aiInsights && !insightsLoading && (
                <>
                  <div className="p-4 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {aiInsights.summary}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-3">
                        <Lightbulb size={16} className="text-yellow-500" />
                        Key Findings
                      </h4>
                      <ul className="space-y-2">
                        {aiInsights.keyFindings.map((finding, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <ChevronRight size={14} className="text-purple-500 shrink-0 mt-0.5" />
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-3">
                        <Zap size={16} className="text-orange-500" />
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {aiInsights.recommendations.map((rec, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <ChevronRight size={14} className="text-purple-500 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {Object.keys(aiInsights.platformInsights).length > 0 && (
                    <div className="p-4 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-blue-500" />
                        Platform Insights
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {Object.entries(aiInsights.platformInsights).map(([platform, insight]) => (
                          <div
                            key={platform}
                            className="flex items-start gap-2 p-2 rounded-lg bg-gray-100/50 dark:bg-gray-700/30"
                          >
                            <PlatformIcon type={platform} size={24} />
                            <div>
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                {getPlatformConfig(platform).label}
                              </span>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                {insight}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {aiInsights.contentTips.length > 0 && (
                      <div className="p-4 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-3">
                          💡 Content Tips
                        </h4>
                        <ul className="space-y-1">
                          {aiInsights.contentTips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiInsights.timingAdvice && (
                      <div className="p-4 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-3">
                          ⏰ Best Timing
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {aiInsights.timingAdvice}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={generateInsights}
                      disabled={insightsLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg transition-colors"
                    >
                      <RefreshCw size={14} />
                      Regenerate Insights
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-3">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Eye size={16} />
                <span className="text-sm">Impressions</span>
              </div>
              <div className="text-2xl font-bold">
                {summary?.totals.impressions.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {summary?.averages.impressionsPerPost.toFixed(0) || 0} avg/post
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Heart size={16} />
                <span className="text-sm">Engagement</span>
              </div>
              <div className="text-2xl font-bold">
                {summary?.totalEngagement.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {summary?.averages.engagementPerPost.toFixed(1) || 0} avg/post
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Target size={16} />
                <span className="text-sm">Engagement Rate</span>
              </div>
              <div className="text-2xl font-bold">{summary?.engagementRate.toFixed(2) || 0}%</div>
              <div className="text-sm text-muted-foreground mt-1">Industry avg: ~2-5%</div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BarChart3 size={16} />
                <span className="text-sm">Published Posts</span>
              </div>
              <div className="text-2xl font-bold">{summary?.totalPosts || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">In selected period</div>
            </div>
          </div>

          {/* Engagement Breakdown Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Heart size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold">
                  {summary?.totals.likes.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">Likes</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold">
                  {summary?.totals.comments.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">Comments</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <Share2 size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold">
                  {summary?.totals.shares.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">Shares</div>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Trends + Platform Performance */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Engagement Trends */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Engagement Trends</h3>
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                  {(["daily", "weekly", "monthly"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGranularity(g)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        granularity === g
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#engagementGradient)"
                      name="Engagement"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </div>

            {/* Platform Performance Bar */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="font-semibold mb-4">Performance by Platform</h3>
              {platformChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={platformChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => {
                        const numValue = typeof value === "number" ? value : 0;
                        const strName = String(name);
                        return [
                          numValue.toLocaleString(),
                          strName === "engagement" ? "Engagement" : strName,
                        ];
                      }}
                    />
                    <Bar dataKey="engagement" radius={[0, 4, 4, 0]} name="Engagement">
                      {platformChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No platform data available
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2: Pie Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Platform Engagement Pie */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PieChartIcon size={18} />
                Engagement by Platform
              </h3>
              <EngagementPieChart byPlatform={byPlatform} />
            </div>

            {/* Engagement Type Breakdown Pie */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PieChartIcon size={18} />
                Engagement Breakdown
              </h3>
              <EngagementBreakdownPie
                likes={summary?.totals.likes || 0}
                comments={summary?.totals.comments || 0}
                shares={summary?.totals.shares || 0}
              />
            </div>
          </div>

          {/* Charts Row 3: Heatmap + Best Times */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Posting Heatmap */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Grid3X3 size={18} />
                Posting Heatmap
              </h3>
              <PostingHeatmap timing={timing} />
            </div>

            {/* Best Posting Times */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} />
                Best Posting Times
              </h3>

              {timing?.bestDay && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Best Day: <strong>{timing.bestDay.day}</strong>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {timing.bestDay.avgEngagement.toFixed(1)} avg engagement
                  </div>
                </div>
              )}

              {timing?.bestHours && timing.bestHours.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-muted-foreground">Top performing hours:</div>
                  {timing.bestHours.slice(0, 3).map((hour, idx) => (
                    <div
                      key={hour.hour}
                      className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{hour.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {hour.avgEngagement.toFixed(1)} avg
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dayOfWeekData.length > 0 && dayOfWeekData.some((d) => d.posts > 0) && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Engagement by day:</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={dayOfWeekData}>
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => String(value).slice(0, 3)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value) => {
                          const numValue = typeof value === "number" ? value : 0;
                          return [numValue.toFixed(1), "Avg Engagement"];
                        }}
                      />
                      <Bar
                        dataKey="avgEngagement"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        name="Avg Engagement"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {!timing?.bestDay &&
                (!timing?.bestHours || timing.bestHours.length === 0) &&
                !dayOfWeekData.some((d) => d.posts > 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Not enough data to determine best posting times
                  </div>
                )}
            </div>
          </div>

          {/* Top Posts */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award size={18} />
              Top Performing Posts
            </h3>
            {topPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPosts.map((post, idx) => (
                  <div key={post.id} className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium shrink-0">
                        {idx + 1}
                      </span>
                      <PlatformIcon type={post.platform?.type || ""} size={20} />
                      <span className="text-xs text-muted-foreground truncate">
                        {post.platform?.name || "Unknown Platform"}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3 mb-3">{post.content}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="text-red-500" />
                        {post.metrics?.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} className="text-blue-500" />
                        {post.metrics?.comments || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 size={12} className="text-green-500" />
                        {post.metrics?.shares || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No published posts with engagement data yet
              </div>
            )}
          </div>

          {/* Platform Breakdown Table */}
          {Object.keys(byPlatform).length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="font-semibold mb-4">Platform Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Platform</th>
                      <th className="text-right py-3 px-4 font-medium">Posts</th>
                      <th className="text-right py-3 px-4 font-medium">Impressions</th>
                      <th className="text-right py-3 px-4 font-medium">Likes</th>
                      <th className="text-right py-3 px-4 font-medium">Comments</th>
                      <th className="text-right py-3 px-4 font-medium">Shares</th>
                      <th className="text-right py-3 px-4 font-medium">Eng. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(byPlatform).map(([platform, data]) => (
                      <tr
                        key={platform}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <PlatformIcon type={platform} size={24} />
                            <span>{getPlatformConfig(platform).label}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{data.posts}</td>
                        <td className="text-right py-3 px-4">
                          {data.impressions.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">{data.likes.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{data.comments.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{data.shares.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">
                          <span
                            className={`font-medium ${
                              data.engagementRate >= 5
                                ? "text-green-600 dark:text-green-400"
                                : data.engagementRate >= 2
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {data.engagementRate.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}