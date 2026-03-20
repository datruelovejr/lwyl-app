'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { discFull, getDom } from "../constants/data";
import { calculateFriction } from "../utils/friction";
import { Btn } from "./Btn";
import { Bias } from "./Bias";
import { Card } from "./ui/Card";

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
      <div className="grid grid-cols-2 gap-4">
        {/* Person */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="bg-nav px-3.5 py-2.5 text-white font-semibold text-[13px]">{p.name}</div>
          <div className="p-3.5">
            <div className="text-[10px] font-bold text-muted mb-1.5">DISC</div>
            <div className="flex gap-1.5 mb-3">
              {["D","I","S","C"].map(d => (
                <span key={d} className="px-2 py-1 rounded text-[11px] font-bold" style={{ background: `var(--disc-${d.toLowerCase()})`, color: d === "I" ? "var(--text-primary)" : "var(--bg-card)" }}>{d}:{p.disc.natural[d]}</span>
              ))}
            </div>
            <div className="text-[10px] font-bold text-muted mb-1.5">TOP VALUES</div>
            <div className="flex flex-col gap-1 mb-3">
              {Object.entries(p.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).slice(0,3).map(([v, score]) => (
                <div key={v} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--values-${v.toLowerCase()})` }} />
                  <span>{v}</span>
                  <span className="ml-auto font-semibold">{score}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] font-bold text-muted mb-1.5">DECISION STYLE</div>
            {[...p.attr.ext].sort((a,b) => b.score - a.score).map((a, i) => (
              <div key={a.label} className="text-[11px] mb-0.5">{i+1}. {a.label} ({a.score})</div>
            ))}
          </div>
        </div>
        {/* Selected member */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-3.5 py-2.5 text-white font-semibold text-[13px]" style={{ background: "var(--disc-c)" }}>{member.name}</div>
          <div className="p-3.5">
            <div className="text-[10px] font-bold text-muted mb-1.5">DISC</div>
            <div className="flex gap-1.5 mb-3">
              {["D","I","S","C"].map(d => (
                <span key={d} className="px-2 py-1 rounded text-[11px] font-bold" style={{ background: `var(--disc-${d.toLowerCase()})`, color: d === "I" ? "var(--text-primary)" : "var(--bg-card)" }}>{d}:{member.disc.natural[d]}</span>
              ))}
            </div>
            <div className="text-[10px] font-bold text-muted mb-1.5">TOP VALUES</div>
            <div className="flex flex-col gap-1 mb-3">
              {Object.entries(member.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).slice(0,3).map(([v, score]) => (
                <div key={v} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--values-${v.toLowerCase()})` }} />
                  <span>{v}</span>
                  <span className="ml-auto font-semibold">{score}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] font-bold text-muted mb-1.5">DECISION STYLE</div>
            {[...member.attr.ext].sort((a,b) => b.score - a.score).map((a, i) => (
              <div key={a.label} className="text-[11px] mb-0.5">{i+1}. {a.label} ({a.score})</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center z-300 overflow-y-auto px-4 py-6" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="modal-body bg-card rounded-xl w-full max-w-[900px] shadow-xl">
        {/* Header */}
        <div className="bg-nav text-white rounded-t-xl px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-xl text-white">Compare {p.name} with Others</h2>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>{otherMembers.length} team members available for comparison</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border-none cursor-pointer text-lg" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>{"\u2715"}</button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">

          {/* Member Selector - Always visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-5"
          >
            <label className="text-xs text-foreground mb-1.5 block">Select a team member to compare with {p.name.split(" ")[0]}:</label>
            <select
              value={selectedMemberId || ""}
              onChange={e => setSelectedMemberId(e.target.value || null)}
              className="px-3.5 py-2.5 rounded-lg border border-border text-sm min-w-[250px]"
            >
              <option value="">Choose a person...</option>
              {otherMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {selectedMember && (
              <button onClick={() => setSelectedMemberId(null)} className="ml-3 px-4 py-2.5 rounded-lg border border-border bg-card text-[13px] cursor-pointer">
                {"\u2190"} Back to Team View
              </button>
            )}
          </motion.div>

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
                high:     { accent: "var(--friction-high)",        label: "HIGH" },
                moderate: { accent: "var(--alert-warning-accent)", label: "MODERATE" },
                low:      { accent: "var(--alert-success-accent)", label: "LOW" },
              };

              const tierBg = {
                high: { bg: "var(--alert-critical-bg)", border: "var(--alert-critical-border)", text: "var(--alert-critical-accent)" },
                moderate: { bg: "var(--alert-warning-bg)", border: "var(--alert-warning-border)", text: "var(--alert-warning-accent)" },
                low: { bg: "var(--alert-success-bg)", border: "var(--alert-success-border)", text: "var(--alert-success-accent)" }
              };
              const frictionTier = tierBg[friction.tier];

              // Values comparison
              const pTopVals = Object.entries(p.values).filter(([, s]) => s >= 60).map(([k]) => k);
              const mTopVals = Object.entries(m.values).filter(([, s]) => s >= 60).map(([k]) => k);
              const sharedVals = pTopVals.filter(v => mTopVals.includes(v));
              const pOnly = pTopVals.filter(v => !mTopVals.includes(v));
              const mOnly = mTopVals.filter(v => !pTopVals.includes(v));

              // Process bias comparison
              const processBiasResult = (pBias, mBias) => {
                if ((pBias === "+" && mBias === "\u2212") || (pBias === "\u2212" && mBias === "+")) return { label: "CONFLICT", accent: "var(--friction-high)" };
                if (pBias === mBias) return { label: "ALIGNED", accent: "var(--alert-success-accent)" };
                return { label: "TENSION", accent: "var(--alert-warning-accent)" };
              };

              return (
                <div className="conflict-report">
                  {/* Print-friendly header with overall friction score */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 px-5 py-4 rounded-[10px] flex items-center justify-between"
                    style={{ background: frictionTier.bg, border: `1px solid ${frictionTier.border}` }}
                  >
                    <div>
                      <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: frictionTier.text }}>CONFLICT REPORT</div>
                      <div className="text-base font-bold text-foreground">{p.name} & {m.name}</div>
                      <div className="text-[11px] text-muted mt-0.5">Friction analysis across Preference, Passion, and Process</div>
                    </div>
                    <div className="text-center min-w-[100px]">
                      <div className="text-4xl font-extrabold leading-none" style={{ color: frictionTier.text }}>{friction.totalScore}</div>
                      <div className="text-[10px] font-bold mt-1" style={{ color: frictionTier.text }}>{friction.tier.toUpperCase()} FRICTION</div>
                    </div>
                  </motion.div>

                  {/* Three pillars breakdown */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="grid grid-cols-3 gap-2.5 mb-4"
                  >
                    {[
                      { label: "Preference", sub: "DISC Style", score: friction.preferenceScore, max: 12, colorVar: "var(--disc-d)" },
                      { label: "Passion", sub: "Values", score: friction.passionScore, max: 14, colorVar: "var(--values-altruistic)" },
                      { label: "Process", sub: "Attributes", score: friction.processScore, max: 9, colorVar: "var(--attr-ext)" }
                    ].map(pillar => (
                      <div key={pillar.label} className="bg-card border border-border rounded-lg p-3 text-center">
                        <div className="text-[9px] font-bold tracking-wider uppercase text-muted">{pillar.label}</div>
                        <div
                          className="text-2xl font-extrabold leading-tight"
                          style={{ color: pillar.score >= pillar.max * 0.5 ? "var(--friction-high)" : pillar.score >= pillar.max * 0.25 ? "var(--alert-warning-accent)" : "var(--alert-success-accent)" }}
                        >
                          {pillar.score}
                        </div>
                        <div className="text-[9px] text-muted">{pillar.sub}</div>
                      </div>
                    ))}
                  </motion.div>

                  {/* Print Report button */}
                  <div className="mb-4 text-right no-print">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-md border border-border bg-card text-xs font-semibold cursor-pointer text-foreground"
                    >
                      {"\ud83d\udda8\ufe0f"} Print Report
                    </button>
                  </div>

                  {/* PREFERENCE GAP - DISC */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="bg-card rounded-xl px-6 py-5 border border-border mb-3.5 shadow-sm"
                  >
                    <div className="mb-3.5">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-1">PREFERENCE GAP</div>
                      <div className="text-[13px] text-muted">How behavioral styles differ across D, I, S, C</div>
                    </div>
                    {/* Score comparison panel */}
                    <div className="flex rounded-[10px] overflow-hidden border border-border mb-3.5">
                      <div className="flex-1 px-4 py-3 bg-card border-l-3" style={{ borderLeftColor: "var(--nav-accent)" }}>
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--nav-accent)" }}>{p.name}</div>
                        <div className="flex gap-2">
                          {dims.map(d => <span key={d} className="text-[13px] font-extrabold" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{d}:{p.disc.natural[d]}</span>)}
                        </div>
                      </div>
                      <div className="w-px bg-border shrink-0" />
                      <div className="flex-1 px-4 py-3 bg-card">
                        <div className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1.5">{m.name}</div>
                        <div className="flex gap-2">
                          {dims.map(d => <span key={d} className="text-[13px] font-extrabold" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{d}:{m.disc.natural[d]}</span>)}
                        </div>
                      </div>
                    </div>
                    {/* Per-dimension gap cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {discGaps.map(({ d, pScore, mScore, gap, tier, text }) => {
                        const ts = tierStyle[tier];
                        return (
                          <div key={d} className="px-3.5 py-3 rounded-lg bg-card border border-border border-l-3" style={{ borderLeftColor: ts.accent }}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: `var(--disc-${d.toLowerCase()})` }} />
                              <span className="text-[11px] font-extrabold" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{discFull[d]}</span>
                              <span
                                className="ml-auto text-[9px] font-bold rounded-lg px-2 py-0.5 border"
                                style={{
                                  color: ts.accent,
                                  backgroundColor: `color-mix(in srgb, ${ts.accent} 8%, transparent)`,
                                  borderColor: `color-mix(in srgb, ${ts.accent} 15%, transparent)`
                                }}
                              >
                                {ts.label}
                              </span>
                            </div>
                            <div className="flex gap-1.5 items-center mb-2">
                              <div className="flex-1 text-center py-1.5 rounded-md bg-subtle border border-border">
                                <div className="text-[9px] font-bold mb-0.5" style={{ color: "var(--nav-accent)" }}>{p.name.split(" ")[0]}</div>
                                <div className="text-lg font-extrabold text-foreground leading-none">{pScore}</div>
                              </div>
                              <div className="text-[11px] font-extrabold" style={{ color: tier === "high" ? ts.accent : "var(--text-muted)" }}>{"\u0394"}{gap}</div>
                              <div className="flex-1 text-center py-1.5 rounded-md bg-subtle border border-border">
                                <div className="text-[9px] font-bold text-muted mb-0.5">{m.name.split(" ")[0]}</div>
                                <div className="text-lg font-extrabold text-foreground leading-none">{mScore}</div>
                              </div>
                            </div>
                            {tier !== "low" && <div className="text-[10px] text-foreground leading-relaxed">{text}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* PASSION GAP - Values */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="bg-card rounded-xl px-6 py-5 border border-border mb-3.5 shadow-sm"
                  >
                    <div className="mb-3.5">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-1">PASSION GAP</div>
                      <div className="text-[13px] text-muted">Motivational driver differences -- what energizes each person</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3" style={{ borderLeftColor: "var(--nav-accent)" }}>
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--nav-accent)" }}>Shared Drivers</div>
                        <div className="flex gap-1 flex-wrap">
                          {sharedVals.length > 0 ? sharedVals.map(v => (
                            <span
                              key={v}
                              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
                              style={{
                                color: `var(--values-${v.toLowerCase()})`,
                                borderColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 20%, transparent)`,
                                backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)`
                              }}
                            >
                              {v}
                            </span>
                          )) : <span className="text-[10px] text-muted">No shared top drivers</span>}
                        </div>
                      </div>
                      <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3" style={{ borderLeftColor: "var(--alert-warning-accent)" }}>
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--alert-warning-accent)" }}>{p.name.split(" ")[0]}&apos;s Unique Drivers</div>
                        <div className="text-[9px] text-muted mb-1.5">{p.name.split(" ")[0]} cares about these. {m.name.split(" ")[0]} may not share them</div>
                        <div className="flex gap-1 flex-wrap">
                          {pOnly.length > 0 ? pOnly.map(v => (
                            <span
                              key={v}
                              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
                              style={{
                                color: `var(--values-${v.toLowerCase()})`,
                                borderColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 20%, transparent)`,
                                backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)`
                              }}
                            >
                              {v}
                            </span>
                          )) : <span className="text-[10px] text-muted">No unique drivers</span>}
                        </div>
                      </div>
                      <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3" style={{ borderLeftColor: "var(--alert-info-accent)" }}>
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--alert-info-accent)" }}>{m.name.split(" ")[0]}&apos;s Unique Drivers</div>
                        <div className="text-[9px] text-muted mb-1.5">{m.name.split(" ")[0]} cares about these. {p.name.split(" ")[0]} may not share them</div>
                        <div className="flex gap-1 flex-wrap">
                          {mOnly.length > 0 ? mOnly.map(v => (
                            <span
                              key={v}
                              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
                              style={{
                                color: `var(--values-${v.toLowerCase()})`,
                                borderColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 20%, transparent)`,
                                backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)`
                              }}
                            >
                              {v}
                            </span>
                          )) : <span className="text-[10px] text-muted">No unique drivers</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* PROCESS GAP - Attributes */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="bg-card rounded-xl px-6 py-5 border border-border mb-3.5 shadow-sm"
                  >
                    <div className="mb-3.5">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-1">PROCESS GAP</div>
                      <div className="text-[13px] text-muted">Decision-making style -- bias comparison per Heart {"\u00b7"} Hand {"\u00b7"} Head</div>
                    </div>
                    {/* Side-by-side attribute profiles */}
                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                      {[{ label: p.name, data: p.attr.ext, isPrimary: true }, { label: m.name, data: m.attr.ext, isPrimary: false }].map(({ label, data, isPrimary }) => {
                        const sorted = [...data].sort((a, b) => b.score - a.score);
                        return (
                          <div
                            key={label}
                            className={`px-3.5 py-3 rounded-lg bg-card border border-border ${isPrimary ? 'border-l-3' : ''}`}
                            style={isPrimary ? { borderLeftColor: "var(--nav-accent)" } : undefined}
                          >
                            <div className="text-[10px] font-bold mb-2" style={{ color: isPrimary ? "var(--nav-accent)" : "var(--text-muted)" }}>{label}</div>
                            {sorted.map((a, i) => (
                              <div key={a.name} className="flex items-center gap-1.5 mb-1.5">
                                <span
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 border"
                                  style={{
                                    background: i === 0 ? "var(--attr-ext)" : "var(--bg-subtle)",
                                    color: i === 0 ? "var(--bg-card)" : "var(--text-muted)",
                                    borderColor: i === 0 ? "transparent" : "var(--border-default)"
                                  }}
                                >
                                  {i + 1}
                                </span>
                                <span className={`text-[11px] ${i === 0 ? 'font-bold text-foreground' : 'font-normal text-muted'}`}>{a.label}</span>
                                <span className="text-[10px] text-muted ml-auto">{a.score}</span>
                                <Bias bias={a.bias} />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    {/* Bias-based friction analysis */}
                    <div className="flex flex-col gap-1.5">
                      {["Heart", "Hand", "Head"].map(label => {
                        const pAttr = p.attr.ext.find(a => a.label === label);
                        const mAttr = m.attr.ext.find(a => a.label === label);
                        if (!pAttr || !mAttr) return null;
                        const result = processBiasResult(pAttr.bias, mAttr.bias);
                        return (
                          <div
                            key={label}
                            className="px-3.5 py-2.5 rounded-lg bg-card border border-border border-l-3 flex items-center gap-3"
                            style={{ borderLeftColor: result.accent }}
                          >
                            <div className="flex-1">
                              <span className="text-xs font-bold text-foreground">{label}</span>
                              <span className="text-[10px] text-muted ml-2">{pAttr.bias} vs. {mAttr.bias}</span>
                            </div>
                            <span
                              className="text-[9px] font-bold rounded-lg px-2.5 py-0.5 border"
                              style={{
                                color: result.accent,
                                backgroundColor: `color-mix(in srgb, ${result.accent} 8%, transparent)`,
                                borderColor: `color-mix(in srgb, ${result.accent} 15%, transparent)`
                              }}
                            >
                              {result.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              );
            })()
          ) : (
            /* ===== TEAM OVERVIEW (when no member selected) ===== */
            <div>
              {/* Team Comparison Matrix */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-7"
              >
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">TEAM COMPARISON MATRIX</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-subtle">
                        <th className="px-3 py-2.5 text-left border-b border-border font-semibold">Team Member</th>
                        <th className="px-2 py-2.5 text-center border-b border-border font-semibold" style={{ color: "var(--disc-d)" }}>D</th>
                        <th className="px-2 py-2.5 text-center border-b border-border font-semibold" style={{ color: "var(--disc-i)" }}>I</th>
                        <th className="px-2 py-2.5 text-center border-b border-border font-semibold" style={{ color: "var(--disc-s)" }}>S</th>
                        <th className="px-2 py-2.5 text-center border-b border-border font-semibold" style={{ color: "var(--disc-c)" }}>C</th>
                        <th className="px-2 py-2.5 text-center border-b border-border font-semibold">Style</th>
                        <th className="px-2 py-2.5 text-center border-b border-border font-semibold">Top Value</th>
                        <th className="px-2 py-2.5 text-center border-b border-border font-semibold">Leads With</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: "var(--alert-warning-bg)" }}>
                        <td className="px-3 py-2.5 border-b border-border font-bold">{"\u2605"} {p.name}</td>
                        {["D","I","S","C"].map(d => (
                          <td key={d} className="px-2 py-2.5 text-center border-b border-border font-semibold">{p.disc.natural[d]}</td>
                        ))}
                        <td className="px-2 py-2.5 text-center border-b border-border">{getDom(p.disc.natural)}</td>
                        <td className="px-2 py-2.5 text-center border-b border-border">{Object.entries(p.values).sort((a,b) => b[1]-a[1])[0]?.[0] || "-"}</td>
                        <td className="px-2 py-2.5 text-center border-b border-border">{[...p.attr.ext].sort((a,b) => b.score - a.score)[0]?.label || "-"}</td>
                      </tr>
                      {otherMembers.map(om => (
                        <tr key={om.id} className="bg-card cursor-pointer hover:bg-subtle" onClick={() => setSelectedMemberId(om.id)}>
                          <td className="px-3 py-2.5 border-b border-border" style={{ color: "var(--disc-c)" }}>{om.name}</td>
                          {["D","I","S","C"].map(d => {
                            const diff = om.disc.natural[d] - p.disc.natural[d];
                            const highlight = Math.abs(diff) >= 20;
                            return (
                              <td
                                key={d}
                                className={`px-2 py-2.5 text-center border-b border-border ${highlight ? 'font-semibold' : ''}`}
                                style={{ background: highlight ? (diff > 0 ? "var(--alert-success-bg)" : "var(--alert-critical-bg)") : "transparent" }}
                              >
                                {om.disc.natural[d]}
                              </td>
                            );
                          })}
                          <td className="px-2 py-2.5 text-center border-b border-border">{getDom(om.disc.natural)}</td>
                          <td className="px-2 py-2.5 text-center border-b border-border">{Object.entries(om.values).sort((a,b) => b[1]-a[1])[0]?.[0] || "-"}</td>
                          <td className="px-2 py-2.5 text-center border-b border-border">{[...om.attr.ext].sort((a,b) => b.score - a.score)[0]?.label || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] text-muted mt-2 flex items-center gap-2 flex-wrap">
                  <span>Click any row to compare directly</span>
                  <span>{"\u00b7"}</span>
                  <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: "var(--alert-success-bg)" }} /> Higher by 20+</span>
                  <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: "var(--alert-critical-bg)" }} /> Lower by 20+</span>
                </div>
              </motion.div>

              {/* Difference from Team Averages */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-4"
              >
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">{p.name.split(" ")[0]} vs TEAM AVERAGES</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card rounded-lg border border-border p-3.5">
                    <div className="text-[11px] font-bold text-muted mb-2.5">DISC vs Team Avg</div>
                    {discDiffs.map(({ dim, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 15;
                      return (
                        <div
                          key={dim}
                          className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md"
                          style={{ background: significant ? (diff > 0 ? "var(--alert-success-bg)" : "var(--alert-critical-bg)") : "var(--bg-subtle)" }}
                        >
                          <span className="font-bold w-4" style={{ color: `var(--disc-${dim.toLowerCase()})` }}>{dim}</span>
                          <span className="text-xs">{pScore}</span>
                          <span className="text-[10px] text-muted">vs</span>
                          <span className="text-xs text-muted">{avg}</span>
                          <span className="ml-auto text-[11px] font-semibold" style={{ color: diff > 0 ? "var(--alert-success-accent)" : diff < 0 ? "var(--friction-high)" : "var(--text-muted)" }}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-card rounded-lg border border-border p-3.5">
                    <div className="text-[11px] font-bold text-muted mb-2.5">Values vs Team Avg</div>
                    {valuesDiffs.slice(0, 4).map(({ name, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 10;
                      return (
                        <div
                          key={name}
                          className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md"
                          style={{ background: significant ? (diff > 0 ? "var(--alert-success-bg)" : "var(--alert-critical-bg)") : "var(--bg-subtle)" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--values-${name.toLowerCase()})` }} />
                          <span className="text-[11px] flex-1">{name}</span>
                          <span className="text-[11px] font-semibold" style={{ color: diff > 0 ? "var(--alert-success-accent)" : diff < 0 ? "var(--friction-high)" : "var(--text-muted)" }}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-card rounded-lg border border-border p-3.5">
                    <div className="text-[11px] font-bold text-muted mb-2.5">Decision Style vs Team Avg</div>
                    {attrDiffs.map(({ label, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 1;
                      return (
                        <div
                          key={label}
                          className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md"
                          style={{ background: significant ? (diff > 0 ? "var(--alert-success-bg)" : "var(--alert-critical-bg)") : "var(--bg-subtle)" }}
                        >
                          <span className="text-[11px] flex-1">{label}</span>
                          <span className="text-xs">{pScore}</span>
                          <span className="text-[10px] text-muted">vs</span>
                          <span className="text-xs text-muted">{avg}</span>
                          <span className="ml-auto text-[11px] font-semibold" style={{ color: diff > 0 ? "var(--alert-success-accent)" : diff < 0 ? "var(--friction-high)" : "var(--text-muted)" }}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-3 px-3.5 py-3 rounded-lg border" style={{ background: "var(--alert-warning-bg)", borderColor: "var(--alert-warning-border)" }}>
                  <div className="text-[11px] font-bold mb-1" style={{ color: "var(--nav-accent)" }}>KEY INSIGHT</div>
                  <div className="text-xs text-foreground leading-relaxed">
                    {discDiffs[0] && Math.abs(discDiffs[0].diff) >= 15
                      ? `${p.name.split(" ")[0]}'s ${discFull[discDiffs[0].dim]} (${discDiffs[0].person}) is ${Math.abs(discDiffs[0].diff)} points ${discDiffs[0].diff > 0 ? "higher" : "lower"} than the team average (${discDiffs[0].avg}). This is the biggest behavioral difference from the team.`
                      : `${p.name.split(" ")[0]}'s DISC profile is relatively aligned with team averages. Look to Values and Decision Style for differentiation.`
                    }
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end">
          <Btn primary onClick={onClose}>Done</Btn>
        </div>
      </div>
    </div>
  );
}
