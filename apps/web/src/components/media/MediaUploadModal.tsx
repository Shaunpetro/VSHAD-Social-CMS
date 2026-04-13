// apps/web/src/components/media/MediaUploadModal.tsx

"use client";

import { useState, useCallback, useRef } from "react";
import {
  X,
  Upload,
  ImageIcon,
  VideoIcon,
  FileIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface ContentPillar {
  id: string;
  name: string;
}

interface UploadFile {
  id: string;
  file: File;
  preview: string | null;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  progress: number;
}

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  pillars: ContentPillar[];
  onUploadComplete?: (uploadedCount: number) => void;
}

// ============================================
// CONSTANTS
// ============================================

const CONTENT_TYPES = [
  { id: "educational", label: "📚 Educational", description: "How-tos, tips, tutorials" },
  { id: "engagement", label: "💬 Engagement", description: "Questions, polls, discussions" },
  { id: "social_proof", label: "⭐ Social Proof", description: "Testimonials, case studies" },
  { id: "promotional", label: "📢 Promotional", description: "Products, services, offers" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
};

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

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getFileIcon(type: string) {
  if (type.startsWith("video/")) {
    return <VideoIcon className="w-5 h-5 text-purple-400" />;
  }
  if (type.startsWith("image/")) {
    return <ImageIcon className="w-5 h-5 text-blue-400" />;
  }
  return <FileIcon className="w-5 h-5 text-gray-400" />;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MediaUploadModal({
  isOpen,
  onClose,
  companyId,
  pillars,
  onUploadComplete,
}: MediaUploadModalProps) {
  // State
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [tags, setTags] = useState<string>("");
  const [autoSelect, setAutoSelect] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (max ${formatFileSize(MAX_FILE_SIZE)})`;
    }

    const acceptedMimeTypes = Object.keys(ACCEPTED_TYPES);
    if (!acceptedMimeTypes.includes(file.type)) {
      return "Unsupported file type";
    }

    return null;
  };

  // Add files
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);

    const uploadFiles: UploadFile[] = fileArray.map((file) => {
      const error = validateFile(file);
      let preview: string | null = null;

      if (file.type.startsWith("image/") && !error) {
        preview = URL.createObjectURL(file);
      }

      return {
        id: generateId(),
        file,
        preview,
        status: error ? "error" : "pending",
        error: error || undefined,
        progress: 0,
      };
    });

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, []);

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // Toggle pillar selection
  const togglePillar = (pillarId: string) => {
    setSelectedPillars((prev) =>
      prev.includes(pillarId)
        ? prev.filter((id) => id !== pillarId)
        : [...prev, pillarId]
    );
  };

  // Toggle content type selection
  const toggleContentType = (typeId: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Upload files
  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    // Parse tags
    const tagArray = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    let successCount = 0;

    for (const uploadFile of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "uploading" as const } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", uploadFile.file);
        formData.append("companyId", companyId);
        formData.append("pillarIds", JSON.stringify(selectedPillars));
        formData.append("contentTypes", JSON.stringify(selectedContentTypes));
        formData.append("tags", JSON.stringify(tagArray));
        formData.append("autoSelect", autoSelect.toString());

        const response = await fetch("/api/media", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "success" as const, progress: 100 }
              : f
          )
        );

        successCount++;
      } catch (error) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      onUploadComplete?.(successCount);
    }
  };

  // Close and cleanup
  const handleClose = () => {
    // Cleanup preview URLs
    files.forEach((f) => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });

    // Reset state
    setFiles([]);
    setSelectedPillars([]);
    setSelectedContentTypes([]);
    setTags("");
    setAutoSelect(true);

    onClose();
  };

  // Calculate counts
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold">Upload Media</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drop zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-colors
              ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={Object.entries(ACCEPTED_TYPES)
                .flatMap(([mime, exts]) => [mime, ...exts])
                .join(",")}
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {isDragging ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF, WebP, MP4, MOV (max 10MB)
              </p>
            </div>
          </div>

          {/* Selected files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Selected Files ({files.length})
                </h3>
                {successCount > 0 && (
                  <span className="text-sm text-green-500">
                    {successCount} uploaded
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border
                      ${
                        uploadFile.status === "error"
                          ? "border-red-500/30 bg-red-500/10"
                          : uploadFile.status === "success"
                            ? "border-green-500/30 bg-green-500/10"
                            : "border-border bg-muted/30"
                      }
                    `}
                  >
                    {/* Preview/Icon */}
                    {uploadFile.preview ? (
                      <img
                        src={uploadFile.preview}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        {getFileIcon(uploadFile.file.type)}
                      </div>
                    )}

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                        {uploadFile.error && (
                          <span className="text-red-500 ml-2">
                            • {uploadFile.error}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Status/Actions */}
                    {uploadFile.status === "uploading" ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : uploadFile.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : uploadFile.status === "error" ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Pillars */}
          {pillars.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Content Pillars</h3>
              <p className="text-sm text-muted-foreground">
                Select pillars that this media relates to
              </p>
              <div className="flex flex-wrap gap-2">
                {pillars.map((pillar) => (
                  <button
                    key={pillar.id}
                    onClick={() => togglePillar(pillar.id)}
                    className={`
                      px-3 py-1.5 rounded-lg border text-sm transition-colors
                      ${
                        selectedPillars.includes(pillar.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    {pillar.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Types */}
          <div className="space-y-3">
            <h3 className="font-medium">Content Types</h3>
            <p className="text-sm text-muted-foreground">
              What types of posts is this media suitable for?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleContentType(type.id)}
                  className={`
                    px-3 py-2 rounded-lg border text-left transition-colors
                    ${
                      selectedContentTypes.includes(type.id)
                        ? "bg-primary/10 border-primary"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <span className="text-sm font-medium">{type.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <h3 className="font-medium">Tags</h3>
            <p className="text-sm text-muted-foreground">
              Add custom tags (comma separated)
            </p>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., pasta, italian, dinner special"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Auto-select option */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <input
              type="checkbox"
              id="autoSelect"
              checked={autoSelect}
              onChange={(e) => setAutoSelect(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border"
            />
            <div>
              <label htmlFor="autoSelect" className="font-medium cursor-pointer">
                Auto-select for matching posts
              </label>
              <p className="text-sm text-muted-foreground mt-0.5">
                System will automatically attach this media to suitable posts
              </p>
            </div>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-400">Media Lifecycle</p>
              <p className="text-muted-foreground mt-1">
                Media expires in 2 months or after being used in a published post.
                Expiring media is prioritized to ensure it gets used before deletion.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {pendingCount > 0 && `${pendingCount} file(s) ready to upload`}
            {errorCount > 0 && (
              <span className="text-red-500 ml-2">• {errorCount} failed</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              {successCount > 0 ? "Done" : "Cancel"}
            </button>
            <button
              onClick={handleUpload}
              disabled={pendingCount === 0 || isUploading}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                flex items-center gap-2
                ${
                  pendingCount === 0 || isUploading
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }
              `}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {pendingCount > 0 ? `(${pendingCount})` : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaUploadModal;