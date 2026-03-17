// apps/web/src/app/components/calendar/calendar-day-cell.tsx
"use client";

import { useState, DragEvent, MouseEvent } from "react";
import {
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  GripVertical,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledFor: string | null;
  topic: string | null;
  platform: {
    id: string;
    type: string;
    name: string | null;
  } | null;
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
  // Selection props
  selectionMode?: boolean;
  selectedPostIds?: string[];
  onToggleSelection?: (postId: string) => void;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  linkedin: {
    icon: Linkedin,
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]",
  },
  instagram: {
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
  },
  twitter: {
    icon: Twitter,
    color: "text-gray-900 dark:text-white",
    bgColor: "bg-black dark:bg-white",
  },
  x: {
    icon: Twitter,
    color: "text-gray-900 dark:text-white",
    bgColor: "bg-black dark:bg-white",
  },
  facebook: {
    icon: Facebook,
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]",
  },
  wordpress: {
    icon: Globe,
    color: "text-[#21759B]",
    bgColor: "bg-[#21759B]",
  },
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/50",
  PUBLISHED: "border-l-green-500 bg-green-50 dark:bg-green-950/50",
  DRAFT: "border-l-gray-400 bg-gray-50 dark:bg-gray-800/50",
  FAILED: "border-l-red-500 bg-red-50 dark:bg-red-950/50",
  PUBLISHING: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/50",
};

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
  const [showAll, setShowAll] = useState(false);
  const [localDragOver, setLocalDragOver] = useState(false);

  const dayNumber = date.getDate();
  const visiblePosts = showAll ? posts : posts.slice(0, 3);
  const hasMorePosts = posts.length > 3;

  const getPlatformType = (platform: Post["platform"]): string => {
    if (!platform) return "unknown";
    return (platform.type || "").toLowerCase().replace(/[^a-z]/g, "");
  };

  // Check if a post is selected
  const isPostSelected = (postId: string): boolean => {
    return selectedPostIds.includes(postId);
  };

  // Check if a post can be selected (not published/publishing)
  const canSelectPost = (post: Post): boolean => {
    return post.status !== "PUBLISHED" && post.status !== "PUBLISHING";
  };

  // Drag handlers for the cell (drop target)
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
      const newDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      
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

  // Drag handlers for posts (drag source)
  const handlePostDragStart = (e: DragEvent<HTMLDivElement>, post: Post) => {
    // Don't allow dragging in selection mode
    if (selectionMode) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData("postId", post.id);
    if (post.scheduledFor) {
      const time = new Date(post.scheduledFor);
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      e.dataTransfer.setData("originalTime", `${hours}:${minutes}`);
    }
    e.dataTransfer.effectAllowed = "move";
    
    const target = e.target as HTMLElement;
    target.style.opacity = "0.5";
  };

  const handlePostDragEnd = (e: DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
  };

  // Handle checkbox click (prevent propagation to post click)
  const handleCheckboxClick = (e: MouseEvent, postId: string) => {
    e.stopPropagation();
    onToggleSelection?.(postId);
  };

  const isDropTarget = isDragOver || localDragOver;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "min-h-[100px] border-b border-r border-gray-100 dark:border-gray-800 p-1 flex flex-col transition-colors",
        !isCurrentMonth && "bg-gray-50/50 dark:bg-gray-900/50",
        isToday && "bg-blue-50/50 dark:bg-blue-950/30",
        isDropTarget && "bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-600 border-2 border-dashed",
        selectionMode && "cursor-pointer"
      )}
    >
      {/* Date Number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full",
            isToday
              ? "bg-blue-600 text-white"
              : isCurrentMonth
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-600"
          )}
        >
          {dayNumber}
        </span>

        {posts.length > 0 && (
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Drop indicator */}
      {isDropTarget && !selectionMode && (
        <div className="text-[10px] text-blue-600 dark:text-blue-400 text-center py-1 font-medium">
          Drop here
        </div>
      )}

      {/* Posts */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {visiblePosts.map((post) => {
          const platformType = getPlatformType(post.platform);
          const config = PLATFORM_CONFIG[platformType] || PLATFORM_CONFIG.wordpress;
          const Icon = config.icon;
          const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.DRAFT;
          
          const isDraggable = !selectionMode && post.status !== "PUBLISHED" && post.status !== "PUBLISHING";
          const isSelected = isPostSelected(post.id);
          const canSelect = canSelectPost(post);

          return (
            <div
              key={post.id}
              draggable={isDraggable}
              onDragStart={(e) => handlePostDragStart(e, post)}
              onDragEnd={handlePostDragEnd}
              onClick={() => onPostClick(post)}
              className={cn(
                "w-full text-left px-1.5 py-1 rounded border-l-2 transition-all hover:shadow-sm",
                statusStyle,
                "group cursor-pointer",
                isDraggable && "cursor-grab active:cursor-grabbing",
                // Selection styling
                selectionMode && canSelect && "hover:ring-2 hover:ring-purple-400 hover:ring-offset-1",
                isSelected && "ring-2 ring-purple-500 ring-offset-1 bg-purple-50 dark:bg-purple-950/50",
                selectionMode && !canSelect && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-1">
                {/* Selection checkbox or drag handle */}
                {selectionMode ? (
                  canSelect && (
                    <button
                      onClick={(e) => handleCheckboxClick(e, post.id)}
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected
                          ? "bg-purple-500 border-purple-500 text-white"
                          : "border-gray-300 dark:border-gray-600 hover:border-purple-400"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  )
                ) : (
                  isDraggable && (
                    <GripVertical className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )
                )}
                
                <Icon className={cn("h-3 w-3 flex-shrink-0", config.color)} />
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">
                  {post.topic || post.content.substring(0, 30)}
                </span>
              </div>

              {/* Time */}
              {post.scheduledFor && (
                <span className={cn(
                  "text-[10px] text-gray-400 dark:text-gray-500",
                  selectionMode && canSelect ? "ml-5" : "ml-4"
                )}>
                  {new Date(post.scheduledFor).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          );
        })}

        {/* Show More Button */}
        {hasMorePosts && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
          >
            +{posts.length - 3} more
          </button>
        )}

        {showAll && hasMorePosts && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full text-center py-0.5 text-[10px] font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}