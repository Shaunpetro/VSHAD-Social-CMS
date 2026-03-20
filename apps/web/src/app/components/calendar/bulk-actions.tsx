// apps/web/src/app/components/calendar/bulk-actions.tsx
"use client";

import { useState } from "react";
import {
  CheckSquare,
  X,
  Trash2,
  Calendar,
  Clock,
  Send,
  Archive,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsProps {
  selectedCount: number;
  selectedPostIds: string[];
  onBulkReschedule: (newDate: Date) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkStatusChange: (status: string) => Promise<void>;
  onClearSelection: () => void;
  isProcessing: boolean;
}

export function BulkActions({
  selectedCount,
  selectedPostIds,
  onBulkReschedule,
  onBulkDelete,
  onBulkStatusChange,
  onClearSelection,
  isProcessing,
}: BulkActionsProps) {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("09:00");

  if (selectedCount === 0) return null;

  const handleReschedule = async () => {
    if (!rescheduleDate) return;

    const dateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
    await onBulkReschedule(dateTime);
    setShowRescheduleModal(false);
    setRescheduleDate("");
  };

  const handleDelete = async () => {
    await onBulkDelete();
    setShowDeleteConfirm(false);
  };

  const handlePublish = async () => {
    await onBulkStatusChange("PUBLISHED");
    setShowPublishConfirm(false);
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
          {/* Selection Info */}
          <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
            <CheckSquare className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-white">
              {selectedCount} selected
            </span>
            <button
              onClick={onClearSelection}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Clear selection"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Mark Published */}
            <button
              onClick={() => setShowPublishConfirm(true)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Publish
            </button>

            {/* Reschedule */}
            <button
              onClick={() => setShowRescheduleModal(true)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              Reschedule
            </button>

            {/* Schedule (for drafts) */}
            <button
              onClick={() => onBulkStatusChange("SCHEDULED")}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Clock className="h-4 w-4" />
              Schedule
            </button>

            {/* Move to Draft */}
            <button
              onClick={() => onBulkStatusChange("DRAFT")}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              To Draft
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin ml-2" />
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRescheduleModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reschedule {selectedCount} Posts
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                All selected posts will be rescheduled to this date and time.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={!rescheduleDate || isProcessing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPublishConfirm(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mark {selectedCount} Posts as Published?
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                This will mark the selected posts as published and:
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 ml-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Set status to PUBLISHED
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Record the publish timestamp
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Auto-generate realistic engagement metrics
                </li>
              </ul>
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                Metrics are simulated for analytics testing. Connect real platform APIs for actual data.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Mark Published
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete {selectedCount} Posts?
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. All selected posts and their associated
              data will be permanently deleted.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Posts
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}