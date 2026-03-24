'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { useRouter } from "next/navigation";
import { calculateFriction } from "../../utils/friction";
import { getEnvironmentTaxSummary } from "../../knowledge/assessmentInsights";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { InsightCard } from "../../components/ui/InsightCard";
import { PersonChip } from "../../components/ui/PersonChip";
import { StatBlock } from "../../components/ui/StatBlock";
import { ActionLink } from "../../components/ui/ActionLink";
import { AlertCard } from "../../components/ui/AlertCard";
import { Card } from "../../components/ui/Card";
import { LoadingMoment } from "../../components/ui/LoadingMoment";
import { motion } from "framer-motion";

function getDom(nat) {
  return Object.entries(nat).sort(([, a], [, b]) => b - a)[0][0];
}

function getPairStory(personA, personB, friction) {
  const a = personA.name.split(" ")[0];
  const b = personB.name.split(" ")[0];
  const stories = [];

  friction.discGaps.filter(g => g.tier !== "low").sort((x, y) => y.gap - x.gap).forEach(g => {
    const higher = g.aScore > g.bScore ? a : b;
    const lower = g.aScore > g.bScore ? b : a;
    const hiScore = Math.max(g.aScore, g.bScore);
    const loScore = Math.min(g.aScore, g.bScore);
    const hiLevel = hiScore >= 70 ? "high" : "moderate";
    const loLevel = loScore <= 39 ? "low" : "moderate";

    if (g.dim === "D") {
      stories.push({ dim: g.dim, gap: g.gap,
        story: hiLevel === "high" && loLevel === "low"
          ? `${higher} moves fast and makes decisions on the spot. ${lower} prefers to build consensus first. ${higher} reads caution as stalling. ${lower} reads speed as reckless.`
          : `There's a ${g.gap}-point gap on Dominance. ${higher} pushes harder for results. ${lower} takes a measured approach.`,
        fix: hiLevel === "high" && loLevel === "low"
          ? `Build a decision checkpoint. Before any shared decision, agree: is this "move now" or "think first"? Give ${higher} the fast-lane decisions and ${lower} the ones that need deliberation.`
          : `Name it: "${higher}, you'll want to move fast. ${lower}, you'll want more time. Decide together how much runway this needs."`
      });
    }
    if (g.dim === "I") {
      stories.push({ dim: g.dim, gap: g.gap,
        story: hiLevel === "high" && loLevel === "low"
          ? `${higher} leads with energy and connection. ${lower} leads with substance and follow-through. ${higher} thinks ${lower} is cold. ${lower} thinks ${higher} is all talk. Neither is true.`
          : `${higher} brings more social energy. ${lower} brings more task focus. The ${g.gap}-point gap creates friction in how they communicate.`,
        fix: hiLevel === "high" && loLevel === "low"
          ? `${higher}: give ${lower} written context before meetings. ${lower}: give ${higher} face time. A five-minute conversation does more than a detailed email.`
          : `${higher} handles the relational side. ${lower} handles the follow-through. Both show up visibly.`
      });
    }
    if (g.dim === "S") {
      stories.push({ dim: g.dim, gap: g.gap,
        story: hiLevel === "high" && loLevel === "low"
          ? `${higher} needs stability and advance notice. ${lower} thrives on change and speed. When change happens without warning, ${higher} feels blindsided.`
          : `There's a ${g.gap}-point gap on Steadiness. ${higher} is anchored by routine. ${lower} is comfortable with disruption.`,
        fix: hiLevel === "high" && loLevel === "low"
          ? `${lower}: give ${higher} at least 24 hours before a shift. Not a debate, just a heads up. ${higher}: tell ${lower} what you need to get comfortable. Specifics beat silence.`
          : `Frame change as evolution, not disruption. ${higher} needs the thread connecting old to new. ${lower} needs to not treat patience as resistance.`
      });
    }
    if (g.dim === "C") {
      stories.push({ dim: g.dim, gap: g.gap,
        story: hiLevel === "high" && loLevel === "low"
          ? `${higher} trusts data, process, and precision. ${lower} trusts instincts and moves without proof. The friction is about whether the process was followed.`
          : `${higher} wants more rigor. ${lower} wants more speed. The ${g.gap}-point gap creates tension around what "done" looks like.`,
        fix: hiLevel === "high" && loLevel === "low"
          ? `Agree on "minimum viable analysis." What's the least data both need before moving? Set that bar once, reference it every time.`
          : `Define "done" together before starting. "What does good enough look like?" eliminates the over-analyzing vs. cutting corners argument.`
      });
    }
  });

  return stories;
}

function PriorityBanner({ highCount, totalPairs }) {
  if (highCount === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
      className="rounded-xl border border-l-4 border-friction-high bg-alert-critical-bg px-5 py-4 mb-8"
    >
      <div className="text-sm font-bold text-alert-critical-accent mb-1">
        {highCount} relationship{highCount !== 1 ? 's' : ''} carrying friction that costs your team energy every day
      </div>
      <div className="text-xs text-alert-critical-text leading-relaxed">
        Out of {totalPairs} total relationships, these are the ones that need you most. Each one has a story, a cost, and a specific step you can take today.
      </div>
    </motion.div>
  );
}

export default function OrgDashboardPage() {
  const { org, orgPeople, selTeamId, setSelTeamId, isLoading } = useLWYL();
  const router = useRouter();

  if (isLoading) return <div className="max-w-3xl mx-auto px-8 py-6"><LoadingMoment message="Loading your team's friction signals..." /></div>;

  const teams = org?.teams || [];
  const members = orgPeople.filter(p =>
    (selTeamId ? p.teamId === selTeamId : true) &&
    p.status !== "pending" &&
    p.disc
  );

  const pairs = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      pairs.push({ personA: members[i], personB: members[j], friction: calculateFriction(members[i], members[j]) });
    }
  }
  pairs.sort((a, b) => b.friction.preference.gap - a.friction.preference.gap);

  const highCount = pairs.filter(p => p.friction.tier === "significant" || p.friction.tier === "high").length;
  const urgentPairs = pairs.filter(p => p.friction.tier !== "low").slice(0, 5);

  const taxData = members.map(p => ({ person: p, tax: getEnvironmentTaxSummary(p) }))
    .filter(t => t.tax.totalGap >= 60)
    .sort((a, b) => b.tax.totalGap - a.tax.totalGap);

  const completePeople = orgPeople.filter(p => p.status !== "pending");
  const pendingPeople = orgPeople.filter(p => p.status === "pending");

  return (
    <div className="max-w-3xl mx-auto px-8 py-6">
      <SectionHeader
        title={org?.name || "Dashboard"}
        subtitle={`${completePeople.length} assessed \u00b7 ${pendingPeople.length} pending \u00b7 ${teams.length} team${teams.length !== 1 ? 's' : ''}`}
      />

      {/* Team selector */}
      {teams.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelTeamId(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !selTeamId ? "bg-nav text-white" : "bg-card text-muted border border-border hover:border-foreground/30"
            }`}>
            All Teams
          </button>
          {teams.map(t => (
            <button key={t.id}
              onClick={() => setSelTeamId(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                selTeamId === t.id ? "bg-nav text-white" : "bg-card text-muted border border-border hover:border-foreground/30"
              }`}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* No data */}
      {members.length < 2 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
          <p className="text-sm font-semibold text-muted">Need at least 2 assessed team members</p>
          <p className="text-xs text-muted mt-1">Once your team completes their assessments, you will see your team's relationship signals here -- the connections, the friction points, and exactly where the bridges need to be built.</p>
        </div>
      )}

      {/* Summary stats */}
      {members.length >= 2 && pairs.length > 0 && (
        <div className="flex gap-3 mb-8 flex-wrap">
          <StatBlock
            value={highCount}
            label="High Friction"
            sublabel="need attention right now"
            accentColor="friction-high"
            enterDelay={0}
          />
          <StatBlock
            value={pairs.filter(p => p.friction.tier === "moderate").length}
            label="Worth Watching"
            sublabel="moderate friction present"
            accentColor="friction-moderate"
            enterDelay={100}
          />
          <StatBlock
            value={pairs.filter(p => p.friction.tier === "low").length}
            label="Naturally Aligned"
            sublabel="low friction relationships"
            accentColor="friction-low"
            enterDelay={200}
          />
        </div>
      )}

      {/* Priority Alert Banner */}
      <PriorityBanner highCount={highCount} totalPairs={pairs.length} />

      {/* Urgent Relationships */}
      {urgentPairs.length > 0 && (
        <div className="mb-10">
          <SectionHeader
            title="What needs your attention"
            subtitle={`Top ${urgentPairs.length} friction relationships`}
          />

          {urgentPairs.map((pair, i) => {
            const topStory = getPairStory(pair.personA, pair.personB, pair.friction)[0];
            const isHigh = pair.friction.tier === "high";
            const aDom = getDom(pair.personA.disc.natural);
            const bDom = getDom(pair.personB.disc.natural);

            const taxA = getEnvironmentTaxSummary(pair.personA);
            const taxB = getEnvironmentTaxSummary(pair.personB);
            const stressedPerson = taxA.totalGap >= 80 ? pair.personA : taxB.totalGap >= 80 ? pair.personB : null;
            const stressedGap = stressedPerson === pair.personA ? taxA.totalGap : stressedPerson === pair.personB ? taxB.totalGap : 0;

            return (
              <InsightCard
                key={i}
                variant={isHigh ? "priority" : "standard"}
                enterDelay={i * 80}
              >
                {/* Top row: people + severity */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <PersonChip name={pair.personA.name} disc={aDom} size="sm" />
                      <PersonChip name={pair.personB.name} disc={bDom} size="sm" />
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {pair.personA.name.split(" ")[0]} & {pair.personB.name.split(" ")[0]}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isHigh
                      ? 'bg-friction-high/10 text-friction-high'
                      : 'bg-friction-moderate/10 text-friction-moderate'
                  }`}>
                    {isHigh ? "High Friction" : "Moderate"}
                  </span>
                </div>

                {/* Story */}
                {topStory && (
                  <p className="text-sm text-foreground/80 leading-relaxed mb-1">{topStory.story}</p>
                )}

                {/* What to do about it */}
                {topStory && (
                  <InsightCard.Callout>
                    <div className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-1">What to do about it</div>
                    {topStory.fix}
                  </InsightCard.Callout>
                )}

                {/* Cost row */}
                {stressedPerson && (
                  <InsightCard.CostRow>
                    <svg className="w-3.5 h-3.5 text-friction-moderate shrink-0" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a1 1 0 011 1V8a1 1 0 01-2 0V4.5a1 1 0 011-1zM8 10.5a1 1 0 110 2 1 1 0 010-2z"/>
                    </svg>
                    {stressedPerson.name.split(" ")[0]} is carrying {stressedGap} gap points of environment tax. This friction may be amplified by stress.
                  </InsightCard.CostRow>
                )}

                {/* Actions */}
                <InsightCard.Actions>
                  <ActionLink onClick={() => router.push("/app/friction")}>See full analysis</ActionLink>
                  <ActionLink onClick={() => router.push("/app/bridge")} variant="subtle">Start Bridge Wizard</ActionLink>
                </InsightCard.Actions>
              </InsightCard>
            );
          })}
        </div>
      )}

      {/* Next Step CTA -- most urgent pair */}
      {urgentPairs.length > 0 && (() => {
        const top = urgentPairs[0];
        const aName = top.personA.name.split(" ")[0];
        const bName = top.personB.name.split(" ")[0];
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
          >
            <Card className="border-l-4" style={{ borderLeftColor: 'var(--nav-accent)' }}>
              <h3 className="text-sm font-bold text-foreground mb-1">Start here</h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                Your most urgent pair is {aName} & {bName} with {top.friction.preference.gap} gap points. That is where the most energy is being lost on your team right now.
              </p>
              <div className="flex gap-4">
                <ActionLink onClick={() => router.push("/app/bridge")}>Open Bridge Wizard</ActionLink>
                <ActionLink onClick={() => router.push("/app/friction")} variant="subtle">See their full friction analysis</ActionLink>
              </div>
            </Card>
          </motion.div>
        );
      })()}

      {/* Environment Tax Alerts */}
      {taxData.length > 0 && (
        <div className="mb-10">
          <SectionHeader
            title="Environment cost"
            subtitle="Team members paying the highest adaptation tax"
          />
          <div className="space-y-3">
            {taxData.slice(0, 3).map((t, i) => {
              const name = t.person.name.split(" ")[0];
              const isHigh = t.tax.totalGap >= 80;
              const topGap = t.tax.costlyGaps[0];
              const dimNames = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
              const gapDirection = topGap ? (topGap.gap > 0 ? "amplifying" : "suppressing") : "";
              const gapDimName = topGap ? dimNames[topGap.dim] : "";
              return (
                <AlertCard key={i} severity={isHigh ? "warning" : "info"} title={name}>
                  <p className="leading-relaxed">
                    {isHigh
                      ? `${name} is adapting hard every day -- and it's costing more than you think. See the full breakdown in their Environment Report.`
                      : `${name} is adapting moderately. Worth watching -- open their Environment Report for details.`
                    }
                  </p>
                </AlertCard>
              );
            })}
          </div>
        </div>
      )}

      {/* All clear */}
      {urgentPairs.length === 0 && members.length >= 2 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-10 text-center">
          <div className="text-base font-bold text-friction-low mb-2">No urgent friction right now</div>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Your team's relationships are in a manageable range. Keep building Connection Agreements to stay ahead.
          </p>
          <button onClick={() => router.push("/app/friction")}
            className="px-5 py-2.5 rounded-xl bg-nav text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            View Friction Map
          </button>
        </div>
      )}

      {/* Pending assessments */}
      {pendingPeople.length > 0 && (
        <AlertCard severity="info" title={`${pendingPeople.length} pending assessment${pendingPeople.length !== 1 ? 's' : ''}`}>
          {pendingPeople.map(p => p.name).join(", ")} {pendingPeople.length === 1 ? "hasn't" : "haven't"} completed their assessment. Every missing profile is a blind spot in how you see your team.
        </AlertCard>
      )}
    </div>
  );
}
