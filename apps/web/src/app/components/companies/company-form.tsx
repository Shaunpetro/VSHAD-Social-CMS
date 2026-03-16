'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, Globe, Building2, FileText, MessageSquare,
  Tag, Sparkles, CheckCircle2, AlertCircle,
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string | null;
  description: string | null;
  logo: string | null;
  brandVoice: string;
  keywords: string[];
}

interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editCompany?: Company | null;
}

const brandVoiceOptions = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-oriented' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'technical', label: 'Technical', description: 'Detailed and precise' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert and commanding' },
];

export function CompanyForm({ open, onClose, onSuccess, editCompany }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [error, setError] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const [form, setForm] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
    logo: '',
    brandVoice: 'professional',
    keywords: [] as string[],
  });

  // Populate form when editing
  useEffect(() => {
    if (editCompany) {
      setForm({
        name: editCompany.name,
        website: editCompany.website,
        industry: editCompany.industry || '',
        description: editCompany.description || '',
        logo: editCompany.logo || '',
        brandVoice: editCompany.brandVoice,
        keywords: editCompany.keywords,
      });
    } else {
      setForm({
        name: '',
        website: '',
        industry: '',
        description: '',
        logo: '',
        brandVoice: 'professional',
        keywords: [],
      });
    }
    setError('');
    setKeywordInput('');
    setScrapeStatus('idle');
    setScrapeMessage('');
  }, [editCompany, open]);

  async function handleScrape() {
    if (!form.website.trim()) {
      setError('Enter a website URL first');
      return;
    }

    setScraping(true);
    setScrapeStatus('idle');
    setScrapeMessage('');
    setError('');

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.website }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Scrape failed');
      }

      const scraped = data.data;
      let fieldsUpdated = 0;

      // Only fill in empty fields — don't overwrite what user already typed
      setForm((prev) => {
        const updated = { ...prev };

        if (!prev.name && scraped.name) {
          updated.name = scraped.name;
          fieldsUpdated++;
        }
        if (!prev.description && scraped.description) {
          updated.description = scraped.description;
          fieldsUpdated++;
        }
        if (!prev.industry && scraped.industry) {
          updated.industry = scraped.industry;
          fieldsUpdated++;
        }
        if (!prev.logo && scraped.logo) {
          updated.logo = scraped.logo;
          fieldsUpdated++;
        }
        if (prev.keywords.length === 0 && scraped.keywords.length > 0) {
          updated.keywords = scraped.keywords;
          fieldsUpdated++;
        }

        return updated;
      });

      const sourceLabel = data.source === 'firecrawl' ? 'Firecrawl AI' : 'domain analysis';
      setScrapeStatus('success');
      setScrapeMessage(
        fieldsUpdated > 0
          ? `Auto-filled ${fieldsUpdated} field${fieldsUpdated !== 1 ? 's' : ''} from ${sourceLabel}`
          : 'Scraped successfully but all fields already filled'
      );
    } catch (err) {
      setScrapeStatus('error');
      setScrapeMessage(err instanceof Error ? err.message : 'Failed to scrape website');
    } finally {
      setScraping(false);
    }
  }

  function addKeyword() {
    const keyword = keywordInput.trim();
    if (keyword && !form.keywords.includes(keyword)) {
      setForm({ ...form, keywords: [...form.keywords, keyword] });
      setKeywordInput('');
    }
  }

  function removeKeyword(keyword: string) {
    setForm({ ...form, keywords: form.keywords.filter((k) => k !== keyword) });
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = editCompany
        ? `/api/companies/${editCompany.id}`
        : '/api/companies';

      const method = editCompany ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          website: form.website,
          industry: form.industry || null,
          description: form.description || null,
          logo: form.logo || null,
          brandVoice: form.brandVoice,
          keywords: form.keywords,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border/60 bg-background p-6 shadow-xl mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {editCompany ? 'Edit Company' : 'Add Company'}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {editCompany
                    ? 'Update your company details'
                    : 'Enter a website URL and auto-fill with Firecrawl AI'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Website + Scrape */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <Globe size={14} />
                  Website URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => {
                      setForm({ ...form, website: e.target.value });
                      setScrapeStatus('idle');
                    }}
                    placeholder="https://example.com"
                    required
                    className="flex-1 px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleScrape}
                    disabled={scraping || !form.website.trim()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {scraping ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {scraping ? 'Scraping...' : 'Auto-Fill'}
                  </button>
                </div>

                {/* Scrape Status */}
                {scrapeStatus !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={
                      'flex items-center gap-2 mt-2 text-xs ' +
                      (scrapeStatus === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-destructive')
                    }
                  >
                    {scrapeStatus === 'success' ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}
                    {scrapeMessage}
                  </motion.div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <Building2 size={14} />
                  Company Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <Building2 size={14} />
                  Industry
                </label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="e.g. Technology, Healthcare, Finance"
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <FileText size={14} />
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of what the company does..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors resize-none"
                />
              </div>

              {/* Brand Voice */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <MessageSquare size={14} />
                  Brand Voice
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {brandVoiceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm({ ...form, brandVoice: option.value })}
                      className={
                        'flex flex-col items-start p-2.5 rounded-lg border text-left transition-all duration-200 ' +
                        (form.brandVoice === option.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border/60 hover:border-border hover:bg-secondary/30')
                      }
                    >
                      <span className="text-xs font-medium">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <Tag size={14} />
                  Keywords
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Type a keyword and press Enter"
                    className="flex-1 px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-3 py-2 rounded-lg border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {form.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs text-foreground"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {editCompany ? 'Save Changes' : 'Add Company'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}