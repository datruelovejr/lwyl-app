/**
 * teamAttributeSummary — the team's collective 78, read by cluster and rank.
 *
 * The team analog of the per-person Core Attributes screen:
 *   - what the team is built to do well (External capacities most hold as a talent)
 *   - strength by cluster
 *   - where the team runs thin (outward capacities few clear the bar on)
 *
 * External only for the routable reads, since a self-concept is never a team gap.
 * Talent bar 8.0, presence bar 6.0, from the clarity tiers until per-attribute norms load.
 */

const EXTERNAL_CORE = ["Empathy", "Practical Thinking", "Systems Judgment"];
const CLUSTER_ORDER = ["Heart", "Hand", "Head", "Self-Esteem", "Role Awareness", "Self-Direction"];
const TALENT_BAR = 8.0;
const PRESENT_BAR = 6.0;
const GAP_LINE = 40; // percent who must clear the presence bar, below this is a team gap

export function teamAttributeSummary(people = []) {
  const team = people.filter((p) => Array.isArray(p.attr78) && p.attr78.length);
  const n = team.length;
  if (!n) return { ran: false, n: 0 };

  const agg = new Map();
  for (const p of team) {
    for (const a of p.attr78) {
      const e = agg.get(a.attribute) || {
        attribute: a.attribute, cluster: a.cluster, coreDimension: a.coreDimension,
        ext: EXTERNAL_CORE.includes(a.coreDimension), talent: 0, present: 0, total: 0, sum: 0,
      };
      e.total += 1;
      e.sum += a.rawScore;
      if (a.rawScore >= TALENT_BAR) e.talent += 1;
      if (a.rawScore >= PRESENT_BAR) e.present += 1;
      agg.set(a.attribute, e);
    }
  }

  const list = [...agg.values()].map((e) => ({
    ...e,
    talentPct: Math.round((100 * e.talent) / e.total),
    presentPct: Math.round((100 * e.present) / e.total),
    avg: e.sum / e.total,
  }));

  const ext = list.filter((e) => e.ext);

  const strengths = ext
    .filter((e) => e.talent > 0)
    .sort((a, b) => b.talentPct - a.talentPct || a.attribute.localeCompare(b.attribute));

  const gaps = ext
    .filter((e) => e.presentPct < GAP_LINE)
    .sort((a, b) => a.presentPct - b.presentPct);

  const clusters = CLUSTER_ORDER.map((cl) => {
    const items = list.filter((e) => e.cluster === cl);
    if (!items.length) return null;
    const isExt = EXTERNAL_CORE.includes(items[0].coreDimension);
    const avgTalent = Math.round(items.reduce((s, e) => s + e.talentPct, 0) / items.length);
    const top = [...items].sort((a, b) => b.talentPct - a.talentPct)[0];
    return { cl, isExt, count: items.length, avgTalent, top };
  }).filter(Boolean);

  return { ran: true, n, strengths, gaps, clusters, ext };
}
