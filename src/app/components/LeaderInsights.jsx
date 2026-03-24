'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { discFull, getDom, normBias, valLevel } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Card, StoryCard, AlertCard, SectionHead, MetricCard } from "./ui";
import { getEnvironmentTaxSummary } from "../knowledge/assessmentInsights";
import { calculateFriction } from "../utils/friction";
import { generatePreferenceSOPs, generatePassionSOPs, generateProcessSOPs } from "../utils/sop-engine";
import { generatePreferenceSOP, generatePassionSOP, generateProcessSOP } from "../knowledge/sopEngine";
import { getDiscNarrative, getGapNarrative, getValuesNarrative, getExtAttrNarrative, getIntAttrNarrative, getPreferenceTaxNarrative } from "../knowledge/narrativeEngine";

export function LeaderInsights({ people, teamId, orgId, leaderId }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("environment");

  // Find leader and validate they belong to current org (defense in depth)
  const leader = useMemo(() => {
    if (!leaderId) return null;
    const found = people.find(p => p.id === leaderId);
    // Only return leader if they belong to current org
    if (found && found.orgId === orgId) return found;
    return null;
  }, [leaderId, people, orgId]);

  const peopleIds = people.map(p => p.id).join(',');
  const complete = useMemo(() => people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending"), [peopleIds, orgId, teamId]);
  const members = useMemo(() => complete.filter(p => p.id !== leaderId && p.disc), [complete, leaderId]);

  if (!leader || !leader.disc) return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold mb-2">Leader Insights</h1>
      <div className="text-center py-16 text-muted">
        <div className="text-4xl mb-3">{"\u2B50"}</div>
        <div className="text-sm font-semibold">No leader selected</div>
        <div className="text-xs mt-1">Set a leader in Settings to see your personal environment report</div>
      </div>
    </div>
  );

  const tax = useMemo(() => getEnvironmentTaxSummary(leader), [leader]);
  const nat = leader.disc.natural;
  const adp = leader.disc.adaptive;

  const tabs = [
    { id: "environment", label: "My Environment" },
    { id: "values", label: "My Values" },
    { id: "attributes", label: "My Attributes" },
    { id: "gap", label: "Leadership Gap" },
    { id: "framework", label: "LWYL Framework" },
    { id: "sops", label: "My SOPs" },
  ];

  // Team aggregate DISC -- memoized
  const teamAvg = useMemo(() => members.length > 0 ? {
    D: Math.round(members.reduce((s, p) => s + p.disc.natural.D, 0) / members.length),
    I: Math.round(members.reduce((s, p) => s + p.disc.natural.I, 0) / members.length),
    S: Math.round(members.reduce((s, p) => s + p.disc.natural.S, 0) / members.length),
    C: Math.round(members.reduce((s, p) => s + p.disc.natural.C, 0) / members.length),
  } : null, [members]);

  return (
    <div className={`max-w-[900px] ${isMobile ? 'p-4' : 'p-8'}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className={`m-0 ${isMobile ? 'text-xl' : 'text-2xl'} font-extrabold tracking-tight`}>Leader Insights</h1>
        <div className="text-xs text-muted mt-0.5">Your personal environment report. Understand yourself before you lead others.</div>
      </motion.div>

      {/* Leader Identity Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl p-6 mb-6 text-white"
        style={{ background: "linear-gradient(135deg, var(--nav-bg) 0%, color-mix(in srgb, var(--nav-bg) 80%, var(--bg-card)) 60%, var(--nav-bg) 100%)" }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold" style={{ background: "color-mix(in srgb, var(--bg-card) 10%, transparent)" }}>
            {leader.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="text-xl font-bold">{leader.name}</div>
            <div className="text-[13px]" style={{ color: "color-mix(in srgb, var(--bg-card) 50%, transparent)" }}>{getDom(nat)} dominant</div>
          </div>
          <div className="ml-auto">
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-lg"
              style={{
                background: tax.totalGap >= 80
                  ? "color-mix(in srgb, var(--friction-high) 20%, transparent)"
                  : tax.totalGap >= 40
                    ? "color-mix(in srgb, var(--alert-warning-accent) 20%, transparent)"
                    : "color-mix(in srgb, var(--alert-success-accent) 20%, transparent)",
                color: tax.totalGap >= 80
                  ? "color-mix(in srgb, var(--friction-high) 60%, var(--bg-card))"
                  : tax.totalGap >= 40
                    ? "color-mix(in srgb, var(--alert-warning-accent) 60%, var(--bg-card))"
                    : "color-mix(in srgb, var(--alert-success-accent) 60%, var(--bg-card))"
              }}
            >
              {tax.totalGap} gap points
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {["D", "I", "S", "C"].map(d => {
            const narrative = getDiscNarrative(d, nat[d]);
            return (
              <div key={d} className="rounded-[10px] p-3" style={{ background: "color-mix(in srgb, var(--bg-card) 8%, transparent)" }}>
                <div className="text-[10px] mb-1 text-center" style={{ color: "color-mix(in srgb, var(--bg-card) 40%, transparent)" }}>{discFull[d]}</div>
                <div className="text-2xl font-bold text-center" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{nat[d]}</div>
                <div className="text-[10px] mt-1.5 leading-snug" style={{ color: "color-mix(in srgb, var(--bg-card) 50%, transparent)" }}>
                  {narrative ? narrative.short.charAt(0).toUpperCase() + narrative.short.slice(1) : ""}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex gap-1 mb-5 bg-subtle rounded-[10px] p-1"
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg border-none cursor-pointer text-[13px] font-semibold transition-all duration-150 ${
              activeTab === t.id
                ? 'text-disc-c'
                : 'text-muted'
            }`}
            style={{
              background: activeTab === t.id
                ? "color-mix(in srgb, var(--disc-c) 10%, transparent)"
                : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab: My Environment */}
      {activeTab === "environment" && (
        <>
          {/* What Your Environment Needs to Look Like */}
          {(() => {
            const prefSOP = generatePreferenceSOP(leader);
            const passSOP = generatePassionSOP(leader);
            const procSOP = generateProcessSOP(leader);
            const topVals = passSOP ? passSOP.topValues : [];
            const domLens = procSOP ? procSOP.lenses.sort((a, b) => b.score - a.score)[0] : null;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <h2 className="text-[17px] font-extrabold text-foreground mb-1 m-0">What Your Environment Needs to Look Like</h2>
                  <div className="text-xs text-muted mb-5 leading-relaxed">
                    A synthesis of your DISC style, top values, and 3H decision-making profile. This is what you need around you to lead at your best.
                  </div>

                  {/* DISC Environment */}
                  {prefSOP && (
                    <div className="rounded-2xl bg-card border border-border shadow-sm p-4 mb-3">
                      <div className="text-[11px] font-bold text-disc-c uppercase tracking-wider mb-1.5">Behavioral Style -- {prefSOP.dominantStyle} Dominant</div>
                      <div className="text-[13px] text-foreground leading-relaxed mb-2">
                        Your natural wiring says: <em>"{prefSOP.perspective}"</em>
                      </div>
                      <div className="text-[13px] text-foreground leading-relaxed mb-2">
                        <strong>Your environment needs to support:</strong> {prefSOP.approach}
                      </div>
                      <div className="text-[13px] text-foreground leading-relaxed">
                        <strong>In real time, you are scanning for:</strong> {prefSOP.realTime}
                      </div>
                      {prefSOP.sop && (
                        <div className="mt-2.5 px-3.5 py-2.5 rounded-lg bg-alert-success-bg border border-alert-success-border">
                          <div className="text-[11px] font-bold text-alert-success-accent mb-1">Your Operating Standard</div>
                          <div className="text-xs text-alert-success-text leading-relaxed">{prefSOP.sop}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Values / Energizers */}
                  {passSOP && topVals.length > 0 && (
                    <div className="rounded-2xl bg-card border border-border shadow-sm p-4 mb-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--values-individualistic)" }}>What Energizes You -- Top Values</div>
                      <div className="text-[13px] text-foreground leading-relaxed mb-2.5">
                        Your top motivators are <strong>{topVals.join(", ")}</strong>. When your environment honors these, you have energy. When it doesn't, you burn out -- not because you're weak, but because the fuel isn't there.
                      </div>
                      {passSOP.profiles.map(p => (
                        <div key={p.dimension} className="mb-2.5">
                          <div className="text-xs font-bold text-foreground mb-0.5">{p.icon} {p.dimension} -- {p.label}</div>
                          <div className="text-xs text-muted leading-relaxed">{p.definition}</div>
                          <div className="text-xs text-foreground leading-relaxed mt-1">
                            <em>"{p.perspective}"</em>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3H Decision-Making */}
                  {domLens && (
                    <div className="rounded-2xl bg-card border border-border shadow-sm p-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--attr-ext)" }}>Decision-Making Needs -- {domLens.label}</div>
                      <div className="text-[13px] text-foreground leading-relaxed mb-2">
                        Your dominant decision-making lens is <strong>{domLens.label}</strong>. This means your environment needs to give you room to: <em>{domLens.definition.toLowerCase()}</em>
                      </div>
                      <div className="text-xs text-foreground leading-relaxed mb-1">
                        <strong>Talents this activates:</strong> {domLens.talents}
                      </div>
                      <div className="text-[13px] text-foreground leading-relaxed">
                        <em>"{domLens.perspective}"</em>
                      </div>
                      <div className="text-[11px] font-bold text-foreground mt-2.5 mb-1">Questions your environment should normalize:</div>
                      {domLens.sopQuestions.map((q, i) => (
                        <div key={i} className="text-xs text-muted pl-3 mb-0.5">{"\u2022"} {q}</div>
                      ))}
                      {procSOP.requires.length > 0 && (
                        <div className="mt-2.5 px-3.5 py-2.5 rounded-lg" style={{ background: "color-mix(in srgb, var(--attr-ext) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--attr-ext) 25%, transparent)" }}>
                          <div className="text-[11px] font-bold mb-1" style={{ color: "var(--attr-ext)" }}>Lenses You Require</div>
                          {procSOP.requires.map((r, i) => (
                            <div key={i} className="text-xs leading-relaxed" style={{ color: "var(--attr-ext)" }}>{"\u2022"} {r.label} (score: {r.score})</div>
                          ))}
                        </div>
                      )}
                      {procSOP.dismisses.length > 0 && (
                        <div className="mt-2 px-3.5 py-2.5 rounded-lg bg-alert-warning-bg border border-alert-warning-border">
                          <div className="text-[11px] font-bold text-alert-warning-accent mb-1">Lenses You May Undervalue</div>
                          {procSOP.dismisses.map((d, i) => (
                            <div key={i} className="text-xs text-alert-warning-text leading-relaxed">{"\u2022"} {d.label} (score: {d.score}) -- this is a blind spot your environment needs to compensate for</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })()}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-foreground m-0">Preference Tax</h2>
                  <p className="text-xs text-muted mt-0.5 m-0">The daily cost of adapting your natural style to your environment</p>
                </div>
                <span
                  className="text-[10px] font-bold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: tax.totalGap >= 80 ? "var(--alert-critical-accent)" : tax.totalGap >= 40 ? "var(--alert-warning-accent)" : "var(--alert-success-accent)",
                    color: "var(--bg-card)"
                  }}
                >
                  {tax.totalGap >= 80 ? "High" : tax.totalGap >= 40 ? "Moderate" : "Low"}
                </span>
              </div>
              <div
                className="text-[13px] text-foreground leading-relaxed mb-4 px-4 py-3 rounded-[10px]"
                style={{
                  background: tax.totalGap >= 80 ? "var(--alert-critical-bg)" : tax.totalGap >= 40 ? "var(--alert-warning-bg)" : "var(--alert-success-bg)",
                  border: `1px solid ${tax.totalGap >= 80 ? "var(--alert-critical-border)" : tax.totalGap >= 40 ? "var(--alert-warning-border)" : "var(--alert-success-border)"}`
                }}
              >
                {getPreferenceTaxNarrative(tax.totalGap, leader.name)}
              </div>
              <div className="flex flex-col gap-3">
                {["D", "I", "S", "C"].map(d => {
                  const gap = adp[d] - nat[d];
                  const absGap = Math.abs(gap);
                  const direction = gap > 0 ? "Amplifying" : gap < 0 ? "Suppressing" : "Aligned";
                  const dirVar = gap > 0 ? "var(--alert-warning-accent)" : gap < 0 ? "var(--friction-high)" : "var(--alert-success-accent)";
                  const gapNarr = getGapNarrative(d, nat[d], adp[d]);
                  return (
                    <div
                      key={d}
                      className="px-3.5 py-2.5 rounded-[10px]"
                      style={{
                        background: absGap >= 20 ? "var(--alert-warning-bg)" : "var(--bg-subtle)",
                        border: `1px solid ${absGap >= 20 ? "var(--alert-warning-border)" : "var(--border-default)"}`
                      }}
                    >
                      <div className={`flex items-center gap-3 ${absGap >= 10 ? 'mb-1.5' : ''}`}>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: `var(--disc-${d.toLowerCase()})` }} />
                        <span className="text-[13px] text-foreground w-[100px]">{discFull[d]}</span>
                        <span className="text-[13px] font-bold text-foreground w-10">{gap > 0 ? "+" : ""}{gap}</span>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                          style={{
                            background: `color-mix(in srgb, ${dirVar} 10%, transparent)`,
                            color: dirVar
                          }}
                        >
                          {direction}
                        </span>
                      </div>
                      {absGap >= 10 && (
                        <div className="text-xs text-muted leading-relaxed mt-1 pl-5">
                          {gapNarr.narrative}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card>
              <h2 className="text-base font-extrabold text-foreground m-0">Natural vs. Adaptive</h2>
              <p className="text-xs text-muted mt-0.5 mb-4 m-0">Who you are vs. who your environment asks you to be</p>
              <div className="text-[13px] text-foreground leading-relaxed mb-4">
                Your Natural style is who you are. Your Adaptive style is who your environment is asking you to be. The gap between them is your daily cost. That cost shows up as fatigue, frustration, and friction with people who don't understand why you're stretched.
              </div>
              {["D", "I", "S", "C"].map(d => {
                const n = nat[d];
                const a = adp[d];
                const gapNarr = getGapNarrative(d, n, a);
                const discNarr = getDiscNarrative(d, n);
                return (
                  <div
                    key={d}
                    className="mb-4 px-4 py-3 rounded-[10px]"
                    style={{
                      background: gapNarr.severity === "significant" ? "var(--alert-warning-bg)" : "var(--bg-subtle)",
                      border: `1px solid ${gapNarr.severity === "significant" ? "var(--alert-warning-border)" : "var(--border-default)"}`
                    }}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{discFull[d]}</span>
                      <span className="text-xs text-muted">Natural: {n} → Adaptive: {a}</span>
                    </div>
                    <div className="relative h-3 bg-subtle rounded-md overflow-hidden mb-2">
                      <div className="absolute top-0 left-0 h-full rounded-md opacity-30" style={{ width: `${n}%`, background: `var(--disc-${d.toLowerCase()})` }} />
                      <div className="absolute top-0 left-0 h-full rounded-md" style={{ width: `${a}%`, background: `var(--disc-${d.toLowerCase()})` }} />
                    </div>
                    <div className="text-xs text-foreground leading-relaxed">
                      <strong>Naturally:</strong> {discNarr ? discNarr.short.charAt(0).toUpperCase() + discNarr.short.slice(1) + "." : ""}
                    </div>
                    {gapNarr.severity !== "aligned" && (
                      <div
                        className="text-xs leading-relaxed mt-1"
                        style={{ color: gapNarr.severity === "significant" ? "var(--alert-warning-accent)" : "var(--text-muted)" }}
                      >
                        {gapNarr.narrative}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="text-[11px] text-muted">Solid = Adaptive (what you show). Faded = Natural (who you are).</div>
            </Card>
          </motion.div>
        </>
      )}

      {/* Tab: My Values */}
      {activeTab === "values" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <h2 className="text-base font-extrabold text-foreground m-0">Values Profile</h2>
            <p className="text-xs text-muted mt-0.5 mb-4 m-0">What drives you at a deep level</p>
            <div className="text-[13px] text-foreground leading-relaxed mb-4">
              Your top motivators are the dimensions your environment must honor. When they're not honored, you burn out. Not because you're weak. Because the thing that fuels you isn't being fed.
            </div>
            {Object.entries(leader.values).sort(([, a], [, b]) => b - a).map(([key, score]) => {
              const vl = valLevel(score);
              const isTop = score >= 55;
              const valNarr = getValuesNarrative(key, score);
              return (
                <div
                  key={key}
                  className="mb-4 px-4 py-3 rounded-[10px]"
                  style={{
                    background: isTop ? "color-mix(in srgb, var(--nav-accent) 8%, transparent)" : "var(--bg-subtle)",
                    border: `1px solid ${isTop ? "color-mix(in srgb, var(--nav-accent) 25%, transparent)" : "var(--border-default)"}`
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{key}</span>
                      {isTop && (
                        <span
                          className="text-[10px] font-bold px-2 py-px rounded-lg"
                          style={{
                            background: "color-mix(in srgb, var(--nav-accent) 15%, transparent)",
                            color: "var(--nav-accent)"
                          }}
                        >
                          Top Motivator
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: vl.c }}>{score}</span>
                  </div>
                  <div className="h-2 bg-subtle rounded overflow-hidden mb-2">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${score}%`,
                        background: isTop ? `var(--values-${key.toLowerCase()})` : "var(--border-default)"
                      }}
                    />
                  </div>
                  {valNarr && (
                    <div className="text-xs text-foreground leading-relaxed">
                      {valNarr.narrative}
                    </div>
                  )}
                  {valNarr?.environmentCost && isTop && (
                    <div className="text-[11px] text-muted leading-snug mt-1 italic">
                      {valNarr.environmentCost}
                    </div>
                  )}
                </div>
              );
            })}
            <AlertCard severity="info" title="Passion Signal, not verdict">
              Whether your environment is honoring your top motivators is a question only you can answer. These scores tell you what drives you. They don't tell you whether those drivers are being met.
            </AlertCard>
          </Card>
        </motion.div>
      )}

      {/* Tab: My Attributes */}
      {activeTab === "attributes" && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <h2 className="text-base font-extrabold text-foreground m-0">External Attributes</h2>
              <p className="text-xs text-muted mt-0.5 mb-4 m-0">How you see the world and make decisions</p>
              <div className="text-[13px] text-foreground leading-relaxed mb-4">
                These three lenses shape how you process every situation. Your dominant lens is the one you reach for first. Your bias tells you whether you're fully using each lens or whether your environment is suppressing it.
              </div>
              {leader.attr.ext.map(a => {
                const b = normBias(a.bias);
                const biasVar = b === "+" ? "var(--alert-success-accent)" : b === "\u2212" ? "var(--friction-high)" : "var(--text-muted)";
                const narr = getExtAttrNarrative(a.label, a.score, a.bias);
                return (
                  <div
                    key={a.name}
                    className="rounded-[10px] p-3.5 mb-3"
                    style={{
                      background: b === "\u2212" ? "var(--alert-critical-bg)" : "var(--bg-subtle)",
                      borderLeft: `4px solid ${biasVar}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-foreground">{a.label} ({a.name})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">{a.score}</span>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            background: `color-mix(in srgb, ${biasVar} 10%, transparent)`,
                            color: biasVar
                          }}
                        >
                          {narr.biasWord}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted leading-snug mb-1.5">
                      {narr.lensExplanation}
                    </div>
                    <div className="text-xs text-foreground leading-relaxed">
                      {narr.biasExplanation}
                    </div>
                  </div>
                );
              })}
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <h2 className="text-base font-extrabold text-foreground m-0">Internal Attributes</h2>
              <p className="text-xs text-muted mt-0.5 mb-4 m-0">How you see yourself -- the foundation beneath your leadership</p>
              <div className="text-[13px] text-foreground leading-relaxed mb-4">
                These dimensions reflect your relationship with yourself. They determine whether you show up with confidence, clarity, and direction -- or whether you second-guess, overextend, or drift.
              </div>
              {leader.attr.int.map(a => {
                const b = normBias(a.bias);
                const biasVar = b === "+" ? "var(--alert-success-accent)" : b === "\u2212" ? "var(--friction-high)" : "var(--text-muted)";
                const narr = getIntAttrNarrative(a.name, a.score, a.bias);
                return (
                  <div
                    key={a.name}
                    className="rounded-[10px] p-3.5 mb-3"
                    style={{
                      background: b === "\u2212" ? "var(--alert-critical-bg)" : "var(--bg-subtle)",
                      borderLeft: `4px solid ${biasVar}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-foreground">{a.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">{a.score}</span>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            background: `color-mix(in srgb, ${biasVar} 10%, transparent)`,
                            color: biasVar
                          }}
                        >
                          {narr.biasWord}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted leading-snug mb-1.5">
                      {narr.dimExplanation}
                    </div>
                    {narr.insight && (
                      <div className="text-xs text-foreground leading-relaxed">
                        {narr.insight}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </motion.div>
        </>
      )}

      {/* Tab: Leadership Gap */}
      {activeTab === "gap" && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <h2 className="text-base font-extrabold text-foreground m-0">Your Environment vs. What Your Team Needs</h2>
              <p className="text-xs text-muted mt-0.5 mb-4 m-0">The gap where leadership friction lives</p>
              <div className="text-[13px] text-foreground leading-relaxed mb-4">
                Every person on your team has a version of "the right way" shaped by everything they experienced before they walked through your door. Your job is to understand that version, not fight it. This gap shows where your natural operating style creates cost for the people you lead.
              </div>
              {teamAvg && ["D", "I", "S", "C"].map(d => {
                const leaderScore = nat[d];
                const teamScore = teamAvg[d];
                const gap = Math.abs(leaderScore - teamScore);
                const gapVar = gap >= 40 ? "var(--friction-high)" : gap >= 20 ? "var(--alert-warning-accent)" : "var(--alert-success-accent)";
                const gapLabel = gap >= 40 ? "High Gap" : gap >= 20 ? "Moderate" : "Aligned";
                const leaderName = leader.name.split(" ")[0];
                const leaderHigher = leaderScore > teamScore;

                const gapStory = gap >= 20 ? {
                  D: leaderHigher
                    ? `${leaderName} moves faster than the team average on decisions. That pace can feel like pressure to people who need more time. Not wrong -- just different.`
                    : `The team pushes harder on decisions than ${leaderName} naturally does. ${leaderName} may need to consciously step into the driver's seat more often.`,
                  I: leaderHigher
                    ? `${leaderName} brings more social energy than the team average. Some people will love it. Others may feel steamrolled by enthusiasm. Read the room.`
                    : `The team brings more relational energy than ${leaderName}. It may be worth investing more in face time and connection, even when it doesn't feel productive.`,
                  S: leaderHigher
                    ? `${leaderName} needs more stability than the team average. Be careful not to slow down people who are ready to move.`
                    : `The team needs more stability than ${leaderName} naturally provides. What feels like healthy change to ${leaderName} may feel chaotic to them.`,
                  C: leaderHigher
                    ? `${leaderName} holds a higher quality bar than the team average. That precision is a strength -- until it becomes a bottleneck.`
                    : `The team wants more structure and rigor than ${leaderName} naturally brings. What feels efficient to ${leaderName} may feel sloppy to them.`
                }[d] : null;

                return (
                  <div
                    key={d}
                    className="mb-4 px-4 py-3 rounded-[10px]"
                    style={{
                      background: gap >= 20 ? "var(--alert-warning-bg)" : "var(--bg-subtle)",
                      border: `1px solid ${gap >= 20 ? "var(--alert-warning-border)" : "var(--border-default)"}`
                    }}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-[13px] font-semibold text-foreground">{discFull[d]}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={{
                            background: `color-mix(in srgb, ${gapVar} 10%, transparent)`,
                            color: gapVar
                          }}
                        >
                          {gapLabel}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-4 bg-subtle rounded-lg overflow-hidden">
                      <div className="absolute top-0 left-0 h-full rounded-lg opacity-30" style={{ width: `${teamScore}%`, background: `var(--disc-${d.toLowerCase()})` }} />
                      <div className="absolute top-0 left-0 h-full rounded-lg" style={{ width: `${leaderScore}%`, background: `var(--disc-${d.toLowerCase()})` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted mt-0.5">
                      <span>You: {leaderScore}</span>
                      <span>Team avg: {teamScore}</span>
                    </div>
                    {gapStory && (
                      <div className="text-xs text-muted leading-relaxed mt-1.5">
                        {gapStory}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <h2 className="text-base font-extrabold text-foreground m-0">Friction with Each Team Member</h2>
              <p className="text-xs text-muted mt-0.5 mb-4 m-0">Where the gaps are between you and each person</p>
              {members
                .map(m => ({ m, friction: calculateFriction(leader, m) }))
                .sort((a, b) => b.friction.totalScore - a.friction.totalScore)
                .map(({ m, friction }) => {
                const tierVar = friction.tier === "high" ? "var(--alert-critical-accent)" : friction.tier === "moderate" ? "var(--alert-warning-accent)" : "var(--alert-success-accent)";
                const tierLabel = friction.tier === "high" ? "High Friction" : friction.tier === "moderate" ? "Moderate" : "Aligned";
                const topGap = friction.discGaps.filter(g => g.tier !== "low").sort((x, y) => y.gap - x.gap)[0];
                const leaderFirst = leader.name.split(" ")[0];
                const memberFirst = m.name.split(" ")[0];

                let frictionSentence = "";
                if (topGap) {
                  const higher = topGap.aScore > topGap.bScore ? leaderFirst : memberFirst;
                  const lower = topGap.aScore > topGap.bScore ? memberFirst : leaderFirst;
                  const dimStories = {
                    D: `${higher} pushes for decisions. ${lower} needs more time.`,
                    I: `${higher} leads with energy. ${lower} leads with substance.`,
                    S: `${higher} needs stability. ${lower} is comfortable with change.`,
                    C: `${higher} wants precision. ${lower} wants speed.`
                  };
                  frictionSentence = dimStories[topGap.dim] || "";
                }

                return (
                  <div
                    key={m.id}
                    onClick={() => router.push(`/app/bridge?with=${m.id}`)}
                    className="px-3.5 py-3 rounded-[10px] mb-2 cursor-pointer transition-all duration-150 hover:scale-[1.01]"
                    style={{
                      background: friction.tier === "high" ? "var(--alert-critical-bg)" : "var(--bg-subtle)",
                      border: `1px solid ${friction.tier === "high" ? "var(--alert-critical-border)" : "var(--border-default)"}`,
                      borderLeft: `4px solid ${tierVar}`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ background: `var(--disc-${(getDom(m.disc.natural).charAt(0) || "").toLowerCase()})` }}
                      >
                        {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-foreground">{m.name}</div>
                        {frictionSentence && (
                          <div className="text-[11px] text-muted mt-0.5 leading-snug">{frictionSentence}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg"
                          style={{
                            background: `color-mix(in srgb, ${tierVar} 8%, transparent)`,
                            color: tierVar
                          }}
                        >
                          {tierLabel}
                        </span>
                        <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </motion.div>
        </>
      )}

      {/* Tab: LWYL Framework */}
      {activeTab === "framework" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <h2 className="text-base font-extrabold text-foreground m-0">Love Where You Lead</h2>
            <p className="text-xs text-muted mt-0.5 mb-5 m-0">The framework for leading without losing yourself</p>
            <div className="text-[13px] text-foreground leading-relaxed mb-5">
              Every person on your team has a version of "the right way" shaped by everything they experienced before they walked through your door. Your job as a leader is to understand that version, not fight it.
            </div>
            {[
              { step: "1", title: "Know Yourself First", desc: "Your Environment Report shows you the cost you're already paying. You can't lead others well if you're running on empty.", done: true },
              { step: "2", title: "Understand Your Team", desc: "Each person's DISC, Values, and Attributes profile tells you what they need to do their best work. That's not a luxury. It's your job.", done: true },
              { step: "3", title: "Name the Friction", desc: "The Friction Map shows you where the gaps are. Naming them is not blame. It's the first step to bridging them.", done: true },
              { step: "4", title: "Build the Bridge", desc: "Connection Agreements are documented commitments to reduce friction. They turn insight into action.", done: false },
              { step: "5", title: "Guided Reflections", desc: "Confirm or challenge what the signals suggest. This is where Passion and Process signals become confirmed data.", coming: true },
            ].map(s => (
              <div key={s.step} className="flex gap-3 p-3.5 bg-subtle rounded-[10px] mb-2 items-start">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: s.done ? "var(--disc-c)" : s.coming ? "var(--border-default)" : "var(--disc-i)",
                    color: s.done ? "var(--bg-card)" : s.coming ? "var(--text-muted)" : "var(--bg-card)"
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-foreground">{s.title}</span>
                    {s.coming && <span className="text-[10px] font-semibold px-2 py-px rounded-lg bg-subtle text-muted">Coming Soon</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5 leading-snug">{s.desc}</div>
                </div>
              </div>
            ))}
          </Card>
        </motion.div>
      )}

      {/* Tab: My SOPs */}
      {activeTab === "sops" && (() => {
        const prefSOPs = generatePreferenceSOPs(complete);
        const passSOPs = generatePassionSOPs(complete);
        const procSOPs = generateProcessSOPs(complete);
        const leaderPref = prefSOPs.find(s => s.personId === leaderId);
        const leaderPass = passSOPs.find(s => s.personId === leaderId);
        const leaderProc = procSOPs.find(s => s.personId === leaderId);

        return (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mb-6"
            >
              <h2 className="text-lg font-extrabold text-foreground tracking-tight m-0">Your Standard Operating Procedures</h2>
              <p className="text-xs text-muted mt-0.5 m-0">Derived from your assessment data using the 3 P's framework</p>
            </motion.div>

            {/* Preference SOP */}
            {leaderPref && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card>
                  <div className="text-[11px] font-bold text-disc-c uppercase tracking-wider mb-2">Preference SOP -- {leaderPref.style}</div>
                  <div className="text-[15px] font-bold text-foreground mb-1">{leaderPref.coreQuestion}</div>
                  <div className="text-[13px] text-foreground leading-relaxed mb-3">"{leaderPref.perspective}"</div>
                  <div className="text-xs text-muted mb-2"><strong>Decision Approach:</strong> {leaderPref.decisionApproach}</div>
                  {leaderPref.sop && (
                    <div className="px-3.5 py-2.5 rounded-lg bg-alert-success-bg border border-alert-success-border mb-2">
                      <div className="text-[11px] font-bold text-alert-success-accent mb-1">Your SOP</div>
                      <div className="text-xs text-alert-success-text leading-relaxed">{leaderPref.sop}</div>
                    </div>
                  )}
                  <AlertCard severity="warning" title="Cautionary Note">{leaderPref.caution}</AlertCard>
                </Card>
              </motion.div>
            )}

            {/* Passion SOPs */}
            {leaderPass && leaderPass.bridges.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Card>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--values-individualistic)" }}>Passion SOPs -- Engagement Bridge</div>
                  <div className="text-[13px] text-muted mb-4">Your top motivators: {leaderPass.topMotivators.join(", ")}</div>
                  {leaderPass.bridges.map((b, i) => (
                    <StoryCard key={i} accent="var(--values-individualistic)" title={`${b.dimension}: ${b.definition}`}>
                      <div className="mb-2">"{b.perspective}"</div>
                      <div className="text-[11px] font-bold text-foreground mt-2 mb-1">What matters:</div>
                      {b.whatMatters.map((w, j) => (
                        <div key={j} className="text-xs text-muted pl-3 mb-0.5">{"\u2022"} {w}</div>
                      ))}
                      <div className="text-[11px] font-bold text-foreground mt-2 mb-1">Initiatives you would love to lead:</div>
                      {b.initiatives.map((init, j) => (
                        <div key={j} className="text-xs text-muted pl-3 mb-0.5">{"\u2022"} {init}</div>
                      ))}
                      <div className="text-[11px] font-bold text-alert-critical-accent mt-2 mb-1">Things that irk you:</div>
                      {b.thingsThatIrk.map((irk, j) => (
                        <div key={j} className="text-xs text-alert-critical-text pl-3 mb-0.5">{"\u2022"} {irk}</div>
                      ))}
                    </StoryCard>
                  ))}
                </Card>
              </motion.div>
            )}

            {/* Process SOP */}
            {leaderProc && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Card>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--attr-ext)" }}>Process SOP -- 3H Role: {leaderProc.dominantLens}</div>
                  <div className="text-[15px] font-bold text-foreground mb-1">{leaderProc.definition}</div>
                  <div className="text-xs text-muted mb-1"><strong>Talents:</strong> {leaderProc.talents}</div>
                  <div className="text-[13px] text-foreground leading-relaxed mb-3">"{leaderProc.perspective}"</div>
                  <div className="text-[11px] font-bold text-foreground mb-1">Practical Application:</div>
                  {leaderProc.practicalApplication.map((pa, i) => (
                    <div key={i} className="text-xs text-muted pl-3 mb-0.5">{"\u2022"} {pa}</div>
                  ))}
                  <div className="text-[11px] font-bold text-foreground mt-3 mb-1">SOP Questions to ask before decisions:</div>
                  {leaderProc.sopQuestions.map((q, i) => (
                    <div key={i} className="text-xs text-muted pl-3 mb-0.5">{"\u2022"} {q}</div>
                  ))}
                  <div className="px-3.5 py-2.5 rounded-lg mt-3" style={{ background: "color-mix(in srgb, var(--attr-ext) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--attr-ext) 25%, transparent)" }}>
                    <div className="text-xs leading-relaxed" style={{ color: "var(--attr-ext)" }}>
                      This approach has a direct and positive impact on internal attributes: enhancing self-esteem/belief, role awareness, and self-direction.
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        );
      })()}
    </div>
  );
}
