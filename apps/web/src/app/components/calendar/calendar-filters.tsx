// apps/web/src/app/components/calendar/calendar-filters.tsx
"use client";

import { useState } from "react";
import {
  Filter,
  X,
  ChevronDown,
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Platform {
  id: string;
  // API returns either format
  type?: string;
  platform?: string;
  name?: string | null;
  accountName?: string | null;
}

interface CalendarFiltersProps {
  platforms: Platform[];
  selectedPlatforms: string[];
  selectedStatuses: string[];
  onPlatformChange: (platformIds: string[]) => void;
  onStatusChange: (statuses: string[]) => void;
  onClearFilters: () => void;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  wordpress: Globe,
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "text-[#0A66C2]",
  instagram: "text-pink-600",
  twitter: "text-gray-900 dark:text-white",
  facebook: "text-[#1877F2]",
  wordpress: "text-[#21759B]",
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  facebook: "Facebook",
  wordpress: "WordPress",
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-400" },
  { value: "SCHEDULED", label: "Scheduled", color: "bg-blue-500" },
  { value: "PUBLISHING", label: "Publishing", color: "bg-yellow-500" },
  { value: "PUBLISHED", label: "Published", color: "bg-green-500" },
  { value: "FAILED", label: "Failed", color: "bg-red-500" },
];

export function CalendarFilters({
  platforms,
  selectedPlatforms,
  selectedStatuses,
  onPlatformChange,
  onStatusChange,
  onClearFilters,
}: CalendarFiltersProps) {
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const hasActiveFilters = selectedPlatforms.length > 0 || selectedStatuses.length > 0;

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onPlatformChange(selectedPlatforms.filter((id) => id !== platformId));
    } else {
      onPlatformChange([...selectedPlatforms, platformId]);
    }
  };

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  // Normalize platform type to lowercase
  const getPlatformType = (platform: Platform): string => {
    const type = platform.platform || platform.type || "";
    return type.toLowerCase();
  };

  // Get display name for platform
  const getPlatformDisplayName = (platform: Platform): string => {
    const type = getPlatformType(platform);
    const accountName = platform.accountName || platform.name;
    
    // If there's an account name, show "Platform - Account"
    if (accountName) {
      return `${PLATFORM_LABELS[type] || type} - ${accountName}`;
    }
    
    return PLATFORM_LABELS[type] || platform.name || type;
  };

  // Get short name for tags
  const getPlatformShortName = (platform: Platform): string => {
    const type = getPlatformType(platform);
    return PLATFORM_LABELS[type] || type;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <Filter className="h-4 w-4" />
        <span>Filters:</span>
      </div>

      {/* Platform Filter */}
      <div className="relative">
        <button
          onClick={() => {
            setShowPlatformDropdown(!showPlatformDropdown);
            setShowStatusDropdown(false);
          }}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
            selectedPlatforms.length > 0
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
        >
          <span>
            Platform
            {selectedPlatforms.length > 0 && ` (${selectedPlatforms.length})`}
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {showPlatformDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPlatformDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 z-20 w-64 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 max-h-64 overflow-y-auto">
              {platforms.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No platforms connected
                </div>
              ) : (
                platforms.map((platform) => {
                  const type = getPlatformType(platform);
                  const Icon = PLATFORM_ICONS[type] || Globe;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const colorClass = PLATFORM_COLORS[type] || "text-gray-500";

                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0", colorClass)} />
                      <span className="flex-1 text-left text-gray-700 dark:text-gray-300 truncate">
                        {getPlatformDisplayName(platform)}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Status Filter */}
      <div className="relative">
        <button
          onClick={() => {
            setShowStatusDropdown(!showStatusDropdown);
            setShowPlatformDropdown(false);
          }}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
            selectedStatuses.length > 0
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
        >
          <span>
            Status
            {selectedStatuses.length > 0 && ` (${selectedStatuses.length})`}
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {showStatusDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowStatusDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 z-20 w-40 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
              {STATUS_OPTIONS.map((status) => {
                const isSelected = selectedStatuses.includes(status.value);

                return (
                  <button
                    key={status.value}
                    onClick={() => toggleStatus(status.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full", status.color)} />
                    <span className="flex-1 text-left text-gray-700 dark:text-gray-300">
                      {status.label}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1 ml-2 flex-wrap">
          {selectedPlatforms.map((platformId) => {
            const platform = platforms.find((p) => p.id === platformId);
            if (!platform) return null;
            const type = getPlatformType(platform);
            const Icon = PLATFORM_ICONS[type] || Globe;
            const colorClass = PLATFORM_COLORS[type] || "text-gray-500";

            return (
              <span
                key={platformId}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
              >
                <Icon className={cn("h-3 w-3", colorClass)} />
                <span className="text-gray-700 dark:text-gray-300">
                  {getPlatformShortName(platform)}
                </span>
                <button
                  onClick={() => togglePlatform(platformId)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {selectedStatuses.map((status) => {
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === status);
            if (!statusInfo) return null;

            return (
              <span
                key={status}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
              >
                <div className={cn("w-2 h-2 rounded-full", statusInfo.color)} />
                <span className="text-gray-700 dark:text-gray-300">{statusInfo.label}</span>
                <button
                  onClick={() => toggleStatus(status)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}