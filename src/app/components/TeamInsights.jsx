'use client';

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { C } from "../constants/colors";
import { discFull, getDom, normBias } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Btn } from "./Btn";
import { Sec } from "./Sec";
import { FrictionMap } from "./FrictionMap";
import { VoiceJournal } from "./VoiceJournal";
import { TeamSummary } from "./TeamSummary";
import { LeaderComparison } from "./LeaderComparison";
import { Card, StoryCard, AlertCard, SectionHead, MetricCard, Expandable } from "./ui";
import { getEnvironmentTaxSummary, compoundPatterns, discInsights } from "../knowledge/assessmentInsights";

export function TeamInsights({ people, teamId, orgId, leaderId, userId, photos = {}, onUploadPhoto, onViewProfile, onCompare, onShowTips }) {
  const isMobile = useIsMobile();
  const [showSummary, setShowSummary] = useState(false);
  const [showFrictionMap, setShowFrictionMap] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const complete = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");
  const pending = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status === "pending");
  const total = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true)).length;
  const leader = leaderId ? people.find(p => p.id === leaderId) : null;

  // ── DISC Distribution ──
  const discStyleDescs = {
    D: "driven by results, speed, and directness. They need autonomy, challenges, and quick decisions.",
    I: "energized by people, enthusiasm, and collaboration. They need recognition, social interaction, and optimism.",
    S: "anchored by consistency, support, and stability. They need clear expectations, patience, and a steady environment.",
    C: "focused on accuracy, quality, and process. They need clarity, data, and time to analyze."
  };
  const styleCounts = {};
  const dimCounts = { D: 0, I: 0, S: 0, C: 0 };
  complete.forEach(p => {
    const dom = getDom(p.disc.natural);
    styleCounts[dom] = (styleCounts[dom] || 0) + 1;
    dom.split("/").forEach(d => { if (dimCounts[d] !== undefined) dimCounts[d]++; });
  });

  // ── Values Distribution ──
  const valDescs = {
    Aesthetic: "harmony, balance, beauty, and creative expression",
    Economic: "ROI, efficiency, and practical return on investment",
    Individualistic: "independence, uniqueness, and standing out",
    Political: "control, influence, and leadership position",
    Altruistic: "service, purpose, and helping others",
    Regulatory: "order, structure, rules, and tradition",
    Theoretical: "knowledge, learning, and understanding for its own sake"
  };
  const valCounts = {};
  Object.keys(C.values).forEach(v => { valCounts[v] = 0; });
  complete.forEach(p => {
    Object.entries(p.values).forEach(([v, score]) => { if (score >= 60) valCounts[v]++; });
  });
  const valData = Object.entries(valCounts)
    .map(([name, count]) => ({ name, count, color: C.values[name] }))
    .sort((a, b) => b.count - a.count);

  if (complete.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>No complete assessments in this team yet</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Upload assessments to see team insights</div>
    </div>
  );

  return (
    <div>
      {showSummary && (
        <TeamSummary people={people} teamId={teamId} orgId={orgId} leader={leader} onClose={() => setShowSummary(false)} photos={photos} onUploadPhoto={onUploadPhoto} onViewProfile={onViewProfile} onCompare={onCompare} onShowTips={onShowTips} />
      )}
      {showFrictionMap && (
        <FrictionMap people={people} teamId={teamId} orgId={orgId} onClose={() => setShowFrictionMap(false)} />
      )}
      {showJournal && (
        <VoiceJournal userId={userId} people={people} teamId={teamId} orgId={orgId} onClose={() => setShowJournal(false)} />
      )}
      <div style={{ marginBottom: 20, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-start", justifyContent: "space-between", gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: -0.5 }}>Team Insights</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{complete.length} of {total} members with complete assessments</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={() => setShowJournal(true)} style={{ fontSize: 11 }}>🎙️ Journal</Btn>
          {complete.length > 0 && (
            <Btn onClick={() => setShowSummary(true)} style={{ fontSize: 11 }}>📋 Summary</Btn>
          )}
        </div>
      </div>

      {/* Completion Tracker */}
      {total > 0 && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Assessment Completion</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: complete.length === total ? C.green : C.muted }}>{complete.length}/{total} complete</div>
          </div>
          <div style={{ height: 6, background: C.hi, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", width: `${(complete.length / total) * 100}%`, background: complete.length === total ? C.green : C.blue, borderRadius: 3, transition: "width 0.3s" }} />
          </div>
          {pending.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {pending.map(p => (
                <span key={p.id} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#F5F5F5", color: C.muted, border: `1px solid ${C.border}` }}>⏳ {p.name}</span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Leader Comparison */}
      {leader && leader.status !== "pending" && leader.disc && (
        <LeaderComparison leader={leader} team={people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true))} />
      )}

      {/* ══════ TEAM ENVIRONMENT HEALTH (Story-First) ══════ */}
      {complete.length >= 2 && (() => {
        const memberTax = complete.map(p => {
          const tax = getEnvironmentTaxSummary(p);
          const totalGap = tax.totalGap;
          return { ...p, totalGap, tax };
        }).sort((a, b) => b.totalGap - a.totalGap);

        const avgGap = Math.round(memberTax.reduce((s, m) => s + m.totalGap, 0) / memberTax.length);
        const atRisk = memberTax.filter(m => m.totalGap >= 80);
        const frustPT = memberTax.filter(m => m.tax.hasFrustratedPT);
        const teamLabel = avgGap >= 120 ? "Critical" : avgGap >= 80 ? "Heavy" : avgGap >= 50 ? "Elevated" : avgGap >= 25 ? "Moderate" : "Healthy";
        const teamColor = avgGap >= 120 ? "#7F1D1D" : avgGap >= 80 ? "#991B1B" : avgGap >= 50 ? "#C2410C" : avgGap >= 25 ? "#D97706" : "#15803D";

        // Aggregate bias patterns
        const extBiasAgg = { Heart: { "+": 0, "−": 0, "=": 0 }, Hand: { "+": 0, "−": 0, "=": 0 }, Head: { "+": 0, "−": 0, "=": 0 } };
        complete.forEach(p => {
          p.attr.ext.forEach(a => {
            const b = normBias(a.bias);
            if (extBiasAgg[a.label]?.[b] !== undefined) extBiasAgg[a.label][b]++;
          });
        });
        const blindSpots = Object.entries(extBiasAgg)
          .filter(([, biases]) => biases["−"] >= Math.ceil(complete.length * 0.4))
          .map(([label, biases]) => ({ label, count: biases["−"], pct: Math.round((biases["−"] / complete.length) * 100) }));

        // Team compound patterns
        const teamCompounds = {};
        complete.forEach(p => {
          const tax = getEnvironmentTaxSummary(p);
          tax.activeCompounds.forEach(cp => {
            if (!teamCompounds[cp.id]) teamCompounds[cp.id] = { ...cp, members: [] };
            teamCompounds[cp.id].members.push(p.name.split(" ")[0]);
          });
        });
        const activeCompounds = Object.values(teamCompounds);

        // Build narrative for each at-risk person
        const getPersonNarrative = (m) => {
          const name = m.name.split(" ")[0];
          const costlyGaps = m.tax.costlyGaps;
          if (costlyGaps.length === 0) return `${name} is carrying ${m.totalGap} gap points of adaptation cost.`;
          const topGap = costlyGaps[0];
          const direction = topGap.gap > 0 ? "amplifying" : "suppressing";
          const dimName = discFull[topGap.dim];
          return `${name} is ${direction} their ${dimName} by ${Math.abs(topGap.gap)} points every day. That's their biggest adaptation cost. Their environment is asking them to show up differently than they're wired to.`;
        };

        return (
          <Card>
            <SectionHead title="Team Environment Health" sub={`How much your team is adapting to fit their environment`} badge={teamLabel} badgeColor={teamColor} />

            {/* Summary metrics */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <MetricCard value={avgGap} label="Avg Preference Tax" sub="gap points across team" accent={teamColor} />
              <MetricCard value={atRisk.length} label="People at risk" sub="80+ gap points" accent={atRisk.length > 0 ? "#C2410C" : "#15803D"} />
              <MetricCard value={frustPT.length} label="Damage signals" sub="frustrated PT bias" accent={frustPT.length > 0 ? "#991B1B" : "#15803D"} />
            </div>

            {/* Frustrated PT - environment damage */}
            {frustPT.length > 0 && (
              <AlertCard severity="critical" title="Environment damage detected">
                {frustPT.map((m, i) => {
                  const name = m.name.split(" ")[0];
                  return <div key={m.id} style={{ marginBottom: i < frustPT.length - 1 ? 8 : 0 }}>
                    <strong>{name}</strong> has a Frustrated Practical Thinking bias. Their environment has taught them that getting practical results doesn't matter. That's the single strongest damage signal in the entire assessment. It's worth a direct conversation.
                  </div>;
                })}
              </AlertCard>
            )}

            {/* At-risk members - per person story cards */}
            {atRisk.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10, marginTop: 4 }}>People carrying the highest cost</div>
                {atRisk.slice(0, 5).map(m => (
                  <StoryCard key={m.id} accent={m.totalGap >= 120 ? "#991B1B" : "#C2410C"} title={`${m.name.split(" ")[0]} · ${m.totalGap} gap points`}>
                    {getPersonNarrative(m)}
                    {m.tax.hasFrustratedPT && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: "#991B1B" }}>Frustrated PT bias detected. Environment damage signal.</div>}
                    {m.tax.activeCompounds.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: C.muted }}>
                        Active patterns: {m.tax.activeCompounds.map(c => c.name).join(", ")}
                      </div>
                    )}
                  </StoryCard>
                ))}
              </>
            )}

            {/* Blind spots */}
            {blindSpots.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10, marginTop: 16 }}>Team process blind spots</div>
                {blindSpots.map(bs => {
                  const blindSpotStory = {
                    Heart: `${bs.pct}% of your team undervalues empathy. Decisions are landing on people without anyone checking the emotional temperature first. You might not see the relational damage until someone leaves.`,
                    Hand: `${bs.pct}% of your team undervalues practical execution. Ideas and analysis are running ahead of results. The gap between what gets decided and what actually gets done is probably wider than you think.`,
                    Head: `${bs.pct}% of your team undervalues systems thinking. Decisions are happening on instinct or relationships without structural analysis. Patterns get missed. Consequences show up late.`
                  };
                  return (
                    <AlertCard key={bs.label} severity="warning" title={`${bs.label}: ${bs.pct}% of team undervaluing`}>
                      {blindSpotStory[bs.label]}
                    </AlertCard>
                  );
                })}
              </>
            )}

            {/* Compound Patterns - with full descriptions */}
            {activeCompounds.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10, marginTop: 16 }}>Compound patterns on this team</div>
                {activeCompounds.map(cp => {
                  // Find the full pattern data from compoundPatterns
                  const patternKey = Object.keys(compoundPatterns).find(k => compoundPatterns[k].id === cp.id);
                  const fullPattern = patternKey ? compoundPatterns[patternKey] : null;

                  return (
                    <StoryCard key={cp.id} accent="#9A7A42" title={`${cp.name}: ${cp.members.join(", ")}`}>
                      {fullPattern ? (
                        <>
                          <div style={{ marginBottom: 8 }}>{fullPattern.description}</div>
                          <Expandable label="Strength" color="#15803D">
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>{fullPattern.strength}</div>
                          </Expandable>
                          <Expandable label="When it goes wrong" color="#991B1B">
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>{fullPattern.toxicPattern}</div>
                          </Expandable>
                          <Expandable label="What to watch for" color="#C2410C">
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>{fullPattern.recommendation}</div>
                          </Expandable>
                        </>
                      ) : (
                        <div>{cp.members.join(", ")} {cp.members.length === 1 ? "shows" : "show"} this cross-dimensional pattern.</div>
                      )}
                    </StoryCard>
                  );
                })}
              </>
            )}
          </Card>
        );
      })()}

      {/* DISC Distribution */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>THE TEAM YOU LEAD</div>
          <div style={{ fontSize: 13, color: C.muted }}>Natural DISC style distribution · {complete.length} assessed members</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 12 : 32 }}>
          {["D", "I", "S", "C"].map(d => {
            const count = dimCounts[d];
            const pct = complete.length > 0 ? Math.round((count / complete.length) * 100) : 0;
            return (
              <div key={d} style={{ background: C.card, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: `4px solid ${C.disc[d]}` }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.disc[d], lineHeight: 1, marginBottom: 8 }}>{d}</div>
                <div style={{ fontSize: 56, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 4 }}>{count}</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>{pct}%</div>
                <div style={{ height: 6, background: C.hi, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: C.disc[d], borderRadius: 4, transition: "width 0.6s ease-out" }} />
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.4 }}>
                  {count > 0
                    ? `${count} ${count === 1 ? "person is" : "people are"} ${discStyleDescs[d]}`
                    : `No ${discFull[d]}-dominant members.`}
                </div>
                {count === 0 && complete.length >= 3 && (
                  <div style={{ fontSize: 10, color: "#C2410C", marginTop: 6, lineHeight: 1.4 }}>
                    {d === "D" && "No one is naturally driving decisions. The team may struggle with decisiveness."}
                    {d === "I" && "No one is naturally building energy and connection. The team may lack relational glue."}
                    {d === "S" && "No one is naturally providing stability. The team may move fast but miss the consistency that builds trust."}
                    {d === "C" && "No one is naturally catching details. The team may move fast but miss what matters in the fine print."}
                  </div>
                )}
                {count > Math.ceil(complete.length * 0.5) && complete.length >= 3 && (
                  <div style={{ fontSize: 10, color: "#1565C0", marginTop: 6, lineHeight: 1.4 }}>
                    {d === "D" && "Heavy D concentration. This team can drive results but may struggle with patience and follow-through."}
                    {d === "I" && "Heavy I concentration. This team can inspire but may struggle with accountability and finishing."}
                    {d === "S" && "Heavy S concentration. This team is stable but may resist necessary change."}
                    {d === "C" && "Heavy C concentration. This team is precise but may over-analyze and move too slowly."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Values Distribution */}
      <Card>
        <Sec title="Team Values Distribution" sub="Motivational drivers across your team" color={C.values.Altruistic} />
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Values scoring 60+ count as a Top Driver</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={valData} layout="vertical" barSize={24} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
            <XAxis type="number" domain={[0, complete.length]} allowDecimals={false} tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={isMobile ? 70 : 100} tick={{ fontSize: isMobile ? 9 : 10, fontWeight: 600, fill: C.text }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [`${value} of ${complete.length} people`, "Top Driver"]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>{valData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {valData.filter(v => v.count > 0).slice(0, 3).map(v => (
            <div key={v.name} style={{ flex: "1 1 200px", padding: "8px 10px", borderRadius: 7, background: C.hi, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: v.color, marginBottom: 3 }}>{v.name} - {v.count} of {complete.length} people</div>
              <div style={{ fontSize: 10, color: C.muted }}>This team is motivated by {valDescs[v.name]}.</div>
            </div>
          ))}
          {valData.filter(v => v.count === 0).length >= 4 && complete.length >= 3 && (
            <AlertCard severity="warning" title="Motivational gap">
              {valData.filter(v => v.count === 0).length} of 7 values have zero top drivers on this team. People driven by {valData.filter(v => v.count === 0).slice(0, 2).map(v => v.name).join(" or ")} may feel like they don't belong here.
            </AlertCard>
          )}
        </div>
      </Card>

      {/* KRI Dashboard */}
      {complete.length >= 2 && (() => {
        const intNames = ["Self-Esteem", "Role Awareness", "Self-Direction"];
        const kriColors = { green: "#15803D", yellow: "#C2410C", red: "#991B1B" };
        const kriBg = { green: "#F0FDF4", yellow: "#FFF7ED", red: "#FEF2F2" };
        const kriBorder = { green: "#BBF7D0", yellow: "#FED7AA", red: "#FECACA" };

        const kriData = intNames.map(name => {
          const rows = complete.map(p => {
            const a = p.attr.int.find(a => a.name === name);
            return a ? { score: a.score, bias: normBias(a.bias) } : null;
          }).filter(Boolean);

          const avgScore = rows.length > 0 ? Math.round((rows.reduce((s, r) => s + r.score, 0) / rows.length) * 10) / 10 : 0;
          const minusBias = rows.filter(r => r.bias === "\u2212").length;
          const plusBias  = rows.filter(r => r.bias === "+").length;
          const equalBias = rows.filter(r => r.bias === "=").length;
          const minusPct = rows.length > 0 ? Math.round((minusBias / rows.length) * 100) : 0;

          const risk = (minusPct >= 60 || avgScore < 6.0) ? "red"
                     : (minusPct >= 40 || avgScore < 7.0) ? "yellow"
                     : "green";

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

          return { name, avgScore, minusBias, plusBias, equalBias, minusPct, risk, total: rows.length, desc: descriptions[name][risk] };
        });

        const overallRisk = kriData.some(k => k.risk === "red") ? "red"
                          : kriData.some(k => k.risk === "yellow") ? "yellow" : "green";
        const riskLabel = { red: "Elevated", yellow: "Watch", green: "Healthy" };

        return (
          <Card>
            <SectionHead title="Key Retention Indicators" sub={`Internal attributes across ${complete.length} team members`} badge={`${riskLabel[overallRisk]} Risk`} badgeColor={kriColors[overallRisk]} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {kriData.map(k => (
                <div key={k.name} style={{ background: kriBg[k.risk], border: `1px solid ${kriBorder[k.risk]}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{k.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>Avg: <strong style={{ color: kriColors[k.risk] }}>{k.avgScore}</strong> / 10</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: kriColors[k.risk], background: "#fff", padding: "2px 10px", borderRadius: 8 }}>{riskLabel[k.risk].toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Bias distribution bar */}
                  <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                    {k.plusBias > 0 && <div style={{ flex: k.plusBias, background: "#15803D" }} title={`${k.plusBias} Requires (+)`} />}
                    {k.equalBias > 0 && <div style={{ flex: k.equalBias, background: "#1D4ED8" }} title={`${k.equalBias} Balanced (=)`} />}
                    {k.minusBias > 0 && <div style={{ flex: k.minusBias, background: "#991B1B" }} title={`${k.minusBias} Undervalues (-)`} />}
                  </div>

                  <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 11, color: C.muted }}>
                    <span style={{ color: "#15803D", fontWeight: 600 }}>{k.plusBias} Requires (+)</span>
                    <span style={{ color: "#1D4ED8", fontWeight: 600 }}>{k.equalBias} Balanced (=)</span>
                    <span style={{ color: "#991B1B", fontWeight: 600 }}>{k.minusBias} Undervalues (-)</span>
                  </div>

                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{k.desc}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

    </div>
  );
}
