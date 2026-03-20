'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { discFull, getDom, valLevel, normBias, isEqualExtProfile } from '../constants/data';
import { Btn } from './Btn';
import { Bias } from './Bias';
import { Card } from './ui/Card';
import { AlertCard } from './ui/AlertCard';
import {
  discInsights, discGapInsights, valuesInsights,
  attrExtInsights, attrIntInsights, compoundPatterns,
  getEnvironmentTaxSummary, getGapInsight, getAttrExtBiasInsight, getAttrIntBiasInsight
} from '../knowledge/assessmentInsights';

// ────── ENVIRONMENT REPORT (Enhanced with Knowledge Base) ──────
const discLevel = s => s >= 70 ? "high" : s >= 40 ? "mod" : "low";
const discLevelLabel = s => s >= 70 ? "High" : s >= 40 ? "Moderate" : "Low";
const getAttrBand = (score) => score >= 8.0 ? "strong" : score >= 6.0 ? "moderate" : "mild";

function ReportSection({ num, title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="mb-9 break-inside-avoid"
    >
      <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-border">
        <div className="w-1 h-6 rounded-sm shrink-0" style={{ background: "var(--nav-accent)" }} />
        <div className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--nav-accent)" }}>{String(num).padStart(2, "0")}</div>
        <h3 className="text-sm font-extrabold tracking-tight text-foreground m-0">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function ExpandableInsight({ label, color, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="bg-transparent border-none cursor-pointer text-[10px] font-semibold p-0 flex items-center gap-1"
        style={{ color }}
      >
        <span
          className="inline-block transition-transform duration-150"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          &#9654;
        </span>
        {label}
      </button>
      {open && (
        <div
          className="text-[11px] text-foreground leading-relaxed mt-1 pl-3 border-l-2"
          style={{ borderLeftColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          {children}
        </div>
      )}
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
  const prefTaxColor = prefTax >= 160 ? "var(--alert-critical-text)" : prefTax >= 120 ? "var(--friction-high)" : prefTax >= 80 ? "var(--alert-warning-accent)" : prefTax >= 40 ? "var(--friction-moderate)" : "var(--alert-success-accent)";

  // Values
  const valRows = Object.entries(p.values).sort((a, b) => b[1] - a[1]);
  const topVals = valRows.filter(([, s]) => s >= 60);
  const lowVals = valRows.filter(([, s]) => s < 40);

  // Attributes
  const extSorted = [...p.attr.ext].sort((a, b) => b.score - a.score);
  const intRows = p.attr.int;

  // Process Tax (count of minus on external)
  const extMinusBiases = p.attr.ext.filter(a => a.bias === "\u2212").length;
  const processTaxLabel = extMinusBiases === 0 ? "None" : extMinusBiases === 1 ? "Light" : extMinusBiases === 2 ? "Moderate" : "Heavy";
  const processTaxColor = extMinusBiases === 0 ? "var(--alert-success-accent)" : extMinusBiases === 1 ? "var(--alert-success-accent)" : extMinusBiases === 2 ? "var(--alert-warning-accent)" : "var(--friction-high)";

  // Internal tax (count of minus on internal)
  const intMinusBiases = p.attr.int.filter(a => a.bias === "\u2212").length;
  const intTaxLabel = intMinusBiases === 0 ? "None" : intMinusBiases === 1 ? "Light" : intMinusBiases === 2 ? "Moderate" : "Heavy";

  // Environment Tax Summary
  const envTax = getEnvironmentTaxSummary(p);

  const taxCard = (label, value, color, note) => (
    <div
      className="flex-1 px-4.5 py-4 rounded-[10px] bg-card border border-border border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-[32px] font-extrabold leading-none mb-1.5" style={{ color }}>{value}</div>
      {note && <div className="text-[11px] text-muted leading-snug">{note}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-start justify-center z-300 overflow-y-auto px-4 py-6" style={{ background: "color-mix(in srgb, var(--nav-bg) 55%, transparent)" }}>
      <div className="modal-body rounded-xl shadow-xl w-[min(900px,100%)] font-sans" style={{ background: "var(--bg-card)" }}>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-t-xl px-12 py-5 flex items-center justify-between"
          style={{ background: "var(--nav-bg)", color: "var(--bg-card)" }}
        >
          <div>
            <h2 className="font-bold text-[32px] m-0" style={{ color: "var(--bg-card)" }}>Environment Report: {p.name}</h2>
            <div className="text-base mt-1" style={{ color: "color-mix(in srgb, var(--bg-card) 65%, transparent)" }}>Natural vs Adaptive &middot; Love Where You Lead</div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
              style={{ border: "1px solid color-mix(in srgb, var(--bg-card) 30%, transparent)", background: "color-mix(in srgb, var(--bg-card) 10%, transparent)", color: "var(--bg-card)" }}
            >
              Print Report
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border-none cursor-pointer text-lg leading-none flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--bg-card) 10%, transparent)", color: "color-mix(in srgb, var(--bg-card) 70%, transparent)" }}
            >
              &#10005;
            </button>
          </div>
        </motion.div>

        <div className="p-12" id="report-content">

          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="flex items-center gap-4 py-5 pb-7 border-b border-border mb-7"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl shrink-0"
              style={{ background: "var(--nav-bg)", color: "var(--nav-accent)" }}
            >
              {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="m-0 text-2xl font-extrabold tracking-tight">{p.name}</h1>
                {dims.map(d => (
                  <span
                    key={d}
                    className="px-2.5 py-0.5 rounded font-bold text-[11px]"
                    style={{
                      background: `var(--disc-${d.toLowerCase()})`,
                      color: d === "I" ? "var(--text-primary)" : "var(--bg-card)"
                    }}
                  >
                    {d}:{p.disc.natural[d]}
                  </span>
                ))}
              </div>
              <div className="text-[13px] text-muted">Love Where You Lead - Environment Report</div>
              <div className="text-[11px] text-muted mt-0.5">Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          </motion.div>

          {/* 1: YOUR PREFERENCE - Natural */}
          <ReportSection num={1} title="YOUR PREFERENCE: Natural Style" delay={0.1}>
            <p className="text-sm text-muted m-0 mb-4 leading-relaxed">Your Natural style is how you're built to lead when you're comfortable, off-guard, or under pressure. This is who you are when no one's adjusting for the room.</p>
            <div className="flex flex-col gap-3 mb-3">
            {discRows.map(({ d, full, nat }) => {
              const level = discLevel(nat);
              const insight = discInsights[d]?.[level];
              return (
                <div
                  key={d}
                  className="flex items-start gap-5 px-5 py-4 rounded-lg bg-card border border-border border-l-4"
                  style={{ borderLeftColor: `var(--disc-${d.toLowerCase()})` }}
                >
                  <div className="shrink-0 min-w-[100px]">
                    <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{full}</div>
                    <div className="text-4xl font-extrabold leading-none" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{nat}</div>
                    <div className="text-[10px] font-semibold text-muted mt-1">{discLevelLabel(nat)}</div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[13px] text-foreground leading-relaxed">{insight?.strength}</div>
                    {insight?.blindSpot && (
                      <ExpandableInsight label="Blind Spot" color={`var(--disc-${d.toLowerCase()})`}>
                        {insight.blindSpot}
                      </ExpandableInsight>
                    )}
                    {insight?.toxicUnderStress && (
                      <ExpandableInsight label="Under Stress" color="var(--alert-warning-accent)">
                        {insight.toxicUnderStress}
                      </ExpandableInsight>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </ReportSection>

          {/* 2: Adaptive Style */}
          <ReportSection num={2} title="YOUR PREFERENCE: Adaptive Style" delay={0.2}>
            <p className="text-sm text-muted m-0 mb-4 leading-relaxed">Your Adaptive style is how you're adjusting to your current environment. When Natural and Adaptive differ significantly, your environment's asking you to be someone you're not. That costs energy every single day.</p>
            <div className="flex flex-col gap-3 mb-3">
            {discRows.map(({ d, full, nat, adp, gap }) => {
              const absgap = Math.abs(gap);
              const costly = absgap >= 20;
              const observable = absgap >= 10;
              const gapInsight = getGapInsight(d, gap);
              const borderColor = costly ? "var(--alert-warning-accent)" : observable ? "var(--friction-moderate)" : `var(--disc-${d.toLowerCase()})`;
              return (
                <div
                  key={d}
                  className="flex items-start gap-5 px-5 py-4 rounded-lg bg-card border border-border border-l-4"
                  style={{ borderLeftColor: borderColor }}
                >
                  <div className="shrink-0 min-w-[100px]">
                    <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: borderColor }}>{full}</div>
                    <div className="text-4xl font-extrabold leading-none" style={{ color: borderColor }}>{adp}</div>
                    {observable && <div className="text-[10px] font-semibold mt-1" style={{ color: borderColor }}>{costly ? "\u26A0" : "\u25B3"} {absgap} from natural</div>}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[13px] text-foreground leading-relaxed" style={{ marginBottom: gapInsight ? 8 : 0 }}>
                      Natural: <strong>{nat}</strong> &rarr; Adaptive: <strong>{adp}</strong>
                      {!observable && <span className="text-muted"> -- Aligned</span>}
                    </div>
                    {gapInsight && (
                      <div
                        className="text-xs leading-relaxed px-3 py-2 rounded-md"
                        style={{
                          color: costly ? "var(--alert-warning-accent)" : "var(--alert-warning-text)",
                          background: "var(--alert-warning-bg)"
                        }}
                      >
                        {gapInsight}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </ReportSection>

          {/* 3: Preference Tax */}
          <ReportSection num={3} title="PREFERENCE TAX: The Cost of Adapting" delay={0.3}>
            <p className="text-xs text-muted m-0 mb-3 leading-relaxed">Your Preference Tax is the total energy you spend each day adapting your natural behavioral style to fit your environment. The higher the number, the more drained you feel at the end of the day. Not because you worked hard. Because you spent the day being someone you're not.</p>
            <div className="flex gap-2.5 flex-wrap mb-3">
              {taxCard("Total Gap Points", prefTax, prefTaxColor, `Across all 4 DISC dimensions`)}
              {taxCard("Tax Level", prefTaxLabel, prefTaxColor, prefTax >= 160 ? "Critical daily adaptation cost." : prefTax >= 120 ? "Heavy daily adaptation cost." : prefTax >= 80 ? "Significant daily adaptation cost." : prefTax >= 40 ? "Moderate daily adaptation cost." : "Your environment fits your natural style.")}
            </div>
            <div className="text-[11px] text-foreground leading-relaxed px-3.5 py-2.5 bg-card rounded-lg border border-border">
              {prefTaxLabel === "Critical" && "Your environment is demanding near-maximum behavioral adaptation from you right now. This isn't a motivation problem. It's a design problem at a critical level. The gap between who you are and how your environment needs you to show up is unsustainable without intervention."}
              {prefTaxLabel === "Heavy" && "Your environment doesn't fit your natural operating style. You're paying a heavy price for it every day. The fatigue, the frustration, the sense that you're performing a version of yourself you didn't choose. That's not a character flaw. That's a design problem that has a design solution."}
              {prefTaxLabel === "Significant" && "Two to three of your DISC dimensions are under sustained pressure right now. Adaptation isn't occasional. It's constant. You likely feel it most at the end of the day, when you've been managing your style for hours. The Environment Alignment shows you exactly where the cost is highest."}
              {prefTaxLabel === "Moderate" && "Your environment asks you to adapt in meaningful ways. Some days feel natural. Others feel like you're swimming upstream. Knowing which dimensions carry the most cost is how you start negotiating better conditions."}
              {prefTaxLabel === "Aligned" && "Your environment largely fits your natural style. That's rare. Protect it. Environments shift, and what fits today can drift over time. Knowing your baseline now is what lets you catch it early if it changes."}
            </div>
            {/* Costly gap breakdown */}
            {envTax.costlyGaps.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--alert-warning-accent)" }}>Significant Gaps (20+ points)</div>
                {envTax.costlyGaps.map(g => (
                  <div
                    key={g.dim}
                    className="text-[11px] text-foreground leading-relaxed px-3 py-2 mb-1 rounded-md border-l-3"
                    style={{ background: "var(--alert-warning-bg)", borderLeftColor: "var(--alert-warning-accent)" }}
                  >
                    <strong>{discFull[g.dim]}:</strong> {g.natural} &rarr; {g.adaptive} (&Delta;{g.absGap}) -- {g.gap > 0 ? "Environment demands more" : "Environment suppresses"}
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          {/* 4: YOUR PASSION - Values */}
          <ReportSection num={4} title="YOUR PASSION: What Drives You" delay={0.4}>
            <p className="text-xs text-muted m-0 mb-3 leading-relaxed">Your Values reveal what you're fundamentally motivated by. What gets you out of bed. What gives your work meaning. What drains you when it's absent. These aren't preferences. They're the fuel your leadership runs on.</p>
            {topVals.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">Top Drivers (Score 60+)</div>
                {topVals.map(([name, score]) => {
                  const vi = valuesInsights[name]?.high;
                  return (
                    <div key={name} className="mb-2 px-3 py-2.5 rounded-lg bg-card border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ background: `var(--values-${name.toLowerCase()})` }}
                        />
                        <span className="text-xs font-extrabold" style={{ color: `var(--values-${name.toLowerCase()})` }}>{name}</span>
                        <span className="ml-auto text-lg font-extrabold" style={{ color: `var(--values-${name.toLowerCase()})` }}>{score}</span>
                        <span
                          className="text-[10px] font-semibold rounded px-1.5 py-px border-l-3 border"
                          style={{
                            color: "var(--alert-success-accent)",
                            background: "var(--bg-card)",
                            borderColor: "var(--alert-success-border)",
                            borderLeftColor: "var(--alert-success-accent)"
                          }}
                        >
                          Top Driver
                        </span>
                      </div>
                      <div className="h-1 bg-subtle rounded-sm mb-1.5 overflow-hidden">
                        <div className="h-full rounded-sm" style={{ width: `${score}%`, background: `var(--values-${name.toLowerCase()})` }} />
                      </div>
                      <div className="text-[11px] text-foreground leading-snug">{vi?.strength || `${name} at ${score}. This feeds your motivation.`}</div>
                      {vi?.environmentCost && (
                        <ExpandableInsight label="Environment Cost" color={`var(--values-${name.toLowerCase()})`}>
                          {vi.environmentCost}
                        </ExpandableInsight>
                      )}
                      {vi?.toxicUnderStress && (
                        <ExpandableInsight label="Under Stress" color="var(--alert-warning-accent)">
                          {vi.toxicUnderStress}
                        </ExpandableInsight>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {lowVals.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">Low Drivers (Score under 40)</div>
                <div className="flex flex-wrap gap-1.5">
                  {lowVals.map(([name, score]) => {
                    const vi = valuesInsights[name]?.low;
                    return (
                      <div key={name} className="flex-[1_1_200px] px-2.5 py-2 rounded-lg bg-subtle border border-border">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ background: `var(--values-${name.toLowerCase()})` }}
                          />
                          <span className="text-[11px] font-bold" style={{ color: `var(--values-${name.toLowerCase()})` }}>{name}: {score}</span>
                        </div>
                        <div className="text-[10px] text-muted leading-snug">{vi?.description || "This is not what gets you out of bed."}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ReportSection>

          {/* 5: YOUR PROCESS - External */}
          <ReportSection num={5} title="YOUR PROCESS: External (Heart, Hand, Head)" delay={0.5}>
            {isEqualExtProfile(p.attr.ext) ? (
              <>
                <p className="text-xs text-muted m-0 mb-3 leading-relaxed">Your External Attributes show equal capacity across all three decision-making dimensions. You see People, Results, and Structure with the same clarity. There's no fixed processing sequence. Versatility IS your strength. Your bias indicators reveal your relationship to each lens, not the order you use them.</p>
                {p.attr.ext.map(a => {
                  const biasInsight = getAttrExtBiasInsight(a.label, a.bias);
                  return (
                    <div key={a.name} className="flex gap-2.5 mb-2 px-3 py-2.5 rounded-lg bg-card border border-border border-l-4" style={{ borderLeftColor: "var(--attr-ext)" }}>
                      <div className="shrink-0 text-center w-13">
                        <div className="text-[9px] font-bold uppercase" style={{ color: "var(--attr-ext)" }}>=</div>
                        <div className="text-[22px] font-extrabold" style={{ color: "var(--attr-ext)" }}>{a.score}</div>
                        <Bias bias={a.bias} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold" style={{ color: "var(--attr-ext)" }}>{a.label} - {a.name}</span>
                          {biasInsight?.label && (
                            <span
                              className="text-[9px] font-semibold px-1.5 py-px rounded-sm"
                              style={{
                                color: a.bias === "\u2212" ? "var(--alert-warning-accent)" : a.bias === "+" ? "var(--alert-success-accent)" : "var(--alert-info-accent)",
                                background: a.bias === "\u2212" ? "var(--alert-warning-bg)" : a.bias === "+" ? "var(--alert-success-bg)" : "var(--alert-info-bg)"
                              }}
                            >
                              {biasInsight.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-foreground leading-snug">{biasInsight?.insight}</div>
                        {biasInsight?.environmentCost && (
                          <ExpandableInsight label="Environment Cost" color={a.bias === "\u2212" ? "var(--alert-warning-accent)" : "var(--attr-ext)"}>
                            {biasInsight.environmentCost}
                          </ExpandableInsight>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <p className="text-xs text-muted m-0 mb-3 leading-relaxed">Your External Attributes determine what you see first when you look at any situation. This is your decision-making order. The lens through which all information is filtered before you act.</p>
                {extSorted.map((a, i) => {
                  const biasInsight = getAttrExtBiasInsight(a.label, a.bias);
                  return (
                    <div
                      key={a.name}
                      className="flex gap-2.5 mb-2 px-3 py-2.5 rounded-lg bg-card border border-border border-l-4"
                      style={{ borderLeftColor: i === 0 ? "var(--attr-ext)" : "var(--border-default)" }}
                    >
                      <div className="shrink-0 text-center w-13">
                        <div className="text-[9px] font-bold uppercase" style={{ color: i === 0 ? "var(--attr-ext)" : "var(--text-muted)" }}>{i + 1}.</div>
                        <div className="text-[22px] font-extrabold" style={{ color: "var(--attr-ext)" }}>{a.score}</div>
                        <Bias bias={a.bias} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold" style={{ color: i === 0 ? "var(--attr-ext)" : "var(--text-primary)" }}>{a.label} - {a.name}</span>
                          {biasInsight?.label && (
                            <span
                              className="text-[9px] font-semibold px-1.5 py-px rounded-sm"
                              style={{
                                color: a.bias === "\u2212" ? "var(--alert-warning-accent)" : a.bias === "+" ? "var(--alert-success-accent)" : "var(--alert-info-accent)",
                                background: a.bias === "\u2212" ? "var(--alert-warning-bg)" : a.bias === "+" ? "var(--alert-success-bg)" : "var(--alert-info-bg)"
                              }}
                            >
                              {biasInsight.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-foreground leading-snug">{biasInsight?.insight}</div>
                        {biasInsight?.environmentCost && (
                          <ExpandableInsight label="Environment Cost" color={a.bias === "\u2212" ? "var(--alert-warning-accent)" : "var(--attr-ext)"}>
                            {biasInsight.environmentCost}
                          </ExpandableInsight>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </ReportSection>

          {/* 6: Internal Attributes */}
          <ReportSection num={6} title="YOUR PROCESS: Internal (Leadership Foundation)" delay={0.6}>
            <p className="text-xs text-muted m-0 mb-3 leading-relaxed">Your Internal Attributes reflect how you see yourself. Your own worth, your purpose, and your capacity to lead yourself. These are the foundation beneath everything else you do.</p>
            {intRows.map(a => {
              const biasInsight = getAttrIntBiasInsight(a.name, a.bias);
              return (
                <div key={a.name} className="mb-2 px-3 py-2.5 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[22px] font-extrabold shrink-0 w-10" style={{ color: "var(--attr-int)" }}>{a.score}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold">{a.name}</span>
                        {biasInsight?.label && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-px rounded-sm"
                            style={{
                              color: a.bias === "\u2212" ? "var(--alert-warning-accent)" : a.bias === "+" ? "var(--alert-success-accent)" : "var(--alert-info-accent)",
                              background: a.bias === "\u2212" ? "var(--alert-warning-bg)" : a.bias === "+" ? "var(--alert-success-bg)" : "var(--alert-info-bg)"
                            }}
                          >
                            {biasInsight.label}
                          </span>
                        )}
                      </div>
                      <Bias bias={a.bias} />
                    </div>
                  </div>
                  <div className="text-[11px] text-foreground leading-snug">{biasInsight?.insight}</div>
                  {biasInsight?.environmentCost && (
                    <ExpandableInsight label="Environment Cost" color={a.bias === "\u2212" ? "var(--alert-warning-accent)" : "var(--attr-int)"}>
                      {biasInsight.environmentCost}
                    </ExpandableInsight>
                  )}
                </div>
              );
            })}
          </ReportSection>

          {/* 7: Process Signals */}
          <ReportSection num={7} title="PROCESS SIGNALS: Patterns Worth Examining" delay={0.7}>
            <p className="text-xs text-muted m-0 mb-3 leading-relaxed">Your External Attributes show patterns worth paying attention to. A minus bias doesn't mean something's broken. It means there's a lens you're not fully using right now. These are signals -- not verdicts. The Environment Alignment is what helps you determine what's driving them.</p>
            <div className="flex gap-2.5 flex-wrap mb-3">
              {taxCard("External Patterns", extMinusBiases === 0 ? "Clear" : `${extMinusBiases} detected`, processTaxColor, extMinusBiases === 0 ? "All external capacities active" : `${extMinusBiases} lens${extMinusBiases > 1 ? "es" : ""} showing bias pattern`)}
              {taxCard("Internal Impact", intMinusBiases === 0 ? "Clear" : `${intMinusBiases} detected`, intMinusBiases === 0 ? "var(--alert-success-accent)" : "var(--alert-warning-accent)", intMinusBiases === 0 ? "Internal foundation stable" : `${intMinusBiases} dimension${intMinusBiases > 1 ? "s" : ""} showing environment sensitivity`)}
              {taxCard("Signal Level", extMinusBiases === 0 ? "Clear" : extMinusBiases === 1 ? "Low" : extMinusBiases >= 2 ? "Elevated" : "Clear", processTaxColor, "Based on external bias patterns")}
            </div>
            {envTax.hasFrustratedPT && (
              <AlertCard severity="critical" title="Environment Damage Indicator Detected.">
                Your Practical Thinking shows a Frustrated (&minus;) bias. This is the most telling pattern in the entire Attributes profile. It means your environment has taught you that practical application doesn't pay off -- that the results you produce don't matter. This is worth examining closely.
              </AlertCard>
            )}
            {extMinusBiases > 0 && !envTax.hasFrustratedPT && (
              <div
                className="text-[11px] text-foreground leading-relaxed px-4 py-3 bg-card rounded-lg border border-border border-l-4"
                style={{ borderLeftColor: "var(--alert-warning-accent)" }}
              >
                Your data shows decision-making capacity you're not fully using right now. It shows up as second-guessing yourself, ignoring data you know matters, or defaulting to one lens when the situation calls for another. Whether this pattern is environment-driven or experience-driven is exactly what the Environment Alignment is built to clarify.
              </div>
            )}
          </ReportSection>

          {/* 8: Compound Patterns */}
          {envTax.activeCompounds.length > 0 && (
            <ReportSection num={8} title="COMPOUND PATTERNS: Cross-Dimensional Insights" delay={0.8}>
              <p className="text-xs text-muted m-0 mb-3 leading-relaxed">When specific dimensions combine, they create patterns greater than the sum of their parts. These compound patterns reveal how your behavioral style, values, and decision-making architecture interact to shape your leadership signature.</p>
              {envTax.activeCompounds.map(cp => (
                <div
                  key={cp.id}
                  className="mb-3 px-5 py-4 rounded-[10px] bg-card border border-border border-l-4"
                  style={{ borderLeftColor: "var(--nav-accent)" }}
                >
                  <div className="text-sm font-extrabold mb-1" style={{ color: "var(--nav-accent)" }}>{cp.name}</div>
                  <div className="text-[11px] text-muted leading-snug mb-2">{cp.description}</div>
                  <div className="text-xs text-foreground leading-relaxed mb-1.5">{cp.strength}</div>
                  <ExpandableInsight label="Toxic Pattern" color="var(--alert-warning-accent)">
                    {cp.toxicPattern}
                  </ExpandableInsight>
                  <ExpandableInsight label="Recommendation" color="var(--nav-accent)">
                    {cp.recommendation}
                  </ExpandableInsight>
                </div>
              ))}
            </ReportSection>
          )}

          {/* 9 (or 8): Compound Bill */}
          <ReportSection num={envTax.activeCompounds.length > 0 ? 9 : 8} title="THE COMPOUND BILL: Your Environment Picture" delay={envTax.activeCompounds.length > 0 ? 0.9 : 0.8}>
            <p className="text-xs text-muted m-0 mb-4 leading-relaxed">Your Preference Tax is confirmed from your data. It's the behavioral energy cost your environment charges you every day. Your Process Signals identify patterns in your decision-making that are worth digging into. Together, they start to reveal the gap between who you are and how you're showing up.</p>
            <div className="flex gap-2.5 flex-wrap mb-5">
              {taxCard("Preference Tax", prefTaxLabel, prefTaxColor, `${prefTax} gap points confirmed`)}
              {taxCard("Process Signals", extMinusBiases === 0 ? "Clear" : `${extMinusBiases} pattern${extMinusBiases > 1 ? "s" : ""}`, processTaxColor, extMinusBiases === 0 ? "No patterns detected" : `${extMinusBiases} bias pattern${extMinusBiases > 1 ? "s" : ""} to examine`)}
            </div>
            {/* Peak-End Rule: Compound Bill Verdict */}
            {(() => {
              const overallColor = prefTaxLabel === "Critical" ? "var(--alert-critical-text)" : prefTaxLabel === "Heavy" ? "var(--friction-high)" : prefTaxLabel === "Significant" ? "var(--alert-warning-accent)" : prefTaxLabel === "Moderate" ? "var(--friction-moderate)" : "var(--alert-success-accent)";
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
                <div
                  className="px-7 py-6 rounded-xl bg-card border border-border border-l-[5px]"
                  style={{ borderLeftColor: overallColor }}
                >
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Your Compound Bill</div>
                  <div className="text-[40px] font-extrabold leading-none mb-3" style={{ color: overallColor }}>Preference: {prefTaxLabel}</div>
                  <div className="text-[13px] text-foreground leading-loose font-medium">
                    {p.name.split(" ")[0]}, {verdictCopy}
                  </div>
                  {envTax.hasFrustratedPT && (
                    <div className="mt-3 px-3.5 py-2.5 rounded-lg bg-alert-critical-bg border border-alert-critical-border">
                      <div className="text-[11px] font-bold mb-1" style={{ color: "var(--friction-high)" }}>Environment Damage Signal Active</div>
                      <div className="text-[11px] leading-snug" style={{ color: "var(--alert-critical-text)" }}>Your Practical Thinking (&minus;) bias indicates your environment may be actively undermining your relationship with results and execution. This pattern deserves priority attention in your Environment Alignment.</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </ReportSection>

          {/* Your Three Priorities */}
          <ReportSection num={envTax.activeCompounds.length > 0 ? 10 : 9} title="YOUR THREE PRIORITIES: Where to Start" delay={envTax.activeCompounds.length > 0 ? 1.0 : 0.9}>
            <p className="text-xs text-muted m-0 mb-4 leading-relaxed">Based on everything in this report, here are the three things worth your attention first. Not everything. Not a plan. Just where to look.</p>
            {(() => {
              const priorities = [];
              const firstName = p.name.split(" ")[0];

              // Priority 1: Highest-cost DISC gap
              const costliestGap = discRows.filter(r => Math.abs(r.gap) >= 20).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];
              if (costliestGap) {
                const dir = costliestGap.gap > 0 ? "amplifying" : "suppressing";
                priorities.push({
                  label: "Biggest Adaptation Cost",
                  color: "var(--alert-warning-accent)",
                  text: `${firstName} is ${dir} ${discFull[costliestGap.d]} by ${Math.abs(costliestGap.gap)} points every day. That's the single largest energy drain in this profile. Start here: what in the environment is demanding this shift, and can any of it change?`
                });
              } else if (prefTax >= 40) {
                priorities.push({
                  label: "Moderate Adaptation",
                  color: "var(--friction-moderate)",
                  text: `No single dimension is at critical levels, but the combined ${prefTax}-point tax is real. Ask ${firstName}: which part of your day feels most like performing? That's where the cost lives.`
                });
              } else {
                priorities.push({
                  label: "Environment Fit",
                  color: "var(--alert-success-accent)",
                  text: `${firstName}'s environment fits their natural style well. Protect this. Environments drift -- check in quarterly to make sure alignment holds.`
                });
              }

              // Priority 2: Frustrated PT or top minus bias
              if (envTax.hasFrustratedPT) {
                priorities.push({
                  label: "Environment Damage Signal",
                  color: "var(--friction-high)",
                  text: `Frustrated Practical Thinking is the strongest damage signal in the assessment. ${firstName}'s environment has taught them that practical results don't matter. Have one direct conversation: "I see you pulling back from execution. What happened that made follow-through feel pointless here?"`
                });
              } else if (extMinusBiases > 0) {
                const minusLens = p.attr.ext.filter(a => a.bias === "\u2212")[0];
                if (minusLens) {
                  priorities.push({
                    label: "Underused Decision Lens",
                    color: "var(--alert-warning-accent)",
                    text: `${firstName} is undervaluing their ${minusLens.label} lens. They have the capacity but their environment isn't rewarding it. Ask: "When's the last time using ${minusLens.label === "Heart" ? "empathy" : minusLens.label === "Hand" ? "practical thinking" : "systems analysis"} actually paid off for you here?"`
                  });
                }
              } else {
                const topVal = topVals[0];
                if (topVal) {
                  priorities.push({
                    label: "Protect What Drives Them",
                    color: "var(--alert-success-accent)",
                    text: `${firstName}'s top driver is ${topVal[0]} at ${topVal[1]}. Make sure the environment keeps feeding it. If ${topVal[0] === "Altruistic" ? "the work stops feeling meaningful" : topVal[0] === "Economic" ? "the ROI disappears" : topVal[0] === "Individualistic" ? "autonomy gets restricted" : topVal[0] === "Political" ? "influence gets taken away" : topVal[0] === "Theoretical" ? "learning stops" : topVal[0] === "Regulatory" ? "structure breaks down" : "the environment shifts"}, motivation will follow.`
                  });
                }
              }

              // Priority 3: Internal attribute risk or compound pattern
              const intAtRisk = p.attr.int.filter(a => a.bias === "\u2212");
              if (intAtRisk.length > 0) {
                priorities.push({
                  label: "Internal Foundation",
                  color: "var(--alert-critical-text)",
                  text: `${firstName}'s ${intAtRisk[0].name} is showing an undervaluing bias. That's not a skills gap -- it's a confidence signal. Their environment may be eroding their internal foundation. Address this before it becomes permanent.`
                });
              } else if (envTax.activeCompounds.length > 0) {
                const topCompound = envTax.activeCompounds[0];
                priorities.push({
                  label: "Compound Pattern",
                  color: "var(--nav-accent)",
                  text: `"${topCompound.name}" is active. ${topCompound.description} This pattern amplifies everything else in the report. Understanding it explains behavior that looks contradictory from the outside.`
                });
              } else {
                priorities.push({
                  label: "Maintain Awareness",
                  color: "var(--alert-success-accent)",
                  text: `${firstName}'s internal foundation is stable. Use this report as a baseline. Revisit in 90 days to see if anything has shifted -- especially after role changes, team changes, or high-stress periods.`
                });
              }

              return (
                <div className="flex flex-col gap-3">
                  {priorities.map((pri, i) => (
                    <div
                      key={i}
                      className="px-5 py-4 rounded-[10px] bg-card border border-border border-l-[5px]"
                      style={{ borderLeftColor: pri.color }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                          style={{ background: pri.color, color: "var(--bg-card)" }}
                        >
                          {i + 1}
                        </div>
                        <div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: pri.color }}>{pri.label}</div>
                      </div>
                      <div className="text-[13px] text-foreground leading-relaxed">{pri.text}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </ReportSection>

        </div>
      </div>
    </div>
  );
}
