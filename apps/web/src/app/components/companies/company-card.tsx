'use client';

import { motion } from 'framer-motion';
import {
  Building2,
  Globe,
  Pencil,
  Trash2,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Link2,
  FileText
} from 'lucide-react';
import type { Company, Platform } from '@/types/company';

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface CompanyCardProps {
  company: Company;
  index: number;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function getPlatformIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'linkedin':
      return <Linkedin size={14} />;
    case 'facebook':
      return <Facebook size={14} />;
    case 'twitter':
    case 'x':
      return <Twitter size={14} />;
    case 'instagram':
      return <Instagram size={14} />;
    default:
      return <Link2 size={14} />;
  }
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export function CompanyCard({ company, index, onEdit, onDelete }: CompanyCardProps) {
  const platforms: Platform[] = company.platforms || [];
  const connectedPlatforms = platforms.filter(p => p.isConnected);
  const platformCount = company._count?.platforms ?? platforms.length;
  const postCount = company._count?.generatedPosts ?? company._count?.posts ?? 0;

  // Support both logo and logoUrl field names
  const logoSrc = company.logo || company.logoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-5 hover:border-border hover:bg-card/80 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={company.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 size={20} className="text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{company.name}</h3>
          {company.industry && (
            <p className="text-xs text-muted-foreground truncate">{company.industry}</p>
          )}
        </div>
      </div>

      {/* Website */}
      {company.website && (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 truncate"
        >
          <Globe size={12} />
          <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
        </a>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
            {connectedPlatforms.slice(0, 3).map((platform) => (
              <div
                key={platform.id}
                className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center border-2 border-card"
                title={platform.name}
              >
                {getPlatformIcon(platform.type)}
              </div>
            ))}
          </div>
          <span>{platformCount} platform{platformCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText size={12} />
          <span>{postCount} post{postCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(company)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <Pencil size={12} />
          Edit
        </button>
        <button
          onClick={() => onDelete(company)}
          className="flex items-center justify-center p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}