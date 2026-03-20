'use client';

import { motion } from 'framer-motion';

/**
 * LoadingMoment: Intentional loading state with a message.
 * Not a spinner. A designed moment that tells the leader
 * what the app is doing for them.
 *
 * Three dots pulse with stagger to suggest organic activity
 * without the anxiety of a spinning wheel.
 */
export function LoadingMoment({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      {/* Pulsing dots */}
      <div className="flex gap-2 mb-5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-nav-accent"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-sm text-muted text-center leading-relaxed max-w-xs"
      >
        {message}
      </motion.p>
    </div>
  );
}

export default LoadingMoment;
