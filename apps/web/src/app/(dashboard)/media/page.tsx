// apps/web/src/app/(dashboard)/media/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ImageIcon,
  Building2,
  Filter,
  Search,
  Grid3X3,
  List,
  Trash2,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  ArrowRight,
  FolderOpen,
} from "lucide-react";

// Import components
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { MediaStats } from "@/components/media/MediaStats";

// ============================================
// TYPES
// ============================================

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | "GIF";
  mimeType: string | null;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  pillarIds: string[];
  tags: string[];
  contentTypes: string[];
  isUsed: boolean;
  usedAt: string | null;
  usedInPostId: string | null;
  expiresAt: string | null;
  autoSelect: boolean;
  priority: number;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  _count?: {
    media: number;
  };
}

interface GlobalStats {
  total: number;
  available: number;
  used: number;
  expiring: number;
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_OPTIONS = [
  { value: "all", label: "All Media", icon: Grid3X3 },
  { value: "available", label: "Available", icon: CheckCircle2 },
  { value: "expiring", label: "Expiring Soon", icon: AlertTriangle },
  { value: "used", label: "Used", icon: Clock },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "IMAGE", label: "Images" },
  { value: "VIDEO", label: "Videos" },
  { value: "GIF", label: "GIFs" },
];

// ============================================
// COMPANY CARD COMPONENT
// ============================================

interface CompanyCardProps {
  company: Company;
  mediaCount: number;
  expiringCount: number;
}

function CompanyCard({ company, mediaCount, expiringCount }: CompanyCardProps) {
  return (
    <Link
      href={`/companies/${company.id}/media`}
      className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        {company.logoUrl ? (
          <Image
            src={company.logoUrl}
            alt={company.name}
            width={40}
            height={40}
            className="rounded-lg object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
            {company.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {mediaCount} media item{mediaCount !== 1 ? "s" : ""}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {expiringCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {expiringCount} expiring soon
        </div>
      )}
    </Link>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function GlobalMediaPage() {
  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [companyMediaCounts, setCompanyMediaCounts] = useState<Record<string, { total: number; expiring: number }>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<"companies" | "all">("companies");
  const [showStats, setShowStats] = useState(false);

  // Filters (for "all" view)
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  }, []);

  // Fetch all media
  const fetchMedia = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }
      if (companyFilter !== "all") {
        params.set("companyId", companyFilter);
      }
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/media?${params}`);

      if (response.ok) {
        const data = await response.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, typeFilter, companyFilter, search]);

  // Fetch global stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/media/stats");
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.overview.total,
          available: data.overview.available,
          used: data.overview.used,
          expiring: data.overview.expiring,
        });

        // Build company media counts
        if (data.companyBreakdown) {
          const counts: Record<string, { total: number; expiring: number }> = {};
          for (const company of data.companyBreakdown) {
            counts[company.id] = {
              total: company.mediaCount,
              expiring: 0, // Will be calculated separately
            };
          }
          setCompanyMediaCounts(counts);
        }
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  // Fetch expiring counts per company
  const fetchExpiringCounts = useCallback(async () => {
    try {
      const response = await fetch("/api/media?status=expiring");
      if (response.ok) {
        const data = await response.json();
        const mediaList = data.media || [];

        // Count expiring per company
        const expiringCounts: Record<string, number> = {};
        for (const m of mediaList) {
          const companyId = m.company?.id || m.companyId;
          if (companyId) {
            expiringCounts[companyId] = (expiringCounts[companyId] || 0) + 1;
          }
        }

        // Update company media counts
        setCompanyMediaCounts((prev) => {
          const updated = { ...prev };
          for (const [companyId, count] of Object.entries(expiringCounts)) {
            if (updated[companyId]) {
              updated[companyId].expiring = count;
            } else {
              updated[companyId] = { total: 0, expiring: count };
            }
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to fetch expiring counts:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCompanies();
    fetchStats();
    fetchExpiringCounts();
  }, [fetchCompanies, fetchStats, fetchExpiringCounts]);

  useEffect(() => {
    if (viewMode === "all") {
      fetchMedia();
    }
  }, [viewMode, fetchMedia]);

  // Handle selection
  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} media item(s)? This cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          mediaIds: selectedIds,
        }),
      });

      if (response.ok) {
        setSelectedIds([]);
        fetchMedia(false);
        fetchStats();
      } else {
        alert("Failed to delete some media items");
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
      alert("Failed to delete media");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle view media
  const handleViewMedia = (media: MediaItem) => {
    setSelectedMedia(media);
    setShowDetailModal(true);
  };

  // Handle delete single media
  const handleDeleteMedia = async (media: MediaItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${media.filename}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/media/${media.id}?force=true`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMedia(false);
        fetchStats();
      } else {
        alert("Failed to delete media");
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
      alert("Failed to delete media");
    }
  };

  // Handle media update
  const handleMediaUpdate = (updatedMedia: MediaItem) => {
    setMedia((prev) =>
      prev.map((m) => (m.id === updatedMedia.id ? updatedMedia : m))
    );
    setSelectedMedia(updatedMedia);
  };

  // Handle media delete from modal
  const handleMediaDelete = (mediaId: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    setSelectedIds((prev) => prev.filter((id) => id !== mediaId));
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <ImageIcon className="w-7 h-7 text-primary" />
                Global Media Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage media across all companies
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats toggle */}
              <button
                onClick={() => setShowStats(!showStats)}
                className={`
                  p-2 rounded-lg border transition-colors
                  ${showStats ? "bg-primary/10 border-primary" : "border-border hover:border-primary/50"}
                `}
                title="Toggle statistics"
              >
                <BarChart3 className="w-5 h-5" />
              </button>

              {/* Refresh */}
              <button
                onClick={() => {
                  fetchStats();
                  fetchExpiringCounts();
                  if (viewMode === "all") fetchMedia(false);
                }}
                disabled={refreshing}
                className="p-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Media</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-500">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10">
                <p className="text-2xl font-bold text-amber-500">{stats.expiring}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-500">{stats.used}</p>
                <p className="text-sm text-muted-foreground">Used</p>
              </div>
            </div>
          )}

          {/* View mode tabs */}
          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={() => setViewMode("companies")}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${viewMode === "companies"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
                }
              `}
            >
              <Building2 className="w-4 h-4" />
              By Company
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${viewMode === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
                }
              `}
            >
              <Grid3X3 className="w-4 h-4" />
              All Media
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats panel (collapsible) */}
        {showStats && (
          <div className="mb-6">
            <MediaStats />
          </div>
        )}

        {/* Companies view */}
        {viewMode === "companies" && (
          <div className="space-y-6">
            {/* Global expiring alert */}
            {stats && stats.expiring > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-amber-500">
                      {stats.expiring} media item{stats.expiring !== 1 ? "s" : ""} expiring soon
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Across all companies
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setViewMode("all");
                    setStatusFilter("expiring");
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors text-sm"
                >
                  View All
                </button>
              </div>
            )}

            {/* Company cards */}
            {companies.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No companies found</p>
                <Link
                  href="/companies/new"
                  className="mt-4 inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Create Company
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((company) => {
                  const counts = companyMediaCounts[company.id] || { total: 0, expiring: 0 };
                  return (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      mediaCount={counts.total || company._count?.media || 0}
                      expiringCount={counts.expiring}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All media view */}
        {viewMode === "all" && (
          <div className="space-y-6">
            {/* Filters bar */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by filename or tag..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors
                        ${statusFilter === option.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* More filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
                  ${showFilters ? "bg-primary/10 border-primary" : "border-border hover:border-primary/50"}
                `}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Extended filters */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/50">
                {/* Company filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Company:</span>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Companies</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear filters */}
                {(typeFilter !== "all" || companyFilter !== "all" || search || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setTypeFilter("all");
                      setCompanyFilter("all");
                      setStatusFilter("all");
                      setSearch("");
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Bulk actions bar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium">
                  {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Media grid */}
            <MediaGrid
              media={media}
              loading={loading}
              selectable
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onView={handleViewMedia}
              onEdit={handleViewMedia}
              onDelete={handleDeleteMedia}
              showCompany
              emptyMessage={
                search || statusFilter !== "all" || typeFilter !== "all" || companyFilter !== "all"
                  ? "No media matches your filters"
                  : "No media found across all companies"
              }
            />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <MediaDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMedia(null);
        }}
        media={selectedMedia}
        pillars={[]} // Global view doesn't have pillars context
        onUpdate={handleMediaUpdate}
        onDelete={handleMediaDelete}
      />
    </div>
  );
}