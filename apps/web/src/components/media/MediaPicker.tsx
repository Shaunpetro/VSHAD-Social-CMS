// apps/web/src/components/media/MediaPicker.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ImageIcon,
  VideoIcon,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Loader2,
  Upload,
  ChevronDown,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | "GIF";
  size: number;
  pillarIds: string[];
  tags: string[];
  contentTypes: string[];
  isUsed: boolean;
  expiresAt: string | null;
  priority: number;
  createdAt: string;
  // Suggestion fields (from API)
  score?: number;
  matchReasons?: string[];
}

interface ContentPillar {
  id: string;
  name: string;
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem | null) => void;
  companyId: string;
  pillars: ContentPillar[];
  // Context for smart suggestions
  pillarId?: string;
  contentType?: string;
  topic?: string;
  tags?: string[];
  // Currently selected
  selectedMedia?: MediaItem | null;
  // Allow multiple selection
  multiple?: boolean;
  selectedIds?: string[];
  onSelectMultiple?: (media: MediaItem[]) => void;
  // Optional: show upload button
  onUpload?: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getStatusBadge(media: MediaItem): {
  label: string;
  color: string;
  icon: React.ReactNode;
} | null {
  const daysLeft = getDaysUntilExpiry(media.expiresAt);

  if (daysLeft !== null && daysLeft <= 7 && daysLeft > 0) {
    return {
      label: `${daysLeft}d left`,
      color: "bg-amber-500/20 text-amber-400",
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  }

  if (media.score && media.score >= 10) {
    return {
      label: "Best match",
      color: "bg-green-500/20 text-green-400",
      icon: <Sparkles className="w-3 h-3" />,
    };
  }

  return null;
}

// ============================================
// MEDIA CARD COMPONENT
// ============================================

interface MediaCardProps {
  media: MediaItem;
  selected: boolean;
  onSelect: () => void;
  pillars: ContentPillar[];
}

function MediaCard({ media, selected, onSelect, pillars }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const badge = getStatusBadge(media);

  // Get pillar names
  const pillarNames = media.pillarIds
    .map((id) => pillars.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .slice(0, 2);

  return (
    <button
      onClick={onSelect}
      className={`
        relative group text-left rounded-lg overflow-hidden border transition-all
        ${
          selected
            ? "ring-2 ring-primary border-primary"
            : "border-border hover:border-primary/50"
        }
      `}
    >
      {/* Selection indicator */}
      <div
        className={`
          absolute top-2 left-2 z-10 w-5 h-5 rounded-full border-2 
          flex items-center justify-center transition-colors
          ${
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-black/50 border-white/50"
          }
        `}
      >
        {selected && <CheckCircle2 className="w-3 h-3" />}
      </div>

      {/* Badge */}
      {badge && (
        <div
          className={`
            absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs
            flex items-center gap-1 ${badge.color}
          `}
        >
          {badge.icon}
          {badge.label}
        </div>
      )}

      {/* Type indicator */}
      <div className="absolute bottom-2 right-2 z-10 p-1 bg-black/60 rounded">
        {media.type === "VIDEO" ? (
          <VideoIcon className="w-3 h-3 text-white" />
        ) : (
          <ImageIcon className="w-3 h-3 text-white" />
        )}
      </div>

      {/* Preview */}
      <div className="aspect-square bg-muted relative">
        {media.type === "VIDEO" ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <VideoIcon className="w-8 h-8 text-gray-500" />
          </div>
        ) : imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <ImageIcon className="w-8 h-8 text-gray-500" />
          </div>
        ) : (
          <Image
            src={media.thumbnailUrl || media.url}
            alt={media.filename}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* Info */}
      <div className="p-2 bg-card">
        <p className="text-xs font-medium truncate" title={media.filename}>
          {media.filename}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(media.size)}
          </span>
          {media.score !== undefined && (
            <span className="text-xs text-primary">
              Score: {media.score}
            </span>
          )}
        </div>
        {pillarNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {pillarNames.map((name, i) => (
              <span
                key={i}
                className="px-1 py-0.5 bg-primary/10 text-primary text-[10px] rounded"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        {media.matchReasons && media.matchReasons.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
            {media.matchReasons[0]}
          </p>
        )}
      </div>
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  companyId,
  pillars,
  pillarId,
  contentType,
  topic,
  tags,
  selectedMedia,
  multiple = false,
  selectedIds = [],
  onSelectMultiple,
  onUpload,
}: MediaPickerProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPillar, setFilterPillar] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Local selection state for multiple mode
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  // Fetch suggestions and all media
  const fetchMedia = useCallback(async () => {
    setLoading(true);

    try {
      // Build suggestions query
      const suggestParams = new URLSearchParams({
        companyId,
        limit: "6",
      });
      if (pillarId) suggestParams.set("pillarId", pillarId);
      if (contentType) suggestParams.set("contentType", contentType);
      if (topic) suggestParams.set("topic", topic);
      if (tags && tags.length > 0) suggestParams.set("tags", tags.join(","));

      // Fetch suggestions and all media in parallel
      const [suggestRes, allRes] = await Promise.all([
        fetch(`/api/media/suggestions?${suggestParams}`),
        fetch(`/api/media?companyId=${companyId}&status=available`),
      ]);

      if (suggestRes.ok) {
        const suggestData = await suggestRes.json();
        setSuggestions(suggestData.suggestions || []);
      }

      if (allRes.ok) {
        const allData = await allRes.json();
        setAllMedia(allData.media || []);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, pillarId, contentType, topic, tags]);

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setLocalSelectedIds(selectedIds);
    }
  }, [isOpen, fetchMedia, selectedIds]);

  // Filter media
  const filteredMedia = allMedia.filter((m) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        m.filename.toLowerCase().includes(searchLower) ||
        m.tags.some((t) => t.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== "all" && m.type !== filterType) {
      return false;
    }

    // Pillar filter
    if (filterPillar !== "all" && !m.pillarIds.includes(filterPillar)) {
      return false;
    }

    return true;
  });

  // Handle selection
  const handleSelect = (media: MediaItem) => {
    if (multiple) {
      setLocalSelectedIds((prev) =>
        prev.includes(media.id)
          ? prev.filter((id) => id !== media.id)
          : [...prev, media.id]
      );
    } else {
      onSelect(media);
      onClose();
    }
  };

  // Confirm multiple selection
  const handleConfirmMultiple = () => {
    if (onSelectMultiple) {
      const selectedMedia = allMedia.filter((m) =>
        localSelectedIds.includes(m.id)
      );
      onSelectMultiple(selectedMedia);
    }
    onClose();
  };

  // Clear selection
  const handleClearSelection = () => {
    if (multiple) {
      setLocalSelectedIds([]);
    } else {
      onSelect(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Select Media</h2>
            <p className="text-sm text-muted-foreground">
              {multiple
                ? `${localSelectedIds.length} selected`
                : "Choose media for your post"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b border-border space-y-3">
          <div className="flex items-center gap-3">
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

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                ${showFilters ? "bg-primary/10 border-primary" : "border-border hover:border-primary/50"}
              `}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>

            {/* Upload button */}
            {onUpload && (
              <button
                onClick={onUpload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            )}
          </div>

          {/* Filter options */}
          {showFilters && (
            <div className="flex items-center gap-4">
              {/* Type filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="all">All</option>
                  <option value="IMAGE">Images</option>
                  <option value="VIDEO">Videos</option>
                  <option value="GIF">GIFs</option>
                </select>
              </div>

              {/* Pillar filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pillar:</span>
                <select
                  value={filterPillar}
                  onChange={(e) => setFilterPillar(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="all">All</option>
                  {pillars.map((pillar) => (
                    <option key={pillar.id} value={pillar.id}>
                      {pillar.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Smart Suggestions */}
              {suggestions.length > 0 && !showAll && !search && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="font-medium">Smart Suggestions</h3>
                    </div>
                    <button
                      onClick={() => setShowAll(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      View all media
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on your content pillar, type, and topic
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {suggestions.map((media) => (
                      <MediaCard
                        key={media.id}
                        media={media}
                        selected={
                          multiple
                            ? localSelectedIds.includes(media.id)
                            : selectedMedia?.id === media.id
                        }
                        onSelect={() => handleSelect(media)}
                        pillars={pillars}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All/Filtered Media */}
              {(showAll || search || suggestions.length === 0) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {search ? "Search Results" : "All Available Media"}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({filteredMedia.length})
                      </span>
                    </h3>
                    {showAll && suggestions.length > 0 && (
                      <button
                        onClick={() => setShowAll(false)}
                        className="text-sm text-primary hover:underline"
                      >
                        Show suggestions
                      </button>
                    )}
                  </div>

                  {filteredMedia.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        {search
                          ? "No media matches your search"
                          : "No available media"}
                      </p>
                      {onUpload && (
                        <button
                          onClick={onUpload}
                          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Media
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {filteredMedia.map((media) => (
                        <MediaCard
                          key={media.id}
                          media={media}
                          selected={
                            multiple
                              ? localSelectedIds.includes(media.id)
                              : selectedMedia?.id === media.id
                          }
                          onSelect={() => handleSelect(media)}
                          pillars={pillars}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Expiring Soon Section */}
              {!search && allMedia.some((m) => {
                const days = getDaysUntilExpiry(m.expiresAt);
                return days !== null && days <= 7 && days > 0;
              }) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="font-medium text-amber-400">Expiring Soon</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use these before they expire to avoid waste
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {allMedia
                      .filter((m) => {
                        const days = getDaysUntilExpiry(m.expiresAt);
                        return days !== null && days <= 7 && days > 0;
                      })
                      .map((media) => (
                        <MediaCard
                          key={media.id}
                          media={media}
                          selected={
                            multiple
                              ? localSelectedIds.includes(media.id)
                              : selectedMedia?.id === media.id
                          }
                          onSelect={() => handleSelect(media)}
                          pillars={pillars}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={handleClearSelection}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {multiple ? "Clear selection" : "No media"}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            {multiple && (
              <button
                onClick={handleConfirmMultiple}
                disabled={localSelectedIds.length === 0}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${
                    localSelectedIds.length === 0
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }
                `}
              >
                Select ({localSelectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaPicker;