'use client';

import { C } from '../constants/colors';
import { discFull, getDom } from '../constants/data';
import { PhotoAvatar } from './PhotoAvatar';

// ────── SPRINT 4B: TEAM SUMMARY ──────
export function TeamSummary({ people, teamId, orgId, leader, onClose, photos = {}, onUploadPhoto, onViewProfile, onCompare, onShowTips }) {
  const members = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");

  // Generate insight text based on person's profile
  const generateInsight = (p) => {
    const dom = getDom(p.disc.natural);
    const topVals = Object.entries(p.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const extLead = [...p.attr.ext].sort((a, b) => b.score - a.score)[0];
    const firstName = p.name.split(" ")[0];

    let insight = `${firstName} `;

    // DISC-based insight
    if (dom.includes("I") || dom.includes("S")) {
      insight += "tends to focus on the people and process aspects of decisions, requiring collaboration and structure, ";
    } else if (dom.includes("D")) {
      insight += "drives toward results and quick decisions, preferring autonomy and direct communication, ";
    } else {
      insight += "approaches decisions with analytical precision and attention to detail, ";
    }

    // Attribute-based insight
    if (extLead.label === "Heart") {
      insight += "while prioritizing emotional considerations.";
    } else if (extLead.label === "Hand") {
      insight += "while prioritizing practical outcomes.";
    } else {
      insight += "while undervaluing emotional considerations.";
    }

    return insight;
  };

  const summaryCard = (p) => {
    const dom = getDom(p.disc.natural);
    const domStyles = dom.split("/").map(d => discFull[d]);
    const topVals = Object.entries(p.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const extSorted = [...p.attr.ext].sort((a, b) => b.score - a.score);

    return (
      <div key={p.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, pageBreakInside: "avoid", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: 16 }}>
        {/* Card header */}
        <div style={{ background: "#1F2937", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <PhotoAvatar personId={p.id} name={p.name} bgColor="rgba(255,255,255,0.2)" photo={photos[p.id]} onUpload={onUploadPhoto} size={40} square={false} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{p.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>Love Where You Lead - Member Summary</div>
          </div>
        </div>

        {/* Three-column content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 0 }}>

          {/* LEFT: Leadership Style + DISC + Top Drivers */}
          <div style={{ padding: "16px 20px", borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>LEADERSHIP STYLE</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {domStyles.map(style => (
                <span key={style} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "#FFC107", color: "#1F2937" }}>{style}</span>
              ))}
            </div>

            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>Natural DISC scores</div>
            <div style={{ fontSize: 12, color: C.text, marginBottom: 14 }}>
              {["D","I","S","C"].map(d => (
                <span key={d} style={{ marginRight: 8 }}>
                  <span style={{ color: C.disc[d], fontWeight: 600 }}>{d}:</span>{p.disc.natural[d]}
                </span>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>TOP DRIVERS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {topVals.length > 0 ? topVals.slice(0, 4).map(v => (
                <div key={v} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[v], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.text }}>{v}</span>
                </div>
              )) : <div style={{ fontSize: 12, color: C.muted }}>No strong drivers</div>}
            </div>
          </div>

          {/* MIDDLE: Decision Style (Attributes) */}
          <div style={{ padding: "16px 20px", borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>DECISION STYLE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {extSorted.map(a => {
                const biasColor = a.bias === "+" ? "#2E7D32" : a.bias === "−" ? "#E65100" : C.muted;
                const biasText = a.bias === "+" ? "Requires" : a.bias === "−" ? "Undervalues" : "Balanced";
                return (
                  <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: a.bias === "+" ? "#F0FAF0" : a.bias === "−" ? "#FFF8F5" : C.hi, borderLeft: `3px solid ${biasColor}` }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text, minWidth: 40 }}>{a.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: biasColor }}>{a.score}</span>
                    <span style={{ fontSize: 10, color: biasColor, fontWeight: 600 }}>{biasText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: What Your Leader Learned + Go Deeper */}
          <div style={{ padding: "16px 20px", background: "#FFFDE7" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>WHAT YOUR LEADER LEARNED</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>
              {leader ? generateInsight(p) : "Designate a leader to see personalized insights"}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>GO DEEPER</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => { onClose(); onViewProfile?.(p.id); }} style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: C.blue, cursor: "pointer", textAlign: "left", textDecoration: "underline" }}>View full profile</button>
              <button onClick={() => { onClose(); onCompare?.(p.id); }} style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: C.blue, cursor: "pointer", textAlign: "left", textDecoration: "underline" }}>Compare with others</button>
              <button onClick={() => { onClose(); onShowTips?.(p.id); }} style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: C.blue, cursor: "pointer", textAlign: "left", textDecoration: "underline" }}>See leadership tips</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(1000px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 32, color: "#fff" }}>Team Summary</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{members.length} members · Love Where You Lead</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Print All</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ padding: "32px 48px" }}>
          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>No complete assessments to summarize.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {members.map(p => summaryCard(p))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
