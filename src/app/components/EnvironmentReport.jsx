'use client';
import { useState } from 'react';
import { C } from '../constants/colors';
import { discFull, getDom, valLevel, normBias, isEqualExtProfile } from '../constants/data';
import { Btn } from './Btn';
import { Bias } from './Bias';

// ────── SPRINT 4A: ENVIRONMENT REPORT ──────
const discInterp = {
  D: {
    high:  "You drive toward results, challenge the status quo, and push through obstacles. You're decisive, direct, and determined. Your team experiences you as bold and fast-moving.",
    mod:   "You balance assertiveness with cooperation. You push when needed but know when to step back. You can lead decisively or follow strategically.",
    low:   "You prefer to work collaboratively and avoid confrontation. You may defer to others more than your situation warrants. Your team may underestimate your opinions."
  },
  I: {
    high:  "You lead with enthusiasm, optimism, and social energy. People are drawn to your communication style and warmth. You're at your best when connecting and inspiring.",
    mod:   "You can connect with people when needed but don't rely solely on charm. You balance influence with substance and can work alone or with groups.",
    low:   "You prefer facts over feelings and work over socializing. You may come across as reserved or intensely task-focused. Relationship-building takes intentional effort."
  },
  S: {
    high:  "You create stability, consistency, and a steady environment for others. You're dependable, patient, and team-oriented. People trust you because you show up the same way every time.",
    mod:   "You adapt to both stable and changing environments. You're comfortable with routine but can handle disruption when it's necessary.",
    low:   "You thrive on variety, change, and movement. Routine feels like a cage to you. You're comfortable initiating change others find threatening.",
  },
  C: {
    high:  "You lead with precision, quality, and analytical depth. You hold yourself and others to a high standard. Getting it right matters more to you than getting it done fast.",
    mod:   "You care about accuracy but don't get paralyzed by it. You look for patterns and make thoughtful, calculated decisions without needing every data point.",
    low:   "You trust your gut over data and move fast. You may overlook important details when the pace is high. Rules and procedures feel like obstacles."
  }
};
const discLevel = s => s >= 70 ? "high" : s >= 40 ? "mod" : "low";
const discLevelLabel = s => s >= 70 ? "High" : s >= 40 ? "Moderate" : "Low";

const valInterp = {
  Aesthetic:       "driven by harmony, beauty, balance, and creative expression. Environments that lack aesthetic order slowly drain your energy.",
  Economic:        "highly practical, efficiency-driven, and focused on ROI. You want to know the return on every investment of time and energy.",
  Individualistic: "someone who craves independence, uniqueness, and the freedom to forge your own path. Being micromanaged costs you deeply.",
  Political:       "driven by influence, control, and leadership position. You want to lead, not follow, and you track power dynamics instinctively.",
  Altruistic:      "someone who leads from purpose and service. Helping others isn't a job. It's a calling. When your work lacks meaning, it costs you.",
  Regulatory:      "someone who needs structure, order, rules, and tradition. Chaos and ambiguity are your kryptonite. Clear systems make you effective.",
  Theoretical:     "a knowledge-seeker at heart. Learning, analyzing, and understanding for its own sake energizes you. Shallow work bores you."
};

const getAttrBand = (score) => score >= 8.0 ? "strong" : score >= 6.0 ? "moderate" : "mild";
const attrExtInterp = {
  Heart: {
    high: {
      strong:   "People come first. Every time. You read how a decision will land emotionally before you ever ask if it'll work. That's your first filter, and it's non-negotiable.",
      moderate: "Your first instinct is to check in on the people. You pick up on relational undercurrents before most people notice them. Logic and practicality follow, but people lead.",
      mild:     "You lead with people, but not by a wide margin. You're tuned in emotionally, but you're also ready to shift to data or results when the situation calls for it."
    },
    low: {
      strong:   "You don't lead with people. You lead with outcomes or logic, and the relational piece tends to come last. You may solve the problem and miss how the solution lands on the people it affects.",
      moderate: "Relationships aren't your first filter. You're not cold, but you tend to move to results or structure before checking in on impact. You can miss the emotional temperature of a room.",
      mild:     "People aren't quite your primary lens. You'll get there, but usually after the logic or practical questions are answered first. It's a slight delay, not an absence."
    }
  },
  Hand: {
    high: {
      strong:   "Does it work? That's the first question. Always. You filter everything through practical results before theory ever enters the room. If it can't be applied, it's not real to you.",
      moderate: "You lead with what's practical. Results and application come before theory or abstraction. You have patience for ideas, but only if they point somewhere useful.",
      mild:     "Practical thinking is your lead lens, but not by a lot. You want things to work, but you're open to the theory behind them, especially when results are ambiguous."
    },
    low: {
      strong:   "Practical application isn't where you start. You lead with people or systems before asking if it actually works. You may commit to something before stress-testing it against real-world conditions.",
      moderate: "You don't naturally lead with 'does this work.' You'll get there, but your first instinct goes somewhere else. Relationship or logic tends to front-run practical evaluation.",
      mild:     "Results aren't quite your first filter. You get to practicality, but not immediately. There's a slight gap between seeing an idea and asking if it'll hold up."
    }
  },
  Head: {
    high: {
      strong:   "You see the system first. Structure, process, patterns, data. Before you see the people or the outcome, you see the architecture. That's a powerful lens, and it runs deep.",
      moderate: "Logic and structure lead your thinking. You want to understand the framework before you move. You'll get to people and results, but the system has to make sense first.",
      mild:     "You lean toward systems thinking, but you're not locked in. You notice patterns and structure, but you're willing to let relationships or results pull you in a different direction."
    },
    low: {
      strong:   "Systems and data aren't your first move. You lead with people or results, and the logic layer comes later if at all. You may act on instinct or relationship before asking if the structure supports it.",
      moderate: "You don't naturally front-run with frameworks or data. You get there eventually, but instinct or relational input tends to lead the charge.",
      mild:     "Structure isn't your primary lens. You're not dismissing it, but your instinct goes somewhere else first. Logic and systems fill in after the initial read."
    }
  }
};
const attrIntInterp = {
  "Self-Esteem": {
    "+": {
      strong:   "You know your worth. Not arrogantly. Just clearly. Criticism doesn't shake your foundation because your foundation isn't built on what others think. That stability is rare. The only watch-out is that feedback sometimes doesn't land the way people intend it. You process it through a strong filter.",
      moderate: "You have a solid sense of your own value. You can take a hit without losing your footing. Feedback registers without derailing you. That's a real strength in high-pressure environments.",
      mild:     "You're slightly more confident than neutral. You generally trust your worth, but you're not immune to doubt when the pressure is on or when the feedback is pointed."
    },
    "\u2212": {
      strong:   "You carry real humility, but it may go too deep. You're likely underselling your contributions, deferring when you shouldn't, or waiting for external permission before trusting your own read. What your environment says about your value carries more weight than it should.",
      moderate: "You tend to underestimate yourself. Not always, but enough that you sometimes dismiss your own contributions before anyone else has the chance to. You may need more external affirmation than you'd like to admit.",
      mild:     "You're slightly more humble than centered. It's not debilitating, but there are moments where you question your worth a beat longer than necessary before moving forward."
    },
    "=": {
      strong:   "You're genuinely centered on your own value. Feedback doesn't knock you over, and confidence doesn't tip into ego. That balance is hard to maintain under pressure, and you hold it well.",
      moderate: "Your relationship with your own worth is mostly stable. You can receive feedback without it becoming a crisis, and you can advocate for yourself without needing it to be a fight.",
      mild:     "You're close to center on self-worth. Neither strongly confident nor particularly self-doubting. The situation tends to pull you one way or the other."
    }
  },
  "Role Awareness": {
    "+": {
      strong:   "Your role is tied directly to your identity. You need to know exactly what's yours to carry, and ambiguity about that costs you real energy. When your lane isn't clear, you don't just feel uncomfortable. You feel unmoored. Clarity here isn't a preference. It's a requirement.",
      moderate: "You function best when your role is defined. Ambiguity slows you down. You'll push through it, but not without a cost. Clear expectations and clear ownership are what let you operate at full speed.",
      mild:     "You lean toward wanting role clarity, but you're not completely thrown by ambiguity. Undefined expectations are annoying, not paralyzing."
    },
    "\u2212": {
      strong:   "Role boundaries don't register strongly for you. You take on what needs doing, regardless of whether it's technically yours. That makes you incredibly useful. It also means you may be carrying things that aren't yours to carry, and you may not notice until you're burned out.",
      moderate: "You're loose on role definition. You tend to extend beyond your lane and sometimes absorb responsibilities that belong to others. Not out of ambition. You just don't feel the boundary.",
      mild:     "You're slightly less anchored to role clarity than most. You can work in ambiguous environments without it destabilizing you, but you may drift outside your lane without noticing."
    },
    "=": {
      strong:   "You have a clear, balanced relationship with your role. You know what's yours and what isn't. You're not territorial about it, but you're not a pushover either. That clarity makes you easy to work with.",
      moderate: "You generally know what's yours to carry. You don't typically overextend or underfill. Your role awareness is functional and doesn't require a lot of energy to maintain.",
      mild:     "You're close to neutral on role clarity. Some days you feel anchored. Others, the edges blur a little. Context tends to determine which way you go."
    }
  },
  "Self-Direction": {
    "+": {
      strong:   "You know exactly where you're going. That's not stubbornness. That's deep clarity. You've built a strong internal compass over time, and it holds even when everything around you gets loud. Your environment can throw obstacles at you. It can create delays. But it can't pull you off your path. That's a rare kind of strength.",
      moderate: "You know where you're going. That clarity holds most of the time. When pressure mounts or the right voice enters the room, you might feel a moment of doubt. But you tend to find your way back to your own direction.",
      mild:     "You have a sense of your direction, but it's held loosely. You're open to influence, and sometimes the right person or the right argument can redirect you. That's not weakness. It's openness sitting right next to clarity."
    },
    "\u2212": {
      strong:   "You're highly receptive to external direction. Strong voices around you carry real weight in shaping where you go. That openness makes you genuinely coachable. The watch-out is knowing when to follow and when to hold your own ground.",
      moderate: "You lean toward outside input when it comes to direction. You look to others to validate the path before you commit to it. That's not indecision. It's how you process. Just make sure the voices you're listening to deserve the weight you're giving them.",
      mild:     "You're slightly more open to outside influence than self-directed. You have a sense of where you want to go, but you'll adjust it if someone makes a compelling enough case."
    },
    "=": {
      strong:   "You're genuinely balanced between leading yourself and staying open. You can hold your direction without becoming rigid, and you can take input without losing your footing. That's a real leadership asset.",
      moderate: "You balance autonomy and openness well. You can own your direction while staying coachable. You don't dig in when you shouldn't, and you don't drift when you need to hold.",
      mild:     "You're close to center on self-direction. You can lead yourself and you can follow good input. Which one shows up depends more on the situation than on a strong internal pull either way."
    }
  }
};

function ReportSection({ num, title, children }) {
  return (
    <div style={{ marginBottom: 36, pageBreakInside: "avoid" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 4, height: 24, borderRadius: 2, background: "#C8A96E", flexShrink: 0 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: "#C8A96E", textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>{String(num).padStart(2, "0")}</div>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3, color: C.text }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

export function EnvironmentReport({ person, onClose }) {
  const p = person;
  const dims = ["D", "I", "S", "C"];

  // DISC data
  const discRows = dims.map(d => ({
    d, full: discFull[d],
    nat: p.disc.natural[d], adp: p.disc.adaptive[d],
    gap: p.disc.adaptive[d] - p.disc.natural[d]
  }));

  // Preference Tax
  const prefTax = discRows.reduce((sum, r) => sum + Math.abs(r.gap), 0);
  const prefTaxLabel = prefTax >= 160 ? "Critical" : prefTax >= 120 ? "Heavy" : prefTax >= 80 ? "Significant" : prefTax >= 40 ? "Moderate" : "Aligned";
  const prefTaxColor = prefTax >= 160 ? "#7F1D1D" : prefTax >= 120 ? "#C62828" : prefTax >= 80 ? "#E65100" : prefTax >= 40 ? "#F59E0B" : C.green;

  // Values
  const valRows = Object.entries(p.values).sort((a, b) => b[1] - a[1]);
  const topVals = valRows.filter(([, s]) => s >= 60);
  const lowVals = valRows.filter(([, s]) => s < 40);

  // Attributes
  const extSorted = [...p.attr.ext].sort((a, b) => b.score - a.score);
  const intRows = p.attr.int;

  // Process Tax (count of "\u2212" on external)
  const extMinusBiases = p.attr.ext.filter(a => a.bias === "\u2212").length;
  const processTaxLabel = extMinusBiases === 0 ? "None" : extMinusBiases === 1 ? "Light" : extMinusBiases === 2 ? "Moderate" : "Heavy";
  const processTaxColor = extMinusBiases === 0 ? C.green : extMinusBiases === 1 ? "#558B2F" : extMinusBiases === 2 ? "#E65100" : "#C62828";

  // Internal tax (count of "\u2212" on internal)
  const intMinusBiases = p.attr.int.filter(a => a.bias === "\u2212").length;
  const intTaxLabel = intMinusBiases === 0 ? "None" : intMinusBiases === 1 ? "Light" : intMinusBiases === 2 ? "Moderate" : "Heavy";

  const taxCard = (label, value, color, note) => (
    <div style={{ flex: 1, padding: "16px 18px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(900px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Controls */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 32, color: "#fff" }}>Environment Report: {p.name}</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Natural vs Adaptive · Love Where You Lead</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Print Report</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 48 }} id="report-content">

          {/* Cover */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 0 28px", borderBottom: `1px solid ${C.border}`, marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1A1A18", color: "#C8A96E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
              {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{p.name}</h1>
                {dims.map(d => <span key={d} style={{ padding: "3px 10px", borderRadius: 4, background: C.disc[d], color: d === "I" ? "#111827" : "#fff", fontWeight: 700, fontSize: 11 }}>{d}:{p.disc.natural[d]}</span>)}
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>Love Where You Lead - Environment Report</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          </div>

          {/* 1: YOUR PREFERENCE - Natural */}
          <ReportSection num={1} title="YOUR PREFERENCE: Natural Style">
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>Your Natural style is how you're built to lead when you're comfortable, off-guard, or under pressure. This is who you are when no one's adjusting for the room.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
            {discRows.map(({ d, full, nat }) => (
              <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "16px 20px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.disc[d]}` }}>
                <div style={{ flexShrink: 0, minWidth: 100 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.disc[d], textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{full}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.disc[d], lineHeight: 1 }}>{nat}</div>
                </div>
                <div style={{ flex: 1, paddingTop: 2 }}>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{discInterp[d][discLevel(nat)]}</div>
                </div>
              </div>
            ))}
            </div>
          </ReportSection>

          {/* 2: Adaptive Style */}
          <ReportSection num={2} title="YOUR PREFERENCE: Adaptive Style">
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>Your Adaptive style is how you're adjusting to your current environment. When Natural and Adaptive differ significantly, your environment's asking you to be someone you're not. That costs energy every single day.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
            {discRows.map(({ d, full, nat, adp, gap }) => {
              const absgap = Math.abs(gap);
              const costly = absgap >= 20;
              const dir = gap > 0 ? "Environment is demanding more " + full : "Environment is suppressing your " + full;
              const borderColor = costly ? "#E65100" : C.disc[d];
              return (
                <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "16px 20px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${borderColor}` }}>
                  <div style={{ flexShrink: 0, minWidth: 100 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: borderColor, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{full}</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: borderColor, lineHeight: 1 }}>{adp}</div>
                    {costly && <div style={{ fontSize: 10, fontWeight: 600, color: "#E65100", marginTop: 4 }}>Δ{absgap} from natural</div>}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: costly ? 8 : 0 }}>
                      Natural: <strong>{nat}</strong> → Adaptive: <strong>{adp}</strong>
                    </div>
                    {costly && <div style={{ fontSize: 13, color: "#E65100", lineHeight: 1.6 }}>{dir}</div>}
                  </div>
                </div>
              );
            })}
            </div>
          </ReportSection>

          {/* 3: Preference Tax */}
          <ReportSection num={3} title="PREFERENCE TAX: The Cost of Adapting">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your Preference Tax is the total energy you spend each day adapting your natural behavioral style to fit your environment. The higher the number, the more drained you feel at the end of the day. Not because you worked hard. Because you spent the day being someone you're not.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              {taxCard("Total Gap Points", prefTax, prefTaxColor, `Across all 4 DISC dimensions`)}
              {taxCard("Tax Level", prefTaxLabel, prefTaxColor, prefTax >= 160 ? "Critical daily adaptation cost." : prefTax >= 120 ? "Heavy daily adaptation cost." : prefTax >= 80 ? "Significant daily adaptation cost." : prefTax >= 40 ? "Moderate daily adaptation cost." : "Your environment fits your natural style.")}
            </div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, padding: "10px 14px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
              {prefTaxLabel === "Critical" && "Your environment is demanding near-maximum behavioral adaptation from you right now. This isn't a motivation problem. It's a design problem at a critical level. The gap between who you are and how your environment needs you to show up is unsustainable without intervention."}
              {prefTaxLabel === "Heavy" && "Your environment doesn't fit your natural operating style. You're paying a heavy price for it every day. The fatigue, the frustration, the sense that you're performing a version of yourself you didn't choose. That's not a character flaw. That's a design problem that has a design solution."}
              {prefTaxLabel === "Significant" && "Two to three of your DISC dimensions are under sustained pressure right now. Adaptation isn't occasional. It's constant. You likely feel it most at the end of the day, when you've been managing your style for hours. The Environment Alignment shows you exactly where the cost is highest."}
              {prefTaxLabel === "Moderate" && "Your environment asks you to adapt in meaningful ways. Some days feel natural. Others feel like you're swimming upstream. Knowing which dimensions carry the most cost is how you start negotiating better conditions."}
              {prefTaxLabel === "Aligned" && "Your environment largely fits your natural style. That's rare. Protect it. Environments shift, and what fits today can drift over time. Knowing your baseline now is what lets you catch it early if it changes."}
            </div>
          </ReportSection>

          {/* 4: YOUR PASSION - Values */}
          <ReportSection num={4} title="YOUR PASSION: What Drives You">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your Values reveal what you're fundamentally motivated by. What gets you out of bed. What gives your work meaning. What drains you when it's absent. These aren't preferences. They're the fuel your leadership runs on.</p>
            {topVals.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>Top Drivers (Score 60+)</div>
                {topVals.map(([name, score]) => (
                  <div key={name} style={{ marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.values[name], display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.values[name] }}>{name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 800, color: C.values[name] }}>{score}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#2E7D32", background: C.card, border: "1px solid #A5D6A7", borderLeft: "3px solid #2E7D32", borderRadius: 4, padding: "1px 7px" }}>Top Driver</span>
                    </div>
                    <div style={{ height: 4, background: C.hi, borderRadius: 2, marginBottom: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${score}%`, background: C.values[name], borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{name} at {score}. You are {valInterp[name]} This feeds your motivation.</div>
                  </div>
                ))}
              </div>
            )}
            {lowVals.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>Low Drivers (Score under 40)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lowVals.map(([name, score]) => (
                    <div key={name} style={{ flex: "1 1 200px", padding: "8px 10px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[name], display: "inline-block" }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.values[name] }}>{name}: {score}</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>This is not what gets you out of bed.</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ReportSection>

          {/* 5: YOUR PROCESS - External */}
          <ReportSection num={5} title="YOUR PROCESS: External (Heart, Hand, Head)">
            {isEqualExtProfile(p.attr.ext) ? (
              <>
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your External Attributes show equal capacity across all three decision-making dimensions. You see People, Results, and Structure with the same clarity. There's no fixed processing sequence. Versatility IS your strength. Your bias indicators reveal your relationship to each lens, not the order you use them.</p>
                {p.attr.ext.map(a => {
                  const interp = attrExtInterp[a.label]?.high?.[getAttrBand(a.score)] || "";
                  return (
                    <div key={a.name} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.attr.ext}` }}>
                      <div style={{ flexShrink: 0, textAlign: "center", width: 52 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.attr.ext, textTransform: "uppercase" }}>=</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.attr.ext }}>{a.score}</div>
                        <Bias bias={a.bias} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.attr.ext, marginBottom: 3 }}>{a.label} - {a.name}</div>
                        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{interp}</div>
                        {a.bias === "\u2212" && <div style={{ fontSize: 10, color: "#E65100", marginTop: 3, fontWeight: 600 }}>⚠ Pattern detected. Your data shows reduced reliance on this lens despite having the capacity. The Environment Alignment can help determine whether this is environment-driven or a natural preference.</div>}
                        {a.bias === "+" && <div style={{ fontSize: 10, color: "#2E7D32", marginTop: 3, fontWeight: 600 }}>↑ You require this sense to function well. When it is absent, decisions feel incomplete.</div>}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your External Attributes determine what you see first when you look at any situation. This is your decision-making order. The lens through which all information is filtered before you act.</p>
                {extSorted.map((a, i) => {
                  const key = i === 0 ? "high" : "low";
                  const interp = attrExtInterp[a.label]?.[key]?.[getAttrBand(a.score)] || "";
                  return (
                    <div key={a.name} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: i === 0 ? `4px solid ${C.attr.ext}` : `1px solid ${C.border}` }}>
                      <div style={{ flexShrink: 0, textAlign: "center", width: 52 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: i === 0 ? C.attr.ext : C.muted, textTransform: "uppercase" }}>{i + 1}.</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.attr.ext }}>{a.score}</div>
                        <Bias bias={a.bias} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.attr.ext : C.text, marginBottom: 3 }}>{a.label} - {a.name}</div>
                        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{interp}</div>
                        {a.bias === "\u2212" && <div style={{ fontSize: 10, color: "#E65100", marginTop: 3, fontWeight: 600 }}>⚠ Pattern detected. Your data shows reduced reliance on this lens despite having the capacity. The Environment Alignment can help determine whether this is environment-driven or a natural preference.</div>}
                        {a.bias === "+" && <div style={{ fontSize: 10, color: "#2E7D32", marginTop: 3, fontWeight: 600 }}>↑ You require this sense to function well. When it is absent, decisions feel incomplete.</div>}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </ReportSection>

          {/* 6: Internal Attributes */}
          <ReportSection num={6} title="YOUR PROCESS: Internal (Leadership Foundation)">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your Internal Attributes reflect how you see yourself. Your own worth, your purpose, and your capacity to lead yourself. These are the foundation beneath everything else you do.</p>
            {intRows.map(a => (
              <div key={a.name} style={{ marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.attr.int, flexShrink: 0, width: 40 }}>{a.score}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{a.name}</div>
                    <Bias bias={a.bias} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{attrIntInterp[a.name]?.[a.bias]?.[getAttrBand(a.score)] || attrIntInterp[a.name]?.["="]?.["moderate"] || ""}</div>
              </div>
            ))}
          </ReportSection>

          {/* 7: Process Tax */}
          <ReportSection num={7} title="PROCESS SIGNALS: Patterns Worth Examining">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your External Attributes show patterns worth paying attention to. A minus bias doesn't mean something's broken. It means there's a lens you're not fully using right now. It could be something your environment shaped over time. It could be a natural preference. The Environment Alignment is what helps you figure out which one it is. Right now, you're seeing the pattern. That's step one.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              {taxCard("External Patterns", extMinusBiases === 0 ? "Clear" : `${extMinusBiases} detected`, processTaxColor, extMinusBiases === 0 ? "All external capacities active" : `${extMinusBiases} lens${extMinusBiases > 1 ? "es" : ""} showing bias pattern`)}
              {taxCard("Internal Impact", intMinusBiases === 0 ? "Clear" : `${intMinusBiases} detected`, intMinusBiases === 0 ? C.green : "#E65100", intMinusBiases === 0 ? "Internal foundation stable" : `${intMinusBiases} dimension${intMinusBiases > 1 ? "s" : ""} showing environment sensitivity`)}
              {taxCard("Signal Level", extMinusBiases === 0 ? "Clear" : extMinusBiases === 1 ? "Low" : extMinusBiases >= 2 ? "Elevated" : "Clear", processTaxColor, "Based on external bias patterns")}
            </div>
            {extMinusBiases > 0 && (
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, padding: "12px 16px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, borderLeft: "4px solid #E65100" }}>
                Your data shows decision-making capacity you're not fully using right now. It shows up as second-guessing yourself, ignoring data you know matters, or defaulting to one lens when the situation calls for another. Whether this pattern is environment-driven or experience-driven is exactly what the Environment Alignment is built to clarify.
              </div>
            )}
          </ReportSection>

          {/* 8: Compound Bill */}
          <ReportSection num={8} title="THE COMPOUND BILL: Your Environment Picture">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>Your Preference Tax is confirmed from your data. It's the behavioral energy cost your environment charges you every day. Your Process Signals identify patterns in your decision-making that are worth digging into. Together, they start to reveal the gap between who you are and how you're showing up.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {taxCard("Preference Tax", prefTaxLabel, prefTaxColor, `${prefTax} gap points confirmed`)}
              {taxCard("Process Signals", extMinusBiases === 0 ? "Clear" : `${extMinusBiases} pattern${extMinusBiases > 1 ? "s" : ""}`, processTaxColor, extMinusBiases === 0 ? "No patterns detected" : `${extMinusBiases} bias pattern${extMinusBiases > 1 ? "s" : ""} to examine`)}
            </div>
            {/* Peak-End Rule: Compound Bill Verdict - the session's peak moment */}
            {(() => {
              const overallColor = prefTaxLabel === "Critical" ? "#7F1D1D" : prefTaxLabel === "Heavy" ? "#C62828" : prefTaxLabel === "Significant" ? "#E65100" : prefTaxLabel === "Moderate" ? "#F59E0B" : C.green;
              const verdictCopy = prefTaxLabel === "Critical"
                ? `The exhaustion you feel isn't a motivation problem. It's a design problem at a critical level. Your environment is demanding near-maximum adaptation from you right now. That's unsustainable. You deserve to know that, and you deserve a path out of it.`
                : prefTaxLabel === "Heavy"
                ? `The fatigue you feel isn't weakness. It's the cost of showing up as someone you're not, day after day. Your environment is charging you more than it should. That's a design problem. And design problems have design solutions.`
                : prefTaxLabel === "Significant"
                ? `You're carrying a real daily cost right now. Multiple dimensions of who you are are under sustained pressure. You feel it most when you're supposed to be off the clock, but you can't switch off. Your Process Signals show additional patterns worth digging into through the Environment Alignment.`
                : prefTaxLabel === "Moderate"
                ? `Some days feel natural. Others feel like a performance. Knowing which dimensions carry the most cost is how you start negotiating better conditions. Your Process Signals show additional patterns worth exploring.`
                : `Your behavioral environment largely fits who you are. That's rare. Protect it. Your Process Signals are still worth examining to make sure the full picture holds.`;
              return (
                <div style={{ padding: "24px 28px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, borderLeft: `5px solid ${overallColor}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Your Compound Bill</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: overallColor, lineHeight: 1, marginBottom: 12 }}>Preference: {prefTaxLabel}</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, fontWeight: 500 }}>
                    {p.name.split(" ")[0]}, {verdictCopy}
                  </div>
                </div>
              );
            })()}
          </ReportSection>

        </div>
      </div>
    </div>
  );
}
