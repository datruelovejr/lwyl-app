'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const VARIANTS = {
  primary: 'font-bold text-foreground',
  subtle: 'font-normal text-muted',
};

/**
 * ActionLink: Consistent CTA link replacing plain styled anchors.
 * Hover underline grows left-to-right. ChevronRight appears on hover.
 */
export function ActionLink({ children, onClick, href, variant = 'primary' }) {
  const [hovered, setHovered] = useState(false);
  const classes = VARIANTS[variant] || VARIANTS.primary;

  const Tag = href ? 'a' : 'button';
  const tagProps = href
    ? { href, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : { type: 'button', onClick, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) };

  return (
    <Tag
      {...tagProps}
      className={`relative inline-flex items-center gap-1 text-xs cursor-pointer bg-transparent border-none p-0 no-underline ${classes}`}
    >
      <span className="relative">
        {children}
        <span
          className="absolute left-0 bottom-0 h-px bg-current transition-transform duration-150 origin-left"
          style={{ width: '100%', transform: hovered ? 'scaleX(1)' : 'scaleX(0)' }}
        />
      </span>
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </Tag>
  );
}

export default ActionLink;
