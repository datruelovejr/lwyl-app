'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Users, Zap, Heart, Brain,
  CheckCircle2, Loader2, ArrowRight, X,
  FileText, Shield, Star, MessageSquare
} from "lucide-react";
import { useLWYL } from "../../contexts/LWYLContext";
import { C } from "../../constants/colors";

// ── Local constants (ported from lwyl-types) ─────────────────────
const DISC_COLORS = { D: "#C62828", I: "#F59E0B", S: "#16A34A", C: "#2563EB" };
const DISC_LABELS = { D: "Decisive", I: "Interactive", S: "Stabilizing", C: "Cautious" };
const VALUES_COLORS = {
  Aesthetic: "#7CB342", Economic: "#5C8DC4", Individualistic: "#F28C4E",
  Political: "#E05252", Altruistic: "#FFB74D", Regulatory: "#757575", Theoretical: "#B8864A",
};

// ── Local helpers (ported from lwyl-types) ───────────────────────
function getDominantDisc(disc) {
  return Object.entries(disc).sort(([, a], [, b]) => b - a)[0][0];
}

function calcDiscGapPoints(a, b) {
  return Math.abs(a.D - b.D) + Math.abs(a.I - b.I) + Math.abs(a.S - b.S) + Math.abs(a.C - b.C);
}

function gapPointsToPercent(gapPoints) {
  return Math.min(100, Math.round((gapPoints / 400) * 100));
}

function calcPassionFrictionPoints(a, b) {
  return (
    Math.abs((a.Aesthetic || 0) - (b.Aesthetic || 0)) +
    Math.abs((a.Economic || 0) - (b.Economic || 0)) +
    Math.abs((a.Individualistic || 0) - (b.Individualistic || 0)) +
    Math.abs((a.Political || 0) - (b.Political || 0)) +
    Math.abs((a.Altruistic || 0) - (b.Altruistic || 0)) +
    Math.abs((a.Regulatory || 0) - (b.Regulatory || 0)) +
    Math.abs((a.Theoretical || 0) - (b.Theoretical || 0))
  );
}

function passionFrictionToPercent(points) {
  return Math.min(100, Math.round((points / 700) * 100));
}

function calcProcessFrictionPoints(attrA, attrB) {
  const aHeart = attrA.ext?.find(a => a.label === "Heart")?.score ?? 5;
  const bHeart = attrB.ext?.find(a => a.label === "Heart")?.score ?? 5;
  const aHand = attrA.ext?.find(a => a.label === "Hand")?.score ?? 5;
  const bHand = attrB.ext?.find(a => a.label === "Hand")?.score ?? 5;
  const aHead = attrA.ext?.find(a => a.label === "Head")?.score ?? 5;
  const bHead = attrB.ext?.find(a => a.label === "Head")?.score ?? 5;
  return Math.abs(aHeart - bHeart) + Math.abs(aHand - bHand) + Math.abs(aHead - bHead);
}

function processFrictionToPercent(points) {
  return Math.min(100, Math.round((points / 30) * 100));
}

// ── Step definitions ───────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Select People", icon: <Users size={16} /> },
  { id: 2, label: "Friction Map", icon: <Zap size={16} /> },
  { id: 3, label: "Impact + Needs", icon: <Shield size={16} /> },
  { id: 4, label: "Green/Red Zone", icon: <Heart size={16} /> },
  { id: 5, label: "Platinum Process", icon: <Star size={16} /> },
  { id: 6, label: "3H Protocol", icon: <Brain size={16} /> },
  { id: 7, label: "Bridge Insights", icon: <Star size={16} /> },
  { id: 8, label: "Repair Protocol", icon: <Shield size={16} /> },
  { id: 9, label: "Agreement", icon: <FileText size={16} /> },
];

// ── Tax severity helpers ───────────────────────────────────────────
function taxLevel(val) {
  if (val < 25) return { label: "Low", color: "#4CAF50", bg: "#E8F5E9" };
  if (val < 50) return { label: "Moderate", color: "#FFC107", bg: "#FFF8E1" };
  if (val < 75) return { label: "High", color: "#FF7043", bg: "#FBE9E7" };
  return { label: "Critical", color: "#C62828", bg: "#FFEBEE" };
}

function DiscCompareBar({ label, aVal, bVal, aName, bName, color }) {
  const diff = Math.abs(aVal - bVal);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
        <span className="text-xs text-gray-400">Gap: <span className="font-bold text-gray-600">{diff} pts</span></span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-16 text-right truncate">{aName.split(" ")[0]}</span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${aVal}%`, background: color }} />
          </div>
          <span className="text-xs font-bold text-gray-600 w-8">{aVal}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-16 text-right truncate">{bName.split(" ")[0]}</span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full opacity-60" style={{ width: `${bVal}%`, background: color }} />
          </div>
          <span className="text-xs font-bold text-gray-600 w-8">{bVal}</span>
        </div>
      </div>
    </div>
  );
}

// ── Bridge Insights Engine (deterministic, framework-based) ────────
function generateBridgeInsights(personA, personB, frictionType) {
  const aDisc = personA.disc?.natural ? getDominantDisc(personA.disc.natural) : "S";
  const bDisc = personB.disc?.natural ? getDominantDisc(personB.disc.natural) : "S";
  const aName = personA.name.split(" ")[0];
  const bName = personB.name.split(" ")[0];

  // DISC-based SOP commitments from the BTCG Bridge Building Framework
  const discCommitments = {
    D: {
      to: [
        `Lead with the bottom line — give ${bName} the conclusion first, then context if asked`,
        `Respect ${bName}'s pace and process — not every decision needs to be made right now`,
        `Offer options, not directives — frame decisions as choices, not commands`,
      ],
      from: [
        `Come prepared with a clear recommendation — ${aName} values decisiveness`,
        `Keep conversations focused and efficient — avoid lengthy preambles`,
        `Be direct about disagreements — ${aName} respects candor over politeness`,
      ],
    },
    I: {
      to: [
        `Make time for relationship before business — check in on ${bName} as a person first`,
        `Celebrate wins publicly — ${bName} is energized by recognition and acknowledgment`,
        `Create space for ${bName} to think out loud — don't rush to conclusions`,
      ],
      from: [
        `Bring energy and enthusiasm to interactions — ${aName} is fueled by connection`,
        `Don't require ${aName} to have everything figured out before speaking`,
        `Acknowledge the relationship, not just the task`,
      ],
    },
    S: {
      to: [
        `Give ${bName} advance notice before changes — surprises create anxiety, not agility`,
        `Explain the "why" behind shifts in direction — context builds trust`,
        `Create consistency in how you communicate — ${bName} thrives on predictability`,
      ],
      from: [
        `Bring patience to the process — ${aName} needs time to process before committing`,
        `Don't interpret ${aName}'s steadiness as resistance — it's reliability`,
        `Acknowledge ${aName}'s contributions to team stability`,
      ],
    },
    C: {
      to: [
        `Come with data — ${bName} makes better decisions with evidence, not just intuition`,
        `Answer clarifying questions without frustration — they're how ${bName} builds confidence`,
        `Give ${bName} time to analyze before expecting a decision`,
      ],
      from: [
        `Lead with the big picture before diving into detail`,
        `Trust that ${aName}'s thoroughness protects the team from costly mistakes`,
        `Don't require ${aName} to decide before they've had time to think`,
      ],
    },
  };

  if (frictionType === "preference") {
    const aStyle = DISC_LABELS[aDisc];
    const bStyle = DISC_LABELS[bDisc];
    const prefPoints = personA.disc?.natural && personB.disc?.natural
      ? calcDiscGapPoints(personA.disc.natural, personB.disc.natural) : 0;

    return {
      frictionInsight: `${aName} operates from a ${aStyle} foundation — ${aDisc === "D" ? "direct, fast, and results-focused" : aDisc === "I" ? "energetic, relational, and expressive" : aDisc === "S" ? "steady, loyal, and process-oriented" : "precise, analytical, and quality-driven"}. ${bName} leads with ${bStyle} energy — ${bDisc === "D" ? "decisive and outcome-driven" : bDisc === "I" ? "enthusiastic and people-first" : bDisc === "S" ? "consistent and team-focused" : "thorough and standards-driven"}. With ${prefPoints} gap points, this is a ${prefPoints > 100 ? "high-cost" : "moderate"} Preference friction — the kind that shows up daily in communication pace, decision-making, and how each person defines "getting it right."`,
      aCommitments: discCommitments[aDisc]?.to || [],
      bCommitments: discCommitments[bDisc]?.to || [],
    };
  }

  if (frictionType === "passion") {
    const aTopValues = personA.values
      ? Object.entries(personA.values).sort(([, a], [, b]) => b - a).slice(0, 2).map(([k]) => k)
      : [];
    const bTopValues = personB.values
      ? Object.entries(personB.values).sort(([, a], [, b]) => b - a).slice(0, 2).map(([k]) => k)
      : [];

    const valueCommits = {
      Altruistic: `Frame work in terms of who it serves — ${bName} is energized by human impact`,
      Economic: `Connect decisions to measurable outcomes — ${bName} needs to see the ROI`,
      Individualistic: `Give ${bName} autonomy and recognize their unique contributions`,
      Political: `Include ${bName} in key decisions early — they need their voice to shape outcomes`,
      Regulatory: `Be explicit about expectations and the "why" behind policies`,
      Theoretical: `Share reasoning behind decisions — ${bName} needs to understand before committing`,
      Aesthetic: `Honor the quality and form of work — don't rush past the "how it looks" conversation`,
    };

    return {
      frictionInsight: `${aName}'s top motivators are ${aTopValues.join(" and ")} — they're energized by ${aTopValues.includes("Altruistic") ? "helping and human impact" : aTopValues.includes("Economic") ? "results and ROI" : aTopValues.includes("Political") ? "influence and leadership" : "their core drivers"}. ${bName} is driven by ${bTopValues.join(" and ")}. This is a Passion signal — it raises investigation questions, not verdicts. The bridge here is understanding what fills each person's tank and what drains it.`,
      aCommitments: bTopValues.map(v => valueCommits[v] || `Honor ${bName}'s ${v} values in how you work together`),
      bCommitments: aTopValues.map(v => valueCommits[v]?.replace(bName, aName) || `Honor ${aName}'s ${v} values in how you work together`),
    };
  }

  // Process friction
  const aEmpathy = personA.attr?.ext?.find(a => a.label === "Heart")?.score ?? 5;
  const bEmpathy = personB.attr?.ext?.find(a => a.label === "Heart")?.score ?? 5;
  const aPractical = personA.attr?.ext?.find(a => a.label === "Hand")?.score ?? 5;
  const bPractical = personB.attr?.ext?.find(a => a.label === "Hand")?.score ?? 5;
  const aSystems = personA.attr?.ext?.find(a => a.label === "Head")?.score ?? 5;
  const bSystems = personB.attr?.ext?.find(a => a.label === "Head")?.score ?? 5;

  const aLead = aEmpathy > aPractical && aEmpathy > aSystems ? "Heart (people)" : aPractical > aSystems ? "Hand (results)" : "Head (systems)";
  const bLead = bEmpathy > bPractical && bEmpathy > bSystems ? "Heart (people)" : bPractical > bSystems ? "Hand (results)" : "Head (systems)";

  return {
    frictionInsight: `${aName} processes decisions primarily through ${aLead} — they see the world through that lens first. ${bName} leads with ${bLead}. This is a Process signal: when they approach the same problem, they're starting from different places. The 3H Decision Protocol can help — ensuring Heart, Hand, and Head perspectives are all represented before decisions are made.`,
    aCommitments: [
      `Ask "${bName}, what's the ${bLead.split(" ")[0]} perspective here?" before finalizing decisions`,
      `Champion ${bName}'s ${bLead} lens in team discussions — make sure it gets heard`,
      `Use the 3H Protocol: explicitly invite Heart, Hand, and Head input on major decisions`,
    ],
    bCommitments: [
      `Ask "${aName}, what's the ${aLead.split(" ")[0]} perspective here?" before finalizing decisions`,
      `Champion ${aName}'s ${aLead} lens in team discussions — make sure it gets heard`,
      `Recognize that ${aName}'s different processing style is a feature, not a flaw`,
    ],
  };
}

// ── Main Wizard ────────────────────────────────────────────────────
export default function BridgeWizardPage() {
  const router = useRouter();
  const { teamPeople } = useLWYL();
  const [step, setStep] = useState(1);
  const [personA, setPersonA] = useState(null);
  const [personB, setPersonB] = useState(null);
  const [selectedFrictionType, setSelectedFrictionType] = useState(null);
  const [impactStatement, setImpactStatement] = useState("");
  const [triggersDrainA, setTriggersDrainA] = useState(["", "", ""]);
  const [triggersDrainB, setTriggersDrainB] = useState(["", "", ""]);
  const [reconnectA, setReconnectA] = useState("");
  const [reconnectB, setReconnectB] = useState("");
  const [bridgeInsights, setBridgeInsights] = useState(null);
  const [needsFromA, setNeedsFromA] = useState("");
  const [needsFromB, setNeedsFromB] = useState("");
  const [repairProtocol, setRepairProtocol] = useState("");
  const [platinumNotes, setPlatinumNotes] = useState({ discover: "", disclose: "", design: "", develop: "" });
  const [agreementTitle, setAgreementTitle] = useState("");
  const [agreementNotes, setAgreementNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter to completed people: status is undefined when complete in lwyl-app
  const allPeople = teamPeople.filter(p => p.status !== "pending" && p.disc);

  // Agreement save stub
  function handleSaveAgreement() {
    if (!personA || !personB || !bridgeInsights || !selectedFrictionType) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 600);
  }

  // Computed friction percentages
  const prefPoints = personA?.disc?.natural && personB?.disc?.natural
    ? calcDiscGapPoints(personA.disc.natural, personB.disc.natural) : 0;
  const prefTax = gapPointsToPercent(prefPoints);
  const passTax = personA?.values && personB?.values
    ? passionFrictionToPercent(calcPassionFrictionPoints(personA.values, personB.values)) : 0;
  const procTax = personA?.attr && personB?.attr
    ? processFrictionToPercent(calcProcessFrictionPoints(personA.attr, personB.attr)) : 0;

  const highestTax = Math.max(prefTax, passTax, procTax);
  const dominantFriction =
    highestTax === prefTax ? "preference" : highestTax === passTax ? "passion" : "process";

  function handleGenerateInsights() {
    if (!personA || !personB || !selectedFrictionType) return;
    const insights = generateBridgeInsights(personA, personB, selectedFrictionType);
    setBridgeInsights(insights);
  }

  const canAdvance = () => {
    if (step === 1) return !!personA && !!personB && personA.id !== personB.id;
    if (step === 2) return !!selectedFrictionType;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return true;
    if (step === 6) return true;
    if (step === 7) return !!bridgeInsights;
    if (step === 8) return true;
    return true;
  };

  function advance() {
    if (step === 6 && !bridgeInsights) {
      handleGenerateInsights();
    }
    if (step < 9) setStep(s => s + 1);
  }

  // ── Step 1: Select Two People ──────────────────────────────────
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>
        Who are you bridging?
      </h2>
      <p className="text-gray-500 mb-6">Select any two people — leader to staff, staff to staff, or any combination.</p>

      <div className="grid grid-cols-2 gap-6">
        {/* Person A */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[#29B6F6] mb-3">Person A</div>
          <div className="space-y-2">
            {allPeople.map(person => {
              const dominant = person.disc?.natural ? getDominantDisc(person.disc.natural) : "S";
              const color = DISC_COLORS[dominant];
              const initials = person.name.split(" ").map(n => n[0]).join("").slice(0, 2);
              const isSelected = personA?.id === person.id;
              const isDisabled = personB?.id === person.id;
              return (
                <button
                  key={person.id}
                  onClick={() => !isDisabled && setPersonA(person)}
                  disabled={isDisabled}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected ? "border-[#29B6F6] shadow-md" :
                    isDisabled ? "border-gray-100 opacity-40 cursor-not-allowed" :
                    "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                  style={isSelected ? { background: "rgba(41,182,246,0.05)" } : { background: "white" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                      style={{ background: color }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{person.name}</div>
                      <div className="text-xs text-gray-400 truncate">{person.role}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-[#29B6F6] flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Person B */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-green-600 mb-3">Person B</div>
          <div className="space-y-2">
            {allPeople.map(person => {
              const dominant = person.disc?.natural ? getDominantDisc(person.disc.natural) : "S";
              const color = DISC_COLORS[dominant];
              const initials = person.name.split(" ").map(n => n[0]).join("").slice(0, 2);
              const isSelected = personB?.id === person.id;
              const isDisabled = personA?.id === person.id;
              return (
                <button
                  key={person.id}
                  onClick={() => !isDisabled && setPersonB(person)}
                  disabled={isDisabled}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected ? "border-green-500 shadow-md" :
                    isDisabled ? "border-gray-100 opacity-40 cursor-not-allowed" :
                    "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                  style={isSelected ? { background: "rgba(34,197,94,0.05)" } : { background: "white" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                      style={{ background: color }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{person.name}</div>
                      <div className="text-xs text-gray-400 truncate">{person.role}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {personA && personB && personA.id !== personB.id && (
        <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-[#0288D1] font-medium">
          Building a bridge between <strong>{personA.name}</strong> and <strong>{personB.name}</strong>
        </div>
      )}
    </div>
  );

  // ── Step 2: Friction Map ───────────────────────────────────────
  const renderStep2 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>
        Where is the friction?
      </h2>
      <p className="text-gray-500 mb-6">
        Three sources of friction between <strong>{personA?.name}</strong> and <strong>{personB?.name}</strong>. Select the one to address first.
      </p>
      <div className="space-y-4 mb-8">
        {[
          {
            type: "preference",
            label: "Preference Friction",
            description: "HOW they work — DISC behavioral style differences. Confirmed, measurable cost.",
            value: prefTax,
            icon: <Users size={18} />,
          },
          {
            type: "passion",
            label: "Passion Signal",
            description: "WHY they work — Values and motivation gaps. A signal worth investigating.",
            value: passTax,
            icon: <Heart size={18} />,
          },
          {
            type: "process",
            label: "Process Signal",
            description: "HOW they think — Attributes and decision-making style. A signal worth exploring.",
            value: procTax,
            icon: <Brain size={18} />,
          },
        ].map(({ type, label, description, value, icon }) => {
          const level = taxLevel(value);
          const isSelected = selectedFrictionType === type;
          const isHighest = type === dominantFriction;
          return (
            <button
              key={type}
              onClick={() => setSelectedFrictionType(type)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                isSelected ? "border-[#29B6F6] shadow-lg" : "border-gray-100 hover:border-gray-200 hover:shadow-md bg-white"
              }`}
              style={isSelected ? { background: "rgba(41,182,246,0.05)", borderColor: "#29B6F6" } : {}}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: level.bg, color: level.color }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900">{label}</span>
                    {isHighest && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                        Highest
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{description}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-extrabold" style={{ color: level.color }}>{value}%</div>
                  <div className="text-xs font-semibold" style={{ color: level.color }}>{level.label}</div>
                </div>
                {isSelected && <CheckCircle2 size={20} className="text-[#29B6F6] flex-shrink-0" />}
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${value}%`, background: level.color }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Side-by-side comparison */}
      {selectedFrictionType === "preference" && personA?.disc?.natural && personB?.disc?.natural && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-sm font-bold text-gray-700 mb-4">DISC Natural Style Comparison</div>
          {Object.entries(personA.disc.natural).map(([key, aVal]) => (
            <DiscCompareBar
              key={key}
              label={DISC_LABELS[key]}
              aVal={aVal}
              bVal={personB?.disc?.natural?.[key] || 0}
              aName={personA.name}
              bName={personB.name}
              color={DISC_COLORS[key]}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ── Step 3: My Impact Statement (Tool 1) ──────────────────────
  const renderStep3 = () => {
    const aDisc = personA?.disc?.natural ? getDominantDisc(personA.disc.natural) : "S";
    const discBehaviors = {
      D: { behavior: "move fast and make decisions without full consensus", interpretation: "dismissive or controlling", intention: "to get results and protect the team's time", impact: "like their input doesn't matter" },
      I: { behavior: "talk through ideas before they're fully formed", interpretation: "unfocused or scattered", intention: "to build energy and think collaboratively", impact: "like the conversation isn't going anywhere" },
      S: { behavior: "resist change until I understand the full picture", interpretation: "resistant or slow", intention: "to protect stability and make sure no one gets left behind", impact: "like their urgency isn't being respected" },
      C: { behavior: "ask a lot of clarifying questions before committing", interpretation: "doubtful or overcautious", intention: "to ensure quality and avoid costly mistakes", impact: "like they're being interrogated" },
    };
    const defaults = discBehaviors[aDisc];

    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>
          Own Your Impact
        </h2>
        <p className="text-gray-500 mb-2">
          <strong>Tool 1: My Impact Statement.</strong> You can&apos;t build a bridge if you&apos;re standing on the other side blaming the gap.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          This is {personA?.name}&apos;s opportunity to acknowledge their side of the friction — not as an apology, but as an act of humility that opens the door.
        </p>

        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 mb-5">
          <div className="text-xs font-bold uppercase tracking-wide text-[#29B6F6] mb-3">Suggested Template</div>
          <p className="text-sm text-gray-700 leading-relaxed italic">
            &quot;Because of my {DISC_LABELS[aDisc]} style, I tend to <strong>{defaults.behavior}</strong>. I know this can come across as <strong>{defaults.interpretation}</strong>, even though my intention is <strong>{defaults.intention}</strong>. When I do this, it may make you feel <strong>{defaults.impact}</strong>. I&apos;m working on being more aware of this.&quot;
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {personA?.name}&apos;s Impact Statement <span className="text-gray-400 font-normal">(edit or write your own)</span>
          </label>
          <textarea
            value={impactStatement}
            onChange={e => setImpactStatement(e.target.value)}
            placeholder={`"Because of my ${DISC_LABELS[aDisc]} style, I tend to ${defaults.behavior}..."`}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white resize-none"
          />
        </div>

        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            This statement is optional but powerful. Research shows that acknowledging your own contribution to friction — before asking the other person to change — dramatically increases the likelihood of a successful bridge.
          </p>
        </div>

        {/* Bilateral Needs (Tool 3 extension) */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-2">What I Need From You</h3>
          <p className="text-sm text-gray-400 mb-4">Each person states what they need from the other. This is vulnerability, not demand.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {personA?.name.split(" ")[0]} needs from {personB?.name.split(" ")[0]}
              </label>
              <textarea value={needsFromA} onChange={e => setNeedsFromA(e.target.value)}
                placeholder="What I need from you to do my best work..."
                rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {personB?.name.split(" ")[0]} needs from {personA?.name.split(" ")[0]}
              </label>
              <textarea value={needsFromB} onChange={e => setNeedsFromB(e.target.value)}
                placeholder="What I need from you to do my best work..."
                rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] resize-none" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Step 4: Green/Red Zone — Passion-specific ──────────────────
  const renderStep4 = () => {
    const aValues = personA?.values ? Object.entries(personA.values).sort(([, a], [, b]) => b - a) : [];
    const bValues = personB?.values ? Object.entries(personB.values).sort(([, a], [, b]) => b - a) : [];
    const aGreen = aValues.filter(([, s]) => s >= 55).map(([k]) => k);
    const aRed = aValues.filter(([, s]) => s < 25).map(([k]) => k);
    const bGreen = bValues.filter(([, s]) => s >= 55).map(([k]) => k);
    const bRed = bValues.filter(([, s]) => s < 25).map(([k]) => k);

    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>Green / Red Zone</h2>
        <p className="text-gray-500 mb-2"><strong>Tool 4: Passion Zones.</strong> What energizes each person (Green Zone) and what drains them (Red Zone).</p>
        <p className="text-sm text-gray-400 mb-6">This is a Passion signal — it raises questions for investigation, not verdicts.</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="font-bold text-gray-900 mb-3">{personA?.name.split(" ")[0]}</div>
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2">Green Zone (Energizers)</div>
              {aGreen.length > 0 ? aGreen.map(v => (
                <div key={v} className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-700">{v}</span>
                </div>
              )) : <p className="text-xs text-gray-400">No strong motivators detected (&ge;55)</p>}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Red Zone (Drainers)</div>
              {aRed.length > 0 ? aRed.map(v => (
                <div key={v} className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-700">{v}</span>
                </div>
              )) : <p className="text-xs text-gray-400">No strong drainers detected (&lt;25)</p>}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="font-bold text-gray-900 mb-3">{personB?.name.split(" ")[0]}</div>
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2">Green Zone (Energizers)</div>
              {bGreen.length > 0 ? bGreen.map(v => (
                <div key={v} className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-700">{v}</span>
                </div>
              )) : <p className="text-xs text-gray-400">No strong motivators detected</p>}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Red Zone (Drainers)</div>
              {bRed.length > 0 ? bRed.map(v => (
                <div key={v} className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-700">{v}</span>
                </div>
              )) : <p className="text-xs text-gray-400">No strong drainers detected</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Step 5: Platinum Process ──────────────────────────────────
  const renderStep5 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>Platinum Process</h2>
      <p className="text-gray-500 mb-2"><strong>Tool 5: Discover &gt; Disclose &gt; Design &gt; Develop.</strong> The heart of the framework. A guided bilateral conversation.</p>
      <p className="text-sm text-gray-400 mb-6">Each person sees their profile through the lens of &quot;What you need to know about working with me.&quot;</p>
      <div className="space-y-4">
        {[
          { phase: "Discover", desc: "What did you learn about each other from the friction data?", key: "discover", color: "#29B6F6" },
          { phase: "Disclose", desc: "What do you need the other person to know about how you're wired?", key: "disclose", color: "#7E57C2" },
          { phase: "Design", desc: "What specific changes would reduce friction between you?", key: "design", color: "#FF7043" },
          { phase: "Develop", desc: "How will you practice and reinforce these changes over time?", key: "develop", color: "#4CAF50" },
        ].map(({ phase, desc, key, color }) => (
          <div key={key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: color }}>
                {phase[0]}
              </div>
              <div>
                <div className="font-bold text-gray-900">{phase}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </div>
            <textarea
              value={platinumNotes[key]}
              onChange={e => setPlatinumNotes(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={`Notes from the ${phase} conversation...`}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );

  // ── Step 6: 3H Protocol ──────────────────────────────────────
  const renderStep6 = () => {
    const getProcessLens = (p) => {
      if (!p.attr?.ext) return "Unknown";
      const e = p.attr.ext.find(a => a.label === "Heart")?.score ?? 0;
      const pr = p.attr.ext.find(a => a.label === "Hand")?.score ?? 0;
      const s = p.attr.ext.find(a => a.label === "Head")?.score ?? 0;
      if (e >= pr && e >= s) return "Heart (People)";
      if (pr >= s) return "Hand (Results)";
      return "Head (Systems)";
    };
    const aLens = personA ? getProcessLens(personA) : "";
    const bLens = personB ? getProcessLens(personB) : "";

    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>3H Decision Protocol</h2>
        <p className="text-gray-500 mb-2"><strong>Tool 6: Heart / Hand / Head.</strong> Ensure all cognitive lenses are represented before decisions are made.</p>
        <p className="text-sm text-gray-400 mb-6">This is a Process signal — not a verdict. Each person naturally leads with one lens.</p>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
            <div className="font-bold text-gray-900 mb-2">{personA?.name.split(" ")[0]}</div>
            <div className="text-2xl font-extrabold text-[#29B6F6] mb-1">{aLens}</div>
            <p className="text-xs text-gray-400">Primary decision-making lens</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
            <div className="font-bold text-gray-900 mb-2">{personB?.name.split(" ")[0]}</div>
            <div className="text-2xl font-extrabold text-green-600 mb-1">{bLens}</div>
            <p className="text-xs text-gray-400">Primary decision-making lens</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="text-xs font-bold uppercase tracking-wide text-[#29B6F6] mb-3">3H Protocol</div>
          <div className="space-y-3">
            {[
              { lens: "Heart", q: "How does this affect people? Who have we talked to?", color: "#FF7043" },
              { lens: "Hand", q: "What is the fastest path to results? What is actionable now?", color: "#42A5F5" },
              { lens: "Head", q: "What is the system impact? What are we missing long-term?", color: "#66BB6A" },
            ].map(({ lens, q, color }) => (
              <div key={lens} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>
                  {lens[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{lens}</div>
                  <div className="text-xs text-gray-500">{q}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Step 7: Bridge Insights (deterministic, framework-based) ──
  const renderStep7 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>
        Bridge Insights
      </h2>
      <p className="text-gray-500 mb-6">
        Based on the BTCG framework and both profiles, here are the specific commitments that will reduce <strong>{selectedFrictionType}</strong> friction between <strong>{personA?.name}</strong> and <strong>{personB?.name}</strong>.
      </p>

      {!bridgeInsights && (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #29B6F6, #0288D1)" }}>
            <Star size={28} className="text-white" />
          </div>
          <div className="font-bold text-gray-900 mb-2">Ready to generate insights</div>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
            Framework-based commitments grounded in both profiles — no AI required.
          </p>
          <button onClick={handleGenerateInsights} className="lwyl-btn-primary px-8 py-3">
            Generate Bridge Insights <Star size={16} />
          </button>
        </div>
      )}

      {bridgeInsights && (
        <div className="space-y-5">
          {/* Friction Insight */}
          <div className="p-5 rounded-2xl border-l-4 border-[#29B6F6] bg-blue-50">
            <div className="text-xs font-bold uppercase tracking-wide text-[#29B6F6] mb-2">Core Friction Insight</div>
            <p className="text-gray-700 text-sm leading-relaxed">{bridgeInsights.frictionInsight}</p>
          </div>

          {/* Person A Commitments */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: personA?.disc?.natural ? DISC_COLORS[getDominantDisc(personA.disc.natural)] : "#29B6F6" }}>
                {personA?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="font-bold text-gray-900">{personA?.name}&apos;s Commitments</div>
                <div className="text-xs text-gray-400">What {personA?.name.split(" ")[0]} commits to</div>
              </div>
            </div>
            <div className="space-y-3">
              {bridgeInsights.aCommitments.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50">
                  <div className="w-6 h-6 rounded-full bg-[#29B6F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-700">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Person B Commitments */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: personB?.disc?.natural ? DISC_COLORS[getDominantDisc(personB.disc.natural)] : "#4CAF50" }}>
                {personB?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="font-bold text-gray-900">{personB?.name}&apos;s Commitments</div>
                <div className="text-xs text-gray-400">What {personB?.name.split(" ")[0]} commits to</div>
              </div>
            </div>
            <div className="space-y-3">
              {bridgeInsights.bCommitments.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-green-50">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-700">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setStep(8)} className="lwyl-btn-primary w-full py-3 text-base">
            Set Repair Protocol <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );

  // ── Step 8: Repair Protocol ────────────────────────────────────
  const renderStep8 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>Repair Protocol</h2>
      <p className="text-gray-500 mb-2"><strong>When we miss, we will...</strong> Pre-defined recovery steps for when commitments break.</p>
      <p className="text-sm text-gray-400 mb-6">Every bridge needs a repair plan. Not if it breaks — when. The strength of the agreement is in the repair, not the perfection.</p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="font-bold text-gray-900 mb-3">What {personA?.name.split(" ")[0]} needs from {personB?.name.split(" ")[0]}</div>
          <textarea
            value={needsFromA}
            onChange={e => setNeedsFromA(e.target.value)}
            placeholder={`"When things get hard, I need you to..."`}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white resize-none"
          />
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="font-bold text-gray-900 mb-3">What {personB?.name.split(" ")[0]} needs from {personA?.name.split(" ")[0]}</div>
          <textarea
            value={needsFromB}
            onChange={e => setNeedsFromB(e.target.value)}
            placeholder={`"When things get hard, I need you to..."`}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white resize-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="font-bold text-gray-900 mb-3">When We Miss — Our Repair Protocol</div>
        <p className="text-xs text-gray-400 mb-3">What will you both do when someone falls short of their commitments? This is not punitive — it is the bridge back.</p>
        <textarea
          value={repairProtocol}
          onChange={e => setRepairProtocol(e.target.value)}
          placeholder={`"When one of us misses a commitment, we will: (1) Name it without blame within 24 hours. (2) Revisit the commitment together. (3) Adjust if needed — agreements evolve."`}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white resize-none"
        />
      </div>
    </div>
  );

  // ── Step 9: Friction Triggers (Tool 2) ─────────────────────────
  const renderStep9 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>
        Document the Agreement
      </h2>
      <p className="text-gray-500 mb-6">
        <strong>Tool 3: Connection Agreement.</strong> The bridge is built through negotiated commitment, not imposed rules.
      </p>

      {saved ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">Agreement Saved!</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            The Connection Agreement between {personA?.name} and {personB?.name} has been documented.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/app/agreements")} className="lwyl-btn-primary">
              View All Agreements <ArrowRight size={16} />
            </button>
            <button onClick={() => {
              setStep(1); setPersonA(null); setPersonB(null); setBridgeInsights(null);
              setSaved(false); setSelectedFrictionType(null); setImpactStatement("");
              setTriggersDrainA(["", "", ""]); setTriggersDrainB(["", "", ""]);
              setReconnectA(""); setReconnectB("");
              setNeedsFromA(""); setNeedsFromB(""); setRepairProtocol("");
              setPlatinumNotes({ discover: "", disclose: "", design: "", develop: "" });
              setAgreementTitle(""); setAgreementNotes("");
            }} className="lwyl-btn-secondary">
              Start New Bridge
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Agreement Title</label>
            <input
              value={agreementTitle}
              onChange={e => setAgreementTitle(e.target.value)}
              placeholder={`Connection Agreement — ${personA?.name} & ${personB?.name}`}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white"
            />
          </div>

          {bridgeInsights && (
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="text-sm font-bold text-gray-700 mb-3">Agreement Summary</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-[#29B6F6] uppercase tracking-wide mb-2">{personA?.name.split(" ")[0]} Commits To</div>
                  {bridgeInsights.aCommitments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <CheckCircle2 size={12} className="text-[#29B6F6] mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{c}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">{personB?.name.split(" ")[0]} Commits To</div>
                  {bridgeInsights.bCommitments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (optional)</label>
            <textarea
              value={agreementNotes}
              onChange={e => setAgreementNotes(e.target.value)}
              placeholder="Any additional context, follow-up dates, or specific situations to address..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white resize-none"
            />
          </div>

          <button
            onClick={handleSaveAgreement}
            disabled={saving}
            className="lwyl-btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 size={18} /> Save Connection Agreement</>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8, renderStep9];

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #29B6F6, #0288D1)" }}>
                <Zap size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-extrabold text-gray-900" style={{ letterSpacing: "-0.02em" }}>
                Bridge Wizard
              </h1>
            </div>
            <p className="text-sm text-gray-400 ml-10">BTCG 9-Step Bridge Building Framework</p>
          </div>
          <button onClick={() => router.push("/app")} className="lwyl-btn-secondary gap-1.5">
            <X size={14} /> Exit
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => {
            const isComplete = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isComplete ? "bg-[#29B6F6] text-white shadow-md" :
                    isCurrent ? "bg-[#0288D1] text-white shadow-lg scale-110" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {isComplete ? <CheckCircle2 size={16} /> : s.icon}
                  </div>
                  <div className={`text-xs mt-1.5 font-medium transition-colors whitespace-nowrap ${isCurrent ? "text-[#0288D1]" : isComplete ? "text-[#29B6F6]" : "text-gray-300"}`}>
                    {s.label}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-colors duration-500 ${step > s.id ? "bg-[#29B6F6]" : "bg-gray-100"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {stepContent[step - 1]?.()}
        </div>

        {/* Navigation */}
        {!saved && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : router.push("/app")}
              className="lwyl-btn-secondary gap-2"
            >
              <ChevronLeft size={16} />
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step < 9 && (
              <button
                onClick={advance}
                disabled={!canAdvance()}
                className="lwyl-btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 6 ? (
                  <>Generate Insights <Star size={16} /></>
                ) : (
                  <>Continue <ChevronRight size={16} /></>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
