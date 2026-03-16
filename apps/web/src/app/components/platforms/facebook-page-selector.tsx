"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Facebook, CheckCircle2 } from "lucide-react";

interface FacebookPageInfo {
  id: string;
  name: string;
  category: string;
}

interface FacebookPageSelectorProps {
  open: boolean;
  connectionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function FacebookPageSelector({
  open,
  connectionId,
  onClose,
  onSuccess,
}: FacebookPageSelectorProps) {
  const [pages, setPages] = useState<FacebookPageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && connectionId) {
      fetchPages();
    }
  }, [open, connectionId]);

  async function fetchPages() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/auth/facebook/pages?connectionId=${connectionId}`,
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch pages");
      }

      setPages(data.pages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect() {
    if (!selectedPageId) return;

    setSelecting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/facebook/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          pageId: selectedPageId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to connect page");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect page");
    } finally {
      setSelecting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border/60 bg-background p-6 shadow-xl mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Select Facebook Page</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Choose which page to connect for posting
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center py-12">
                <Loader2
                  size={24}
                  className="animate-spin text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground mt-3">
                  Loading your pages...
                </p>
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Facebook size={24} className="text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No pages found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Make sure you are an admin of at least one Facebook Page
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className={
                      "flex w-full items-center justify-between p-4 rounded-lg border text-left transition-all duration-200 " +
                      (selectedPageId === page.id
                        ? "border-[#1877F2] bg-[#1877F2]/5 ring-1 ring-[#1877F2]/20"
                        : "border-border/60 hover:border-border hover:bg-secondary/30")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2]/10">
                        <Facebook size={18} className="text-[#1877F2]" />
                      </div>
                      <div>
                        <span className="text-sm font-medium block">
                          {page.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {page.category}
                        </span>
                      </div>
                    </div>
                    {selectedPageId === page.id && (
                      <CheckCircle2 size={18} className="text-[#1877F2]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {pages.length > 0 && (
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/40">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelect}
                  disabled={!selectedPageId || selecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {selecting && <Loader2 size={16} className="animate-spin" />}
                  Connect Page
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
