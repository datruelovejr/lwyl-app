'use client';

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { C } from "../constants/colors";
import { discFull, getDom, normBias } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Btn } from "./Btn";
import { Sec } from "./Sec";
import { FrictionMap } from "./FrictionMap";
import { VoiceJournal } from "./VoiceJournal";
import { TeamSummary } from "./TeamSummary";
import { LeaderComparison } from "./LeaderComparison";

export function TeamInsights({ people, teamId, orgId, leaderId, userId, photos = {}, onUploadPhoto, onViewProfile, onCompare, onShowTips }) {
  const isMobile = useIsMobile();
  const [showSummary, setShowSummary] = useState(false);
  const [showFrictionMap, setShowFrictionMap] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const complete = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");
  const pending = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status === "pending");
  const total = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true)).length;
  const leader = leaderId ? people.find(p => p.id === leaderId) : null;

  // ── 1C: DISC Distribution ──
  const discStyleDescs = {
    D: "driven by results, speed, and directness. They need autonomy, challenges, and quick decisions.",
    I: "energized by people, enthusiasm, and collaboration. They need recognition, social interaction, and optimism.",
    S: "anchored by consistency, support, and stability. They need clear expectations, patience, and a steady environment.",
    C: "focused on accuracy, quality, and process. They need clarity, data, and time to analyze."
  };
  const styleCounts = {};
  const dimCounts = { D: 0, I: 0, S: 0, C: 0 };
  complete.forEach(p => {
    const dom = getDom(p.disc.natural);
    styleCounts[dom] = (styleCounts[dom] || 0) + 1;
    dom.split("/").forEach(d => { if (dimCounts[d] !== undefined) dimCounts[d]++; });
  });

  // ── 1D: Values Distribution ──
  const valDescs = {
    Aesthetic: "harmony, balance, beauty, and creative expression",
    Economic: "ROI, efficiency, and practical return on investment",
    Individualistic: "independence, uniqueness, and standing out",
    Political: "control, influence, and leadership position",
    Altruistic: "service, purpose, and helping others",
    Regulatory: "order, structure, rules, and tradition",
    Theoretical: "knowledge, learning, and understanding for its own sake"
  };
  const valCounts = {};
  Object.keys(C.values).forEach(v => { valCounts[v] = 0; });
  complete.forEach(p => {
    Object.entries(p.values).forEach(([v, score]) => { if (score >= 60) valCounts[v]++; });
  });
  const valData = Object.entries(valCounts)
    .map(([name, count]) => ({ name, count, color: C.values[name] }))
    .sort((a, b) => b.count - a.count);

  // ── 1E: Attributes Distribution ──
  const attrInsights = {
    Heart: "They need to understand how decisions affect people. Lead with who is impacted before explaining strategy or numbers.",
    Hand: "They need to know what works and gets results. Lead with practical outcomes before theory or people dynamics.",
    Head: "They need to see the logic and structure. Lead with the framework and data before the human story."
  };
  const attrIcons = { Heart: "❤️", Hand: "✋", Head: "🧠" };
  // Average external scores across team to determine collective decision ORDER
  const attrAvgs = { Heart: 0, Hand: 0, Head: 0 };
  if (complete.length > 0) {
    complete.forEach(p => {
      attrAvgs.Heart += p.attr.ext[0].score;
      attrAvgs.Hand  += p.attr.ext[1].score;
      attrAvgs.Head  += p.attr.ext[2].score;
    });
    attrAvgs.Heart = Math.round((attrAvgs.Heart / complete.length) * 10) / 10;
    attrAvgs.Hand  = Math.round((attrAvgs.Hand  / complete.length) * 10) / 10;
    attrAvgs.Head  = Math.round((attrAvgs.Head  / complete.length) * 10) / 10;
  }
  const decisionOrder = Object.entries(attrAvgs).sort((a, b) => b[1] - a[1]);
  // Also track individual lead counts for secondary display
  const attrCounts = { Heart: 0, Hand: 0, Head: 0 };
  complete.forEach(p => {
    const [emp, pra, sys] = p.attr.ext.map(a => a.score);
    const maxScore = Math.max(emp, pra, sys);
    const minScore = Math.min(emp, pra, sys);
    if (maxScore - minScore <= 0.5) return;
    if (emp === maxScore) attrCounts.Heart++;
    else if (pra === maxScore) attrCounts.Hand++;
    else attrCounts.Head++;
  });

  if (complete.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>No complete assessments in this team yet</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Upload assessments to see team insights</div>
    </div>
  );

  return (
    <div>
      {showSummary && (
        <TeamSummary people={people} teamId={teamId} orgId={orgId} leader={leader} onClose={() => setShowSummary(false)} photos={photos} onUploadPhoto={onUploadPhoto} onViewProfile={onViewProfile} onCompare={onCompare} onShowTips={onShowTips} />
      )}
      {showFrictionMap && (
        <FrictionMap people={people} teamId={teamId} orgId={orgId} onClose={() => setShowFrictionMap(false)} />
      )}
      {showJournal && (
        <VoiceJournal userId={userId} people={people} teamId={teamId} orgId={orgId} onClose={() => setShowJournal(false)} />
      )}
      <div style={{ marginBottom: 20, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-start", justifyContent: "space-between", gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: -0.5 }}>Team Insights</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{complete.length} of {total} members with complete assessments</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={() => setShowJournal(true)} style={{ fontSize: 11 }}>🎙️ Journal</Btn>
          {complete.length > 0 && (
            <>
              <Btn onClick={() => setShowFrictionMap(true)} style={{ fontSize: 11 }}>🔥 Friction</Btn>
              <Btn onClick={() => setShowSummary(true)} style={{ fontSize: 11 }}>📋 Summary</Btn>
            </>
          )}
        </div>
      </div>

      {/* 2B: Completion Tracker */}
      {total > 0 && (
        <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Assessment Completion</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: complete.length === total ? C.green : C.muted }}>{complete.length}/{total} complete</div>
          </div>
          <div style={{ height: 6, background: C.hi, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", width: `${(complete.length / total) * 100}%`, background: complete.length === total ? C.green : C.blue, borderRadius: 3, transition: "width 0.3s" }} />
          </div>
          {pending.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {pending.map(p => (
                <span key={p.id} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#F5F5F5", color: C.muted, border: `1px solid ${C.border}` }}>⏳ {p.name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2A: Leader Comparison */}
      {leader && leader.status !== "pending" && leader.disc && (
        <LeaderComparison leader={leader} team={people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true))} />
      )}

      {/* 1C: DISC Distribution */}
      <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>THE TEAM YOU LEAD</div>
          <div style={{ fontSize: 13, color: C.muted }}>Natural DISC style distribution · {complete.length} assessed members</div>
        </div>
        {/* 4-column DISC card grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 12 : 32 }}>
          {["D", "I", "S", "C"].map(d => {
            const count = dimCounts[d];
            const pct = complete.length > 0 ? Math.round((count / complete.length) * 100) : 0;
            return (
              <div key={d} style={{ background: C.card, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: `4px solid ${C.disc[d]}` }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.disc[d], lineHeight: 1, marginBottom: 8 }}>{d}</div>
                <div style={{ fontSize: 56, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 4 }}>{count}</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>{pct}%</div>
                <div style={{ height: 6, background: C.hi, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: C.disc[d], borderRadius: 4, transition: "width 0.6s ease-out" }} />
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.4 }}>
                  {count > 0
                    ? `${count} ${count === 1 ? "person is" : "people are"} ${discStyleDescs[d]}`
                    : `No ${discFull[d]}-dominant members.`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1D: Values Distribution */}
      <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Sec title="Team Values Distribution" sub="Motivational drivers across your team" color={C.values.Altruistic} />
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Values with score ≥ 60 count as a Top Driver</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={valData} layout="vertical" barSize={24} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
            <XAxis type="number" domain={[0, complete.length]} allowDecimals={false} tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={isMobile ? 70 : 100} tick={{ fontSize: isMobile ? 9 : 10, fontWeight: 600, fill: C.text }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value, name) => [`${value} of ${complete.length} people`, "Top Driver"]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>{valData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {valData.filter(v => v.count > 0).slice(0, 3).map(v => (
            <div key={v.name} style={{ flex: "1 1 200px", padding: "8px 10px", borderRadius: 7, background: C.hi, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: v.color, marginBottom: 3 }}>{v.name} - {v.count} of {complete.length} people</div>
              <div style={{ fontSize: 10, color: C.muted }}>This team is motivated by {valDescs[v.name]}.</div>
            </div>
          ))}
        </div>
      </div>

      {/* KRI Dashboard */}
      {complete.length >= 2 && (() => {
        const intNames = ["Self-Esteem", "Role Awareness", "Self-Direction"];
        const kriColors = { green: "#2E7D32", yellow: "#E65100", red: "#B71C1C" };
        const kriBg = { green: "#E8F5E9", yellow: "#FFF3E0", red: "#FFEBEE" };
        const kriBorder = { green: "#A5D6A7", yellow: "#FFCC80", red: "#EF9A9A" };

        // For each Internal Attribute: avg score, bias distribution, risk level
        const kriData = intNames.map(name => {
          const rows = complete.map(p => {
            const a = p.attr.int.find(a => a.name === name);
            return a ? { score: a.score, bias: normBias(a.bias) } : null;
          }).filter(Boolean);

          const avgScore = rows.length > 0 ? Math.round((rows.reduce((s, r) => s + r.score, 0) / rows.length) * 10) / 10 : 0;
          const minusBias = rows.filter(r => r.bias === "\u2212").length;
          const plusBias  = rows.filter(r => r.bias === "+").length;
          const equalBias = rows.filter(r => r.bias === "=").length;
          const minusPct = rows.length > 0 ? Math.round((minusBias / rows.length) * 100) : 0;

          // Risk: high minus bias + low score = elevated retention risk
          const risk = (minusPct >= 60 || avgScore < 6.0) ? "red"
                     : (minusPct >= 40 || avgScore < 7.0) ? "yellow"
                     : "green";

          const descriptions = {
            "Self-Esteem": {
              green: "Most of your team trusts their own value. They can take feedback without losing footing.",
              yellow: "A meaningful portion of your team may be underselling themselves or waiting for external permission before acting.",
              red: "Self-doubt is systemic here. Your team is likely operating below their actual capability because they don't fully trust their own judgment."
            },
            "Role Awareness": {
              green: "Your team has a clear sense of ownership. People know what's theirs to carry.",
              yellow: "Role ambiguity is creating friction. Some people are overextending while others may be underfilling.",
              red: "Role clarity is a real problem. The team is burning energy on undefined ownership. This shows up as conflict, dropped balls, and quiet resentment."
            },
            "Self-Direction": {
              green: "Your team can lead themselves. They know where they're going and don't need constant redirection.",
              yellow: "Some team members are looking for more direction than you may realize. Ambiguity costs them energy.",
              red: "Your team needs more directional clarity than they're getting. Without it, they default to inaction or wait for you to decide."
            }
          };

          return { name, avgScore, minusBias, plusBias, equalBias, minusPct, risk, total: rows.length, desc: descriptions[name][risk] };
        });

        const overallRisk = kriData.some(k => k.risk === "red") ? "red"
                          : kriData.some(k => k.risk === "yellow") ? "yellow" : "green";
        const riskLabel = { red: "Elevated", yellow: "Watch", green: "Healthy" };

        return (
          <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>KRI Dashboard</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: kriColors[overallRisk], background: kriBg[overallRisk], border: `1px solid ${kriBorder[overallRisk]}`, padding: "3px 12px", borderRadius: 20 }}>{riskLabel[overallRisk]} Risk</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Key Retention Indicators from Internal Attributes across {complete.length} team members.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {kriData.map(k => (
                <div key={k.name} style={{ background: kriBg[k.risk], border: `1px solid ${kriBorder[k.risk]}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{k.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>Avg: <strong style={{ color: k.avgScore < 6.0 ? kriColors.red : k.avgScore < 7.0 ? kriColors.yellow : kriColors.green }}>{k.avgScore}</strong> / 10</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: kriColors[k.risk], background: "#fff", padding: "2px 10px", borderRadius: 8 }}>{riskLabel[k.risk].toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Bias distribution bar */}
                  <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                    {k.plusBias > 0 && <div style={{ flex: k.plusBias, background: "#2E7D32" }} title={`${k.plusBias} Requires (+)`} />}
                    {k.equalBias > 0 && <div style={{ flex: k.equalBias, background: "#1565C0" }} title={`${k.equalBias} Balanced (=)`} />}
                    {k.minusBias > 0 && <div style={{ flex: k.minusBias, background: "#B71C1C" }} title={`${k.minusBias} Undervalues (-)`} />}
                  </div>

                  <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 11, color: C.muted }}>
                    <span style={{ color: "#2E7D32", fontWeight: 600 }}>{k.plusBias} Requires (+)</span>
                    <span style={{ color: "#1565C0", fontWeight: 600 }}>{k.equalBias} Balanced (=)</span>
                    <span style={{ color: "#B71C1C", fontWeight: 600 }}>{k.minusBias} Undervalues (-)</span>
                  </div>

                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{k.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Culture Visibility Model */}
      {complete.length >= 2 && (() => {
        const W = 420, H = 380, PAD = 40;
        const plotW = W - PAD * 2, plotH = H - PAD * 2;

        // For each member: DISC representation (how similar to team avg) and Values representation
        const teamDiscAvg = { D: 0, I: 0, S: 0, C: 0 };
        const teamValAvg = { Aesthetic: 0, Economic: 0, Individualistic: 0, Political: 0, Altruistic: 0, Regulatory: 0, Theoretical: 0 };
        complete.forEach(p => {
          ["D","I","S","C"].forEach(d => { teamDiscAvg[d] += p.disc.natural[d]; });
          Object.keys(teamValAvg).forEach(v => { teamValAvg[v] += p.values[v]; });
        });
        ["D","I","S","C"].forEach(d => { teamDiscAvg[d] /= complete.length; });
        Object.keys(teamValAvg).forEach(v => { teamValAvg[v] /= complete.length; });

        const getRepScores = (p) => {
          const discDiff = ["D","I","S","C"].reduce((s,d) => s + Math.abs(p.disc.natural[d] - teamDiscAvg[d]), 0) / 4;
          const valDiff = Object.keys(teamValAvg).reduce((s,v) => s + Math.abs(p.values[v] - teamValAvg[v]), 0) / 7;
          return {
            discRep: Math.max(0, 100 - discDiff),
            valRep:  Math.max(0, 100 - valDiff)
          };
        };

        const threshold = 65;
        const getQuadrant = (dr, vr) => {
          const hiD = dr >= threshold, hiV = vr >= threshold;
          if (hiD && hiV)  return { label: "Dominant Culture",      color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  desc: "Behavioral and motivational style matches the team's dominant culture." };
          if (!hiD && hiV) return { label: "Behaviorally Silent",   color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  desc: "Shares the team's values but expresses them through a different behavioral style. Often adapting to fit in." };
          if (hiD && !hiV) return { label: "Motivationally Silent", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)",  desc: "Looks like they fit in behaviorally, but their internal drivers differ from the dominant culture." };
          return                  { label: "Invisible Culture",      color: "#EF4444", bg: "rgba(239,68,68,0.08)",   desc: "Differs from the dominant culture in both behavior and motivation. Highest risk of quiet disengagement." };
        };

        const plotData = complete.map(p => {
          const { discRep, valRep } = getRepScores(p);
          const q = getQuadrant(discRep, valRep);
          const x = PAD + (discRep / 100) * plotW;
          const y = PAD + ((100 - valRep) / 100) * plotH;
          return { ...p, discRep, valRep, quadrant: q, x, y };
        });

        const [hovered, setHovered] = useState(null);

        // Count per quadrant
        const qCounts = {};
        plotData.forEach(p => { qCounts[p.quadrant.label] = (qCounts[p.quadrant.label] || 0) + 1; });
        const qDefs = [
          { label: "Dominant Culture",      color: "#F59E0B" },
          { label: "Behaviorally Silent",   color: "#3B82F6" },
          { label: "Motivationally Silent", color: "#8B5CF6" },
          { label: "Invisible Culture",     color: "#EF4444" }
        ];

        return (
          <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Culture Visibility Model</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Who shapes the culture - and who's adapting silently to fit into it.</div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {/* SVG Plot */}
              <div style={{ flex: "1 1 400px" }}>
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
                  {/* Quadrant backgrounds */}
                  <rect x={PAD} y={PAD} width={plotW/2} height={plotH/2} fill="rgba(59,130,246,0.06)" />
                  <rect x={PAD+plotW/2} y={PAD} width={plotW/2} height={plotH/2} fill="rgba(245,158,11,0.06)" />
                  <rect x={PAD} y={PAD+plotH/2} width={plotW/2} height={plotH/2} fill="rgba(239,68,68,0.06)" />
                  <rect x={PAD+plotW/2} y={PAD+plotH/2} width={plotW/2} height={plotH/2} fill="rgba(139,92,246,0.06)" />

                  {/* Divider lines */}
                  <line x1={PAD} y1={PAD+plotH/2} x2={PAD+plotW} y2={PAD+plotH/2} stroke={C.border} strokeWidth={1} strokeDasharray="4,4" />
                  <line x1={PAD+plotW/2} y1={PAD} x2={PAD+plotW/2} y2={PAD+plotH} stroke={C.border} strokeWidth={1} strokeDasharray="4,4" />

                  {/* Quadrant labels */}
                  <text x={PAD+plotW/4} y={PAD+14} textAnchor="middle" fontSize={9} fill="#3B82F6" fontWeight="700">BEHAVIORALLY SILENT</text>
                  <text x={PAD+plotW*3/4} y={PAD+14} textAnchor="middle" fontSize={9} fill="#F59E0B" fontWeight="700">DOMINANT CULTURE</text>
                  <text x={PAD+plotW/4} y={PAD+plotH-6} textAnchor="middle" fontSize={9} fill="#EF4444" fontWeight="700">INVISIBLE CULTURE</text>
                  <text x={PAD+plotW*3/4} y={PAD+plotH-6} textAnchor="middle" fontSize={9} fill="#8B5CF6" fontWeight="700">MOTIVATIONALLY SILENT</text>

                  {/* Axis labels */}
                  <text x={PAD} y={PAD-8} textAnchor="start" fontSize={9} fill={C.muted}>Low DISC Fit</text>
                  <text x={PAD+plotW} y={PAD-8} textAnchor="end" fontSize={9} fill={C.muted}>High DISC Fit</text>
                  <text x={PAD-8} y={PAD+12} textAnchor="end" fontSize={9} fill={C.muted} transform={`rotate(-90, ${PAD-10}, ${PAD+plotH/2})`}>High Values Fit</text>

                  {/* People dots */}
                  {plotData.map((p, i) => {
                    const initials = p.name.split(" ").map(w=>w[0]).join("").slice(0,2);
                    const isHov = hovered === p.id;
                    return (
                      <g key={p.id} onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
                        <circle cx={p.x} cy={p.y} r={isHov ? 20 : 16} fill={p.quadrant.color} opacity={0.9} />
                        <text x={p.x} y={p.y+4} textAnchor="middle" fontSize={isHov ? 10 : 9} fill="#fff" fontWeight="800">{initials}</text>
                        {isHov && (
                          <g>
                            <rect x={p.x - 70} y={p.y - 50} width={140} height={40} rx={6} fill="#1F2937" opacity={0.95} />
                            <text x={p.x} y={p.y - 35} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="700">{p.name.split(" ")[0]}</text>
                            <text x={p.x} y={p.y - 20} textAnchor="middle" fontSize={8} fill="#9CA3AF">{p.quadrant.label}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Quadrant summary */}
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
                {qDefs.map(q => {
                  const count = qCounts[q.label] || 0;
                  const members = plotData.filter(p => p.quadrant.label === q.label);
                  return (
                    <div key={q.label} style={{ padding: "10px 14px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, borderLeft: `3px solid ${q.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: count > 0 ? 4 : 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: q.color }}>{q.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: count > 0 ? C.text : C.muted }}>{count}</span>
                      </div>
                      {count > 0 && (
                        <div style={{ fontSize: 10, color: C.muted }}>
                          {members.map(p => p.name.split(" ")[0]).join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Adaptation note */}
                {plotData.some(p => p.quadrant.label !== "Dominant Culture") && (
                  <div style={{ marginTop: 4, padding: "10px 14px", borderRadius: 8, background: "#FFF3E0", border: "1px solid #FFCC80" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#E65100", marginBottom: 4 }}>Watch For</div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6 }}>
                      {plotData.filter(p => p.quadrant.label === "Invisible Culture").length > 0
                        ? `${plotData.filter(p=>p.quadrant.label==="Invisible Culture").map(p=>p.name.split(" ")[0]).join(" and ")} differ from the dominant culture in both behavior and motivation. Highest disengagement risk.`
                        : "Some team members are adapting silently. Check the Friction Map and KRI Dashboard for where that cost is showing up."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
