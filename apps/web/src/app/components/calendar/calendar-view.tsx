// apps/web/src/app/components/calendar/calendar-view.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarDayCell } from "./calendar-day-cell";
import { PostDetailModal } from "./post-detail-modal";

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  topic: string | null;
  tone: string | null;  // ← ADDED
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

interface CalendarViewProps {
  companyId: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarView({ companyId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week the month starts on (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();
    // Total days in month
    const daysInMonth = lastDay.getDate();
    
    // Calculate days from previous month to show
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = startDayOfWeek;
    
    // Calculate total cells needed (always show 6 weeks = 42 days)
    const totalCells = 42;
    
    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      posts: Post[];
    }> = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: getPostsForDate(date),
      });
    }
    
    // Current month days
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
    
    // Next month days
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
    
    return {
      year,
      month,
      monthName: MONTHS[month],
      days,
    };
  }, [currentDate, posts]);

  // Helper to get posts for a specific date
  function getPostsForDate(date: Date): Post[] {
    const dateStr = date.toISOString().split("T")[0];
    return posts.filter((post) => {
      if (!post.scheduledFor) return false;
      const postDate = new Date(post.scheduledFor).toISOString().split("T")[0];
      return postDate === dateStr;
    });
  }

  // Fetch posts for the current month view
  const fetchPosts = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      // Get date range for current view (include prev/next month buffer)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month + 2, 0).toISOString();
      
      const res = await fetch(
        `/api/posts?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`
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
  };

  useEffect(() => {
    fetchPosts();
  }, [companyId, currentDate.getMonth(), currentDate.getFullYear()]);

  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Post click handler
  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  // Post update handler (after edit in modal)
  const handlePostUpdate = () => {
    fetchPosts();
    setShowPostModal(false);
    setSelectedPost(null);
  };

  // Calculate stats for current month
  const monthStats = useMemo(() => {
    const monthPosts = posts.filter((post) => {
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
  }, [posts, currentDate]);

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
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
    </div>
  );
}