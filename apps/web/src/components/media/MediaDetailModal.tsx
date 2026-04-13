// apps/web/src/components/media/MediaDetailModal.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  ImageIcon,
  VideoIcon,
  Calendar,
  Clock,
  Tag,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Save,
  Trash2,
  Download,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface ContentPillar {
  id: string;
  name: string;
}

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | "GIF";
  mimeType: string | null;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  pillarIds: string[];
  tags: string[];
  contentTypes: string[];
  isUsed: boolean;
  usedAt: string | null;
  usedInPostId: string | null;
  expiresAt: string | null;
  autoSelect: boolean;
  priority: number;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  postMedia?: {
    post: {
      id: string;
      content: string;
      status: string;
      scheduledFor: string | null;
      publishedAt: string | null;
    };
  }[];
}

interface MediaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem | null;
  pillars: ContentPillar[];
  onUpdate?: (updatedMedia: MediaItem) => void;
  onDelete?: (mediaId: string) => void;
}

// ============================================
// CONSTANTS
// ============================================

const CONTENT_TYPES = [
  { id: "educational", label: "📚 Educational" },
  { id: "engagement", label: "💬 Engagement" },
  { id: "social_proof", label: "⭐ Social Proof" },
  { id: "promotional", label: "📢 Promotional" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getLifecycleStatus(
  media: MediaItem
): { status: string; color: string; icon: React.ReactNode } {
  if (media.isUsed) {
    return {
      status: "Used",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      icon: <CheckCircle2 className="w-4 h-4" />,
    };
  }

  const daysLeft = getDaysUntilExpiry(media.expiresAt);
  if (daysLeft !== null) {
    if (daysLeft <= 0) {
      return {
        status: "Expired",
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    }
    if (daysLeft <= 7) {
      return {
        status: `Expiring in ${daysLeft} days`,
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    }
  }

  return {
    status: "Available",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: <CheckCircle2 className="w-4 h-4" />,
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MediaDetailModal({
  isOpen,
  onClose,
  media,
  pillars,
  onUpdate,
  onDelete,
}: MediaDetailModalProps) {
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Editable fields
  const [editPillarIds, setEditPillarIds] = useState<string[]>([]);
  const [editContentTypes, setEditContentTypes] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string>("");
  const [editAltText, setEditAltText] = useState<string>("");
  const [editAutoSelect, setEditAutoSelect] = useState(true);

  // Initialize edit fields when media changes
  useEffect(() => {
    if (media) {
      setEditPillarIds(media.pillarIds || []);
      setEditContentTypes(media.contentTypes || []);
      setEditTags((media.tags || []).join(", "));
      setEditAltText(media.altText || "");
      setEditAutoSelect(media.autoSelect);
      setImageError(false);
    }
  }, [media]);

  // Reset state on close
  const handleClose = () => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  // Toggle pillar
  const togglePillar = (pillarId: string) => {
    setEditPillarIds((prev) =>
      prev.includes(pillarId)
        ? prev.filter((id) => id !== pillarId)
        : [...prev, pillarId]
    );
  };

  // Toggle content type
  const toggleContentType = (typeId: string) => {
    setEditContentTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Save changes
  const handleSave = async () => {
    if (!media) return;

    setIsSaving(true);

    try {
      const tagArray = editTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const response = await fetch(`/api/media/${media.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillarIds: editPillarIds,
          contentTypes: editContentTypes,
          tags: tagArray,
          altText: editAltText || null,
          autoSelect: editAutoSelect,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update media");
      }

      const updatedMedia = await response.json();
      onUpdate?.(updatedMedia);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete media
  const handleDelete = async () => {
    if (!media) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/media/${media.id}?force=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete media");
      }

      onDelete?.(media.id);
      handleClose();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete media. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Extend expiry
  const handleExtendExpiry = async () => {
    if (!media) return;

    try {
      const response = await fetch(`/api/media/${media.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extend expiry");
      }

      const updatedMedia = await response.json();
      onUpdate?.(updatedMedia);
    } catch (error) {
      console.error("Failed to extend expiry:", error);
      alert("Failed to extend expiry. Please try again.");
    }
  };

  if (!isOpen || !media) return null;

  const lifecycle = getLifecycleStatus(media);
  const daysLeft = getDaysUntilExpiry(media.expiresAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {media.type === "VIDEO" ? (
              <VideoIcon className="w-5 h-5 text-purple-400" />
            ) : (
              <ImageIcon className="w-5 h-5 text-blue-400" />
            )}
            <h2 className="text-lg font-semibold truncate max-w-md">
              {media.filename}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-primary"
                title="Save"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Left: Preview */}
            <div className="space-y-4">
              {/* Media preview */}
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                {media.type === "VIDEO" ? (
                  <video
                    src={media.url}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : imageError ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                ) : (
                  <Image
                    src={media.url}
                    alt={media.altText || media.filename}
                    fill
                    className="object-contain"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
                <a
                  href={media.url}
                  download={media.filename}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* File info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium">{formatFileSize(media.size)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{media.mimeType || media.type}</p>
                </div>
                {media.width && media.height && (
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                    <p className="text-muted-foreground">Dimensions</p>
                    <p className="font-medium">
                      {media.width} × {media.height}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              {/* Status */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Lifecycle Status
                </h3>

                <div
                  className={`
                    inline-flex items-center gap-2 px-3 py-1.5 rounded-full border
                    ${lifecycle.color}
                  `}
                >
                  {lifecycle.icon}
                  {lifecycle.status}
                </div>

                {/* Expiry info */}
                {media.expiresAt && !media.isUsed && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Expires</p>
                      <p className="font-medium">{formatDate(media.expiresAt)}</p>
                      {daysLeft !== null && daysLeft > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {daysLeft} days remaining
                        </p>
                      )}
                    </div>
                    {daysLeft !== null && daysLeft <= 14 && (
                      <button
                        onClick={handleExtendExpiry}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        +30 days
                      </button>
                    )}
                  </div>
                )}

                {/* Used info */}
                {media.isUsed && media.usedAt && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Used on</p>
                    <p className="font-medium">{formatDate(media.usedAt)}</p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dates
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Uploaded</p>
                    <p className="font-medium">{formatDate(media.createdAt)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Usage Count</p>
                    <p className="font-medium">{media.usageCount}</p>
                  </div>
                </div>
              </div>

              {/* Content Pillars */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Content Pillars
                </h3>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {pillars.map((pillar) => (
                      <button
                        key={pillar.id}
                        onClick={() => togglePillar(pillar.id)}
                        className={`
                          px-3 py-1.5 rounded-lg border text-sm transition-colors
                          ${
                            editPillarIds.includes(pillar.id)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:border-primary/50"
                          }
                        `}
                      >
                        {pillar.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {media.pillarIds.length > 0 ? (
                      media.pillarIds.map((id) => {
                        const pillar = pillars.find((p) => p.id === id);
                        return (
                          <span
                            key={id}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm"
                          >
                            {pillar?.name || id}
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No pillars assigned
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Content Types */}
              <div className="space-y-3">
                <h3 className="font-medium">Content Types</h3>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => toggleContentType(type.id)}
                        className={`
                          px-3 py-1.5 rounded-lg border text-sm transition-colors
                          ${
                            editContentTypes.includes(type.id)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:border-primary/50"
                          }
                        `}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {media.contentTypes.length > 0 ? (
                      media.contentTypes.map((typeId) => {
                        const type = CONTENT_TYPES.find((t) => t.id === typeId);
                        return (
                          <span
                            key={typeId}
                            className="px-3 py-1.5 rounded-lg bg-muted text-sm"
                          >
                            {type?.label || typeId}
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No content types assigned
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Enter tags (comma separated)"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {media.tags.length > 0 ? (
                      media.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-muted text-sm"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags</p>
                    )}
                  </div>
                )}
              </div>

              {/* Alt Text */}
              <div className="space-y-3">
                <h3 className="font-medium">Alt Text</h3>
                {isEditing ? (
                  <textarea
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    placeholder="Describe this image for accessibility"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {media.altText || "No alt text"}
                  </p>
                )}
              </div>

              {/* Auto-select */}
              {isEditing && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <input
                    type="checkbox"
                    id="editAutoSelect"
                    checked={editAutoSelect}
                    onChange={(e) => setEditAutoSelect(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="editAutoSelect" className="text-sm cursor-pointer">
                    Include in auto-selection pool
                  </label>
                </div>
              )}

              {/* Post usage history */}
              {media.postMedia && media.postMedia.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Used in Posts</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {media.postMedia.map((pm, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-muted/50 text-sm"
                      >
                        <p className="line-clamp-2">{pm.post.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              pm.post.status === "PUBLISHED"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-muted"
                            }`}
                          >
                            {pm.post.status}
                          </span>
                          {pm.post.publishedAt && (
                            <span>{formatDate(pm.post.publishedAt)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-10">
            <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Delete Media?</h3>
              </div>
              <p className="text-muted-foreground">
                This will permanently delete "{media.filename}" from storage.
                This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaDetailModal;