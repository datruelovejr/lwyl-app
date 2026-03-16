'use client';

import { useState } from "react";
import { C } from "../constants/colors";

// ── Shared UI Components ──────────────────────────────────────
// These replace ad-hoc inline styles with consistent patterns.

/** Story card: the primary way insights are shown. Name the people, explain the gap, give a next step. */
export function StoryCard({ accent, title, children, action, onAction }) {
  return (
    <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent || C.accent}`, padding: "16px 20px", marginBottom: 12 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 700, color: accent || C.text, marginBottom: 8 }}>{title}</div>}
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{children}</div>
      {action && (
        <button onClick={onAction} style={{ marginTop: 10, padding: "6px 14px", borderRadius: 6, border: `1px solid ${accent || C.accent}`, background: "transparent", color: accent || C.accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          {action}
        </button>
      )}
    </div>
  );
}

/** Alert card: for warnings, damage signals, risk indicators. */
export function AlertCard({ severity, title, children }) {
  const styles = {
    critical: { bg: "#FEF2F2", border: "#FECACA", accent: "#991B1B", text: "#7F1D1D" },
    warning:  { bg: "#FFF7ED", border: "#FED7AA", accent: "#C2410C", text: "#7C2D12" },
    info:     { bg: "#EFF6FF", border: "#BFDBFE", accent: "#1D4ED8", text: "#1E3A5A" },
    success:  { bg: "#F0FDF4", border: "#BBF7D0", accent: "#15803D", text: "#14532D" },
  };
  const s = styles[severity] || styles.info;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.accent}`, borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
      {title && <div style={{ fontSize: 12, fontWeight: 700, color: s.accent, marginBottom: 6 }}>{title}</div>}
      <div style={{ fontSize: 12, color: s.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

/** Section header with optional badge. */
export function SectionHead({ title, sub, badge, badgeColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {badge && (
        <div style={{ fontSize: 11, fontWeight: 700, color: badgeColor || C.muted, background: `${badgeColor || C.muted}12`, border: `1px solid ${badgeColor || C.muted}30`, padding: "4px 14px", borderRadius: 20 }}>
          {badge}
        </div>
      )}
    </div>
  );
}

/** Metric card: single big number with label. */
export function MetricCard({ value, label, sub, accent }) {
  const color = accent || C.text;
  return (
    <div style={{ flex: "1 1 140px", padding: "14px 16px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/** Person pill: name + optional context tag. Used in lists. */
export function PersonPill({ name, tag, tagColor, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", fontSize: 12, fontWeight: 600, color: C.text }}>
      {name}
      {tag && <span style={{ fontSize: 9, fontWeight: 700, color: tagColor || C.muted, background: `${tagColor || C.muted}15`, padding: "1px 6px", borderRadius: 3 }}>{tag}</span>}
    </button>
  );
}

/** Expandable section: click to reveal. */
export function Expandable({ label, color, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: color || C.accent, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block", fontSize: 10 }}>▶</span>
        {label}
      </button>
      {open && <div style={{ marginTop: 8, paddingLeft: 16 }}>{children}</div>}
    </div>
  );
}

/** Card wrapper: consistent padding, border, shadow. */
export function Card({ children, style }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  );
}
