'use client';

import { useState } from 'react';
import { C } from '../constants/colors';
import { discFull, getDom } from '../constants/data';
import { Btn } from './Btn';
import { Bias } from './Bias';
import {
  discInsights, valuesInsights, getEnvironmentTaxSummary, getGapInsight
} from '../knowledge/assessmentInsights';

// ────── MEETING ROOM: Conversation Prep ──────

const purposes = [
  { id: "checkin", label: "Check-In", icon: "💬", desc: "Regular 1:1 check-in" },
  { id: "feedback", label: "Give Feedback", icon: "📝", desc: "Deliver constructive feedback" },
  { id: "difficult", label: "Difficult Conversation", icon: "⚡", desc: "Address a hard topic" },
  { id: "development", label: "Development", icon: "📈", desc: "Career or skill growth" },
  { id: "recognition", label: "Recognition", icon: "⭐", desc: "Acknowledge contributions" },
  { id: "delegation", label: "Delegation", icon: "🎯", desc: "Assign new responsibility" }
];

function getDiscGapFriction(leader, person) {
  if (!leader?.disc) return [];
  const dims = ["D", "I", "S", "C"];
  return dims.map(d => {
    const gap = leader.disc.natural[d] - person.disc.natural[d];
    const abs = Math.abs(gap);
    if (abs < 15) return null;
    return { dim: d, gap, abs, full: discFull[d] };
  }).filter(Boolean).sort((a, b) => b.abs - a.abs);
}

function getValuesAlignment(leader, person) {
  if (!leader) return { shared: [], leaderOnly: [], personOnly: [] };
  const lTop = Object.entries(leader.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const pTop = Object.entries(person.values).filter(([, s]) => s >= 60).map(([k]) => k);
  return {
    shared: lTop.filter(v => pTop.includes(v)),
    leaderOnly: lTop.filter(v => !pTop.includes(v)),
    personOnly: pTop.filter(v => !lTop.includes(v))
  };
}

function getProcessMismatch(leader, person) {
  if (!leader) return null;
  const lLead = [...leader.attr.ext].sort((a, b) => b.score - a.score)[0];
  const pLead = [...person.attr.ext].sort((a, b) => b.score - a.score)[0];
  if (lLead.label === pLead.label) return null;
  return { leader: lLead.label, person: pLead.label };
}

function getApproachGuidance(person, purpose) {
  const firstName = person.name.split(" ")[0];
  const dom = getDom(person.disc.natural);
  const highD = person.disc.natural.D >= 70;
  const highI = person.disc.natural.I >= 70;
  const highS = person.disc.natural.S >= 70;
  const highC = person.disc.natural.C >= 70;
  const topVals = Object.entries(person.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const leadAttr = [...person.attr.ext].sort((a, b) => b.score - a.score)[0];

  const guidance = { open: [], avoid: [], language: [] };

  // Opening approach based on DISC
  if (highD) {
    guidance.open.push("Get to the point quickly. State the purpose upfront.");
    guidance.avoid.push("Don't start with small talk that feels like stalling.");
  }
  if (highI) {
    guidance.open.push("Start with genuine connection. Ask how they're doing and mean it.");
    guidance.avoid.push("Don't jump straight to business without warming up the relationship.");
  }
  if (highS) {
    guidance.open.push("Set the context. Tell them what you want to talk about and why — no surprises.");
    guidance.avoid.push("Don't spring topics on them without warning. They need time to process.");
  }
  if (highC) {
    guidance.open.push("Bring data. If you have specifics, lead with them.");
    guidance.avoid.push("Don't make vague, feeling-based claims without evidence.");
  }

  // Process-based approach
  if (leadAttr.label === "Heart") {
    guidance.language.push("Lead with impact on people before covering data or results.");
  } else if (leadAttr.label === "Hand") {
    guidance.language.push("Lead with what's actionable. What can they do with this information?");
  } else {
    guidance.language.push("Lead with the framework. Help them see the system before the details.");
  }

  // Purpose-specific guidance
  if (purpose === "feedback") {
    if (highD) guidance.language.push("Be direct. They respect honesty more than diplomacy.");
    if (highI) guidance.language.push("Affirm the relationship first. Make it clear feedback doesn't change how you see them.");
    if (highS) guidance.language.push("Be steady. Don't overload them. One or two items, delivered calmly.");
    if (highC) guidance.language.push("Be specific. Vague feedback is worse than no feedback for them.");
    if (person.attr.int.find(a => a.name === "Self-Esteem" && (a.bias === "−" || a.bias === "\u2212"))) {
      guidance.avoid.push("Their Self-Esteem is environment-sensitive. Frame feedback as investment, not criticism.");
    }
  }

  if (purpose === "difficult") {
    guidance.open.push("Name the elephant. Don't circle the topic.");
    if (highS) guidance.language.push("Reassure them about what's NOT changing before addressing what is.");
    if (highI) guidance.language.push("Separate the issue from the person. Make it clear you're addressing the situation, not them.");
    if (highD) guidance.language.push("Give them agency. Frame the problem, then ask how they'd solve it.");
    if (highC) guidance.language.push("Expect questions. Give them permission to process before expecting a response.");
  }

  if (purpose === "development") {
    topVals.forEach(v => {
      if (v === "Individualistic") guidance.language.push("Frame growth opportunities as paths to greater autonomy and impact.");
      if (v === "Theoretical") guidance.language.push("Frame development as learning and mastery, not just career advancement.");
      if (v === "Political") guidance.language.push("Connect development to visibility and influence. Show how growth increases their seat at the table.");
      if (v === "Altruistic") guidance.language.push("Connect development to how they can better serve others and increase their impact.");
    });
  }

  if (purpose === "recognition") {
    if (highI) guidance.language.push("Public recognition lands well. They want to be seen.");
    if (highS) guidance.language.push("Private, sincere recognition. They don't need the spotlight — they need to know you noticed.");
    if (highD) guidance.language.push("Recognize the result, not the effort. They value outcomes.");
    if (highC) guidance.language.push("Be specific about what they did right. Vague praise feels empty.");
  }

  if (purpose === "delegation") {
    if (highD) guidance.language.push("Give the goal, not the method. Let them own the how.");
    if (highC) guidance.language.push("Define clear parameters, quality standards, and deadlines upfront.");
    if (highS) guidance.language.push("Explain why this is changing and what support they'll have.");
    if (highI) guidance.language.push("Frame it as trust and opportunity, not just more work.");
    if (person.attr.int.find(a => a.name === "Role Awareness" && a.bias === "+")) {
      guidance.avoid.push("Their Role Awareness is high — be crystal clear about scope and boundaries.");
    }
  }

  return guidance;
}

function getConversationStarters(person, purpose, leader) {
  const firstName = person.name.split(" ")[0];
  const envTax = getEnvironmentTaxSummary(person);
  const starters = [];

  // Environment-based starters
  if (envTax.totalGap >= 80) {
    starters.push({ type: "environment", text: `"${firstName}, I want to check in on how things are feeling for you in this environment right now. Not the work — the environment itself."` });
  }

  // Frustrated PT indicator
  if (envTax.hasFrustratedPT) {
    starters.push({ type: "signal", text: `"I want to make sure the work you're doing feels like it matters. Are the things you're producing landing the way you'd want them to?"` });
  }

  // DISC gap starters
  const gaps = leader ? getDiscGapFriction(leader, person) : [];
  if (gaps.length > 0) {
    const top = gaps[0];
    if (top.gap > 0) {
      starters.push({ type: "friction", text: `"I know my pace on ${top.full.toLowerCase()} can be different from yours. I want to make sure my style isn't creating friction for you."` });
    } else {
      starters.push({ type: "friction", text: `"I know you bring more ${top.full.toLowerCase()} energy than I naturally do. I want to make sure you have the room to use that strength."` });
    }
  }

  // Purpose-specific starters
  if (purpose === "checkin") {
    starters.push({ type: "purpose", text: `"What's one thing that's working well for you right now, and one thing that's costing you energy?"` });
    starters.push({ type: "purpose", text: `"If you could change one thing about how we work together, what would it be?"` });
  }
  if (purpose === "feedback") {
    starters.push({ type: "purpose", text: `"I have some observations I want to share because I think they'll help. Can I walk you through what I'm seeing?"` });
  }
  if (purpose === "difficult") {
    starters.push({ type: "purpose", text: `"There's something I need to address with you. It's not easy, but I respect you enough to be honest about it."` });
  }
  if (purpose === "development") {
    starters.push({ type: "purpose", text: `"I see growth potential in you that I want to talk about. Where do you see yourself heading?"` });
  }
  if (purpose === "recognition") {
    starters.push({ type: "purpose", text: `"I want to name something I've noticed about your work. It matters, and I don't want it to go unsaid."` });
  }
  if (purpose === "delegation") {
    starters.push({ type: "purpose", text: `"I have something I want to put in your hands because I think you're the right person for it. Let me walk you through what I'm thinking."` });
  }

  // Values-based starters
  const topVal = Object.entries(person.values).sort((a, b) => b[1] - a[1])[0];
  if (topVal[1] >= 60) {
    const valStarters = {
      Altruistic: `"Is the work you're doing right now connecting to the impact you want to have?"`,
      Economic: `"Are you getting a good return on the energy you're investing here?"`,
      Individualistic: `"Do you feel like you have enough autonomy in how you approach your work?"`,
      Political: `"Do you feel like you have the influence and visibility you need in this role?"`,
      Regulatory: `"Do you have the structure and clarity you need to do your best work?"`,
      Theoretical: `"Are you getting the depth of understanding you need, or does the work feel too surface-level?"`,
      Aesthetic: `"Does the work environment feel right to you? Is there something about how things flow that's off?"`
    };
    if (valStarters[topVal[0]]) {
      starters.push({ type: "values", text: valStarters[topVal[0]] });
    }
  }

  return starters;
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#C8A96E", textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

export function MeetingRoom({ person, leader, onClose }) {
  const [purpose, setPurpose] = useState(null);
  const firstName = person.name.split(" ")[0];
  const envTax = getEnvironmentTaxSummary(person);
  const prefTax = envTax.totalGap;
  const prefTaxLabel = prefTax >= 160 ? "Critical" : prefTax >= 120 ? "Heavy" : prefTax >= 80 ? "Significant" : prefTax >= 40 ? "Moderate" : "Aligned";
  const prefTaxColor = prefTax >= 160 ? "#7F1D1D" : prefTax >= 120 ? "#C62828" : prefTax >= 80 ? "#E65100" : prefTax >= 40 ? "#F59E0B" : C.green;

  const friction = leader ? getDiscGapFriction(leader, person) : [];
  const valAlign = getValuesAlignment(leader, person);
  const procMismatch = getProcessMismatch(leader, person);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(720px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Header */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: "#fff" }}>Meeting Room: {person.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Conversation prep powered by assessment data</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "28px 28px 20px" }}>

          {/* Step 1: Purpose Selector */}
          {!purpose ? (
            <div>
              <SectionHeader title="What's this conversation about?" subtitle="Select a purpose to get tailored prep" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
                {purposes.map(p => (
                  <button key={p.id} onClick={() => setPurpose(p.id)} style={{ padding: "16px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8A96E"; e.currentTarget.style.background = "#FFFDF7"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{p.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* Quick Intel (always visible) */}
              <SectionHeader title="Quick Intel" subtitle={`What to know about ${firstName} before you walk in`} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {/* DISC snapshot */}
                <div style={{ flex: "1 1 200px", padding: "12px 14px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Natural Style</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["D","I","S","C"].map(d => (
                      <span key={d} style={{ padding: "2px 8px", borderRadius: 4, background: person.disc.natural[d] >= 60 ? C.disc[d] : C.hi, color: person.disc.natural[d] >= 60 ? (d === "I" ? "#111" : "#fff") : C.muted, fontWeight: 700, fontSize: 11, border: person.disc.natural[d] < 60 ? `1px solid ${C.border}` : "none" }}>
                        {d}:{person.disc.natural[d]}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Environment status */}
                <div style={{ flex: "1 1 200px", padding: "12px 14px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, borderLeft: `3px solid ${prefTaxColor}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Environment Tax</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: prefTaxColor }}>{prefTaxLabel}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{prefTax} gap points</div>
                </div>
                {/* Top Values */}
                <div style={{ flex: "1 1 200px", padding: "12px 14px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Top Drivers</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {Object.entries(person.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).map(([v, s]) => (
                      <span key={v} style={{ fontSize: 10, fontWeight: 600, color: C.values[v], background: C.card, border: `1px solid ${C.border}`, padding: "2px 6px", borderRadius: 4 }}>{v} {s}</span>
                    ))}
                    {Object.entries(person.values).filter(([,s]) => s >= 60).length === 0 && <span style={{ fontSize: 10, color: C.muted }}>No strong drivers (60+)</span>}
                  </div>
                </div>
              </div>

              {/* Friction points with leader */}
              {leader && friction.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <SectionHeader title="Friction Points with You" subtitle="Where your styles naturally clash" />
                  {friction.map(f => (
                    <div key={f.dim} style={{ padding: "10px 14px", borderRadius: 8, background: f.abs >= 30 ? "#FFF7ED" : C.hi, border: `1px solid ${f.abs >= 30 ? "#FED7AA" : C.border}`, borderLeft: `3px solid ${f.abs >= 30 ? "#E65100" : "#F59E0B"}`, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.abs >= 30 ? "#E65100" : "#92400E" }}>{f.full}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>You: {leader.disc.natural[f.dim]} → Them: {person.disc.natural[f.dim]} (Δ{f.abs})</span>
                      </div>
                      <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                        {f.gap > 0
                          ? `You naturally bring more ${f.full.toLowerCase()} than ${firstName}. Your pace here may overwhelm them.`
                          : `${firstName} naturally brings more ${f.full.toLowerCase()} than you. They may feel held back by your approach here.`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Process mismatch */}
              {procMismatch && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "#F5F9FF", border: "1px solid #DBEAFE", borderLeft: "3px solid #1565C0", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1565C0", marginBottom: 4 }}>Decision-Making Mismatch</div>
                  <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                    You lead with <strong>{procMismatch.leader}</strong>, they lead with <strong>{procMismatch.person}</strong>. You're processing information through different lenses. Start conversations in their language, not yours.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Full Prep with Selected Purpose */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <button onClick={() => setPurpose(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted, padding: 0 }}>←</button>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {purposes.find(p => p.id === purpose)?.icon} {purposes.find(p => p.id === purpose)?.label}: {firstName}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>Your prep is ready. Review before you walk in.</div>
                </div>
              </div>

              {/* Environment Context */}
              {prefTax >= 40 && (
                <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: `4px solid ${prefTaxColor}`, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Environment Context</div>
                  <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                    {firstName}'s environment tax is <strong style={{ color: prefTaxColor }}>{prefTaxLabel}</strong> ({prefTax} gap points). {prefTax >= 80
                      ? "They're carrying significant adaptation cost right now. Be aware that fatigue and frustration may be present even if they don't show it."
                      : "They're adapting to their environment in meaningful ways. Some friction may be environment-driven, not personal."}
                  </div>
                  {envTax.hasFrustratedPT && (
                    <div style={{ fontSize: 10, color: "#C62828", marginTop: 6, fontWeight: 600 }}>⚠ Environment damage signal active (Practical Thinking frustrated). Their relationship with results may be strained.</div>
                  )}
                </div>
              )}

              {/* Approach Guidance */}
              {(() => {
                const guidance = getApproachGuidance(person, purpose);
                return (
                  <>
                    {guidance.open.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <SectionHeader title="How to Open" />
                        {guidance.open.map((g, i) => (
                          <div key={i} style={{ fontSize: 12, color: C.text, lineHeight: 1.6, padding: "6px 12px", borderRadius: 6, background: "#F0FAF0", border: "1px solid #D1FAE5", marginBottom: 4, borderLeft: "3px solid #2E7D32" }}>
                            {g}
                          </div>
                        ))}
                      </div>
                    )}

                    {guidance.language.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <SectionHeader title="Language That Works" />
                        {guidance.language.map((g, i) => (
                          <div key={i} style={{ fontSize: 12, color: C.text, lineHeight: 1.6, padding: "6px 12px", borderRadius: 6, background: "#F5F9FF", border: "1px solid #DBEAFE", marginBottom: 4, borderLeft: "3px solid #1565C0" }}>
                            {g}
                          </div>
                        ))}
                      </div>
                    )}

                    {guidance.avoid.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <SectionHeader title="What to Avoid" />
                        {guidance.avoid.map((g, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#C62828", lineHeight: 1.6, padding: "6px 12px", borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 4, borderLeft: "3px solid #C62828" }}>
                            {g}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Friction with Leader */}
              {friction.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <SectionHeader title="Watch Your Friction" subtitle="Where your styles naturally diverge" />
                  {friction.slice(0, 2).map(f => (
                    <div key={f.dim} style={{ padding: "10px 14px", borderRadius: 8, background: "#FFF7ED", border: "1px solid #FED7AA", marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#E65100", marginBottom: 4 }}>{f.full}: Δ{f.abs}</div>
                      <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                        {f.gap > 0
                          ? `You're naturally ${f.abs >= 30 ? "significantly" : "noticeably"} higher in ${f.full.toLowerCase()}. Dial back your intensity here. Let them set the pace.`
                          : `They're naturally ${f.abs >= 30 ? "significantly" : "noticeably"} higher in ${f.full.toLowerCase()}. Give them room to express it. Don't interpret their energy as a challenge.`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Values context */}
              {(valAlign.shared.length > 0 || valAlign.personOnly.length > 0) && (
                <div style={{ marginBottom: 16 }}>
                  <SectionHeader title="Values Context" />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {valAlign.shared.map(v => (
                      <span key={v} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "#F0FAF0", color: "#2E7D32", border: "1px solid #D1FAE5" }}>Shared: {v}</span>
                    ))}
                    {valAlign.personOnly.map(v => (
                      <span key={v} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "#FFF7ED", color: "#E65100", border: "1px solid #FED7AA" }}>Their driver: {v}</span>
                    ))}
                  </div>
                  {valAlign.personOnly.length > 0 && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
                      {firstName} is driven by {valAlign.personOnly.join(" and ")} — {valAlign.personOnly.length === 1 ? "a value" : "values"} you don't share at the same intensity. Acknowledge what fuels them even if it doesn't fuel you.
                    </div>
                  )}
                </div>
              )}

              {/* Conversation Starters */}
              <div style={{ marginBottom: 16 }}>
                <SectionHeader title="Conversation Starters" subtitle="Data-driven openers you can use" />
                {getConversationStarters(person, purpose, leader).map((s, i) => {
                  const typeColor = s.type === "signal" ? "#C62828" : s.type === "friction" ? "#E65100" : s.type === "environment" ? "#92400E" : "#1565C0";
                  const typeBg = s.type === "signal" ? "#FEF2F2" : s.type === "friction" ? "#FFF7ED" : s.type === "environment" ? "#FFFBEB" : "#F5F9FF";
                  return (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: typeBg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${typeColor}`, marginBottom: 6 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: typeColor, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.type}</div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, fontStyle: "italic" }}>{s.text}</div>
                    </div>
                  );
                })}
              </div>

              {/* Reminder */}
              <div style={{ padding: "14px 16px", borderRadius: 8, background: "#FFFDE7", border: "1px solid #FFF59D" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9A7A42", marginBottom: 4 }}>BEFORE YOU WALK IN</div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                  This prep is built from {firstName}'s assessment data and {leader ? "your style comparison" : "their profile"}. Use it as a compass, not a script. The best conversations happen when you're prepared enough to be present — not when you're following a playbook.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {purpose && (
            <button onClick={() => setPurpose(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.muted, padding: 0 }}>← Change Purpose</button>
          )}
          <div style={{ marginLeft: "auto" }}>
            <Btn primary onClick={onClose}>Close</Btn>
          </div>
        </div>

      </div>
    </div>
  );
}
