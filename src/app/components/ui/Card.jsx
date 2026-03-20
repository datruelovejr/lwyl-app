'use client';

/**
 * Card: Generic card wrapper with consistent padding, border, shadow.
 * Upgraded from ui.jsx -- inline styles replaced with Tailwind classes and CSS variables.
 */
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-card rounded-xl p-6 border border-border mb-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default Card;
