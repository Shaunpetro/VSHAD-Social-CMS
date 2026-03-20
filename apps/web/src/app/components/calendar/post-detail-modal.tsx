// apps/web/src/app/components/calendar/post-detail-modal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  Calendar,
  Clock,
  Hash,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
  BarChart3,
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
  postMedia?: Array<{
    id: string;
    media: {
      id: string;
      url: string;
      type: string;
      filename: string;
    };
  }>;
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onUpdate: () => void;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  linkedin: { icon: Linkedin, color: "bg-[#0A66C2]", label: "LinkedIn" },
  instagram: { icon: Instagram, color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]", label: "Instagram" },
  twitter: { icon: Twitter, color: "bg-black", label: "X (Twitter)" },
  x: { icon: Twitter, color: "bg-black", label: "X (Twitter)" },
  facebook: { icon: Facebook, color: "bg-[#1877F2]", label: "Facebook" },
  wordpress: { icon: Globe, color: "bg-[#21759B]", label: "WordPress" },
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  SCHEDULED: { icon: Clock, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50", label: "Scheduled" },
  PUBLISHED: { icon: CheckCircle, color: "text-green-600 bg-green-100 dark:bg-green-900/50", label: "Published" },
  DRAFT: { icon: Edit3, color: "text-gray-600 bg-gray-100 dark:bg-gray-800", label: "Draft" },
  FAILED: { icon: XCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/50", label: "Failed" },
  PUBLISHING: { icon: Loader2, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50", label: "Publishing" },
};

export function PostDetailModal({ isOpen, onClose, post, onUpdate }: PostDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedSchedule, setEditedSchedule] = useState("");
  
  // Metrics state
  const [editedLikes, setEditedLikes] = useState<string>("0");
  const [editedComments, setEditedComments] = useState<string>("0");
  const [editedShares, setEditedShares] = useState<string>("0");
  const [editedImpressions, setEditedImpressions] = useState<string>("0");
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingMetrics, setIsSavingMetrics] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metricsSaved, setMetricsSaved] = useState(false);

  useEffect(() => {
    if (post) {
      setEditedContent(post.content);
      setEditedSchedule(
        post.scheduledFor
          ? new Date(post.scheduledFor).toISOString().slice(0, 16)
          : ""
      );
      setEditedLikes(String(post.likes || 0));
      setEditedComments(String(post.comments || 0));
      setEditedShares(String(post.shares || 0));
      setEditedImpressions(String(post.impressions || 0));
      setIsEditing(false);
      setIsEditingMetrics(false);
      setError(null);
      setMetricsError(null);
      setMetricsSaved(false);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const platformType = (post.platform?.type || "").toLowerCase().replace(/[^a-z]/g, "");
  const platformConfig = PLATFORM_CONFIG[platformType] || PLATFORM_CONFIG.wordpress;
  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.DRAFT;
  const PlatformIcon = platformConfig.icon;
  const StatusIcon = statusConfig.icon;

  // Calculate engagement metrics
  const totalEngagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
  const engagementRate = (post.impressions || 0) > 0 
    ? ((totalEngagement / (post.impressions || 1)) * 100).toFixed(2)
    : "0.00";
  const hasMetrics = (post.likes || 0) > 0 || (post.comments || 0) > 0 || 
                     (post.shares || 0) > 0 || (post.impressions || 0) > 0;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editedContent,
          scheduledFor: editedSchedule ? new Date(editedSchedule).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update post");
      }

      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMetrics = async () => {
    setIsSavingMetrics(true);
    setMetricsError(null);
    setMetricsSaved(false);

    // Validate inputs
    const likes = parseInt(editedLikes, 10);
    const comments = parseInt(editedComments, 10);
    const shares = parseInt(editedShares, 10);
    const impressions = parseInt(editedImpressions, 10);

    if (isNaN(likes) || likes < 0 ||
        isNaN(comments) || comments < 0 ||
        isNaN(shares) || shares < 0 ||
        isNaN(impressions) || impressions < 0) {
      setMetricsError("All metrics must be non-negative numbers");
      setIsSavingMetrics(false);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          likes,
          comments,
          shares,
          impressions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update metrics");
      }

      setIsEditingMetrics(false);
      setMetricsSaved(true);
      onUpdate();

      // Hide success message after 3 seconds
      setTimeout(() => setMetricsSaved(false), 3000);
    } catch (err) {
      setMetricsError(err instanceof Error ? err.message : "Failed to save metrics");
    } finally {
      setIsSavingMetrics(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete post");
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReschedule = async (newStatus: "DRAFT" | "SCHEDULED") => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkPublished = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "PUBLISHED"
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to mark as published");
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-950 rounded-2xl shadow-2xl overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg text-white", platformConfig.color)}>
              <PlatformIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {platformConfig.label} Post
              </h2>
              <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", statusConfig.color)}>
                <StatusIcon className={cn("h-3 w-3", post.status === "PUBLISHING" && "animate-spin")} />
                {statusConfig.label}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Schedule Info */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={editedSchedule}
                  onChange={(e) => setEditedSchedule(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              ) : (
                <span>
                  {post.scheduledFor
                    ? new Date(post.scheduledFor).toLocaleString()
                    : "Not scheduled"}
                </span>
              )}
            </div>

            {post.publishedAt && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>Published: {new Date(post.publishedAt).toLocaleString()}</span>
              </div>
            )}

            {post.topic && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Topic:</span>
                <span>{post.topic}</span>
              </div>
            )}
          </div>

          {/* Performance Metrics Section */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Performance Metrics
                </h3>
                {hasMetrics && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-full">
                    {engagementRate}% engagement
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {metricsSaved && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Saved!
                  </span>
                )}
                
                {isEditingMetrics ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditingMetrics(false);
                        setEditedLikes(String(post.likes || 0));
                        setEditedComments(String(post.comments || 0));
                        setEditedShares(String(post.shares || 0));
                        setEditedImpressions(String(post.impressions || 0));
                        setMetricsError(null);
                      }}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveMetrics}
                      disabled={isSavingMetrics}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSavingMetrics ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingMetrics(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    {hasMetrics ? "Edit" : "Add Metrics"}
                  </button>
                )}
              </div>
            </div>

            {metricsError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {metricsError}
              </div>
            )}

            <div className="p-4">
              {isEditingMetrics ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Impressions
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editedImpressions}
                      onChange={(e) => setEditedImpressions(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      <Heart className="h-3.5 w-3.5 text-red-500" />
                      Likes
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editedLikes}
                      onChange={(e) => setEditedLikes(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                      Comments
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editedComments}
                      onChange={(e) => setEditedComments(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      <Share2 className="h-3.5 w-3.5 text-green-500" />
                      Shares
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editedShares}
                      onChange={(e) => setEditedShares(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {(post.impressions || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Impressions</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {(post.likes || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {(post.comments || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Comments</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                      <Share2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {(post.shares || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Shares</div>
                    </div>
                  </div>
                </div>
              )}

              {!isEditingMetrics && hasMetrics && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <TrendingUp className="h-4 w-4" />
                      <span>Total Engagement</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {totalEngagement.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {!isEditingMetrics && !hasMetrics && (
                <div className="text-center py-4 text-sm text-gray-500">
                  No engagement data yet. Click &quot;Add Metrics&quot; to enter performance data.
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {post.content.length} characters
            </p>
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Hash className="h-4 w-4 inline mr-1" />
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Media */}
          {post.postMedia && post.postMedia.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ImageIcon className="h-4 w-4 inline mr-1" />
                Attached Media ({post.postMedia.length})
              </label>
              <div className="flex gap-2 flex-wrap">
                {post.postMedia.map((pm) => (
                  <div
                    key={pm.id}
                    className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    {pm.media.type === "IMAGE" || pm.media.type?.startsWith("image/") ? (
                      <img
                        src={pm.media.url}
                        alt={pm.media.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>

            {post.status === "SCHEDULED" && (
              <>
                <button
                  onClick={() => handleReschedule("DRAFT")}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  Move to Draft
                </button>
                <button
                  onClick={handleMarkPublished}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Published
                </button>
              </>
            )}

            {post.status === "DRAFT" && post.scheduledFor && (
              <button
                onClick={() => handleReschedule("SCHEDULED")}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors disabled:opacity-50"
              >
                Schedule
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Edit Post
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}