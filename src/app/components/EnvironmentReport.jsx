'use client';
import { useState } from 'react';
import { C } from '../constants/colors';
import { discFull, getDom, valLevel, normBias, isEqualExtProfile } from '../constants/data';
import { Btn } from './Btn';
import { Bias } from './Bias';
import {
  discInsights, discGapInsights, valuesInsights,
  attrExtInsights, attrIntInsights, compoundPatterns,
  getEnvironmentTaxSummary, getGapInsight, getAttrExtBiasInsight, getAttrIntBiasInsight
} from '../knowledge/assessmentInsights';

// ────── ENVIRONMENT REPORT (Enhanced with Knowledge Base) ──────
const discLevel = s => s >= 70 ? "high" : s >= 40 ? "mod" : "low";
const discLevelLabel = s => s >= 70 ? "High" : s >= 40 ? "Moderate" : "Low";
const getAttrBand = (score) => score >= 8.0 ? "strong" : score >= 6.0 ? "moderate" : "mild";

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

function ExpandableInsight({ label, color, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 6 }}>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, color, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block" }}>▸</span>
        {label}
      </button>
      {open && <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6, marginTop: 4, paddingLeft: 12, borderLeft: `2px solid ${color}20` }}>{children}</div>}
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

  // Process Tax (count of "−" on external)
  const extMinusBiases = p.attr.ext.filter(a => a.bias === "−").length;
  const processTaxLabel = extMinusBiases === 0 ? "None" : extMinusBiases === 1 ? "Light" : extMinusBiases === 2 ? "Moderate" : "Heavy";
  const processTaxColor = extMinusBiases === 0 ? C.green : extMinusBiases === 1 ? "#558B2F" : extMinusBiases === 2 ? "#E65100" : "#C62828";

  // Internal tax (count of "−" on internal)
  const intMinusBiases = p.attr.int.filter(a => a.bias === "−").length;
  const intTaxLabel = intMinusBiases === 0 ? "None" : intMinusBiases === 1 ? "Light" : intMinusBiases === 2 ? "Moderate" : "Heavy";

  // Environment Tax Summary
  const envTax = getEnvironmentTaxSummary(p);

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
            {discRows.map(({ d, full, nat }) => {
              const level = discLevel(nat);
              const insight = discInsights[d]?.[level];
              return (
                <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "16px 20px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.disc[d]}` }}>
                  <div style={{ flexShrink: 0, minWidth: 100 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.disc[d], textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{full}</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: C.disc[d], lineHeight: 1 }}>{nat}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginTop: 4 }}>{discLevelLabel(nat)}</div>
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{insight?.strength}</div>
                    {insight?.blindSpot && (
                      <ExpandableInsight label="Blind Spot" color={C.disc[d]}>
                        {insight.blindSpot}
                      </ExpandableInsight>
                    )}
                    {insight?.toxicUnderStress && (
                      <ExpandableInsight label="Under Stress" color="#E65100">
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
          <ReportSection num={2} title="YOUR PREFERENCE: Adaptive Style">
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>Your Adaptive style is how you're adjusting to your current environment. When Natural and Adaptive differ significantly, your environment's asking you to be someone you're not. That costs energy every single day.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
            {discRows.map(({ d, full, nat, adp, gap }) => {
              const absgap = Math.abs(gap);
              const costly = absgap >= 20;
              const observable = absgap >= 10;
              const gapInsight = getGapInsight(d, gap);
              const borderColor = costly ? "#E65100" : observable ? "#F59E0B" : C.disc[d];
              return (
                <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "16px 20px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${borderColor}` }}>
                  <div style={{ flexShrink: 0, minWidth: 100 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: borderColor, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{full}</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: borderColor, lineHeight: 1 }}>{adp}</div>
                    {observable && <div style={{ fontSize: 10, fontWeight: 600, color: borderColor, marginTop: 4 }}>{costly ? "⚠" : "△"} {absgap} from natural</div>}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: gapInsight ? 8 : 0 }}>
                      Natural: <strong>{nat}</strong> → Adaptive: <strong>{adp}</strong>
                      {!observable && <span style={{ color: C.muted }}> — Aligned</span>}
                    </div>
                    {gapInsight && (
                      <div style={{ fontSize: 12, color: costly ? "#E65100" : "#92400E", lineHeight: 1.6, padding: "8px 12px", background: costly ? "#FFF7ED" : "#FFFBEB", borderRadius: 6 }}>
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
            {/* Costly gap breakdown */}
            {envTax.costlyGaps.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#E65100", marginBottom: 6 }}>Significant Gaps (20+ points)</div>
                {envTax.costlyGaps.map(g => (
                  <div key={g.dim} style={{ fontSize: 11, color: C.text, lineHeight: 1.6, padding: "8px 12px", marginBottom: 4, borderRadius: 6, background: "#FFF7ED", borderLeft: "3px solid #E65100" }}>
                    <strong>{discFull[g.dim]}:</strong> {g.natural} → {g.adaptive} (Δ{g.absGap}) — {g.gap > 0 ? "Environment demands more" : "Environment suppresses"}
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          {/* 4: YOUR PASSION - Values */}
          <ReportSection num={4} title="YOUR PASSION: What Drives You">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your Values reveal what you're fundamentally motivated by. What gets you out of bed. What gives your work meaning. What drains you when it's absent. These aren't preferences. They're the fuel your leadership runs on.</p>
            {topVals.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>Top Drivers (Score 60+)</div>
                {topVals.map(([name, score]) => {
                  const vi = valuesInsights[name]?.high;
                  return (
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
                      <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{vi?.strength || `${name} at ${score}. This feeds your motivation.`}</div>
                      {vi?.environmentCost && (
                        <ExpandableInsight label="Environment Cost" color={C.values[name]}>
                          {vi.environmentCost}
                        </ExpandableInsight>
                      )}
                      {vi?.toxicUnderStress && (
                        <ExpandableInsight label="Under Stress" color="#E65100">
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
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>Low Drivers (Score under 40)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lowVals.map(([name, score]) => {
                    const vi = valuesInsights[name]?.low;
                    return (
                      <div key={name} style={{ flex: "1 1 200px", padding: "8px 10px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[name], display: "inline-block" }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.values[name] }}>{name}: {score}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{vi?.description || "This is not what gets you out of bed."}</div>
                      </div>
                    );
                  })}
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
                  const biasInsight = getAttrExtBiasInsight(a.label, a.bias);
                  return (
                    <div key={a.name} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.attr.ext}` }}>
                      <div style={{ flexShrink: 0, textAlign: "center", width: 52 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.attr.ext, textTransform: "uppercase" }}>=</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.attr.ext }}>{a.score}</div>
                        <Bias bias={a.bias} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.attr.ext }}>{a.label} - {a.name}</span>
                          {biasInsight?.label && <span style={{ fontSize: 9, fontWeight: 600, color: a.bias === "−" ? "#E65100" : a.bias === "+" ? "#2E7D32" : "#1565C0", background: a.bias === "−" ? "#FFF7ED" : a.bias === "+" ? "#F0FAF0" : "#F5F9FF", padding: "1px 6px", borderRadius: 3 }}>{biasInsight.label}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{biasInsight?.insight}</div>
                        {biasInsight?.environmentCost && (
                          <ExpandableInsight label="Environment Cost" color={a.bias === "−" ? "#E65100" : C.attr.ext}>
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
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your External Attributes determine what you see first when you look at any situation. This is your decision-making order. The lens through which all information is filtered before you act.</p>
                {extSorted.map((a, i) => {
                  const biasInsight = getAttrExtBiasInsight(a.label, a.bias);
                  return (
                    <div key={a.name} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: i === 0 ? `4px solid ${C.attr.ext}` : `1px solid ${C.border}` }}>
                      <div style={{ flexShrink: 0, textAlign: "center", width: 52 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: i === 0 ? C.attr.ext : C.muted, textTransform: "uppercase" }}>{i + 1}.</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.attr.ext }}>{a.score}</div>
                        <Bias bias={a.bias} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.attr.ext : C.text }}>{a.label} - {a.name}</span>
                          {biasInsight?.label && <span style={{ fontSize: 9, fontWeight: 600, color: a.bias === "−" ? "#E65100" : a.bias === "+" ? "#2E7D32" : "#1565C0", background: a.bias === "−" ? "#FFF7ED" : a.bias === "+" ? "#F0FAF0" : "#F5F9FF", padding: "1px 6px", borderRadius: 3 }}>{biasInsight.label}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{biasInsight?.insight}</div>
                        {biasInsight?.environmentCost && (
                          <ExpandableInsight label="Environment Cost" color={a.bias === "−" ? "#E65100" : C.attr.ext}>
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
          <ReportSection num={6} title="YOUR PROCESS: Internal (Leadership Foundation)">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your Internal Attributes reflect how you see yourself. Your own worth, your purpose, and your capacity to lead yourself. These are the foundation beneath everything else you do.</p>
            {intRows.map(a => {
              const biasInsight = getAttrIntBiasInsight(a.name, a.bias);
              return (
                <div key={a.name} style={{ marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.attr.int, flexShrink: 0, width: 40 }}>{a.score}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{a.name}</span>
                        {biasInsight?.label && <span style={{ fontSize: 9, fontWeight: 600, color: a.bias === "−" ? "#E65100" : a.bias === "+" ? "#2E7D32" : "#1565C0", background: a.bias === "−" ? "#FFF7ED" : a.bias === "+" ? "#F0FAF0" : "#F5F9FF", padding: "1px 6px", borderRadius: 3 }}>{biasInsight.label}</span>}
                      </div>
                      <Bias bias={a.bias} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{biasInsight?.insight}</div>
                  {biasInsight?.environmentCost && (
                    <ExpandableInsight label="Environment Cost" color={a.bias === "−" ? "#E65100" : C.attr.int}>
                      {biasInsight.environmentCost}
                    </ExpandableInsight>
                  )}
                </div>
              );
            })}
          </ReportSection>

          {/* 7: Process Signals */}
          <ReportSection num={7} title="PROCESS SIGNALS: Patterns Worth Examining">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your External Attributes show patterns worth paying attention to. A minus bias doesn't mean something's broken. It means there's a lens you're not fully using right now. These are signals — not verdicts. The Environment Alignment is what helps you determine what's driving them.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              {taxCard("External Patterns", extMinusBiases === 0 ? "Clear" : `${extMinusBiases} detected`, processTaxColor, extMinusBiases === 0 ? "All external capacities active" : `${extMinusBiases} lens${extMinusBiases > 1 ? "es" : ""} showing bias pattern`)}
              {taxCard("Internal Impact", intMinusBiases === 0 ? "Clear" : `${intMinusBiases} detected`, intMinusBiases === 0 ? C.green : "#E65100", intMinusBiases === 0 ? "Internal foundation stable" : `${intMinusBiases} dimension${intMinusBiases > 1 ? "s" : ""} showing environment sensitivity`)}
              {taxCard("Signal Level", extMinusBiases === 0 ? "Clear" : extMinusBiases === 1 ? "Low" : extMinusBiases >= 2 ? "Elevated" : "Clear", processTaxColor, "Based on external bias patterns")}
            </div>
            {envTax.hasFrustratedPT && (
              <div style={{ fontSize: 11, color: "#7F1D1D", lineHeight: 1.7, padding: "12px 16px", marginBottom: 8, background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA", borderLeft: "4px solid #C62828" }}>
                <strong>Environment Damage Indicator Detected.</strong> Your Practical Thinking shows a Frustrated (−) bias. This is the most telling pattern in the entire Attributes profile. It means your environment has taught you that practical application doesn't pay off — that the results you produce don't matter. This is worth examining closely.
              </div>
            )}
            {extMinusBiases > 0 && !envTax.hasFrustratedPT && (
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, padding: "12px 16px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, borderLeft: "4px solid #E65100" }}>
                Your data shows decision-making capacity you're not fully using right now. It shows up as second-guessing yourself, ignoring data you know matters, or defaulting to one lens when the situation calls for another. Whether this pattern is environment-driven or experience-driven is exactly what the Environment Alignment is built to clarify.
              </div>
            )}
          </ReportSection>

          {/* 8: Compound Patterns */}
          {envTax.activeCompounds.length > 0 && (
            <ReportSection num={8} title="COMPOUND PATTERNS: Cross-Dimensional Insights">
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>When specific dimensions combine, they create patterns greater than the sum of their parts. These compound patterns reveal how your behavioral style, values, and decision-making architecture interact to shape your leadership signature.</p>
              {envTax.activeCompounds.map(cp => (
                <div key={cp.id} style={{ marginBottom: 12, padding: "16px 20px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, borderLeft: "4px solid #C8A96E" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#C8A96E", marginBottom: 4 }}>{cp.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginBottom: 8 }}>{cp.description}</div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 6 }}>{cp.strength}</div>
                  <ExpandableInsight label="Toxic Pattern" color="#E65100">
                    {cp.toxicPattern}
                  </ExpandableInsight>
                  <ExpandableInsight label="Recommendation" color="#C8A96E">
                    {cp.recommendation}
                  </ExpandableInsight>
                </div>
              ))}
            </ReportSection>
          )}

          {/* 9 (or 8): Compound Bill */}
          <ReportSection num={envTax.activeCompounds.length > 0 ? 9 : 8} title="THE COMPOUND BILL: Your Environment Picture">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>Your Preference Tax is confirmed from your data. It's the behavioral energy cost your environment charges you every day. Your Process Signals identify patterns in your decision-making that are worth digging into. Together, they start to reveal the gap between who you are and how you're showing up.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {taxCard("Preference Tax", prefTaxLabel, prefTaxColor, `${prefTax} gap points confirmed`)}
              {taxCard("Process Signals", extMinusBiases === 0 ? "Clear" : `${extMinusBiases} pattern${extMinusBiases > 1 ? "s" : ""}`, processTaxColor, extMinusBiases === 0 ? "No patterns detected" : `${extMinusBiases} bias pattern${extMinusBiases > 1 ? "s" : ""} to examine`)}
            </div>
            {/* Peak-End Rule: Compound Bill Verdict */}
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
                  {envTax.hasFrustratedPT && (
                    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#C62828", marginBottom: 4 }}>Environment Damage Signal Active</div>
                      <div style={{ fontSize: 11, color: "#7F1D1D", lineHeight: 1.5 }}>Your Practical Thinking (−) bias indicates your environment may be actively undermining your relationship with results and execution. This pattern deserves priority attention in your Environment Alignment.</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </ReportSection>

        </div>
      </div>
    </div>
  );
}
