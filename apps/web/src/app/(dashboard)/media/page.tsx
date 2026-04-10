// apps/web/src/app/(dashboard)/media/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ImageIcon,
  Upload,
  Loader2,
  RefreshCw,
  Trash2,
  X,
  Check,
  ChevronDown,
  Building2,
  Tag,
  Filter,
  Grid3X3,
  List,
  Search,
  Video,
  FileImage,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface ContentPillar {
  id: string;
  name: string;
}

interface Media {
  id: string;
  companyId: string;
  filename: string;
  url: string;
  thumbnailUrl?: string | null;
  type: "IMAGE" | "VIDEO" | "GIF";
  mimeType?: string | null;
  size: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  pillarIds: string[];
  tags: string[];
  contentTypes: string[];
  usageCount: number;
  lastUsedAt?: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
  _count?: {
    postMedia: number;
  };
}

interface CompanyIntelligence {
  contentPillars: ContentPillar[];
}

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------

const CONTENT_TYPE_OPTIONS = [
  { value: "educational", label: "Educational", icon: "📚", color: "bg-blue-500" },
  { value: "engagement", label: "Engagement", icon: "💬", color: "bg-purple-500" },
  { value: "social_proof", label: "Social Proof", icon: "⭐", color: "bg-amber-500" },
  { value: "promotional", label: "Promotional", icon: "📢", color: "bg-green-500" },
];

const MEDIA_TYPE_OPTIONS = [
  { value: "IMAGE", label: "Images", icon: FileImage },
  { value: "VIDEO", label: "Videos", icon: Video },
  { value: "GIF", label: "GIFs", icon: ImageIcon },
];

// ---------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------

export default function MediaLibraryPage() {
  // Data state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedPillarId, setSelectedPillarId] = useState<string>("");
  const [selectedContentType, setSelectedContentType] = useState<string>("");
  const [selectedMediaType, setSelectedMediaType] = useState<string>("");
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  
  // Upload form state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCompanyId, setUploadCompanyId] = useState<string>("");
  const [uploadPillarIds, setUploadPillarIds] = useState<string[]>([]);
  const [uploadContentTypes, setUploadContentTypes] = useState<string[]>([]);
  const [uploadTags, setUploadTags] = useState<string>("");
  
  // Selection state
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------
  // Fetch Companies
  // ---------------------------------------------------------------

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
          if (data.length > 0 && !uploadCompanyId) {
            setUploadCompanyId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // ---------------------------------------------------------------
  // Fetch Pillars when company changes
  // ---------------------------------------------------------------

  useEffect(() => {
    const fetchPillars = async () => {
      if (!uploadCompanyId) {
        setPillars([]);
        return;
      }
      
      try {
        const res = await fetch(`/api/companies/${uploadCompanyId}/intelligence`);
        if (res.ok) {
          const data: CompanyIntelligence = await res.json();
          setPillars(data.contentPillars || []);
        }
      } catch (error) {
        console.error("Failed to fetch pillars:", error);
        setPillars([]);
      }
    };
    fetchPillars();
  }, [uploadCompanyId]);

  // ---------------------------------------------------------------
  // Fetch Media
  // ---------------------------------------------------------------

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompanyId) params.set("companyId", selectedCompanyId);
      if (selectedPillarId) params.set("pillarId", selectedPillarId);
      if (selectedContentType) params.set("contentType", selectedContentType);
      if (selectedMediaType) params.set("type", selectedMediaType);
      if (showUnusedOnly) params.set("unused", "true");

      const res = await fetch(`/api/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, selectedPillarId, selectedContentType, selectedMediaType, showUnusedOnly]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // ---------------------------------------------------------------
  // Filter media by search
  // ---------------------------------------------------------------

  const filteredMedia = media.filter((m) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.filename.toLowerCase().includes(query) ||
      m.tags.some((t) => t.toLowerCase().includes(query)) ||
      m.altText?.toLowerCase().includes(query)
    );
  });

  // ---------------------------------------------------------------
  // Upload Handlers
  // ---------------------------------------------------------------

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles((prev) => [...prev, ...files]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setUploadFiles((prev) => [...prev, ...files]);
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !uploadCompanyId) return;

    setUploading(true);
    try {
      const tags = uploadTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", uploadCompanyId);
        formData.append("pillarIds", JSON.stringify(uploadPillarIds));
        formData.append("contentTypes", JSON.stringify(uploadContentTypes));
        formData.append("tags", JSON.stringify(tags));

        await fetch("/api/media", {
          method: "POST",
          body: formData,
        });
      }

      // Reset and refresh
      setUploadFiles([]);
      setUploadPillarIds([]);
      setUploadContentTypes([]);
      setUploadTags("");
      setShowUploadModal(false);
      fetchMedia();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------------
  // Delete Handlers
  // ---------------------------------------------------------------

  const handleDeleteSelected = async () => {
    if (selectedMediaIds.length === 0) return;

    if (!confirm(`Delete ${selectedMediaIds.length} selected media?`)) return;

    setDeleting(true);
    try {
      for (const id of selectedMediaIds) {
        await fetch(`/api/media/${id}`, { method: "DELETE" });
      }
      setSelectedMediaIds([]);
      fetchMedia();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ---------------------------------------------------------------
  // Clear Filters
  // ---------------------------------------------------------------

  const clearFilters = () => {
    setSelectedCompanyId("");
    setSelectedPillarId("");
    setSelectedContentType("");
    setSelectedMediaType("");
    setShowUnusedOnly(false);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedCompanyId ||
    selectedPillarId ||
    selectedContentType ||
    selectedMediaType ||
    showUnusedOnly ||
    searchQuery;

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <ImageIcon className="text-brand-500" size={28} />
            Media Library
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {media.length} media files • {media.filter((m) => m.usageCount === 0).length} unused
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMedia}
            disabled={loading}
            className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {selectedMediaIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Delete ({selectedMediaIds.length})
            </button>
          )}

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:translate-y-[-1px] transition-all"
          >
            <Upload size={18} />
            Upload Media
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
        <Filter size={16} className="text-[var(--text-tertiary)]" />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or tag..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Company Filter */}
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Media Type Filter */}
        <select
          value={selectedMediaType}
          onChange={(e) => setSelectedMediaType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
        >
          <option value="">All Types</option>
          {MEDIA_TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Content Type Filter */}
        <select
          value={selectedContentType}
          onChange={(e) => setSelectedContentType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
        >
          <option value="">All Content Types</option>
          {CONTENT_TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>

        {/* Unused Only */}
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={showUnusedOnly}
            onChange={(e) => setShowUnusedOnly(e.target.checked)}
            className="rounded border-[var(--border-default)]"
          />
          Unused only
        </label>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all"
          >
            <X size={14} />
            Clear
          </button>
        )}

        {/* View Toggle */}
        <div className="ml-auto flex items-center bg-[var(--bg-primary)] rounded-lg p-1 border border-[var(--border-default)]">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              viewMode === "grid"
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              viewMode === "list"
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            )}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Media Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ImageIcon size={48} className="text-[var(--text-tertiary)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">
            No media found
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {hasActiveFilters
              ? "Try adjusting your filters"
              : "Upload some media to get started"}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-all"
            >
              <Upload size={16} />
              Upload Media
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleMediaSelection(item.id)}
              className={cn(
                "group relative aspect-square rounded-xl overflow-hidden bg-[var(--bg-secondary)] border cursor-pointer transition-all",
                selectedMediaIds.includes(item.id)
                  ? "border-brand-500 ring-2 ring-brand-500/30"
                  : "border-[var(--border-default)] hover:border-[var(--border-hover)]"
              )}
            >
              {/* Selection Checkbox */}
              <div
                className={cn(
                  "absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  selectedMediaIds.includes(item.id)
                    ? "bg-brand-500 border-brand-500"
                    : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                )}
              >
                {selectedMediaIds.includes(item.id) && (
                  <Check size={12} className="text-white" />
                )}
              </div>

              {/* Media Preview */}
              {item.type === "VIDEO" ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <Video size={32} className="text-gray-400" />
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={item.altText || item.filename}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
              )}

              {/* Overlay Info */}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">{item.filename}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-300">
                    {formatFileSize(item.size)}
                  </span>
                  <span className="text-[10px] text-gray-300">
                    {item.usageCount} uses
                  </span>
                </div>
              </div>

              {/* Company Badge */}
              <div className="absolute top-2 right-2">
                <div className="px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] text-white truncate max-w-[80px]">
                  {item.company.name}
                </div>
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded-md bg-brand-500/80 text-[10px] text-white"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-gray-500/80 text-[10px] text-white">
                      +{item.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleMediaSelection(item.id)}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-secondary)] border cursor-pointer transition-all",
                selectedMediaIds.includes(item.id)
                  ? "border-brand-500 ring-2 ring-brand-500/30"
                  : "border-[var(--border-default)] hover:border-[var(--border-hover)]"
              )}
            >
              {/* Selection Checkbox */}
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  selectedMediaIds.includes(item.id)
                    ? "bg-brand-500 border-brand-500"
                    : "border-[var(--border-default)]"
                )}
              >
                {selectedMediaIds.includes(item.id) && (
                  <Check size={12} className="text-white" />
                )}
              </div>

              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0 relative">
                {item.type === "VIDEO" ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={24} className="text-[var(--text-tertiary)]" />
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.altText || item.filename}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {item.filename}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                  <span>{item.company.name}</span>
                  <span>•</span>
                  <span>{formatFileSize(item.size)}</span>
                  <span>•</span>
                  <span>{item.usageCount} uses</span>
                  <span>•</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-[10px] text-[var(--text-secondary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Type Badge */}
              <div className="flex-shrink-0">
                <span
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    item.type === "IMAGE" && "bg-blue-500/10 text-blue-600",
                    item.type === "VIDEO" && "bg-purple-500/10 text-purple-600",
                    item.type === "GIF" && "bg-amber-500/10 text-amber-600"
                  )}
                >
                  {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative w-full max-w-xl bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border-default)] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Upload Media
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[var(--border-default)] rounded-xl p-8 text-center hover:border-brand-500 hover:bg-brand-500/5 transition-all cursor-pointer"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload size={32} className="mx-auto text-[var(--text-tertiary)] mb-3" />
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  Drag & drop files here
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  or click to browse • JPG, PNG, GIF, MP4 (max 10MB)
                </p>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Files */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Selected Files ({uploadFiles.length})
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uploadFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileImage size={16} className="text-[var(--text-tertiary)] flex-shrink-0" />
                          <span className="text-sm text-[var(--text-primary)] truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          onClick={() => removeUploadFile(index)}
                          className="p-1 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadCompanyId}
                  onChange={(e) => {
                    setUploadCompanyId(e.target.value);
                    setUploadPillarIds([]);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                >
                  <option value="">Select company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Pillars */}
              {pillars.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Content Pillars
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {pillars.map((pillar) => (
                      <button
                        key={pillar.id}
                        type="button"
                        onClick={() =>
                          setUploadPillarIds((prev) =>
                            prev.includes(pillar.id)
                              ? prev.filter((id) => id !== pillar.id)
                              : [...prev, pillar.id]
                          )
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          uploadPillarIds.includes(pillar.id)
                            ? "bg-brand-500 text-white"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                        )}
                      >
                        {pillar.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Select pillars this media relates to
                  </p>
                </div>
              )}

              {/* Content Types */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Content Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setUploadContentTypes((prev) =>
                          prev.includes(type.value)
                            ? prev.filter((t) => t !== type.value)
                            : [...prev, type.value]
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                        uploadContentTypes.includes(type.value)
                          ? "bg-brand-500 text-white"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                      )}
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  What type of posts would use this media?
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Tags <span className="text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., pasta, italian, dinner special"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Comma-separated tags for easier searching
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || uploadFiles.length === 0 || !uploadCompanyId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}