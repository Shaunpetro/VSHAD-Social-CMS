'use client';

import { Linkedin, Twitter, Facebook, Instagram, Globe } from 'lucide-react';

interface Platform {
  id: string;
  type?: string;
  platform?: string;
  name: string;
  username?: string;
  accountName?: string;
  companyId: string;
  company: {
    id: string;
    name: string;
  };
}

interface PlatformSelectorProps {
  platforms: Platform[];
  selectedPlatform: Platform | null;
  onSelect: (platform: Platform) => void;
}

const platformIcons: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  wordpress: Globe,
};

const platformColors: Record<string, { bg: string; text: string; border: string }> = {
  linkedin: {
    bg: 'bg-[#0A66C2]/10',
    text: 'text-[#0A66C2]',
    border: 'border-[#0A66C2]/30',
  },
  twitter: {
    bg: 'bg-[#1DA1F2]/10',
    text: 'text-[#1DA1F2]',
    border: 'border-[#1DA1F2]/30',
  },
  facebook: {
    bg: 'bg-[#1877F2]/10',
    text: 'text-[#1877F2]',
    border: 'border-[#1877F2]/30',
  },
  instagram: {
    bg: 'bg-[#E4405F]/10',
    text: 'text-[#E4405F]',
    border: 'border-[#E4405F]/30',
  },
  wordpress: {
    bg: 'bg-[#21759B]/10',
    text: 'text-[#21759B]',
    border: 'border-[#21759B]/30',
  },
};

export function PlatformSelector({ platforms, selectedPlatform, onSelect }: PlatformSelectorProps) {
  if (platforms.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-lg border border-dashed border-border/60 bg-secondary/20">
        <Globe className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          No connected platforms found.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Connect a platform first to generate content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Platform</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {platforms.map((platform) => {
          // Handle both 'type' and 'platform' field names
          const platformType = (platform.type || platform.platform || 'unknown').toLowerCase();
          const Icon = platformIcons[platformType] || Globe;
          const colors = platformColors[platformType] || platformColors.wordpress;
          const isSelected = selectedPlatform?.id === platform.id;
          const displayName = platform.username || platform.accountName || platform.company.name;

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => onSelect(platform)}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left
                ${isSelected 
                  ? `${colors.bg} ${colors.border} border-2` 
                  : 'border-border/60 hover:border-border hover:bg-secondary/30'
                }
              `}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}>
                <Icon size={18} className={colors.text} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? colors.text : ''}`}>
                  {platform.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayName}
                </p>
              </div>
              {isSelected && (
                <div className={`h-2 w-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}