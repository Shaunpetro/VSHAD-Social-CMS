// apps/web/src/app/components/calendar/calendar-day-cell.tsx
"use client";

import { useState } from "react";
import {
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  MoreHorizontal,
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
}: CalendarDayCellProps) {
  const [showAll, setShowAll] = useState(false);
  
  const dayNumber = date.getDate();
  const visiblePosts = showAll ? posts : posts.slice(0, 3);
  const hasMorePosts = posts.length > 3;

  const getPlatformType = (platform: Post["platform"]): string => {
    if (!platform) return "unknown";
    return (platform.type || "").toLowerCase().replace(/[^a-z]/g, "");
  };

  return (
    <div
      className={cn(
        "min-h-[100px] border-b border-r border-gray-100 dark:border-gray-800 p-1 flex flex-col",
        !isCurrentMonth && "bg-gray-50/50 dark:bg-gray-900/50",
        isToday && "bg-blue-50/50 dark:bg-blue-950/30"
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

      {/* Posts */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {visiblePosts.map((post) => {
          const platformType = getPlatformType(post.platform);
          const config = PLATFORM_CONFIG[platformType] || PLATFORM_CONFIG.wordpress;
          const Icon = config.icon;
          const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.DRAFT;

          return (
            <button
              key={post.id}
              onClick={() => onPostClick(post)}
              className={cn(
                "w-full text-left px-1.5 py-1 rounded border-l-2 transition-all hover:shadow-sm",
                statusStyle,
                "group cursor-pointer"
              )}
            >
              <div className="flex items-center gap-1">
                <Icon className={cn("h-3 w-3 flex-shrink-0", config.color)} />
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">
                  {post.topic || post.content.substring(0, 30)}
                </span>
              </div>
              
              {/* Time */}
              {post.scheduledFor && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-4">
                  {new Date(post.scheduledFor).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </button>
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