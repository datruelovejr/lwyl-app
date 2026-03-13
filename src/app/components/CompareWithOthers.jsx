'use client';

import { useState } from "react";
import { C } from "../constants/colors";
import { discFull, getDom } from "../constants/data";
import { calculateFriction } from "../utils/friction";
import { Btn } from "./Btn";
import { Bias } from "./Bias";

// ────── COMPARE WITH OTHERS MODAL ──────
export function CompareWithOthers({ person, team, onClose, photos = {} }) {
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const p = person;
  const otherMembers = team.filter(m => m.id !== p.id && m.status !== "pending");
  const selectedMember = otherMembers.find(m => m.id === selectedMemberId);

  // Calculate team averages
  const teamAvgs = {
    disc: { D: 0, I: 0, S: 0, C: 0 },
    values: {},
    attr: { Heart: 0, Hand: 0, Head: 0 }
  };

  if (otherMembers.length > 0) {
    otherMembers.forEach(m => {
      ["D", "I", "S", "C"].forEach(d => { teamAvgs.disc[d] += m.disc.natural[d]; });
      Object.keys(m.values).forEach(v => { teamAvgs.values[v] = (teamAvgs.values[v] || 0) + m.values[v]; });
      m.attr.ext.forEach(a => { teamAvgs.attr[a.label] += a.score; });
    });
    ["D", "I", "S", "C"].forEach(d => { teamAvgs.disc[d] = Math.round(teamAvgs.disc[d] / otherMembers.length); });
    Object.keys(teamAvgs.values).forEach(v => { teamAvgs.values[v] = Math.round(teamAvgs.values[v] / otherMembers.length); });
    Object.keys(teamAvgs.attr).forEach(a => { teamAvgs.attr[a] = +(teamAvgs.attr[a] / otherMembers.length).toFixed(1); });
  }

  // Calculate differences from team average
  const discDiffs = ["D", "I", "S", "C"].map(d => ({
    dim: d,
    person: p.disc.natural[d],
    avg: teamAvgs.disc[d],
    diff: p.disc.natural[d] - teamAvgs.disc[d]
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const valuesDiffs = Object.entries(p.values).map(([name, score]) => ({
    name,
    person: score,
    avg: teamAvgs.values[name] || 50,
    diff: score - (teamAvgs.values[name] || 50)
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const attrDiffs = p.attr.ext.map(a => ({
    label: a.label,
    person: a.score,
    avg: teamAvgs.attr[a.label] || 5,
    diff: a.score - (teamAvgs.attr[a.label] || 5)
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  // Side-by-side comparison helper
  const SideBySide = ({ member }) => {
    if (!member) return null;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Person */}
        <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ background: "#1F2937", padding: "10px 14px", color: "#fff", fontWeight: 600, fontSize: 13 }}>{p.name}</div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>DISC</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["D","I","S","C"].map(d => (
                <span key={d} style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: C.disc[d], color: d === "I" ? "#111" : "#fff" }}>{d}:{p.disc.natural[d]}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>TOP VALUES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {Object.entries(p.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).slice(0,3).map(([v, score]) => (
                <div key={v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[v] }} />
                  <span>{v}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 600 }}>{score}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>DECISION STYLE</div>
            {[...p.attr.ext].sort((a,b) => b.score - a.score).map((a, i) => (
              <div key={a.label} style={{ fontSize: 11, marginBottom: 2 }}>{i+1}. {a.label} ({a.score})</div>
            ))}
          </div>
        </div>
        {/* Selected member */}
        <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ background: C.blue, padding: "10px 14px", color: "#fff", fontWeight: 600, fontSize: 13 }}>{member.name}</div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>DISC</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["D","I","S","C"].map(d => (
                <span key={d} style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: C.disc[d], color: d === "I" ? "#111" : "#fff" }}>{d}:{member.disc.natural[d]}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>TOP VALUES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {Object.entries(member.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).slice(0,3).map(([v, score]) => (
                <div key={v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[v] }} />
                  <span>{v}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 600 }}>{score}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>DECISION STYLE</div>
            {[...member.attr.ext].sort((a,b) => b.score - a.score).map((a, i) => (
              <div key={a.label} style={{ fontSize: 11, marginBottom: 2 }}>{i+1}. {a.label} ({a.score})</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(900px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Compare {p.name} with Others</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{otherMembers.length} team members available for comparison</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)" }}>✕</button>
        </div>

        <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>

          {/* Member Selector - Always visible */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: C.text, marginBottom: 6, display: "block" }}>Select a team member to compare with {p.name.split(" ")[0]}:</label>
            <select
              value={selectedMemberId || ""}
              onChange={e => setSelectedMemberId(e.target.value || null)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, minWidth: 250 }}
            >
              <option value="">Choose a person...</option>
              {otherMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {selectedMember && (
              <button onClick={() => setSelectedMemberId(null)} style={{ marginLeft: 12, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, fontSize: 13, cursor: "pointer" }}>
                ← Back to Team View
              </button>
            )}
          </div>

          {selectedMember ? (
            /* ===== INDIVIDUAL COMPARISON VIEW (Conflict Report) ===== */
            (() => {
              const m = selectedMember;
              const dims = ["D", "I", "S", "C"];

              // Calculate overall friction using shared function
              const friction = calculateFriction(p, m);

              // DISC gap analysis
              const discGaps = dims.map(d => {
                const pScore = p.disc.natural[d];
                const mScore = m.disc.natural[d];
                const gap = Math.abs(pScore - mScore);
                const pHigher = pScore > mScore;
                const tier = gap >= 40 ? "high" : gap >= 20 ? "moderate" : "low";
                let text = "";
                if (tier === "low") {
                  text = `Both around ${Math.round((pScore + mScore) / 2)}. Natural compatibility here.`;
                } else if (pHigher) {
                  if (d === "D") text = `${p.name.split(" ")[0]}'s D is ${pScore}, ${m.name.split(" ")[0]}'s is ${mScore}. ${p.name.split(" ")[0]} pushes for decisions and speed; ${m.name.split(" ")[0]} needs time to evaluate.`;
                  if (d === "I") text = `${p.name.split(" ")[0]}'s I is ${pScore}, ${m.name.split(" ")[0]}'s is ${mScore}. ${p.name.split(" ")[0]} communicates with energy; ${m.name.split(" ")[0]} prefers data over enthusiasm.`;
                  if (d === "S") text = `${p.name.split(" ")[0]}'s S is ${pScore}, ${m.name.split(" ")[0]}'s is ${mScore}. ${p.name.split(" ")[0]} values stability; ${m.name.split(" ")[0]} is comfortable with change.`;
                  if (d === "C") text = `${p.name.split(" ")[0]}'s C is ${pScore}, ${m.name.split(" ")[0]}'s is ${mScore}. ${p.name.split(" ")[0]} wants precision; ${m.name.split(" ")[0]} wants to move forward quickly.`;
                } else {
                  if (d === "D") text = `${m.name.split(" ")[0]}'s D is ${mScore}, ${p.name.split(" ")[0]}'s is ${pScore}. ${m.name.split(" ")[0]} moves faster and pushes harder.`;
                  if (d === "I") text = `${m.name.split(" ")[0]}'s I is ${mScore}, ${p.name.split(" ")[0]}'s is ${pScore}. ${m.name.split(" ")[0]} needs verbal processing and social energy.`;
                  if (d === "S") text = `${m.name.split(" ")[0]}'s S is ${mScore}, ${p.name.split(" ")[0]}'s is ${pScore}. ${m.name.split(" ")[0]} needs more consistency and predictability.`;
                  if (d === "C") text = `${m.name.split(" ")[0]}'s C is ${mScore}, ${p.name.split(" ")[0]}'s is ${pScore}. ${m.name.split(" ")[0]} needs more specifics and structured expectations.`;
                }
                return { d, pScore, mScore, gap, tier, text };
              });

              const tierStyle = {
                high: { borderColor: "#B71C1C", label: "HIGH", labelColor: "#B71C1C" },
                moderate: { borderColor: "#E65100", label: "MODERATE", labelColor: "#E65100" },
                low: { borderColor: "#2E7D32", label: "LOW", labelColor: "#2E7D32" },
              };

              const tierColors = {
                high: { bg: "#FFEBEE", border: "#EF9A9A", text: "#B71C1C" },
                moderate: { bg: "#FFF3E0", border: "#FFCC80", text: "#E65100" },
                low: { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" }
              };
              const frictionTier = tierColors[friction.tier];

              // Values comparison
              const pTopVals = Object.entries(p.values).filter(([, s]) => s >= 60).map(([k]) => k);
              const mTopVals = Object.entries(m.values).filter(([, s]) => s >= 60).map(([k]) => k);
              const sharedVals = pTopVals.filter(v => mTopVals.includes(v));
              const pOnly = pTopVals.filter(v => !mTopVals.includes(v));
              const mOnly = mTopVals.filter(v => !pTopVals.includes(v));

              // Process bias comparison
              const processBiasResult = (pBias, mBias) => {
                if ((pBias === "+" && mBias === "−") || (pBias === "−" && mBias === "+")) return { label: "CONFLICT", color: "#B71C1C" };
                if (pBias === mBias) return { label: "ALIGNED", color: "#2E7D32" };
                return { label: "TENSION", color: "#E65100" };
              };

              return (
                <div className="conflict-report">
                  {/* Print-friendly header with overall friction score */}
                  <div style={{ marginBottom: 16, padding: "16px 20px", background: frictionTier.bg, borderRadius: 10, border: `1px solid ${frictionTier.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: frictionTier.text, marginBottom: 4 }}>CONFLICT REPORT</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{p.name} & {m.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Friction analysis across Preference, Passion, and Process</div>
                    </div>
                    <div style={{ textAlign: "center", minWidth: 100 }}>
                      <div style={{ fontSize: 36, fontWeight: 800, color: frictionTier.text, lineHeight: 1 }}>{friction.totalScore}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: frictionTier.text, marginTop: 4 }}>{friction.tier.toUpperCase()} FRICTION</div>
                    </div>
                  </div>

                  {/* Three pillars breakdown */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Preference", sub: "DISC Style", score: friction.preferenceScore, max: 12, color: C.disc.D },
                      { label: "Passion", sub: "Values", score: friction.passionScore, max: 14, color: C.values.Altruistic },
                      { label: "Process", sub: "Attributes", score: friction.processScore, max: 9, color: C.attr.ext }
                    ].map(pillar => (
                      <div key={pillar.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>{pillar.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: pillar.score >= pillar.max * 0.5 ? "#C62828" : pillar.score >= pillar.max * 0.25 ? "#E65100" : "#2E7D32", lineHeight: 1.2 }}>{pillar.score}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>{pillar.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Print Report button */}
                  <div style={{ marginBottom: 16, textAlign: "right" }} className="no-print">
                    <button
                      onClick={() => window.print()}
                      style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.text }}
                    >
                      🖨️ Print Report
                    </button>
                  </div>

                  {/* PREFERENCE GAP - DISC */}
                  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PREFERENCE GAP</div>
                      <div style={{ fontSize: 13, color: C.muted }}>How behavioral styles differ across D, I, S, C</div>
                    </div>
                    {/* Score comparison panel */}
                    <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                      <div style={{ flex: 1, padding: "12px 16px", background: C.card, borderLeft: "3px solid #C8A96E" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{p.name}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {dims.map(d => <span key={d} style={{ fontSize: 13, fontWeight: 800, color: C.disc[d] }}>{d}:{p.disc.natural[d]}</span>)}
                        </div>
                      </div>
                      <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: "12px 16px", background: C.card }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.name}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {dims.map(d => <span key={d} style={{ fontSize: 13, fontWeight: 800, color: C.disc[d] }}>{d}:{m.disc.natural[d]}</span>)}
                        </div>
                      </div>
                    </div>
                    {/* Per-dimension gap cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {discGaps.map(({ d, pScore, mScore, gap, tier, text }) => {
                        const ts = tierStyle[tier];
                        return (
                          <div key={d} style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ts.borderColor}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.disc[d], flexShrink: 0 }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: C.disc[d] }}>{discFull[d]}</span>
                              <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: ts.labelColor, background: ts.labelColor + "10", border: `1px solid ${ts.labelColor}25`, borderRadius: 8, padding: "2px 8px" }}>{ts.label}</span>
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                              <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: C.hi, border: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: 9, color: "#9A7A42", fontWeight: 700, marginBottom: 2 }}>{p.name.split(" ")[0]}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{pScore}</div>
                              </div>
                              <div style={{ fontSize: 11, color: tier === "high" ? ts.labelColor : C.muted, fontWeight: 800 }}>Δ{gap}</div>
                              <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: C.hi, border: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 2 }}>{m.name.split(" ")[0]}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{mScore}</div>
                              </div>
                            </div>
                            {tier !== "low" && <div style={{ fontSize: 10, color: C.text, lineHeight: 1.55 }}>{text}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PASSION GAP - Values */}
                  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PASSION GAP</div>
                      <div style={{ fontSize: 13, color: C.muted }}>Motivational driver differences - what energizes each person</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Shared Drivers</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {sharedVals.length > 0 ? sharedVals.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No shared top drivers</span>}
                        </div>
                      </div>
                      <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #E65100" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#A83A00", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{p.name.split(" ")[0]}&apos;s Unique Drivers</div>
                        <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>{p.name.split(" ")[0]} cares about these. {m.name.split(" ")[0]} may not share them</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {pOnly.length > 0 ? pOnly.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No unique drivers</span>}
                        </div>
                      </div>
                      <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #1565C0" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#0D4880", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{m.name.split(" ")[0]}&apos;s Unique Drivers</div>
                        <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>{m.name.split(" ")[0]} cares about these. {p.name.split(" ")[0]} may not share them</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {mOnly.length > 0 ? mOnly.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No unique drivers</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PROCESS GAP - Attributes */}
                  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PROCESS GAP</div>
                      <div style={{ fontSize: 13, color: C.muted }}>Decision-making style - bias comparison per Heart · Hand · Head</div>
                    </div>
                    {/* Side-by-side attribute profiles */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      {[{ label: p.name, data: p.attr.ext, isPrimary: true }, { label: m.name, data: m.attr.ext, isPrimary: false }].map(({ label, data, isPrimary }) => {
                        const sorted = [...data].sort((a, b) => b.score - a.score);
                        return (
                          <div key={label} style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: isPrimary ? "3px solid #C8A96E" : `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: isPrimary ? "#9A7A42" : C.muted, marginBottom: 8 }}>{label}</div>
                            {sorted.map((a, i) => (
                              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                                <span style={{ width: 16, height: 16, borderRadius: "50%", background: i === 0 ? C.attr.ext : C.hi, color: i === 0 ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0, border: `1px solid ${i === 0 ? "transparent" : C.border}` }}>{i + 1}</span>
                                <span style={{ fontSize: 11, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? C.text : C.muted }}>{a.label}</span>
                                <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto" }}>{a.score}</span>
                                <Bias bias={a.bias} />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    {/* Bias-based friction analysis */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {["Heart", "Hand", "Head"].map(label => {
                        const pAttr = p.attr.ext.find(a => a.label === label);
                        const mAttr = m.attr.ext.find(a => a.label === label);
                        if (!pAttr || !mAttr) return null;
                        const result = processBiasResult(pAttr.bias, mAttr.bias);
                        const borderColors = { CONFLICT: "#B71C1C", TENSION: "#E65100", ALIGNED: "#2E7D32" };
                        return (
                          <div key={label} style={{ padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${borderColors[result.label]}`, display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</span>
                              <span style={{ fontSize: 10, color: C.muted, marginLeft: 8 }}>{pAttr.bias} vs. {mAttr.bias}</span>
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 700, color: result.color, background: result.color + "10", border: `1px solid ${result.color}25`, borderRadius: 8, padding: "2px 10px" }}>{result.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* ===== TEAM OVERVIEW (when no member selected) ===== */
            <div>
              {/* Team Comparison Matrix */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>TEAM COMPARISON MATRIX</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: C.hi }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>Team Member</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.disc.D }}>D</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.disc.I }}>I</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.disc.S }}>S</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.disc.C }}>C</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>Style</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>Top Value</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>Leads With</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: "#FFFDE7" }}>
                        <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>★ {p.name}</td>
                        {["D","I","S","C"].map(d => (
                          <td key={d} style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>{p.disc.natural[d]}</td>
                        ))}
                        <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{getDom(p.disc.natural)}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{Object.entries(p.values).sort((a,b) => b[1]-a[1])[0]?.[0] || "-"}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{[...p.attr.ext].sort((a,b) => b.score - a.score)[0]?.label || "-"}</td>
                      </tr>
                      {otherMembers.map(m => (
                        <tr key={m.id} style={{ background: C.card, cursor: "pointer" }} onClick={() => setSelectedMemberId(m.id)}>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, color: C.blue }}>{m.name}</td>
                          {["D","I","S","C"].map(d => {
                            const diff = m.disc.natural[d] - p.disc.natural[d];
                            const highlight = Math.abs(diff) >= 20;
                            return (
                              <td key={d} style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, background: highlight ? (diff > 0 ? "#E3F7E3" : "#FFE8E8") : "transparent", fontWeight: highlight ? 600 : 400 }}>
                                {m.disc.natural[d]}
                              </td>
                            );
                          })}
                          <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{getDom(m.disc.natural)}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{Object.entries(m.values).sort((a,b) => b[1]-a[1])[0]?.[0] || "-"}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{[...m.attr.ext].sort((a,b) => b.score - a.score)[0]?.label || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>
                  Click any row to compare directly ·
                  <span style={{ display: "inline-block", width: 12, height: 12, background: "#E3F7E3", marginLeft: 8, marginRight: 4, verticalAlign: "middle", borderRadius: 2 }}></span> Higher by 20+
                  <span style={{ display: "inline-block", width: 12, height: 12, background: "#FFE8E8", marginLeft: 8, marginRight: 4, verticalAlign: "middle", borderRadius: 2 }}></span> Lower by 20+
                </div>
              </div>

              {/* Difference from Team Averages */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{p.name.split(" ")[0]} vs TEAM AVERAGES</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>DISC vs Team Avg</div>
                    {discDiffs.map(({ dim, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 15;
                      return (
                        <div key={dim} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 8px", borderRadius: 6, background: significant ? (diff > 0 ? "#E3F7E3" : "#FFE8E8") : C.hi }}>
                          <span style={{ fontWeight: 700, color: C.disc[dim], width: 16 }}>{dim}</span>
                          <span style={{ fontSize: 12 }}>{pScore}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>vs</span>
                          <span style={{ fontSize: 12, color: C.muted }}>{avg}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: diff > 0 ? "#2E7D32" : diff < 0 ? "#C62828" : C.muted }}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>Values vs Team Avg</div>
                    {valuesDiffs.slice(0, 4).map(({ name, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 10;
                      return (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 8px", borderRadius: 6, background: significant ? (diff > 0 ? "#E3F7E3" : "#FFE8E8") : C.hi }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[name] }} />
                          <span style={{ fontSize: 11, flex: 1 }}>{name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: diff > 0 ? "#2E7D32" : diff < 0 ? "#C62828" : C.muted }}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>Decision Style vs Team Avg</div>
                    {attrDiffs.map(({ label, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 1;
                      return (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 8px", borderRadius: 6, background: significant ? (diff > 0 ? "#E3F7E3" : "#FFE8E8") : C.hi }}>
                          <span style={{ fontSize: 11, flex: 1 }}>{label}</span>
                          <span style={{ fontSize: 12 }}>{pScore}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>vs</span>
                          <span style={{ fontSize: 12, color: C.muted }}>{avg}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: diff > 0 ? "#2E7D32" : diff < 0 ? "#C62828" : C.muted }}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 8, background: "#FFFDE7", border: "1px solid #FFF59D" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9A7A42", marginBottom: 4 }}>KEY INSIGHT</div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                    {discDiffs[0] && Math.abs(discDiffs[0].diff) >= 15
                      ? `${p.name.split(" ")[0]}'s ${discFull[discDiffs[0].dim]} (${discDiffs[0].person}) is ${Math.abs(discDiffs[0].diff)} points ${discDiffs[0].diff > 0 ? "higher" : "lower"} than the team average (${discDiffs[0].avg}). This is the biggest behavioral difference from the team.`
                      : `${p.name.split(" ")[0]}'s DISC profile is relatively aligned with team averages. Look to Values and Decision Style for differentiation.`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
          <Btn primary onClick={onClose}>Done</Btn>
        </div>
      </div>
    </div>
  );
}
