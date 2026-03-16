'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { useRouter } from "next/navigation";
import { calculateFriction } from "../../utils/friction";
import { getEnvironmentTaxSummary } from "../../knowledge/assessmentInsights";

const discColor = { D: "#C62828", I: "#F59E0B", S: "#16A34A", C: "#2563EB" };

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

export default function OrgDashboardPage() {
  const { org, orgPeople, selTeamId, setSelTeamId } = useLWYL();
  const router = useRouter();

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
  pairs.sort((a, b) => b.friction.totalScore - a.friction.totalScore);

  const urgentPairs = pairs.filter(p => p.friction.tier !== "low").slice(0, 5);

  const taxData = members.map(p => ({ person: p, tax: getEnvironmentTaxSummary(p) }))
    .filter(t => t.tax.totalGap >= 60)
    .sort((a, b) => b.tax.totalGap - a.tax.totalGap);

  const completePeople = orgPeople.filter(p => p.status !== "pending");
  const pendingPeople = orgPeople.filter(p => p.status === "pending");

  return (
    <div className="max-w-3xl mx-auto px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{org?.name || "Dashboard"}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {completePeople.length} assessed · {pendingPeople.length} pending · {teams.length} team{teams.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Team selector */}
      {teams.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelTeamId(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !selTeamId ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
            }`}>
            All Teams
          </button>
          {teams.map(t => (
            <button key={t.id}
              onClick={() => setSelTeamId(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                selTeamId === t.id ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* No data */}
      {members.length < 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-sm font-semibold text-gray-500">Need at least 2 assessed team members</p>
          <p className="text-xs text-gray-400 mt-1">Upload assessments to see what needs your attention.</p>
        </div>
      )}

      {/* Urgent Relationships */}
      {urgentPairs.length > 0 && (
        <div className="mb-10">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">What needs your attention</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {pairs.filter(p => p.friction.tier === "high").length} high-friction relationship{pairs.filter(p => p.friction.tier === "high").length !== 1 ? "s" : ""} right now
            </p>
          </div>

          <div className="space-y-4">
            {urgentPairs.map((pair, i) => {
              const a = pair.personA.name.split(" ")[0];
              const b = pair.personB.name.split(" ")[0];
              const topStory = getPairStory(pair.personA, pair.personB, pair.friction)[0];
              const isHigh = pair.friction.tier === "high";
              const tierColor = isHigh ? "#991B1B" : "#C2410C";
              const aDom = getDom(pair.personA.disc.natural);
              const bDom = getDom(pair.personB.disc.natural);

              const taxA = getEnvironmentTaxSummary(pair.personA);
              const taxB = getEnvironmentTaxSummary(pair.personB);
              const stressedPerson = taxA.totalGap >= 80 ? pair.personA : taxB.totalGap >= 80 ? pair.personB : null;

              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  style={{ borderLeft: `4px solid ${tierColor}` }}>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex -space-x-1.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                          style={{ background: discColor[aDom] }}>
                          {pair.personA.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                          style={{ background: discColor[bDom] }}>
                          {pair.personB.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-bold text-gray-900">{a} & {b}</span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: `${tierColor}10`, color: tierColor }}>
                        {isHigh ? "High Friction" : "Moderate"}
                      </span>
                    </div>

                    {topStory && (
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{topStory.story}</p>
                    )}

                    {topStory && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 mb-3">
                        <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mb-1">What to do about it</div>
                        <p className="text-xs text-emerald-900 leading-relaxed">{topStory.fix}</p>
                      </div>
                    )}

                    {stressedPerson && (
                      <p className="text-xs text-amber-700 mb-3">
                        {stressedPerson.name.split(" ")[0]} is carrying {stressedPerson === pair.personA ? taxA.totalGap : taxB.totalGap} gap points of environment tax. This friction may be amplified by stress.
                      </p>
                    )}

                    <div className="flex gap-4">
                      <button onClick={() => router.push("/app/friction")}
                        className="text-xs font-semibold hover:underline" style={{ color: tierColor }}>
                        See full analysis →
                      </button>
                      <button onClick={() => router.push("/app/bridge")}
                        className="text-xs font-semibold text-sky-500 hover:underline">
                        Start Bridge Wizard →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Environment Tax Alerts */}
      {taxData.length > 0 && (
        <div className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Environment cost</h2>
            <p className="text-xs text-gray-400 mt-0.5">Team members paying the highest adaptation tax</p>
          </div>
          <div className="space-y-3">
            {taxData.slice(0, 3).map((t, i) => {
              const name = t.person.name.split(" ")[0];
              const isHigh = t.tax.totalGap >= 80;
              return (
                <div key={i} className={`rounded-xl border p-4 ${isHigh ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-100"}`}
                  style={{ borderLeft: `4px solid ${isHigh ? "#C2410C" : "#1D4ED8"}` }}>
                  <div className={`text-xs font-bold mb-1 ${isHigh ? "text-amber-800" : "text-blue-800"}`}>
                    {name}: {t.tax.totalGap} gap points
                  </div>
                  <p className={`text-xs leading-relaxed ${isHigh ? "text-amber-700" : "text-blue-700"}`}>
                    {isHigh
                      ? `${name} is spending significant energy every day adapting. That cost shows up as fatigue, disengagement, or friction that looks interpersonal but is actually environmental.`
                      : `${name} is adapting moderately. Worth monitoring but not urgent.`
                    }
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All clear */}
      {urgentPairs.length === 0 && members.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-base font-bold text-emerald-600 mb-2">No urgent friction right now</div>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Your team's relationships are in a manageable range. Keep building Connection Agreements to stay ahead.
          </p>
          <button onClick={() => router.push("/app/friction")}
            className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors">
            View Friction Map
          </button>
        </div>
      )}

      {/* Pending assessments */}
      {pendingPeople.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4" style={{ borderLeft: "4px solid #1D4ED8" }}>
          <div className="text-xs font-bold text-blue-800 mb-1">
            {pendingPeople.length} pending assessment{pendingPeople.length !== 1 ? "s" : ""}
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            {pendingPeople.map(p => p.name).join(", ")} {pendingPeople.length === 1 ? "hasn't" : "haven't"} completed their assessment. Every missing profile is a blind spot.
          </p>
        </div>
      )}
    </div>
  );
}
