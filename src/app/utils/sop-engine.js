/**
 * LWYL SOP Engine -- Deterministic Standard Operating Procedures
 * Adapted for lwyl-app data shape (disc.natural, values, attr.ext[]/int[])
 * Source: 3Ps_SOPs.md -- Daniel's complete methodology
 *
 * All functions are pure, deterministic, no LLM calls.
 */

import { normBias } from "../constants/data";

// ── Helpers ──────────────────────────────────────────────────────

function getDominantDisc(natural) {
  return Object.entries(natural).sort(([, a], [, b]) => b - a)[0][0];
}

function getIndividualTax(person) {
  if (!person.disc?.natural || !person.disc?.adaptive) return 0;
  const n = person.disc.natural;
  const a = person.disc.adaptive;
  return Math.abs(a.D - n.D) + Math.abs(a.I - n.I) + Math.abs(a.S - n.S) + Math.abs(a.C - n.C);
}

function getTaxLevel(gap) {
  if (gap >= 140) return "Significant";
  if (gap >= 80) return "High";
  if (gap >= 40) return "Moderate";
  return "Low";
}

// ── Preference SOP Lookup Tables ──────────────────────────────────
// Source: 3Ps_SOPs.md

const DISC_SOP = {
  D: {
    coreQuestion: "How are we making decisions and solving problems?",
    high: {
      perspective: "Problems exist to be solved, quickly. Action is better than hesitation.",
      decisionApproach: "Bold, fast, and assertive. High Ds often act before others finish analyzing. They rely on their gut and push for movement -- sometimes before others are ready.",
      realTimeProcessing: "What is the goal? Who is slowing us down? Why are we still talking?",
      sop: "How quickly problems are solved must be prioritized. When working with others, what would assist with decisions happening sooner? It is your responsibility to ensure others are on board when you decide to drive.",
      caution: "May bulldoze others or overlook input. Risk of solving the wrong problem too quickly or creating unnecessary resistance.",
    },
    low: {
      perspective: "Let us understand the problem before rushing to fix it.",
      decisionApproach: "Cautious and measured. Prefers input, clarity, and avoiding unnecessary risk.",
      realTimeProcessing: "Who will this affect? What is the safest route? Are we missing anything?",
      caution: "May appear indecisive in fast-moving situations. Tendency to overanalyze and delay needed action.",
    },
  },
  I: {
    coreQuestion: "How are we interacting, engaging, and communicating with people?",
    high: {
      perspective: "People are the priority. Energy and connection drive outcomes.",
      decisionApproach: "Relational first. Decisions are shaped by how they impact morale, buy-in, and emotional engagement.",
      realTimeProcessing: "How will this make people feel? Are they with me? Can I get them excited?",
      sop: "Find ways to create the spark, fun, excitement, and social dynamics you need. When working with others, the goal is not for them to do it at the level you do it -- they may not be equally as excited about your ideas. Find ways to discover what excitement looks like for them to raise their energy levels. You must understand when you are doing too much.",
      caution: "May overlook logistics or minimize hard conversations to maintain positivity. Risk of over-promising.",
    },
    low: {
      perspective: "Let us keep it professional and focused. Emotion should not cloud the message.",
      decisionApproach: "Logical and contained. Prefers structured, to-the-point communication.",
      realTimeProcessing: "What is the objective here? Do we need all this talk? Is this relevant?",
      caution: "Can appear detached or disinterested. May miss opportunities to build trust or team cohesion.",
    },
  },
  S: {
    coreQuestion: "How are we creating a supportive and stable environment where people feel safe?",
    high: {
      perspective: "People thrive in environments that are predictable, supportive, and respectful.",
      decisionApproach: "Methodical and relational. Change is managed gently. Seeks consensus and long-term harmony.",
      realTimeProcessing: "How will this impact relationships? Is everyone okay? Is this change too fast?",
      sop: "Find ways to create stability, consistency, and a sense of normalcy. When working with others who move at a faster pace or prefer spontaneity, how can you embrace or plan to change things up so that no one ever feels slowed down or bored with the established norms?",
      caution: "May resist necessary change or avoid conflict. Can struggle with urgency or disruption.",
    },
    low: {
      perspective: "Adaptability is strength. We need to stay agile and move fast.",
      decisionApproach: "Comfortable with change. Moves quickly and shifts gears often.",
      realTimeProcessing: "Is this getting stale? Can we do this faster? What is next?",
      caution: "Can create instability or stress in others. Risk of pushing too fast for teams that need structure.",
    },
  },
  C: {
    coreQuestion: "How are we navigating the issues and details that matter most?",
    high: {
      perspective: "There is a right way to do things -- and we should follow it.",
      decisionApproach: "Analytical and rules-based. Seeks accuracy and structure. Prefers full information before acting.",
      realTimeProcessing: "Do we have all the data? Does this align with policy? Are we skipping steps?",
      sop: "You need to stay knowledgeable and in the know of the details that others miss. When working with others, you cannot expect them to be as detail-oriented as you are. Be aware of how others feel about more questions being asked, and find the right time and space to receive what you need -- without holding others up.",
      caution: "May stall progress in pursuit of perfection. Can resist experimentation or tolerate ambiguity poorly.",
    },
    low: {
      perspective: "Rules are guidelines. Flexibility and outcomes matter more.",
      decisionApproach: "Informal and adaptive. Values efficiency over accuracy.",
      realTimeProcessing: "What is the fastest route? Do we really need all these steps?",
      caution: "Risk of oversight or non-compliance. Can appear careless or dismissive of important standards.",
    },
  },
};

// ── Passion SOP Lookup Tables ─────────────────────────────────────
// Source: 3Ps_SOPs.md

const VALUES_SOP = {
  Aesthetic: {
    definition: "The drive to make sure what we are doing actually means something -- not just going through the motions.",
    perspective: "If we are going to spend time on something, it should matter. I care about whether the work feels real, whether people feel supported, and whether there is some kind of purpose behind what we do.",
    whatMatters: ["A team culture that actually cares about people, not just tasks", "Leadership that listens, not just dictates", "Space to be themselves without having to fake it", "Emotional safety where people can speak up and not feel punished"],
    initiatives: ["Creating space for people to connect and be real with each other", "Helping make the day-to-day feel less robotic and more human", "Finding ways to build trust across teams", "Making sure people feel seen, heard, and respected -- not just used"],
    thingsThatIrk: ["Cold, top-down leadership with no interest in how people feel", "Fake positivity and forced team-building", "Work that feels empty or pointless", "Environments where people are burned out but expected to smile through it"],
  },
  Economic: {
    definition: "The drive to get stuff done in a way that actually makes sense. If it is not useful, do not waste time on it.",
    perspective: "Time is valuable. If we are going to do something, it should lead to a real result, not just keep us busy.",
    whatMatters: ["Efficiency -- cut the fluff and get to the point", "Work that leads to clear progress, not just effort", "Clear expectations and accountability", "Being allowed to improve the system instead of being told to live with it"],
    initiatives: ["Figuring out how to do more with less effort", "Getting systems and processes to actually work better", "Helping people spend more time on what matters"],
    thingsThatIrk: ["Long, unproductive meetings with no real outcome", "Doing things because that is how we have always done it", "Vague goals, unclear direction, and endless talking with no action", "Bureaucracy that slows everything down"],
  },
  Individualistic: {
    definition: "The drive to do things their own way and stand out for it. They do not want to blend in -- they want to lead, shape, or own something.",
    perspective: "I need to feel like I have control over how I work and that my voice matters. I do not want to be micromanaged.",
    whatMatters: ["Autonomy -- do not hover, just trust them to get it done", "Having room to bring their personality and ideas into the work", "Being recognized for what they uniquely bring to the table", "The freedom to challenge the norm if it is not working"],
    initiatives: ["Building something from scratch that has their fingerprints all over it", "Pushing boundaries in how the team or school shows up", "Creating space for people to bring more of themselves to the work"],
    thingsThatIrk: ["Micromanagement or having every step dictated", "Just follow the process cultures", "Environments where bold ideas get shut down without a conversation", "Being treated like they are just there to execute someone else's vision"],
  },
  Political: {
    definition: "The drive to lead, make decisions, and be the one people look to. They want influence, not just involvement.",
    perspective: "I want to be at the table where the real decisions are made. I like responsibility. I will step up when others will not.",
    whatMatters: ["Visibility -- they want to be seen, heard, and respected", "Real responsibility, not just busy work", "Opportunities to lead people or decisions", "Clear lanes to step up and stand out"],
    initiatives: ["Taking charge of something high-stakes and showing what they can do", "Rallying others around a shared goal or challenge", "Owning something with real impact and responsibility"],
    thingsThatIrk: ["Being left out of decisions that affect their work", "Leaders who expect compliance, not collaboration", "Environments where ambition is seen as arrogance"],
  },
  Altruistic: {
    definition: "The drive to help, serve, and support others -- especially when no one is keeping score.",
    perspective: "I am here to make a difference in people's lives. I care about the human side of the work.",
    whatMatters: ["Knowing the work helps people in real ways", "Being able to support others without red tape or ego games", "Working with leaders who actually care, not just pretend to", "A culture that values kindness, not just performance"],
    initiatives: ["Supporting students or staff who are slipping through the cracks", "Coaching, mentoring, or guiding people behind the scenes", "Creating safe spaces where people can ask for help without shame"],
    thingsThatIrk: ["Cold, numbers-first cultures that ignore the human cost", "When people are expected to push through without care or check-ins", "Policies that punish people for struggling instead of helping them"],
  },
  Regulatory: {
    definition: "The drive to create structure, consistency, and order. If there is no system, they will build one.",
    perspective: "I like knowing what to expect and how things are supposed to work. I believe in rules, routines, and clear standards.",
    whatMatters: ["Clear expectations, rules, and boundaries", "Consistent follow-through -- do not say it if you are not going to do it", "Being able to rely on systems that work", "Room to build order where it is missing"],
    initiatives: ["Fixing things that feel scattered or unclear", "Setting up processes that help people know what to do and when", "Documenting how things work so others do not have to guess"],
    thingsThatIrk: ["Constant last-minute changes with no warning", "Vague roles, loose expectations, and shifting priorities", "Leadership that ignores or breaks its own rules"],
  },
  Theoretical: {
    definition: "The drive to learn, explore ideas, and understand how things work -- because knowing more just feels right.",
    perspective: "I am always thinking about how we could do things better. I ask questions, dig into ideas, and want to understand the why behind the work.",
    whatMatters: ["Opportunities to learn, not just do", "Space to think through problems instead of rushing to fix them", "Being challenged intellectually, not just kept busy", "Leaders who value curiosity, not just compliance"],
    initiatives: ["Researching new approaches or tools before rolling them out", "Exploring what is not working and why -- then sharing insights", "Helping others understand the why behind big changes"],
    thingsThatIrk: ["Just do it cultures with no time to think or ask questions", "Teams that keep doing things without knowing why", "Being forced to follow plans that do not make sense without explanation"],
  },
};

// ── Process SOP Lookup Tables ─────────────────────────────────────
// Source: 3Ps_SOPs.md

const PROCESS_SOP = {
  Heart: {
    definition: "The ability to understand and care about what others are feeling or experiencing, without needing them to explain it.",
    talents: "Empathy, Understanding Attitude, Sensitivity Towards Others, Developing Others",
    perspective: "I can usually tell when someone is off, even if they say they are fine. I pick up on how people feel and I care about how decisions affect them.",
    practicalApplication: [
      "Builds strong relationships so people feel seen, appreciated, and valued",
      "Brings emotional intelligence into team dynamics and culture",
      "Serves as the go-to person when tough conversations need sensitivity",
      "Helps catch early warning signs when morale or engagement is dipping",
      "Can be developed further by pairing empathy with boundaries",
    ],
    sopQuestions: [
      "How does this affect people?",
      "Who have we talked to?",
      "How will we gain insight from groups not in the room but impacted by decisions?",
      "Have we thoroughly considered everyone before we move forward?",
      "How will we incorporate seeing things from other perspectives?",
    ],
  },
  Hand: {
    definition: "The ability to recognize what will actually work and make sense in the real world -- not just in theory.",
    talents: "Execution/Implementation, Results Orientation, Speed of Action, Attention to Details",
    perspective: "I can quickly tell whether something is realistic or a waste of time. I do not need every detail -- I just know what will fly and what will not.",
    practicalApplication: [
      "Helps teams avoid overcomplicating problems or wasting time",
      "Offers grounded advice during planning or decision-making",
      "Translates big ideas into real steps that actually work",
      "Helps others focus on what matters instead of getting stuck in theory",
      "Can be sharpened by collaborating with visionaries to balance execution with inspiration",
    ],
    sopQuestions: [
      "What is the fastest path to results?",
      "What is actionable now?",
      "Incorporate SMART goals -- be realistic about what we can and cannot do",
      "How do we ensure that the problems we discuss are actually solved?",
      "What role does everyone play in execution?",
    ],
  },
  Head: {
    definition: "The ability to think strategically, see patterns, and understand how different parts of a system fit together.",
    talents: "Strategic Planning, Theoretical Problem Solving, Seeing Potential Problems, Creating Complex Systems",
    perspective: "I like seeing how all the moving pieces connect. I think beyond the immediate task and look at how things will play out.",
    practicalApplication: [
      "Helps anticipate long-term impact of decisions",
      "Connects dots others do not always see",
      "Contributes big-picture insight in planning and strategy conversations",
      "Can design or improve systems that support consistency and efficiency",
      "Can grow by partnering with detail-focused or emotionally tuned teammates",
    ],
    sopQuestions: [
      "What is the system impact?",
      "What are we missing long-term?",
      "What strategies are we considering, and how will we decide which is best?",
      "What is the big picture, and how do we keep the main thing the main thing?",
      "What problems will we face before, during, and after?",
      "How will we be proactive? Is there a way to avoid potential threats?",
    ],
  },
};

// ── Generators ────────────────────────────────────────────────────

export function generatePreferenceSOPs(people) {
  const complete = people.filter(p => p.disc?.natural);
  return complete.map(p => {
    const dom = getDominantDisc(p.disc.natural);
    const val = p.disc.natural[dom];
    const isHigh = val >= 50;
    const sop = DISC_SOP[dom];
    const entry = isHigh ? sop.high : sop.low;
    return {
      personName: p.name,
      personId: p.id,
      style: `${isHigh ? "High" : "Low"} ${dom}`,
      coreQuestion: sop.coreQuestion,
      perspective: entry.perspective,
      decisionApproach: entry.decisionApproach,
      realTimeProcessing: entry.realTimeProcessing,
      sop: entry.sop || null,
      caution: entry.caution,
    };
  });
}

export function generatePassionSOPs(people) {
  const complete = people.filter(p => p.values);
  return complete.map(p => {
    const topMotivators = Object.entries(p.values)
      .filter(([, s]) => s >= 55)
      .sort(([, a], [, b]) => b - a)
      .map(([key]) => key);

    return {
      personName: p.name,
      personId: p.id,
      topMotivators,
      bridges: topMotivators.map(dim => {
        const sop = VALUES_SOP[dim];
        return {
          dimension: dim,
          definition: sop.definition,
          perspective: sop.perspective,
          whatMatters: sop.whatMatters,
          initiatives: sop.initiatives,
          thingsThatIrk: sop.thingsThatIrk,
        };
      }),
    };
  });
}

export function generateProcessSOPs(people) {
  const complete = people.filter(p => p.attr?.ext);
  return complete.map(p => {
    const heart = p.attr.ext.find(a => a.label === "Heart");
    const hand = p.attr.ext.find(a => a.label === "Hand");
    const head = p.attr.ext.find(a => a.label === "Head");

    const scores = { Heart: heart?.score || 0, Hand: hand?.score || 0, Head: head?.score || 0 };
    const dominant = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
    const sop = PROCESS_SOP[dominant];

    return {
      personName: p.name,
      personId: p.id,
      dominantLens: dominant,
      scores,
      definition: sop.definition,
      talents: sop.talents,
      perspective: sop.perspective,
      practicalApplication: sop.practicalApplication,
      sopQuestions: sop.sopQuestions,
    };
  });
}

// ── Team Calculators ──────────────────────────────────────────────

export function calcTeamPreferenceTaxDistribution(people) {
  return people
    .filter(p => p.disc?.natural && p.disc?.adaptive)
    .map(p => ({ person: p, tax: getIndividualTax(p), level: getTaxLevel(getIndividualTax(p)) }))
    .sort((a, b) => b.tax - a.tax);
}

export function calcTeamValuesProfile(people) {
  const withValues = people.filter(p => p.values);
  if (!withValues.length) return [];
  const dims = ["Aesthetic", "Economic", "Individualistic", "Political", "Altruistic", "Regulatory", "Theoretical"];
  return dims.map(dim => {
    const scores = withValues.map(p => p.values[dim] || 0);
    const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    const spread = Math.max(...scores) - Math.min(...scores);
    return { dimension: dim, avg, spread };
  });
}

export function calcTeamProcessCoverage(people) {
  const withAttrs = people.filter(p => p.attr?.ext);
  const result = { Heart: { count: 0, people: [] }, Hand: { count: 0, people: [] }, Head: { count: 0, people: [] }, gaps: [] };
  withAttrs.forEach(p => {
    const scores = {};
    p.attr.ext.forEach(a => { scores[a.label] = a.score; });
    const dominant = Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] || "Heart";
    result[dominant].count++;
    result[dominant].people.push(p.name);
  });
  ["Heart", "Hand", "Head"].forEach(l => { if (result[l].count === 0) result.gaps.push(l); });
  return result;
}
