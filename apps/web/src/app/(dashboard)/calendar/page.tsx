// apps/web/src/app/(dashboard)/calendar/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  RefreshCw,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarDayCell } from "@/app/components/calendar/calendar-day-cell";
import { CalendarWeekView } from "@/app/components/calendar/calendar-week-view";
import { PostDetailModal } from "@/app/components/calendar/post-detail-modal";
import { CalendarFilters } from "@/app/components/calendar/calendar-filters";
import { BulkActions } from "@/app/components/calendar/bulk-actions";
import { useCompany } from "@/app/contexts/company-context";

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

interface Platform {
  id: string;
  type?: string;
  platform?: string;
  name?: string | null;
  accountName?: string | null;
}

type ViewMode = "month" | "week";

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Converts a Date to an ISO string while preserving the local timezone.
 */
function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const timezoneOffset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(
    2,
    "0"
  );
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, "0");
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

/**
 * Gets the local date string (YYYY-MM-DD) from a Date object.
 */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets the start of the week (Sunday) for a given date.
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of the week (Saturday) for a given date.
 */
function getWeekEnd(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Formats a week range string.
 */
function formatWeekRange(start: Date, end: Date): string {
  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

export default function CalendarPage() {
  const { selectedCompanyId } = useCompany();

  // Core state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [posts, setPosts] = useState<Post[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Filter state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Selection state for bulk actions
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  // Drag state
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Fetch platforms when company changes
  useEffect(() => {
    const fetchPlatforms = async () => {
      if (!selectedCompanyId) return;
      try {
        const res = await fetch(`/api/platforms?companyId=${selectedCompanyId}`);
        if (res.ok) {
          const data = await res.json();
          setPlatforms(data);
        }
      } catch (error) {
        console.error("Failed to fetch platforms:", error);
      }
    };
    fetchPlatforms();
  }, [selectedCompanyId]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Use timezone-safe ISO strings for query range boundaries
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 2, 0, 23, 59, 59, 999);

      const startDate = toLocalISOString(start);
      const endDate = toLocalISOString(end);

      const res = await fetch(
        `/api/posts?companyId=${selectedCompanyId}&startDate=${encodeURIComponent(
          startDate
        )}&endDate=${encodeURIComponent(endDate)}`
      );

      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, currentDate]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (selectedPlatforms.length > 0) {
        // When filtering by platform, exclude posts with null platform
        if (!post.platform) return false;
        if (!selectedPlatforms.includes(post.platform.id)) return false;
      }

      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(post.status)) {
          return false;
        }
      }

      return true;
    });
  }, [posts, selectedPlatforms, selectedStatuses]);

  // Week data computation
  const weekData = useMemo(() => {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = getWeekEnd(currentDate);

    const days: Array<{
      date: Date;
      isToday: boolean;
      posts: Post[];
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);

      const dateStr = getLocalDateString(date);
      const dayPosts = filteredPosts.filter((post) => {
        if (!post.scheduledFor) return false;
        const postDate = new Date(post.scheduledFor);
        return getLocalDateString(postDate) === dateStr;
      });

      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      days.push({
        date,
        isToday: dateOnly.getTime() === today.getTime(),
        posts: dayPosts,
      });
    }

    return { weekStart, weekEnd, days };
  }, [currentDate, filteredPosts]);

  // Calendar data computation (month view)
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const totalCells = 42;

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      posts: Post[];
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getPostsForDate = (date: Date): Post[] => {
      const dateStr = getLocalDateString(date);
      return filteredPosts.filter((post) => {
        if (!post.scheduledFor) return false;
        const postDate = new Date(post.scheduledFor);
        const postDateStr = getLocalDateString(postDate);
        return postDateStr === dateStr;
      });
    };

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: getPostsForDate(date),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateOnly.getTime() === today.getTime(),
        posts: getPostsForDate(date),
      });
    }

    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: getPostsForDate(date),
      });
    }

    return { year, month, monthName: MONTHS[month], days };
  }, [currentDate, filteredPosts]);

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToPrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Post handlers
  const togglePostSelection = (postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handlePostClick = (post: Post) => {
    if (selectionMode) {
      togglePostSelection(post.id);
      return;
    }
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handlePostUpdate = () => {
    fetchPosts();
    setShowPostModal(false);
    setSelectedPost(null);
  };

  // Drag and drop handler
  const handlePostDrop = async (postId: string, newDate: Date) => {
    setIsRescheduling(true);
    setDragOverDate(null);

    const scheduledForLocal = toLocalISOString(newDate);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: scheduledForLocal,
          status: "SCHEDULED",
        }),
      });

      if (res.ok) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, scheduledFor: scheduledForLocal, status: "SCHEDULED" }
              : post
          )
        );
      } else {
        console.error("Failed to reschedule post");
        fetchPosts();
      }
    } catch (error) {
      console.error("Error rescheduling post:", error);
      fetchPosts();
    } finally {
      setIsRescheduling(false);
    }
  };

  // Handle drop with specific time (for week view)
  const handlePostDropWithTime = async (postId: string, newDate: Date, hour: number) => {
    const dateWithTime = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      hour,
      0,
      0,
      0
    );
    await handlePostDrop(postId, dateWithTime);
  };

  // Selection handlers
  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedPostIds([]);
    }
    setSelectionMode(!selectionMode);
  };

  const selectAllVisible = () => {
    const allVisiblePostIds = filteredPosts
      .filter((post) => post.status !== "PUBLISHED" && post.status !== "PUBLISHING")
      .map((post) => post.id);
    setSelectedPostIds(allVisiblePostIds);
  };

  const clearSelection = () => {
    setSelectedPostIds([]);
  };

  // Bulk action handlers
  const handleBulkReschedule = async (newDate: Date) => {
    setIsProcessingBulk(true);
    try {
      const res = await fetch("/api/posts/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIds: selectedPostIds,
          action: "reschedule",
          data: { scheduledFor: toLocalISOString(newDate) },
        }),
      });

      if (res.ok) {
        await fetchPosts();
        clearSelection();
        setSelectionMode(false);
      }
    } catch (error) {
      console.error("Bulk reschedule failed:", error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessingBulk(true);
    try {
      const res = await fetch("/api/posts/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIds: selectedPostIds,
          action: "delete",
        }),
      });

      if (res.ok) {
        await fetchPosts();
        clearSelection();
        setSelectionMode(false);
      }
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    setIsProcessingBulk(true);
    try {
      const res = await fetch("/api/posts/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIds: selectedPostIds,
          action: "changeStatus",
          data: { status },
        }),
      });

      if (res.ok) {
        await fetchPosts();
        clearSelection();
        setSelectionMode(false);
      }
    } catch (error) {
      console.error("Bulk status change failed:", error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Stats
  const monthStats = useMemo(() => {
    const relevantPosts =
      viewMode === "month"
        ? filteredPosts.filter((post) => {
            if (!post.scheduledFor) return false;
            const postDate = new Date(post.scheduledFor);
            return (
              postDate.getMonth() === currentDate.getMonth() &&
              postDate.getFullYear() === currentDate.getFullYear()
            );
          })
        : filteredPosts.filter((post) => {
            if (!post.scheduledFor) return false;
            const postDate = new Date(post.scheduledFor);
            const weekStart = getWeekStart(currentDate);
            const weekEnd = getWeekEnd(currentDate);
            return postDate >= weekStart && postDate <= weekEnd;
          });

    return {
      total: relevantPosts.length,
      scheduled: relevantPosts.filter((p) => p.status === "SCHEDULED").length,
      published: relevantPosts.filter((p) => p.status === "PUBLISHED").length,
      draft: relevantPosts.filter((p) => p.status === "DRAFT").length,
    };
  }, [filteredPosts, currentDate, viewMode]);

  // Navigation label
  const navigationLabel =
    viewMode === "month"
      ? `${calendarData.monthName} ${calendarData.year}`
      : formatWeekRange(weekData.weekStart, weekData.weekEnd);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 flex-shrink-0">
        {/* Left: Title and View Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
            <span className="whitespace-nowrap">Content Calendar</span>
          </h1>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewMode === "month"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewMode === "week"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Week</span>
            </button>
          </div>

          {/* Stats */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {monthStats.scheduled} scheduled
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                {monthStats.published} published
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {monthStats.draft} drafts
              </span>
            </div>
          </div>

          {/* Rescheduling indicator */}
          {isRescheduling && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Rescheduling...</span>
            </div>
          )}
        </div>

        {/* Right: Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selection Mode Toggle */}
          <button
            onClick={toggleSelectionMode}
            className={cn(
              "px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
              selectionMode
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            {selectionMode ? "Exit Select" : "Select Posts"}
          </button>

          {selectionMode && (
            <button
              onClick={selectAllVisible}
              className="px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Select All
            </button>
          )}

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

          <button
            onClick={fetchPosts}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4 text-gray-500", loading && "animate-spin")} />
          </button>

          <button
            onClick={goToToday}
            className="px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 rounded-lg transition-colors whitespace-nowrap"
          >
            Today
          </button>

          {/* Date Navigation */}
          <div className="flex items-center bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
            <button
              onClick={viewMode === "month" ? goToPrevMonth : goToPrevWeek}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>

            <span className="px-3 py-1.5 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap min-w-[140px] text-center">
              {navigationLabel}
            </span>

            <button
              onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-md transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-3 flex-shrink-0">
        <CalendarFilters
          platforms={platforms}
          selectedPlatforms={selectedPlatforms}
          selectedStatuses={selectedStatuses}
          onPlatformChange={setSelectedPlatforms}
          onStatusChange={setSelectedStatuses}
          onClearFilters={() => {
            setSelectedPlatforms([]);
            setSelectedStatuses([]);
          }}
        />
      </div>

      {/* Selection Mode Hint */}
      {selectionMode ? (
        <div className="mb-2 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2 flex-shrink-0">
          <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span>Selection mode: Click posts to select them for bulk actions</span>
          {selectedPostIds.length > 0 && (
            <span className="font-semibold">({selectedPostIds.length} selected)</span>
          )}
        </div>
      ) : (
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          Tip: Drag and drop posts to reschedule, or use &quot;Select Posts&quot; for bulk actions
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : viewMode === "month" ? (
          <>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider border-r border-gray-100 dark:border-gray-800 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month body scroll container (fixes bottom weeks disappearing) */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div
                className="grid grid-cols-7"
                style={{
                  gridTemplateRows: "repeat(6, minmax(8.5rem, 1fr))",
                  height: "auto",
                }}
              >
                {calendarData.days.map((day) => {
                  const key = getLocalDateString(day.date);
                  return (
                    <CalendarDayCell
                      key={key}
                      date={day.date}
                      isCurrentMonth={day.isCurrentMonth}
                      isToday={day.isToday}
                      posts={day.posts}
                      onPostClick={handlePostClick}
                      onPostDrop={handlePostDrop}
                      isDragOver={dragOverDate?.toDateString() === day.date.toDateString()}
                      onDragOver={setDragOverDate}
                      onDragLeave={() => setDragOverDate(null)}
                      selectionMode={selectionMode}
                      selectedPostIds={selectedPostIds}
                      onToggleSelection={togglePostSelection}
                    />
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <CalendarWeekView
            days={weekData.days}
            onPostClick={handlePostClick}
            onPostDrop={handlePostDropWithTime}
            selectionMode={selectionMode}
            selectedPostIds={selectedPostIds}
            onToggleSelection={togglePostSelection}
          />
        )}
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onUpdate={handlePostUpdate}
      />

      {/* Bulk Actions */}
      {selectedPostIds.length > 0 && (
        <BulkActions
          selectedCount={selectedPostIds.length}
          selectedPostIds={selectedPostIds}
          onBulkReschedule={handleBulkReschedule}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
          onClearSelection={clearSelection}
          isProcessing={isProcessingBulk}
        />
      )}
    </div>
  );
}