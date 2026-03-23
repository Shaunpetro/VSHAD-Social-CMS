'use client';

import { motion } from 'framer-motion';
import {
  Building2, Globe, Plug, FileText,
  MoreVertical, Pencil, Trash2, ExternalLink,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// Types matching current Prisma schema
// ═══════════════════════════════════════════════════════════════

interface Platform {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
}

interface Company {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  platforms?: Platform[];
  _count?: {
    platforms?: number;
    generatedPosts?: number;
    topics?: number;
    connections?: number;
    posts?: number;
  };
  createdAt: string;
}

interface CompanyCardProps {
  company: Company;
  index: number;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export function CompanyCard({ company, index, onEdit, onDelete }: CompanyCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Safely access platforms with defaults
  const platforms = company.platforms ?? [];
  const connectedPlatforms = platforms.filter(p => p.isConnected);
  const platformCount = company._count?.platforms ?? platforms.length;
  const postCount = company._count?.generatedPosts ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative rounded-xl border border-border/60 bg-card p-5 hover:border-border hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <Building2 size={20} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">{company.name}</h3>
            {company.industry && (
              <p className="text-xs text-muted-foreground mt-0.5">{company.industry}</p>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg border border-border/60 bg-popover p-1 shadow-lg z-10">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(company);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Pencil size={14} />
                Edit Company
              </button>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <ExternalLink size={14} />
                  Visit Website
                </a>
              )}
              <div className="my-1 h-px bg-border/60" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(company);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={14} />
                Delete Company
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {company.description}
        </p>
      )}

      {/* Website */}
      {company.website && (
        <div className="flex items-center gap-1.5 mb-3">
          <Globe size={12} className="text-muted-foreground" />
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground truncate transition-colors"
          >
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}

      {/* Connected Platforms Badges */}
      {connectedPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {connectedPlatforms.map((platform) => (
            <span
              key={platform.id}
              className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
            >
              {platform.type}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <Plug size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {connectedPlatforms.length}/{platformCount} platform{platformCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {postCount} post{postCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
