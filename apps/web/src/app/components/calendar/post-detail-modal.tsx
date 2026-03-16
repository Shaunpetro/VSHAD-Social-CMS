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
  SCHEDULED: { icon: Clock, color: "text-blue-600 bg-blue-100 dark:bg-blue-900", label: "Scheduled" },
  PUBLISHED: { icon: CheckCircle, color: "text-green-600 bg-green-100 dark:bg-green-900", label: "Published" },
  DRAFT: { icon: Edit3, color: "text-gray-600 bg-gray-100 dark:bg-gray-800", label: "Draft" },
  FAILED: { icon: XCircle, color: "text-red-600 bg-red-100 dark:bg-red-900", label: "Failed" },
  PUBLISHING: { icon: Loader2, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900", label: "Publishing" },
};

export function PostDetailModal({ isOpen, onClose, post, onUpdate }: PostDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedSchedule, setEditedSchedule] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      setEditedContent(post.content);
      setEditedSchedule(
        post.scheduledFor
          ? new Date(post.scheduledFor).toISOString().slice(0, 16)
          : ""
      );
      setIsEditing(false);
      setError(null);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const platformType = (post.platform?.type || "").toLowerCase().replace(/[^a-z]/g, "");
  const platformConfig = PLATFORM_CONFIG[platformType] || PLATFORM_CONFIG.wordpress;
  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.DRAFT;
  const PlatformIcon = platformConfig.icon;
  const StatusIcon = statusConfig.icon;

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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
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

            {post.topic && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Topic:</span>
                <span>{post.topic}</span>
              </div>
            )}
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
              <button
                onClick={() => handleReschedule("DRAFT")}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Move to Draft
              </button>
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