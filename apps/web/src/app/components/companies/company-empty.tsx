'use client';

import { Building2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyEmptyProps {
  onAdd: () => void;
}

export function CompanyEmpty({ onAdd }: CompanyEmptyProps) {
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
        <Building2 size={24} className="text-muted-foreground" />
      </motion.div>
      <h3 className="text-lg font-medium">No companies yet</h3>
      <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
        Add your first company to start generating AI-powered social media content
      </p>
      <button
        onClick={onAdd}
        className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus size={16} />
        Add Your First Company
      </button>
    </motion.div>
  );
}