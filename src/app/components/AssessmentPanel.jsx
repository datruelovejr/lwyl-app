'use client';

import { useState, useRef, useEffect } from "react";
import { C } from "../constants/colors";

/**
 * Full-screen modal that loads the Innermetrix assessment inside an iFrame.
 * The user never leaves LWYL. The header stays. The brand stays.
 *
 * Props:
 *  - assessmentUrl: string — the org's Innermetrix white-label URL
 *  - orgName: string — the org name for display
 *  - onClose: () => void — called when panel is closed
 *  - isMobile: boolean
 */
export function AssessmentPanel({ assessmentUrl, orgName, onClose, isMobile }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);

  // Detect if iframe fails to load (X-Frame-Options block)
  useEffect(() => {
    if (!assessmentUrl) return;
    timeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) setIframeError(true);
    }, 15000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [assessmentUrl, iframeLoaded]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: C.bg, display: "flex", flexDirection: "column" }}>

      {/* LWYL Header */}
      <div style={{ background: "#1A1A18", color: "#fff", height: 48, padding: isMobile ? "0 12px" : "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#C8A96E", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {isMobile ? "BTCG" : "BTCG · Bridging the Connection Gap"}
          </div>
          <div style={{ width: 1, height: 20, background: "#4B5563" }} />
          <div style={{ fontSize: 13, color: "#9CA3AF" }}>
            Assessment — <span style={{ color: "#fff", fontWeight: 600 }}>{orgName}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #4B5563", background: "transparent", color: "#9CA3AF", fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#9CA3AF"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#4B5563"; e.currentTarget.style.color = "#9CA3AF"; }}
        >
          Close Assessment
        </button>
      </div>

      {/* iFrame area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Loading spinner */}
        {!iframeLoaded && !iframeError && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, zIndex: 1 }}>
            <div style={{
              width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.blue,
              borderRadius: "50%", animation: "lwyl-spin 0.8s linear infinite", marginBottom: 16
            }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>Loading Assessment</div>
            <div style={{ fontSize: 13, color: C.muted }}>Preparing the assessment for {orgName}...</div>
          </div>
        )}

        {/* Fallback if iFrame is blocked */}
        {iframeError && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, zIndex: 2, padding: 24 }}>
            <div style={{ textAlign: "center", maxWidth: 480 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 12 }}>Assessment Loading Issue</div>
              <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
                The assessment provider may be blocking embedded loading. You can open it directly instead.
              </div>
              <a
                href={assessmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "14px 32px", borderRadius: 8, border: "none", background: C.blue, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "none", marginBottom: 12 }}
              >
                Open Assessment in New Tab
              </a>
              <br />
              <button onClick={onClose} style={{ padding: "10px 24px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 14, cursor: "pointer", marginTop: 8 }}>
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* The iFrame */}
        <iframe
          ref={iframeRef}
          src={assessmentUrl}
          onLoad={handleIframeLoad}
          title={`Assessment for ${orgName}`}
          style={{
            width: "100%", height: "100%", border: "none",
            opacity: iframeLoaded && !iframeError ? 1 : 0,
            transition: "opacity 0.3s ease"
          }}
          allow="camera; microphone"
        />
      </div>

      <style>{`
        @keyframes lwyl-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
