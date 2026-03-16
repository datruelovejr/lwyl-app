'use client';

import { C } from "../constants/colors";
import { discFull, normBias } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Card, StoryCard, AlertCard, SectionHead, MetricCard } from "./ui";
import { getEnvironmentTaxSummary } from "../knowledge/assessmentInsights";
import { generateKRIs } from "../knowledge/sopEngine";

export function RetentionRisk({ people, teamId, orgId, leaderId }) {
  const isMobile = useIsMobile();
  const complete = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");

  if (complete.length < 2) return (
    <div className="max-w-3xl mx-auto px-8 py-6">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Retention Risk</h1>
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-3">🛡️</div>
        <div className="text-sm font-semibold">Need at least 2 complete assessments</div>
        <div className="text-xs mt-1">Upload assessments to see retention risk indicators</div>
      </div>
    </div>
  );

  // ── KRI Calculations ──
  const intNames = ["Self-Esteem", "Role Awareness", "Self-Direction"];

  const severityClasses = {
    green: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    yellow: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    red: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
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
      <div className="mb-6">
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-extrabold text-gray-900 tracking-tight`}>Retention Risk</h1>
        <div className="text-xs text-gray-400 mt-0.5">Internal attributes across {complete.length} team members</div>
      </div>

      {/* Overall Risk Badge */}
      <Card>
        <SectionHead title="Key Retention Indicators" sub="How your team sees themselves, their roles, and their direction" badge={`${riskLabel[overallRisk]} Risk`} badgeColor={overallRisk === "red" ? "#991B1B" : overallRisk === "yellow" ? "#C2410C" : "#15803D"} />

        {/* Summary Metrics */}
        <div className="flex gap-2 flex-wrap mb-5">
          <MetricCard value={kriData.filter(k => k.risk === "red").length} label="Critical indicators" sub="of 3 measured" accent={kriData.some(k => k.risk === "red") ? "#991B1B" : "#15803D"} />
          <MetricCard value={atRiskPeople.length} label="People at risk" sub="internal attribute flags" accent={atRiskPeople.length > 0 ? "#C2410C" : "#15803D"} />
          <MetricCard value={frustPT.length} label="Damage signals" sub="frustrated PT bias" accent={frustPT.length > 0 ? "#991B1B" : "#15803D"} />
        </div>

        {/* KRI Cards */}
        <div className="flex flex-col gap-3">
          {kriData.map(k => {
            const sc = severityClasses[k.risk];
            return (
              <div key={k.name} className={`${sc.bg} border ${sc.border} rounded-xl p-4`} style={{ borderLeft: `4px solid ${k.risk === "red" ? "#991B1B" : k.risk === "yellow" ? "#C2410C" : "#15803D"}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13px] font-extrabold text-gray-900">{k.name}</div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-gray-400">Avg: <strong className={sc.text}>{k.avgScore}</strong> / 10</span>
                    <span className={`text-[10px] font-bold ${sc.text} bg-white px-2.5 py-0.5 rounded-lg`}>{riskLabel[k.risk].toUpperCase()}</span>
                  </div>
                </div>

                {/* Bias distribution bar */}
                <div className="flex h-2 rounded overflow-hidden mb-2">
                  {k.plusBias > 0 && <div className="bg-emerald-700" style={{ flex: k.plusBias }} title={`${k.plusBias} Requires (+)`} />}
                  {k.equalBias > 0 && <div className="bg-blue-700" style={{ flex: k.equalBias }} title={`${k.equalBias} Balanced (=)`} />}
                  {k.minusBias > 0 && <div className="bg-red-800" style={{ flex: k.minusBias }} title={`${k.minusBias} Undervalues (-)`} />}
                </div>

                <div className="flex gap-3 mb-2.5 text-[11px] text-gray-400">
                  <span className="text-emerald-700 font-semibold">{k.plusBias} Requires (+)</span>
                  <span className="text-blue-700 font-semibold">{k.equalBias} Balanced (=)</span>
                  <span className="text-red-800 font-semibold">{k.minusBias} Undervalues (-)</span>
                </div>

                <div className="text-xs text-gray-900 leading-relaxed">{k.desc}</div>

                {k.atRiskPeople.length > 0 && (
                  <div className={`text-[11px] ${sc.text} mt-2 font-semibold`}>
                    Undervaluing: {k.atRiskPeople.join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* SOP Engine KRI Severity Indicators */}
      <div className="mb-8">
        <Card>
          <SectionHead title="Systemic Risk Indicators" sub="Organizational patterns from SOP engine analysis" />
          <div className="flex flex-col gap-3">
            {sopKRIEntries.map(({ key, label }) => {
              const kri = sopKRIs[key];
              const sc = severityClasses[kri.severity];
              const borderColor = kri.severity === "red" ? "#991B1B" : kri.severity === "yellow" ? "#C2410C" : "#15803D";
              return (
                <div key={key} className={`${sc.bg} border ${sc.border} rounded-xl p-4`} style={{ borderLeft: `4px solid ${borderColor}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[13px] font-extrabold text-gray-900">{label}</div>
                    <span className={`text-[10px] font-bold ${sc.text} bg-white px-2.5 py-0.5 rounded-lg`}>{riskLabel[kri.severity].toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-gray-900 leading-relaxed">{kri.description}</div>
                  <div className="text-[11px] text-gray-400 mt-2 italic">{kri.sop}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Frustrated PT - environment damage */}
      {frustPT.length > 0 && (
        <Card>
          <SectionHead title="Environment Damage Signals" sub="People whose environment has taught them results don't matter" />
          {frustPT.map((m, i) => {
            const name = m.name.split(" ")[0];
            return (
              <AlertCard key={m.id} severity="critical" title={`${name}: Frustrated Practical Thinking`}>
                {name}'s environment has taught them that getting practical results doesn't matter. That's the single strongest damage signal in the entire assessment. It's worth a direct conversation.
              </AlertCard>
            );
          })}
        </Card>
      )}

      {/* Per-person risk stories */}
      {atRiskPeople.length > 0 && (
        <Card>
          <SectionHead title="People to Watch" sub="Team members showing retention risk signals" />
          {atRiskPeople.map(p => {
            const name = p.name.split(" ")[0];
            const risks = getRetentionNarrative(p);
            if (risks.length === 0) return null;
            return (
              <StoryCard key={p.id} accent="#C2410C" title={name}>
                {risks.map((r, i) => (
                  <div key={i} className={i < risks.length - 1 ? 'mb-2' : ''}>{r}</div>
                ))}
              </StoryCard>
            );
          })}
        </Card>
      )}
    </div>
  );
}
