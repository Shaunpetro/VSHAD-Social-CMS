// apps/web/src/app/components/platforms/platform-connect-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, Linkedin, Twitter, Facebook, Instagram, Globe,
  CheckCircle2, ChevronRight, Building2, ExternalLink,
} from 'lucide-react';
import { PLATFORM_LIST } from '@/lib/platforms';
import type { PlatformConfig } from '@/lib/platforms';

interface Company {
  id: string;
  name: string;
}

interface PlatformConnectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companies: Company[];
}

const platformIcons: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  wordpress: Globe,
};

type Step = 'select-company' | 'select-platform' | 'connect';

export function PlatformConnectModal({ open, onClose, onSuccess, companies }: PlatformConnectModalProps) {
  const [step, setStep] = useState<Step>('select-company');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectingAnimation, setConnectingAnimation] = useState(false);

  useEffect(() => {
    if (open) {
      if (companies.length === 1) {
        setSelectedCompany(companies[0]);
        setStep('select-platform');
      } else {
        setStep('select-company');
        setSelectedCompany(null);
      }
      setSelectedPlatform(null);
      setAccountName('');
      setError('');
      setLoading(false);
      setConnectingAnimation(false);
    }
  }, [open, companies]);

  function handleSelectCompany(company: Company) {
    setSelectedCompany(company);
    setStep('select-platform');
    setError('');
  }

  function handleSelectPlatform(platform: PlatformConfig) {
    if (platform.oauthSupported && selectedCompany) {
      window.location.href = `/api/auth/${platform.id}?companyId=${selectedCompany.id}`;
      return;
    }

    setSelectedPlatform(platform);
    setAccountName('');
    setStep('connect');
    setError('');
  }

  function handleBack() {
    if (step === 'connect') {
      setStep('select-platform');
      setSelectedPlatform(null);
      setAccountName('');
      setError('');
    } else if (step === 'select-platform' && companies.length > 1) {
      setStep('select-company');
      setSelectedCompany(null);
      setError('');
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany || !selectedPlatform || !accountName.trim()) return;

    setError('');
    setLoading(true);
    setConnectingAnimation(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const res = await fetch('/api/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.id,
          accountName: accountName.trim(),
          companyId: selectedCompany.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to connect platform');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setConnectingAnimation(false);
    } finally {
      setLoading(false);
    }
  }

  function getStepTitle(): string {
    switch (step) {
      case 'select-company':
        return 'Select Company';
      case 'select-platform':
        return 'Choose Platform';
      case 'connect':
        return `Connect ${selectedPlatform?.name || 'Platform'}`;
      default:
        return 'Connect Platform';
    }
  }

  function getStepDescription(): string {
    switch (step) {
      case 'select-company':
        return 'Which company do you want to connect a platform to?';
      case 'select-platform':
        return `Connecting to ${selectedCompany?.name || 'company'}`;
      case 'connect':
        return 'Enter your account details to complete the connection';
      default:
        return '';
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getStepTitle()}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {getStepDescription()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Step 1: Select Company */}
              {step === 'select-company' && (
                <div className="space-y-2">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      className="flex w-full items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                          <Building2 size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {company.name}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Select Platform */}
              {step === 'select-platform' && (
                <div className="space-y-2">
                  {PLATFORM_LIST.map((platform) => {
                    const Icon = platformIcons[platform.id] || Globe;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => handleSelectPlatform(platform)}
                        className="flex w-full items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${platform.bgColor}`}>
                            <Icon size={20} className={platform.color} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {platform.name}
                              </span>
                              {platform.oauthSupported ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                  <ExternalLink size={8} />
                                  OAuth
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                  Manual
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {platform.description}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      </button>
                    );
                  })}

                  {companies.length > 1 && (
                    <button
                      onClick={handleBack}
                      className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      ← Back to companies
                    </button>
                  )}
                </div>
              )}

              {/* Step 3: Connect */}
              {step === 'connect' && selectedPlatform && (
                <form onSubmit={handleConnect} className="space-y-5">
                  {connectingAnimation && !error ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center py-10"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${selectedPlatform.bgColor}`}
                      >
                        {(() => {
                          const ConnIcon = platformIcons[selectedPlatform.id] || Globe;
                          return <ConnIcon size={28} className={selectedPlatform.color} />;
                        })()}
                      </motion.div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 font-medium">
                        Connecting to {selectedPlatform.name}...
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Setting up manual connection
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      {/* Platform Info Card */}
                      <div className={`flex items-center gap-3 p-4 rounded-xl border ${selectedPlatform.borderColor} ${selectedPlatform.bgColor}`}>
                        {(() => {
                          const ConnIcon = platformIcons[selectedPlatform.id] || Globe;
                          return <ConnIcon size={22} className={selectedPlatform.color} />;
                        })()}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedPlatform.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedPlatform.description}
                          </p>
                        </div>
                      </div>

                      {/* Account Name Input */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Account / Page Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder={selectedPlatform.accountPlaceholder}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          OAuth is not yet available for {selectedPlatform.name}. Enter a display name for manual connection.
                        </p>
                      </div>

                      {/* Permissions */}
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                          Permissions requested:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlatform.defaultScopes.map((scope) => (
                            <span
                              key={scope}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300"
                            >
                              <CheckCircle2 size={12} className="text-green-500" />
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          ← Back
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading || !accountName.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                          >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Connect {selectedPlatform.name}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}