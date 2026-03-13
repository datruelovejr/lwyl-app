'use client';

import { C } from "../constants/colors";
import { discFull, getDom } from "../constants/data";

const leaderFriction = {
  "D→S": "You move fast. They need time to process. Your speed feels like pressure to them. Their caution feels like resistance to you.",
  "D→C": "You want quick decisions. They want thorough analysis.",
  "D→I": "You're both fast-paced, but you focus on results while they focus on people.",
  "D→D": "You share Dominance as your dominant approach. This creates natural alignment but can also create blind spots.",
  "I→S": "You bring energy and change. They need stability and consistency.",
  "I→C": "You communicate with stories and enthusiasm. They want data and precision.",
  "I→D": "You both move fast, but you lead with connection while they lead with results.",
  "I→I": "You share Influence as your dominant approach. This creates natural alignment but can also create blind spots.",
  "S→D": "You value harmony. They value speed.",
  "S→I": "You both value people, but you prefer steady consistency while they prefer dynamic energy.",
  "S→C": "You both prefer a measured pace, but you prioritize people while they prioritize accuracy.",
  "S→S": "You share Steadiness as your dominant approach. This creates natural alignment but can also create blind spots.",
  "C→D": "You need data before deciding. They need to decide now.",
  "C→I": "You communicate with precision. They communicate with feeling.",
  "C→S": "You both appreciate a steady pace. You focus on getting it right. They focus on keeping it stable.",
  "C→C": "You share Compliance as your dominant approach. This creates natural alignment but can also create blind spots."
};

export function LeaderComparison({ leader, team }) {
  // DISC: leader style vs team style (excluding leader)
  const teamWithout = team.filter(p => p.id !== leader.id && p.status !== "pending");
  const leaderDom = getDom(leader.disc.natural);
  const leaderPrimaryStyle = leaderDom.split("/")[0];

  // Count team dominant styles
  const teamStyleCounts = {};
  teamWithout.forEach(p => {
    const dom = getDom(p.disc.natural);
    dom.split("/").forEach(s => { teamStyleCounts[s] = (teamStyleCounts[s] || 0) + 1; });
  });
  const teamDomStyle = Object.entries(teamStyleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "S";
  const frictionKey = `${leaderPrimaryStyle}→${teamDomStyle}`;
  const frictionText = leaderFriction[frictionKey] || `You lead with ${discFull[leaderPrimaryStyle]}. Your team leans ${discFull[teamDomStyle]}.`;

  // Values: leader top 3 vs team top 3 (excluding leader)
  const leaderTopVals = Object.entries(leader.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const teamValCounts = {};
  teamWithout.forEach(p => { Object.entries(p.values).forEach(([k, s]) => { if (s >= 60) teamValCounts[k] = (teamValCounts[k] || 0) + 1; }); });
  const teamTopVals = Object.entries(teamValCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const sharedVals = leaderTopVals.filter(v => teamTopVals.includes(v));
  const blindSpots = teamTopVals.filter(v => !leaderTopVals.includes(v));
  const unmetNeeds = leaderTopVals.filter(v => !teamTopVals.includes(v));

  // Attributes: leader ext lead vs team avg
  const leaderExt = leader.attr.ext;
  const leaderExtLead = leaderExt.reduce((a, b) => a.score >= b.score ? a : b).label;
  const teamExtAvgs = { Heart: 0, Hand: 0, Head: 0 };
  teamWithout.forEach(p => {
    p.attr.ext.forEach(a => { teamExtAvgs[a.label] = (teamExtAvgs[a.label] || 0) + a.score; });
  });
  const n = teamWithout.length || 1;
  const teamDecisionOrder = Object.entries(teamExtAvgs).map(([k, v]) => [k, +(v / n).toFixed(1)]).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

      {/* Section header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>THE GAP</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#C8A96E", fontSize: 14 }}>★</span>
          <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{leader.name}</span>
          <span style={{ fontSize: 12, color: C.muted }}>· Your style vs. their needs</span>
        </div>
      </div>

      {/* Leadership Style - Comparison Panel */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Leadership Style Gap</div>
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, padding: "16px 18px", background: C.card, borderLeft: `3px solid ${C.disc[leaderPrimaryStyle]}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Your Style</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.disc[leaderPrimaryStyle], lineHeight: 1, marginBottom: 6 }}>{leaderDom}</div>
            <div style={{ fontSize: 10, color: C.muted }}>D:{leader.disc.natural.D} · I:{leader.disc.natural.I} · S:{leader.disc.natural.S} · C:{leader.disc.natural.C}</div>
          </div>
          <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: "16px 18px", background: C.card, borderLeft: `3px solid ${C.disc[teamDomStyle]}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Team Tendency</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.disc[teamDomStyle], lineHeight: 1, marginBottom: 6 }}>{teamDomStyle}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{teamWithout.length} members (excl. leader)</div>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: "12px 16px", background: C.hi, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
          {frictionText}
        </div>
      </div>

      {/* Motivational Driver Gap - Insight Strips */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Motivational Driver Gap</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sharedVals.length > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Common Ground</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {sharedVals.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>)}
              </div>
            </div>
          )}
          {blindSpots.length > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #E65100" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#A83A00", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Your Blind Spot: Team cares about this, you may not</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {blindSpots.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>)}
              </div>
            </div>
          )}
          {unmetNeeds.length > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #1565C0" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#0D4880", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Unmet Need: You care about this, they may not feel it</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {unmetNeeds.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision-Making Gap */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Decision-Making Gap</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto", padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.attr.ext}` }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>You Lead With</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.attr.ext }}>{leaderExtLead}</div>
          </div>
          <div style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Team Decision Order</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {teamDecisionOrder.map(([label, avg], i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: i === 0 ? 800 : 500, color: i === 0 ? C.text : C.muted }}>{i + 1}. {label}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>({avg})</span>
                  {i < 2 && <span style={{ color: C.border, fontSize: 12 }}>→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
