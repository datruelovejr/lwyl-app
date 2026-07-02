/**
 * SAME-POLE FRICTION — Competition and Whose-standard-wins
 *
 * These two reads fire when two people are BOTH high on the same thing, which the
 * old distance-only engine could never see. Distance goes quiet when two people
 * sit close, but close is not always calm. Both high, they fight over one scarce
 * thing (Competition) or over whose way is right (Whose-standard-wins).
 *
 * STATUS: both are SIGNALS, never confirmed, per the methodology.
 *  - Competition waits on a scarce-and-shared check (is the one thing really shared).
 *  - Whose-standard waits on a standards-differ check (do their two versions of right
 *    actually differ). Same high band with the same standard is alignment, not friction.
 * We do not have those confirmation inputs in the data yet, so every hit here is
 * labeled "possible" and routed as a thing to look into, not a verdict.
 *
 * BAND, NOT CUTOFF: the both-high gate reads the instrument's stored grade. If a
 * grade is missing, that dimension is marked blocked and named, never guessed.
 *
 * Source of truth: methodology/friction/engine-specs/competition.md and whose-standard.md,
 * and 03-operators.md for the weights and the intensity ladder.
 */

import { discTier, valueTier } from "./bands.js";

// Intensity from the weaker contender's grade, kept on the instrument's own ladder.
// The top grade reads strong, the lower high-band grade reads moderate. This knows
// both vocabularies: Values (High, Very High) and DISC (Moderately High, Very High).
function intensityFromGrade(aGrade, bGrade) {
  const rank = { "High": 1, "Moderately High": 1, "Very High": 2 };
  const a = rank[aGrade] || 0;
  const b = rank[bGrade] || 0;
  const weaker = Math.min(a, b);
  return weaker >= 2 ? "strong" : "moderate";
}

// COMPETITION routing. Which dimensions compete over a scarce unit, and how hard.
// full = primary scarce unit. reduced = soft signal. Economic is off unless a shared
// pool is confirmed, so it is not listed here.
const COMPETITION_DISC = { D: "full", I: "reduced" };
const COMPETITION_VALUES = { Political: "full", Individualistic: "reduced" }; // Political = the one leadership seat

// WHOSE-STANDARD routing. Quality dimensions where both-high means a clash over whose
// version of right governs.
const WHOSE_STANDARD_DISC = { C: "quality" }; // the correct process
const WHOSE_STANDARD_VALUES = {
  Regulatory: "order",
  Aesthetic: "form",
  Economic: "the efficient path",
  Political: "the right way to lead", // Political is dual-source, seat competes, right-way is whose-standard
};

export function calculateSamePole(personA, personB) {
  const aDisc = personA.discBands || null;
  const bDisc = personB.discBands || null;
  const aVal = personA.valuesBands || null;
  const bVal = personB.valuesBands || null;

  const competition = [];
  const whoseStandard = [];
  const blocked = [];

  // ---- DISC competition ----
  for (const dim of Object.keys(COMPETITION_DISC)) {
    const at = discTier(aDisc, dim);
    const bt = discTier(bDisc, dim);
    if (at === null || bt === null) { blocked.push({ source: "competition", instrument: "DISC", dim, why: "grade missing" }); continue; }
    if (at === "high" && bt === "high") {
      competition.push({
        instrument: "DISC", dim, weight: COMPETITION_DISC[dim],
        intensity: intensityFromGrade(aDisc[dim], bDisc[dim]),
        aGrade: aDisc[dim], bGrade: bDisc[dim],
        status: "signal", note: "possible, confirm the one thing is really shared",
      });
    }
  }

  // ---- Values competition ----
  for (const dim of Object.keys(COMPETITION_VALUES)) {
    const at = valueTier(aVal, dim);
    const bt = valueTier(bVal, dim);
    if (at === null || bt === null) { blocked.push({ source: "competition", instrument: "Values", dim, why: "grade missing" }); continue; }
    if (at === "high" && bt === "high") {
      competition.push({
        instrument: "Values", dim, weight: COMPETITION_VALUES[dim],
        intensity: intensityFromGrade(aVal[dim], bVal[dim]),
        aGrade: aVal[dim], bGrade: bVal[dim],
        status: "signal", note: dim === "Political" ? "the one leadership seat, confirm it is shared" : "possible, confirm the one thing is really shared",
      });
    }
  }

  // ---- DISC whose-standard ----
  for (const dim of Object.keys(WHOSE_STANDARD_DISC)) {
    const at = discTier(aDisc, dim);
    const bt = discTier(bDisc, dim);
    if (at === null || bt === null) { blocked.push({ source: "whose-standard", instrument: "DISC", dim, why: "grade missing" }); continue; }
    if (at === "high" && bt === "high") {
      whoseStandard.push({
        instrument: "DISC", dim, about: WHOSE_STANDARD_DISC[dim],
        aGrade: aDisc[dim], bGrade: bDisc[dim],
        status: "signal", note: "possible, confirm the two standards actually differ",
      });
    }
  }

  // ---- Values whose-standard ----
  for (const dim of Object.keys(WHOSE_STANDARD_VALUES)) {
    const at = valueTier(aVal, dim);
    const bt = valueTier(bVal, dim);
    if (at === null || bt === null) { blocked.push({ source: "whose-standard", instrument: "Values", dim, why: "grade missing" }); continue; }
    if (at === "high" && bt === "high") {
      whoseStandard.push({
        instrument: "Values", dim, about: WHOSE_STANDARD_VALUES[dim],
        aGrade: aVal[dim], bGrade: bVal[dim],
        status: "signal", note: "possible, confirm the two standards actually differ",
      });
    }
  }

  return {
    competition,      // list of possible scarce-unit fights, all signals
    whoseStandard,    // list of possible whose-way-is-right clashes, all signals
    blocked,          // dimensions we could not read because a grade was missing
    ran: aDisc !== null || aVal !== null, // false only when this person carries no grades at all
  };
}
