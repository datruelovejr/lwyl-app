'use client';

import { useSpring, animated } from 'react-spring';
import { motion } from 'framer-motion';

/**
 * StatBlock: Key metric with human context. Never a number alone.
 * react-spring count-up on mount. framer-motion fade-in with stagger support.
 * Replaces MetricCard from ui.jsx.
 */
export function StatBlock({ value = 0, label, sublabel, accentColor = 'border', enterDelay = 0 }) {
  const spring = useSpring({
    from: { number: 0 },
    to: { number: value },
    config: { tension: 120, friction: 14 },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: enterDelay / 1000, ease: 'easeOut' }}
      className={`flex-1 min-w-[140px] rounded-xl bg-card border border-border border-l-4 border-l-${accentColor} px-4 py-3.5`}
    >
      {label && (
        <span className="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
          {label}
        </span>
      )}
      <animated.span className="block text-3xl font-extrabold text-foreground leading-none tabular-nums">
        {spring.number.to(n => Math.round(n))}
      </animated.span>
      {sublabel && (
        <span className="block text-[11px] text-muted mt-1">
          {sublabel}
        </span>
      )}
    </motion.div>
  );
}

/** Alias for backward compatibility */
export const MetricCard = StatBlock;

export default StatBlock;
