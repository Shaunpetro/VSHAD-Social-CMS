// apps/web/src/app/(dashboard)/companies/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, RefreshCw, X, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { CompanyEmpty } from '@/app/components/companies/company-empty';
import { CompanyList } from '@/app/components/companies/company-list';
import type { Company } from '@/types/company';

// Normalize and validate website URL
function normalizeWebsite(input: string): string {
  if (!input || !input.trim()) return '';
  
  let url = input.trim().toLowerCase();
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  // If it doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Remove www. prefix temporarily for consistency
    url = url.replace(/^www\./, '');
    url = `https://${url}`;
  }
  
  return url;
}

// Extract display domain from URL
function getDisplayDomain(input: string): string {
  if (!input || !input.trim()) return '';
  
  try {
    const normalized = normalizeWebsite(input);
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, just clean up the input
    return input
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim();
  }
}

// Basic validation - checks if it looks like a domain
function isValidDomain(input: string): boolean {
  if (!input || !input.trim()) return true; // Empty is valid (optional field)
  
  const domain = getDisplayDomain(input);
  
  // Basic domain pattern: something.something
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  return domainPattern.test(domain);
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New company form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [checkingWebsite, setCheckingWebsite] = useState(false);
  const [websiteValid, setWebsiteValid] = useState<boolean | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Check website validity when user stops typing
  useEffect(() => {
    if (!newCompanyWebsite.trim()) {
      setWebsiteValid(null);
      return;
    }

    // Basic format check
    if (!isValidDomain(newCompanyWebsite)) {
      setWebsiteValid(false);
      return;
    }

    // Debounce the website check
    const timer = setTimeout(async () => {
      setCheckingWebsite(true);
      try {
        // For now, just validate the format
        // You could add an API call here to actually check if the site exists
        const normalized = normalizeWebsite(newCompanyWebsite);
        new URL(normalized); // Will throw if invalid
        setWebsiteValid(true);
      } catch {
        setWebsiteValid(false);
      } finally {
        setCheckingWebsite(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newCompanyWebsite]);

  // Create company and redirect to onboarding
  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newCompanyName.trim()) {
      setCreateError('Company name is required');
      return;
    }

    // Validate website if provided
    if (newCompanyWebsite.trim() && !isValidDomain(newCompanyWebsite)) {
      setCreateError('Please enter a valid website address');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      // Normalize the website URL before sending
      const normalizedWebsite = newCompanyWebsite.trim() 
        ? normalizeWebsite(newCompanyWebsite) 
        : null;

      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          website: normalizedWebsite,
        }),
      });

      if (res.ok) {
        const company = await res.json();
        // Redirect to onboarding
        router.push(`/companies/${company.id}/onboarding`);
      } else {
        const error = await res.json();
        setCreateError(error.message || 'Failed to create company');
      }
    } catch (error) {
      console.error('Failed to create company:', error);
      setCreateError('Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  function handleCloseAddModal() {
    setShowAddModal(false);
    setNewCompanyName('');
    setNewCompanyWebsite('');
    setCreateError('');
    setWebsiteValid(null);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/companies/${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchCompanies();
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
    } finally {
      setDeleting(false);
    }
  }

  const displayDomain = getDisplayDomain(newCompanyWebsite);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Companies</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your companies, brand voice, and content topics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCompanies}
            disabled={loading}
            className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:translate-y-[-1px] transition-all duration-200"
          >
            <Plus size={18} />
            Add Company
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-tertiary)] mt-3">Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <CompanyEmpty onAdd={() => setShowAddModal(true)} />
      ) : (
        <CompanyList
          companies={companies}
          onEdit={(company) => router.push(`/companies/${company.id}/settings`)}
          onDelete={(company) => setDeleteConfirm(company)}
        />
      )}

      {/* Add Company Modal - Simple version that goes to onboarding */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={handleCloseAddModal}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border-default)] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add New Company</h2>
                  <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                    We&apos;ll guide you through the setup
                  </p>
                </div>
                <button
                  onClick={handleCloseAddModal}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Website <span className="text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                    <Globe size={18} />
                  </div>
                  <input
                    type="text"
                    value={newCompanyWebsite}
                    onChange={(e) => setNewCompanyWebsite(e.target.value)}
                    placeholder="example.com"
                    className={`
                      w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--bg-primary)] border text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 transition-all
                      ${newCompanyWebsite.trim() && websiteValid === false 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : newCompanyWebsite.trim() && websiteValid === true
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                          : 'border-[var(--border-default)] focus:border-brand-500 focus:ring-brand-500/20'
                      }
                    `}
                  />
                  {/* Status icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingWebsite ? (
                      <Loader2 size={18} className="animate-spin text-[var(--text-tertiary)]" />
                    ) : newCompanyWebsite.trim() && websiteValid === true ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : newCompanyWebsite.trim() && websiteValid === false ? (
                      <AlertCircle size={18} className="text-red-500" />
                    ) : null}
                  </div>
                </div>
                
                {/* Helper text / Preview */}
                <div className="mt-1.5 min-h-[20px]">
                  {newCompanyWebsite.trim() && websiteValid === true && displayDomain ? (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <span>Will be saved as:</span>
                      <span className="font-medium">{normalizeWebsite(newCompanyWebsite)}</span>
                    </p>
                  ) : newCompanyWebsite.trim() && websiteValid === false ? (
                    <p className="text-xs text-red-500">
                      Please enter a valid website (e.g., example.com or www.example.com)
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Enter your website in any format: example.com, www.example.com, or full URL
                    </p>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
                <div className="flex gap-3">
                  <div className="text-2xl">✨</div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      What happens next?
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      You&apos;ll go through a quick 5-step onboarding to set up your brand voice, 
                      content pillars, and posting preferences. Takes about 5 minutes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={creating}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newCompanyName.trim() || (newCompanyWebsite.trim() !== '' && websiteValid === false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue to Setup
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteConfirm(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border-default)] p-6 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] text-center">Delete Company</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 text-center">
              Are you sure you want to delete <strong className="text-[var(--text-primary)]">{deleteConfirm.name}</strong>?
              This will also delete all topics, platform connections, and generated posts.
            </p>
            <p className="text-xs text-red-500 mt-2 text-center font-medium">
              This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}