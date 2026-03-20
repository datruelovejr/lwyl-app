'use client';

import { motion } from 'framer-motion';

const DIMENSION_DEFAULTS = {
  D: {
    naturalBehavior: 'need to drive toward results and own decisions',
    suppressedContext: (name) => `every meeting where ${name} is not in control asks them to hold back what they do best`,
  },
  I: {
    naturalBehavior: 'need to connect, influence, and bring energy to others',
    suppressedContext: (name) => `every transactional interaction without warmth drains what fuels ${name}`,
  },
  S: {
    naturalBehavior: 'need for process, consistency, and time to adjust',
    suppressedContext: (name) => `every surprise or sudden shift costs ${name} more than most people on your team feel it`,
  },
  C: {
    naturalBehavior: 'need to be right, thorough, and given space to think',
    suppressedContext: (name) => `every decision made without full information asks ${name} to sign off on uncertainty`,
  },
};

/**
 * WalkInTheirShoes: The perspective-taking moment.
 * Not a feature. A moment. A brief, still pause before the leader
 * enters a consequential interaction.
 *
 * Fade in only. No Y offset. No scale. Stillness is intentional.
 * The surrounding content has motion. This does not.
 * That contrast is the design.
 */
export function WalkInTheirShoes({ name, dimension, gapScore, naturalBehavior, suppressedContext }) {
  const defaults = DIMENSION_DEFAULTS[dimension] || DIMENSION_DEFAULTS.S;
  const behavior = naturalBehavior || defaults.naturalBehavior;
  const context = suppressedContext || defaults.suppressedContext(name);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl bg-subtle px-6 py-5 my-4"
      style={{ lineHeight: 1.8 }}
    >
      <p className="text-sm text-foreground">
        For {name} to show up the way your environment rewards, they have to override their most trusted instinct -- their {behavior} -- before they even speak. Not occasionally. Every single day. {gapScore} gap points is what that costs them. Before you walk into this conversation, carry that for a moment.
      </p>
    </motion.div>
  );
}

export default WalkInTheirShoes;
