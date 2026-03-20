// ── Narrative Engine ────────────────────────────────────────────
// Translates raw assessment scores into coach-ready language.
// Every function returns plain-language strings a coach can hand
// directly to a client without interpreting DISC theory themselves.
//
// Used by: LeaderInsights, TeamInsights, RetentionRisk, BridgeWizard

import { discInsights, valuesInsights, attrExtInsights, attrIntInsights } from "./assessmentInsights";
import { discFull } from "../constants/data";

// ── DISC Score Narratives ──────────────────────────────────────
// Takes a DISC dimension + score, returns a plain-language sentence
// a coach can read to understand the person without knowing DISC.

const discLevel = (s) => s >= 70 ? "high" : s >= 40 ? "mod" : "low";

export function getDiscNarrative(dim, score) {
  const level = discLevel(score);
  const insight = discInsights[dim]?.[level];
  if (!insight) return null;

  const levelLabel = score >= 70 ? "High" : score >= 40 ? "Moderate" : "Low";
  const dimNames = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };

  // Short behavioral sentence (not the full paragraph)
  const shortDesc = {
    D: {
      high: "drives toward results, makes decisions quickly, and pushes through obstacles",
      mod: "balances assertiveness with cooperation -- pushes when needed, steps back when appropriate",
      low: "builds consensus, includes others, and creates space for every voice in the room"
    },
    I: {
      high: "leads with energy, enthusiasm, and relational connection",
      mod: "connects with people when needed but doesn't rely on charm alone",
      low: "leads with substance and follow-through over social energy"
    },
    S: {
      high: "creates stability, consistency, and a predictable environment others can count on",
      mod: "adapts to both stable and changing environments without losing footing",
      low: "thrives on change, variety, and forward movement"
    },
    C: {
      high: "leads with precision, thoroughness, and high standards",
      mod: "balances quality with pragmatism -- rigorous when it matters, efficient when it doesn't",
      low: "trusts instincts over data and moves fast with incomplete information"
    }
  };

  return {
    short: shortDesc[dim]?.[level] || "",
    full: insight.strength,
    blindSpot: insight.blindSpot,
    underStress: insight.toxicUnderStress,
    environmentCost: insight.environmentCost,
    levelLabel,
  };
}

// ── DISC Gap Narrative ─────────────────────────────────────────
// Explains what an adaptive-natural gap means in human terms.

export function getGapNarrative(dim, natural, adaptive) {
  const gap = adaptive - natural;
  const absGap = Math.abs(gap);
  const dimName = discFull[dim];

  if (absGap < 10) {
    return { severity: "aligned", narrative: `Your ${dimName} is aligned. Your environment isn't asking you to change how you show up here.` };
  }

  const direction = gap > 0 ? "amplifying" : "suppressing";
  const severity = absGap >= 20 ? "significant" : "observable";

  const narratives = {
    D: {
      amplifying: {
        observable: `Your environment is asking you to be more decisive and direct than comes naturally. You're performing authority -- it works short-term but wears on you.`,
        significant: `Your environment demands significantly more assertiveness than you carry naturally. You're spending real energy every day performing a version of leadership that isn't you.`
      },
      suppressing: {
        observable: `Your environment is holding back your natural drive. You're biting your tongue when your instinct says to push forward.`,
        significant: `Your environment is actively caging your leadership instinct. Everything in you wants to drive, and you're being asked to defer. That frustration compounds daily.`
      }
    },
    I: {
      amplifying: {
        observable: `Your environment wants more social energy than you naturally bring. You're turning on charm when you'd rather let the work speak.`,
        significant: `Your environment demands constant social performance. Every interaction requires energy that isn't yours to give freely. The fatigue is real and cumulative.`
      },
      suppressing: {
        observable: `Your environment is suppressing your natural warmth and connection. You're dialing back the relational energy that defines you.`,
        significant: `Your environment doesn't value or reward your relational strength. That isolation drains you in ways that compound over time.`
      }
    },
    S: {
      amplifying: {
        observable: `Your environment wants more patience and steadiness than your natural pace. You're throttling back when you want to move.`,
        significant: `Your environment forces stability on you that fights your wiring. You feel stuck, slowed down, and frustrated by processes built for different people.`
      },
      suppressing: {
        observable: `Your environment pushes you to move faster and tolerate more disruption than feels right. Your need for stability is being treated as a roadblock.`,
        significant: `The constant change and pivots aren't just uncomfortable -- they're costing you the foundation you need to function well.`
      }
    },
    C: {
      amplifying: {
        observable: `Your environment asks for more precision than comes naturally. You're double-checking work your gut already knows is right.`,
        significant: `Your environment demands analytical rigor that fights your operating style. Every report, every checklist costs you energy others don't have to spend.`
      },
      suppressing: {
        observable: `Your environment is suppressing your precision. You're being asked to move fast and accept quality levels that make you uncomfortable.`,
        significant: `Your environment is working against your need for quality. You're shipping work you're not proud of, and that erodes your sense of professional identity.`
      }
    }
  };

  return {
    severity,
    direction,
    absGap,
    narrative: narratives[dim]?.[direction]?.[severity] || `Your ${dimName} is shifting ${absGap} points from natural to adaptive. That's a meaningful daily cost.`
  };
}

// ── Values Narrative ───────────────────────────────────────────
// Translates a values dimension + score into what it means.

export function getValuesNarrative(dimension, score) {
  const isHigh = score >= 60;
  const isLow = score < 40;
  const insight = valuesInsights[dimension];

  if (!insight) return null;

  if (isHigh) {
    return {
      level: "high",
      narrative: insight.high?.strength || "",
      environmentCost: insight.high?.environmentCost || "",
      underStress: insight.high?.toxicUnderStress || "",
    };
  }
  if (isLow) {
    return {
      level: "low",
      narrative: insight.low?.description || "",
      environmentCost: insight.low?.environmentCost || "",
    };
  }
  return {
    level: "moderate",
    narrative: `${dimension} sits in your middle range. It's not what drives you, but it's not absent either. Your environment determines whether this dimension gets activated.`,
    environmentCost: "",
  };
}

// ── Attribute Narrative ────────────────────────────────────────
// Translates external/internal attribute scores + bias into meaning.

export function getExtAttrNarrative(label, score, bias) {
  const normBias = bias === "-" || bias === "\u2212" ? "\u2212" : bias;
  const insight = attrExtInsights[label]?.biasInsights?.[normBias];

  const lensNames = { Heart: "Empathy", Hand: "Practical Thinking", Head: "Systems Judgment" };
  const lensName = lensNames[label] || label;

  const biasWord = normBias === "+" ? "Requires" : normBias === "\u2212" ? "Frustrated" : "Balanced";

  // Plain-language explanation of what this lens IS
  const lensExplanation = {
    Heart: "This is how you read people. It's the emotional intelligence lens -- whether you naturally tune into what others are feeling and factor that into decisions.",
    Hand: "This is how you get things done. It's the practical execution lens -- whether you naturally focus on what's actionable and move toward results.",
    Head: "This is how you see systems. It's the strategic thinking lens -- whether you naturally spot patterns, anticipate consequences, and think in frameworks."
  };

  // Plain-language explanation of what the bias means
  const biasExplanation = {
    Heart: {
      "+": "You lean heavily on emotional data. You need to know how people feel before you can move forward. That's a strength until it slows you down.",
      "\u2212": "You have the capacity for empathy but you're not fully using it right now. Your environment may have taught you that reading people doesn't pay off.",
      "=": "You read people well without being overwhelmed by their emotions. Balanced empathy is a leadership asset."
    },
    Hand: {
      "+": "You need practical results to feel like work matters. Ideas without action plans register as noise to you.",
      "\u2212": "This is the strongest damage signal in the assessment. Your environment has taught you that practical results don't matter. That's worth a direct conversation.",
      "=": "You balance theory and practice well. You can evaluate what works without being enslaved to immediate results."
    },
    Head: {
      "+": "You need logical frameworks to feel confident. You may over-engineer when simplicity would serve better.",
      "\u2212": "You have systems thinking capacity you're not using. Your environment may have taught you that analysis doesn't change outcomes.",
      "=": "You see patterns without being imprisoned by them. You use frameworks without needing everything to fit neatly."
    }
  };

  return {
    lensName,
    biasWord,
    lensExplanation: lensExplanation[label] || "",
    biasExplanation: biasExplanation[label]?.[normBias] || "",
    insight: insight?.insight || "",
    environmentCost: insight?.environmentCost || "",
  };
}

export function getIntAttrNarrative(name, score, bias) {
  const normBias = bias === "-" || bias === "\u2212" ? "\u2212" : bias;
  const insight = attrIntInsights[name]?.biasInsights?.[normBias];

  const biasWord = normBias === "+" ? "Strong" : normBias === "\u2212" ? "Undervaluing" : "Balanced";

  // Plain-language explanation of what this dimension IS
  const dimExplanation = {
    "Self-Esteem": "This is how much you trust your own value. It shows up in whether you advocate for yourself, push back when needed, and trust your own judgment.",
    "Role Awareness": "This is how clearly you understand your role and boundaries. It shows up in whether you know what's yours to carry and what isn't.",
    "Self-Direction": "This is your internal compass. It shows up in whether you know where you're headed and can lead yourself without waiting for someone to point the way."
  };

  return {
    dimName: name,
    biasWord,
    dimExplanation: dimExplanation[name] || "",
    insight: insight?.insight || "",
    environmentCost: insight?.environmentCost || "",
  };
}

// ── Preference Tax Narrative ───────────────────────────────────
// Takes total gap points, returns what that means for the person.

export function getPreferenceTaxNarrative(totalGap, personName) {
  const name = personName?.split(" ")[0] || "This person";

  if (totalGap >= 160) {
    return `${name} is paying a critical adaptation cost every single day. This isn't a motivation problem -- it's a design problem. Their environment is demanding near-maximum behavioral change, and that's unsustainable without intervention.`;
  }
  if (totalGap >= 120) {
    return `${name} is paying a heavy daily cost to fit their environment. The fatigue, the frustration, the sense of performing a version of themselves they didn't choose -- that's not a character flaw. That's a mismatch between who they are and what their environment demands.`;
  }
  if (totalGap >= 80) {
    return `${name} is carrying significant adaptation weight. Two or more aspects of who they are naturally are under sustained pressure. They likely feel it most at the end of the day, when the mask comes off.`;
  }
  if (totalGap >= 40) {
    return `${name} adapts in meaningful ways. Some days feel natural, others feel like swimming upstream. Not urgent, but worth understanding where the cost is highest.`;
  }
  return `${name}'s environment largely fits who they are. That's rare. Worth protecting.`;
}

// ── Team Composition Narrative ─────────────────────────────────
// Takes DISC distribution counts, returns a story about the team.

export function getTeamCompositionNarrative(dimCounts, totalMembers) {
  if (totalMembers < 2) return "";

  const narrativeParts = [];
  const dominant = Object.entries(dimCounts).sort(([, a], [, b]) => b - a);
  const topDim = dominant[0][0];
  const topCount = dominant[0][1];
  const topPct = Math.round((topCount / totalMembers) * 100);

  const missing = dominant.filter(([, c]) => c === 0).map(([d]) => d);

  const dimStories = {
    D: { heavy: "drive results and push decisions", missing: "nobody naturally driving decisions -- the team may stall when boldness is needed" },
    I: { heavy: "bring energy, optimism, and relational connection", missing: "nobody naturally building the relational glue -- trust may be assumed rather than actively built" },
    S: { heavy: "provide stability, consistency, and patience", missing: "nobody naturally anchoring the team -- change may happen faster than people can absorb" },
    C: { heavy: "bring precision, thoroughness, and quality", missing: "nobody naturally catching details -- the team may move fast but miss what matters" },
  };

  if (topPct >= 50) {
    narrativeParts.push(`Your team leans heavily ${discFull[topDim]} -- ${topPct}% of your people naturally ${dimStories[topDim].heavy}. That's a strength when the situation calls for it, but it also means the team may struggle with the opposite.`);
  }

  if (missing.length > 0) {
    const missingStories = missing.map(d => dimStories[d].missing);
    narrativeParts.push(`You're missing ${missing.map(d => discFull[d]).join(" and ")} representation. That means ${missingStories.join(". And ")}.`);
  }

  if (narrativeParts.length === 0) {
    narrativeParts.push("Your team has representation across all four behavioral styles. That's a balanced foundation. The friction will come from the gaps between individuals, not from what the team is missing.");
  }

  return narrativeParts.join(" ");
}

// ── Bridge Wizard Friction Narrative ───────────────────────────
// Translates raw DISC gap into human terms for the Bridge Wizard.
// No raw scores -- just behavioral descriptions.

export function getBridgeFrictionNarrative(dim, leaderScore, personScore, leaderName, personName) {
  const gap = Math.abs(leaderScore - personScore);
  if (gap < 20) return null;

  const leader = leaderName?.split(" ")[0] || "You";
  const person = personName?.split(" ")[0] || "They";
  const leaderHigher = leaderScore > personScore;
  const tier = gap >= 30 ? "Major" : "Moderate";

  const narratives = {
    D: {
      leaderHigher: `${leader} naturally pushes for fast decisions and takes charge. ${person} prefers to build consensus and evaluate options first. The friction isn't about who's right -- it's about pace. ${leader} reads caution as stalling. ${person} reads speed as recklessness.`,
      personHigher: `${person} naturally drives harder and faster than ${leader}. Give them problems to solve and autonomy to move. The friction comes when ${person} moves before ${leader} is ready.`,
      action: `Agree upfront on decision types: which ones move fast, which ones need deliberation. Stop forcing one speed on both people.`
    },
    I: {
      leaderHigher: `${leader} leads with energy and connection. ${person} leads with substance and task focus. ${leader} may read ${person} as cold. ${person} may read ${leader} as all talk. Neither is true.`,
      personHigher: `${person} needs verbal processing, face time, and social energy. ${leader} is more task-focused. The friction shows up in communication expectations.`,
      action: `${leader}: give written context before meetings. ${person}: give face time. A five-minute conversation does more than a detailed email.`
    },
    S: {
      leaderHigher: `${leader} values stability and advance notice. ${person} is comfortable with disruption and change. When change happens without warning, ${leader} feels blindsided.`,
      personHigher: `${person} needs consistency and predictability. ${leader} is more comfortable with change. The friction comes when change is introduced without a heads-up.`,
      action: `Give at least 24 hours notice before a shift. Not a debate -- just a heads-up. Name what you need to get comfortable. Specifics beat silence.`
    },
    C: {
      leaderHigher: `${leader} wants rigor, data, and precision. ${person} trusts instincts and moves without waiting for proof. The friction is about what "done" looks like.`,
      personHigher: `${person} needs more clarity, detail, and specifics than ${leader} naturally provides. The gap shows up in quality expectations and process adherence.`,
      action: `Define "done" together before starting. "What does good enough look like?" eliminates the argument about over-analyzing vs. cutting corners.`
    }
  };

  const side = leaderHigher ? "leaderHigher" : "personHigher";
  const dimNarrative = narratives[dim]?.[side] || "";
  const actionNarrative = narratives[dim]?.action || "";

  return {
    tier,
    narrative: dimNarrative,
    action: actionNarrative,
  };
}

// ── KRI Next Steps ─────────────────────────────────────────────
// For each KRI risk level, provides specific first steps.

export function getKRINextStep(kriName, riskLevel) {
  const steps = {
    "Self-Esteem": {
      red: "Start with private one-on-ones. Ask each person: 'What's one thing you know you're good at that this team doesn't see?' Then make space for that thing to be visible. Self-esteem rebuilds through evidence, not encouragement.",
      yellow: "Watch for people who deflect praise or stay quiet in meetings. They may be waiting for permission to lead. Give it explicitly. Name what you see in them before they have to prove it.",
      green: "Your team trusts themselves. Protect that by giving honest feedback -- people with strong self-esteem handle truth better than flattery."
    },
    "Role Awareness": {
      red: "Call a role clarity session this week. Not a reorganization -- a conversation. Ask each person: 'What do you think is yours to carry? What's not?' The answers will surprise you. Align on boundaries before resentment hardens.",
      yellow: "Some people are overextending while others are underfilling. Name it before it becomes a pattern. Ask: 'Are you doing this because it's yours, or because no one else picked it up?'",
      green: "Roles are clear. Revisit quarterly -- clarity drifts as responsibilities shift."
    },
    "Self-Direction": {
      red: "Your team is waiting for you to decide. That's not laziness -- it's learned helplessness from unclear direction. This week, name three things: where the team is going, what success looks like, and what's theirs to own without checking in.",
      yellow: "Some people need more directional clarity than you realize. Ambiguity that energizes you paralyzes them. Be more explicit about priorities, even when the answer seems obvious.",
      green: "Your team knows where they're going. Keep the vision visible and let them run."
    }
  };

  return steps[kriName]?.[riskLevel] || "";
}

// ── Systemic Risk Next Steps ───────────────────────────────────
// Plain-language actions for SOP engine KRI indicators.

export function getSopKRINextStep(key, severity) {
  const steps = {
    preferenceTax: {
      red: "Multiple people are burning energy every day pretending to be someone they're not. Start with the person paying the highest cost. Have a direct conversation: 'I can see the gap between who you are and what this environment asks. Let's figure out what we can change.'",
      yellow: "At least one person is adapting more than they should. Check in. Ask what part of their day feels most draining -- not the workload, but the way they have to show up.",
      green: "Your team's environment fits. Protect that."
    },
    preferenceFriction: {
      red: "High-friction relationships need active management now. Pick the most urgent pair. Use the Bridge Wizard to start a Connection Agreement. Don't wait for it to blow up.",
      yellow: "Friction exists but it's manageable. Build Connection Agreements now while the relationships are still functional.",
      green: "No high-friction relationships right now. Good. Keep building agreements to stay ahead of what's coming."
    },
    processGaps: {
      red: "Your team is missing critical decision-making perspectives. Before the next major decision, explicitly assign someone to represent the missing lens. Not as an expert -- as a checkpoint.",
      yellow: "One perspective is underrepresented. Make it a standing question in team decisions: 'Have we considered the [missing lens] angle?'",
      green: "All three decision-making lenses are covered. Use the 3H protocol to make sure all three get heard, not just the loudest."
    }
  };

  return steps[key]?.[severity] || "";
}
