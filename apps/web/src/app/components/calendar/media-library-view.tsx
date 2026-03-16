// apps/web/src/app/components/calendar/media-library-view.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Search,
  Grid,
  List,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadButton, UploadDropzone } from "@/lib/uploadthing-components";

interface Media {
  id: string;
  filename: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "GIF";
  size: number;
  createdAt: string;
}

interface MediaLibraryViewProps {
  companyId?: string;
  selectionMode?: boolean;
  selectedMedia?: string[];
  onSelectionChange?: (mediaIds: string[]) => void;
  maxSelection?: number;
}

export function MediaLibraryView({
  companyId,
  selectionMode = false,
  selectedMedia = [],
  onSelectionChange,
  maxSelection = 10,
}: MediaLibraryViewProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "IMAGE" | "VIDEO">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [companyId, filterType]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (filterType !== "all") params.append("type", filterType);

      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (res: any[]) => {
    console.log("=== handleUploadComplete called ===");
    console.log("Response:", res);
    
    for (const file of res) {
      try {
        console.log("Saving to database:", file);
        const isVideo = file.name?.match(/\.(mp4|webm|mov|avi)$/i);
        
        const saveRes = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: companyId || "temp-company",
            filename: file.name,
            url: file.url,
            type: isVideo ? "VIDEO" : "IMAGE",
            size: file.size || 0,
          }),
        });
        
        if (saveRes.ok) {
          console.log("Saved to database successfully");
        } else {
          console.error("Failed to save to database:", await saveRes.text());
        }
      } catch (err) {
        console.error("Failed to save media:", err);
      }
    }
    
    fetchMedia();
    setShowUpload(false);
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMedia(media.filter((m) => m.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Failed to delete media");
    } finally {
      setDeleting(null);
    }
  };

  const handleSelect = (id: string) => {
    if (!onSelectionChange) return;
    const isSelected = selectedMedia.includes(id);
    if (isSelected) {
      onSelectionChange(selectedMedia.filter((m) => m !== id));
    } else if (selectedMedia.length < maxSelection) {
      onSelectionChange([...selectedMedia, id]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredMedia = media.filter((m) =>
    m.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🖼️ Media Library
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {media.length} files
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {(["all", "IMAGE", "VIDEO"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                filterType === type
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              {type === "all" ? "All" : type === "IMAGE" ? "Images" : "Videos"}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Selection Info */}
      {selectionMode && selectedMedia.length > 0 && (
        <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedMedia.length} of {maxSelection} selected
          </span>
          <button
            onClick={() => onSelectionChange?.([])}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No media found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload your first image or video
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Upload Media
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => selectionMode && handleSelect(item.id)}
                className={cn(
                  "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                  selectedMedia.includes(item.id)
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                {item.type === "VIDEO" ? (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Selection checkbox */}
                {selectionMode && (
                  <div
                    className={cn(
                      "absolute top-2 left-2 h-6 w-6 rounded-full border-2 flex items-center justify-center",
                      selectedMedia.includes(item.id)
                        ? "bg-blue-500 border-blue-500"
                        : "bg-white/80 border-gray-300"
                    )}
                  >
                    {selectedMedia.includes(item.id) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                )}

                {/* Hover actions */}
                {!selectionMode && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deleting === item.id}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      {deleting === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}

                {item.type === "VIDEO" && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                    VIDEO
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => selectionMode && handleSelect(item.id)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer",
                  selectedMedia.includes(item.id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                {selectionMode && (
                  <div
                    className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                      selectedMedia.includes(item.id)
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    )}
                  >
                    {selectedMedia.includes(item.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                )}

                <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                  {item.type === "VIDEO" ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Video className="h-5 w-5 text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.filename}
                  </p>
                  <p className="text-xs text-gray-500">{item.type} • {formatSize(item.size)}</p>
                </div>

                {!selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-xl w-full max-w-lg mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload Media
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {uploading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {/* Upload Dropzone */}
                  <div className="w-full">
                    <UploadDropzone
                      endpoint="mediaUploader"
                      onBeforeUploadBegin={(files) => {
                        console.log("=== BEFORE UPLOAD ===");
                        console.log("Files:", files.map(f => f.name));
                        setUploading(true);
                        return files;
                      }}
                      onUploadBegin={(fileName) => {
                        console.log("=== UPLOAD BEGIN ===");
                        console.log("File:", fileName);
                      }}
                      onClientUploadComplete={(res) => {
                        console.log("=== CLIENT UPLOAD COMPLETE ===");
                        console.log("Response:", res);
                        if (res && res.length > 0) {
                          handleUploadComplete(res);
                        } else {
                          setUploading(false);
                          alert("Upload completed but no files received");
                        }
                      }}
                      onUploadError={(error: Error) => {
                        console.log("=== UPLOAD ERROR ===");
                        console.log("Error:", error);
                        setUploading(false);
                        alert(`Upload failed: ${error.message}`);
                      }}
                      onUploadAborted={() => {
                        console.log("=== UPLOAD ABORTED ===");
                        setUploading(false);
                      }}
                      config={{ mode: "auto" }}
                      appearance={{
                        container: "border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors",
                        label: "text-gray-600 dark:text-gray-400",
                        allowedContent: "text-gray-500 dark:text-gray-500 text-sm mt-2",
                        button: "bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg mt-4 ut-uploading:bg-blue-500",
                        uploadIcon: "text-gray-400 w-12 h-12",
                      }}
                    />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                    <span className="text-sm text-gray-500">or</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  </div>

                  {/* Upload Button Alternative */}
                  <UploadButton
                    endpoint="mediaUploader"
                    onBeforeUploadBegin={(files) => {
                      console.log("=== BUTTON BEFORE UPLOAD ===");
                      console.log("Files:", files.map(f => f.name));
                      setUploading(true);
                      return files;
                    }}
                    onUploadBegin={(fileName) => {
                      console.log("=== BUTTON UPLOAD BEGIN ===");
                      console.log("File:", fileName);
                    }}
                    onClientUploadComplete={(res) => {
                      console.log("=== BUTTON UPLOAD COMPLETE ===");
                      console.log("Response:", res);
                      if (res && res.length > 0) {
                        handleUploadComplete(res);
                      } else {
                        setUploading(false);
                        alert("Upload completed but no files received");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.log("=== BUTTON UPLOAD ERROR ===");
                      console.log("Error:", error);
                      setUploading(false);
                      alert(`Upload failed: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium px-6 py-2.5 rounded-lg transition-colors",
                      allowedContent: "hidden",
                    }}
                    content={{
                      button: "Choose Files",
                    }}
                  />

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Supported: JPG, PNG, GIF, WebP, MP4, WebM<br />
                    Max 8MB for images, 64MB for videos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}