// apps/web/src/app/components/calendar/calendar-day-cell.tsx
"use client";

import { useMemo, useState, DragEvent, MouseEvent, useEffect } from "react";
import type { ElementType } from "react";
import { X, Linkedin, Instagram, Twitter, Facebook, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  topic: string | null;
  tone: string | null;
  hashtags: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
  companyId: string;
  platform: {
    id: string;
    type: string;
    name: string | null;
  } | null;
  postMedia: Array<{
    id: string;
    media: {
      id: string;
      url: string;
      type: string;
      filename: string;
    };
  }>;
}

interface CalendarDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: Post[];
  onPostClick: (post: Post) => void;
  onPostDrop?: (postId: string, newDate: Date) => void;
  isDragOver?: boolean;
  onDragOver?: (date: Date) => void;
  onDragLeave?: () => void;
  selectionMode?: boolean;
  selectedPostIds?: string[];
  onToggleSelection?: (postId: string) => void;
}

const PLATFORM_CONFIG: Record<
  string,
  { icon: ElementType; color: string; bgColor: string }
> = {
  linkedin: {
    icon: Linkedin,
    color: "text-white",
    bgColor: "bg-[#0A66C2]",
  },
  instagram: {
    icon: Instagram,
    color: "text-white",
    bgColor: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
  },
  twitter: {
    icon: Twitter,
    color: "text-white",
    bgColor: "bg-black",
  },
  x: {
    icon: Twitter,
    color: "text-white",
    bgColor: "bg-black",
  },
  facebook: {
    icon: Facebook,
    color: "text-white",
    bgColor: "bg-[#1877F2]",
  },
  wordpress: {
    icon: Globe,
    color: "text-white",
    bgColor: "bg-[#21759B]",
  },
  unknown: {
    icon: Globe,
    color: "text-white",
    bgColor: "bg-gray-500",
  },
};

function formatDayLabel(date: Date): string {
  try {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
}

export function CalendarDayCell({
  date,
  isCurrentMonth,
  isToday,
  posts,
  onPostClick,
  onPostDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
  selectionMode = false,
  selectedPostIds = [],
  onToggleSelection,
}: CalendarDayCellProps) {
  const [localDragOver, setLocalDragOver] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const dayNumber = date.getDate();

  const getPlatformType = (platform: Post["platform"]): string => {
    if (!platform) return "unknown";
    // e.g. LINKEDIN -> linkedin, "LinkedIn" -> linkedin
    const cleaned = (platform.type || "").toLowerCase().replace(/[^a-z]/g, "");
    return cleaned || "unknown";
  };

  const isPostSelected = (postId: string): boolean => {
    return selectedPostIds.includes(postId);
  };

  const canSelectPost = (post: Post): boolean => {
    return post.status !== "PUBLISHED" && post.status !== "PUBLISHING";
  };

  const formatTime = (dateString: string): string => {
    const d = new Date(dateString);
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes}`;
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (!a.scheduledFor) return 1;
      if (!b.scheduledFor) return -1;
      return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
    });
  }, [posts]);

  const maxVisible = 4;
  const visiblePosts = sortedPosts.slice(0, maxVisible);
  const hasMore = sortedPosts.length > maxVisible;

  useEffect(() => {
    if (!isMoreOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMoreOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMoreOpen]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setLocalDragOver(true);
    onDragOver?.(date);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setLocalDragOver(false);
    onDragLeave?.();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setLocalDragOver(false);

    const postId = e.dataTransfer.getData("postId");
    const originalTime = e.dataTransfer.getData("originalTime");

    if (postId && onPostDrop) {
      const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (originalTime) {
        const [hours, minutes] = originalTime.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          newDate.setHours(hours, minutes, 0, 0);
        } else {
          newDate.setHours(9, 0, 0, 0);
        }
      } else {
        newDate.setHours(9, 0, 0, 0);
      }

      onPostDrop(postId, newDate);
    }
  };

  const handlePostDragStart = (e: DragEvent<HTMLDivElement>, post: Post) => {
    if (selectionMode) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData("postId", post.id);

    if (post.scheduledFor) {
      const time = new Date(post.scheduledFor);
      const hours = String(time.getHours()).padStart(2, "0");
      const minutes = String(time.getMinutes()).padStart(2, "0");
      e.dataTransfer.setData("originalTime", `${hours}:${minutes}`);
    }

    e.dataTransfer.effectAllowed = "move";

    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "0.5";
  };

  const handlePostDragEnd = (e: DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
  };

  const handleCheckboxClick = (e: MouseEvent, postId: string) => {
    e.stopPropagation();
    onToggleSelection?.(postId);
  };

  const isDropTarget = isDragOver || localDragOver;
  const dayLabel = formatDayLabel(date);

  const PostUnit = ({
    post,
    size = "sm",
    closeOnClick = false,
  }: {
    post: Post;
    size?: "sm" | "md";
    closeOnClick?: boolean;
  }) => {
    const platformType = getPlatformType(post.platform);
    const config = PLATFORM_CONFIG[platformType] || PLATFORM_CONFIG.unknown;
    const Icon = config.icon;

    const isDraggable =
      !selectionMode && post.status !== "PUBLISHED" && post.status !== "PUBLISHING";

    const isSelected = isPostSelected(post.id);
    const canSelect = canSelectPost(post);

    const tooltip = `${post.topic || post.content.substring(0, 50)}${
      post.scheduledFor ? ` • ${formatTime(post.scheduledFor)}` : ""
    }`;

    const unitSizeClasses =
      size === "md"
        ? "w-12 px-1.5 py-1.5"
        : "w-10 px-1 py-1";

    const iconSize = size === "md" ? "w-7 h-7" : "w-6 h-6";
    const iconSvgSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

    return (
      <div
        key={post.id}
        draggable={isDraggable}
        onDragStart={(e) => handlePostDragStart(e, post)}
        onDragEnd={handlePostDragEnd}
        onClick={() => {
          onPostClick(post);
          if (closeOnClick && !selectionMode) setIsMoreOpen(false);
        }}
        title={tooltip}
        className={cn(
          "relative cursor-pointer transition-all",
          isDraggable && "cursor-grab active:cursor-grabbing",
          selectionMode && canSelect && "hover:ring-2 hover:ring-purple-400",
          selectionMode && !canSelect && "opacity-50 cursor-not-allowed",
          post.status === "PUBLISHED" && "opacity-60"
        )}
      >
        {/* Selection checkbox */}
        {selectionMode && canSelect && (
          <button
            onClick={(e) => handleCheckboxClick(e, post.id)}
            className={cn(
              "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border flex items-center justify-center z-10 shadow-sm",
              isSelected
                ? "bg-purple-500 border-purple-500 text-white"
                : "bg-white border-gray-300 hover:border-purple-400 dark:bg-gray-950 dark:border-gray-700"
            )}
          >
            {isSelected && <Check className="h-2 w-2" />}
          </button>
        )}

        <div
          className={cn(
            "flex flex-col items-center justify-start",
            unitSizeClasses,
            "rounded-md border",
            "bg-white dark:bg-gray-900",
            "border-gray-200 dark:border-gray-700",
            "hover:shadow-sm",
            isSelected && "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950",
            post.status === "DRAFT" && "border-dashed"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-sm flex-shrink-0",
              iconSize,
              config.bgColor
            )}
          >
            <Icon className={cn(iconSvgSize, config.color)} />
          </div>

          {post.scheduledFor ? (
            <span className="mt-0.5 text-[10px] leading-none font-medium text-gray-600 dark:text-gray-400">
              {formatTime(post.scheduledFor)}
            </span>
          ) : (
            <span className="mt-0.5 text-[10px] leading-none font-medium text-gray-400 dark:text-gray-500">
              —
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "h-full border-r border-b border-gray-200 dark:border-gray-800 p-1 flex flex-col transition-colors overflow-hidden",
          !isCurrentMonth && "bg-gray-50 dark:bg-gray-900/50",
          isToday && "bg-blue-50 dark:bg-blue-950/30",
          isDropTarget &&
            "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-inset ring-blue-400"
        )}
      >
        {/* Day Number */}
        <div className="flex-shrink-0 mb-1">
          <span
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full",
              isToday
                ? "bg-blue-600 text-white"
                : isCurrentMonth
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 dark:text-gray-500"
            )}
          >
            {dayNumber}
          </span>
        </div>

        {/* Drop indicator */}
        {isDropTarget && (
          <div className="text-[10px] text-blue-600 dark:text-blue-400 text-center font-medium flex-shrink-0 mb-1">
            Drop here
          </div>
        )}

        {/* Posts */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-wrap gap-1 content-start">
            {visiblePosts.map((post) => (
              <PostUnit key={post.id} post={post} size="sm" />
            ))}

            {hasMore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMoreOpen(true);
                }}
                className="inline-flex items-center px-1.5 py-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
              >
                +{sortedPosts.length - maxVisible} more
              </button>
            )}
          </div>
        </div>
      </div>

      {/* "+X more" Modal (popover-style) */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            aria-label="Close"
            onClick={() => setIsMoreOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* Panel */}
          <div className="absolute left-1/2 top-1/2 w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {dayLabel}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {sortedPosts.length} post{sortedPosts.length === 1 ? "" : "s"}
                  {selectionMode ? " • selection mode" : ""}
                </div>
              </div>

              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
                title="Close"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-auto">
              <div className="flex flex-wrap gap-2">
                {sortedPosts.map((post) => (
                  <PostUnit
                    key={post.id}
                    post={post}
                    size="md"
                    closeOnClick={true}
                  />
                ))}
              </div>

              {!selectionMode && (
                <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                  Tip: Click a post to open details. Drag a post onto a day to reschedule.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}