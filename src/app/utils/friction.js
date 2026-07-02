import { normBias } from "../constants/data";
import { highValues } from "./bands";

/**
 * FRICTION CALCULATION — SINGLE SOURCE OF TRUTH
 *
 * Based on validated methodology from Friction Audit SKILL.md
 *
 * KEY RULES:
 * 1. Preference Friction = sum of Natural DISC gaps (CONFIRMED data)
 * 2. Passion Friction = sum of Values gaps (SIGNAL — calculable but framed as investigation)
 * 3. Process Friction = External Attributes with BOTH score gap AND bias comparison
 * 4. Internal Impact Friction = Internal Attributes (SEPARATE construct from External)
 * 5. NO composite score combining all dimensions
 * 6. Each dimension gets its own tier
 *
 * THRESHOLDS:
 * - Preference/Passion: 0-39 Low, 40-79 Moderate, 80-139 High, 140+ Significant
 * - Process/Internal per-dimension: gap >= 4.0 High, gap >= 2.0 Moderate, else Low
 * - Bias: (+) vs (-) = Conflict, mixed = Tension, same = Aligned
 */

// Tier calculation for Preference and Passion (total gap points)
function getTier(totalGap) {
  if (totalGap >= 140) return "significant";
  if (totalGap >= 80) return "high";
  if (totalGap >= 40) return "moderate";
  return "low";
}

// Per-dimension tier for DISC/Values
function getDimensionTier(gap) {
  if (gap >= 40) return "high";
  if (gap >= 20) return "moderate";
  return "low";
}

// Bias comparison for Process/Internal
function compareBias(aBias, bBias) {
  const a = normBias(aBias);
  const b = normBias(bBias);
  if ((a === "+" && b === "−") || (a === "−" && b === "+")) {
    return { result: "conflict", severity: "high" };
  }
  if (a === b) {
    return { result: "aligned", severity: "low" };
  }
  return { result: "tension", severity: "moderate" };
}

// Score gap tier for Process/Internal (0-10 scale)
function getScoreGapTier(gap) {
  if (gap >= 4.0) return "high";
  if (gap >= 2.0) return "moderate";
  return "low";
}

// Take the more severe result
function severityRank(severity) {
  if (severity === "high" || severity === "conflict") return 3;
  if (severity === "moderate" || severity === "tension") return 2;
  return 1;
}

export function calculateFriction(personA, personB) {
  // ============================================================
  // PREFERENCE FRICTION — CONFIRMED
  // Sum of Natural DISC gaps between two people
  // ============================================================
  const dims = ["D", "I", "S", "C"];
  const discGaps = dims.map(d => {
    const aScore = personA.disc?.natural?.[d] || 0;
    const bScore = personB.disc?.natural?.[d] || 0;
    const gap = Math.abs(aScore - bScore);
    return { dim: d, gap, tier: getDimensionTier(gap), aScore, bScore };
  });

  const preferenceGap = discGaps.reduce((sum, g) => sum + g.gap, 0);
  const preferenceTier = getTier(preferenceGap);

  // ============================================================
  // PASSION FRICTION — SIGNAL
  // Sum of Values gaps (calculable, but framed as investigation)
  // ============================================================
  const valDims = ["Aesthetic", "Economic", "Individualistic", "Political", "Altruistic", "Regulatory", "Theoretical"];
  const valGaps = valDims.map(v => {
    const aScore = personA.values?.[v] || 0;
    const bScore = personB.values?.[v] || 0;
    const gap = Math.abs(aScore - bScore);
    return { dim: v, gap, tier: getDimensionTier(gap), aScore, bScore };
  });

  const passionGap = valGaps.reduce((sum, g) => sum + g.gap, 0);
  const passionTier = getTier(passionGap);

  // Top values analysis.
  // Read the instrument's stored grade (band), never the old flat 60 cutoff. If a
  // person carries no grades, fall back to the legacy cutoff so the read still runs,
  // but that fallback is the exception, not the rule.
  const aHigh = highValues(personA.valuesBands);
  const bHigh = highValues(personB.valuesBands);
  const aTopVals = aHigh !== null ? aHigh : Object.entries(personA.values || {}).filter(([, s]) => s >= 60).map(([k]) => k);
  const bTopVals = bHigh !== null ? bHigh : Object.entries(personB.values || {}).filter(([, s]) => s >= 60).map(([k]) => k);
  const sharedVals = aTopVals.filter(v => bTopVals.includes(v));
  const aOnlyVals = aTopVals.filter(v => !bTopVals.includes(v));
  const bOnlyVals = bTopVals.filter(v => !aTopVals.includes(v));

  // ============================================================
  // PROCESS FRICTION — EXTERNAL ATTRIBUTES
  // Both score gap AND bias comparison required
  // Take the more severe result per dimension
  // ============================================================
  const extLabels = [
    { label: "Heart", name: "Empathy" },
    { label: "Hand", name: "Practical Thinking" },
    { label: "Head", name: "Systems Judgment" }
  ];

  const processResults = extLabels.map(({ label, name }) => {
    const aAttr = personA.attr?.ext?.find(a => a.label === label);
    const bAttr = personB.attr?.ext?.find(a => a.label === label);

    if (!aAttr || !bAttr) {
      return { label, name, tier: "low", result: "aligned", aBias: "=", bBias: "=", aScore: 0, bScore: 0, scoreGap: 0, driver: "none" };
    }

    const aBias = normBias(aAttr.bias);
    const bBias = normBias(bAttr.bias);
    const biasResult = compareBias(aBias, bBias);

    const scoreGap = Math.abs(aAttr.score - bAttr.score);
    const gapTier = getScoreGapTier(scoreGap);

    // Take the more severe
    const useBias = severityRank(biasResult.severity) >= severityRank(gapTier);
    const finalTier = useBias ? biasResult.severity : gapTier;
    const finalResult = useBias ? biasResult.result : (gapTier === "high" ? "gap-conflict" : gapTier === "moderate" ? "gap-tension" : "aligned");

    return {
      label,
      name,
      tier: finalTier,
      result: finalResult,
      aBias,
      bBias,
      aScore: aAttr.score,
      bScore: bAttr.score,
      scoreGap,
      driver: useBias ? "bias" : "gap"
    };
  });

  // Overall process tier = worst of the three
  const processTier = processResults.reduce((worst, r) => {
    return severityRank(r.tier) > severityRank(worst) ? r.tier : worst;
  }, "low");

  // ============================================================
  // INTERNAL IMPACT FRICTION — SEPARATE CONSTRUCT
  // Same logic as External, but kept separate per I/O Psychology
  // ============================================================
  const intNames = ["Self-Esteem", "Role Awareness", "Self-Direction"];

  const internalResults = intNames.map(name => {
    const aAttr = personA.attr?.int?.find(a => a.name === name);
    const bAttr = personB.attr?.int?.find(a => a.name === name);

    if (!aAttr || !bAttr) {
      return { name, tier: "low", result: "aligned", aBias: "=", bBias: "=", aScore: 0, bScore: 0, scoreGap: 0, driver: "none" };
    }

    const aBias = normBias(aAttr.bias);
    const bBias = normBias(bAttr.bias);
    const biasResult = compareBias(aBias, bBias);

    const scoreGap = Math.abs(aAttr.score - bAttr.score);
    const gapTier = getScoreGapTier(scoreGap);

    // Take the more severe
    const useBias = severityRank(biasResult.severity) >= severityRank(gapTier);
    const finalTier = useBias ? biasResult.severity : gapTier;
    const finalResult = useBias ? biasResult.result : (gapTier === "high" ? "gap-conflict" : gapTier === "moderate" ? "gap-tension" : "aligned");

    return {
      name,
      tier: finalTier,
      result: finalResult,
      aBias,
      bBias,
      aScore: aAttr.score,
      bScore: bAttr.score,
      scoreGap,
      driver: useBias ? "bias" : "gap"
    };
  });

  // Overall internal tier = worst of the three
  const internalTier = internalResults.reduce((worst, r) => {
    return severityRank(r.tier) > severityRank(worst) ? r.tier : worst;
  }, "low");

  // ============================================================
  // RETURN — SEPARATE TIERS, NO COMPOSITE
  // ============================================================
  return {
    // PREFERENCE — CONFIRMED (this is THE friction tier for labeling)
    preference: {
      gap: preferenceGap,
      tier: preferenceTier,
      details: discGaps
    },

    // PASSION — SIGNAL (calculable, but framed as investigation)
    passion: {
      gap: passionGap,
      tier: passionTier,
      details: valGaps,
      topValues: { shared: sharedVals, aOnly: aOnlyVals, bOnly: bOnlyVals }
    },

    // PROCESS — EXTERNAL ATTRIBUTES
    process: {
      tier: processTier,
      details: processResults
    },

    // INTERNAL — SEPARATE CONSTRUCT
    internal: {
      tier: internalTier,
      details: internalResults
    },

    // PRIMARY TIER — Based on Preference (CONFIRMED data)
    // This is what UI should use for "High Friction" / "Moderate" / "Low" labels
    tier: preferenceTier,

    // DEPRECATED — kept for backward compatibility during migration
    // TODO: Remove after all components updated
    totalScore: null,
    preferenceScore: null,
    passionScore: null,
    processScore: null,
    internalScore: null,
    discGaps,
    valuesDetail: { shared: sharedVals, aOnly: aOnlyVals, bOnly: bOnlyVals, valGaps },
    processResults,
    internalResults
  };
}

/**
 * GROUND TRUTH TEST
 * Daniel vs. Sareya = 236 points = Significant
 * Daniel Natural: D=81, I=99, S=46, C=25
 * Sareya Natural: D=11, I=60, S=99, C=99
 * Calculation: |81-11| + |99-60| + |46-99| + |25-99| = 70 + 39 + 53 + 74 = 236
 *
 * If this function returns anything different, the calculation is wrong.
 */
export function testGroundTruth() {
  const daniel = {
    disc: { natural: { D: 81, I: 99, S: 46, C: 25 } },
    values: {},
    attr: { ext: [], int: [] }
  };
  const sareya = {
    disc: { natural: { D: 11, I: 60, S: 99, C: 99 } },
    values: {},
    attr: { ext: [], int: [] }
  };

  const result = calculateFriction(daniel, sareya);
  const expected = 236;
  const actual = result.preference.gap;

  if (actual !== expected) {
    console.error(`GROUND TRUTH FAILED: Expected ${expected}, got ${actual}`);
    return false;
  }

  console.log(`GROUND TRUTH PASSED: Daniel vs Sareya = ${actual} points = ${result.preference.tier}`);
  return true;
}
