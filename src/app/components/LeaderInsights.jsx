'use client';

import { useState } from "react";
import { C } from "../constants/colors";
import { discFull, getDom, normBias, valLevel } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Card, StoryCard, AlertCard, SectionHead, MetricCard } from "./ui";
import { getEnvironmentTaxSummary } from "../knowledge/assessmentInsights";
import { calculateFriction } from "../utils/friction";
import { generatePreferenceSOPs, generatePassionSOPs, generateProcessSOPs } from "../utils/sop-engine";
import { generatePreferenceSOP, generatePassionSOP, generateProcessSOP } from "../knowledge/sopEngine";

export function LeaderInsights({ people, teamId, orgId, leaderId }) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("environment");

  const leader = leaderId ? people.find(p => p.id === leaderId) : null;
  const complete = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");
  const members = complete.filter(p => p.id !== leaderId && p.disc);

  if (!leader || !leader.disc) return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Leader Insights</h1>
      <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>No leader selected</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Set a leader in Settings to see your personal environment report</div>
      </div>
    </div>
  );

  const tax = getEnvironmentTaxSummary(leader);
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

  const tabStyle = (id) => ({
    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: activeTab === id ? "rgba(41,182,246,0.1)" : "transparent",
    color: activeTab === id ? "#29B6F6" : "#6B7280",
    transition: "all 0.15s",
  });

  // Team aggregate DISC
  const teamAvg = members.length > 0 ? {
    D: Math.round(members.reduce((s, p) => s + p.disc.natural.D, 0) / members.length),
    I: Math.round(members.reduce((s, p) => s + p.disc.natural.I, 0) / members.length),
    S: Math.round(members.reduce((s, p) => s + p.disc.natural.S, 0) / members.length),
    C: Math.round(members.reduce((s, p) => s + p.disc.natural.C, 0) / members.length),
  } : null;

  return (
    <div style={{ padding: isMobile ? 16 : 32, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: -0.5 }}>Leader Insights</h1>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Your personal environment report. Understand yourself before you lead others.</div>
      </div>

      {/* Leader Identity Card */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)", borderRadius: 16, padding: 24, marginBottom: 24, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>
            {leader.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{leader.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{getDom(nat)} dominant</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: tax.totalGap >= 80 ? "rgba(220,38,38,0.2)" : tax.totalGap >= 40 ? "rgba(217,119,6,0.2)" : "rgba(22,163,74,0.2)", color: tax.totalGap >= 80 ? "#FCA5A5" : tax.totalGap >= 40 ? "#FCD34D" : "#86EFAC" }}>
            {tax.totalGap} gap points
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {["D", "I", "S", "C"].map(d => (
            <div key={d} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{discFull[d]}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.disc[d] }}>{nat[d]}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Natural</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F3F4F6", borderRadius: 10, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Tab: My Environment */}
      {activeTab === "environment" && (
        <>
          {/* ── What Your Environment Needs to Look Like ──────────── */}
          {(() => {
            const prefSOP = generatePreferenceSOP(leader);
            const passSOP = generatePassionSOP(leader);
            const procSOP = generateProcessSOP(leader);
            const topVals = passSOP ? passSOP.topValues : [];
            const domLens = procSOP ? procSOP.lenses.sort((a, b) => b.score - a.score)[0] : null;

            return (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm mb-6" style={{ padding: 24 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 4 }}>What Your Environment Needs to Look Like</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 20, lineHeight: 1.6 }}>
                  A synthesis of your DISC style, top values, and 3H decision-making profile. This is what you need around you to lead at your best.
                </div>

                {/* DISC Environment */}
                {prefSOP && (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm" style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#29B6F6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Behavioral Style — {prefSOP.dominantStyle} Dominant</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 8 }}>
                      Your natural wiring says: <em>"{prefSOP.perspective}"</em>
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 8 }}>
                      <strong>Your environment needs to support:</strong> {prefSOP.approach}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                      <strong>In real time, you are scanning for:</strong> {prefSOP.realTime}
                    </div>
                    {prefSOP.sop && (
                      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>Your Operating Standard</div>
                        <div style={{ fontSize: 12, color: "#14532D", lineHeight: 1.7 }}>{prefSOP.sop}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Values / Energizers */}
                {passSOP && topVals.length > 0 && (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm" style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#FF7043", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>What Energizes You — Top Values</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 10 }}>
                      Your top motivators are <strong>{topVals.join(", ")}</strong>. When your environment honors these, you have energy. When it doesn't, you burn out — not because you're weak, but because the fuel isn't there.
                    </div>
                    {passSOP.profiles.map(p => (
                      <div key={p.dimension} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{p.icon} {p.dimension} — {p.label}</div>
                        <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6 }}>{p.definition}</div>
                        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, marginTop: 4 }}>
                          <em>"{p.perspective}"</em>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3H Decision-Making */}
                {domLens && (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm" style={{ padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7E57C2", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Decision-Making Needs — {domLens.label}</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 8 }}>
                      Your dominant decision-making lens is <strong>{domLens.label}</strong>. This means your environment needs to give you room to: <em>{domLens.definition.toLowerCase()}</em>
                    </div>
                    <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginBottom: 4 }}>
                      <strong>Talents this activates:</strong> {domLens.talents}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                      <em>"{domLens.perspective}"</em>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginTop: 10, marginBottom: 4 }}>Questions your environment should normalize:</div>
                    {domLens.sopQuestions.map((q, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#4B5563", paddingLeft: 12, marginBottom: 2 }}>• {q}</div>
                    ))}
                    {procSOP.requires.length > 0 && (
                      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "#EDE7F6", border: "1px solid #D1C4E9" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4527A0", marginBottom: 4 }}>Lenses You Require</div>
                        {procSOP.requires.map((r, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#4527A0", lineHeight: 1.6 }}>• {r.label} (score: {r.score})</div>
                        ))}
                      </div>
                    )}
                    {procSOP.dismisses.length > 0 && (
                      <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "#FFF3E0", border: "1px solid #FFE0B2" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#E65100", marginBottom: 4 }}>Lenses You May Undervalue</div>
                        {procSOP.dismisses.map((d, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#BF360C", lineHeight: 1.6 }}>• {d.label} (score: {d.score}) — this is a blind spot your environment needs to compensate for</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <Card>
            <SectionHead title="Preference Tax" sub="The daily cost of adapting your natural style to your environment" badge={tax.totalGap >= 80 ? "High" : tax.totalGap >= 40 ? "Moderate" : "Low"} badgeColor={tax.totalGap >= 80 ? "#991B1B" : tax.totalGap >= 40 ? "#C2410C" : "#15803D"} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <MetricCard value={tax.totalGap} label="Total Gap Points" sub="across 4 DISC dimensions" accent={tax.totalGap >= 80 ? "#991B1B" : "#C2410C"} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["D", "I", "S", "C"].map(d => {
                const gap = adp[d] - nat[d];
                const direction = gap > 0 ? "Amplifying" : gap < 0 ? "Suppressing" : "Aligned";
                const dirColor = gap > 0 ? "#D97706" : gap < 0 ? "#DC2626" : "#16A34A";
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: C.disc[d], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151", width: 100 }}>{discFull[d]}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", width: 40 }}>{gap > 0 ? "+" : ""}{gap}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: `${dirColor}15`, color: dirColor, fontWeight: 600 }}>{direction}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionHead title="Natural vs. Adaptive" sub="Who you are vs. who your environment asks you to be" />
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>
              Your Natural style is who you are. Your Adaptive style is who your environment is asking you to be. The gap between them is your daily cost. That cost shows up as fatigue, frustration, and friction with people who don't understand why you're stretched.
            </div>
            {["D", "I", "S", "C"].map(d => {
              const n = nat[d];
              const a = adp[d];
              return (
                <div key={d} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.disc[d] }}>{discFull[d]}</span>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Natural: {n} → Adaptive: {a}</span>
                  </div>
                  <div style={{ position: "relative", height: 12, background: "#F3F4F6", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${n}%`, background: C.disc[d], opacity: 0.3, borderRadius: 6 }} />
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${a}%`, background: C.disc[d], borderRadius: 6 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Solid = Adaptive (what you show). Faded = Natural (who you are).</div>
          </Card>
        </>
      )}

      {/* Tab: My Values */}
      {activeTab === "values" && (
        <Card>
          <SectionHead title="Values Profile" sub="What drives you at a deep level" />
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>
            Your top motivators are the dimensions your environment must honor. When they're not honored, you burn out. Not because you're weak. Because the thing that fuels you isn't being fed.
          </div>
          {Object.entries(leader.values).sort(([, a], [, b]) => b - a).map(([key, score]) => {
            const vl = valLevel(score);
            const isTop = score >= 55;
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{key}</span>
                    {isTop && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 8, background: "#FEF3C7", color: "#92400E" }}>Top Motivator</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: vl.c }}>{score}</span>
                </div>
                <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${score}%`, background: isTop ? (C.values[key] || "#29B6F6") : "#D1D5DB", borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
          <AlertCard severity="info" title="Passion Signal, not verdict">
            Whether your environment is honoring your top motivators is a question only you can answer. These scores tell you what drives you. They don't tell you whether those drivers are being met.
          </AlertCard>
        </Card>
      )}

      {/* Tab: My Attributes */}
      {activeTab === "attributes" && (
        <>
          <Card>
            <SectionHead title="External Attributes" sub="How you see the world" />
            {leader.attr.ext.map(a => {
              const b = normBias(a.bias);
              const biasColor = b === "+" ? "#16A34A" : b === "\u2212" ? "#DC2626" : "#6B7280";
              const biasWord = b === "+" ? "Amplified" : b === "\u2212" ? "Frustrated" : "Balanced";
              return (
                <div key={a.name} style={{ background: "#F9FAFB", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{a.label} ({a.name})</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{a.score}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: `${biasColor}15`, color: biasColor }}>{b} {biasWord}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <SectionHead title="Internal Attributes" sub="How you see yourself" />
            {leader.attr.int.map(a => {
              const b = normBias(a.bias);
              const biasColor = b === "+" ? "#16A34A" : b === "\u2212" ? "#DC2626" : "#6B7280";
              const biasWord = b === "+" ? "Amplified" : b === "\u2212" ? "Frustrated" : "Balanced";
              return (
                <div key={a.name} style={{ background: "#F9FAFB", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{a.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{a.score}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: `${biasColor}15`, color: biasColor }}>{b} {biasWord}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <AlertCard severity="info" title="Process Signal, not verdict">
              Your Attributes scores are signals worth investigating. A Frustrated bias doesn't mean something is broken. It means this dimension may be underused or constrained by your environment.
            </AlertCard>
          </Card>
        </>
      )}

      {/* Tab: Leadership Gap */}
      {activeTab === "gap" && (
        <>
          <Card>
            <SectionHead title="Your Environment vs. What Your Team Needs" sub="The gap where leadership friction lives" />
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>
              Every person on your team has a version of "the right way" shaped by everything they experienced before they walked through your door. Your job is to understand that version, not fight it. This gap shows where your natural operating style creates cost for the people you lead.
            </div>
            {teamAvg && ["D", "I", "S", "C"].map(d => {
              const leaderScore = nat[d];
              const teamScore = teamAvg[d];
              const gap = Math.abs(leaderScore - teamScore);
              const gapColor = gap >= 40 ? "#DC2626" : gap >= 20 ? "#D97706" : "#16A34A";
              const gapLabel = gap >= 40 ? "High Gap" : gap >= 20 ? "Moderate" : "Aligned";
              return (
                <div key={d} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{discFull[d]}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Gap: <strong>{gap}</strong></span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: `${gapColor}15`, color: gapColor }}>{gapLabel}</span>
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 16, background: "#F3F4F6", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${teamScore}%`, background: C.disc[d], opacity: 0.3, borderRadius: 8 }} />
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${leaderScore}%`, background: C.disc[d], borderRadius: 8 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                    <span>You: {leaderScore}</span>
                    <span>Team avg: {teamScore}</span>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <SectionHead title="Friction with Each Team Member" sub="Your behavioral distance from each person" />
            {members.map(m => {
              const friction = calculateFriction(leader, m);
              const prefColor = friction.totalScore >= 80 ? "#DC2626" : friction.totalScore >= 50 ? "#D97706" : "#16A34A";
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F5F5F5" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, background: C.disc[getDom(m.disc.natural).charAt(0)] || C.muted }}>
                    {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{m.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: prefColor }}>{friction.totalScore} pts</div>
                    <div style={{ fontSize: 10, color: prefColor }}>{friction.tier}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {/* Tab: LWYL Framework */}
      {activeTab === "framework" && (
        <Card>
          <SectionHead title="Love Where You Lead" sub="The framework for leading without losing yourself" />
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 20 }}>
            Every person on your team has a version of "the right way" shaped by everything they experienced before they walked through your door. Your job as a leader is to understand that version, not fight it.
          </div>
          {[
            { step: "1", title: "Know Yourself First", desc: "Your Environment Report shows you the cost you're already paying. You can't lead others well if you're running on empty.", done: true },
            { step: "2", title: "Understand Your Team", desc: "Each person's DISC, Values, and Attributes profile tells you what they need to do their best work. That's not a luxury. It's your job.", done: true },
            { step: "3", title: "Name the Friction", desc: "The Friction Map shows you where the gaps are. Naming them is not blame. It's the first step to bridging them.", done: true },
            { step: "4", title: "Build the Bridge", desc: "Connection Agreements are documented commitments to reduce friction. They turn insight into action.", done: false },
            { step: "5", title: "Guided Reflections", desc: "Confirm or challenge what the signals suggest. This is where Passion and Process signals become confirmed data.", coming: true },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 12, padding: 14, background: "#F9FAFB", borderRadius: 10, marginBottom: 8, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: s.done ? "#29B6F6" : s.coming ? "#E5E7EB" : "#FFC107",
                color: s.done ? "#fff" : s.coming ? "#9CA3AF" : "#fff",
              }}>
                {s.step}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.title}</span>
                  {s.coming && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 8px", borderRadius: 8, background: "#F3F4F6", color: "#9CA3AF" }}>Coming Soon</span>}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Tab: My SOPs ─────────────────────────────────────── */}
      {activeTab === "sops" && (() => {
        const prefSOPs = generatePreferenceSOPs(complete);
        const passSOPs = generatePassionSOPs(complete);
        const procSOPs = generateProcessSOPs(complete);
        const leaderPref = prefSOPs.find(s => s.personId === leaderId);
        const leaderPass = passSOPs.find(s => s.personId === leaderId);
        const leaderProc = procSOPs.find(s => s.personId === leaderId);

        return (
          <>
            <SectionHead title="Your Standard Operating Procedures" sub="Derived from your assessment data using the 3 P's framework" />

            {/* Preference SOP */}
            {leaderPref && (
              <Card>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#29B6F6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Preference SOP — {leaderPref.style}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{leaderPref.coreQuestion}</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 12 }}>"{leaderPref.perspective}"</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}><strong>Decision Approach:</strong> {leaderPref.decisionApproach}</div>
                {leaderPref.sop && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>Your SOP</div>
                    <div style={{ fontSize: 12, color: "#14532D", lineHeight: 1.7 }}>{leaderPref.sop}</div>
                  </div>
                )}
                <AlertCard severity="warning" title="Cautionary Note">{leaderPref.caution}</AlertCard>
              </Card>
            )}

            {/* Passion SOPs */}
            {leaderPass && leaderPass.bridges.length > 0 && (
              <Card>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#FF7043", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Passion SOPs — Engagement Bridge</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Your top motivators: {leaderPass.topMotivators.join(", ")}</div>
                {leaderPass.bridges.map((b, i) => (
                  <StoryCard key={i} accent="#FF7043" title={`${b.dimension}: ${b.definition}`}>
                    <div style={{ marginBottom: 8 }}>"{b.perspective}"</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginTop: 8, marginBottom: 4 }}>What matters:</div>
                    {b.whatMatters.map((w, j) => (
                      <div key={j} style={{ fontSize: 12, color: "#4B5563", paddingLeft: 12, marginBottom: 2 }}>• {w}</div>
                    ))}
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginTop: 8, marginBottom: 4 }}>Initiatives you would love to lead:</div>
                    {b.initiatives.map((init, j) => (
                      <div key={j} style={{ fontSize: 12, color: "#4B5563", paddingLeft: 12, marginBottom: 2 }}>• {init}</div>
                    ))}
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", marginTop: 8, marginBottom: 4 }}>Things that irk you:</div>
                    {b.thingsThatIrk.map((irk, j) => (
                      <div key={j} style={{ fontSize: 12, color: "#7F1D1D", paddingLeft: 12, marginBottom: 2 }}>• {irk}</div>
                    ))}
                  </StoryCard>
                ))}
              </Card>
            )}

            {/* Process SOP */}
            {leaderProc && (
              <Card>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7E57C2", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Process SOP — 3H Role: {leaderProc.dominantLens}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{leaderProc.definition}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}><strong>Talents:</strong> {leaderProc.talents}</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 12 }}>"{leaderProc.perspective}"</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Practical Application:</div>
                {leaderProc.practicalApplication.map((pa, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#4B5563", paddingLeft: 12, marginBottom: 2 }}>• {pa}</div>
                ))}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginTop: 12, marginBottom: 4 }}>SOP Questions to ask before decisions:</div>
                {leaderProc.sopQuestions.map((q, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#4B5563", paddingLeft: 12, marginBottom: 2 }}>• {q}</div>
                ))}
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "#EDE7F6", border: "1px solid #D1C4E9", marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#4527A0", lineHeight: 1.7 }}>
                    This approach has a direct and positive impact on internal attributes: enhancing self-esteem/belief, role awareness, and self-direction.
                  </div>
                </div>
              </Card>
            )}
          </>
        );
      })()}
    </div>
  );
}
