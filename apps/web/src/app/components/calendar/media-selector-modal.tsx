// apps/web/src/app/components/calendar/media-selector-modal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, 
  Check, 
  Image as ImageIcon, 
  Film, 
  FileText, 
  Search, 
  Loader2, 
  Upload, 
  AlertCircle,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Media {
  id: string;
  filename: string;
  url: string;
  type?: "IMAGE" | "VIDEO" | "DOCUMENT";
  mimeType?: string;
  size?: number;
  createdAt?: string;
}

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  selectedMediaIds: string[];
  onSelectionConfirm: (mediaIds: string[], mediaItems: Media[]) => void;
  maxSelection?: number;
}

export function MediaSelectorModal({
  isOpen,
  onClose,
  companyId,
  selectedMediaIds,
  onSelectionConfirm,
  maxSelection = 10,
}: MediaSelectorModalProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelection, setLocalSelection] = useState<string[]>(selectedMediaIds);
  const [filterType, setFilterType] = useState<"ALL" | "IMAGE" | "VIDEO" | "DOCUMENT">("ALL");
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(selectedMediaIds);
      setUploadError(null);
      setUploadSuccess(null);
      fetchMedia();
    }
  }, [isOpen, companyId, selectedMediaIds]);

  const fetchMedia = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/media?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        // Handle both array and object responses
        const mediaArray = Array.isArray(data) ? data : data.media || data.data || [];
        setMedia(mediaArray);
      } else {
        console.error("Failed to fetch media:", await res.text());
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaType = (item: Media): "IMAGE" | "VIDEO" | "DOCUMENT" => {
    if (item.type) return item.type;
    if (item.mimeType?.startsWith("image/")) return "IMAGE";
    if (item.mimeType?.startsWith("video/")) return "VIDEO";
    return "DOCUMENT";
  };

  const toggleSelection = (mediaId: string) => {
    setLocalSelection((prev) => {
      if (prev.includes(mediaId)) {
        return prev.filter((id) => id !== mediaId);
      }
      if (prev.length >= maxSelection) {
        return prev;
      }
      return [...prev, mediaId];
    });
  };

  const handleConfirm = () => {
    const selectedItems = media.filter((m) => localSelection.includes(m.id));
    onSelectionConfirm(localSelection, selectedItems);
    onClose();
  };

  // Upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const validDocTypes = ['application/pdf'];
      const allValidTypes = [...validImageTypes, ...validVideoTypes, ...validDocTypes];
      
      if (!allValidTypes.includes(file.type)) {
        errors.push(`Invalid file type: ${file.name}`);
        continue;
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`File too large: ${file.name} (max 50MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", companyId);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          uploadedCount++;
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        } else {
          const errorData = await res.json().catch(() => ({ error: "Upload failed" }));
          errors.push(`${file.name}: ${errorData.error || "Upload failed"}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        errors.push(`${file.name}: Network error`);
      }
    }

    setIsUploading(false);
    
    if (uploadedCount > 0) {
      setUploadSuccess(`Successfully uploaded ${uploadedCount} file(s)`);
      // Refresh media list
      await fetchMedia();
      // Switch to library tab to show uploaded files
      setActiveTab("library");
    }

    if (errors.length > 0) {
      setUploadError(errors.join("; "));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Clear success message after 3 seconds
    if (uploadedCount > 0) {
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredMedia = media.filter((m) => {
    const matchesSearch = m.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const itemType = getMediaType(m);
    const matchesType = filterType === "ALL" || itemType === filterType;
    return matchesSearch && matchesType;
  });

  const getMediaIcon = (type: "IMAGE" | "VIDEO" | "DOCUMENT") => {
    switch (type) {
      case "VIDEO":
        return Film;
      case "DOCUMENT":
        return FileText;
      default:
        return ImageIcon;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Media Library
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {localSelection.length} of {maxSelection} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab("library")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "library"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <ImageIcon className="h-4 w-4 inline mr-2" />
              Library ({media.length})
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "upload"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Upload
            </button>
          </div>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            {uploadSuccess}
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{uploadError}</span>
            <button 
              onClick={() => setUploadError(null)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "upload" ? (
          /* Upload Tab */
          <div className="flex-1 p-6">
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-12 transition-all h-full flex flex-col items-center justify-center",
                dragActive 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                  : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime,application/pdf"
                onChange={handleFileInput}
                className="hidden"
                id="media-upload-input"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Uploading...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {uploadProgress}% complete
                  </p>
                  <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <label 
                  htmlFor="media-upload-input" 
                  className="flex flex-col items-center cursor-pointer"
                >
                  <div className={cn(
                    "p-4 rounded-full mb-4 transition-colors",
                    dragActive 
                      ? "bg-blue-100 dark:bg-blue-900" 
                      : "bg-gray-100 dark:bg-gray-800"
                  )}>
                    <Upload className={cn(
                      "h-10 w-10 transition-colors",
                      dragActive ? "text-blue-500" : "text-gray-400"
                    )} />
                  </div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {dragActive ? "Drop files here" : "Click to upload"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or drag and drop files here
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      JPG, PNG, GIF, WebP
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      MP4, WebM
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      PDF
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Maximum file size: 50MB
                  </p>
                </label>
              )}
            </div>
          </div>
        ) : (
          /* Library Tab */
          <>
            {/* Filters */}
            <div className="px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm 
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                             dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["ALL", "IMAGE", "VIDEO", "DOCUMENT"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      filterType === type
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    )}
                  >
                    {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">No media found</p>
                  <p className="text-sm mt-1">
                    {media.length === 0 
                      ? "Upload some media to get started" 
                      : "Try adjusting your search or filter"}
                  </p>
                  {media.length === 0 && (
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Upload className="h-4 w-4 inline mr-2" />
                      Upload Media
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((item) => {
                    const isSelected = localSelection.includes(item.id);
                    const itemType = getMediaType(item);
                    const Icon = getMediaIcon(itemType);
                    const isAtLimit = localSelection.length >= maxSelection && !isSelected;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => !isAtLimit && toggleSelection(item.id)}
                        disabled={isAtLimit}
                        className={cn(
                          "relative group aspect-square rounded-xl overflow-hidden border-2 transition-all text-left",
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/30"
                            : isAtLimit
                            ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        {itemType === "IMAGE" ? (
                          <img
                            src={item.url}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : itemType === "VIDEO" ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 relative">
                            <video 
                              src={item.url} 
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                                <Film className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
                            <Icon className="h-12 w-12 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 text-center truncate w-full">
                              {item.filename}
                            </span>
                          </div>
                        )}
                        
                        {/* Selection indicator */}
                        <div
                          className={cn(
                            "absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100"
                          )}
                        >
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>

                        {/* Filename overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-2 pt-6">
                          <p className="text-xs text-white truncate font-medium">
                            {item.filename}
                          </p>
                          {item.size && (
                            <p className="text-xs text-white/70">
                              {formatFileSize(item.size)}
                            </p>
                          )}
                        </div>

                        {/* Hover overlay */}
                        {!isAtLimit && !isSelected && (
                          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocalSelection([])}
              disabled={localSelection.length === 0}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear Selection
            </button>
            {localSelection.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {localSelection.length} item{localSelection.length !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg 
                         dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={localSelection.length === 0}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                localSelection.length === 0
                  ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              Confirm Selection ({localSelection.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}