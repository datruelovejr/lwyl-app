// ── 3Ps SOP Engine ──────────────────────────────────────────────────
// Sources: 3Ps_SOPs.md (Daniel's consulting methodology)
// Generates Preference, Passion, and Process SOPs from assessment data

// ═══════════════════════════════════════════════════════════════════
// PREFERENCE SOPs (DISC)
// ═══════════════════════════════════════════════════════════════════

const DISC_SOPS = {
  D: {
    high: {
      question: "How are we making decisions and solving problems?",
      perspective: "Problems exist to be solved, quickly. Action is better than hesitation.",
      approach: "Bold, fast, and assertive. Acts before others finish analyzing. Relies on gut and pushes for movement — sometimes before others are ready.",
      realTime: "What's the goal? Who's slowing us down? Why are we still talking? Scanning for obstacles, inefficiencies, or slow decision-makers. Emotion isn't a factor — results are.",
      sop: "How quickly problems are solved must be prioritized. When working with others, what would assist with decisions happening sooner? It's your responsibility to ensure others are on board when you decide to drive.",
      caution: "May bulldoze others or overlook input. Risk of solving the wrong problem too quickly or creating unnecessary resistance.",
    },
    low: {
      perspective: "Let's understand the problem before rushing to fix it.",
      approach: "Cautious and measured. Prefers input, clarity, and avoiding unnecessary risk. Control through preparation.",
      realTime: "Who will this affect? What's the safest route? Are we missing anything? Scans for ripple effects. Prefers certainty and predictability over urgency.",
      caution: "May appear indecisive in fast-moving situations. Tendency to overanalyze and delay needed action.",
    },
  },
  I: {
    high: {
      question: "How are we interacting, engaging, and communicating with people?",
      perspective: "People are the priority. Energy and connection drive outcomes.",
      approach: "Relational first. Decisions shaped by how they impact morale, buy-in, and emotional engagement.",
      realTime: "How will this make people feel? Are they with me? Can I get them excited? Focused on enthusiasm, support, and perceived connection.",
      sop: "Find ways to create the spark, fun, excitement, and social dynamics you need. When working with others, the goal is not for them to do it at your level — they may not be equally excited about your ideas. Find ways to discover what excitement looks like for them. You must understand when you're doing too much.",
      caution: "May overlook logistics or minimize hard conversations to maintain positivity. Risk of over-promising.",
    },
    low: {
      perspective: "Let's keep it professional and focused. Emotion should not cloud the message.",
      approach: "Logical and contained. Prefers structured, to-the-point communication. Values independence.",
      realTime: "What's the objective here? Do we need all this talk? Is this relevant? Filters interaction for usefulness. May disengage from emotion-heavy environments.",
      caution: "Can appear detached or disinterested. May miss opportunities to build trust or team cohesion.",
    },
  },
  S: {
    high: {
      question: "How are we creating a supportive and stable environment where people feel safe?",
      perspective: "People thrive in environments that are predictable, supportive, and respectful.",
      approach: "Methodical and relational. Change is managed gently. Seeks consensus and long-term harmony.",
      realTime: "How will this impact relationships? Is everyone okay? Is this change too fast? Tends to people's emotional responses and continuity.",
      sop: "Find ways to create stability, consistency, and a sense of normalcy. When working with others who move faster or prefer spontaneity, how can you embrace change so no one ever feels slowed down or bored with the established norms?",
      caution: "May resist necessary change or avoid conflict. Can struggle with urgency or disruption.",
    },
    low: {
      perspective: "Adaptability is strength. We need to stay agile and move fast.",
      approach: "Comfortable with change. Moves quickly and shifts gears often. Doesn't need extensive preparation.",
      realTime: "Is this getting stale? Can we do this faster? What's next? Looks for momentum, change, and stimulation.",
      caution: "Can create instability or stress in others. Risk of pushing too fast for teams that need structure.",
    },
  },
  C: {
    high: {
      question: "How are we navigating the issues and details that matter most?",
      perspective: "There's a right way to do things — and we should follow it.",
      approach: "Analytical and rules-based. Seeks accuracy and structure. Prefers full information before acting.",
      realTime: "Do we have all the data? Does this align with policy? Are we skipping steps? Focused on thoroughness and minimizing risk of error.",
      sop: "You need to stay knowledgeable and in the know of the details others miss. When working with others, you can't expect them to be as detail-oriented. Be aware of how others feel about more questions being asked, and find the right time to receive what you need — without holding others up. Help others see the problem it solves for them.",
      caution: "May stall progress in pursuit of perfection. Can resist experimentation or tolerate ambiguity poorly.",
    },
    low: {
      perspective: "Rules are guidelines. Flexibility and outcomes matter more.",
      approach: "Informal and adaptive. Values efficiency over accuracy. Will bend rules if needed to move forward.",
      realTime: "What's the fastest route? Do we really need all these steps? Who can I delegate this to? Seeks shortcuts and autonomy.",
      caution: "Risk of oversight or non-compliance. Can appear careless or dismissive of important standards.",
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// PASSION SOPs (Values / Engagement Bridge)
// ═══════════════════════════════════════════════════════════════════

const VALUES_SOPS = {
  Aesthetic: {
    label: "Harmony-Driven",
    icon: "🎨",
    definition: "The drive to make sure what we're doing actually means something — not just going through the motions.",
    perspective: "If we're going to spend time on something, it should matter. I care about whether the work feels real, whether people feel supported, and whether there's some kind of purpose behind what we do. If things feel fake, rushed, or forced, I check out.",
    whatMatters: [
      "A team culture that actually cares about people, not just tasks",
      "Leadership that listens, not just dictates",
      "Space to be themselves without having to fake it",
      "Routines that have meaning, not just 'we've always done it this way'",
      "Emotional safety where people can speak up, make mistakes, and not feel punished",
    ],
    initiatives: [
      "Creating space for people to connect and be real with each other",
      "Helping make the day-to-day feel less robotic and more human",
      "Finding ways to build trust across teams",
      "Making sure people feel seen, heard, and respected — not just used",
    ],
    irks: [
      "Cold, top-down leadership with no interest in how people feel",
      "Fake positivity and forced team-building",
      "Work that feels empty or pointless",
      "Environments where people are burned out but expected to smile through it",
    ],
  },
  Economic: {
    label: "Results-Driven",
    icon: "💰",
    definition: "The drive to get stuff done in a way that actually makes sense. If it's not useful, don't waste time on it.",
    perspective: "Time is valuable. If we're going to do something, it should lead to a real result, not just keep us busy. Why are we doing it this way? If there's a smarter, faster, better way, I want to find it.",
    whatMatters: [
      "Efficiency — cut the fluff and get to the point",
      "Work that leads to clear progress, not just effort",
      "Clear expectations and accountability",
      "Being allowed to improve the system instead of being told to live with it",
      "People who respect their time",
    ],
    initiatives: [
      "Figuring out how to do more with less effort",
      "Getting systems and processes to actually work better for the people using them",
      "Helping people spend more time on what matters",
    ],
    irks: [
      "Long, unproductive meetings with no real outcome",
      "Doing things because 'that's how we've always done it'",
      "Vague goals, unclear direction, and endless talking with no action",
      "Bureaucracy that slows everything down",
    ],
  },
  Individualistic: {
    label: "Autonomy-Driven",
    icon: "🦋",
    definition: "The drive to do things their own way and stand out for it. They don't want to blend in — they want to lead, shape, or own something.",
    perspective: "I need to feel like I have control over how I work and that my voice matters. I don't want to be micromanaged. I want to leave my mark, do things differently, and have the freedom to do it in a way that makes sense to me. If I'm stuck in a box, I check out.",
    whatMatters: [
      "Autonomy — don't hover, just trust them to get it done",
      "Having room to bring their personality and ideas into the work",
      "Being recognized for what they uniquely bring to the table",
      "Opportunities to lead or own something",
      "The freedom to challenge the norm if it's not working",
    ],
    initiatives: [
      "Building something from scratch that has their fingerprints all over it",
      "Pushing boundaries in how the team shows up",
      "Creating space for people to bring more of themselves to the work",
    ],
    irks: [
      "Micromanagement or having every step dictated",
      "'Just follow the process' cultures",
      "Environments where bold ideas get shut down without a conversation",
      "Being treated like they're just there to execute someone else's vision",
    ],
  },
  Political: {
    label: "Leadership-Driven",
    icon: "🏆",
    definition: "The drive to lead, make decisions, and be the one people look to. They want influence, not just involvement.",
    perspective: "I want to be at the table where the real decisions are made. I like responsibility. I'll step up when others won't. Just don't sideline me and expect me to stay motivated.",
    whatMatters: [
      "Visibility — they want to be seen, heard, and respected",
      "Real responsibility, not just busy work",
      "Opportunities to lead people or decisions",
      "Clear lanes to step up and stand out",
    ],
    initiatives: [
      "Taking charge of something high-stakes and showing what they can do",
      "Rallying others around a shared goal or challenge",
      "Owning something with real impact and responsibility",
    ],
    irks: [
      "Being left out of decisions that affect their work",
      "Leaders who expect compliance, not collaboration",
      "Environments where ambition is seen as arrogance",
      "Systems that reward politics over actual leadership",
    ],
  },
  Altruistic: {
    label: "Service-Driven",
    icon: "🤝",
    definition: "The drive to help, serve, and support others — especially when no one's keeping score.",
    perspective: "I'm here to make a difference in people's lives. I care about the human side of the work — whether people are okay, whether they're supported, whether we're doing right by them. I'm not in it for credit. I just want to help where help is needed.",
    whatMatters: [
      "Knowing the work helps people in real ways",
      "Being able to support others without red tape or ego games",
      "Working with leaders who actually care, not just pretend to",
      "A culture that values kindness, not just performance",
    ],
    initiatives: [
      "Supporting people who are slipping through the cracks",
      "Coaching, mentoring, or guiding people behind the scenes",
      "Creating safe spaces where people can ask for help without shame",
    ],
    irks: [
      "Cold, numbers-first cultures that ignore the human cost",
      "When people are expected to push through without care or check-ins",
      "Policies that punish people for struggling instead of helping them",
    ],
  },
  Regulatory: {
    label: "Order-Driven",
    icon: "📋",
    definition: "The drive to create structure, consistency, and order. If there's no system, they'll build one.",
    perspective: "I like knowing what to expect and how things are supposed to work. I believe in rules, routines, and clear standards — not because I'm rigid, but because they keep things fair and functional. If there's chaos, I'm the one trying to clean it up.",
    whatMatters: [
      "Clear expectations, rules, and boundaries",
      "Consistent follow-through — don't say it if you're not going to do it",
      "Being able to rely on systems that work",
      "Room to build order where it's missing",
    ],
    initiatives: [
      "Fixing things that feel scattered or unclear",
      "Setting up processes that help people know what to do and when",
      "Documenting how things work so others don't have to guess",
    ],
    irks: [
      "Constant last-minute changes with no warning",
      "Vague roles, loose expectations, and shifting priorities",
      "Leadership that ignores or breaks its own rules",
    ],
  },
  Theoretical: {
    label: "Learning-Driven",
    icon: "🔬",
    definition: "The drive to learn, explore ideas, and understand how things work — because knowing more just feels right.",
    perspective: "I'm always thinking about how we could do things better. I ask questions, dig into ideas, and want to understand the 'why' behind the work. If there's no time or space for learning, I start to feel stuck.",
    whatMatters: [
      "Opportunities to learn, not just do",
      "Space to think through problems instead of rushing to fix them",
      "Being challenged intellectually, not just kept busy",
      "Leaders who value curiosity, not just compliance",
    ],
    initiatives: [
      "Researching new approaches or tools before rolling them out",
      "Exploring what's not working and why — then sharing insights",
      "Helping others understand the 'why' behind big changes",
    ],
    irks: [
      "'Just do it' cultures with no time to think or ask questions",
      "Teams that keep doing things without knowing why",
      "Being forced to follow plans that don't make sense without explanation",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
// PROCESS SOPs (Attributes / 3H Decision Protocol)
// ═══════════════════════════════════════════════════════════════════

const PROCESS_SOPS = {
  Heart: {
    label: "Empathy",
    fullLabel: "Empathy (Heart / Personal Style) — People",
    icon: "❤️",
    definition: "The ability to understand and care about what others are feeling or experiencing, without needing them to explain it.",
    talents: "Empathy, Understanding Attitude, Sensitivity Towards Others, Developing Others",
    perspective: "I can usually tell when someone is off, even if they say they're fine. I pick up on how people feel and I care about how decisions affect them. If someone's struggling, I want to know and help. I can't ignore it.",
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
    label: "Practical Thinking",
    fullLabel: "Practical Thinking (Hand / Practical Style) — Solutions",
    icon: "🛠️",
    definition: "The ability to recognize what will actually work and make sense in the real world — not just in theory.",
    talents: "Execution/Implementation, Results Orientation, Speed of Action, Attention to Details",
    perspective: "I can quickly tell whether something is realistic or a waste of time. I don't need every detail — I just know what will fly and what won't. I hate when we chase ideas that sound good on paper but clearly won't work in practice.",
    practicalApplication: [
      "Helps teams avoid overcomplicating problems or wasting time",
      "Offers grounded advice during planning or decision-making",
      "Translates big ideas into real steps that actually work",
      "Helps others focus on what matters instead of getting stuck in theory",
      "Can be sharpened by collaborating with visionaries to balance execution with inspiration",
    ],
    sopQuestions: [
      "What's the fastest path to results?",
      "What's actionable now?",
      "How do we ensure that the problems we discuss are actually solved?",
      "We don't want to meet month after month still discussing what should've already been fixed",
      "What role does everyone play in execution?",
    ],
  },
  Head: {
    label: "Systems Judgment",
    fullLabel: "Systems Judgment (Head / Analytical Style) — Strategy",
    icon: "🧠",
    definition: "The ability to think strategically, see patterns, and understand how different parts of a system fit together.",
    talents: "Strategic Planning, Theoretical Problem Solving, Seeing Potential Problems, Creating Complex Systems",
    perspective: "I like seeing how all the moving pieces connect. I think beyond the immediate task and look at how things will play out. I don't just want to fix a problem — I want to improve the whole system.",
    practicalApplication: [
      "Helps anticipate long-term impact of decisions",
      "Connects dots others don't always see",
      "Contributes big-picture insight in planning and strategy conversations",
      "Can design or improve systems that support consistency and efficiency",
      "Can grow by partnering with detail-focused or emotionally tuned teammates",
    ],
    sopQuestions: [
      "What's the system impact?",
      "What are we missing long-term?",
      "What strategies are we considering, and how will we decide which is best?",
      "What's the big picture, and how do we keep the main thing the main thing?",
      "What problems will we face before, during, and after?",
      "How will we be proactive? Is there a way to avoid potential threats?",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
// GENERATORS
// ═══════════════════════════════════════════════════════════════════

function getDom(disc) {
  return Object.entries(disc).sort(([, a], [, b]) => b - a)[0][0];
}

function getLevel(score) {
  if (score >= 70) return "high";
  if (score <= 39) return "low";
  return "mid";
}

function getTopValues(values, count = 3) {
  return Object.entries(values).sort(([, a], [, b]) => b - a).slice(0, count).map(([k]) => k);
}

function get3HProfile(attr) {
  if (!attr) return null;
  const ext = attr.ext || [];
  const heart = ext.find(a => a.label === "Heart");
  const hand = ext.find(a => a.label === "Hand");
  const head = ext.find(a => a.label === "Head");
  return { heart, hand, head };
}

// ── Preference SOP for a person ──────────────────────────────────
export function generatePreferenceSOP(person) {
  if (!person.disc?.natural) return null;
  const nat = person.disc.natural;
  const dom = getDom(nat);
  const name = person.name.split(" ")[0];

  const dims = ["D", "I", "S", "C"].map(d => {
    const score = nat[d];
    const level = getLevel(score);
    const data = level === "low" ? DISC_SOPS[d].low : DISC_SOPS[d].high;
    const sopData = DISC_SOPS[d].high; // SOP questions come from high
    return { dim: d, score, level, data, sopData };
  });

  const dominant = dims.find(d => d.dim === dom);

  return {
    person,
    name,
    dominantStyle: dom,
    question: dominant.sopData.question,
    perspective: dominant.data.perspective,
    approach: dominant.data.approach,
    realTime: dominant.data.realTime,
    sop: dominant.sopData.sop,
    caution: dominant.data.caution,
    allDims: dims,
  };
}

// ── Passion SOP for a person ─────────────────────────────────────
export function generatePassionSOP(person) {
  if (!person.values) return null;
  const name = person.name.split(" ")[0];
  const topValues = getTopValues(person.values);

  const profiles = topValues.map(v => {
    const sop = VALUES_SOPS[v];
    if (!sop) return null;
    return {
      dimension: v,
      score: person.values[v],
      ...sop,
    };
  }).filter(Boolean);

  return { person, name, topValues, profiles };
}

// ── Process SOP for a person ─────────────────────────────────────
export function generateProcessSOP(person) {
  const profile = get3HProfile(person.attr);
  if (!profile) return null;
  const name = person.name.split(" ")[0];

  const lenses = ["heart", "hand", "head"].map(key => {
    const attr = profile[key];
    if (!attr) return null;
    const sopData = PROCESS_SOPS[key.charAt(0).toUpperCase() + key.slice(1)];
    return {
      key,
      label: sopData.fullLabel,
      icon: sopData.icon,
      score: attr.score,
      bias: attr.bias,
      biasLabel: attr.bias === "+" ? "Requires" : attr.bias === "−" || attr.bias === "\u2212" ? "Dismisses" : "Balanced",
      definition: sopData.definition,
      talents: sopData.talents,
      perspective: sopData.perspective,
      practicalApplication: sopData.practicalApplication,
      sopQuestions: sopData.sopQuestions,
    };
  }).filter(Boolean);

  const requires = lenses.filter(l => l.biasLabel === "Requires");
  const dismisses = lenses.filter(l => l.biasLabel === "Dismisses");

  return { person, name, lenses, requires, dismisses };
}

// ── Team-level calculators ───────────────────────────────────────

export function calcPreferenceTax(person) {
  if (!person.disc?.natural || !person.disc?.adaptive) return 0;
  const nat = person.disc.natural;
  const adap = person.disc.adaptive;
  return ["D", "I", "S", "C"].reduce((sum, d) => sum + Math.abs((nat[d] || 0) - (adap[d] || 0)), 0);
}

export function calcTeamPreferenceTax(members) {
  return members
    .filter(p => p.disc?.natural && p.disc?.adaptive)
    .map(p => ({ person: p, tax: calcPreferenceTax(p), severity: calcPreferenceTax(p) >= 80 ? "High" : calcPreferenceTax(p) >= 50 ? "Moderate" : "Low" }))
    .sort((a, b) => b.tax - a.tax);
}

export function calcTeam3HCoverage(members) {
  const heart = [], hand = [], head = [];
  members.forEach(p => {
    const profile = get3HProfile(p.attr);
    if (!profile) return;
    if (profile.heart?.bias === "+") heart.push(p);
    if (profile.hand?.bias === "+") hand.push(p);
    if (profile.head?.bias === "+") head.push(p);
  });
  const gaps = [];
  if (heart.length === 0) gaps.push("Heart");
  if (hand.length === 0) gaps.push("Hand");
  if (head.length === 0) gaps.push("Head");
  return { heart, hand, head, gaps };
}

// ── KRI Generator ────────────────────────────────────────────────

export function generateKRIs(members, frictionPairs) {
  const taxData = calcTeamPreferenceTax(members);
  const highTax = taxData.filter(t => t.severity === "High");
  const coverage = calcTeam3HCoverage(members);

  const highFriction = frictionPairs ? frictionPairs.filter(p => p.friction.tier === "high") : [];
  const modFriction = frictionPairs ? frictionPairs.filter(p => p.friction.tier === "moderate") : [];

  return {
    preferenceTax: {
      severity: highTax.length >= 3 ? "red" : highTax.length >= 1 ? "yellow" : "green",
      affected: highTax,
      description: highTax.length > 0
        ? `${highTax.length} team member${highTax.length > 1 ? "s are" : " is"} paying a high adaptation cost daily. That's energy spent wearing a mask instead of leading authentically.`
        : "No one is paying a significant adaptation cost. The environment fits.",
      sop: "Deploy Preference SOPs to standardize communication and decision-making per DISC style.",
    },
    preferenceFriction: {
      severity: highFriction.length >= 3 ? "red" : highFriction.length >= 1 ? "yellow" : "green",
      affected: highFriction,
      description: highFriction.length > 0
        ? `${highFriction.length} relationship${highFriction.length > 1 ? "s have" : " has"} high friction. These need active management before they become retention risks.`
        : "No high-friction relationships detected.",
      sop: "Use Bridge Wizard to create Connection Agreements for high-friction pairs.",
    },
    processGaps: {
      severity: coverage.gaps.length >= 2 ? "red" : coverage.gaps.length >= 1 ? "yellow" : "green",
      gaps: coverage.gaps,
      coverage,
      description: coverage.gaps.length > 0
        ? `Missing ${coverage.gaps.join(" and ")} perspective${coverage.gaps.length > 1 ? "s" : ""} in team decisions. Blind spots are guaranteed.`
        : "All three decision-making lenses (Heart, Hand, Head) are represented on the team.",
      sop: "Deploy 3H Decision Protocol to ensure all perspectives are heard before decisions.",
    },
    overallRisk: Math.min(100, (highTax.length * 15) + (highFriction.length * 20) + (coverage.gaps.length * 25) + (modFriction.length * 5)),
  };
}

export { DISC_SOPS, VALUES_SOPS, PROCESS_SOPS };
