'use client';

import { motion } from 'framer-motion';

const DISC_CLASSES = {
  D: { bg: 'bg-disc-d', ring: 'ring-disc-d', tint: 'bg-disc-d/10' },
  I: { bg: 'bg-disc-i', ring: 'ring-disc-i', tint: 'bg-disc-i/10' },
  S: { bg: 'bg-disc-s', ring: 'ring-disc-s', tint: 'bg-disc-s/10' },
  C: { bg: 'bg-disc-c', ring: 'ring-disc-c', tint: 'bg-disc-c/10' },
};

const SIZES = {
  sm: { circle: 'w-8 h-8 text-xs', showName: false },
  md: { circle: 'w-10 h-10 text-sm', showName: true },
  lg: { circle: 'w-14 h-14 text-base', showName: true },
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * PersonChip: Represents a team member with their DISC identity visible.
 * Replaces PersonPill from ui.jsx with DISC-colored initials, size variants,
 * and framer-motion selection state.
 */
export function PersonChip({ name, disc = 'D', size = 'md', selected = false, onClick, fullWidth = false }) {
  const discStyle = DISC_CLASSES[disc] || DISC_CLASSES.D;
  const sizeStyle = SIZES[size] || SIZES.md;
  const initials = getInitials(name);
  const isClickable = typeof onClick === 'function';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        scale: selected ? 1.04 : 1,
      }}
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.15 }}
      className={[
        'inline-flex items-center gap-2 rounded-lg border transition-colors',
        isClickable ? 'cursor-pointer' : 'cursor-default',
        selected
          ? `${discStyle.tint} border-transparent ring-2 ${discStyle.ring}`
          : 'bg-subtle border-border',
        size === 'sm' ? 'p-0' : 'pr-3 pl-1 py-1',
        fullWidth ? 'w-full' : '',
      ].join(' ')}
    >
      {/* Initials circle */}
      <span
        className={[
          'inline-flex items-center justify-center rounded-full font-bold text-white shrink-0',
          discStyle.bg,
          sizeStyle.circle,
        ].join(' ')}
      >
        {initials}
      </span>

      {/* Name */}
      {sizeStyle.showName && name && (
        <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">
          {name}
        </span>
      )}
    </motion.button>
  );
}

/** Alias for backward compatibility with existing imports */
export const PersonPill = PersonChip;

export default PersonChip;
