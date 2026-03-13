'use client';

import { useState } from 'react';
import { C } from '../constants/colors';
import { discFull, isEqualExtProfile } from '../constants/data';
import { Bias } from './Bias';
import { Btn } from './Btn';

// ────── INDIVIDUAL COMPARISON (Sprint 3A) ──────
export function IndividualComparison({ leader, person, agreements, setAgreements, onStartWizard }) {
  const dims = ["D", "I", "S", "C"];

  // DISC gap analysis - thresholds per Friction Finder Facilitator Guide
  // HIGH ≥ 40 pts | MODERATE 20–39 pts | LOW < 20 pts
  const discGaps = dims.map(d => {
    const lScore = leader.disc.natural[d];
    const pScore = person.disc.natural[d];
    const gap = Math.abs(lScore - pScore);
    const leaderHigher = lScore > pScore;
    const tier = gap >= 40 ? "high" : gap >= 20 ? "moderate" : "low";
    let text = "";
    if (tier === "low") {
      text = `Both around ${Math.round((lScore + pScore) / 2)}. Natural compatibility here. Minor differences won't typically create tension.`;
    } else if (leaderHigher) {
      if (d === "D") text = `Your D is ${lScore}, theirs is ${pScore}. You push for decisions and speed. They need time to evaluate risk before committing.`;
      if (d === "I") text = `Your I is ${lScore}, theirs is ${pScore}. You communicate with energy and optimism. They prefer data and facts over enthusiasm.`;
      if (d === "S") text = `Your S is ${lScore}, theirs is ${pScore}. You value stability and consistency. They're comfortable with change and ambiguity.`;
      if (d === "C") text = `Your C is ${lScore}, theirs is ${pScore}. You want precision and process. They want to move forward without every detail nailed down.`;
    } else {
      if (d === "D") text = `Their D is ${pScore}, yours is ${lScore}. They move faster and push harder than you. Give them challenges and autonomy.`;
      if (d === "I") text = `Their I is ${pScore}, yours is ${lScore}. They need verbal processing, recognition, and social energy you may not naturally provide.`;
      if (d === "S") text = `Their S is ${pScore}, yours is ${lScore}. They need more consistency, patience, and predictability than you naturally deliver.`;
      if (d === "C") text = `Their C is ${pScore}, yours is ${lScore}. They need more specifics, clarity, and structured expectations than you naturally provide.`;
    }
    return { d, lScore, pScore, gap, tier, leaderHigher, text };
  });

  // Tier styles - white cards with left-border accents (no colored backgrounds)
  const tierStyle = {
    high:     { borderColor: "#B71C1C", label: "HIGH",     labelColor: "#B71C1C" },
    moderate: { borderColor: "#E65100", label: "MODERATE", labelColor: "#E65100" },
    low:      { borderColor: "#2E7D32", label: "LOW",      labelColor: "#2E7D32" },
  };

  // Process (Attributes) bias comparison - per Friction Finder Guide
  // CONFLICT = + vs −  |  TENSION = + vs = or − vs =  |  ALIGNED = same bias
  const processBiasResult = (lBias, pBias) => {
    if ((lBias === "+" && pBias === "−") || (lBias === "−" && pBias === "+")) return { label: "CONFLICT", color: "#B71C1C" };
    if (lBias === pBias) return { label: "ALIGNED", color: "#2E7D32" };
    return { label: "TENSION", color: "#E65100" };
  };

  // Values comparison
  const leaderTopVals = Object.entries(leader.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const personTopVals = Object.entries(person.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const sharedVals = leaderTopVals.filter(v => personTopVals.includes(v));
  const leaderOnly = leaderTopVals.filter(v => !personTopVals.includes(v));
  const personOnly = personTopVals.filter(v => !leaderTopVals.includes(v));

  // Attributes comparison
  const leaderExtLead = leader.attr.ext.reduce((a, b) => a.score >= b.score ? a : b);
  const personExtLead = person.attr.ext.reduce((a, b) => a.score >= b.score ? a : b);
  const attrInsightMap = {
    Heart: "starts with people. Lead with how this decision affects the team before covering strategy or numbers.",
    Hand: "starts with what works. Show the practical outcome before the theory or the people dynamics.",
    Head: "starts with the system. Give the framework, data, and structure before the human story."
  };

  const existingAgreement = agreements.find(a => a.leaderId === leader.id && a.personId === person.id);

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "14px 18px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "#C8A96E", fontSize: 16 }}>★</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>CLOSING THE DISTANCE - {leader.name} &amp; {person.name}</div>
          <div style={{ fontSize: 11, color: C.muted }}>Friction map across Preference, Passion, and Process</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Btn primary onClick={onStartWizard} style={{ background: existingAgreement ? C.green : C.accent }}>
            {existingAgreement ? "✓ View Agreement" : "Start Connection Agreement"}
          </Btn>
        </div>
      </div>

      {/* DISC Gaps - Preference Friction */}
      <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PREFERENCE GAP</div>
          <div style={{ fontSize: 13, color: C.muted }}>How your behavioral styles differ across D, I, S, C</div>
        </div>
        {/* Score comparison - Comparison Panel style */}
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ flex: 1, padding: "12px 16px", background: C.card, borderLeft: "3px solid #C8A96E" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>★ {leader.name}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {dims.map(d => <span key={d} style={{ fontSize: 13, fontWeight: 800, color: C.disc[d] }}>{d}:{leader.disc.natural[d]}</span>)}
            </div>
          </div>
          <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: "12px 16px", background: C.card }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{person.name}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {dims.map(d => <span key={d} style={{ fontSize: 13, fontWeight: 800, color: C.disc[d] }}>{d}:{person.disc.natural[d]}</span>)}
            </div>
          </div>
        </div>
        {/* Per-dimension gap cards - white with left-border severity accent */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {discGaps.map(({ d, lScore, pScore, gap, tier, text }) => {
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
                    <div style={{ fontSize: 9, color: "#9A7A42", fontWeight: 700, marginBottom: 2 }}>★ Leader</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{lScore}</div>
                  </div>
                  <div style={{ fontSize: 11, color: tier === "high" ? ts.labelColor : C.muted, fontWeight: 800 }}>Δ{gap}</div>
                  <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: C.hi, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 2 }}>Member</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{pScore}</div>
                  </div>
                </div>
                {tier !== "low" && <div style={{ fontSize: 10, color: C.text, lineHeight: 1.55 }}>{text}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Values Comparison - Passion Friction */}
      <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PASSION GAP</div>
          <div style={{ fontSize: 13, color: C.muted }}>Motivational driver differences - what energizes each of you</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Shared Drivers</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {sharedVals.length > 0 ? sharedVals.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No shared top drivers</span>}
            </div>
          </div>
          <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #E65100" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#A83A00", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Your Blind Spot</div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>They care about this - you may not be fueling it</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {personOnly.length > 0 ? personOnly.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No gaps here</span>}
            </div>
          </div>
          <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #1565C0" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#0D4880", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Your Strength</div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>You care about this - they may not notice or share it</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {leaderOnly.length > 0 ? leaderOnly.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No gaps here</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Comparison - Process Friction */}
      <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PROCESS GAP</div>
          <div style={{ fontSize: 13, color: C.muted }}>Decision-making style - bias comparison per Heart · Hand · Head</div>
        </div>
        {/* Side-by-side attribute profiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[{ label: "★ " + leader.name, data: leader.attr.ext, isLeader: true }, { label: person.name, data: person.attr.ext, isLeader: false }].map(({ label, data, isLeader }) => {
            const sorted = [...data].sort((a, b) => b.score - a.score);
            const isEqual = isEqualExtProfile(data);
            return (
              <div key={label} style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: isLeader ? "3px solid #C8A96E" : `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isLeader ? "#9A7A42" : C.muted, marginBottom: 8 }}>{label}{isEqual ? " (Versatile)" : ""}</div>
                {(isEqual ? data : sorted).map((a, i) => (
                  <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: isEqual ? C.attr.ext : (i === 0 ? C.attr.ext : C.hi), color: isEqual ? "#fff" : (i === 0 ? "#fff" : C.muted), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0, border: `1px solid ${isEqual || i === 0 ? "transparent" : C.border}` }}>{isEqual ? "=" : i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: isEqual || i === 0 ? 700 : 400, color: isEqual || i === 0 ? C.text : C.muted }}>{a.label}</span>
                    <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto" }}>{a.score}</span>
                    <Bias bias={a.bias} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {/* Bias-based friction analysis per dimension */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Heart", "Hand", "Head"].map(label => {
            const lAttr = leader.attr.ext.find(a => a.label === label);
            const pAttr = person.attr.ext.find(a => a.label === label);
            if (!lAttr || !pAttr) return null;
            const result = processBiasResult(lAttr.bias, pAttr.bias);
            const borderColors = { CONFLICT: "#B71C1C", TENSION: "#E65100", ALIGNED: "#2E7D32" };
            return (
              <div key={label} style={{ padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${borderColors[result.label]}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</span>
                  <span style={{ fontSize: 10, color: C.muted, marginLeft: 8 }}>★ {lAttr.bias} vs. {pAttr.bias}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: result.color, background: result.color + "10", border: `1px solid ${result.color}25`, borderRadius: 8, padding: "2px 10px" }}>{result.label}</span>
              </div>
            );
          })}
        </div>
        {leaderExtLead.label !== personExtLead.label && (
          <div style={{ marginTop: 10, padding: "12px 16px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, fontSize: 11, color: C.text, lineHeight: 1.6 }}>
            <strong>{person.name.split(" ")[0]}</strong> {attrInsightMap[personExtLead.label]}
          </div>
        )}
      </div>
    </div>
  );
}
