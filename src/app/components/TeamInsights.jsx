'use client';

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { discFull, getDom, normBias } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Btn } from "./Btn";
import { Sec } from "./Sec";
import { FrictionMap } from "./FrictionMap";
import { VoiceJournal } from "./VoiceJournal";
import { TeamSummary } from "./TeamSummary";
import { LeaderComparison } from "./LeaderComparison";
import { SectionHeader } from "./ui/SectionHeader";
import { InsightCard } from "./ui/InsightCard";
import { WalkInTheirShoes } from "./WalkInTheirShoes";
import { PersonChip } from "./ui/PersonChip";
import { StatBlock } from "./ui/StatBlock";
import { GapBar } from "./ui/GapBar";
import { AlertCard } from "./ui/AlertCard";
import { Card } from "./ui/Card";
import { ActionLink } from "./ui/ActionLink";
import { Expandable } from "./ui/Expandable";
import { motion } from "framer-motion";
import { getEnvironmentTaxSummary, compoundPatterns, discInsights } from "../knowledge/assessmentInsights";
import { getTeamCompositionNarrative } from "../knowledge/narrativeEngine";

export function TeamInsights({ people, teamId, orgId, leaderId, userId, photos = {}, onUploadPhoto, onViewProfile, onCompare, onShowTips }) {
  const isMobile = useIsMobile();
  const [showSummary, setShowSummary] = useState(false);
  const [showFrictionMap, setShowFrictionMap] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const complete = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");
  const pending = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status === "pending");
  const total = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true)).length;
  const leader = leaderId ? people.find(p => p.id === leaderId) : null;

  // DISC Distribution
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

  // Values Distribution
  const valDescs = {
    Aesthetic: "harmony, balance, beauty, and creative expression",
    Economic: "ROI, efficiency, and practical return on investment",
    Individualistic: "independence, uniqueness, and standing out",
    Political: "control, influence, and leadership position",
    Altruistic: "service, purpose, and helping others",
    Regulatory: "order, structure, rules, and tradition",
    Theoretical: "knowledge, learning, and understanding for its own sake"
  };
  const valColors = {
    Aesthetic: "var(--values-aesthetic)", Economic: "var(--values-economic)",
    Individualistic: "var(--values-individualistic)", Political: "var(--values-political)",
    Altruistic: "var(--values-altruistic)", Regulatory: "var(--values-regulatory)",
    Theoretical: "var(--values-theoretical)"
  };
  const valCounts = {};
  ["Aesthetic", "Economic", "Individualistic", "Political", "Altruistic", "Regulatory", "Theoretical"].forEach(v => { valCounts[v] = 0; });
  complete.forEach(p => {
    Object.entries(p.values).forEach(([v, score]) => { if (score >= 60) valCounts[v]++; });
  });
  const valData = Object.entries(valCounts)
    .map(([name, count]) => ({ name, count, color: valColors[name] }))
    .sort((a, b) => b.count - a.count);

  if (complete.length === 0) return (
    <div className="text-center py-16 text-muted">
      <p className="text-sm font-semibold">No complete assessments in this team yet</p>
      <p className="text-xs mt-1">Once your team completes their assessments, you will see each person's adaptation cost, the patterns that connect them, and exactly where your attention will have the most impact.</p>
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

      <div className={`mb-5 flex ${isMobile ? 'flex-col gap-3' : 'flex-row items-start justify-between'}`}>
        <SectionHeader
          title="Team Insights"
          subtitle={`${complete.length} of ${total} members with complete assessments`}
          count={`${complete.length} assessed`}
        />
        <div className="flex gap-2 flex-wrap">
          <Btn onClick={() => setShowJournal(true)} style={{ fontSize: 11 }}>Journal</Btn>
          {complete.length > 0 && (
            <Btn onClick={() => setShowSummary(true)} style={{ fontSize: 11 }}>Summary</Btn>
          )}
        </div>
      </div>

      {/* Completion Tracker */}
      {total > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">Assessment Completion</span>
            <span className={`text-xs font-bold ${complete.length === total ? 'text-friction-low' : 'text-muted'}`}>{complete.length}/{total} complete</span>
          </div>
          <div className="h-1.5 bg-subtle rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${complete.length === total ? 'bg-friction-low' : 'bg-disc-c'}`}
              style={{ width: `${(complete.length / total) * 100}%` }}
            />
          </div>
          {pending.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {pending.map(p => (
                <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full bg-subtle text-muted border border-border">{p.name}</span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Leader Comparison */}
      {leader && leader.status !== "pending" && leader.disc && (
        <LeaderComparison leader={leader} team={people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true))} />
      )}

      {/* ══════ TEAM ENVIRONMENT HEALTH ══════ */}
      {complete.length >= 2 && (() => {
        const memberTax = complete.map(p => {
          const tax = getEnvironmentTaxSummary(p);
          const totalGap = tax.totalGap;
          return { ...p, totalGap, tax };
        }).sort((a, b) => b.totalGap - a.totalGap);

        const avgGap = Math.round(memberTax.reduce((s, m) => s + m.totalGap, 0) / memberTax.length);
        const atRisk = memberTax.filter(m => m.totalGap >= 80);
        const frustPT = memberTax.filter(m => m.tax.hasFrustratedPT);

        // Aggregate bias patterns
        const extBiasAgg = { Heart: { "+": 0, "\u2212": 0, "=": 0 }, Hand: { "+": 0, "\u2212": 0, "=": 0 }, Head: { "+": 0, "\u2212": 0, "=": 0 } };
        complete.forEach(p => {
          p.attr.ext.forEach(a => {
            const b = normBias(a.bias);
            if (extBiasAgg[a.label]?.[b] !== undefined) extBiasAgg[a.label][b]++;
          });
        });
        const blindSpots = Object.entries(extBiasAgg)
          .filter(([, biases]) => biases["\u2212"] >= Math.ceil(complete.length * 0.4))
          .map(([label, biases]) => ({ label, count: biases["\u2212"], pct: Math.round((biases["\u2212"] / complete.length) * 100) }));

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

        return (
          <Card>
            <SectionHeader title="Team Environment Health" subtitle="How much your team is adapting to fit their environment" />

            {/* Summary stats */}
            <div className="flex gap-3 flex-wrap mb-6">
              <StatBlock
                value={avgGap}
                label="Avg Gap Points"
                sublabel="average daily adaptation cost across your team"
                accentColor="friction-moderate"
                enterDelay={0}
              />
              <StatBlock
                value={atRisk.length}
                label="People at Risk"
                sublabel="carrying 80+ gap points"
                accentColor={atRisk.length > 0 ? "friction-high" : "friction-low"}
                enterDelay={100}
              />
              <StatBlock
                value={frustPT.length}
                label="Damage Signals"
                sublabel="frustrated PT bias detected"
                accentColor={frustPT.length > 0 ? "friction-high" : "friction-low"}
                enterDelay={200}
              />
            </div>

            {/* Frustrated PT -- name the pattern ONCE, then show who */}
            {frustPT.length > 0 && (
              <div className="mb-5">
                <AlertCard severity="critical" title="Environment damage detected">
                  <p className="leading-relaxed mb-3">
                    {frustPT.length} of your {complete.length} team members share a Frustrated Practical Thinking bias -- meaning your environment is consistently asking people to suppress what they trust most. That is a structural signal, not a coincidence.
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {frustPT.map(m => (
                      <PersonChip key={m.id} name={m.name} disc={getDom(m.disc.natural)} size="sm" />
                    ))}
                  </div>
                </AlertCard>
              </div>
            )}

            {/* At-risk members -- GapBar leads each card */}
            {atRisk.length > 0 && (
              <div className="mb-5">
                <div className="text-sm font-bold text-foreground mb-3">People carrying the highest cost</div>
                {atRisk.slice(0, 5).map((m, i) => {
                  const name = m.name.split(" ")[0];
                  const dom = getDom(m.disc.natural);
                  const costlyGaps = m.tax.costlyGaps;
                  const topGap = costlyGaps[0];
                  const direction = topGap ? (topGap.gap > 0 ? "amplifying" : "suppressing") : "";
                  const dimName = topGap ? discFull[topGap.dim] : "";

                  return (
                    <InsightCard key={m.id} variant="priority" enterDelay={i * 80}>
                      {/* Person + gap total */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <PersonChip name={m.name} disc={dom} size="sm" />
                          <span className="text-sm font-bold text-foreground">{name}</span>
                        </div>
                        <span className="text-xs font-bold text-friction-high">{m.totalGap} gap points</span>
                      </div>

                      {/* GapBar -- the visual anchor */}
                      {topGap && (
                        <div className="mb-3">
                          <GapBar
                            value={topGap.absGap}
                            dimension={topGap.dim}
                            label={`${dimName} ${direction} by ${topGap.absGap} points`}
                          />
                        </div>
                      )}

                      {/* Additional costly gaps */}
                      {costlyGaps.length > 1 && (
                        <div className="flex flex-col gap-2 mb-3">
                          {costlyGaps.slice(1).map(g => (
                            <GapBar
                              key={g.dim}
                              value={g.absGap}
                              dimension={g.dim}
                              label={`${discFull[g.dim]} ${g.gap > 0 ? "amplifying" : "suppressing"} by ${g.absGap} points`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Walk In Their Shoes moment */}
                      {topGap && m.totalGap >= 40 && (
                        <WalkInTheirShoes
                          name={name}
                          dimension={topGap.dim}
                          gapScore={m.totalGap}
                        />
                      )}

                      {/* Interpretive copy -- specific to their dimension */}
                      <InsightCard.Callout>
                        {topGap ? (
                          <>
                            {name} is {direction} their {dimName} by {topGap.absGap} points every day.
                            {direction === "suppressing" && dimName === "Steadiness" && ` In practice, this means ${name.toLowerCase() === name ? name : name} is working against their natural need for consistency and process. Every disruption costs them more than it costs most of your team.`}
                            {direction === "suppressing" && dimName === "Influence" && ` In practice, this means ${name} is holding back their natural social energy. The connections they'd normally build aren't happening, and that isolation compounds.`}
                            {direction === "suppressing" && dimName === "Dominance" && ` In practice, this means ${name} is holding back their drive to lead and decide. They're deferring when they'd naturally push forward.`}
                            {direction === "suppressing" && dimName === "Compliance" && ` In practice, this means ${name} is being asked to move faster than their process-oriented instinct allows. Quality concerns go unvoiced.`}
                            {direction === "amplifying" && ` Their environment is asking them to show up more ${dimName.toLowerCase()} than they naturally are. That performance has a daily cost.`}
                          </>
                        ) : (
                          <>{name} is carrying {m.totalGap} gap points of adaptation cost.</>
                        )}
                      </InsightCard.Callout>

                      {/* Compound patterns */}
                      {m.tax.activeCompounds.length > 0 && (
                        <InsightCard.CostRow>
                          Active patterns: {m.tax.activeCompounds.map(c => c.name).join(", ")}
                        </InsightCard.CostRow>
                      )}
                    </InsightCard>
                  );
                })}
              </div>
            )}

            {/* Next step CTA -- after highest cost people */}
            {atRisk.length > 0 && (() => {
              const topPerson = atRisk[0];
              const topName = topPerson.name.split(" ")[0];
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
                  className="mb-5"
                >
                  <Card className="border-l-4" style={{ borderLeftColor: 'var(--nav-accent)' }}>
                    <h3 className="text-sm font-bold text-foreground mb-1">What to do next</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      You have seen who is carrying the most. {topName} has the highest adaptation cost at {topPerson.totalGap} gap points. Open their profile to understand what is driving it.
                    </p>
                    {onViewProfile && (
                      <ActionLink onClick={() => onViewProfile(topPerson.id)}>Open {topName}'s profile</ActionLink>
                    )}
                    {frustPT.length > 0 && (
                      <p className="text-xs text-foreground/70 leading-relaxed mt-3">
                        Your team has {frustPT.length} member{frustPT.length !== 1 ? 's' : ''} with a Frustrated PT bias. That is a structural signal worth investigating.
                      </p>
                    )}
                  </Card>
                </motion.div>
              );
            })()}

            {/* Blind spots */}
            {blindSpots.length > 0 && (
              <div className="mb-5">
                <div className="text-sm font-bold text-foreground mb-3">Team process blind spots</div>
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
              </div>
            )}

            {/* Compound Patterns */}
            {activeCompounds.length > 0 && (
              <div>
                <div className="text-sm font-bold text-foreground mb-3">Compound patterns on this team</div>
                {activeCompounds.map((cp, i) => {
                  const patternKey = Object.keys(compoundPatterns).find(k => compoundPatterns[k].id === cp.id);
                  const fullPattern = patternKey ? compoundPatterns[patternKey] : null;

                  return (
                    <InsightCard key={cp.id} variant="standard" enterDelay={i * 80}>
                      <div className="flex items-center gap-2 mb-2">
                        {cp.members.map(name => (
                          <span key={name} className="text-xs font-semibold text-muted">{name}</span>
                        ))}
                      </div>
                      <div className="text-sm font-bold text-foreground mb-2">{cp.name}</div>
                      {fullPattern ? (
                        <>
                          <p className="text-xs text-foreground/80 leading-relaxed mb-2">{fullPattern.description}</p>
                          <Expandable label="Strength" defaultOpen={false}>
                            <p className="text-xs text-foreground leading-relaxed">{fullPattern.strength}</p>
                          </Expandable>
                          <Expandable label="When it goes wrong" defaultOpen={false}>
                            <p className="text-xs text-foreground leading-relaxed">{fullPattern.toxicPattern}</p>
                          </Expandable>
                          <Expandable label="What to watch for" defaultOpen={false}>
                            <p className="text-xs text-foreground leading-relaxed">{fullPattern.recommendation}</p>
                          </Expandable>
                        </>
                      ) : (
                        <p className="text-xs text-foreground/80">{cp.members.join(", ")} {cp.members.length === 1 ? "shows" : "show"} this cross-dimensional pattern.</p>
                      )}
                    </InsightCard>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })()}

      {/* DISC Distribution */}
      <Card>
        <div className="mb-4">
          <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-1">THE TEAM YOU LEAD</div>
          <div className="text-sm text-muted mb-2.5">Natural DISC style distribution &middot; {complete.length} assessed members</div>
          {complete.length >= 2 && (
            <div className="text-sm text-foreground leading-relaxed p-3 rounded-lg bg-subtle border border-border">
              {getTeamCompositionNarrative(dimCounts, complete.length)}
            </div>
          )}
        </div>
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-8'}`}>
          {["D", "I", "S", "C"].map(d => {
            const count = dimCounts[d];
            const pct = complete.length > 0 ? Math.round((count / complete.length) * 100) : 0;
            return (
              <div key={d} className="bg-card rounded-xl p-6 shadow-sm border-l-4" style={{ borderLeftColor: `var(--disc-${d.toLowerCase()})` }}>
                <div className="text-3xl font-bold leading-none mb-2" style={{ color: `var(--disc-${d.toLowerCase()})` }}>{d}</div>
                <div className="text-5xl font-bold text-foreground leading-none mb-1">{count}</div>
                <div className="text-sm text-muted mb-3">{pct}%</div>
                <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: `var(--disc-${d.toLowerCase()})` }}
                  />
                </div>
                <div className="text-xs text-muted mt-2.5 leading-snug">
                  {count > 0
                    ? `${count} ${count === 1 ? "person is" : "people are"} ${discStyleDescs[d]}`
                    : `No ${discFull[d]}-dominant members.`}
                </div>
                {count === 0 && complete.length >= 3 && (
                  <div className="text-[10px] text-friction-moderate mt-1.5 leading-snug">
                    {d === "D" && "No one is naturally driving decisions. The team may struggle with decisiveness."}
                    {d === "I" && "No one is naturally building energy and connection. The team may lack relational glue."}
                    {d === "S" && "No one is naturally providing stability. The team may move fast but miss the consistency that builds trust."}
                    {d === "C" && "No one is naturally catching details. The team may move fast but miss what matters in the fine print."}
                  </div>
                )}
                {count > Math.ceil(complete.length * 0.5) && complete.length >= 3 && (
                  <div className="text-[10px] text-disc-c mt-1.5 leading-snug">
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
        <Sec title="Team Values Distribution" sub="Motivational drivers across your team" color="var(--values-altruistic)" />
        {(() => {
          const topVal = valData[0];
          const zeroVals = valData.filter(v => v.count === 0);
          const topTwo = valData.filter(v => v.count > 0).slice(0, 2);
          const zeroCount = zeroVals.length;

          let valueSummary = "";
          if (topVal && topVal.count > 0) {
            valueSummary = `Your team's strongest shared motivator is ${topVal.name} (${topVal.count} of ${complete.length} people). `;
            const valLeadershipImplications = {
              Aesthetic: "They care about how things feel, not just whether they work. Rushed, sloppy processes will lose this team before the results do.",
              Economic: "They need to see ROI on their time. If work doesn't feel productive or rewarded, engagement drops fast.",
              Individualistic: "They want autonomy and recognition for their unique contribution. Micromanagement is the fastest way to lose them.",
              Political: "They want influence over decisions. Give them voice in how things work, not just what gets done.",
              Altruistic: "They need to feel the work helps people. Connect their tasks to human impact or you'll lose their best energy.",
              Regulatory: "They need structure and clear expectations. Ambiguity isn't freedom to this team -- it's chaos.",
              Theoretical: "They want to understand why, not just what. Skip the explanation and you skip their buy-in."
            };
            if (topTwo.length >= 1) {
              valueSummary += valLeadershipImplications[topVal.name] || "";
            }
            if (zeroCount > 0) {
              valueSummary += ` Nobody on your team is strongly driven by ${zeroVals.slice(0, 2).map(v => v.name).join(" or ")}`;
              if (zeroCount >= 3) {
                valueSummary += ` (or ${zeroCount - 2} other values)`;
              }
              valueSummary += `. People with those drivers may feel like outsiders here.`;
            }
          } else {
            valueSummary = "Your team has diverse motivational drivers. No single value dominates. That's a strength for covering different perspectives, but it means one-size-fits-all motivation won't work. Lead each person through what drives them specifically.";
          }
          return (
            <div className="text-sm text-foreground leading-relaxed p-3 rounded-lg bg-subtle border border-border mb-3">
              {valueSummary}
            </div>
          );
        })()}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={valData} layout="vertical" barSize={24} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
            <XAxis type="number" domain={[0, complete.length]} allowDecimals={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={isMobile ? 70 : 100} tick={{ fontSize: isMobile ? 9 : 10, fontWeight: 600, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [`${value} of ${complete.length} people`, "Top Driver"]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>{valData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {valData.filter(v => v.count > 0).slice(0, 3).map(v => (
            <div key={v.name} className="flex-1 min-w-[200px] p-2 rounded-lg bg-subtle border border-border">
              <div className="text-[10px] font-bold mb-0.5" style={{ color: v.color }}>{v.name} - {v.count} of {complete.length} people</div>
              <div className="text-[10px] text-muted">This team is motivated by {valDescs[v.name]}.</div>
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
        const riskAccent = { red: "friction-high", yellow: "friction-moderate", green: "friction-low" };

        return (
          <Card>
            <SectionHeader title="Key Retention Indicators" subtitle={`Internal attributes across ${complete.length} team members`} count={`${riskLabel[overallRisk]} Risk`} />

            <div className="flex flex-col gap-3">
              {kriData.map(k => {
                const severityMap = { red: "critical", yellow: "warning", green: "success" };
                return (
                  <AlertCard key={k.name} severity={severityMap[k.risk]} title={k.name}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-xs text-muted">Avg: <strong>{k.avgScore}</strong> / 10</span>
                      <span className="text-[10px] font-bold uppercase">{riskLabel[k.risk]}</span>
                    </div>

                    {/* Bias distribution bar */}
                    <div className="flex h-2 rounded-full overflow-hidden mb-2">
                      {k.plusBias > 0 && <div className="bg-friction-low" style={{ flex: k.plusBias }} title={`${k.plusBias} Requires (+)`} />}
                      {k.equalBias > 0 && <div className="bg-disc-c" style={{ flex: k.equalBias }} title={`${k.equalBias} Balanced (=)`} />}
                      {k.minusBias > 0 && <div className="bg-friction-high" style={{ flex: k.minusBias }} title={`${k.minusBias} Undervalues (-)`} />}
                    </div>

                    <div className="flex gap-3 mb-2 text-xs">
                      <span className="text-friction-low font-semibold">{k.plusBias} Requires (+)</span>
                      <span className="text-disc-c font-semibold">{k.equalBias} Balanced (=)</span>
                      <span className="text-friction-high font-semibold">{k.minusBias} Undervalues (-)</span>
                    </div>

                    <p className="leading-relaxed">{k.desc}</p>
                  </AlertCard>
                );
              })}
            </div>
          </Card>
        );
      })()}

    </div>
  );
}
