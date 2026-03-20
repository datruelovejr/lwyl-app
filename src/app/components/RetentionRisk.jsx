'use client';

import { motion } from 'framer-motion';
import { discFull, normBias } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Card, AlertCard, MetricCard } from "./ui";
import { getEnvironmentTaxSummary } from "../knowledge/assessmentInsights";
import { generateKRIs } from "../knowledge/sopEngine";
import { getKRINextStep, getSopKRINextStep } from "../knowledge/narrativeEngine";

export function RetentionRisk({ people, teamId, orgId, leaderId }) {
  const isMobile = useIsMobile();
  const complete = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");

  if (complete.length < 2) return (
    <div className="max-w-3xl mx-auto px-8 py-6">
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Retention Risk</h1>
      <div className="text-center py-16 text-muted">
        <div className="text-4xl mb-3">{"\ud83d\udee1\ufe0f"}</div>
        <div className="text-sm font-semibold">Need at least 2 complete assessments</div>
        <div className="text-xs mt-1">Upload assessments to see retention risk indicators</div>
      </div>
    </div>
  );

  // ── KRI Calculations ──
  const intNames = ["Self-Esteem", "Role Awareness", "Self-Direction"];

  const severityClasses = {
    green:  { text: "text-alert-success-accent",  bg: "bg-alert-success-bg",  border: "border-alert-success-border",  accent: "var(--alert-success-accent)" },
    yellow: { text: "text-alert-warning-accent",  bg: "bg-alert-warning-bg",  border: "border-alert-warning-border",  accent: "var(--alert-warning-accent)" },
    red:    { text: "text-alert-critical-accent", bg: "bg-alert-critical-bg", border: "border-alert-critical-border", accent: "var(--alert-critical-accent)" },
  };

  const kriData = intNames.map(name => {
    const rows = complete.map(p => {
      const a = p.attr.int.find(a => a.name === name);
      return a ? { score: a.score, bias: normBias(a.bias), person: p } : null;
    }).filter(Boolean);

    const avgScore = rows.length > 0 ? Math.round((rows.reduce((s, r) => s + r.score, 0) / rows.length) * 10) / 10 : 0;
    const minusBias = rows.filter(r => r.bias === "\u2212").length;
    const plusBias  = rows.filter(r => r.bias === "+").length;
    const equalBias = rows.filter(r => r.bias === "=").length;
    const minusPct = rows.length > 0 ? Math.round((minusBias / rows.length) * 100) : 0;

    const risk = (minusPct >= 60 || avgScore < 6.0) ? "red"
               : (minusPct >= 40 || avgScore < 7.0) ? "yellow"
               : "green";

    const atRiskPeople = rows.filter(r => r.bias === "\u2212").map(r => r.person.name.split(" ")[0]);

    const descriptions = {
      "Self-Esteem": {
        green: "Your team trusts their own value. They can take feedback without losing footing.",
        yellow: "Some of your team may be underselling themselves or waiting for external permission before acting. Worth watching.",
        red: "Self-doubt is systemic here. Your team is likely operating below their actual capability because they don't fully trust their own judgment."
      },
      "Role Awareness": {
        green: "Your team has clear ownership. People know what's theirs to carry.",
        yellow: "Role ambiguity is creating friction. Some people are overextending while others may be underfilling. Worth clarifying.",
        red: "Role clarity is a real problem. The team is burning energy on undefined ownership. This shows up as conflict, dropped balls, and quiet resentment."
      },
      "Self-Direction": {
        green: "Your team can lead themselves. They know where they're going.",
        yellow: "Some team members need more direction than you realize. Ambiguity costs them energy.",
        red: "Your team needs more directional clarity than they're getting. Without it, they default to inaction or wait for you to decide."
      }
    };

    return { name, avgScore, minusBias, plusBias, equalBias, minusPct, risk, total: rows.length, desc: descriptions[name][risk], atRiskPeople };
  });

  const overallRisk = kriData.some(k => k.risk === "red") ? "red"
                    : kriData.some(k => k.risk === "yellow") ? "yellow" : "green";
  const riskLabel = { red: "Elevated", yellow: "Watch", green: "Healthy" };

  // ── SOP Engine KRIs ──
  const sopKRIs = generateKRIs(complete, null);

  const sopKRIEntries = [
    { key: "preferenceTax", label: "Preference Tax" },
    { key: "preferenceFriction", label: "Preference Friction" },
    { key: "processGaps", label: "Process Gaps" },
  ];

  // ── Frustrated PT Detection ──
  const memberTax = complete.map(p => ({
    ...p,
    tax: getEnvironmentTaxSummary(p),
    totalGap: getEnvironmentTaxSummary(p).totalGap,
  }));
  const frustPT = memberTax.filter(m => m.tax.hasFrustratedPT);

  // ── Per-person risk narratives ──
  const getRetentionNarrative = (p) => {
    const name = p.name.split(" ")[0];
    const tax = getEnvironmentTaxSummary(p);
    const risks = [];

    p.attr.int.forEach(a => {
      if (normBias(a.bias) === "\u2212") {
        if (a.name === "Self-Esteem") risks.push(`${name} is undervaluing themselves. That usually means they're not speaking up, not pushing back, and not advocating for what they need.`);
        if (a.name === "Role Awareness") risks.push(`${name} doesn't have clear role boundaries. They're either doing too much or not enough, and they know it.`);
        if (a.name === "Self-Direction") risks.push(`${name} needs more clarity on where they're headed. Without it, they're coasting or anxious.`);
      }
    });

    if (tax.hasFrustratedPT) risks.push(`${name} has a Frustrated Practical Thinking bias. Their environment has taught them that getting results doesn't matter. That's the strongest damage signal in the assessment.`);
    if (tax.totalGap >= 80) risks.push(`${name} is carrying ${tax.totalGap} gap points of adaptation cost. Their environment is asking them to be someone they're not.`);

    return risks;
  };

  const atRiskPeople = complete.filter(p => {
    const hasMinusBias = p.attr.int.some(a => normBias(a.bias) === "\u2212");
    const tax = getEnvironmentTaxSummary(p);
    return hasMinusBias || tax.hasFrustratedPT || tax.totalGap >= 80;
  });

  return (
    <div className={`max-w-3xl mx-auto ${isMobile ? 'px-4 py-4' : 'px-8 py-6'}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-extrabold text-foreground tracking-tight`}>Retention Risk</h1>
        <div className="text-xs text-muted mt-0.5">Internal attributes across {complete.length} team members</div>
      </motion.div>

      {/* Key Retention Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-foreground m-0">Key Retention Indicators</h2>
              <p className="text-xs text-muted mt-0.5 m-0">How your team sees themselves, their roles, and their direction</p>
            </div>
            <span
              className={`text-[10px] font-bold px-3 py-1 rounded-full text-card ${severityClasses[overallRisk].text}`}
              style={{ backgroundColor: severityClasses[overallRisk].accent, color: "var(--bg-card)" }}
            >
              {riskLabel[overallRisk]} Risk
            </span>
          </div>

          {/* Summary Metrics */}
          <div className="flex gap-2 flex-wrap mb-5">
            <MetricCard
              value={kriData.filter(k => k.risk === "red").length}
              label="Critical indicators"
              sublabel="of 3 measured"
              accentColor={kriData.some(k => k.risk === "red") ? "alert-critical-accent" : "alert-success-accent"}
            />
            <MetricCard
              value={atRiskPeople.length}
              label="People at risk"
              sublabel="internal attribute flags"
              accentColor={atRiskPeople.length > 0 ? "alert-warning-accent" : "alert-success-accent"}
            />
            <MetricCard
              value={frustPT.length}
              label="Damage signals"
              sublabel="frustrated PT bias"
              accentColor={frustPT.length > 0 ? "alert-critical-accent" : "alert-success-accent"}
            />
          </div>

          {/* KRI Cards */}
          <div className="flex flex-col gap-3">
            {kriData.map(k => {
              const sc = severityClasses[k.risk];
              return (
                <div key={k.name} className={`${sc.bg} border ${sc.border} rounded-xl p-4 border-l-4`} style={{ borderLeftColor: sc.accent }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[13px] font-extrabold text-foreground">{k.name}</div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-muted">Avg: <strong className={sc.text}>{k.avgScore}</strong> / 10</span>
                      <span className={`text-[10px] font-bold ${sc.text} bg-card px-2.5 py-0.5 rounded-lg`}>{riskLabel[k.risk].toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Bias distribution bar */}
                  <div className="flex h-2 rounded overflow-hidden mb-2">
                    {k.plusBias > 0 && <div className="bg-alert-success-accent" style={{ flex: k.plusBias }} title={`${k.plusBias} Requires (+)`} />}
                    {k.equalBias > 0 && <div className="bg-alert-info-accent" style={{ flex: k.equalBias }} title={`${k.equalBias} Balanced (=)`} />}
                    {k.minusBias > 0 && <div className="bg-alert-critical-accent" style={{ flex: k.minusBias }} title={`${k.minusBias} Undervalues (-)`} />}
                  </div>

                  <div className="flex gap-3 mb-2.5 text-[11px] text-muted">
                    <span className="text-alert-success-accent font-semibold">{k.plusBias} Requires (+)</span>
                    <span className="text-alert-info-accent font-semibold">{k.equalBias} Balanced (=)</span>
                    <span className="text-alert-critical-accent font-semibold">{k.minusBias} Undervalues (-)</span>
                  </div>

                  <div className="text-xs text-foreground leading-relaxed">{k.desc}</div>

                  {k.atRiskPeople.length > 0 && (
                    <div className={`text-[11px] ${sc.text} mt-2 font-semibold`}>
                      Undervaluing: {k.atRiskPeople.join(", ")}
                    </div>
                  )}

                  {/* Next step */}
                  {getKRINextStep(k.name, k.risk) && (
                    <div className="mt-3 p-3 rounded-lg bg-card border border-border">
                      <div className="text-[10px] font-bold text-alert-success-accent uppercase tracking-wide mb-1">What to do about it</div>
                      <div className="text-[11px] text-foreground leading-relaxed">{getKRINextStep(k.name, k.risk)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* SOP Engine KRI Severity Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-8"
      >
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-foreground m-0">Systemic Risk Indicators</h2>
            <p className="text-xs text-muted mt-0.5 m-0">Organizational patterns from SOP engine analysis</p>
          </div>
          <div className="flex flex-col gap-3">
            {sopKRIEntries.map(({ key, label }) => {
              const kri = sopKRIs[key];
              const sc = severityClasses[kri.severity];
              return (
                <div key={key} className={`${sc.bg} border ${sc.border} rounded-xl p-4 border-l-4`} style={{ borderLeftColor: sc.accent }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[13px] font-extrabold text-foreground">{label}</div>
                    <span className={`text-[10px] font-bold ${sc.text} bg-card px-2.5 py-0.5 rounded-lg`}>{riskLabel[kri.severity].toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-foreground leading-relaxed">{kri.description}</div>
                  {getSopKRINextStep(key, kri.severity) && (
                    <div className="mt-3 p-3 rounded-lg bg-card border border-border">
                      <div className="text-[10px] font-bold text-alert-success-accent uppercase tracking-wide mb-1">What to do about it</div>
                      <div className="text-[11px] text-foreground leading-relaxed">{getSopKRINextStep(key, kri.severity)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Frustrated PT - environment damage */}
      {frustPT.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-foreground m-0">Environment Damage Signals</h2>
              <p className="text-xs text-muted mt-0.5 m-0">People whose environment has taught them results don't matter</p>
            </div>
            {frustPT.map((m) => {
              const name = m.name.split(" ")[0];
              return (
                <AlertCard key={m.id} severity="critical" title={`${name}: Frustrated Practical Thinking`}>
                  {name}'s environment has taught them that getting practical results doesn't matter. That's the single strongest damage signal in the entire assessment. It's worth a direct conversation.
                </AlertCard>
              );
            })}
          </Card>
        </motion.div>
      )}

      {/* Per-person risk stories */}
      {atRiskPeople.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: frustPT.length > 0 ? 0.4 : 0.3 }}
        >
          <Card>
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-foreground m-0">People to Watch</h2>
              <p className="text-xs text-muted mt-0.5 m-0">Team members showing retention risk signals</p>
            </div>
            {atRiskPeople.map(p => {
              const name = p.name.split(" ")[0];
              const risks = getRetentionNarrative(p);
              if (risks.length === 0) return null;

              const hasIntBias = p.attr.int.some(a => normBias(a.bias) === "\u2212");
              const tax = getEnvironmentTaxSummary(p);
              let nextStep = "";
              if (tax.hasFrustratedPT) {
                nextStep = `Have a direct conversation with ${name}: "I can see that your environment may be telling you that results don't matter. I want to understand what's driving that. What would need to change for you to feel like your practical contributions land?"`;
              } else if (tax.totalGap >= 80) {
                nextStep = `Check in with ${name} about what part of their day feels most draining. Not the workload -- the way they have to show up. Ask: "What part of this role asks you to be someone you're not?"`;
              } else if (hasIntBias) {
                const topIntIssue = p.attr.int.find(a => normBias(a.bias) === "\u2212");
                if (topIntIssue?.name === "Self-Esteem") {
                  nextStep = `Ask ${name}: "What's one thing you know you're good at that this team doesn't see?" Then create space for that thing to be visible.`;
                } else if (topIntIssue?.name === "Role Awareness") {
                  nextStep = `Ask ${name}: "What do you think is yours to carry right now? And what's not?" Align on boundaries before frustration hardens.`;
                } else if (topIntIssue?.name === "Self-Direction") {
                  nextStep = `Give ${name} directional clarity this week: where they're going, what success looks like, and what's theirs to own without asking.`;
                }
              }

              return (
                <div
                  key={p.id}
                  className="bg-card rounded-xl p-6 mb-3 border border-border border-l-4"
                  style={{ borderLeftColor: "var(--alert-warning-accent)" }}
                >
                  <h3 className="text-sm font-extrabold text-foreground m-0 mb-2">{name}</h3>
                  <div className="text-xs text-foreground leading-relaxed">
                    {risks.map((r, i) => (
                      <div key={i} className={i < risks.length - 1 ? 'mb-2' : ''}>{r}</div>
                    ))}
                  </div>
                  {nextStep && (
                    <div className="mt-3 p-3 rounded-lg bg-alert-success-bg border border-alert-success-border">
                      <div className="text-[10px] font-bold text-alert-success-accent uppercase tracking-wide mb-1">What to do about it</div>
                      <div className="text-[11px] text-alert-success-text leading-relaxed">{nextStep}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
