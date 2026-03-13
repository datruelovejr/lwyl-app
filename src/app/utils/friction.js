import { normBias } from "../constants/data";

export function calculateFriction(personA, personB) {
  const dims = ["D", "I", "S", "C"];

  const discGaps = dims.map(d => {
    const aScore = personA.disc.natural[d];
    const bScore = personB.disc.natural[d];
    const gap = Math.abs(aScore - bScore);
    const tier = gap >= 40 ? "high" : gap >= 20 ? "moderate" : "low";
    return { dim: d, gap, tier, aScore, bScore };
  });

  const preferenceScore = discGaps.reduce((sum, g) => {
    if (g.tier === "high") return sum + 3;
    if (g.tier === "moderate") return sum + 1;
    return sum;
  }, 0);

  const valDims = ["Aesthetic", "Economic", "Individualistic", "Political", "Altruistic", "Regulatory", "Theoretical"];
  const valGaps = valDims.map(v => {
    const aScore = personA.values[v] || 0;
    const bScore = personB.values[v] || 0;
    const gap = Math.abs(aScore - bScore);
    const tier = gap >= 40 ? "high" : gap >= 20 ? "moderate" : "low";
    return { dim: v, gap, tier, aScore, bScore };
  });
  const passionScore = valGaps.reduce((sum, g) => {
    if (g.tier === "high") return sum + 3;
    if (g.tier === "moderate") return sum + 1;
    return sum;
  }, 0);
  const aTopVals = Object.entries(personA.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const bTopVals = Object.entries(personB.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const sharedVals = aTopVals.filter(v => bTopVals.includes(v));
  const aOnlyVals = aTopVals.filter(v => !bTopVals.includes(v));
  const bOnlyVals = bTopVals.filter(v => !aTopVals.includes(v));

  const processBiasScore = (aBias, bBias) => {
    if ((aBias === "+" && bBias === "\u2212") || (aBias === "\u2212" && bBias === "+")) return { resultType: "conflict", score: 3 };
    if (aBias === bBias) return { resultType: "aligned", score: 0 };
    return { resultType: "tension", score: 1 };
  };
  const processGapScore = (gap) => {
    if (gap >= 4.0) return { resultType: "conflict", score: 3 };
    if (gap >= 2.0) return { resultType: "tension", score: 1 };
    return { resultType: "aligned", score: 0 };
  };

  const processResults = ["Heart", "Hand", "Head"].map(attrLabel => {
    const aAttr = personA.attr.ext.find(a => a.label === attrLabel);
    const bAttr = personB.attr.ext.find(a => a.label === attrLabel);
    if (!aAttr || !bAttr) return { label: attrLabel, resultType: "aligned", score: 0, aBias: "=", bBias: "=", aScore: 0, bScore: 0, scoreGap: 0, driver: "bias" };
    const aBias = normBias(aAttr.bias);
    const bBias = normBias(bAttr.bias);
    const biasResult = processBiasScore(aBias, bBias);
    const scoreGap = Math.abs(aAttr.score - bAttr.score);
    const gapResult = processGapScore(scoreGap);
    const useGap = gapResult.score > biasResult.score;
    const final = useGap ? gapResult : biasResult;
    return { label: attrLabel, ...final, aBias, bBias, aScore: aAttr.score, bScore: bAttr.score, scoreGap, driver: useGap ? "gap" : "bias" };
  });

  const processScore = processResults.reduce((sum, r) => sum + r.score, 0);

  const internalResults = ["Self-Esteem", "Role Awareness", "Self-Direction"].map(attrName => {
    const aAttr = personA.attr.int.find(a => a.name === attrName);
    const bAttr = personB.attr.int.find(a => a.name === attrName);
    if (!aAttr || !bAttr) return { name: attrName, resultType: "aligned", score: 0, aBias: "=", bBias: "=", aScore: 0, bScore: 0, scoreGap: 0, driver: "bias" };
    const aBias = normBias(aAttr.bias);
    const bBias = normBias(bAttr.bias);
    const biasResult = processBiasScore(aBias, bBias);
    const scoreGap = Math.abs(aAttr.score - bAttr.score);
    const gapResult = processGapScore(scoreGap);
    const useGap = gapResult.score > biasResult.score;
    const final = useGap ? gapResult : biasResult;
    return { name: attrName, ...final, aBias, bBias, aScore: aAttr.score, bScore: bAttr.score, scoreGap, driver: useGap ? "gap" : "bias" };
  });

  const internalScore = internalResults.reduce((sum, r) => sum + r.score, 0);

  const totalScore = preferenceScore + passionScore + processScore + internalScore;
  const tier = totalScore >= 12 ? "high" : totalScore >= 6 ? "moderate" : "low";

  return {
    preferenceScore,
    passionScore,
    processScore,
    internalScore,
    totalScore,
    tier,
    discGaps,
    valuesDetail: { shared: sharedVals, aOnly: aOnlyVals, bOnly: bOnlyVals, valGaps },
    processResults,
    internalResults
  };
}
