// apps/web/src/components/intelligence/CurrentAnalysisCard.tsx
'use client';

import { useState } from 'react';
import {
  Brain,
  RefreshCw,
  Globe,
  Linkedin,
  FileText,
  MessageSquare,
  Building2,
  Briefcase,
  Star,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import ReanalyzeModal from './ReanalyzeModal';

interface DataSources {
  websiteUrl?: string;
  linkedinUrl?: string;
  pdfUrl?: string;
  manualDescription?: string;
}

interface Intelligence {
  id: string;
  dataSources: DataSources | null;
  lastAnalyzedAt: string | null;
  analysisVersion: number;
  aiConfidenceScore: number | null;
  extractedIndustries: Array<{ name: string; code: string; confidence: number }> | null;
  extractedServices: Array<{ name: string; category: string }> | null;
  extractedUSPs: Array<{ point: string }> | null;
  extractedAudience: { segments: Array<{ name: string }> } | null;
  primaryBusinessGoal: string | null;
  industriesConfirmed: boolean;
  servicesConfirmed: boolean;
  uspsConfirmed: boolean;
  audienceConfirmed: boolean;
  voiceConfirmed: boolean;
}

interface CurrentAnalysisCardProps {
  companyId: string;
  companyName: string;
  intelligence: Intelligence | null;
  onRefresh: () => void;
}

export default function CurrentAnalysisCard({
  companyId,
  companyName,
  intelligence,
  onRefresh,
}: CurrentAnalysisCardProps) {
  const [showReanalyzeModal, setShowReanalyzeModal] = useState(false);

  const dataSources = intelligence?.dataSources as DataSources | null;
  const hasDataSources = dataSources && (
    dataSources.websiteUrl || 
    dataSources.linkedinUrl || 
    dataSources.pdfUrl || 
    dataSources.manualDescription
  );

  const industries = intelligence?.extractedIndustries as Array<{ name: string; code: string; confidence: number }> | null;
  const services = intelligence?.extractedServices as Array<{ name: string; category: string }> | null;
  const usps = intelligence?.extractedUSPs as Array<{ point: string }> | null;
  const audience = intelligence?.extractedAudience as { segments: Array<{ name: string }> } | null;

  const allConfirmed = intelligence && (
    intelligence.industriesConfirmed &&
    intelligence.servicesConfirmed &&
    intelligence.uspsConfirmed &&
    intelligence.audienceConfirmed &&
    intelligence.voiceConfirmed
  );

  const confidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const goalLabels: Record<string, string> = {
    leads: 'Lead Generation',
    awareness: 'Brand Awareness',
    recruitment: 'Recruitment',
    engagement: 'Community Engagement',
  };

  return (
    <>
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Brain size={18} className="text-brand-600" />
            AI Intelligence
          </h2>
          <button
            onClick={() => setShowReanalyzeModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-500/10 transition-colors"
          >
            <RefreshCw size={16} />
            Re-analyze
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Analysis Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              {allConfirmed ? (
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {allConfirmed ? 'Analysis Confirmed' : 'Analysis Needs Review'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Version {intelligence?.analysisVersion || 1} • Last analyzed {formatDate(intelligence?.lastAnalyzedAt || null)}
                </p>
              </div>
            </div>
            {intelligence?.aiConfidenceScore && (
              <div className="text-right">
                <p className={`text-lg font-bold ${confidenceColor(intelligence.aiConfidenceScore)}`}>
                  {Math.round(intelligence.aiConfidenceScore * 100)}%
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">Confidence</p>
              </div>
            )}
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Data Sources</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                dataSources?.websiteUrl 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)]'
              }`}>
                <Globe size={16} className={dataSources?.websiteUrl ? 'text-green-600' : 'text-[var(--text-tertiary)]'} />
                <span className={`text-sm ${dataSources?.websiteUrl ? 'text-green-700 dark:text-green-400' : 'text-[var(--text-tertiary)]'}`}>
                  {dataSources?.websiteUrl ? 'Website' : 'No Website'}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                dataSources?.linkedinUrl 
                  ? 'bg-blue-500/5 border-blue-500/20' 
                  : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)]'
              }`}>
                <Linkedin size={16} className={dataSources?.linkedinUrl ? 'text-blue-600' : 'text-[var(--text-tertiary)]'} />
                <span className={`text-sm ${dataSources?.linkedinUrl ? 'text-blue-700 dark:text-blue-400' : 'text-[var(--text-tertiary)]'}`}>
                  {dataSources?.linkedinUrl ? 'LinkedIn' : 'No LinkedIn'}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                dataSources?.pdfUrl 
                  ? 'bg-purple-500/5 border-purple-500/20' 
                  : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)]'
              }`}>
                <FileText size={16} className={dataSources?.pdfUrl ? 'text-purple-600' : 'text-[var(--text-tertiary)]'} />
                <span className={`text-sm ${dataSources?.pdfUrl ? 'text-purple-700 dark:text-purple-400' : 'text-[var(--text-tertiary)]'}`}>
                  {dataSources?.pdfUrl ? 'PDF Document' : 'No PDF'}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                dataSources?.manualDescription 
                  ? 'bg-amber-500/5 border-amber-500/20' 
                  : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)]'
              }`}>
                <MessageSquare size={16} className={dataSources?.manualDescription ? 'text-amber-600' : 'text-[var(--text-tertiary)]'} />
                <span className={`text-sm ${dataSources?.manualDescription ? 'text-amber-700 dark:text-amber-400' : 'text-[var(--text-tertiary)]'}`}>
                  {dataSources?.manualDescription ? 'Manual Input' : 'No Manual'}
                </span>
              </div>
            </div>
          </div>

          {/* Extracted Data Summary */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Industries */}
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={16} className="text-[var(--text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Industries</span>
                {intelligence?.industriesConfirmed && (
                  <CheckCircle size={14} className="text-green-500 ml-auto" />
                )}
              </div>
              {industries && industries.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {industries.slice(0, 3).map((ind, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-brand-500/10 text-brand-600">
                      {ind.name}
                    </span>
                  ))}
                  {industries.length > 3 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                      +{industries.length - 3} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Not detected</p>
              )}
            </div>

            {/* Services */}
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={16} className="text-[var(--text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Services</span>
                {intelligence?.servicesConfirmed && (
                  <CheckCircle size={14} className="text-green-500 ml-auto" />
                )}
              </div>
              {services && services.length > 0 ? (
                <p className="text-sm text-[var(--text-primary)]">
                  {services.length} service{services.length !== 1 ? 's' : ''} detected
                </p>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Not detected</p>
              )}
            </div>

            {/* USPs */}
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-[var(--text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Selling Points</span>
                {intelligence?.uspsConfirmed && (
                  <CheckCircle size={14} className="text-green-500 ml-auto" />
                )}
              </div>
              {usps && usps.length > 0 ? (
                <p className="text-sm text-[var(--text-primary)]">
                  {usps.length} USP{usps.length !== 1 ? 's' : ''} identified
                </p>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Not detected</p>
              )}
            </div>

            {/* Audience */}
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-[var(--text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Target Audience</span>
                {intelligence?.audienceConfirmed && (
                  <CheckCircle size={14} className="text-green-500 ml-auto" />
                )}
              </div>
              {audience?.segments && audience.segments.length > 0 ? (
                <p className="text-sm text-[var(--text-primary)]">
                  {audience.segments.length} segment{audience.segments.length !== 1 ? 's' : ''} identified
                </p>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Not detected</p>
              )}
            </div>
          </div>

          {/* Business Goal */}
          {intelligence?.primaryBusinessGoal && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
              <Target size={20} className="text-brand-600" />
              <div>
                <p className="text-xs text-brand-600 font-medium">Primary Business Goal</p>
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  {goalLabels[intelligence.primaryBusinessGoal] || intelligence.primaryBusinessGoal}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reanalyze Modal */}
      {showReanalyzeModal && (
        <ReanalyzeModal
          companyId={companyId}
          companyName={companyName}
          currentSources={dataSources}
          onClose={() => setShowReanalyzeModal(false)}
          onReanalyzeComplete={onRefresh}
        />
      )}
    </>
  );
}