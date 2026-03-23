'use client';

import { CompanyCard } from '@/app/components/companies/company-card';
import type { Company } from '@/types/company';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

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