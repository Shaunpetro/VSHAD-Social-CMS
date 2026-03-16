'use client';

import { CompanyCard } from '@/app/components/companies/company-card';

// ═══════════════════════════════════════════════════════════════
// Types matching current Prisma schema (same as company-card.tsx)
// ═══════════════════════════════════════════════════════════════

interface Platform {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
}

interface Company {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  platforms?: Platform[];
  _count?: {
    platforms?: number;
    generatedPosts?: number;
  };
  createdAt: string;
}

interface CompanyListProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export function CompanyList({ companies, onEdit, onDelete }: CompanyListProps) {
  // Safety check - return null if no companies
  if (!companies || companies.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company, index) => (
        <CompanyCard
          key={company.id}
          company={company}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}