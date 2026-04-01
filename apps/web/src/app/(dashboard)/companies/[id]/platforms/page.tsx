// apps/web/src/app/(dashboard)/companies/[id]/platforms/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Plus, Loader2, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PlatformEmpty } from '@/app/components/platforms/platform-empty';
import { PlatformList } from '@/app/components/platforms/platform-list';
import { PlatformConnectModal } from '@/app/components/platforms/platform-connect-modal';
import { FacebookPageSelector } from '@/app/components/platforms/facebook-page-selector';
import type { PlatformConnection } from '@/lib/platforms';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
  industry?: string | null;
}

export default function CompanyPlatformsPage() {
  return (
    <Suspense fallback={<PlatformsLoading />}>
      <PlatformsContent />
    </Suspense>
  );
}

function PlatformsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your social media accounts
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-3">Loading connections...</p>
      </div>
    </div>
  );
}

function PlatformsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<PlatformConnection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [fbPageSelector, setFbPageSelector] = useState<{
    open: boolean;
    connectionId: string;
  }>({ open: false, connectionId: '' });

  useEffect(() => {
    async function fetchCompany() {
      try {
        setCompanyLoading(true);
        const res = await fetch(`/api/companies/${companyId}`);
        if (res.ok) {
          const data = await res.json();
          setCompany(data);
        }
      } catch (error) {
        console.error('Failed to fetch company:', error);
      } finally {
        setCompanyLoading(false);
      }
    }

    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const fetchConnections = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/platforms?companyId=${companyId}`);

      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const pendingFacebook = searchParams.get('pending_facebook');

    if (connected) {
      setNotification({
        type: 'success',
        message: `Successfully connected ${connected.charAt(0).toUpperCase() + connected.slice(1)}!`,
      });
      fetchConnections();
      window.history.replaceState({}, '', `/companies/${companyId}/platforms`);
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        missing_company: 'No company selected. Please try again.',
        linkedin_not_configured: 'LinkedIn credentials are not configured.',
        linkedin_denied: message ? decodeURIComponent(message) : 'LinkedIn authorization was denied.',
        linkedin_missing_params: 'LinkedIn callback missing required parameters.',
        linkedin_invalid_state: 'Invalid LinkedIn OAuth state. Please try again.',
        linkedin_callback_failed: message ? decodeURIComponent(message) : 'LinkedIn connection failed.',
        linkedin_init_failed: 'Failed to start LinkedIn authorization.',
        facebook_not_configured: 'Facebook credentials are not configured.',
        facebook_denied: message ? decodeURIComponent(message) : 'Facebook authorization was denied.',
        facebook_missing_params: 'Facebook callback missing required parameters.',
        facebook_invalid_state: 'Invalid Facebook OAuth state. Please try again.',
        facebook_callback_failed: message ? decodeURIComponent(message) : 'Facebook connection failed.',
        facebook_init_failed: 'Failed to start Facebook authorization.',
        no_facebook_pages: 'No Facebook Pages found. Make sure you are an admin of at least one Page.',
        company_not_found: 'The selected company was not found.',
      };

      setNotification({
        type: 'error',
        message: errorMessages[error] || `Connection error: ${error}`,
      });
      window.history.replaceState({}, '', `/companies/${companyId}/platforms`);
    }

    if (pendingFacebook) {
      setFbPageSelector({ open: true, connectionId: pendingFacebook });
      window.history.replaceState({}, '', `/companies/${companyId}/platforms`);
    }
  }, [searchParams, fetchConnections, companyId]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  async function handleDisconnect(connection: PlatformConnection) {
    try {
      const res = await fetch(`/api/platforms/${connection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disconnected' }),
      });

      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Disconnected ${connection.accountName}`,
        });
        fetchConnections();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  async function handleReconnect(connection: PlatformConnection) {
    const platform = connection.platform;
    const config = connection.config as Record<string, unknown> | null;

    if ((platform === 'linkedin' || platform === 'facebook') && config) {
      window.location.href = `/api/auth/${platform}?companyId=${companyId}`;
      return;
    }

    try {
      const res = await fetch(`/api/platforms/${connection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'connected' }),
      });

      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Reconnected ${connection.accountName}`,
        });
        fetchConnections();
      }
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/platforms/${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Removed ${deleteConfirm.accountName} connection`,
        });
        setDeleteConfirm(null);
        fetchConnections();
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
    } finally {
      setDeleting(false);
    }
  }

  const connectedCount = connections.filter((c) => c.status === 'connected').length;

  if (companyLoading) {
    return <PlatformsLoading />;
  }

  if (!company) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle size={48} className="text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Company Not Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The company you are looking for does not exist.
          </p>
          <Link
            href="/companies"
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={
              'flex items-center gap-3 p-4 rounded-lg border ' +
              (notification.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 border-destructive/20 text-destructive')
            }
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              x
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href={`/companies/${companyId}`}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              {company.name}
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {connections.length > 0
              ? `${connectedCount} of ${connections.length} platform${connections.length !== 1 ? 's' : ''} connected`
              : 'Connect your social media accounts to start publishing'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConnections}
            disabled={loading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Connect Platform
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-3">Loading connections...</p>
        </div>
      ) : connections.length === 0 ? (
        <PlatformEmpty
          onConnect={() => setModalOpen(true)}
          hasCompanies={true}
        />
      ) : (
        <PlatformList
          connections={connections}
          onReconnect={handleReconnect}
          onDisconnect={handleDisconnect}
          onDelete={(connection) => setDeleteConfirm(connection)}
        />
      )}

      <PlatformConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchConnections}
        companies={company ? [{ id: company.id, name: company.name }] : []}
      />

      <FacebookPageSelector
        open={fbPageSelector.open}
        connectionId={fbPageSelector.connectionId}
        onClose={() => setFbPageSelector({ open: false, connectionId: '' })}
        onSuccess={fetchConnections}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setDeleteConfirm(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border/60 bg-background p-6 shadow-xl mx-4">
            <h3 className="text-lg font-semibold">Remove Connection</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to remove the <strong>{deleteConfirm.platform}</strong> connection
              for <strong>{deleteConfirm.accountName}</strong>?
              This will revoke access and remove all scheduled posts for this platform.
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}