// apps/web/src/app/(dashboard)/calendar/layout.tsx
"use client";

import { useState, useEffect } from "react";
import type { ReactNode, ElementType } from "react";
import {
  Calendar,
  PlusCircle,
  FileText,
  Clock,
  Image,
  ChevronLeft,
  ChevronRight,
  Building2,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaLibraryView } from "@/app/components/calendar/media-library-view";
import { CreatePostView } from "@/app/components/calendar/create-post-view";
import { useCompany } from "@/app/contexts/company-context";

type CalendarView = "calendar" | "create" | "drafts" | "queue" | "media";

interface NavItem {
  id: CalendarView;
  label: string;
  icon: ElementType;
  badge?: number;
}

interface PostStats {
  drafts: number;
  scheduled: number;
  published: number;
}

function safeDateLabel(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function safeTimeLabel(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function CalendarLayout({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<CalendarView>("calendar");
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<PostStats>({
    drafts: 0,
    scheduled: 0,
    published: 0,
  });

  // Use shared company context
  const { companies, selectedCompanyId, setSelectedCompanyId, isLoading } =
    useCompany();

  const navItems: NavItem[] = [
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "create", label: "Create Post", icon: PlusCircle },
    { id: "drafts", label: "Drafts", icon: FileText, badge: stats.drafts },
    { id: "queue", label: "Queue", icon: Clock, badge: stats.scheduled },
    { id: "media", label: "Media Library", icon: Image },
  ];

  // Fetch stats when company changes
  useEffect(() => {
    if (!selectedCompanyId) return;

    const fetchStats = async () => {
      try {
        const [draftsRes, scheduledRes, publishedRes] = await Promise.all([
          fetch(`/api/posts?companyId=${selectedCompanyId}&status=DRAFT`),
          fetch(`/api/posts?companyId=${selectedCompanyId}&status=SCHEDULED`),
          fetch(`/api/posts?companyId=${selectedCompanyId}&status=PUBLISHED`),
        ]);

        const drafts = draftsRes.ok ? (await draftsRes.json()).length : 0;
        const scheduled = scheduledRes.ok
          ? (await scheduledRes.json()).length
          : 0;
        const published = publishedRes.ok
          ? (await publishedRes.json()).length
          : 0;

        setStats({ drafts, scheduled, published });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [selectedCompanyId, activeView]);

  const renderContent = () => {
    switch (activeView) {
      case "calendar":
        return children;
      case "create":
        return (
          <CreatePostView
            companyId={selectedCompanyId || null}
            onClose={() => setActiveView("calendar")}
          />
        );
      case "drafts":
        return (
          <DraftsView
            companyId={selectedCompanyId || ""}
            onEdit={() => setActiveView("create")}
          />
        );
      case "queue":
        return <QueueView companyId={selectedCompanyId || ""} />;
      case "media":
        return <MediaLibraryView companyId={selectedCompanyId || ""} />;
      default:
        return children;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <div
          className={cn(
            "p-4 border-b border-gray-200 dark:border-gray-800",
            collapsed && "px-2"
          )}
        >
          {collapsed ? (
            <div className="flex justify-center">
              <Building2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </label>
              <select
                value={selectedCompanyId || ""}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                disabled={isLoading}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-blue-600")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-gray-200 dark:bg-gray-700 px-1.5 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">
              This Week
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-center">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {stats.published}
                </p>
                <p className="text-xs text-green-600">Published</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 text-center">
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                  {stats.scheduled}
                </p>
                <p className="text-xs text-amber-600">Scheduled</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        {renderContent()}
      </main>
    </div>
  );
}

// Drafts View Component
function DraftsView({
  companyId,
  onEdit,
}: {
  companyId: string;
  onEdit?: () => void;
}) {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchDrafts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/posts?companyId=${companyId}&status=DRAFT`
        );
        if (response.ok) {
          const data = await response.json();
          setDrafts(data);
        }
      } catch (error) {
        console.error("Error fetching drafts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [companyId]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (response.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== postId));
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please select a company</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Drafts
      </h1>

      {drafts.length === 0 ? (
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <span className="text-4xl mb-4 block">📝</span>
          <p className="text-gray-500 dark:text-gray-400">No drafts yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Create a post and save it as a draft
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                      {draft.platform?.name || draft.platform?.type || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {safeDateLabel(draft.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white line-clamp-3">
                    {draft.content}
                  </p>
                  {draft.topic && (
                    <p className="text-sm text-gray-500 mt-2">
                      Topic: {draft.topic}
                    </p>
                  )}
                  {draft.hashtags && draft.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {draft.hashtags
                        .slice(0, 5)
                        .map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="text-blue-600 dark:text-blue-400 text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      {draft.hashtags.length > 5 && (
                        <span className="text-gray-500 text-xs">
                          +{draft.hashtags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={onEdit}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Queue View Component
function QueueView({ companyId }: { companyId: string }) {
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchScheduled = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/posts?companyId=${companyId}&status=SCHEDULED`
        );
        if (response.ok) {
          const data = await response.json();
          setScheduled(data);
        }
      } catch (error) {
        console.error("Error fetching scheduled posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduled();
  }, [companyId]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled post?")) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (response.ok) {
        setScheduled((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please select a company</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Group by date
  const groupedByDate = scheduled.reduce((acc, post) => {
    if (!post.scheduledFor) return acc;
    const date = safeDateLabel(post.scheduledFor);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(post);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Scheduled Queue
      </h1>

      {scheduled.length === 0 ? (
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <span className="text-4xl mb-4 block">📋</span>
          <p className="text-gray-500 dark:text-gray-400">No scheduled posts</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Create and schedule posts to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <span>📅</span>
                {date}
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                  {groupedByDate[date].length} post
                  {groupedByDate[date].length > 1 ? "s" : ""}
                </span>
              </h2>
              <div className="grid gap-3">
                {groupedByDate[date]
                  .sort(
                    (a: any, b: any) =>
                      new Date(a.scheduledFor).getTime() -
                      new Date(b.scheduledFor).getTime()
                  )
                  .map((post: any) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                              {post.platform?.name ||
                                post.platform?.type ||
                                "Unknown"}
                            </span>
                            <span className="text-xs text-gray-500">
                              🕒 {safeTimeLabel(post.scheduledFor)}
                            </span>
                            {post.isPartOfBulk && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs">
                                Bulk
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 dark:text-white line-clamp-2">
                            {post.content}
                          </p>
                          {post.postMedia && post.postMedia.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {post.postMedia
                                .slice(0, 3)
                                .map((pm: any, index: number) => (
                                  <div
                                    key={index}
                                    className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden"
                                  >
                                    {pm.media?.mimeType?.startsWith("image/") ? (
                                      <img
                                        src={pm.media.url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs">
                                        📄
                                      </div>
                                    )}
                                  </div>
                                ))}
                              {post.postMedia.length > 3 && (
                                <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                                  +{post.postMedia.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-500"
                            title="Cancel"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}