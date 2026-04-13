// apps/web/src/components/intelligence/ReanalyzeModal.tsx
'use client';

import { useState } from 'react';
import {
  X,
  Globe,
  Linkedin,
  FileText,
  MessageSquare,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';

interface DataSources {
  websiteUrl?: string;
  linkedinUrl?: string;
  pdfUrl?: string;
  manualDescription?: string;
}

interface ChangeItem {
  type: 'added' | 'removed' | 'updated';
  item: unknown;
  previous?: unknown;
}

interface Changes {
  industries: ChangeItem[];
  services: ChangeItem[];
  usps: ChangeItem[];
  saContext: ChangeItem[];
}

interface ReanalyzeResult {
  success: boolean;
  hasChanges: boolean;
  changes: Changes;
  changeSummary: string;
  newAnalysis: unknown;
  previousAnalysis: unknown;
  analysisVersion: number;
  confirmationsReset: boolean;
  message: string;
}

interface ReanalyzeModalProps {
  companyId: string;
  companyName: string;
  currentSources: DataSources | null;
  onClose: () => void;
  onReanalyzeComplete: () => void;
}

type AnalysisStep = 'configure' | 'analyzing' | 'results';

export default function ReanalyzeModal({
  companyId,
  companyName,
  currentSources,
  onClose,
  onReanalyzeComplete,
}: ReanalyzeModalProps) {
  const [step, setStep] = useState<AnalysisStep>('configure');
  const [mergeWithExisting, setMergeWithExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReanalyzeResult | null>(null);

  // Form state for new/updated sources
  const [websiteUrl, setWebsiteUrl] = useState(currentSources?.websiteUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(currentSources?.linkedinUrl || '');
  const [pdfUrl, setPdfUrl] = useState(currentSources?.pdfUrl || '');
  const [manualDescription, setManualDescription] = useState(currentSources?.manualDescription || '');

  // Expansion state for sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    industries: true,
    services: true,
    usps: false,
    saContext: false,
  });

  const hasAnySource = websiteUrl || linkedinUrl || pdfUrl || manualDescription;

  const handleReanalyze = async () => {
    if (!hasAnySource) {
      setError('Please provide at least one data source');
      return;
    }

    setStep('analyzing');
    setError(null);

    try {
      const newSources: DataSources = {};
      if (websiteUrl) newSources.websiteUrl = websiteUrl;
      if (linkedinUrl) newSources.linkedinUrl = linkedinUrl;
      if (pdfUrl) newSources.pdfUrl = pdfUrl;
      if (manualDescription) newSources.manualDescription = manualDescription;

      const response = await fetch('/api/intelligence/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          newSources,
          mergeWithExisting,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Re-analysis failed');
      }

      setResult(data);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('configure');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus size={14} className="text-green-500" />;
      case 'removed':
        return <Minus size={14} className="text-red-500" />;
      case 'updated':
        return <ArrowRight size={14} className="text-amber-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400';
      case 'removed':
        return 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400';
      case 'updated':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400';
      default:
        return '';
    }
  };

  const renderChangeItem = (change: ChangeItem, index: number) => {
    const item = change.item as Record<string, unknown>;
    const displayName = item.name || item.point || item.code || JSON.stringify(item);
    
    return (
      <div
        key={index}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getChangeColor(change.type)}`}
      >
        {getChangeIcon(change.type)}
        <span className="text-sm font-medium">{String(displayName)}</span>
        {change.type === 'updated' && change.previous && (
          <span className="text-xs opacity-60">
            (was: {String((change.previous as Record<string, unknown>).name || change.previous)})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Re-analyze Company
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Configure Step */}
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {/* Data Sources */}
              <div className="space-y-4">
                <h3 className="font-medium text-[var(--text-primary)]">Data Sources</h3>
                
                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    LinkedIn Company URL
                  </label>
                  <div className="relative">
                    <Linkedin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/company/..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* PDF URL */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    PDF Document URL (Company Profile, Brochure)
                  </label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="url"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://example.com/company-profile.pdf"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* Manual Description */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Manual Description
                  </label>
                  <div className="relative">
                    <MessageSquare size={18} className="absolute left-3 top-3 text-[var(--text-tertiary)]" />
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Additional information about the company, services, unique selling points..."
                      rows={4}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Merge Option */}
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mergeWithExisting}
                    onChange={(e) => setMergeWithExisting(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-[var(--border-default)] text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      Merge with existing data
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Keep existing sources and add new ones. Uncheck to replace all sources.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Analyzing Step */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center">
                  <RefreshCw size={32} className="text-brand-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Analyzing Company Data
              </h3>
              <p className="text-[var(--text-secondary)] text-center max-w-md">
                Our AI is extracting and analyzing information from your data sources.
                This may take 30-60 seconds...
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </div>
            </div>
          )}

          {/* Results Step */}
          {step === 'results' && result && (
            <div className="space-y-6">
              {/* Summary */}
              <div className={`flex items-start gap-4 p-4 rounded-xl ${
                result.hasChanges 
                  ? 'bg-amber-500/10 border border-amber-500/20' 
                  : 'bg-green-500/10 border border-green-500/20'
              }`}>
                {result.hasChanges ? (
                  <AlertCircle size={24} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    result.hasChanges 
                      ? 'text-amber-700 dark:text-amber-300' 
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    {result.message}
                  </p>
                  <p className="text-sm mt-1 opacity-80">
                    {result.changeSummary}
                  </p>
                  <p className="text-xs mt-2 opacity-60">
                    Analysis Version: {result.analysisVersion}
                  </p>
                </div>
              </div>

              {/* Changes Detail */}
              {result.hasChanges && (
                <div className="space-y-4">
                  {/* Industries */}
                  {result.changes.industries.length > 0 && (
                    <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
                      <button
                        onClick={() => toggleSection('industries')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <span className="font-medium text-[var(--text-primary)]">
                          Industries ({result.changes.industries.length} changes)
                        </span>
                        {expandedSections.industries ? (
                          <ChevronUp size={18} className="text-[var(--text-secondary)]" />
                        ) : (
                          <ChevronDown size={18} className="text-[var(--text-secondary)]" />
                        )}
                      </button>
                      {expandedSections.industries && (
                        <div className="p-4 space-y-2">
                          {result.changes.industries.map((change, i) => renderChangeItem(change, i))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services */}
                  {result.changes.services.length > 0 && (
                    <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
                      <button
                        onClick={() => toggleSection('services')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <span className="font-medium text-[var(--text-primary)]">
                          Services ({result.changes.services.length} changes)
                        </span>
                        {expandedSections.services ? (
                          <ChevronUp size={18} className="text-[var(--text-secondary)]" />
                        ) : (
                          <ChevronDown size={18} className="text-[var(--text-secondary)]" />
                        )}
                      </button>
                      {expandedSections.services && (
                        <div className="p-4 space-y-2">
                          {result.changes.services.map((change, i) => renderChangeItem(change, i))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* USPs */}
                  {result.changes.usps.length > 0 && (
                    <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
                      <button
                        onClick={() => toggleSection('usps')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <span className="font-medium text-[var(--text-primary)]">
                          Unique Selling Points ({result.changes.usps.length} changes)
                        </span>
                        {expandedSections.usps ? (
                          <ChevronUp size={18} className="text-[var(--text-secondary)]" />
                        ) : (
                          <ChevronDown size={18} className="text-[var(--text-secondary)]" />
                        )}
                      </button>
                      {expandedSections.usps && (
                        <div className="p-4 space-y-2">
                          {result.changes.usps.map((change, i) => renderChangeItem(change, i))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SA Context */}
                  {result.changes.saContext.length > 0 && (
                    <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
                      <button
                        onClick={() => toggleSection('saContext')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <span className="font-medium text-[var(--text-primary)]">
                          SA Context ({result.changes.saContext.length} changes)
                        </span>
                        {expandedSections.saContext ? (
                          <ChevronUp size={18} className="text-[var(--text-secondary)]" />
                        ) : (
                          <ChevronDown size={18} className="text-[var(--text-secondary)]" />
                        )}
                      </button>
                      {expandedSections.saContext && (
                        <div className="p-4 space-y-2">
                          {result.changes.saContext.map((change, i) => renderChangeItem(change, i))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirmation Reset Notice */}
                  {result.confirmationsReset && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> Your previous confirmations have been reset due to changes.
                        You may want to review the updated analysis in the onboarding flow.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          {step === 'configure' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReanalyze}
                disabled={!hasAnySource}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} />
                Start Re-analysis
              </button>
            </>
          )}

          {step === 'analyzing' && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 'results' && (
            <>
              <button
                onClick={() => setStep('configure')}
                className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Analyze Again
              </button>
              <button
                onClick={() => {
                  onReanalyzeComplete();
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
              >
                <CheckCircle size={18} />
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}