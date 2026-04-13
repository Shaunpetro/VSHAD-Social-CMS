// apps/web/src/components/media/ExpiringMediaAlert.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  ImageIcon,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface ExpiringMedia {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | "GIF";
  expiresAt: string;
  pillarIds: string[];
  tags: string[];
}

interface ExpiringMediaAlertProps {
  companyId: string;
  /** Number of days before expiry to show warning (default: 7) */
  warningDays?: number;
  /** Maximum number of items to show in preview (default: 4) */
  maxPreview?: number;
  /** Show dismiss button (default: true) */
  dismissible?: boolean;
  /** Callback when user clicks "View All" */
  onViewAll?: () => void;
  /** Callback when user clicks on a specific media item */
  onMediaClick?: (media: ExpiringMedia) => void;
  /** Link to media library page (alternative to onViewAll) */
  mediaLibraryUrl?: string;
  /** Custom class name */
  className?: string;
  /** Compact mode - single line alert */
  compact?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDaysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getUrgencyLevel(daysLeft: number): "critical" | "warning" | "info" {
  if (daysLeft <= 2) return "critical";
  if (daysLeft <= 4) return "warning";
  return "info";
}

function getUrgencyStyles(level: "critical" | "warning" | "info") {
  switch (level) {
    case "critical":
      return {
        container: "bg-red-500/10 border-red-500/30",
        icon: "text-red-500",
        text: "text-red-500",
        badge: "bg-red-500/20 text-red-400",
      };
    case "warning":
      return {
        container: "bg-amber-500/10 border-amber-500/30",
        icon: "text-amber-500",
        text: "text-amber-500",
        badge: "bg-amber-500/20 text-amber-400",
      };
    case "info":
      return {
        container: "bg-blue-500/10 border-blue-500/30",
        icon: "text-blue-500",
        text: "text-blue-500",
        badge: "bg-blue-500/20 text-blue-400",
      };
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ExpiringMediaAlert({
  companyId,
  warningDays = 7,
  maxPreview = 4,
  dismissible = true,
  onViewAll,
  onMediaClick,
  mediaLibraryUrl,
  className = "",
  compact = false,
}: ExpiringMediaAlertProps) {
  const [expiringMedia, setExpiringMedia] = useState<ExpiringMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Fetch expiring media
  const fetchExpiringMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/media?companyId=${companyId}&status=expiring`
      );

      if (response.ok) {
        const data = await response.json();
        setExpiringMedia(data.media || []);
      }
    } catch (error) {
      console.error("Failed to fetch expiring media:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringMedia();
  }, [companyId]);

  // Handle image error
  const handleImageError = (mediaId: string) => {
    setImageErrors((prev) => new Set(prev).add(mediaId));
  };

  // Don't render if dismissed or no expiring media
  if (dismissed || loading) {
    return null;
  }

  if (expiringMedia.length === 0) {
    return null;
  }

  // Find most urgent item
  const mostUrgentDays = Math.min(
    ...expiringMedia.map((m) => getDaysUntilExpiry(m.expiresAt))
  );
  const urgencyLevel = getUrgencyLevel(mostUrgentDays);
  const styles = getUrgencyStyles(urgencyLevel);

  // Compact mode - single line alert
  if (compact) {
    return (
      <div
        className={`
          flex items-center justify-between gap-3 px-4 py-2 rounded-lg border
          ${styles.container} ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${styles.icon}`} />
          <span className="text-sm">
            <span className={`font-medium ${styles.text}`}>
              {expiringMedia.length} media
            </span>{" "}
            expiring soon
            {mostUrgentDays <= 2 && (
              <span className={`ml-1 ${styles.text}`}>
                (as soon as {mostUrgentDays} day{mostUrgentDays !== 1 ? "s" : ""})
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(onViewAll || mediaLibraryUrl) && (
            mediaLibraryUrl ? (
              <Link
                href={mediaLibraryUrl}
                className={`text-sm font-medium hover:underline ${styles.text}`}
              >
                View
              </Link>
            ) : (
              <button
                onClick={onViewAll}
                className={`text-sm font-medium hover:underline ${styles.text}`}
              >
                View
              </button>
            )
          )}
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full alert with preview
  return (
    <div
      className={`
        rounded-xl border overflow-hidden
        ${styles.container} ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/10 ${styles.icon}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-medium ${styles.text}`}>
              {expiringMedia.length} Media Expiring Soon
            </h3>
            <p className="text-sm text-muted-foreground">
              Use before they&apos;re automatically deleted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchExpiringMedia}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Media preview grid */}
      <div className="p-4">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {expiringMedia.slice(0, maxPreview).map((media) => {
            const daysLeft = getDaysUntilExpiry(media.expiresAt);
            const itemUrgency = getUrgencyLevel(daysLeft);
            const itemStyles = getUrgencyStyles(itemUrgency);

            return (
              <button
                key={media.id}
                onClick={() => onMediaClick?.(media)}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
              >
                {/* Image */}
                {imageErrors.has(media.id) ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                ) : (
                  <Image
                    src={media.thumbnailUrl || media.url}
                    alt={media.filename}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(media.id)}
                  />
                )}

                {/* Days left badge */}
                <div
                  className={`
                    absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                    flex items-center gap-1 ${itemStyles.badge}
                  `}
                >
                  <Clock className="w-2.5 h-2.5" />
                  {daysLeft}d
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </button>
            );
          })}

          {/* "More" card if there are more items */}
          {expiringMedia.length > maxPreview && (
            <button
              onClick={onViewAll}
              className="aspect-square rounded-lg border border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <span className="text-lg font-bold">
                +{expiringMedia.length - maxPreview}
              </span>
              <span className="text-[10px] text-muted-foreground">more</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-white/5 border-t border-inherit">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Expiring media is prioritized in auto-selection
          </p>

          {(onViewAll || mediaLibraryUrl) && (
            mediaLibraryUrl ? (
              <Link
                href={mediaLibraryUrl}
                className={`
                  inline-flex items-center gap-1 text-sm font-medium
                  hover:underline ${styles.text}
                `}
              >
                View all expiring media
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={onViewAll}
                className={`
                  inline-flex items-center gap-1 text-sm font-medium
                  hover:underline ${styles.text}
                `}
              >
                View all expiring media
                <ChevronRight className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// INLINE ALERT VARIANT
// ============================================

interface InlineExpiringAlertProps {
  count: number;
  mostUrgentDays: number;
  onClick?: () => void;
  className?: string;
}

export function InlineExpiringAlert({
  count,
  mostUrgentDays,
  onClick,
  className = "",
}: InlineExpiringAlertProps) {
  if (count === 0) return null;

  const urgencyLevel = getUrgencyLevel(mostUrgentDays);
  const styles = getUrgencyStyles(urgencyLevel);

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        border transition-colors hover:opacity-80
        ${styles.container} ${className}
      `}
    >
      <AlertTriangle className={`w-3.5 h-3.5 ${styles.icon}`} />
      <span className="text-sm">
        <span className="font-medium">{count}</span> expiring
      </span>
    </button>
  );
}

// ============================================
// SIDEBAR WIDGET VARIANT
// ============================================

interface ExpiringMediaWidgetProps {
  companyId: string;
  onViewAll?: () => void;
  mediaLibraryUrl?: string;
  className?: string;
}

export function ExpiringMediaWidget({
  companyId,
  onViewAll,
  mediaLibraryUrl,
  className = "",
}: ExpiringMediaWidgetProps) {
  const [count, setCount] = useState(0);
  const [mostUrgentDays, setMostUrgentDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(
          `/api/media?companyId=${companyId}&status=expiring`
        );
        if (response.ok) {
          const data = await response.json();
          const media = data.media || [];
          setCount(media.length);
          if (media.length > 0) {
            const minDays = Math.min(
              ...media.map((m: ExpiringMedia) => getDaysUntilExpiry(m.expiresAt))
            );
            setMostUrgentDays(minDays);
          }
        }
      } catch (error) {
        console.error("Failed to fetch expiring count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [companyId]);

  if (loading || count === 0) {
    return null;
  }

  const urgencyLevel = getUrgencyLevel(mostUrgentDays);
  const styles = getUrgencyStyles(urgencyLevel);

  return (
    <div
      className={`
        p-4 rounded-xl border ${styles.container} ${className}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-white/10 ${styles.icon}`}>
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className={`font-medium ${styles.text}`}>
            {count} Media Expiring
          </p>
          <p className="text-xs text-muted-foreground">
            Soonest in {mostUrgentDays} day{mostUrgentDays !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {(onViewAll || mediaLibraryUrl) && (
        mediaLibraryUrl ? (
          <Link
            href={mediaLibraryUrl}
            className={`
              w-full inline-flex items-center justify-center gap-2
              px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20
              text-sm font-medium transition-colors ${styles.text}
            `}
          >
            Use Now
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={onViewAll}
            className={`
              w-full inline-flex items-center justify-center gap-2
              px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20
              text-sm font-medium transition-colors ${styles.text}
            `}
          >
            Use Now
            <ChevronRight className="w-4 h-4" />
          </button>
        )
      )}
    </div>
  );
}

export default ExpiringMediaAlert;