// apps/web/src/app/components/calendar/create-post-view.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Wand2,
  PenLine,
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  Save,
  Calendar,
  CalendarRange,
  RefreshCw,
  Eye,
  Hash,
  Smile,
  Check,
  ArrowLeft,
  AlertCircle,
  ImagePlus,
  Shuffle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaSelectorModal } from "./media-selector-modal";
import { SchedulePicker } from "./schedule-picker";

interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
}

interface Platform {
  id: string;
  platform: string;
  type?: string;
  platformName?: string;
  accountName?: string;
  status?: string;
  isConnected?: boolean;
  connected?: boolean;
}

interface Media {
  id: string;
  filename: string;
  url: string;
  type?: "IMAGE" | "VIDEO" | "DOCUMENT";
  mimeType?: string;
}

interface GeneratedContent {
  platform: string;
  content: string;
  hashtags: string[];
}

interface CreatePostViewProps {
  companyId: string | null;
  onClose?: () => void;
}

const PLATFORM_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string; charLimit: number }
> = {
  linkedin: {
    icon: Linkedin,
    color: "bg-[#0A66C2]",
    label: "LinkedIn",
    charLimit: 3000,
  },
  instagram: {
    icon: Instagram,
    color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
    label: "Instagram",
    charLimit: 2200,
  },
  twitter: {
    icon: Twitter,
    color: "bg-black dark:bg-white dark:text-black",
    label: "X (Twitter)",
    charLimit: 280,
  },
  x: {
    icon: Twitter,
    color: "bg-black dark:bg-white dark:text-black",
    label: "X (Twitter)",
    charLimit: 280,
  },
  facebook: {
    icon: Facebook,
    color: "bg-[#1877F2]",
    label: "Facebook",
    charLimit: 63206,
  },
  wordpress: {
    icon: Globe,
    color: "bg-[#21759B]",
    label: "WordPress",
    charLimit: 50000,
  },
};

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", emoji: "👔" },
  { value: "casual", label: "Casual", emoji: "😊" },
  { value: "friendly", label: "Friendly", emoji: "🤗" },
  { value: "authoritative", label: "Authoritative", emoji: "📚" },
];

// Helper to get platform type from platform object
const getPlatformType = (platform: Platform): string => {
  const type = platform.platform || platform.type || "";
  return type.toLowerCase().replace(/[^a-z]/g, "");
};

// Helper to check if platform is connected
const isPlatformConnected = (platform: Platform): boolean => {
  if (platform.status === "connected" || platform.status === "CONNECTED") return true;
  if (platform.isConnected === true) return true;
  if (platform.connected === true) return true;
  return false;
};

export function CreatePostView({ companyId, onClose }: CreatePostViewProps) {
  // Mode states
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [scheduleMode, setScheduleMode] = useState<"single" | "bulk">("single");

  // Company & Platform states
  const [company, setCompany] = useState<Company | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [platformError, setPlatformError] = useState<string | null>(null);

  // AI Generation states
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Content states
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [manualContent, setManualContent] = useState("");
  const [manualHashtags, setManualHashtags] = useState("");

  // Media states
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  
  // Bulk media settings
  const [bulkAutoSelectMedia, setBulkAutoSelectMedia] = useState(true);
  const [bulkMediaPerPost, setBulkMediaPerPost] = useState(1);

  // Schedule states
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [bulkStartDate, setBulkStartDate] = useState<Date | null>(null);
  const [bulkEndDate, setBulkEndDate] = useState<Date | null>(null);
  const [bulkPostsCount, setBulkPostsCount] = useState(5);
  const [bulkTimesPerDay, setBulkTimesPerDay] = useState(["09:00", "14:00"]);

  // UI states
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch company details and platforms when companyId changes
  useEffect(() => {
    if (!companyId) {
      setCompany(null);
      setPlatforms([]);
      setPlatformError(null);
      return;
    }

    const fetchCompanyAndPlatforms = async () => {
      setLoadingPlatforms(true);
      setPlatformError(null);

      try {
        // Fetch company details
        const companyRes = await fetch(`/api/companies/${companyId}`);
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompany(companyData);
        }

        // Fetch platforms
        const platformsRes = await fetch(`/api/platforms?companyId=${companyId}`);
        if (platformsRes.ok) {
          const platformsData = await platformsRes.json();

          // Handle both array and object responses
          const platformArray = Array.isArray(platformsData)
            ? platformsData
            : platformsData.platforms || platformsData.data || [];

          // Filter to connected platforms
          const connectedPlatforms = platformArray.filter((p: Platform) =>
            isPlatformConnected(p)
          );

          setPlatforms(connectedPlatforms);

          if (connectedPlatforms.length === 0 && platformArray.length > 0) {
            setPlatformError(
              "Platforms found but none are connected. Please connect a platform first."
            );
          } else if (platformArray.length === 0) {
            setPlatformError(
              "No platforms configured. Add platforms in the Platforms section."
            );
          }
        } else {
          setPlatformError(`Failed to load platforms: ${platformsRes.status}`);
        }
      } catch (error) {
        console.error("Failed to fetch company/platforms:", error);
        setPlatformError("Network error loading platforms");
      } finally {
        setLoadingPlatforms(false);
      }
    };

    fetchCompanyAndPlatforms();
  }, [companyId]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const togglePlatform = (platformType: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformType)
        ? prev.filter((p) => p !== platformType)
        : [...prev, platformType]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim() || selectedPlatforms.length === 0 || !companyId) return;

    setIsGenerating(true);
    setGeneratedContents([]);
    setSaveMessage(null);

    try {
      const results: GeneratedContent[] = [];

      for (const platformType of selectedPlatforms) {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            platform: platformType,
            topic,
            tone,
            includeHashtags,
            includeEmojis,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.content) {
            results.push({
              platform: platformType,
              content: data.content.content || "",
              hashtags: data.content.hashtags || [],
            });
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error(`Failed to generate for ${platformType}:`, errorData);
        }
      }

      if (results.length === 0) {
        setSaveMessage({
          type: "error",
          text: "Failed to generate content. Please try again.",
        });
      } else {
        setGeneratedContents(results);
        setPreviewPlatform(results[0].platform);
        if (results.length < selectedPlatforms.length) {
          setSaveMessage({
            type: "error",
            text: `Generated ${results.length} of ${selectedPlatforms.length} posts. Some failed.`,
          });
        } else {
          setSaveMessage({
            type: "success",
            text: `Generated ${results.length} post(s) successfully!`,
          });
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to generate content. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (status: "DRAFT" | "SCHEDULED") => {
    if (!companyId) {
      setSaveMessage({ type: "error", text: "Please select a company" });
      return;
    }

    if (mode === "ai" && generatedContents.length === 0) {
      setSaveMessage({ type: "error", text: "Generate content first" });
      return;
    }
    if (mode === "manual" && !manualContent.trim()) {
      setSaveMessage({ type: "error", text: "Enter content first" });
      return;
    }
    if (mode === "manual" && selectedPlatforms.length === 0) {
      setSaveMessage({ type: "error", text: "Select at least one platform" });
      return;
    }
    if (status === "SCHEDULED" && scheduleMode === "single" && !scheduledFor) {
      setSaveMessage({ type: "error", text: "Select a schedule date and time" });
      return;
    }
    if (
      status === "SCHEDULED" &&
      scheduleMode === "bulk" &&
      (!bulkStartDate || !bulkEndDate)
    ) {
      setSaveMessage({ type: "error", text: "Select bulk schedule date range" });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const postsToCreate =
        mode === "ai"
          ? generatedContents
          : selectedPlatforms.map((platformType) => ({
              platform: platformType,
              content: manualContent,
              hashtags: manualHashtags
                .split(",")
                .map((h) => h.trim())
                .filter(Boolean),
            }));

      if (scheduleMode === "bulk" && status === "SCHEDULED") {
        // Create bulk schedule with media distribution
        const bulkRes = await fetch("/api/bulk-schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            startDate: bulkStartDate?.toISOString(),
            endDate: bulkEndDate?.toISOString(),
            postsCount: bulkPostsCount,
            timesPerDay: bulkTimesPerDay,
            platforms: selectedPlatforms,
            topic,
            tone,
            includeHashtags,
            includeEmojis,
            // Media distribution options
            mediaIds: selectedMedia.map((m) => m.id),
            autoSelectMedia: selectedMedia.length === 0 ? bulkAutoSelectMedia : false,
            mediaPerPost: bulkMediaPerPost,
            preferImages: true,
          }),
        });

        if (!bulkRes.ok) {
          const errorData = await bulkRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create bulk schedule");
        }

        const bulkResult = await bulkRes.json();
        
        // Build detailed success message
        const mediaInfo = bulkResult.summary?.media;
        let successText = bulkResult.message || `Bulk schedule created with ${bulkPostsCount} posts!`;
        if (mediaInfo && mediaInfo.postsWithMedia > 0) {
          successText += ` (${mediaInfo.postsWithMedia} with media)`;
        }
        
        setSaveMessage({
          type: "success",
          text: successText,
        });
        
        setTimeout(() => {
          resetForm();
          if (onClose) onClose();
        }, 2000);
      } else {
        // Create individual posts
        const postsPayload = [];
        const errors: string[] = [];

        for (const post of postsToCreate) {
          const platformRecord = platforms.find(
            (p) => getPlatformType(p) === post.platform
          );

          if (!platformRecord) {
            errors.push(`Platform not found: ${post.platform}`);
            continue;
          }

          postsPayload.push({
            companyId,
            platformId: platformRecord.id,
            content: post.content,
            hashtags: post.hashtags,
            status,
            scheduledFor:
              status === "SCHEDULED" ? scheduledFor?.toISOString() : null,
            topic: mode === "ai" ? topic : null,
            tone: mode === "ai" ? tone : null,
            generatedBy: mode === "ai" ? "groq-llama-3.3" : "manual",
            mediaIds: selectedMedia.map((m) => m.id),
          });
        }

        if (postsPayload.length === 0) {
          throw new Error(errors.join("; ") || "No valid posts to create");
        }

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ posts: postsPayload }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create posts");
        }

        const result = await res.json();
        const successCount = result.count || postsPayload.length;

        setSaveMessage({
          type: "success",
          text:
            status === "DRAFT"
              ? `${successCount} draft(s) saved successfully!`
              : `${successCount} post(s) scheduled successfully!`,
        });

        setTimeout(() => {
          resetForm();
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Save failed:", error);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save post(s)",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTopic("");
    setManualContent("");
    setManualHashtags("");
    setGeneratedContents([]);
    setSelectedMedia([]);
    setSelectedPlatforms([]);
    setScheduledFor(null);
    setBulkStartDate(null);
    setBulkEndDate(null);
    setSaveMessage(null);
    setPreviewPlatform(null);
    setBulkAutoSelectMedia(true);
    setBulkMediaPerPost(1);
  };

  const currentPreview = generatedContents.find(
    (c) => c.platform === previewPlatform
  );

  // Show message if no company selected
  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🏢</span>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Company Selected
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Please select a company from the sidebar to create posts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              Create Post
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {company?.name
                ? `Creating for ${company.name}`
                : "Generate AI-powered content or write your own"}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 
                         dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg
                         hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Calendar
            </button>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-1 mb-6 inline-flex">
          <button
            onClick={() => setMode("ai")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "ai"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <Wand2 className="h-4 w-4" />
            AI Generate
          </button>
          <button
            onClick={() => setMode("manual")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "manual"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <PenLine className="h-4 w-4" />
            Manual Write
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Selection */}
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Select Platforms *
              </h3>

              {loadingPlatforms ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading platforms...
                  </span>
                </div>
              ) : platformError ? (
                <div className="flex items-center gap-2 py-4 px-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{platformError}</p>
                </div>
              ) : platforms.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="font-medium">No connected platforms</p>
                  <p className="text-sm mt-1">
                    Connect platforms in the Platforms section first.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-3">
                    {platforms.map((platform) => {
                      const platformType = getPlatformType(platform);
                      const config = PLATFORM_CONFIG[platformType];
                      const isSelected = selectedPlatforms.includes(platformType);

                      const displayConfig = config || {
                        icon: Globe,
                        color: "bg-gray-500",
                        label: platform.platform || platform.type || "Unknown",
                        charLimit: 5000,
                      };

                      const Icon = displayConfig.icon;

                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => togglePlatform(platformType)}
                          className={cn(
                            "relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-lg text-white",
                              displayConfig.color
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-medium text-gray-900 dark:text-white block">
                              {displayConfig.label}
                            </span>
                            {platform.accountName && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {platform.accountName}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedPlatforms.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                      ✓ {selectedPlatforms.length} platform(s) selected
                    </p>
                  )}
                </>
              )}
            </div>

            {/* AI Generation Settings */}
            {mode === "ai" && (
              <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  AI Generation Settings
                </h3>

                <div className="space-y-4">
                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Topic / Subject *
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Safety tips for construction sites"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm 
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                                 dark:border-gray-600 dark:bg-gray-800 dark:text-white
                                 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tone
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TONE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTone(option.value)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left",
                            tone === option.value
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          {option.emoji} {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeHashtags}
                        onChange={(e) => setIncludeHashtags(e.target.checked)}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 
                                   dark:border-gray-600 dark:bg-gray-800"
                      />
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Include Hashtags
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeEmojis}
                        onChange={(e) => setIncludeEmojis(e.target.checked)}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500
                                   dark:border-gray-600 dark:bg-gray-800"
                      />
                      <Smile className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Include Emojis
                      </span>
                    </label>
                  </div>

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={
                      isGenerating ||
                      !topic.trim() ||
                      selectedPlatforms.length === 0
                    }
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all",
                      isGenerating ||
                        !topic.trim() ||
                        selectedPlatforms.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating for {selectedPlatforms.length} platform(s)...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Manual Content Input */}
            {mode === "manual" && (
              <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Write Your Content
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content *
                    </label>
                    <textarea
                      value={manualContent}
                      onChange={(e) => setManualContent(e.target.value)}
                      placeholder="Write your post content here..."
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm 
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                                 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none
                                 placeholder:text-gray-400"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        {manualContent.length} characters
                      </p>
                      {selectedPlatforms.length > 0 && (
                        <p className="text-xs text-gray-400">
                          Limit:{" "}
                          {Math.min(
                            ...selectedPlatforms.map(
                              (p) => PLATFORM_CONFIG[p]?.charLimit || 5000
                            )
                          )}{" "}
                          chars
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hashtags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={manualHashtags}
                      onChange={(e) => setManualHashtags(e.target.value)}
                      placeholder="construction, safety, engineering"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm 
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                                 dark:border-gray-600 dark:bg-gray-800 dark:text-white
                                 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Media Attachment */}
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Media Attachments
                </h3>
                {selectedMedia.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    + Add More
                  </button>
                )}
              </div>

              {selectedMedia.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowMediaSelector(true)}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 
                             hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
                >
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500 transition-colors">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <p className="text-sm font-medium">Click to add media</p>
                    <p className="text-xs">Select from library or upload new</p>
                  </div>
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {selectedMedia.map((media) => (
                    <div
                      key={media.id}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group"
                    >
                      {media.type === "IMAGE" ||
                      media.mimeType?.startsWith("image/") ? (
                        <img
                          src={media.url}
                          alt={media.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMedia((prev) =>
                            prev.filter((m) => m.id !== media.id)
                          )
                        }
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 
                                   opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 
                               flex items-center justify-center hover:border-blue-400 transition-colors"
                  >
                    <span className="text-2xl text-gray-400">+</span>
                  </button>
                </div>
              )}

              {/* Bulk Media Info - show when bulk mode */}
              {scheduleMode === "bulk" && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Shuffle className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Bulk Media Distribution
                    </span>
                  </div>
                  
                  {selectedMedia.length > 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      📸 Your {selectedMedia.length} selected media will be randomly distributed across {bulkPostsCount} posts.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={bulkAutoSelectMedia}
                          onChange={(e) => setBulkAutoSelectMedia(e.target.checked)}
                          className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 
                                     dark:border-gray-600 dark:bg-gray-800"
                        />
                        <ImagePlus className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Auto-select from media library
                        </span>
                      </label>
                      
                      {bulkAutoSelectMedia && (
                        <div className="ml-6">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Images per post
                          </label>
                          <select
                            value={bulkMediaPerPost}
                            onChange={(e) => setBulkMediaPerPost(Number(e.target.value))}
                            className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm 
                                       dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                          </select>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {bulkAutoSelectMedia 
                          ? "Media will be randomly selected from your library and distributed to avoid repetition."
                          : "Posts will be created without media attachments."
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scheduling */}
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Schedule
                </h3>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("single")}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      scheduleMode === "single"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("bulk")}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      scheduleMode === "bulk"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    <CalendarRange className="h-3 w-3" />
                    Bulk
                  </button>
                </div>
              </div>

              {scheduleMode === "single" ? (
                <SchedulePicker
                  mode="single"
                  scheduledFor={scheduledFor}
                  onScheduleChange={setScheduledFor}
                />
              ) : (
                <SchedulePicker
                  mode="bulk"
                  startDate={bulkStartDate}
                  endDate={bulkEndDate}
                  postsCount={bulkPostsCount}
                  timesPerDay={bulkTimesPerDay}
                  onStartDateChange={setBulkStartDate}
                  onEndDateChange={setBulkEndDate}
                  onPostsCountChange={setBulkPostsCount}
                  onTimesPerDayChange={setBulkTimesPerDay}
                />
              )}
            </div>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </h3>
                {generatedContents.length > 1 && (
                  <select
                    value={previewPlatform || ""}
                    onChange={(e) => setPreviewPlatform(e.target.value)}
                    className="text-xs rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 
                               dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {generatedContents.map((c) => (
                      <option key={c.platform} value={c.platform}>
                        {PLATFORM_CONFIG[c.platform]?.label || c.platform}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Preview Content - Scrollable Area */}
              <div className="max-h-[250px] overflow-y-auto mb-4">
                {mode === "ai" ? (
                  currentPreview ? (
                    <div className="space-y-3">
                      {/* Platform badge */}
                      <div className="flex items-center gap-2">
                        {PLATFORM_CONFIG[currentPreview.platform] && (
                          <div
                            className={cn(
                              "p-1.5 rounded-lg text-white",
                              PLATFORM_CONFIG[currentPreview.platform].color
                            )}
                          >
                            {(() => {
                              const Icon =
                                PLATFORM_CONFIG[currentPreview.platform].icon;
                              return <Icon className="h-3.5 w-3.5" />;
                            })()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {PLATFORM_CONFIG[currentPreview.platform]?.label ||
                            currentPreview.platform}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({currentPreview.content.length} chars)
                        </span>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {currentPreview.content}
                        </p>
                      </div>
                      {currentPreview.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {currentPreview.hashtags.slice(0, 5).map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {currentPreview.hashtags.length > 5 && (
                            <span className="text-xs text-gray-400">
                              +{currentPreview.hashtags.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 
                                   disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw
                          className={cn("h-3 w-3", isGenerating && "animate-spin")}
                        />
                        Regenerate
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No content yet</p>
                      <p className="text-xs mt-1">Generate content first</p>
                    </div>
                  )
                ) : manualContent ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {manualContent}
                      </p>
                    </div>
                    {manualHashtags && (
                      <div className="flex flex-wrap gap-1">
                        {manualHashtags
                          .split(",")
                          .filter((t) => t.trim())
                          .slice(0, 5)
                          .map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <PenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No content yet</p>
                    <p className="text-xs mt-1">Start typing to preview</p>
                  </div>
                )}

                {/* Selected Media Preview */}
                {selectedMedia.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      📎 Media ({selectedMedia.length})
                      {scheduleMode === "bulk" && (
                        <span className="text-purple-500 ml-1">
                          → distributed across {bulkPostsCount} posts
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedMedia.slice(0, 4).map((media) => (
                        <div
                          key={media.id}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                          {media.type === "IMAGE" ||
                          media.mimeType?.startsWith("image/") ? (
                            <img
                              src={media.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                      {selectedMedia.length > 4 && (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">
                            +{selectedMedia.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

              {/* Action Buttons - Always Visible */}
              <div className="space-y-3">
                {saveMessage && (
                  <div
                    className={cn(
                      "p-3 rounded-lg text-sm font-medium flex items-center gap-2",
                      saveMessage.type === "success"
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    )}
                  >
                    {saveMessage.type === "success" ? "✓" : "✕"} {saveMessage.text}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSave("DRAFT")}
                  disabled={
                    isSaving ||
                    (mode === "ai" && generatedContents.length === 0) ||
                    (mode === "manual" && !manualContent.trim())
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 
                             text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors
                             dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSave("SCHEDULED")}
                  disabled={
                    isSaving ||
                    (mode === "ai" && generatedContents.length === 0) ||
                    (mode === "manual" && !manualContent.trim()) ||
                    (scheduleMode === "single" && !scheduledFor) ||
                    (scheduleMode === "bulk" && (!bulkStartDate || !bulkEndDate))
                  }
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
                    "bg-blue-600 text-white hover:bg-blue-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {scheduleMode === "bulk" ? "Creating bulk schedule..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      {scheduleMode === "bulk"
                        ? "Create Bulk Schedule"
                        : "Schedule Post"}
                    </>
                  )}
                </button>

                {/* Quick info */}
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
                  {mode === "ai" && generatedContents.length > 0 && (
                    <p>✓ {generatedContents.length} post(s) ready</p>
                  )}
                  {mode === "manual" &&
                    selectedPlatforms.length > 0 &&
                    manualContent.trim() && (
                      <p>✓ Will post to {selectedPlatforms.length} platform(s)</p>
                    )}
                  {scheduledFor && scheduleMode === "single" && (
                    <p>📅 {scheduledFor.toLocaleString()}</p>
                  )}
                  {scheduleMode === "bulk" && bulkStartDate && bulkEndDate && (
                    <p>
                      📅 {bulkPostsCount} unique posts
                      {bulkAutoSelectMedia && selectedMedia.length === 0 && " with auto-media"}
                      {selectedMedia.length > 0 && ` with ${selectedMedia.length} media`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Media Selector Modal */}
        <MediaSelectorModal
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          companyId={companyId}
          selectedMediaIds={selectedMedia.map((m) => m.id)}
          onSelectionConfirm={(ids, items) => setSelectedMedia(items)}
          maxSelection={scheduleMode === "bulk" ? 20 : 10}
        />
      </div>
    </div>
  );
}