'use client';

import { motion } from 'framer-motion';

/**
 * SectionHeader: Consistent page title treatment across all screens.
 * framer-motion stagger on title, subtitle, and count badge.
 * Replaces SectionHead from ui.jsx.
 */
export function SectionHeader({ title, subtitle, count }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-lg font-extrabold text-foreground tracking-tight"
        >
          {title}
        </motion.div>
        {subtitle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
            className="text-xs text-muted mt-0.5"
          >
            {subtitle}
          </motion.div>
        )}
      </div>
      {count != null && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
          className="text-xs font-bold text-white bg-nav px-3.5 py-1 rounded-full"
        >
          {count}
        </motion.span>
      )}
    </div>
  );
}

/** Alias for backward compatibility */
export const SectionHead = SectionHeader;

export default SectionHeader;
