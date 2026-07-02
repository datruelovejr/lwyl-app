/**
 * BAND READ — SINGLE SOURCE OF TRUTH FOR HIGH AND LOW
 *
 * The methodology rule, absolute:
 * Every high and low call uses the instrument's own validated band, per dimension,
 * never a flat cutoff. A 53 can be High on one value and a 61 Average on another.
 * The band is what the instrument returned, stored on the person. We read it, we do
 * not recompute it. If a band is missing, we return null and say missing. We never guess.
 *
 * This module retires the flat valLevel / ">= 60" / ">= 70" cutoffs for any high-low
 * decision. Those cutoffs stay only where a raw number is displayed, never to judge
 * high or low.
 *
 * The instrument bands, as stored in the database:
 *   DISC bands (6):  Very Low, Moderately Low, Low Average, High Average, Moderately High, Very High
 *   Values bands (5): Very Low, Low, Average, High, Very High
 */

// DISC label -> tier
const DISC_BAND_TIER = {
  "Very High": "high",
  "Moderately High": "high",
  "High Average": "average",
  "Low Average": "average",
  "Moderately Low": "low",
  "Very Low": "low",
};

// Values label -> tier
const VALUES_BAND_TIER = {
  "Very High": "high",
  "High": "high",
  "Average": "average",
  "Low": "low",
  "Very Low": "low",
};

/**
 * Read the tier for one DISC dimension from the stored band.
 * @param {Object} discBands - e.g. { D: "Very High", I: "Low Average", ... }
 * @param {string} dim - "D" | "I" | "S" | "C"
 * @returns {"high"|"average"|"low"|null} null when the band is missing
 */
export function discTier(discBands, dim) {
  const label = discBands?.[dim];
  if (!label) return null;
  return DISC_BAND_TIER[label] ?? null;
}

/**
 * Read the tier for one Values dimension from the stored band.
 * @param {Object} valuesBands - e.g. { Aesthetic: "High", Economic: "Very Low", ... }
 * @param {string} dim - a value name, e.g. "Political"
 * @returns {"high"|"average"|"low"|null} null when the band is missing
 */
export function valueTier(valuesBands, dim) {
  const label = valuesBands?.[dim];
  if (!label) return null;
  return VALUES_BAND_TIER[label] ?? null;
}

/** True only when the stored band puts this DISC dimension in the high band. */
export function isDiscHigh(discBands, dim) {
  return discTier(discBands, dim) === "high";
}

/** True only when the stored band puts this Values dimension in the high band. */
export function isValueHigh(valuesBands, dim) {
  return valueTier(valuesBands, dim) === "high";
}

/**
 * The list of value names the person is HIGH on, read from the stored band.
 * This is the band-correct replacement for the old ".filter(s => s >= 60)".
 * Returns null when bands are missing, so callers can say "bands not loaded"
 * instead of silently falling back to a flat cutoff.
 */
export function highValues(valuesBands) {
  if (!valuesBands || Object.keys(valuesBands).length === 0) return null;
  return Object.keys(valuesBands).filter((v) => VALUES_BAND_TIER[valuesBands[v]] === "high");
}

/** The list of DISC dimensions the person is HIGH on, read from the stored band. */
export function highDiscDims(discBands) {
  if (!discBands || Object.keys(discBands).length === 0) return null;
  return ["D", "I", "S", "C"].filter((d) => DISC_BAND_TIER[discBands[d]] === "high");
}

/**
 * Same-pole gate helper. Two people are co-elevated on a dimension when BOTH
 * stored bands read high. This is the precondition for Competition and
 * Whose-standard-wins. Returns false if either band is missing, since we
 * never guess a high.
 */
export function bothHighDisc(aBands, bBands, dim) {
  return isDiscHigh(aBands, dim) && isDiscHigh(bBands, dim);
}

export function bothHighValue(aBands, bBands, dim) {
  return isValueHigh(aBands, dim) && isValueHigh(bBands, dim);
}

/** Both stored bands read low. Used for the co-suppression (coverage-gap) precondition. */
export function bothLowDisc(aBands, bBands, dim) {
  return discTier(aBands, dim) === "low" && discTier(bBands, dim) === "low";
}

export const _tables = { DISC_BAND_TIER, VALUES_BAND_TIER };
