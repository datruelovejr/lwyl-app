'use client';

import { useState } from 'react';

/**
 * Expandable: Click-to-reveal section.
 * Upgraded from ui.jsx -- inline styles replaced with Tailwind classes and CSS variables.
 */
export function Expandable({ label, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 text-xs font-semibold text-foreground"
      >
        <span
          className="inline-block text-[10px] text-muted transition-transform duration-150"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          &#9654;
        </span>
        {label}
      </button>
      {open && (
        <div className="mt-2 pl-4">{children}</div>
      )}
    </div>
  );
}

export default Expandable;
