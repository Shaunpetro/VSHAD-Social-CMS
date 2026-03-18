// apps/web/src/app/contexts/company-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

interface Company {
  id: string;
  name: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async (selectFirst: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/companies");

      if (!res.ok) {
        throw new Error(`Failed to fetch companies: ${res.status}`);
      }

      const data = await res.json();

      // Validate response is an array
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }

      setCompanies(data);

      // Auto-select first company if needed
      if (selectFirst && data.length > 0) {
        setSelectedCompanyId((current) => current ?? data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch companies");
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchCompanies(true);
  }, [fetchCompanies]);

  // Public refresh function (doesn't auto-select)
  const refreshCompanies = useCallback(async () => {
    await fetchCompanies(false);
  }, [fetchCompanies]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<CompanyContextType>(
    () => ({
      companies,
      selectedCompanyId,
      setSelectedCompanyId,
      isLoading,
      error,
      refreshCompanies,
    }),
    [companies, selectedCompanyId, isLoading, error, refreshCompanies]
  );

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}