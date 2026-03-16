'use client';

import { useState } from "react";
import { C } from "../constants/colors";
import { discFull } from "../constants/data";
import { calculateFriction } from "../utils/friction";
import { Btn } from "./Btn";
import { Card, StoryCard, AlertCard, SectionHead, MetricCard, Expandable } from "./ui";
import { discInsights, valuesInsights, getEnvironmentTaxSummary } from "../knowledge/assessmentInsights";

// ────── FRICTION MAP: Story-First Design ──────
// Every pair gets a narrative. Numbers stay under the hood.

const discLabel = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
const processLabel = { Heart: "Empathy", Hand: "Practical Thinking", Head: "Systems Judgment" };

function getPairStory(personA, personB, friction) {
  const a = personA.name.split(" ")[0];
  const b = personB.name.split(" ")[0];
  const stories = [];

  // DISC gap stories
  friction.discGaps.filter(g => g.tier !== "low").sort((x, y) => y.gap - x.gap).forEach(g => {
    const higher = g.aScore > g.bScore ? a : b;
    const lower = g.aScore > g.bScore ? b : a;
    const hiScore = Math.max(g.aScore, g.bScore);
    const loScore = Math.min(g.aScore, g.bScore);
    const hiLevel = hiScore >= 70 ? "high" : "moderate";
    const loLevel = loScore <= 39 ? "low" : "moderate";

    if (g.dim === "D") {
      if (hiLevel === "high" && loLevel === "low") {
        stories.push({ area: "Preference", dim: g.dim, severity: g.tier, gap: g.gap,
          story: `${higher} moves fast and makes decisions on the spot. ${lower} prefers to build consensus and include everyone before committing. When they clash, it's not about who's right. It's about pace. ${higher} reads ${lower}'s caution as stalling. ${lower} reads ${higher}'s speed as reckless.`,
          fix: `Build a decision checkpoint. Before any shared decision, agree upfront: is this a "move now" or "think first" situation? Give ${higher} the fast-lane decisions and ${lower} the ones that need deliberation. Stop forcing one speed on both people.`
        });
      } else {
        stories.push({ area: "Preference", dim: g.dim, severity: g.tier, gap: g.gap,
          story: `There's a ${g.gap}-point gap on Dominance between ${a} and ${b}. ${higher} naturally pushes harder for results. ${lower} takes a more measured approach. The friction shows up in how decisions get made and who feels heard in the process.`,
          fix: `Name it out loud. "${higher}, you're going to want to move fast on this. ${lower}, you're going to want more time. Let's decide together how much runway this decision actually needs."`
        });
      }
    }
    if (g.dim === "I") {
      if (hiLevel === "high" && loLevel === "low") {
        stories.push({ area: "Preference", dim: g.dim, severity: g.tier, gap: g.gap,
          story: `${higher} leads with energy, conversation, and connection. ${lower} leads with substance, follow-through, and results. ${higher} thinks ${lower} is cold. ${lower} thinks ${higher} is all talk. Neither is true. They're just speaking different languages.`,
          fix: `${higher}: give ${lower} written context before meetings. Let them process before performing. ${lower}: give ${higher} face time. A five-minute conversation does more than a detailed email. Meet each other where you actually are, not where you wish the other person would be.`
        });
      } else {
        stories.push({ area: "Preference", dim: g.dim, severity: g.tier, gap: g.gap,
          story: `${higher} brings more social energy. ${lower} brings more task focus. The gap is ${g.gap} points. That's enough to create friction in how they communicate and what they expect from each other.`,
          fix: `Set the rhythm. ${higher} handles the relational side. ${lower} handles the follow-through. Both need to show up visibly so neither person fills in the blanks with worst-case assumptions.`
        });
      }
    }
    if (g.dim === "S") {
      if (hiLevel === "high" && loLevel === "low") {
        stories.push({ area: "Preference", dim: g.dim, severity: g.tier, gap: g.gap,
          story: `${higher} needs stability, advance notice, and time to adjust. ${lower} thrives on change, variety, and moving fast. When change happens without warning, ${higher} feels blindsided. When things stay the same too long, ${lower} feels trapped.`,
          fix: `Create a change buffer. ${lower}: give ${higher} at least 24 hours before a shift lands. Not a debate. Just a heads up. ${higher}: tell ${lower} what you need to get comfortable, not just that you're uncomfortable. Specifics beat silence.`
        });
      } else {
        stories.push({ area: "Preference", dim: g.dim, severity: g.tier, gap: g.gap,
          story: `There's a ${g.gap}-point gap on Steadiness. ${higher} is more anchored by routine and consistency. ${lower} is more comfortable with disruption. The tension lives in how change gets introduced and absorbed.`,
          fix: `When change comes, frame it as evolution, not disruption. ${higher} needs to see the thread connecting old to new. ${lower} needs to not treat patience as resistance.`
        });
      }
    }
    if (g.dim === "C") {
      if (hiLevel === "high" && loLevel === "low") {
        stories.push({ area: "Preference", dim: g.dim, severity: g.tier, gap: g.gap,
          story: `${higher} trusts data, process, and precision. ${lower} trusts instincts and moves without waiting for proof. When they disagree, it's usually not about the decision. It's about whether the process was followed. ${higher} feels dismissed. ${lower} feels slowed down.`,
          fix: `Agree on "minimum viable analysis." What's the least amount of data both people need before moving? Set that bar once. Reference it every time. It stops the cycle of one person demanding more info and the other person running ahead without it.`
        });
      } else {
        stories.push({ area: "Preference", dim: g.dim, severity: g.tier, gap: g.gap,
          story: `${higher} wants more rigor. ${lower} wants more speed. The gap is ${g.gap} points on Compliance. That's enough to create real tension around quality, process, and what "done" looks like.`,
          fix: `Define "done" together before starting. Not after. "What does good enough look like for this?" eliminates the argument about over-analyzing vs. cutting corners.`
        });
      }
    }
  });

  // Values gap stories
  const aTopVals = Object.entries(personA.values).filter(([, s]) => s >= 60).sort((x, y) => y[1] - x[1]).map(([k]) => k);
  const bTopVals = Object.entries(personB.values).filter(([, s]) => s >= 60).sort((x, y) => y[1] - x[1]).map(([k]) => k);
  const aOnly = aTopVals.filter(v => !bTopVals.includes(v));
  const bOnly = bTopVals.filter(v => !aTopVals.includes(v));

  if (aOnly.length > 0 || bOnly.length > 0) {
    const parts = [];
    if (aOnly.length > 0) parts.push(`${a} is fueled by ${aOnly.join(" and ")}. That's not what drives ${b}.`);
    if (bOnly.length > 0) parts.push(`${b} is fueled by ${bOnly.join(" and ")}. That's not what drives ${a}.`);
    stories.push({
      area: "Passion", dim: "Values", severity: "moderate", gap: null,
      story: `${parts.join(" ")} Neither person is wrong. They just get energy from different places. The friction shows up when one person can't understand why the other cares so much about something that doesn't register for them.`,
      fix: `Stop interpreting the other person's priorities as wrong. They're not wrong. They're wired differently. Name it: "I know ${aOnly[0] || bOnly[0]} matters to you. It's not my top driver, but I see why it matters here." That one sentence prevents most values-based friction.`
    });
  }

  // Process conflict stories
  friction.processResults.filter(r => r.resultType === "conflict").forEach(r => {
    const aLabel = r.label;
    stories.push({
      area: "Process", dim: aLabel, severity: "high", gap: null,
      story: `${a} and ${b} have opposite biases on ${processLabel[aLabel] || aLabel}. One of them requires it. The other dismisses it. That means one person's instinct is to lean into ${aLabel.toLowerCase()} thinking and the other's instinct is to skip it. Every time they make a decision together, this gap costs them.`,
      fix: `Give ${aLabel} a seat at the table. Not a veto. A seat. Build a 60-second check into shared decisions: "Have we addressed the ${aLabel.toLowerCase()} angle?" The person who requires it calls the check. The person who dismisses it listens for 60 seconds. That's the deal.`
    });
  });

  return stories;
}

function getConnectionAgreementPrompts(personA, personB, friction) {
  const a = personA.name.split(" ")[0];
  const b = personB.name.split(" ")[0];
  const prompts = [];

  const topGap = friction.discGaps.filter(g => g.tier !== "low").sort((x, y) => y.gap - x.gap)[0];
  if (topGap) {
    prompts.push(`How do ${a} and ${b} want to handle ${discLabel[topGap.dim].toLowerCase()} differences? Who gets to set the pace on what?`);
  }

  const hasValGap = friction.valuesDetail.aOnlyVals?.length > 0 || friction.valuesDetail.bOnlyVals?.length > 0;
  if (hasValGap || friction.passionScore >= 3) {
    prompts.push(`What does ${a} need to feel motivated that ${b} might not naturally provide? And the reverse?`);
  }

  const hasProcessConflict = friction.processResults.some(r => r.resultType === "conflict");
  if (hasProcessConflict) {
    prompts.push(`When ${a} and ${b} make decisions together, whose process instinct leads? How do they make sure the other perspective gets heard?`);
  }

  prompts.push(`What's the one thing ${a} needs ${b} to stop assuming about them? And the reverse?`);

  return prompts;
}

// ────── Pair Detail View ──────

function PairDetail({ personA, personB, friction, onBack, onClose }) {
  const a = personA.name.split(" ")[0];
  const b = personB.name.split(" ")[0];
  const stories = getPairStory(personA, personB, friction);
  const prompts = getConnectionAgreementPrompts(personA, personB, friction);
  const tierLabel = { high: "High Friction", moderate: "Moderate Friction", low: "Low Friction" };
  const tierBadge = {
    high: "text-red-800 bg-red-50 border-red-200",
    moderate: "text-orange-700 bg-orange-50 border-orange-200",
    low: "text-green-700 bg-green-50 border-green-200"
  };

  // Environment tax context
  const taxA = getEnvironmentTaxSummary(personA);
  const taxB = getEnvironmentTaxSummary(personB);
  const eitherStressed = taxA.totalGap >= 80 || taxB.totalGap >= 80;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{a} & {b}</h1>
          <p className="text-xs text-gray-400 mt-0.5">What creates friction between them and what to do about it.</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tierBadge[friction.tier]}`}>
            {tierLabel[friction.tier]}
          </span>
          {onBack && <button onClick={onBack} className="text-sm font-semibold text-sky-500 hover:underline">Back</button>}
        </div>
      </div>

      {/* Quick score context */}
      <div className="flex gap-2 flex-wrap mb-6">
        <MetricCard value={friction.preferenceScore} label="Preference" sub="DISC gaps" accent={friction.preferenceScore >= 6 ? "#991B1B" : friction.preferenceScore >= 3 ? "#C2410C" : "#15803D"} />
        <MetricCard value={friction.passionScore} label="Passion" sub="Values gaps" accent={friction.passionScore >= 6 ? "#991B1B" : friction.passionScore >= 3 ? "#C2410C" : "#15803D"} />
        <MetricCard value={friction.processScore} label="Process" sub="How they decide" accent={friction.processScore >= 4 ? "#991B1B" : friction.processScore >= 2 ? "#C2410C" : "#15803D"} />
      </div>

      {/* Environment stress context */}
      {eitherStressed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="text-xs font-bold text-amber-700 mb-1">Environment context matters here</div>
          <div className="text-xs text-amber-900 leading-relaxed">
            {taxA.totalGap >= 80 && <span>{a} is carrying {taxA.totalGap} gap points of environment tax. </span>}
            {taxB.totalGap >= 80 && <span>{b} is carrying {taxB.totalGap} gap points of environment tax. </span>}
            Some of this friction might be environment-amplified. Two stressed people collide harder. Look at the environment cost before blaming the relationship.
          </div>
        </div>
      )}

      {/* The stories */}
      {stories.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Where the friction lives</h2>
              <p className="text-xs text-gray-400 mt-0.5">{stories.length} friction point{stories.length !== 1 ? "s" : ""} between {a} and {b}</p>
            </div>
          </div>
          {stories.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4" style={{ borderLeft: `4px solid ${s.severity === "high" ? "#991B1B" : "#C2410C"}` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{s.area}</span>
                {s.dim && s.dim !== "Values" && <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">: {discLabel[s.dim] || s.dim}</span>}
                {s.gap && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{s.gap}-point gap</span>}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.story}</p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mb-1">What to do about it</div>
                <div className="text-xs text-emerald-900 leading-relaxed">{s.fix}</div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="text-center py-5 text-gray-400">
            <div className="text-sm font-semibold">Low friction pair</div>
            <div className="text-xs mt-1">{a} and {b} are naturally well-aligned. No significant gaps to address right now.</div>
          </div>
        </div>
      )}

      {/* Connection Agreement prompts */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-sm p-5 mb-4">
        <div className="text-sm font-bold text-white mb-1">Connection Agreement starters</div>
        <div className="text-xs text-white/60 mb-4">Use these to start a conversation between {a} and {b}. Not a script. A starting point.</div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {prompts.map((p, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
              <div className="text-xs text-gray-700 leading-relaxed">{p}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw data expandable */}
      <Expandable label="Show raw scores" color={C.muted}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {friction.discGaps.map(g => (
            <div key={g.dim} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px]">
              <span className="font-bold" style={{ color: C.disc[g.dim] }}>{discLabel[g.dim]}</span>
              <span className="text-gray-400 ml-2">{a}: {g.aScore} · {b}: {g.bScore} · Gap: {g.gap}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {friction.valuesDetail.valGaps.filter(g => g.tier !== "low").map(g => (
            <div key={g.dim} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px]">
              <span className="font-bold" style={{ color: C.values[g.dim] || C.text }}>{g.dim}</span>
              <span className="text-gray-400 ml-2">{a}: {g.aScore} · {b}: {g.bScore} · Gap: {g.gap}</span>
            </div>
          ))}
        </div>
      </Expandable>
    </div>
  );
}

// ────── Main Friction Map ──────

export function FrictionMap({ people, teamId, orgId, onClose, isPage }) {
  const [selectedPair, setSelectedPair] = useState(null);
  const [viewMode, setViewMode] = useState("stories"); // "stories" or "grid"
  const members = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending" && p.disc);

  if (members.length < 2) {
    const content = (
      <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Need at least 2 team members</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Upload assessments to see friction analysis.</div>
        {onClose && <Btn onClick={onClose} style={{ marginTop: 16 }}>Close</Btn>}
      </div>
    );
    if (isPage) return content;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
        <div className="modal-body" style={{ background: C.card, borderRadius: 12, padding: 48, maxWidth: 400, boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>{content}</div>
      </div>
    );
  }

  // Calculate all pairs
  const pairs = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      pairs.push({
        personA: members[i],
        personB: members[j],
        friction: calculateFriction(members[i], members[j])
      });
    }
  }
  pairs.sort((a, b) => b.friction.totalScore - a.friction.totalScore);

  const highPairs = pairs.filter(p => p.friction.tier === "high");
  const modPairs = pairs.filter(p => p.friction.tier === "moderate");
  const tierColor = { high: "#991B1B", moderate: "#C2410C", low: "#15803D" };

  // Detail view
  if (selectedPair) {
    const inner = (
      <PairDetail
        personA={selectedPair.personA}
        personB={selectedPair.personB}
        friction={selectedPair.friction}
        onBack={() => setSelectedPair(null)}
        onClose={onClose}
      />
    );
    if (isPage) return <div style={{ padding: "24px 32px", maxWidth: 800, margin: "0 auto" }}>{inner}</div>;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
        <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(780px, 100%)", padding: "24px 32px", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
          {inner}
        </div>
      </div>
    );
  }

  // Main list view
  const mainContent = (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Friction Map</h1>
          <p className="text-xs text-gray-400 mt-1">{members.length} members · {pairs.length} relationships</p>
        </div>
        {onClose && <Btn onClick={onClose} small style={{ fontSize: 11 }}>Close</Btn>}
      </div>

      {/* Team friction summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: highPairs.length, label: "High friction", sub: "need attention", color: highPairs.length > 0 ? "#991B1B" : "#15803D" },
          { value: modPairs.length, label: "Moderate", sub: "worth watching", color: modPairs.length > 0 ? "#C2410C" : "#15803D" },
          { value: pairs.length - highPairs.length - modPairs.length, label: "Low friction", sub: "naturally aligned", color: "#15803D" },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4" style={{ borderLeft: `4px solid ${m.color}` }}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{m.label}</div>
            <div className="text-2xl font-extrabold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* High friction pairs - stories */}
      {highPairs.length > 0 && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pairs that need attention</h2>
            <p className="text-xs text-gray-400 mt-0.5">These relationships have enough friction to cause real problems if left unaddressed.</p>
          </div>
          {highPairs.map((pair, i) => {
            const a = pair.personA.name.split(" ")[0];
            const b = pair.personB.name.split(" ")[0];
            const topStory = getPairStory(pair.personA, pair.personB, pair.friction)[0];

            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-3 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderLeft: "4px solid #991B1B" }}
                onClick={() => setSelectedPair(pair)}>
                <div className="p-5">
                  <div className="text-sm font-bold text-gray-900 mb-2">{a} & {b}</div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {topStory ? topStory.story : `These two have a friction score of ${pair.friction.totalScore}. Multiple dimensions are creating tension.`}
                  </p>
                  <span className="text-xs font-semibold text-red-800 hover:underline">
                    See full analysis and what to do →
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Moderate friction pairs */}
      {modPairs.length > 0 && (
        <>
          <div className="mb-4 mt-8">
            <h2 className="text-lg font-bold text-gray-900">Worth watching</h2>
            <p className="text-xs text-gray-400 mt-0.5">Not urgent, but these gaps can grow if ignored.</p>
          </div>
          {modPairs.map((pair, i) => {
            const a = pair.personA.name.split(" ")[0];
            const b = pair.personB.name.split(" ")[0];
            const topStory = getPairStory(pair.personA, pair.personB, pair.friction)[0];

            return (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm mb-2 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderLeft: "4px solid #C2410C" }}
                onClick={() => setSelectedPair(pair)}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">{a} & {b}</div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed truncate">
                    {topStory ? topStory.story.substring(0, 120) + "..." : "Moderate friction across multiple dimensions."}
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-700 ml-3 flex-shrink-0">View →</span>
              </div>
            );
          })}
        </>
      )}

      {/* Low friction pairs - collapsed */}
      {pairs.length - highPairs.length - modPairs.length > 0 && (
        <Expandable label={`${pairs.length - highPairs.length - modPairs.length} low-friction pairs`} color={C.muted}>
          {pairs.filter(p => p.friction.tier === "low").map((pair, i) => {
            const a = pair.personA.name.split(" ")[0];
            const b = pair.personB.name.split(" ")[0];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: C.hi, marginBottom: 4, cursor: "pointer", fontSize: 12 }} onClick={() => setSelectedPair(pair)}>
                <span style={{ fontWeight: 600, color: C.text }}>{a} & {b}</span>
                <span style={{ color: "#15803D", fontWeight: 600 }}>Aligned</span>
              </div>
            );
          })}
        </Expandable>
      )}
    </div>
  );

  if (isPage) return <div className="px-8 py-6">{mainContent}</div>;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(860px, 100%)", padding: "24px 32px", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        {mainContent}
      </div>
    </div>
  );
}
