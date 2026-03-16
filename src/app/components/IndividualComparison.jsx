'use client';

import { useState } from 'react';
import { C } from '../constants/colors';
import { discFull, isEqualExtProfile } from '../constants/data';
import { Bias } from './Bias';
import { Btn } from './Btn';
import { getEnvironmentTaxSummary } from '../knowledge/assessmentInsights';

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

      {/* Friction Elimination - Actionable Remediation */}
      {(() => {
        const firstName = person.name.split(" ")[0];
        const leaderFirst = leader.name.split(" ")[0];
        const highGaps = discGaps.filter(g => g.tier !== "low");
        const personTax = getEnvironmentTaxSummary(person);
        const actions = [];

        // DISC remediation
        highGaps.forEach(({ d, lScore, pScore, gap, tier, leaderHigher }) => {
          if (d === "D") {
            actions.push({
              area: `${discFull[d]} Gap (Δ${gap})`,
              severity: tier,
              what: leaderHigher
                ? `Your drive can overwhelm ${firstName}. They need processing time you don't naturally give.`
                : `${firstName}'s drive can feel like pressure to you. Their pace isn't aggression — it's how they're built.`,
              fix: leaderHigher
                ? `Before important decisions, give ${firstName} a heads-up: "I want to discuss X tomorrow — think about it." That one sentence converts your speed from pressure into partnership.`
                : `Let ${firstName} own the pace on tasks where urgency matters. Say: "This is yours to drive. Tell me what you need from me." Then get out of the way.`
            });
          }
          if (d === "I") {
            actions.push({
              area: `${discFull[d]} Gap (Δ${gap})`,
              severity: tier,
              what: leaderHigher
                ? `Your social energy can feel exhausting to ${firstName}. They need substance before connection.`
                : `${firstName} needs more connection than you naturally provide. Silence reads as disapproval to them.`,
              fix: leaderHigher
                ? `Start 1:1s with a quick check-in, then move to substance. Don't extend the social warm-up if they're ready to work. Follow their lead on pace.`
                : `Open conversations with a genuine question about them — not work. Even 30 seconds of personal connection changes how ${firstName} receives everything that follows.`
            });
          }
          if (d === "S") {
            actions.push({
              area: `${discFull[d]} Gap (Δ${gap})`,
              severity: tier,
              what: leaderHigher
                ? `Your need for stability can slow ${firstName} down. They want to move before you're ready.`
                : `${firstName} needs more stability than you provide. Your pace of change feels chaotic to them.`,
              fix: leaderHigher
                ? `When ${firstName} proposes change, don't default to "let me think about it." Instead: "Walk me through the risk and I'll give you an answer by [specific time]."`
                : `Before introducing change, tell ${firstName} what's NOT changing. Lead with the anchor, then introduce the shift. That sequence matters.`
            });
          }
          if (d === "C") {
            actions.push({
              area: `${discFull[d]} Gap (Δ${gap})`,
              severity: tier,
              what: leaderHigher
                ? `Your precision can feel like micromanagement to ${firstName}. They trust their gut more than your checklists.`
                : `${firstName} needs more specifics than you naturally provide. Your big-picture approach leaves gaps they can't fill.`,
              fix: leaderHigher
                ? `Define the quality bar upfront, then let ${firstName} get there their way. Check the outcome, not the process. If it meets the standard, the method doesn't matter.`
                : `Before assigning work, write down three specifics: what success looks like, what the deadline is, and what quality standard applies. ${firstName} can't hit a target they can't see.`
            });
          }
        });

        // Values remediation
        if (personOnly.length > 0) {
          personOnly.forEach(v => {
            const valFixes = {
              Altruistic: `Connect their work to human impact. Frame tasks as "This helps [person/group] by [outcome]." That framing costs you nothing and gives ${firstName} fuel.`,
              Economic: `Show them the ROI. Before assigning work, answer: "Here's what this produces and why it's worth the investment." Efficiency is how they process respect.`,
              Individualistic: `Give them ownership over the how. Define the what, set the deadline, and let them figure out the path. Check in on progress, not methods.`,
              Political: `Give them visibility. Include them in decisions that affect their scope. The difference between a leader who includes them and one who doesn't is the difference between loyalty and quiet disengagement.`,
              Regulatory: `Provide structure before you provide freedom. Clear expectations, documented standards, and consistent follow-through are how ${firstName} feels safe enough to perform.`,
              Theoretical: `Give them the why behind the what. Even 60 seconds of context transforms their engagement. "We're doing this because..." is the sentence that turns compliance into commitment.`,
              Aesthetic: `Pay attention to how things feel, not just whether they work. ${firstName} notices the environment, the design, the experience. Acknowledging that isn't vanity — it's how they process quality.`
            };
            actions.push({
              area: `${v} (Their Driver, Not Yours)`,
              severity: "moderate",
              what: `${firstName} is driven by ${v} at a level you don't share. They may feel like this part of them is invisible in your leadership.`,
              fix: valFixes[v] || `Acknowledge what fuels ${firstName} even when it doesn't fuel you. That acknowledgment alone reduces friction.`
            });
          });
        }

        // Process remediation
        if (leaderExtLead.label !== personExtLead.label) {
          const procFixes = {
            "Heart→Hand": `You lead with people, they lead with results. When presenting to ${firstName}, flip your sequence: outcome first, then people impact. They'll hear the people part better after the practical part lands.`,
            "Heart→Head": `You lead with people, they lead with systems. Give ${firstName} the framework before the story. Structure earns their trust, then they'll care about the people inside it.`,
            "Hand→Heart": `You lead with results, they lead with people. Before presenting decisions, add one sentence: "Here's how this affects the people involved." That's all it takes to open ${firstName}'s ears.`,
            "Hand→Head": `You lead with results, they lead with systems. ${firstName} needs to understand why it works before they trust that it does. Give them the logic, then the outcome.`,
            "Head→Heart": `You lead with systems, they lead with people. Your frameworks are powerful, but ${firstName} needs to hear the human story first. Open with impact, close with structure.`,
            "Head→Hand": `You lead with systems, they lead with results. ${firstName} wants to know what's actionable before they'll engage with your analysis. Lead with "Here's what we do" then explain why.`
          };
          const key = `${leaderExtLead.label}→${personExtLead.label}`;
          actions.push({
            area: "Decision-Making Sequence",
            severity: "moderate",
            what: `You process through ${leaderExtLead.label} first. ${firstName} processes through ${personExtLead.label}. You're speaking different languages in the same conversation.`,
            fix: procFixes[key] || `Start conversations in ${firstName}'s language (${personExtLead.label}), not yours. You can still arrive at your conclusion — just enter through their door.`
          });
        }

        // Environment context
        if (personTax.totalGap >= 80) {
          actions.push({
            area: "Environment Tax Warning",
            severity: personTax.totalGap >= 120 ? "high" : "moderate",
            what: `${firstName} is carrying ${personTax.totalGap} gap points of environment tax right now. Some of the friction you feel with them may not be personal — it may be environmental.`,
            fix: `Before addressing behavioral friction, ask: "Is there something about your environment that's making this harder than it should be?" That question alone can shift the entire conversation from blame to design.`
          });
        }

        if (actions.length === 0) return null;

        return (
          <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#2E7D32", marginBottom: 4 }}>FRICTION ELIMINATION</div>
              <div style={{ fontSize: 13, color: C.muted }}>What to do about the gaps above — specific, actionable strategies</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {actions.map((a, i) => {
                const sColor = a.severity === "high" ? "#C62828" : "#E65100";
                return (
                  <div key={i} style={{ padding: "12px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${sColor}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{a.area}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: sColor, background: sColor + "10", border: `1px solid ${sColor}25`, borderRadius: 4, padding: "1px 6px" }}>{a.severity.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 6 }}>{a.what}</div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6, padding: "8px 12px", borderRadius: 6, background: "#F0FAF0", border: "1px solid #D1FAE5" }}>
                      <strong style={{ color: "#2E7D32", fontSize: 10, letterSpacing: 0.5 }}>FIX:</strong> {a.fix}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
