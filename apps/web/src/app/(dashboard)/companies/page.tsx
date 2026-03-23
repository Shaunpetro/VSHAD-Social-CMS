'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, RefreshCw } from 'lucide-react';
import { CompanyEmpty } from '@/app/components/companies/company-empty';
import { CompanyList } from '@/app/components/companies/company-list';
import { CompanyForm } from '@/app/components/companies/company-form';
import type { Company } from '@/types/company';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function handleEdit(company: Company) {
    setEditCompany(company);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditCompany(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your companies, brand voice, and content topics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCompanies}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {companies.length > 0 && (
            <button
              onClick={() => {
                setEditCompany(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Add Company
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-3">Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <CompanyEmpty
          onAdd={() => {
            setEditCompany(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <CompanyList
          companies={companies}
          onEdit={handleEdit}
          onDelete={(company) => setDeleteConfirm(company)}
        />
      )}

      {/* Form Modal */}
      <CompanyForm
        open={formOpen}
        onClose={handleCloseForm}
        onSuccess={fetchCompanies}
        editCompany={editCompany}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setDeleteConfirm(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border/60 bg-background p-6 shadow-xl mx-4">
            <h3 className="text-lg font-semibold">Delete Company</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              This will also delete all topics, platform connections, and generated posts
              for this company. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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