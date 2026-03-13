'use client';

import { useState } from "react";
import { C } from "../constants/colors";
import { discFull } from "../constants/data";
import { calculateFriction } from "../utils/friction";
import { Btn } from "./Btn";

// ────── FRICTION MAP COMPONENT ──────
export function FrictionMap({ people, teamId, orgId, onClose, onViewComparison }) {
  const [selectedPair, setSelectedPair] = useState(null);
  const members = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending" && p.disc);

  if (members.length < 2) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
        <div className="modal-body" style={{ background: C.card, borderRadius: 12, padding: 48, maxWidth: 400, textAlign: "center", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Not Enough Data</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>Need at least 2 team members with complete assessments to generate a friction map.</div>
          <Btn primary onClick={onClose}>Close</Btn>
        </div>
      </div>
    );
  }

  // Calculate all pairwise friction
  const frictionMatrix = {};
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const key = `${members[i].id}-${members[j].id}`;
      frictionMatrix[key] = {
        personA: members[i],
        personB: members[j],
        friction: calculateFriction(members[i], members[j])
      };
    }
  }

  const getFriction = (idA, idB) => {
    if (idA === idB) return null;
    const key1 = `${idA}-${idB}`;
    const key2 = `${idB}-${idA}`;
    return frictionMatrix[key1] || frictionMatrix[key2];
  };

  const tierColors = {
    high: { bg: "#FFEBEE", border: "#EF9A9A", text: "#B71C1C" },
    moderate: { bg: "#FFF3E0", border: "#FFCC80", text: "#E65100" },
    low: { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" }
  };

  // Detail view for selected pair
  if (selectedPair) {
    const { personA, personB, friction } = selectedPair;
    const tierStyle = tierColors[friction.tier];

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
        <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(700px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
          {/* Header */}
          <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Friction Analysis</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{personA.name} & {personB.name}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setSelectedPair(null)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back to Map</button>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          <div style={{ padding: "24px 32px" }}>
            {/* Overall score */}
            <div style={{ background: tierStyle.bg, border: `1px solid ${tierStyle.border}`, borderRadius: 10, padding: 20, marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: tierStyle.text, marginBottom: 6 }}>OVERALL FRICTION</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: tierStyle.text, lineHeight: 1 }}>{friction.totalScore}</div>
              <div style={{ fontSize: 13, color: tierStyle.text, fontWeight: 600, marginTop: 4 }}>{friction.tier.toUpperCase()} FRICTION</div>
            </div>

            {/* Four pillars breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Preference", sub: "DISC Style Gaps", score: friction.preferenceScore, max: 12, color: C.disc.D },
                { label: "Passion", sub: "Values Gap", score: friction.passionScore, max: 14, color: C.values.Altruistic },
                { label: "Process", sub: "Bias Conflicts", score: friction.processScore, max: 9, color: C.attr.ext },
                { label: "Internal", sub: "Self-Perception", score: friction.internalScore, max: 9, color: C.attr.int }
              ].map(p => (
                <div key={p.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: p.score >= p.max * 0.5 ? "#C62828" : p.score >= p.max * 0.25 ? "#E65100" : "#2E7D32", lineHeight: 1 }}>{p.score}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{p.sub}</div>
                </div>
              ))}
            </div>

            {/* Priority Friction Areas */}
            {(() => {
              const allPoints = [
                ...friction.discGaps.map(g => ({ label: `Preference: ${g.dim} (${["D","I","S","C"].includes(g.dim) ? {D:"Dominance",I:"Influence",S:"Steadiness",C:"Compliance"}[g.dim] : g.dim})`, score: g.tier === "high" ? 3 : g.tier === "moderate" ? 1 : 0, tier: g.tier, detail: `${personA.name.split(" ")[0]}: ${g.aScore} · ${personB.name.split(" ")[0]}: ${g.bScore} · Gap: ${g.gap}` })),
                ...friction.valuesDetail.valGaps.map(g => ({ label: `Passion: ${g.dim}`, score: g.tier === "high" ? 3 : g.tier === "moderate" ? 1 : 0, tier: g.tier, detail: `${personA.name.split(" ")[0]}: ${g.aScore} · ${personB.name.split(" ")[0]}: ${g.bScore} · Gap: ${g.gap}` })),
                ...friction.processResults.map(r => ({ label: `Process: ${r.label}`, score: r.score, tier: r.resultType === "conflict" ? "high" : r.resultType === "tension" ? "moderate" : "low", detail: `${personA.name.split(" ")[0]}: ${r.aScore} (${r.aBias}) · ${personB.name.split(" ")[0]}: ${r.bScore} (${r.bBias})` })),
                ...friction.internalResults.map(r => ({ label: `Internal: ${r.name}`, score: r.score, tier: r.resultType === "conflict" ? "high" : r.resultType === "tension" ? "moderate" : "low", detail: `${personA.name.split(" ")[0]}: ${r.aScore} (${r.aBias}) · ${personB.name.split(" ")[0]}: ${r.bScore} (${r.bBias})` })),
              ].filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

              if (allPoints.length === 0) return null;
              return (
                <div style={{ background: "#1F2937", borderRadius: 10, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Priority Friction Areas</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {allPoints.map((p, i) => {
                      const tierColor = p.tier === "high" ? "#EF9A9A" : p.tier === "moderate" ? "#FFCC80" : "#A5D6A7";
                      const tierText = p.tier === "high" ? "#B71C1C" : p.tier === "moderate" ? "#E65100" : "#2E7D32";
                      return (
                        <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{p.label}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{p.detail}</div>
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: tierText, background: tierColor, padding: "2px 10px", borderRadius: 8, flexShrink: 0 }}>{p.tier.toUpperCase()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* DISC gaps detail */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 12 }}>PREFERENCE GAPS (DISC)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {friction.discGaps.map(g => {
                  const ts = tierColors[g.tier];
                  return (
                    <div key={g.dim} style={{ padding: "10px 12px", borderRadius: 6, background: ts.bg, border: `1px solid ${ts.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: C.disc[g.dim] }}>{discFull[g.dim]}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: ts.text, padding: "2px 8px", borderRadius: 8, background: "#fff" }}>{g.tier.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.text }}>
                        {personA.name.split(" ")[0]}: {g.aScore} · {personB.name.split(" ")[0]}: {g.bScore} · Gap: {g.gap}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Values detail - per-dimension gap scores */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 12 }}>PASSION GAPS (VALUES)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {friction.valuesDetail.valGaps.filter(g => g.tier !== "low").map(g => {
                  const ts = tierColors[g.tier];
                  return (
                    <div key={g.dim} style={{ padding: "10px 12px", borderRadius: 6, background: ts.bg, border: `1px solid ${ts.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: C.values[g.dim] || C.text }}>{g.dim}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: ts.text, padding: "2px 8px", borderRadius: 8, background: "#fff" }}>{g.tier.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.text }}>
                        {personA.name.split(" ")[0]}: {g.aScore} · {personB.name.split(" ")[0]}: {g.bScore} · Gap: {g.gap}
                      </div>
                    </div>
                  );
                })}
              </div>
              {friction.valuesDetail.valGaps.filter(g => g.tier !== "low").length === 0 && (
                <div style={{ fontSize: 12, color: C.muted, padding: 8 }}>No significant value gaps (all below 20 points)</div>
              )}
              {friction.valuesDetail.shared.length > 0 && (
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "#E8F5E9", borderLeft: "3px solid #2E7D32", marginTop: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#2E7D32" }}>SHARED TOP DRIVERS: </span>
                  {friction.valuesDetail.shared.map(v => (
                    <span key={v} style={{ fontSize: 11, marginLeft: 6, padding: "2px 8px", borderRadius: 10, background: C.values[v] + "20", color: C.values[v], fontWeight: 600 }}>{v}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Process detail */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 12 }}>PROCESS GAPS (ATTRIBUTES)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {friction.processResults.map(r => {
                  const colors = { conflict: { bg: "#FFEBEE", border: "#B71C1C", text: "#B71C1C" }, tension: { bg: "#FFF3E0", border: "#E65100", text: "#E65100" }, aligned: { bg: "#E8F5E9", border: "#2E7D32", text: "#2E7D32" } };
                  const c = colors[r.resultType];
                  return (
                    <div key={r.label} style={{ padding: "10px 14px", borderRadius: 6, background: c.bg, borderLeft: `3px solid ${c.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.label}</span>
                          <span style={{ fontSize: 11, color: C.muted, marginLeft: 12 }}>{personA.name.split(" ")[0]}: {r.aScore} ({r.aBias}) · {personB.name.split(" ")[0]}: {r.bScore} ({r.bBias})</span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: c.text, padding: "2px 10px", borderRadius: 8, background: "#fff" }}>{r.resultType.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>
                        Gap: {r.scoreGap.toFixed(1)} pts · Driven by: {r.driver === "gap" ? "score gap" : "bias conflict"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Internal Impact detail */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>INTERNAL IMPACT (SELF-PERCEPTION)</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>How each person sees themselves affects how they show up together.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {friction.internalResults.map(r => {
                  const colors = { conflict: { bg: "#FFEBEE", border: "#B71C1C", text: "#B71C1C" }, tension: { bg: "#FFF3E0", border: "#E65100", text: "#E65100" }, aligned: { bg: "#E8F5E9", border: "#2E7D32", text: "#2E7D32" } };
                  const c = colors[r.resultType];
                  return (
                    <div key={r.name} style={{ padding: "10px 14px", borderRadius: 6, background: c.bg, borderLeft: `3px solid ${c.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.name}</span>
                          <span style={{ fontSize: 11, color: C.muted, marginLeft: 12 }}>{personA.name.split(" ")[0]}: {r.aScore} ({r.aBias}) · {personB.name.split(" ")[0]}: {r.bScore} ({r.bBias})</span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: c.text, padding: "2px 10px", borderRadius: 8, background: "#fff" }}>{r.resultType.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>
                        Gap: {r.scoreGap.toFixed(1)} pts · Driven by: {r.driver === "gap" ? "score gap" : "bias pattern"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main heatmap grid view
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(900px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 24, color: "#fff" }}>Friction Map</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{members.length} members · Pairwise conflict potential</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 11, color: C.muted }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: tierColors.low.bg, border: `1px solid ${tierColors.low.border}` }} /> Low Friction</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: tierColors.moderate.bg, border: `1px solid ${tierColors.moderate.border}` }} /> Moderate</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: tierColors.high.bg, border: `1px solid ${tierColors.high.border}` }} /> High Friction</div>
            <div style={{ marginLeft: "auto", fontWeight: 600 }}>Click any cell to see breakdown</div>
          </div>

          {/* Grid */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: members.length * 80 + 150 }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "left", borderBottom: `1px solid ${C.border}` }}></th>
                  {members.map(m => (
                    <th key={m.id} style={{ padding: 8, fontSize: 11, fontWeight: 600, color: C.text, textAlign: "center", borderBottom: `1px solid ${C.border}`, minWidth: 70 }}>
                      {m.name.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((rowPerson, rowIdx) => (
                  <tr key={rowPerson.id}>
                    <td style={{ padding: 8, fontSize: 11, fontWeight: 600, color: C.text, borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                      {rowPerson.name.split(" ")[0]}
                    </td>
                    {members.map((colPerson, colIdx) => {
                      if (rowIdx === colIdx) {
                        return (
                          <td key={colPerson.id} style={{ padding: 6, textAlign: "center", background: "#F5F5F5" }}>
                            <div style={{ width: 40, height: 40, margin: "0 auto", borderRadius: 6, background: "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9E9E9E" }}>-</div>
                          </td>
                        );
                      }
                      // Only show lower triangle (avoid duplicates)
                      if (colIdx > rowIdx) {
                        return <td key={colPerson.id} style={{ padding: 6, background: "#FAFAFA" }}></td>;
                      }
                      const pair = getFriction(rowPerson.id, colPerson.id);
                      if (!pair) return <td key={colPerson.id} style={{ padding: 6 }}></td>;
                      const tc = tierColors[pair.friction.tier];
                      return (
                        <td key={colPerson.id} style={{ padding: 6, textAlign: "center" }}>
                          <button
                            onClick={() => setSelectedPair(pair)}
                            style={{
                              width: 48, height: 48, margin: "0 auto", borderRadius: 8,
                              background: tc.bg, border: `2px solid ${tc.border}`,
                              cursor: "pointer", display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center", transition: "transform 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                          >
                            <div style={{ fontSize: 16, fontWeight: 800, color: tc.text, lineHeight: 1 }}>{pair.friction.totalScore}</div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: tc.text, opacity: 0.8, marginTop: 2 }}>{pair.friction.tier.slice(0, 3).toUpperCase()}</div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top friction pairs */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Highest Friction Pairs</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.values(frictionMatrix)
                .sort((a, b) => b.friction.totalScore - a.friction.totalScore)
                .slice(0, 3)
                .map((pair, i) => {
                  const tc = tierColors[pair.friction.tier];
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedPair(pair)}
                      style={{
                        padding: "12px 16px", borderRadius: 8, background: tc.bg,
                        border: `1px solid ${tc.border}`, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        textAlign: "left"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{pair.personA.name} & {pair.personB.name}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          Preference: {pair.friction.preferenceScore} · Passion: {pair.friction.passionScore} · Process: {pair.friction.processScore} · Internal: {pair.friction.internalScore}
                        </div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: tc.text }}>{pair.friction.totalScore}</div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Team Tax Aggregation */}
          {(() => {
            const pairs = Object.values(frictionMatrix);
            if (pairs.length === 0) return null;

            // PREFERENCE TAX - which DISC dims cause systemic friction
            const discTax = ["D","I","S","C"].map(d => {
              const total = pairs.reduce((sum, p) => sum + p.friction.discGaps.find(g => g.dim === d).score, 0);
              const high = pairs.filter(p => p.friction.discGaps.find(g => g.dim === d).tier === "high").length;
              const discFull = {D:"Dominance",I:"Influence",S:"Steadiness",C:"Compliance"};
              return { dim: d, label: discFull[d], total, high };
            }).sort((a,b) => b.total - a.total);

            // PASSION TAX - which values collide most
            const valDims = ["Aesthetic","Economic","Individualistic","Political","Altruistic","Regulatory","Theoretical"];
            const valTax = valDims.map(v => {
              const total = pairs.reduce((sum, p) => sum + p.friction.valuesDetail.valGaps.find(g => g.dim === v).score, 0);
              const high = pairs.filter(p => p.friction.valuesDetail.valGaps.find(g => g.dim === v).tier === "high").length;
              return { dim: v, total, high };
            }).sort((a,b) => b.total - a.total).slice(0, 3);

            // PROCESS TAX - which external attr causes most friction
            const extLabels = ["Heart","Hand","Head"];
            const procTax = extLabels.map(lbl => {
              const total = pairs.reduce((sum, p) => sum + (p.friction.processResults.find(r => r.label === lbl)?.score || 0), 0);
              const conflicts = pairs.filter(p => p.friction.processResults.find(r => r.label === lbl)?.resultType === "conflict").length;
              return { label: lbl, total, conflicts };
            }).sort((a,b) => b.total - a.total);

            // INTERNAL TAX - which internal attr causes most friction
            const intNames = ["Self-Esteem","Role Awareness","Self-Direction"];
            const intTax = intNames.map(name => {
              const total = pairs.reduce((sum, p) => sum + (p.friction.internalResults.find(r => r.name === name)?.score || 0), 0);
              const conflicts = pairs.filter(p => p.friction.internalResults.find(r => r.name === name)?.resultType === "conflict").length;
              return { name, total, conflicts };
            }).sort((a,b) => b.total - a.total);

            const maxPairs = pairs.length;
            const barColor = (total, max) => total >= max * 0.6 ? "#C62828" : total >= max * 0.3 ? "#E65100" : "#2E7D32";
            const barWidth = (total, max) => max > 0 ? Math.round((total / max) * 100) : 0;
            const maxDisc = discTax[0].total || 1;
            const maxVal = valTax[0].total || 1;
            const maxProc = procTax[0].total || 1;
            const maxInt = intTax[0].total || 1;

            return (
              <div style={{ marginTop: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>Team Tax</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Where this team pays the highest systemic friction cost across all {maxPairs} pair{maxPairs !== 1 ? "s" : ""}.</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                  {/* Preference Tax */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Preference (DISC)</div>
                    {discTax.map(d => (
                      <div key={d.dim} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.label}</span>
                          <span style={{ fontSize: 11, color: C.muted }}>{d.high} high · {d.total} pts</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: C.border }}>
                          <div style={{ height: 6, borderRadius: 3, background: barColor(d.total, maxDisc * 1.2), width: `${barWidth(d.total, maxDisc)}%`, transition: "width 0.3s" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Passion Tax */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Passion (Top Values Gaps)</div>
                    {valTax.map(v => (
                      <div key={v.dim} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v.dim}</span>
                          <span style={{ fontSize: 11, color: C.muted }}>{v.high} high · {v.total} pts</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: C.border }}>
                          <div style={{ height: 6, borderRadius: 3, background: barColor(v.total, maxVal * 1.2), width: `${barWidth(v.total, maxVal)}%`, transition: "width 0.3s" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Process Tax */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Process (External Attributes)</div>
                    {procTax.map(p => (
                      <div key={p.label} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.label}</span>
                          <span style={{ fontSize: 11, color: C.muted }}>{p.conflicts} conflict · {p.total} pts</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: C.border }}>
                          <div style={{ height: 6, borderRadius: 3, background: barColor(p.total, maxProc * 1.2), width: `${barWidth(p.total, maxProc)}%`, transition: "width 0.3s" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Internal Tax */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Internal Impact</div>
                    {intTax.map(p => (
                      <div key={p.name} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.name}</span>
                          <span style={{ fontSize: 11, color: C.muted }}>{p.conflicts} conflict · {p.total} pts</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: C.border }}>
                          <div style={{ height: 6, borderRadius: 3, background: barColor(p.total, maxInt * 1.2), width: `${barWidth(p.total, maxInt)}%`, transition: "width 0.3s" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
