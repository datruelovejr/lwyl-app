/**
 * team-method.js — the team-level reads of the full method, in one pure function.
 *
 * Lifted verbatim from MethodView's three memos so every team screen shows the
 * same four-source reads (strengths, coverage gap, same-pole) without duplicating
 * the logic. Reads the instrument's own grades via the engine modules, never a flat
 * cutoff. Everything it surfaces on the clash side is a signal, never a verdict.
 */

import { calculateSamePole } from "./samepole";
import { teamCoverageGap } from "./coverage-gap";

const EXTERNAL_CORE = ["Empathy", "Practical Thinking", "Systems Judgment"];

export function teamMethod(people = []) {
  const graded = people.filter(p => p.disc || (p.attr78 && p.attr78.length) || p.attr);

  // Team strengths: External capacities most of the team holds as a talent (score 8+).
  const tally = new Map();
  for (const p of graded) {
    for (const a of (p.attr78 || [])) {
      if (!EXTERNAL_CORE.includes(a.coreDimension)) continue;
      const t = tally.get(a.attribute) || { attribute: a.attribute, talent: 0, total: 0 };
      t.total += 1;
      if (a.rawScore >= 8.0) t.talent += 1;
      tally.set(a.attribute, t);
    }
  }
  let teamStrengths = [...tally.values()]
    .map(t => ({ ...t, pct: t.total ? Math.round(100 * t.talent / t.total) : 0 }))
    .filter(t => t.talent > 0)
    .sort((a, b) => b.pct - a.pct || a.attribute.localeCompare(b.attribute));
  // Show the top group without cutting a tie: keep everything at or above the sixth share.
  if (teamStrengths.length > 6) {
    const cutoff = teamStrengths[5].pct;
    teamStrengths = teamStrengths.filter(t => t.pct >= cutoff);
  }

  const coverage = teamCoverageGap(graded);

  // Same-pole flags across every pair, gathered into one list.
  const comp = new Map();
  const whose = new Map();
  for (let i = 0; i < graded.length; i++) {
    for (let j = i + 1; j < graded.length; j++) {
      const r = calculateSamePole(graded[i], graded[j]);
      for (const c of r.competition) {
        const k = `${c.instrument}:${c.dim}`;
        const e = comp.get(k) || { label: `${c.dim}`, instrument: c.instrument, pairs: 0 };
        e.pairs += 1; comp.set(k, e);
      }
      for (const w of r.whoseStandard) {
        const k = `${w.instrument}:${w.dim}`;
        const e = whose.get(k) || { label: `${w.dim}`, about: w.about, pairs: 0 };
        e.pairs += 1; whose.set(k, e);
      }
    }
  }
  const samePole = {
    competition: [...comp.values()].sort((a, b) => b.pairs - a.pairs),
    whoseStandard: [...whose.values()].sort((a, b) => b.pairs - a.pairs),
  };

  return { graded, teamStrengths, coverage, samePole };
}
