// apps/web/src/app/platforms/linkedin/select/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { decodeOrganizations, LinkedInOrganization } from '@/lib/oauth/linkedin';

export default function LinkedInSelectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [organizations, setOrganizations] = useState<LinkedInOrganization[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orgsParam = searchParams.get('orgs');
    const companyIdParam = searchParams.get('companyId');

    if (orgsParam) {
      const decoded = decodeOrganizations(orgsParam);
      setOrganizations(decoded);
    }

    if (companyIdParam) {
      setCompanyId(companyIdParam);
    }
  }, [searchParams]);

  const handleSelect = async (selection: 'personal' | string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/linkedin/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          selection,
          organizationId: selection !== 'personal' ? selection : null,
          organizationName: selection !== 'personal' 
            ? organizations.find(o => o.id === selection)?.name 
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete connection');
      }

      router.push('/platforms?connected=linkedin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete connection');
      setIsLoading(false);
    }
  };

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full text-center">
          <p className="text-red-400">Invalid session. Please try connecting again.</p>
          <button
            onClick={() => router.push('/platforms')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Platforms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">Choose Where to Post</h1>
          <p className="text-gray-400 mt-2">
            Select where you want to publish your LinkedIn content
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Personal Profile Option */}
          <button
            onClick={() => handleSelect('personal')}
            disabled={isLoading}
            className="w-full p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Personal Profile</p>
                <p className="text-gray-400 text-sm">Post to your personal LinkedIn feed</p>
              </div>
            </div>
          </button>

          {/* Organization Options */}
          {organizations.length > 0 && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-gray-900 text-gray-400 text-sm">Company Pages</span>
                </div>
              </div>

              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelect(org.id)}
                  disabled={isLoading}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center overflow-hidden">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{org.name}</p>
                      {org.vanityName && (
                        <p className="text-gray-400 text-sm">linkedin.com/company/{org.vanityName}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        {isLoading && (
          <div className="mt-4 text-center text-gray-400">
            <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm">Completing connection...</p>
          </div>
        )}

        <button
          onClick={() => router.push('/platforms')}
          className="w-full mt-6 px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Cancel and go back
        </button>
      </div>
    </div>
  );
}