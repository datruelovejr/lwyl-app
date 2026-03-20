'use client';

const SEVERITY_CLASSES = {
  critical: {
    card: 'bg-alert-critical-bg border-alert-critical-border border-l-alert-critical-accent',
    title: 'text-alert-critical-accent',
    body: 'text-alert-critical-text',
  },
  warning: {
    card: 'bg-alert-warning-bg border-alert-warning-border border-l-alert-warning-accent',
    title: 'text-alert-warning-accent',
    body: 'text-alert-warning-text',
  },
  info: {
    card: 'bg-alert-info-bg border-alert-info-border border-l-alert-info-accent',
    title: 'text-alert-info-accent',
    body: 'text-alert-info-text',
  },
  success: {
    card: 'bg-alert-success-bg border-alert-success-border border-l-alert-success-accent',
    title: 'text-alert-success-accent',
    body: 'text-alert-success-text',
  },
};

/**
 * AlertCard: Severity-based alert for warnings, damage signals, risk indicators.
 * Upgraded from ui.jsx -- hardcoded hex palettes replaced with CSS variable tokens.
 */
export function AlertCard({ severity = 'info', title, children }) {
  const s = SEVERITY_CLASSES[severity] || SEVERITY_CLASSES.info;

  return (
    <div className={`border border-l-4 rounded-xl px-4.5 py-3.5 mb-3 ${s.card}`}>
      {title && (
        <div className={`text-xs font-bold mb-1.5 ${s.title}`}>{title}</div>
      )}
      <div className={`text-xs leading-relaxed ${s.body}`}>{children}</div>
    </div>
  );
}

export default AlertCard;
