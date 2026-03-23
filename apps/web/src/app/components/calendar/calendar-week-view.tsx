// apps/web/src/app/components/calendar/calendar-week-view.tsx
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
  publishedAt: string | null;
  topic: string | null;
  tone: string | null;
  hashtags: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
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

interface DayData {
  date: Date;
  isToday: boolean;
  posts: Post[];
}

interface CalendarWeekViewProps {
  days: DayData[];
  onPostClick: (post: Post) => void;
  onPostDrop: (postId: string, newDate: Date, hour: number) => void;
  selectionMode?: boolean;
  selectedPostIds?: string[];
  onToggleSelection?: (postId: string) => void;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  linkedin: { icon: Linkedin, color: "text-[#0A66C2]" },
  instagram: { icon: Instagram, color: "text-pink-600" },
  twitter: { icon: Twitter, color: "text-gray-900 dark:text-white" },
  x: { icon: Twitter, color: "text-gray-900 dark:text-white" },
  facebook: { icon: Facebook, color: "text-[#1877F2]" },
  wordpress: { icon: Globe, color: "text-[#21759B]" },
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700",
  PUBLISHED: "bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700",
  DRAFT: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600",
  FAILED: "bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700",
  PUBLISHING: "bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700",
};

// Business hours only for cleaner view
const DISPLAY_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function CalendarWeekView({
  days,
  onPostClick,
  onPostDrop,
  selectionMode = false,
  selectedPostIds = [],
  onToggleSelection,
}: CalendarWeekViewProps) {
  const [dragOverSlot, setDragOverSlot] = useState<{ dayIndex: number; hour: number } | null>(null);

  const getPlatformType = (platform: Post["platform"]): string => {
    if (!platform) return "unknown";
    return (platform.type || "").toLowerCase().replace(/[^a-z]/g, "");
  };

  const isPostSelected = (postId: string): boolean => {
    return selectedPostIds.includes(postId);
  };

  const canSelectPost = (post: Post): boolean => {
    return post.status !== "PUBLISHED" && post.status !== "PUBLISHING";
  };

  const getPostHour = (post: Post): number => {
    if (!post.scheduledFor) return 9;
    const date = new Date(post.scheduledFor);
    return date.getHours();
  };

  const getPostsForHour = (dayPosts: Post[], hour: number): Post[] => {
    return dayPosts.filter((post) => getPostHour(post) === hour);
  };

  // Drag handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>, dayIndex: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot({ dayIndex, hour });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dayIndex: number, hour: number) => {
    e.preventDefault();
    setDragOverSlot(null);

    const postId = e.dataTransfer.getData("postId");
    if (postId) {
      onPostDrop(postId, days[dayIndex].date, hour);
    }
  };

  const handlePostDragStart = (e: DragEvent<HTMLDivElement>, post: Post) => {
    if (selectionMode) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData("postId", post.id);
    e.dataTransfer.effectAllowed = "move";

    const target = e.target as HTMLElement;
    target.style.opacity = "0.5";
  };

  const handlePostDragEnd = (e: DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
  };

  const handleCheckboxClick = (e: MouseEvent, postId: string) => {
    e.stopPropagation();
    onToggleSelection?.(postId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable container that includes BOTH header and body */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Header with days - sticky */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
            {/* Time column header */}
            <div className="py-2 px-1 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase border-r border-gray-200 dark:border-gray-800">
              Time
            </div>

            {/* Day columns headers */}
            {days.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "py-2 px-1 text-center border-r border-gray-200 dark:border-gray-800 last:border-r-0",
                  day.isToday && "bg-blue-50/50 dark:bg-blue-950/30"
                )}
              >
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {DAYS_SHORT[day.date.getDay()]}
                </div>
                <div
                  className={cn(
                    "text-sm font-bold",
                    day.isToday
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  )}
                >
                  {day.date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid body */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {DISPLAY_HOURS.map((hour) => (
              <div key={hour} className="contents">
                {/* Time label */}
                <div className="h-12 border-b border-r border-gray-100 dark:border-gray-800 flex items-start justify-end pr-1 pt-0.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatHour(hour)}
                  </span>
                </div>

                {/* Day cells for this hour */}
                {days.map((day, dayIndex) => {
                  const hourPosts = getPostsForHour(day.posts, hour);
                  const isDragOver =
                    dragOverSlot?.dayIndex === dayIndex && dragOverSlot?.hour === hour;

                  return (
                    <div
                      key={dayIndex}
                      onDragOver={(e) => handleDragOver(e, dayIndex, hour)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dayIndex, hour)}
                      className={cn(
                        "h-12 border-b border-r border-gray-100 dark:border-gray-800 last:border-r-0 p-0.5 transition-colors overflow-hidden",
                        day.isToday && "bg-blue-50/30 dark:bg-blue-950/20",
                        isDragOver && "bg-blue-100 dark:bg-blue-900/50 border-blue-400 border-dashed border-2"
                      )}
                    >
                      {/* Posts in this hour slot */}
                      <div className="space-y-0.5 h-full overflow-hidden">
                        {hourPosts.slice(0, 2).map((post) => {
                          const platformType = getPlatformType(post.platform);
                          const config = PLATFORM_CONFIG[platformType] || PLATFORM_CONFIG.wordpress;
                          const Icon = config.icon;
                          const statusColor = STATUS_COLORS[post.status] || STATUS_COLORS.DRAFT;
                          const isDraggable = !selectionMode && canSelectPost(post);
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
                                "px-1 py-0.5 rounded border text-[10px] cursor-pointer transition-all hover:shadow-sm overflow-hidden",
                                statusColor,
                                isDraggable && "cursor-grab active:cursor-grabbing",
                                selectionMode && canSelect && "hover:ring-2 hover:ring-purple-400",
                                isSelected && "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/50",
                                selectionMode && !canSelect && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-center gap-0.5 min-w-0">
                                {selectionMode ? (
                                  canSelect && (
                                    <button
                                      onClick={(e) => handleCheckboxClick(e, post.id)}
                                      className={cn(
                                        "w-3 h-3 rounded border flex items-center justify-center flex-shrink-0",
                                        isSelected
                                          ? "bg-purple-500 border-purple-500 text-white"
                                          : "border-gray-400 hover:border-purple-400"
                                      )}
                                    >
                                      {isSelected && <Check className="h-2 w-2" />}
                                    </button>
                                  )
                                ) : (
                                  isDraggable && (
                                    <GripVertical className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                                  )
                                )}
                                <Icon className={cn("h-2.5 w-2.5 flex-shrink-0", config.color)} />
                                <span className="truncate text-gray-700 dark:text-gray-300 font-medium min-w-0">
                                  {post.topic || post.content.substring(0, 15)}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Show more indicator */}
                        {hourPosts.length > 2 && (
                          <div className="text-[9px] text-gray-500 dark:text-gray-400 px-0.5 truncate">
                            +{hourPosts.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
