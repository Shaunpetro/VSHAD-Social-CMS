const fs = require('fs');
const path = require('path');

const dir = path.join('apps', 'web', 'src', 'app', '(dashboard)', 'companies', '[id]', 'platforms', 'linkedin', 'select');
fs.mkdirSync(dir, { recursive: true });

const content = // apps/web/src/app/(dashboard)/companies/[id]/platforms/linkedin/select/page.tsx

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Building2, User, Loader2, CheckCircle } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  vanityName?: string | null;
  logoUrl?: string | null;
}

function decodeOrganizations(encoded: string): Organization[] {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString());
  } catch {
    return [];
  }
}

function LinkedInSelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const orgsParam = searchParams.get('orgs');
  const organizations = orgsParam ? decodeOrganizations(orgsParam) : [];

  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async () => {
    if (!selected) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const isPersonal = selected === 'personal';
      const selectedOrg = organizations.find(o => o.id === selected);

      const res = await fetch('/api/auth/linkedin/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          selection: isPersonal ? 'personal' : 'organization',
          organizationId: isPersonal ? null : selected,
          organizationName: isPersonal ? null : selectedOrg?.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to complete connection');
      }

      router.push(\/companies/\/platforms?connected=linkedin\);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] p-6 max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Choose LinkedIn Account</h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">
            Select which account to post from
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 mb-6">
          {/* Personal Profile Option */}
          <button
            onClick={() => setSelected('personal')}
            disabled={isSubmitting}
            className={\w-full p-4 rounded-xl border-2 text-left transition-all \ disabled:opacity-50\}
          >
            <div className="flex items-center gap-3">
              <div className={\w-12 h-12 rounded-xl flex items-center justify-center \\}>
                <User size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)]">Personal Profile</p>
                <p className="text-sm text-[var(--text-tertiary)] truncate">Post as yourself</p>
              </div>
              {selected === 'personal' && (
                <CheckCircle size={20} className="text-blue-500 flex-shrink-0" />
              )}
            </div>
          </button>

          {/* Organization Options */}
          {organizations.length > 0 && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-subtle)]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">
                    Or post as a company page
                  </span>
                </div>
              </div>

              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelected(org.id)}
                  disabled={isSubmitting}
                  className={\w-full p-4 rounded-xl border-2 text-left transition-all \ disabled:opacity-50\}
                >
                  <div className="flex items-center gap-3">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className={\w-12 h-12 rounded-xl flex items-center justify-center \\}>
                        <Building2 size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)]">{org.name}</p>
                      {org.vanityName && (
                        <p className="text-sm text-[var(--text-tertiary)] truncate">
                          linkedin.com/company/{org.vanityName}
                        </p>
                      )}
                    </div>
                    {selected === org.id && (
                      <CheckCircle size={20} className="text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSelect}
            disabled={!selected || isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Connecting...
              </>
            ) : (
              'Continue'
            )}
          </button>

          <button
            onClick={() => router.push(\/companies/\/platforms\)}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Cancel and go back
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="text-center text-[var(--text-secondary)]">
        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>Loading...</p>
      </div>
    </div>
  );
}

export default function LinkedInSelectPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LinkedInSelectContent />
    </Suspense>
  );
}
;

fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf8');
console.log('SUCCESS: Created ' + path.join(dir, 'page.tsx'));
