'use client';

import { CompanyCard } from '@/app/components/companies/company-card';

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string | null;
  description: string | null;
  logo: string | null;
  brandVoice: string;
  keywords: string[];
  createdAt: string;
  _count: {
    topics: number;
    connections: number;
    posts: number;
  };
}

interface CompanyListProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export function CompanyList({ companies, onEdit, onDelete }: CompanyListProps) {
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