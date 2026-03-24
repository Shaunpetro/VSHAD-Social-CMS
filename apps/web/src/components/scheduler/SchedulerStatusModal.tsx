// apps/web/src/components/scheduler/SchedulerStatusModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Play,
  X,
  Activity,
} from 'lucide-react';

interface SchedulerStatus {
  scheduled: number;
  publishing: number;
  failed: number;
  publishedToday: number;
}

interface SchedulerResult {
  processed: number;
  published: number;
  failed: number;
  errors: Array<{ postId: string; error: string }>;
}

export function SchedulerStatusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<SchedulerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/scheduler/test?action=status');
      const data = await response.json();
      if (data.counts) {
        setStatus(data.counts);
      }
    } catch (err) {
      setError('Failed to fetch status');
      console.error('Failed to fetch scheduler status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const runScheduler = async () => {
    setRunning(true);
    setError(null);
    setLastRun(null);
    try {
      const response = await fetch('/api/scheduler/test?action=run');
      const data = await response.json();
      if (data.result) {
        setLastRun(data.result);
        // Refresh status after running
        await fetchStatus();
      }
    } catch (err) {
      setError('Failed to run scheduler');
      console.error('Failed to run scheduler:', err);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, fetchStatus]);

  // Auto-refresh every 30 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isOpen, fetchStatus]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
        title="Scheduler Status"
      >
        <Activity className="h-6 w-6" />
        {status && status.failed > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
            {status.failed}
          </span>
        )}
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-6 sm:items-center sm:justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Scheduler Status
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {loading && !status ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : status ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* Scheduled */}
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Scheduled
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {status.scheduled}
                    </p>
                  </div>

                  {/* Publishing */}
                  <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                        Publishing
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {status.publishing}
                    </p>
                  </div>

                  {/* Published Today */}
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        Published Today
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-300">
                      {status.publishedToday}
                    </p>
                  </div>

                  {/* Failed */}
                  <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        Failed
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">
                      {status.failed}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Last Run Result */}
              {lastRun && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Last Manual Run
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Processed: <strong>{lastRun.processed}</strong>
                    </span>
                    <span className="text-green-600">
                      Published: <strong>{lastRun.published}</strong>
                    </span>
                    {lastRun.failed > 0 && (
                      <span className="text-red-600">
                        Failed: <strong>{lastRun.failed}</strong>
                      </span>
                    )}
                  </div>
                  {lastRun.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      {lastRun.errors.map((err, i) => (
                        <p key={i}>• {err.error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={runScheduler}
                disabled={running}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className={`h-4 w-4 ${running ? 'animate-pulse' : ''}`} />
                {running ? 'Running...' : 'Run Now'}
              </button>
            </div>

            {/* Footer Info */}
            <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
              <p className="text-center text-xs text-gray-400">
                Auto-refreshes every 30 seconds • Cron runs every minute
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}