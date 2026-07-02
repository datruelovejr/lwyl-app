/**
 * ATTRIBUTE CLARITY TIERS — the locked bar for reading the 0-to-10 attribute scale.
 *
 * From the capability method, Stage 00, section 4, approved:
 *   8.0 to 10 reads HIGH   (a real talent, high clarity)
 *   6.5 to 7.9 reads MIDDLE
 *   below 6.5 reads LOW    (a blind spot on its own, neutral until the role demands it)
 *
 * This is an honest interim stand-in, not a final per-attribute band. The moment
 * Innermetrix per-attribute norms load, we swap these tiers for the norms. Until then
 * these tiers come straight from the IMX training material, never invented here.
 *
 * We always read score WITH bias. Plus is overvalue, minus is undervalue, equal is
 * balanced. Two people can share a score and hold opposite biases.
 */

export const CLARITY_HIGH = 8.0;   // at or above is a talent
export const CLARITY_LOW = 6.5;    // below is low, a blind spot

/** Tier for one attribute score. Returns "high" | "middle" | "low" | null. */
export function attrTier(score) {
  if (score == null) return null;
  if (score >= CLARITY_HIGH) return "high";
  if (score >= CLARITY_LOW) return "middle";
  return "low";
}

/** A talent, high clarity. This is what the Own move reads. */
export function isTalent(score) {
  return attrTier(score) === "high";
}

/** A blind spot, low clarity. This is the co-suppression input for coverage-gap. */
export function isLow(score) {
  return attrTier(score) === "low";
}

/** Present means not a blind spot, middle or high. Used for the team coverage bar. */
export function isPresent(score) {
  const t = attrTier(score);
  return t === "high" || t === "middle";
}

export function normBiasChar(b) {
  return b === "-" ? "−" : b; // normalize hyphen to the stored minus sign
}
