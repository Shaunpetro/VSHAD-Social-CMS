'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, Linkedin, Twitter, Facebook, Instagram, Globe,
  CheckCircle2, ChevronRight, Building2, ExternalLink,
} from 'lucide-react';
import { PLATFORM_LIST, PLATFORMS } from '@/lib/platforms';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border/60 bg-background p-6 shadow-xl mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">{getStepTitle()}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {getStepDescription()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {step === 'select-company' && (
              <div className="space-y-2">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company)}
                    className="flex w-full items-center justify-between p-4 rounded-lg border border-border/60 hover:border-border hover:bg-secondary/30 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                        <Building2 size={18} className="text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">{company.name}</span>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {step === 'select-platform' && (
              <div className="space-y-2">
                {PLATFORM_LIST.map((platform) => {
                  const Icon = platformIcons[platform.id] || Globe;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleSelectPlatform(platform)}
                      className="flex w-full items-center justify-between p-4 rounded-lg border border-border/60 hover:border-border hover:bg-secondary/30 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={'flex h-9 w-9 items-center justify-center rounded-lg ' + platform.bgColor}>
                          <Icon size={18} className={platform.color} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{platform.name}</span>
                            {platform.oauthSupported ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                <ExternalLink size={8} />
                                OAuth
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">
                                Manual
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {platform.description}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                  );
                })}

                {companies.length > 1 && (
                  <button
                    onClick={handleBack}
                    className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to companies
                  </button>
                )}
              </div>
            )}

            {step === 'connect' && selectedPlatform && (
              <form onSubmit={handleConnect} className="space-y-5">
                {connectingAnimation && !error ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-8"
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
                      className={'flex h-16 w-16 items-center justify-center rounded-2xl ' + selectedPlatform.bgColor}
                    >
                      {(() => {
                        const ConnIcon = platformIcons[selectedPlatform.id] || Globe;
                        return <ConnIcon size={28} className={selectedPlatform.color} />;
                      })()}
                    </motion.div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Connecting to {selectedPlatform.name}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Setting up manual connection
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className={
                      'flex items-center gap-3 p-3 rounded-lg border ' +
                      selectedPlatform.borderColor + ' ' + selectedPlatform.bgColor
                    }>
                      {(() => {
                        const ConnIcon = platformIcons[selectedPlatform.id] || Globe;
                        return <ConnIcon size={20} className={selectedPlatform.color} />;
                      })()}
                      <div>
                        <p className="text-sm font-medium">{selectedPlatform.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedPlatform.description}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Account / Page Name *
                      </label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder={selectedPlatform.accountPlaceholder}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        OAuth is not yet available for {selectedPlatform.name}. Enter a display name for manual connection.
                      </p>
                    </div>

                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs font-medium mb-2">Permissions requested:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPlatform.defaultScopes.map((scope) => (
                          <span
                            key={scope}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground"
                          >
                            <CheckCircle2 size={10} className="text-green-500" />
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ← Back
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !accountName.trim()}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}