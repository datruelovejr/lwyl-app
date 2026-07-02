/**
 * STRENGTHS LAYER — the four moves: Own, Create Systems, Delegate, Hire
 *
 * Friction maps what clashes and what is missing. This adds the positive read. It
 * names what a person is built to own.
 *
 * OWN comes first. A high-clarity External talent is work the person should hold,
 * because that is where they produce the most with the least strain. The other three
 * moves cover what they lack: Create Systems, Delegate, Hire.
 *
 * EXTERNAL ONLY for the four moves. Internal attributes (Self-Esteem, Role Awareness,
 * Self-Direction) never route to a move. You cannot hire or delegate a person's
 * self-concept. Internal routes to development and retention, and we return it in a
 * separate place so no screen ever sends it to a move.
 *
 * STATUS: SIGNAL. Own becomes a confirmed "own this task" call only against a role
 * demand, which we do not have yet. So Own is a strong signal, not an assignment.
 * The pick among Create Systems, Delegate, and Hire also needs the role demand and,
 * for Delegate, a teammate who carries the talent.
 *
 * Reads the locked clarity tiers from attr-tiers.js, always with bias.
 * Source of truth: methodology/capability/00-scope-definitions/00-definitions.md.
 */

import { attrTier, isTalent, isLow, normBiasChar } from "./attr-tiers.js";

const EXTERNAL_CORE = ["Empathy", "Practical Thinking", "Systems Judgment"];
const INTERNAL_CORE = ["Self-Esteem", "Role Awareness", "Self-Direction"];

// Which core dimensions are External. The 78 carry a coreDimension per row.
function isExternalCore(coreName) {
  return EXTERNAL_CORE.includes(coreName);
}

/**
 * Read one person's strengths and gaps.
 * Prefers the full 78 (person.attr78). Falls back to the three External rollups
 * (person.attr.ext) when the 78 are not captured, and says which read it used.
 *
 * @returns {
 *   readFrom: "78" | "rollups" | "none",
 *   own:   [{ attribute, score, bias, coreDimension }]  high-clarity External talents
 *   gaps:  [{ attribute, score, bias, coreDimension }]  low External capacities to cover
 *   internal: [{ attribute, score, bias, tier }]        routed to development, never a move
 *   status: "signal"
 * }
 */
export function personStrengths(person) {
  // Path 1: the full 78.
  if (Array.isArray(person.attr78) && person.attr78.length > 0) {
    const own = [];
    const gaps = [];
    const internal = [];
    // The 78 rows do not carry a per-attribute bias in the data. Bias is stored at
    // the core-dimension rollup. So we always read score WITH bias, using the rollup
    // bias for the capacity's core dimension, and we label it dimension-level so no
    // screen implies a per-attribute bias we do not have. We never guess a bias.
    const extBias = {};
    for (const r of (person.attr?.ext || [])) extBias[r.name] = normBiasChar(r.bias);
    for (const a of person.attr78) {
      const tier = attrTier(a.rawScore);
      if (isExternalCore(a.coreDimension)) {
        const bias = a.coreDimension in extBias ? extBias[a.coreDimension] : null;
        if (tier === "high") own.push({ attribute: a.attribute, score: a.rawScore, bias, biasSource: "core-dimension", coreDimension: a.coreDimension, rank: a.rank });
        else if (tier === "low") gaps.push({ attribute: a.attribute, score: a.rawScore, bias, biasSource: "core-dimension", coreDimension: a.coreDimension, rank: a.rank });
      } else {
        // Internal. Never a move. Kept for the personal and retention read only.
        internal.push({ attribute: a.attribute, score: a.rawScore, tier, coreDimension: a.coreDimension });
      }
    }
    own.sort((x, y) => y.score - x.score);
    gaps.sort((x, y) => x.score - y.score);
    return { readFrom: "78", own, gaps, internal, status: "signal" };
  }

  // Path 2: fall back to the three External rollups with bias.
  if (Array.isArray(person.attr?.ext) && person.attr.ext.length > 0) {
    const own = [];
    const gaps = [];
    for (const a of person.attr.ext) {
      const tier = attrTier(a.score);
      if (tier === "high") own.push({ attribute: a.name, score: a.score, bias: normBiasChar(a.bias), coreDimension: a.name });
      else if (tier === "low") gaps.push({ attribute: a.name, score: a.score, bias: normBiasChar(a.bias), coreDimension: a.name });
    }
    const internal = (person.attr?.int || []).map((a) => ({ attribute: a.name, score: a.score, tier: attrTier(a.score), bias: normBiasChar(a.bias) }));
    own.sort((x, y) => y.score - x.score);
    gaps.sort((x, y) => x.score - y.score);
    return { readFrom: "rollups", own, gaps, internal, status: "signal" };
  }

  return { readFrom: "none", own: [], gaps: [], internal: [], status: "signal" };
}

/**
 * For each External gap a person has, pick the move.
 * Delegate when a named teammate carries that capacity as a talent (their score is high).
 * Otherwise the move is Create Systems or Hire, which needs the role demand to settle,
 * so we return it as "create-systems-or-hire" rather than guessing between them.
 *
 * Cross-person picks compare SCORE, per the rank-versus-score rule. Rank orders a person
 * against themselves. Score is the only number that compares people.
 */
export function routeGapsForPerson(person, team) {
  const { gaps } = personStrengths(person);
  const others = (team || []).filter((p) => p.id !== person.id);

  return gaps.map((gap) => {
    // Find teammates who hold this capacity as a talent. Compare by score.
    const carriers = [];
    for (const mate of others) {
      const s = mateScoreFor(mate, gap);
      if (s != null && isTalent(s)) carriers.push({ id: mate.id, name: mate.name, score: s });
    }
    carriers.sort((a, b) => b.score - a.score);
    return {
      capacity: gap.attribute,
      coreDimension: gap.coreDimension,
      yourScore: gap.score,
      move: carriers.length > 0 ? "delegate" : "create-systems-or-hire",
      delegateTo: carriers.length > 0 ? carriers[0] : null,
      otherCarriers: carriers.slice(1),
      status: "signal",
      note: carriers.length > 0
        ? "a teammate already carries this, confirm the role needs it, then hand it off"
        : "no teammate carries this, build a system or hire, confirm the role needs it first",
    };
  });
}

// Look up a teammate's score for a capacity, from the 78 first, then the rollups.
function mateScoreFor(mate, gap) {
  if (Array.isArray(mate.attr78) && mate.attr78.length > 0) {
    const row = mate.attr78.find((a) => a.attribute === gap.attribute);
    if (row) return row.rawScore;
  }
  const roll = mate.attr?.ext?.find((a) => a.name === gap.coreDimension);
  return roll ? roll.score : null;
}
