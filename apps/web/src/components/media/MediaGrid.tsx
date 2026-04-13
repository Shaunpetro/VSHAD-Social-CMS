// apps/web/src/components/media/MediaGrid.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ImageIcon,
  VideoIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Download,
  Calendar,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface MediaItem {
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
  expiresAt: string | null;
  priority: number;
  createdAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

export interface MediaGridProps {
  media: MediaItem[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onView?: (media: MediaItem) => void;
  onEdit?: (media: MediaItem) => void;
  onDelete?: (media: MediaItem) => void;
  showCompany?: boolean;
  emptyMessage?: string;
  pillars?: { id: string; name: string }[];
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getLifecycleStatus(
  media: MediaItem
): "available" | "used" | "expiring" | "expired" {
  if (media.isUsed) return "used";

  const daysLeft = getDaysUntilExpiry(media.expiresAt);
  if (daysLeft !== null) {
    if (daysLeft <= 0) return "expired";
    if (daysLeft <= 7) return "expiring";
  }

  return "available";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "available":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "used":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "expiring":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "expired":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "available":
      return <Clock className="w-3 h-3" />;
    case "used":
      return <CheckCircle2 className="w-3 h-3" />;
    case "expiring":
      return <AlertTriangle className="w-3 h-3" />;
    case "expired":
      return <AlertTriangle className="w-3 h-3" />;
    default:
      return null;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "VIDEO":
      return <VideoIcon className="w-4 h-4" />;
    case "GIF":
      return <ImageIcon className="w-4 h-4" />;
    default:
      return <ImageIcon className="w-4 h-4" />;
  }
}

// ============================================
// MEDIA CARD COMPONENT
// ============================================

interface MediaCardProps {
  media: MediaItem;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showCompany?: boolean;
  pillars?: { id: string; name: string }[];
}

function MediaCard({
  media,
  selectable,
  selected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  showCompany,
  pillars,
}: MediaCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const status = getLifecycleStatus(media);
  const daysLeft = getDaysUntilExpiry(media.expiresAt);

  // Get pillar names
  const pillarNames = media.pillarIds
    .map((id) => pillars?.find((p) => p.id === id)?.name)
    .filter(Boolean);

  return (
    <div
      className={`
        group relative bg-card border rounded-lg overflow-hidden
        transition-all duration-200 hover:border-primary/50 hover:shadow-lg
        ${selected ? "ring-2 ring-primary border-primary" : "border-border"}
      `}
    >
      {/* Selection checkbox */}
      {selectable && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              transition-colors
              ${
                selected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-black/50 border-white/50 hover:border-white"
              }
            `}
          >
            {selected && <CheckCircle2 className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Media type badge */}
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1 text-white text-xs">
          {getTypeIcon(media.type)}
          <span>{media.type}</span>
        </div>
      </div>

      {/* Image/Video preview */}
      <div
        className="aspect-square bg-muted cursor-pointer relative"
        onClick={onView}
      >
        {media.type === "VIDEO" ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <VideoIcon className="w-12 h-12 text-gray-500" />
          </div>
        ) : imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <ImageIcon className="w-12 h-12 text-gray-500" />
          </div>
        ) : (
          <Image
            src={media.thumbnailUrl || media.url}
            alt={media.altText || media.filename}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          >
            <Eye className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="p-3 space-y-2">
        {/* Filename */}
        <p className="text-sm font-medium truncate" title={media.filename}>
          {media.filename}
        </p>

        {/* Company (if showing) */}
        {showCompany && media.company && (
          <p className="text-xs text-muted-foreground truncate">
            {media.company.name}
          </p>
        )}

        {/* Status & expiry */}
        <div className="flex items-center justify-between">
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border
              ${getStatusColor(status)}
            `}
          >
            {getStatusIcon(status)}
            {status === "expiring" && daysLeft !== null
              ? `${daysLeft}d left`
              : status === "used"
                ? "Used"
                : status === "expired"
                  ? "Expired"
                  : "Available"}
          </span>

          <span className="text-xs text-muted-foreground">
            {formatFileSize(media.size)}
          </span>
        </div>

        {/* Pillars */}
        {pillarNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pillarNames.slice(0, 2).map((name, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded"
              >
                {name}
              </span>
            ))}
            {pillarNames.length > 2 && (
              <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                +{pillarNames.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {media.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded"
              >
                #{tag}
              </span>
            ))}
            {media.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{media.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(media.createdAt)}
          </span>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 w-36 bg-popover border border-border rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onView?.();
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit?.();
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete?.();
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function MediaSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-1">
          <div className="h-5 bg-muted rounded w-16" />
          <div className="h-5 bg-muted rounded w-12" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MediaGrid({
  media,
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  showCompany = false,
  emptyMessage = "No media found",
  pillars = [],
}: MediaGridProps) {
  // Select all handler
  const handleSelectAll = () => {
    if (selectedIds.length === media.length) {
      onSelectAll?.([]);
    } else {
      onSelectAll?.(media.map((m) => m.id));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <MediaSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk selection header */}
      {selectable && media.length > 0 && (
        <div className="flex items-center justify-between py-2 px-1">
          <button
            onClick={handleSelectAll}
            className="text-sm text-primary hover:underline"
          >
            {selectedIds.length === media.length
              ? "Deselect all"
              : `Select all (${media.length})`}
          </button>
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {media.map((item) => (
          <MediaCard
            key={item.id}
            media={item}
            selectable={selectable}
            selected={selectedIds.includes(item.id)}
            onSelect={() => onSelect?.(item.id)}
            onView={() => onView?.(item)}
            onEdit={() => onEdit?.(item)}
            onDelete={() => onDelete?.(item)}
            showCompany={showCompany}
            pillars={pillars}
          />
        ))}
      </div>
    </div>
  );
}

export default MediaGrid;