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
  Building2,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarDayCell } from "@/app/components/calendar/calendar-day-cell";
import { CalendarWeekView } from "@/app/components/calendar/calendar-week-view";
import { PostDetailModal } from "@/app/components/calendar/post-detail-modal";
import { BulkActions } from "@/app/components/calendar/bulk-actions";

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
}

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

interface Platform {
  id: string;
  type?: string;
  platform?: string;
  name?: string | null;
  accountName?: string | null;
  companyId: string;
}

type ViewMode = "month" | "week";

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Company color palette for visual distinction
const COMPANY_COLORS = [
  { bg: "bg-blue-500", text: "text-blue-500", light: "bg-blue-100 dark:bg-blue-900/30" },
  { bg: "bg-purple-500", text: "text-purple-500", light: "bg-purple-100 dark:bg-purple-900/30" },
  { bg: "bg-green-500", text: "text-green-500", light: "bg-green-100 dark:bg-green-900/30" },
  { bg: "bg-orange-500", text: "text-orange-500", light: "bg-orange-100 dark:bg-orange-900/30" },
  { bg: "bg-pink-500", text: "text-pink-500", light: "bg-pink-100 dark:bg-pink-900/30" },
  { bg: "bg-cyan-500", text: "text-cyan-500", light: "bg-cyan-100 dark:bg-cyan-900/30" },
  { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-100 dark:bg-amber-900/30" },
  { bg: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-100 dark:bg-indigo-900/30" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-400" },
  { value: "SCHEDULED", label: "Scheduled", color: "bg-blue-500" },
  { value: "PUBLISHING", label: "Publishing", color: "bg-yellow-500" },
  { value: "PUBLISHED", label: "Published", color: "bg-green-500" },
  { value: "FAILED", label: "Failed", color: "bg-red-500" },
];

// ---------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------

function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const timezoneOffset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, "0");
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, "0");
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
}

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

// ---------------------------------------------------------------
// Multi-Select Dropdown Component
// ---------------------------------------------------------------

interface MultiSelectProps {
  label: string;
  icon: React.ReactNode;
  options: Array<{ id: string; name: string; color?: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel?: string;
}

function MultiSelectDropdown({
  label,
  icon,
  options,
  selected,
  onChange,
  allLabel = "All",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const allSelected = selected.length === 0 || selected.length === options.length;
  const displayText = allSelected
    ? allLabel
    : selected.length === 1
      ? options.find((o) => o.id === selected[0])?.name || "1 selected"
      : `${selected.length} selected`;

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    onChange([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-all",
          isOpen || selected.length > 0
            ? "border-brand-500 bg-brand-500/10 text-[var(--text-primary)]"
            : "border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
        )}
      >
        {icon}
        <span className="font-medium">{label}:</span>
        <span className={cn(selected.length > 0 && "text-brand-600 dark:text-brand-400")}>
          {displayText}
        </span>
        <ChevronDown
          size={14}
          className={cn("transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-20 w-64 max-h-80 overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xl">
            {/* Select All Option */}
            <button
              onClick={selectAll}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--bg-secondary)] transition-colors border-b border-[var(--border-default)]"
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                  allSelected
                    ? "bg-brand-500 border-brand-500"
                    : "border-[var(--border-default)]"
                )}
              >
                {allSelected && <Check size={12} className="text-white" />}
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                {allLabel}
              </span>
            </button>

            {/* Individual Options */}
            {options.map((option) => {
              const isSelected = selected.length === 0 || selected.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-brand-500 border-brand-500"
                        : "border-[var(--border-default)]"
                    )}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  {option.color && (
                    <div className={cn("w-3 h-3 rounded-full", option.color)} />
                  )}
                  <span className="text-[var(--text-primary)] truncate">
                    {option.name}
                  </span>
                </button>
              );
            })}

            {options.length === 0 && (
              <div className="px-4 py-6 text-sm text-[var(--text-tertiary)] text-center">
                No options available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------

export default function GlobalCalendarPage() {
  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

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
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Selection state for bulk actions
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  // Drag state
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Company color map
  const companyColorMap = useMemo(() => {
    const map = new Map<string, (typeof COMPANY_COLORS)[0]>();
    companies.forEach((company, index) => {
      map.set(company.id, COMPANY_COLORS[index % COMPANY_COLORS.length]);
    });
    return map;
  }, [companies]);

  // ---------------------------------------------------------------
  // Fetch Companies
  // ---------------------------------------------------------------

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setCompaniesLoading(true);
        const res = await fetch("/api/companies");
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // ---------------------------------------------------------------
  // Fetch Platforms (for selected companies)
  // ---------------------------------------------------------------

  useEffect(() => {
    const fetchPlatforms = async () => {
      if (companies.length === 0) return;

      try {
        // Determine which companies to fetch platforms for
        const companyIds =
          selectedCompanyIds.length === 0
            ? companies.map((c) => c.id)
            : selectedCompanyIds;

        // Fetch platforms for all selected companies
        const allPlatforms: Platform[] = [];
        for (const companyId of companyIds) {
          const res = await fetch(`/api/platforms?companyId=${companyId}`);
          if (res.ok) {
            const data = await res.json();
            allPlatforms.push(
              ...data.map((p: Platform) => ({ ...p, companyId }))
            );
          }
        }
        setPlatforms(allPlatforms);
      } catch (error) {
        console.error("Failed to fetch platforms:", error);
      }
    };
    fetchPlatforms();
  }, [companies, selectedCompanyIds]);

  // ---------------------------------------------------------------
  // Fetch Posts (for selected companies)
  // ---------------------------------------------------------------

  const fetchPosts = useCallback(async () => {
    if (companies.length === 0) return;

    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 2, 0, 23, 59, 59, 999);

      const startDate = toLocalISOString(start);
      const endDate = toLocalISOString(end);

      // Determine which companies to fetch posts for
      const companyIds =
        selectedCompanyIds.length === 0
          ? companies.map((c) => c.id)
          : selectedCompanyIds;

      // Fetch posts for all selected companies
      const allPosts: Post[] = [];
      for (const companyId of companyIds) {
        const res = await fetch(
          `/api/posts?companyId=${companyId}&startDate=${encodeURIComponent(
            startDate
          )}&endDate=${encodeURIComponent(endDate)}`
        );
        if (res.ok) {
          const data = await res.json();
          allPosts.push(...data.map((p: Post) => ({ ...p, companyId })));
        }
      }
      setPosts(allPosts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [companies, selectedCompanyIds, currentDate]);

  useEffect(() => {
    if (!companiesLoading) {
      fetchPosts();
    }
  }, [fetchPosts, companiesLoading]);

  // ---------------------------------------------------------------
  // Filter Posts
  // ---------------------------------------------------------------

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Filter by platform
      if (selectedPlatformIds.length > 0) {
        if (!post.platform) return false;
        if (!selectedPlatformIds.includes(post.platform.id)) return false;
      }

      // Filter by status
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(post.status)) {
          return false;
        }
      }

      return true;
    });
  }, [posts, selectedPlatformIds, selectedStatuses]);

  // ---------------------------------------------------------------
  // Week Data Computation
  // ---------------------------------------------------------------

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

  // ---------------------------------------------------------------
  // Calendar Data Computation (Month View)
  // ---------------------------------------------------------------

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

  // ---------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------

  const goToPrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
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

  // ---------------------------------------------------------------
  // Post Handlers
  // ---------------------------------------------------------------

  const togglePostSelection = (postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
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

  // ---------------------------------------------------------------
  // Drag and Drop
  // ---------------------------------------------------------------

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

  const handlePostDropWithTime = async (
    postId: string,
    newDate: Date,
    hour: number
  ) => {
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

  // ---------------------------------------------------------------
  // Selection Handlers
  // ---------------------------------------------------------------

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedPostIds([]);
    }
    setSelectionMode(!selectionMode);
  };

  const selectAllVisible = () => {
    const allVisiblePostIds = filteredPosts
      .filter(
        (post) => post.status !== "PUBLISHED" && post.status !== "PUBLISHING"
      )
      .map((post) => post.id);
    setSelectedPostIds(allVisiblePostIds);
  };

  const clearSelection = () => {
    setSelectedPostIds([]);
  };

  // ---------------------------------------------------------------
  // Bulk Action Handlers
  // ---------------------------------------------------------------

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

  // ---------------------------------------------------------------
  // Clear Filters
  // ---------------------------------------------------------------

  const clearAllFilters = () => {
    setSelectedCompanyIds([]);
    setSelectedPlatformIds([]);
    setSelectedStatuses([]);
  };

  const hasActiveFilters =
    selectedCompanyIds.length > 0 ||
    selectedPlatformIds.length > 0 ||
    selectedStatuses.length > 0;

  // ---------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------

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

  // Platform options for dropdown
  const platformOptions = useMemo(() => {
    const uniquePlatforms = new Map<string, Platform>();
    platforms.forEach((p) => {
      if (!uniquePlatforms.has(p.id)) {
        uniquePlatforms.set(p.id, p);
      }
    });
    return Array.from(uniquePlatforms.values()).map((p) => ({
      id: p.id,
      name: p.accountName || p.name || (p.platform || p.type || "Unknown"),
    }));
  }, [platforms]);

  // Company options for dropdown
  const companyOptions = useMemo(() => {
    return companies.map((c, index) => ({
      id: c.id,
      name: c.name,
      color: COMPANY_COLORS[index % COMPANY_COLORS.length].bg,
    }));
  }, [companies]);

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-tertiary)]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CalendarIcon size={48} className="mx-auto text-[var(--text-tertiary)] mb-4" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            No Companies Yet
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Create a company to start scheduling content
          </p>
          <a
            href="/companies"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            <Building2 size={18} />
            Go to Companies
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4 flex-shrink-0">
        {/* Left: Title and View Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-brand-500" />
            <span className="whitespace-nowrap">Content Calendar</span>
          </h1>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[var(--bg-secondary)] rounded-xl p-1">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all",
                viewMode === "month"
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all",
                viewMode === "week"
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Week</span>
            </button>
          </div>

          {/* Stats */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-500/10 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-brand-500" />
              <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                {monthStats.scheduled} scheduled
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {monthStats.published} published
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-secondary)] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-xs font-medium text-[var(--text-tertiary)]">
                {monthStats.draft} drafts
              </span>
            </div>
          </div>

          {/* Rescheduling indicator */}
          {isRescheduling && (
            <div className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400">
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
              "px-2.5 py-1.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap",
              selectionMode
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            )}
          >
            {selectionMode ? "Exit Select" : "Select Posts"}
          </button>

          {selectionMode && (
            <button
              onClick={selectAllVisible}
              className="px-2.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all whitespace-nowrap"
            >
              Select All
            </button>
          )}

          <div className="w-px h-6 bg-[var(--border-default)]" />

          <button
            onClick={fetchPosts}
            disabled={loading}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-[var(--text-tertiary)]",
                loading && "animate-spin"
              )}
            />
          </button>

          <button
            onClick={goToToday}
            className="px-2.5 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-500/10 dark:text-brand-400 rounded-xl transition-colors whitespace-nowrap"
          >
            Today
          </button>

          {/* Date Navigation */}
          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl">
            <button
              onClick={viewMode === "month" ? goToPrevMonth : goToPrevWeek}
              className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-l-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-[var(--text-secondary)]" />
            </button>

            <span className="px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap min-w-[140px] text-center">
              {navigationLabel}
            </span>

            <button
              onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
              className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-r-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-4 flex-shrink-0">
        {/* Company Filter */}
        <MultiSelectDropdown
          label="Companies"
          icon={<Building2 size={16} />}
          options={companyOptions}
          selected={selectedCompanyIds}
          onChange={setSelectedCompanyIds}
          allLabel="All Companies"
        />

        {/* Platform Filter */}
        <MultiSelectDropdown
          label="Platforms"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          }
          options={platformOptions}
          selected={selectedPlatformIds}
          onChange={setSelectedPlatformIds}
          allLabel="All Platforms"
        />

        {/* Status Filter */}
        <MultiSelectDropdown
          label="Status"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          options={STATUS_OPTIONS.map((s) => ({
            id: s.value,
            name: s.label,
            color: s.color,
          }))}
          selected={selectedStatuses}
          onChange={setSelectedStatuses}
          allLabel="All Statuses"
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"
          >
            <X size={14} />
            Clear filters
          </button>
        )}

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1 flex-wrap">
            {selectedCompanyIds.map((id) => {
              const company = companies.find((c) => c.id === id);
              const colorIndex = companies.findIndex((c) => c.id === id);
              const color = COMPANY_COLORS[colorIndex % COMPANY_COLORS.length];
              return (
                <span
                  key={id}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium",
                    color.light,
                    color.text
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", color.bg)} />
                  {company?.name}
                  <button
                    onClick={() =>
                      setSelectedCompanyIds((prev) =>
                        prev.filter((cid) => cid !== id)
                      )
                    }
                    className="hover:opacity-70"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection Mode Hint */}
      {selectionMode ? (
        <div className="mb-2 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2 flex-shrink-0">
          <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span>
            Selection mode: Click posts to select them for bulk actions
          </span>
          {selectedPostIds.length > 0 && (
            <span className="font-semibold">
              ({selectedPostIds.length} selected)
            </span>
          )}
        </div>
      ) : (
        <div className="mb-2 text-xs text-[var(--text-tertiary)] flex-shrink-0">
          Tip: Drag and drop posts to reschedule, or use &quot;Select Posts&quot;
          for bulk actions
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-default)] overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : viewMode === "month" ? (
          <>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-[var(--border-default)] flex-shrink-0">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold text-[var(--text-tertiary)] tracking-wider border-r border-[var(--border-subtle)] last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month body scroll container */}
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
                      isDragOver={
                        dragOverDate?.toDateString() === day.date.toDateString()
                      }
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