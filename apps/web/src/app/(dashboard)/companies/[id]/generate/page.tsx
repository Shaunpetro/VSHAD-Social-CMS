// apps/web/src/app/(dashboard)/companies/[id]/generate/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Globe,
  Wand2,
  RefreshCw,
  Copy,
  Check,
  Save,
  Hash,
  Smile,
  FileText,
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
}

interface Platform {
  id: string;
  type?: string;
  platform?: string;
  name: string;
  username?: string;
  accountName?: string;
  companyId: string;
  status?: string;
  isConnected?: boolean;
}

interface GeneratedContent {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: string;
}

const platformIcons: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  wordpress: Globe,
};

const platformColors: Record<string, { bg: string; text: string; border: string }> = {
  linkedin: {
    bg: 'bg-[#0A66C2]/10',
    text: 'text-[#0A66C2]',
    border: 'border-[#0A66C2]/20',
  },
  facebook: {
    bg: 'bg-[#1877F2]/10',
    text: 'text-[#1877F2]',
    border: 'border-[#1877F2]/20',
  },
  twitter: {
    bg: 'bg-[#1DA1F2]/10',
    text: 'text-[#1DA1F2]',
    border: 'border-[#1DA1F2]/20',
  },
  instagram: {
    bg: 'bg-[#E4405F]/10',
    text: 'text-[#E4405F]',
    border: 'border-[#E4405F]/20',
  },
  wordpress: {
    bg: 'bg-[#21759B]/10',
    text: 'text-[#21759B]',
    border: 'border-[#21759B]/20',
  },
};

const toneOptions = [
  { value: 'professional', label: 'Professional', emoji: '👔' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'enthusiastic', label: 'Enthusiastic', emoji: '🎉' },
  { value: 'informative', label: 'Informative', emoji: '📚' },
  { value: 'humorous', label: 'Humorous', emoji: '😄' },
  { value: 'inspiring', label: 'Inspiring', emoji: '✨' },
];

const characterLimits: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  wordpress: 0,
};

export default function CompanyGeneratePage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchData = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [companyRes, platformsRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/platforms?companyId=${companyId}`),
      ]);

      if (!companyRes.ok) {
        throw new Error('Failed to fetch company');
      }

      const companyData = await companyRes.json();
      setCompany(companyData);

      if (platformsRes.ok) {
        const platformsData = await platformsRes.json();
        const connectedPlatforms = platformsData.filter(
          (p: Platform) => p.status === 'connected' || p.isConnected === true
        );
        setPlatforms(connectedPlatforms);

        if (connectedPlatforms.length === 1) {
          setSelectedPlatform(connectedPlatforms[0]);
        }
      }
    } catch (err) {
      setError('Failed to load data. Please refresh the page.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  function getPlatformType(platform: Platform): string {
    return (platform.type || platform.platform || 'unknown').toLowerCase();
  }

  function getPlatformName(platform: Platform): string {
    return platform.username || platform.accountName || platform.name || 'Unknown';
  }

  async function handleGenerate() {
    if (!company || !selectedPlatform || !topic.trim()) {
      setError('Please select a platform and enter a topic');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMessage(null);
      setGeneratedContent(null);

      const platformType = getPlatformType(selectedPlatform);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          platformId: selectedPlatform.id,
          platform: platformType,
          topic: topic.trim(),
          tone,
          includeHashtags,
          includeEmojis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Generation failed');
      }

      setGeneratedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (!company || !selectedPlatform || !generatedContent) return;

    try {
      setIsRegenerating(true);
      setError(null);

      const platformType = getPlatformType(selectedPlatform);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          platformId: selectedPlatform.id,
          platform: platformType,
          regenerate: true,
          originalContent: generatedContent.content,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Regeneration failed');
      }

      setGeneratedContent(data.content);
      setShowFeedback(false);
      setFeedback('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate content');
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleContentEdit(newContent: string) {
    if (generatedContent) {
      const hashtags = newContent.match(/#\w+/g) || [];
      setGeneratedContent({
        ...generatedContent,
        content: newContent,
        hashtags,
        characterCount: newContent.length,
      });
    }
  }

  async function handleSave() {
    if (!company || !selectedPlatform || !generatedContent) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch('/api/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          platformId: selectedPlatform.id,
          content: generatedContent.content,
          hashtags: generatedContent.hashtags || [],
          status: 'DRAFT',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setSuccessMessage('Content saved as draft! View it in the Queue.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopy() {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle size={48} className="text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Company Not Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The company you are looking for does not exist.
          </p>
          <Link href="/companies" className="mt-4 text-sm text-primary hover:underline">
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  const selectedPlatformType = selectedPlatform ? getPlatformType(selectedPlatform) : null;
  const charLimit = selectedPlatformType ? characterLimits[selectedPlatformType] || 0 : 0;

  return (
    <div className="p-6 space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-lg border bg-destructive/10 border-destructive/20 text-destructive"
          >
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-current opacity-60 hover:opacity-100"
            >
              x
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-lg border bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
          >
            <CheckCircle2 size={18} />
            <p className="text-sm font-medium">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-current opacity-60 hover:opacity-100"
            >
              x
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link
            href={`/companies/${companyId}`}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            {company.name}
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Generate Content
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create AI-powered social media posts for your connected platforms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Select Platform</h2>

            {platforms.length === 0 ? (
              <div className="text-center py-6">
                <Globe size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No connected platforms</p>
                <Link
                  href={`/companies/${companyId}/platforms`}
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Connect a platform
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {platforms.map((platform) => {
                  const type = getPlatformType(platform);
                  const Icon = platformIcons[type] || Globe;
                  const colors = platformColors[type] || platformColors.wordpress;
                  const isSelected = selectedPlatform?.id === platform.id;

                  return (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.border} border-2`
                          : 'border-border/60 hover:border-border hover:bg-secondary/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Icon size={20} className={colors.text} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium truncate max-w-full">
                          {getPlatformName(platform)}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">{type}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPlatform && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/60 bg-card p-5 space-y-4"
            >
              <h2 className="text-sm font-semibold">Content Settings</h2>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Topic / Subject *
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What would you like to post about? e.g., New product launch, industry insights, team achievement..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        tone === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 hover:border-border hover:bg-secondary/30'
                      }`}
                    >
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
                  />
                  <Hash size={14} className="text-muted-foreground" />
                  <span className="text-xs">Include Hashtags</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmojis}
                    onChange={(e) => setIncludeEmojis(e.target.checked)}
                    className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
                  />
                  <Smile size={14} className="text-muted-foreground" />
                  <span className="text-xs">Include Emojis</span>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Generate Content
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>

        <div>
          {generatedContent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/60 bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">Generated Content</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setShowFeedback(!showFeedback)}
                    disabled={isRegenerating}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                    Regenerate
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-secondary/20 border-b border-border/40">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        What would you like to change? (optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="e.g., Make it shorter, add more enthusiasm..."
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                        />
                        <button
                          onClick={handleRegenerate}
                          disabled={isRegenerating}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          {isRegenerating ? 'Working...' : 'Go'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4">
                <textarea
                  value={generatedContent.content}
                  onChange={(e) => handleContentEdit(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors resize-none"
                />

                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {generatedContent.hashtags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Hash size={12} />
                        {generatedContent.hashtags.length} hashtags
                      </span>
                    )}
                  </div>
                  <span
                    className={
                      charLimit > 0 && generatedContent.characterCount > charLimit
                        ? 'text-destructive'
                        : ''
                    }
                  >
                    {generatedContent.characterCount}
                    {charLimit > 0 && ` / ${charLimit}`} characters
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border/40 bg-secondary/10">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save as Draft
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-medium text-muted-foreground">No content generated yet</h3>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                {platforms.length === 0
                  ? 'Connect a platform first, then generate AI-powered content'
                  : 'Select a platform and enter a topic, then click Generate'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}