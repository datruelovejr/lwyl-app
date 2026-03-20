'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { discFull, isEqualExtProfile } from '../constants/data';
import { Bias } from './Bias';
import { Btn } from './Btn';
import { getEnvironmentTaxSummary } from '../knowledge/assessmentInsights';

// ────── INDIVIDUAL COMPARISON (Sprint 3A) ──────
export function IndividualComparison({ leader, person, agreements, setAgreements, onStartWizard }) {
  const dims = ["D", "I", "S", "C"];

  // DISC gap analysis - thresholds per Friction Finder Facilitator Guide
  // HIGH ≥ 40 pts | MODERATE 20-39 pts | LOW < 20 pts
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

  // Tier styles - CSS var accents for severity
  const tierStyle = {
    high:     { accent: "var(--friction-high)",        label: "HIGH" },
    moderate: { accent: "var(--alert-warning-accent)", label: "MODERATE" },
    low:      { accent: "var(--alert-success-accent)", label: "LOW" },
  };

  // Process (Attributes) bias comparison - per Friction Finder Guide
  // CONFLICT = + vs −  |  TENSION = + vs = or − vs =  |  ALIGNED = same bias
  const processBiasResult = (lBias, pBias) => {
    if ((lBias === "+" && pBias === "\u2212") || (lBias === "\u2212" && pBias === "+")) return { label: "CONFLICT", accent: "var(--friction-high)" };
    if (lBias === pBias) return { label: "ALIGNED", accent: "var(--alert-success-accent)" };
    return { label: "TENSION", accent: "var(--alert-warning-accent)" };
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
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-3.5 px-4.5 py-3.5 bg-card rounded-[10px] border border-border border-l-3 flex items-center gap-2.5"
        style={{ borderLeftColor: "var(--nav-accent)" }}
      >
        <span className="text-base" style={{ color: "var(--nav-accent)" }}>{"\u2605"}</span>
        <div>
          <div className="text-[13px] font-bold text-foreground">CLOSING THE DISTANCE - {leader.name} &amp; {person.name}</div>
          <div className="text-[11px] text-muted">Friction map across Preference, Passion, and Process</div>
        </div>
        <div className="ml-auto">
          <Btn primary onClick={onStartWizard} style={{ background: existingAgreement ? "var(--alert-success-accent)" : "var(--nav-bg)" }}>
            {existingAgreement ? "\u2713 View Agreement" : "Start Connection Agreement"}
          </Btn>
        </div>
      </motion.div>

      {/* DISC Gaps - Preference Friction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-card rounded-xl px-6 py-5 border border-border mb-3.5 shadow-sm"
      >
        <div className="mb-3.5">
          <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-1">PREFERENCE GAP</div>
          <div className="text-[13px] text-muted">How your behavioral styles differ across D, I, S, C</div>
        </div>
        {/* Score comparison - Comparison Panel style */}
        <div className="flex rounded-[10px] overflow-hidden border border-border mb-3.5">
          <div className="flex-1 px-4 py-3 bg-card border-l-3" style={{ borderLeftColor: "var(--nav-accent)" }}>
            <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--nav-accent)" }}>{"\u2605"} {leader.name}</div>
            <div className="flex gap-2">
              {dims.map(d => <span key={d} className="text-[13px] font-extrabold" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{d}:{leader.disc.natural[d]}</span>)}
            </div>
          </div>
          <div className="w-px bg-border shrink-0" />
          <div className="flex-1 px-4 py-3 bg-card">
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1.5">{person.name}</div>
            <div className="flex gap-2">
              {dims.map(d => <span key={d} className="text-[13px] font-extrabold" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{d}:{person.disc.natural[d]}</span>)}
            </div>
          </div>
        </div>
        {/* Per-dimension gap cards */}
        <div className="grid grid-cols-2 gap-2">
          {discGaps.map(({ d, lScore, pScore, gap, tier, text }) => {
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
                    <div className="text-[9px] font-bold mb-0.5" style={{ color: "var(--nav-accent)" }}>{"\u2605"} Leader</div>
                    <div className="text-lg font-extrabold text-foreground leading-none">{lScore}</div>
                  </div>
                  <div
                    className="text-[11px] font-extrabold"
                    style={{ color: tier === "high" ? ts.accent : "var(--text-muted)" }}
                  >
                    {"\u0394"}{gap}
                  </div>
                  <div className="flex-1 text-center py-1.5 rounded-md bg-subtle border border-border">
                    <div className="text-[9px] font-bold text-muted mb-0.5">Member</div>
                    <div className="text-lg font-extrabold text-foreground leading-none">{pScore}</div>
                  </div>
                </div>
                {tier !== "low" && <div className="text-[10px] text-foreground leading-relaxed">{text}</div>}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Values Comparison - Passion Friction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-card rounded-xl px-6 py-5 border border-border mb-3.5 shadow-sm"
      >
        <div className="mb-3.5">
          <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-1">PASSION GAP</div>
          <div className="text-[13px] text-muted">Motivational driver differences - what energizes each of you</div>
        </div>
        <div className="flex flex-col gap-2">
          {/* Shared Drivers */}
          <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3" style={{ borderLeftColor: "var(--nav-accent)" }}>
            <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--nav-accent)" }}>Shared Drivers</div>
            <div className="flex gap-1 flex-wrap">
              {sharedVals.length > 0 ? sharedVals.map(v => (
                <span
                  key={v}
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: `var(--values-${v.toLowerCase()})`,
                    borderColor: `var(--values-${v.toLowerCase()})`,
                    backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)`
                  }}
                >
                  {v}
                </span>
              )) : <span className="text-[10px] text-muted">No shared top drivers</span>}
            </div>
          </div>
          {/* Blind Spot */}
          <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3" style={{ borderLeftColor: "var(--alert-warning-accent)" }}>
            <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--alert-warning-accent)" }}>Your Blind Spot</div>
            <div className="text-[9px] text-muted mb-1.5">They care about this - you may not be fueling it</div>
            <div className="flex gap-1 flex-wrap">
              {personOnly.length > 0 ? personOnly.map(v => (
                <span
                  key={v}
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: `var(--values-${v.toLowerCase()})`,
                    borderColor: `var(--values-${v.toLowerCase()})`,
                    backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)`
                  }}
                >
                  {v}
                </span>
              )) : <span className="text-[10px] text-muted">No gaps here</span>}
            </div>
          </div>
          {/* Your Strength */}
          <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3" style={{ borderLeftColor: "var(--alert-info-accent)" }}>
            <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--alert-info-accent)" }}>Your Strength</div>
            <div className="text-[9px] text-muted mb-1.5">You care about this - they may not notice or share it</div>
            <div className="flex gap-1 flex-wrap">
              {leaderOnly.length > 0 ? leaderOnly.map(v => (
                <span
                  key={v}
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: `var(--values-${v.toLowerCase()})`,
                    borderColor: `var(--values-${v.toLowerCase()})`,
                    backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)`
                  }}
                >
                  {v}
                </span>
              )) : <span className="text-[10px] text-muted">No gaps here</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Attributes Comparison - Process Friction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-card rounded-xl px-6 py-5 border border-border mb-3.5 shadow-sm"
      >
        <div className="mb-3.5">
          <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-1">PROCESS GAP</div>
          <div className="text-[13px] text-muted">Decision-making style - bias comparison per Heart {"\u00b7"} Hand {"\u00b7"} Head</div>
        </div>
        {/* Side-by-side attribute profiles */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {[{ label: "\u2605 " + leader.name, data: leader.attr.ext, isLeader: true }, { label: person.name, data: person.attr.ext, isLeader: false }].map(({ label, data, isLeader }) => {
            const sorted = [...data].sort((a, b) => b.score - a.score);
            const isEqual = isEqualExtProfile(data);
            return (
              <div
                key={label}
                className={`px-3.5 py-3 rounded-lg bg-card border border-border ${isLeader ? 'border-l-3' : ''}`}
                style={isLeader ? { borderLeftColor: "var(--nav-accent)" } : undefined}
              >
                <div className="text-[10px] font-bold mb-2" style={{ color: isLeader ? "var(--nav-accent)" : "var(--text-muted)" }}>{label}{isEqual ? " (Versatile)" : ""}</div>
                {(isEqual ? data : sorted).map((a, i) => (
                  <div key={a.name} className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 border"
                      style={{
                        background: isEqual || i === 0 ? "var(--attr-ext)" : "var(--bg-subtle)",
                        color: isEqual || i === 0 ? "var(--bg-card)" : "var(--text-muted)",
                        borderColor: isEqual || i === 0 ? "transparent" : "var(--border-default)"
                      }}
                    >
                      {isEqual ? "=" : i + 1}
                    </span>
                    <span className={`text-[11px] ${isEqual || i === 0 ? 'font-bold text-foreground' : 'font-normal text-muted'}`}>{a.label}</span>
                    <span className="text-[10px] text-muted ml-auto">{a.score}</span>
                    <Bias bias={a.bias} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {/* Bias-based friction analysis per dimension */}
        <div className="flex flex-col gap-1.5">
          {["Heart", "Hand", "Head"].map(label => {
            const lAttr = leader.attr.ext.find(a => a.label === label);
            const pAttr = person.attr.ext.find(a => a.label === label);
            if (!lAttr || !pAttr) return null;
            const result = processBiasResult(lAttr.bias, pAttr.bias);
            return (
              <div
                key={label}
                className="px-3.5 py-2.5 rounded-lg bg-card border border-border border-l-3 flex items-center gap-3"
                style={{ borderLeftColor: result.accent }}
              >
                <div className="flex-1">
                  <span className="text-xs font-bold text-foreground">{label}</span>
                  <span className="text-[10px] text-muted ml-2">{"\u2605"} {lAttr.bias} vs. {pAttr.bias}</span>
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
        {leaderExtLead.label !== personExtLead.label && (
          <div className="mt-2.5 px-4 py-3 rounded-lg bg-subtle border border-border text-[11px] text-foreground leading-relaxed">
            <strong>{person.name.split(" ")[0]}</strong> {attrInsightMap[personExtLead.label]}
          </div>
        )}
      </motion.div>

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
              area: `${discFull[d]} Gap (\u0394${gap})`,
              severity: tier,
              what: leaderHigher
                ? `Your drive can overwhelm ${firstName}. They need processing time you don't naturally give.`
                : `${firstName}'s drive can feel like pressure to you. Their pace isn't aggression -- it's how they're built.`,
              fix: leaderHigher
                ? `Before important decisions, give ${firstName} a heads-up: "I want to discuss X tomorrow -- think about it." That one sentence converts your speed from pressure into partnership.`
                : `Let ${firstName} own the pace on tasks where urgency matters. Say: "This is yours to drive. Tell me what you need from me." Then get out of the way.`
            });
          }
          if (d === "I") {
            actions.push({
              area: `${discFull[d]} Gap (\u0394${gap})`,
              severity: tier,
              what: leaderHigher
                ? `Your social energy can feel exhausting to ${firstName}. They need substance before connection.`
                : `${firstName} needs more connection than you naturally provide. Silence reads as disapproval to them.`,
              fix: leaderHigher
                ? `Start 1:1s with a quick check-in, then move to substance. Don't extend the social warm-up if they're ready to work. Follow their lead on pace.`
                : `Open conversations with a genuine question about them -- not work. Even 30 seconds of personal connection changes how ${firstName} receives everything that follows.`
            });
          }
          if (d === "S") {
            actions.push({
              area: `${discFull[d]} Gap (\u0394${gap})`,
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
              area: `${discFull[d]} Gap (\u0394${gap})`,
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
              Aesthetic: `Pay attention to how things feel, not just whether they work. ${firstName} notices the environment, the design, the experience. Acknowledging that isn't vanity -- it's how they process quality.`
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
            "Heart\u2192Hand": `You lead with people, they lead with results. When presenting to ${firstName}, flip your sequence: outcome first, then people impact. They'll hear the people part better after the practical part lands.`,
            "Heart\u2192Head": `You lead with people, they lead with systems. Give ${firstName} the framework before the story. Structure earns their trust, then they'll care about the people inside it.`,
            "Hand\u2192Heart": `You lead with results, they lead with people. Before presenting decisions, add one sentence: "Here's how this affects the people involved." That's all it takes to open ${firstName}'s ears.`,
            "Hand\u2192Head": `You lead with results, they lead with systems. ${firstName} needs to understand why it works before they trust that it does. Give them the logic, then the outcome.`,
            "Head\u2192Heart": `You lead with systems, they lead with people. Your frameworks are powerful, but ${firstName} needs to hear the human story first. Open with impact, close with structure.`,
            "Head\u2192Hand": `You lead with systems, they lead with results. ${firstName} wants to know what's actionable before they'll engage with your analysis. Lead with "Here's what we do" then explain why.`
          };
          const key = `${leaderExtLead.label}\u2192${personExtLead.label}`;
          actions.push({
            area: "Decision-Making Sequence",
            severity: "moderate",
            what: `You process through ${leaderExtLead.label} first. ${firstName} processes through ${personExtLead.label}. You're speaking different languages in the same conversation.`,
            fix: procFixes[key] || `Start conversations in ${firstName}'s language (${personExtLead.label}), not yours. You can still arrive at your conclusion -- just enter through their door.`
          });
        }

        // Environment context
        if (personTax.totalGap >= 80) {
          actions.push({
            area: "Environment Tax Warning",
            severity: personTax.totalGap >= 120 ? "high" : "moderate",
            what: `${firstName} is carrying ${personTax.totalGap} gap points of environment tax right now. Some of the friction you feel with them may not be personal -- it may be environmental.`,
            fix: `Before addressing behavioral friction, ask: "Is there something about your environment that's making this harder than it should be?" That question alone can shift the entire conversation from blame to design.`
          });
        }

        if (actions.length === 0) return null;

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-card rounded-xl px-6 py-5 border border-border mb-3.5 shadow-sm"
          >
            <div className="mb-3.5">
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1 text-alert-success-accent">FRICTION ELIMINATION</div>
              <div className="text-[13px] text-muted">What to do about the gaps above -- specific, actionable strategies</div>
            </div>
            <div className="flex flex-col gap-2">
              {actions.map((a, i) => {
                const sAccent = a.severity === "high" ? "var(--friction-high)" : "var(--alert-warning-accent)";
                return (
                  <div key={i} className="px-4 py-3 rounded-lg bg-card border border-border border-l-3" style={{ borderLeftColor: sAccent }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs font-bold text-foreground">{a.area}</span>
                      <span
                        className="text-[9px] font-bold rounded px-1.5 py-px border"
                        style={{
                          color: sAccent,
                          backgroundColor: `color-mix(in srgb, ${sAccent} 8%, transparent)`,
                          borderColor: `color-mix(in srgb, ${sAccent} 15%, transparent)`
                        }}
                      >
                        {a.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted leading-relaxed mb-1.5">{a.what}</div>
                    <div className="text-[11px] text-foreground leading-relaxed px-3 py-2 rounded-md bg-alert-success-bg border border-alert-success-border">
                      <strong className="text-alert-success-accent text-[10px] tracking-wide">FIX:</strong> {a.fix}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}
