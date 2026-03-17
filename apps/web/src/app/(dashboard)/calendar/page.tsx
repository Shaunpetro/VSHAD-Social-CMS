// apps/web/src/app/(dashboard)/calendar/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarDayCell } from "@/app/components/calendar/calendar-day-cell";
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

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Converts a Date to an ISO string while preserving the local timezone.
 * This prevents the date from shifting when the user is not in UTC.
 */
function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  const timezoneOffset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

/**
 * Gets the local date string (YYYY-MM-DD) from a Date object.
 */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  // Use shared company context
  const { selectedCompanyId } = useCompany();

  // Core state
  const [currentDate, setCurrentDate] = useState(new Date());
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
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month + 2, 0).toISOString();

      const res = await fetch(
        `/api/posts?companyId=${selectedCompanyId}&startDate=${startDate}&endDate=${endDate}`
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
      if (selectedPlatforms.length > 0 && post.platform) {
        if (!selectedPlatforms.includes(post.platform.id)) {
          return false;
        }
      }

      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(post.status)) {
          return false;
        }
      }

      return true;
    });
  }, [posts, selectedPlatforms, selectedStatuses]);

  // Calendar data computation
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

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Post handlers
  const handlePostClick = (post: Post) => {
    // Don't open modal if in selection mode
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

  // Selection handlers
  const togglePostSelection = (postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exiting selection mode - clear selections
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
    const monthPosts = filteredPosts.filter((post) => {
      if (!post.scheduledFor) return false;
      const postDate = new Date(post.scheduledFor);
      return (
        postDate.getMonth() === currentDate.getMonth() &&
        postDate.getFullYear() === currentDate.getFullYear()
      );
    });

    return {
      total: monthPosts.length,
      scheduled: monthPosts.filter((p) => p.status === "SCHEDULED").length,
      published: monthPosts.filter((p) => p.status === "PUBLISHED").length,
      draft: monthPosts.filter((p) => p.status === "DRAFT").length,
    };
  }, [filteredPosts, currentDate]);

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-500" />
            Content Calendar
          </h1>

          {/* Month Stats */}
          <div className="hidden md:flex items-center gap-3 ml-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {monthStats.scheduled} scheduled
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                {monthStats.published} published
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
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
              <span>Rescheduling...</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {/* Selection Mode Toggle */}
          <button
            onClick={toggleSelectionMode}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
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
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Select All
            </button>
          )}

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

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
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 rounded-lg transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>

            <span className="px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white min-w-[140px] text-center">
              {calendarData.monthName} {calendarData.year}
            </span>

            <button
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
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
        <div className="mb-2 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          Selection mode: Click posts to select them for bulk actions
          {selectedPostIds.length > 0 && (
            <span className="ml-2 font-semibold">
              ({selectedPostIds.length} selected)
            </span>
          )}
        </div>
      ) : (
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          💡 Tip: Drag and drop posts to reschedule, or use &quot;Select Posts&quot; for bulk actions
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-7 grid-rows-6">
            {calendarData.days.map((day, index) => (
              <CalendarDayCell
                key={index}
                date={day.date}
                isCurrentMonth={day.isCurrentMonth}
                isToday={day.isToday}
                posts={day.posts}
                onPostClick={handlePostClick}
                onPostDrop={handlePostDrop}
                isDragOver={dragOverDate?.toDateString() === day.date.toDateString()}
                onDragOver={setDragOverDate}
                onDragLeave={() => setDragOverDate(null)}
                // Selection props
                selectionMode={selectionMode}
                selectedPostIds={selectedPostIds}
                onToggleSelection={togglePostSelection}
              />
            ))}
          </div>
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

      {/* Bulk Actions - Only show when posts are selected */}
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