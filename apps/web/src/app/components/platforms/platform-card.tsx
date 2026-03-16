'use client';

import { motion } from 'framer-motion';
import {
  Linkedin, Twitter, Facebook, Instagram, Globe,
  MoreVertical, RefreshCw, Trash2,
  CheckCircle2, XCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { PLATFORMS } from '@/lib/platforms';
import type { PlatformConnection } from '@/lib/platforms';

interface PlatformCardProps {
  connection: PlatformConnection;
  index: number;
  onReconnect: (connection: PlatformConnection) => void;
  onDisconnect: (connection: PlatformConnection) => void;
  onDelete: (connection: PlatformConnection) => void;
}

const platformIcons: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  wordpress: Globe,
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
  connected: {
    icon: CheckCircle2,
    label: 'Connected',
    className: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20',
  },
  disconnected: {
    icon: XCircle,
    label: 'Disconnected',
    className: 'text-muted-foreground bg-secondary border-border/60',
  },
  expired: {
    icon: AlertTriangle,
    label: 'Expired',
    className: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    className: 'text-destructive bg-destructive/10 border-destructive/20',
  },
};

export function PlatformCard({ connection, index, onReconnect, onDisconnect, onDelete }: PlatformCardProps) {
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

  const platformConfig = PLATFORMS[connection.platform];
  const Icon = platformIcons[connection.platform] || Globe;
  const status = statusConfig[connection.status] || statusConfig.disconnected;
  const StatusIcon = status.icon;

  const scopes = connection.scopes || [];
  const expiresAt = connection.expiresAt ? new Date(connection.expiresAt) : null;
  const isExpiringSoon = expiresAt
    ? expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  function formatExpiryDate(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 30) return `Expires in ${diffDays} days`;
    return `Expires ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative rounded-xl border border-border/60 bg-card p-5 hover:border-border hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={
            'flex h-10 w-10 items-center justify-center rounded-lg ' +
            (platformConfig?.bgColor || 'bg-secondary')
          }>
            <Icon
              size={20}
              className={platformConfig?.color || 'text-muted-foreground'}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">
              {platformConfig?.name || connection.platform}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {connection.accountName}
            </p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border/60 bg-popover p-1 shadow-lg z-10">
              {connection.status !== 'connected' && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReconnect(connection);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <RefreshCw size={14} />
                  Reconnect
                </button>
              )}
              {connection.status === 'connected' && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDisconnect(connection);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <XCircle size={14} />
                  Disconnect
                </button>
              )}
              <div className="my-1 h-px bg-border/60" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(connection);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={14} />
                Remove Connection
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ' + status.className}>
          <StatusIcon size={12} />
          {status.label}
        </span>

        {connection.status === 'connected' && isExpiringSoon && expiresAt && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border border-yellow-500/20">
            <Clock size={10} />
            Renew soon
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {platformConfig?.description || 'Connected platform'}
      </p>

      {scopes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {scopes.slice(0, 3).map((scope) => (
            <span
              key={scope}
              className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground"
            >
              {scope}
            </span>
          ))}
          {scopes.length > 3 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">
              +{scopes.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {connection.company?.name || 'Unknown Company'}
          </span>
        </div>
        {expiresAt && connection.status === 'connected' && (
          <span className="text-[10px] text-muted-foreground">
            {formatExpiryDate(expiresAt)}
          </span>
        )}
      </div>
    </motion.div>
  );
}