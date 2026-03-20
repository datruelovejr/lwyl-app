'use client';

import { useSpring, animated } from 'react-spring';

function getFrictionClass(value) {
  if (value >= 80) return 'bg-friction-high';
  if (value >= 40) return 'bg-friction-moderate';
  return 'bg-friction-low';
}

const DISC_BAR_CLASSES = {
  D: 'bg-disc-d',
  I: 'bg-disc-i',
  S: 'bg-disc-s',
  C: 'bg-disc-c',
};

/**
 * GapBar: Animated horizontal bar showing adaptation cost.
 * Bar width and number animate from 0 on mount via react-spring.
 * Color determined by friction threshold or DISC dimension.
 */
export function GapBar({ value = 0, dimension, label, showNumber = true, maxValue = 120 }) {
  const barClass = dimension && DISC_BAR_CLASSES[dimension]
    ? DISC_BAR_CLASSES[dimension]
    : getFrictionClass(value);

  const clampedPercent = Math.min((value / maxValue) * 100, 100);

  const spring = useSpring({
    from: { width: 0, number: 0 },
    to: { width: clampedPercent, number: value },
    config: { tension: 120, friction: 14 },
  });

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs font-medium text-muted">{label}</span>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full bg-subtle overflow-hidden">
          <animated.div
            className={`h-full rounded-full ${barClass}`}
            style={{ width: spring.width.to(w => `${w}%`) }}
          />
        </div>
        {showNumber && (
          <animated.span className="text-sm font-bold text-foreground tabular-nums min-w-[2.5rem] text-right">
            {spring.number.to(n => Math.round(n))}
          </animated.span>
        )}
      </div>
    </div>
  );
}

export default GapBar;
