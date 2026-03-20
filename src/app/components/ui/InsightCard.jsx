'use client';

import { motion } from 'framer-motion';

const VARIANTS = {
  priority: {
    card: 'bg-card border border-border border-l-4 border-l-friction-high shadow-md',
  },
  standard: {
    card: 'bg-card border border-border border-l-4 border-l-border',
  },
  muted: {
    card: 'bg-subtle border border-transparent',
  },
};

/**
 * InsightCard: Primary content container for person-based or pair-based insights.
 * Three variants: priority (elevated, friction-high accent), standard (default),
 * muted (reduced weight). framer-motion entrance with stagger support.
 * Replaces StoryCard from ui.jsx.
 *
 * Interior layout is composed by the consumer using children.
 * Provides Callout as a named sub-component for "What to do about it" blocks.
 */
export function InsightCard({ variant = 'standard', enterDelay = 0, children }) {
  const styles = VARIANTS[variant] || VARIANTS.standard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: enterDelay / 1000, ease: 'easeOut' }}
      className={`rounded-xl p-6 mb-3 ${styles.card}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * InsightCard.Callout: Visually distinct interior block for actionable content.
 * "What to do about it" sections, next steps, recommendations.
 */
InsightCard.Callout = function Callout({ children }) {
  return (
    <div className="mt-3 rounded-lg bg-subtle border-l-3 border-l-nav-accent px-4 py-3.5">
      <div className="text-xs font-medium text-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
};

/**
 * InsightCard.CostRow: Dedicated row for gap point display with visual weight.
 */
InsightCard.CostRow = function CostRow({ children }) {
  return (
    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted">
      {children}
    </div>
  );
};

/**
 * InsightCard.Actions: Right-aligned action row for CTAs.
 */
InsightCard.Actions = function Actions({ children }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-3">
      {children}
    </div>
  );
};

/** Alias for backward compatibility */
export const StoryCard = InsightCard;

export default InsightCard;
