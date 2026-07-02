/**
 * COVERAGE-GAP — a hole no one covers
 *
 * Both people, or a whole team, sit low on a capacity the work needs, and no one
 * covers it. No one is wrong. The fix is structural: build a system, hand it to
 * someone, or hire for it.
 *
 * HARD BOUNDARY, absolute: External only. Coverage-gap never touches the three
 * Internal attributes (Self-Esteem, Role Awareness, Self-Direction). You cannot
 * hire, delegate, or systematize a person's self-concept. A shared low on Internal
 * is a retention signal or personal development, never a coverage-gap.
 *
 * STATUS: SIGNAL. A low is only a real gap when the role demands that capacity and
 * no one complements it. We do not have a role-demand reference yet, so every hit
 * here is a "possible gap, confirm the role needs it," not a verdict.
 *
 * THE BAR ("present" vs "not present"): the instrument scores each capacity 0 to 10.
 * The per-capacity grade column is empty in the data, so we read the score against the
 * locked clarity tiers from the capability method (see attr-tiers.js): below 6.5 is low
 * (a blind spot), 6.5 and up is present. These tiers come from the IMX training material,
 * not invented here, and swap for per-attribute norms the moment those load.
 *
 * Source of truth: methodology/friction/03-operators.md section 2, Coverage_Gap_Rule.md,
 * and the capability Stage 00 clarity tiers.
 */

import { isLow, isPresent, CLARITY_LOW } from "./attr-tiers.js";

// The three External core dimensions. Internal is intentionally absent.
export const EXTERNAL_CORE = ["Empathy", "Practical Thinking", "Systems Judgment"];

function extRollup(person, coreName) {
  // person.attr.ext is [{name, label, score, bias}] for the three External rollups.
  return person.attr?.ext?.find((a) => a.name === coreName) || null;
}

/**
 * DYADIC coverage-gap on the three External rollups.
 * Fires when BOTH people are below the presence bar on the same capacity. It fires
 * harder when the low carries a minus bias, because a minus means the capacity is
 * both absent and resented, not just undeveloped.
 */
export function dyadicCoverageGap(personA, personB) {
  const gaps = [];
  const blocked = [];
  for (const core of EXTERNAL_CORE) {
    const a = extRollup(personA, core);
    const b = extRollup(personB, core);
    if (!a || !b || a.score == null || b.score == null) {
      blocked.push({ capacity: core, why: "attribute score missing" });
      continue;
    }
    if (isLow(a.score) && isLow(b.score)) {
      const minusCount = [a.bias, b.bias].filter((x) => x === "-" || x === "−").length;
      gaps.push({
        capacity: core,
        aScore: a.score, bScore: b.score,
        aBias: a.bias, bBias: b.bias,
        minusCount, // 0, 1, or 2. more minus means the gap bites harder
        severity: minusCount === 2 ? "high" : minusCount === 1 ? "moderate" : "low",
        status: "signal",
        note: "possible gap, confirm the role actually needs this capacity",
      });
    }
  }
  return { gaps, blocked, external_only: true };
}

/**
 * TEAM coverage-gap on the full 78, External only, read by cluster and rank.
 * A capacity is a team gap when fewer than 40 percent of the team clear the bar on it.
 *
 * @param {Array} team - people, each with an attr78 array of {attribute, rawScore, rank, cluster, coreDimension}
 * @returns { gaps, checked, teamSize, coverable } where gaps lists capacities under the 40 percent line
 */
export const TEAM_GAP_LINE = 0.40;

export function teamCoverageGap(team) {
  // Only people who carry the 78 can be read. Say so plainly if too few do.
  const withAttrs = team.filter((p) => Array.isArray(p.attr78) && p.attr78.length > 0);
  if (withAttrs.length === 0) {
    return { ran: false, reason: "no team member has the 78 captured", teamSize: team.length };
  }

  // Collect every External capacity name across the team.
  const capacities = new Map(); // attribute -> { cluster, coreDimension, present, total }
  for (const p of withAttrs) {
    for (const a of p.attr78) {
      // External only. The three External clusters are Heart, Hand, Head, which roll
      // up to Empathy, Practical Thinking, Systems Judgment. Internal clusters are skipped.
      if (!EXTERNAL_CORE.includes(a.coreDimension)) continue;
      if (!capacities.has(a.attribute)) {
        capacities.set(a.attribute, { attribute: a.attribute, cluster: a.cluster, coreDimension: a.coreDimension, present: 0, total: 0 });
      }
      const c = capacities.get(a.attribute);
      c.total += 1;
      if (isPresent(a.rawScore)) c.present += 1;
    }
  }

  const gaps = [];
  for (const c of capacities.values()) {
    const share = c.total > 0 ? c.present / c.total : 0;
    if (share < TEAM_GAP_LINE) {
      gaps.push({
        capacity: c.attribute,
        cluster: c.cluster,
        coreDimension: c.coreDimension,
        presentCount: c.present,
        readCount: c.total,
        sharePresent: Math.round(share * 100),
        status: "signal",
        note: "possible team gap, confirm the role needs this and no one covers it",
      });
    }
  }
  gaps.sort((x, y) => x.sharePresent - y.sharePresent);

  return {
    ran: true,
    external_only: true,
    teamSize: team.length,
    readCount: withAttrs.length,
    capacitiesChecked: capacities.size,
    presenceBar: CLARITY_LOW,
    linePct: TEAM_GAP_LINE * 100,
    gaps,
  };
}
