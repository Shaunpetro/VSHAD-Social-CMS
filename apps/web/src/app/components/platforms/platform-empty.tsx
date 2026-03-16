'use client';

import { Plug, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlatformEmptyProps {
  onConnect: () => void;
  hasCompanies: boolean;
}

export function PlatformEmpty({ onConnect, hasCompanies }: PlatformEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-xl"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="p-4 rounded-full bg-secondary mb-4"
      >
        <Plug size={24} className="text-muted-foreground" />
      </motion.div>
      <h3 className="text-lg font-medium">No platforms connected</h3>
      <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
        {hasCompanies
          ? 'Connect LinkedIn, Twitter/X, Facebook, Instagram, or WordPress to start publishing'
          : 'Add a company first, then connect your social media and blog platforms'}
      </p>
      {hasCompanies ? (
        <button
          onClick={onConnect}
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Connect Your First Platform
        </button>
      ) : (
        <a
          href="/companies"
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add a Company First
        </a>
      )}
    </motion.div>
  );
}