'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, Check, RefreshCw, Save, Edit3, X,
  Linkedin, Twitter, Facebook, Instagram, Globe,
  Hash, Type,
} from 'lucide-react';

interface ContentPreviewProps {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: string;
  companyName: string;
  onRegenerate: (feedback: string) => void;
  onSave: (content: string) => void;
  onEdit: (content: string) => void;
  isRegenerating?: boolean;
  isSaving?: boolean;
}

const platformIcons: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  wordpress: Globe,
};

const platformLimits: Record<string, { max: number; warning: number }> = {
  linkedin: { max: 3000, warning: 2500 },
  twitter: { max: 280, warning: 260 },
  facebook: { max: 2000, warning: 1500 },
  instagram: { max: 2200, warning: 2000 },
};

export function ContentPreview({
  content,
  hashtags,
  characterCount,
  platform,
  companyName,
  onRegenerate,
  onSave,
  onEdit,
  isRegenerating,
  isSaving,
}: ContentPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const Icon = platformIcons[platform] || Globe;
  const limits = platformLimits[platform] || { max: 2000, warning: 1500 };
  const isOverLimit = characterCount > limits.max;
  const isNearLimit = characterCount > limits.warning;

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveEdit() {
    onEdit(editedContent);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setEditedContent(content);
    setIsEditing(false);
  }

  function handleRegenerate() {
    if (feedback.trim()) {
      onRegenerate(feedback);
      setFeedback('');
      setShowFeedback(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/20">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{platform} Post</span>
          <span className="text-xs text-muted-foreground">• {companyName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${
            isOverLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600' : 'text-muted-foreground'
          }`}>
            {characterCount}/{limits.max}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Check size={14} />
                Apply Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
          </div>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && !isEditing && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/40">
            <Hash size={14} className="text-muted-foreground" />
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Section */}
      {showFeedback && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              What would you like to change?
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Make it shorter, add a call-to-action, be more casual..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={!feedback.trim() || isRegenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-secondary/10">
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Edit3 size={14} />
              Edit
            </button>
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
              Refine
            </button>
          </div>
          <button
            onClick={() => onSave(content)}
            disabled={isSaving || isOverLimit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      )}
    </motion.div>
  );
}