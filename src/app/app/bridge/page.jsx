'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Users, Zap, Heart, Brain,
  CheckCircle2, Loader2, ArrowRight, X,
  FileText, Shield, Star, MessageSquare, Calendar, Bell
} from 'lucide-react';
import { useLWYL } from '../../contexts/LWYLContext';
import { getBridgeFrictionNarrative } from '../../knowledge/narrativeEngine';
import { PersonChip } from '../../components/ui/PersonChip';
import { GapBar } from '../../components/ui/GapBar';
import { InsightCard } from '../../components/ui/InsightCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import confetti from 'canvas-confetti';
import { LoadingMoment } from '../../components/ui/LoadingMoment';

const DISC_LABELS = { D: 'Decisive', I: 'Interactive', S: 'Stabilizing', C: 'Cautious' };

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
  const aHeart = attrA.ext?.find(a => a.label === 'Heart')?.score ?? 5;
  const bHeart = attrB.ext?.find(a => a.label === 'Heart')?.score ?? 5;
  const aHand = attrA.ext?.find(a => a.label === 'Hand')?.score ?? 5;
  const bHand = attrB.ext?.find(a => a.label === 'Hand')?.score ?? 5;
  const aHead = attrA.ext?.find(a => a.label === 'Head')?.score ?? 5;
  const bHead = attrB.ext?.find(a => a.label === 'Head')?.score ?? 5;
  return Math.abs(aHeart - bHeart) + Math.abs(aHand - bHand) + Math.abs(aHead - bHead);
}

function processFrictionToPercent(points) {
  return Math.min(100, Math.round((points / 30) * 100));
}

function taxLevel(val) {
  if (val < 25) return { label: 'Low', accent: 'friction-low' };
  if (val < 50) return { label: 'Moderate', accent: 'friction-moderate' };
  if (val < 75) return { label: 'High', accent: 'friction-high' };
  return { label: 'Critical', accent: 'friction-high' };
}

const STEPS = [
  { id: 1, label: 'Select People', icon: <Users size={16} /> },
  { id: 2, label: 'Friction Map', icon: <Zap size={16} /> },
  { id: 3, label: 'Impact + Needs', icon: <Shield size={16} /> },
  { id: 4, label: 'Green/Red Zone', icon: <Heart size={16} /> },
  { id: 5, label: 'Platinum Process', icon: <Star size={16} /> },
  { id: 6, label: '3H Protocol', icon: <Brain size={16} /> },
  { id: 7, label: 'Bridge Insights', icon: <Star size={16} /> },
  { id: 8, label: 'Repair Protocol', icon: <Shield size={16} /> },
  { id: 9, label: 'Agreement', icon: <FileText size={16} /> },
];

// Bridge Insights Engine
function generateBridgeInsights(personA, personB, frictionType) {
  const aDisc = personA.disc?.natural ? getDominantDisc(personA.disc.natural) : 'S';
  const bDisc = personB.disc?.natural ? getDominantDisc(personB.disc.natural) : 'S';
  const aName = personA.name.split(' ')[0];
  const bName = personB.name.split(' ')[0];

  const discCommitments = {
    D: {
      to: [
        `Lead with the bottom line -- give ${bName} the conclusion first, then context if asked`,
        `Respect ${bName}'s pace and process -- not every decision needs to be made right now`,
        `Offer options, not directives -- frame decisions as choices, not commands`,
      ],
      from: [
        `Come prepared with a clear recommendation -- ${aName} values decisiveness`,
        `Keep conversations focused and efficient -- avoid lengthy preambles`,
        `Be direct about disagreements -- ${aName} respects candor over politeness`,
      ],
    },
    I: {
      to: [
        `Make time for relationship before business -- check in on ${bName} as a person first`,
        `Celebrate wins publicly -- ${bName} is energized by recognition and acknowledgment`,
        `Create space for ${bName} to think out loud -- don't rush to conclusions`,
      ],
      from: [
        `Bring energy and enthusiasm to interactions -- ${aName} is fueled by connection`,
        `Don't require ${aName} to have everything figured out before speaking`,
        `Acknowledge the relationship, not just the task`,
      ],
    },
    S: {
      to: [
        `Give ${bName} advance notice before changes -- surprises create anxiety, not agility`,
        `Explain the "why" behind shifts in direction -- context builds trust`,
        `Create consistency in how you communicate -- ${bName} thrives on predictability`,
      ],
      from: [
        `Bring patience to the process -- ${aName} needs time to process before committing`,
        `Don't interpret ${aName}'s steadiness as resistance -- it's reliability`,
        `Acknowledge ${aName}'s contributions to team stability`,
      ],
    },
    C: {
      to: [
        `Come with data -- ${bName} makes better decisions with evidence, not just intuition`,
        `Answer clarifying questions without frustration -- they're how ${bName} builds confidence`,
        `Give ${bName} time to analyze before expecting a decision`,
      ],
      from: [
        `Lead with the big picture before diving into detail`,
        `Trust that ${aName}'s thoroughness protects the team from costly mistakes`,
        `Don't require ${aName} to decide before they've had time to think`,
      ],
    },
  };

  if (frictionType === 'preference') {
    const aStyle = DISC_LABELS[aDisc];
    const bStyle = DISC_LABELS[bDisc];
    const prefPoints = personA.disc?.natural && personB.disc?.natural
      ? calcDiscGapPoints(personA.disc.natural, personB.disc.natural) : 0;
    return {
      frictionInsight: `${aName} operates from a ${aStyle} foundation -- ${aDisc === 'D' ? 'direct, fast, and results-focused' : aDisc === 'I' ? 'energetic, relational, and expressive' : aDisc === 'S' ? 'steady, loyal, and process-oriented' : 'precise, analytical, and quality-driven'}. ${bName} leads with ${bStyle} energy -- ${bDisc === 'D' ? 'decisive and outcome-driven' : bDisc === 'I' ? 'enthusiastic and people-first' : bDisc === 'S' ? 'consistent and team-focused' : 'thorough and standards-driven'}. With ${prefPoints} gap points, this is a ${prefPoints > 100 ? 'high-cost' : 'moderate'} Preference friction -- the kind that shows up daily in communication pace, decision-making, and how each person defines "getting it right."`,
      aCommitments: discCommitments[aDisc]?.to || [],
      bCommitments: discCommitments[bDisc]?.to || [],
    };
  }

  if (frictionType === 'passion') {
    const aTopValues = personA.values
      ? Object.entries(personA.values).sort(([, a], [, b]) => b - a).slice(0, 2).map(([k]) => k)
      : [];
    const bTopValues = personB.values
      ? Object.entries(personB.values).sort(([, a], [, b]) => b - a).slice(0, 2).map(([k]) => k)
      : [];
    const valueCommits = {
      Altruistic: `Frame work in terms of who it serves -- ${bName} is energized by human impact`,
      Economic: `Connect decisions to measurable outcomes -- ${bName} needs to see the ROI`,
      Individualistic: `Give ${bName} autonomy and recognize their unique contributions`,
      Political: `Include ${bName} in key decisions early -- they need their voice to shape outcomes`,
      Regulatory: `Be explicit about expectations and the "why" behind policies`,
      Theoretical: `Share reasoning behind decisions -- ${bName} needs to understand before committing`,
      Aesthetic: `Honor the quality and form of work -- don't rush past the "how it looks" conversation`,
    };
    return {
      frictionInsight: `${aName}'s top motivators are ${aTopValues.join(' and ')} -- they're energized by ${aTopValues.includes('Altruistic') ? 'helping and human impact' : aTopValues.includes('Economic') ? 'results and ROI' : aTopValues.includes('Political') ? 'influence and leadership' : 'their core drivers'}. ${bName} is driven by ${bTopValues.join(' and ')}. This is a Passion signal -- it raises investigation questions, not verdicts. The bridge here is understanding what fills each person's tank and what drains it.`,
      aCommitments: bTopValues.map(v => valueCommits[v] || `Honor ${bName}'s ${v} values in how you work together`),
      bCommitments: aTopValues.map(v => valueCommits[v]?.replace(bName, aName) || `Honor ${aName}'s ${v} values in how you work together`),
    };
  }

  // Process friction
  const aEmpathy = personA.attr?.ext?.find(a => a.label === 'Heart')?.score ?? 5;
  const bEmpathy = personB.attr?.ext?.find(a => a.label === 'Heart')?.score ?? 5;
  const aPractical = personA.attr?.ext?.find(a => a.label === 'Hand')?.score ?? 5;
  const bPractical = personB.attr?.ext?.find(a => a.label === 'Hand')?.score ?? 5;
  const aSystems = personA.attr?.ext?.find(a => a.label === 'Head')?.score ?? 5;
  const bSystems = personB.attr?.ext?.find(a => a.label === 'Head')?.score ?? 5;
  const aLead = aEmpathy > aPractical && aEmpathy > aSystems ? 'Heart (people)' : aPractical > aSystems ? 'Hand (results)' : 'Head (systems)';
  const bLead = bEmpathy > bPractical && bEmpathy > bSystems ? 'Heart (people)' : bPractical > bSystems ? 'Hand (results)' : 'Head (systems)';

  return {
    frictionInsight: `${aName} processes decisions primarily through ${aLead} -- they see the world through that lens first. ${bName} leads with ${bLead}. This is a Process signal: when they approach the same problem, they're starting from different places. The 3H Decision Protocol can help -- ensuring Heart, Hand, and Head perspectives are all represented before decisions are made.`,
    aCommitments: [
      `Ask "${bName}, what's the ${bLead.split(' ')[0]} perspective here?" before finalizing decisions`,
      `Champion ${bName}'s ${bLead} lens in team discussions -- make sure it gets heard`,
      `Use the 3H Protocol: explicitly invite Heart, Hand, and Head input on major decisions`,
    ],
    bCommitments: [
      `Ask "${aName}, what's the ${aLead.split(' ')[0]} perspective here?" before finalizing decisions`,
      `Champion ${aName}'s ${aLead} lens in team discussions -- make sure it gets heard`,
      `Recognize that ${aName}'s different processing style is a feature, not a flaw`,
    ],
  };
}

// Preview moment component -- fires after both people selected
function SelectionPreview({ personA, personB }) {
  if (!personA?.disc?.natural || !personB?.disc?.natural) return null;

  const dims = ['D', 'I', 'S', 'C'];
  const dimNames = { D: 'Dominance', I: 'Influence', S: 'Steadiness', C: 'Compliance' };
  const gaps = dims.map(d => ({
    dim: d,
    gap: Math.abs(personA.disc.natural[d] - personB.disc.natural[d]),
    aScore: personA.disc.natural[d],
    bScore: personB.disc.natural[d],
  })).sort((a, b) => b.gap - a.gap);

  const top = gaps[0];
  if (top.gap < 10) return null;

  const higher = top.aScore > top.bScore ? personA.name.split(' ')[0] : personB.name.split(' ')[0];
  const lower = top.aScore > top.bScore ? personB.name.split(' ')[0] : personA.name.split(' ')[0];

  return (
    <InsightCard variant="standard" enterDelay={200}>
      <div className="mb-3">
        <GapBar
          value={top.gap}
          dimension={top.dim}
          label={`${dimNames[top.dim]} gap between them`}
        />
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        The gap between their {dimNames[top.dim]} scores is {top.gap} points.
        {top.dim === 'S' && ` When ${lower} moves fast, ${higher} carries the cost.`}
        {top.dim === 'D' && ` When ${higher} pushes for decisions, ${lower} feels overrun.`}
        {top.dim === 'I' && ` When ${higher} leads with energy, ${lower} needs substance first.`}
        {top.dim === 'C' && ` When ${higher} demands rigor, ${lower} wants to move.`}
        {' '}Here is how to bridge it.
      </p>
    </InsightCard>
  );
}

// DISC compare bar using GapBar
function DiscCompareRow({ dimKey, aVal, bVal, aName, bName }) {
  const dimNames = { D: 'Decisive', I: 'Interactive', S: 'Stabilizing', C: 'Cautious' };
  const diff = Math.abs(aVal - bVal);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-semibold text-disc-${dimKey.toLowerCase()}`}>{dimNames[dimKey]}</span>
        <span className="text-xs text-muted">Gap: <span className="font-bold text-foreground">{diff} pts</span></span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted w-16 text-right truncate">{aName.split(' ')[0]}</span>
          <div className="flex-1 h-2.5 bg-subtle rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-disc-${dimKey.toLowerCase()}`} style={{ width: `${aVal}%` }} />
          </div>
          <span className="text-xs font-bold text-foreground w-8">{aVal}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted w-16 text-right truncate">{bName.split(' ')[0]}</span>
          <div className="flex-1 h-2.5 bg-subtle rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-disc-${dimKey.toLowerCase()} opacity-60`} style={{ width: `${bVal}%` }} />
          </div>
          <span className="text-xs font-bold text-foreground w-8">{bVal}</span>
        </div>
      </div>
    </div>
  );
}

// Main Wizard
export default function BridgeWizardPage() {
  const router = useRouter();
  const { teamPeople, isLoading, saveAgreement } = useLWYL();
  const [step, setStep] = useState(1);
  const [personA, setPersonA] = useState(null);
  const [personB, setPersonB] = useState(null);
  const [selectedFrictionType, setSelectedFrictionType] = useState(null);
  const [impactStatement, setImpactStatement] = useState('');
  const [triggersDrainA, setTriggersDrainA] = useState(['', '', '']);
  const [triggersDrainB, setTriggersDrainB] = useState(['', '', '']);
  const [reconnectA, setReconnectA] = useState('');
  const [reconnectB, setReconnectB] = useState('');
  const [bridgeInsights, setBridgeInsights] = useState(null);
  const [needsFromA, setNeedsFromA] = useState('');
  const [needsFromB, setNeedsFromB] = useState('');
  const [repairProtocol, setRepairProtocol] = useState('');
  const [platinumNotes, setPlatinumNotes] = useState({ discover: '', disclose: '', design: '', develop: '' });
  const [agreementTitle, setAgreementTitle] = useState('');
  const [agreementNotes, setAgreementNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check-in scheduling
  const [checkInFreq, setCheckInFreq] = useState('biweekly');
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [checkInReminder, setCheckInReminder] = useState(1);

  if (isLoading) return <div className="min-h-screen bg-background p-8"><div className="max-w-2xl mx-auto"><LoadingMoment message="Assembling the bridge analysis..." /></div></div>;

  const allPeople = teamPeople.filter(p => p.status !== 'pending' && p.disc);

  function handleSaveAgreement() {
    if (!personA || !personB || !bridgeInsights || !selectedFrictionType) return;
    setSaving(true);

    // Build the agreement object
    const agreement = {
      id: Date.now().toString(),
      personAId: personA.id,
      personBId: personB.id,
      personAName: personA.name,
      personBName: personB.name,
      frictionType: selectedFrictionType,
      frictionInsight: bridgeInsights.frictionInsight,
      personACommitments: bridgeInsights.aCommitments,
      personBCommitments: bridgeInsights.bCommitments,
      title: agreementTitle || `Connection Agreement -- ${personA.name} & ${personB.name}`,
      notes: agreementNotes,
      impactStatement,
      needsFromA,
      needsFromB,
      repairProtocol,
      platinumNotes,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      checkIn: {
        frequency: checkInFreq,
        nextDate: checkInDate,
        reminderDaysBefore: checkInReminder,
        notes: '',
        completedDates: [],
      },
    };

    setTimeout(() => {
      // Save to context (persists to localStorage)
      saveAgreement(agreement);
      setSaving(false);
      setSaved(true);
      // The leader built something real. This is the IKEA Effect peak.
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C8A96E', '#4CAF50', '#29B6F6', '#FFC107'],
        disableForReducedMotion: true,
      });
    }, 600);
  }

  const prefPoints = personA?.disc?.natural && personB?.disc?.natural
    ? calcDiscGapPoints(personA.disc.natural, personB.disc.natural) : 0;
  const prefTax = gapPointsToPercent(prefPoints);
  const passTax = personA?.values && personB?.values
    ? passionFrictionToPercent(calcPassionFrictionPoints(personA.values, personB.values)) : 0;
  const procTax = personA?.attr && personB?.attr
    ? processFrictionToPercent(calcProcessFrictionPoints(personA.attr, personB.attr)) : 0;
  const highestTax = Math.max(prefTax, passTax, procTax);
  const dominantFriction = highestTax === prefTax ? 'preference' : highestTax === passTax ? 'passion' : 'process';

  function handleGenerateInsights() {
    if (!personA || !personB || !selectedFrictionType) return;
    setBridgeInsights(generateBridgeInsights(personA, personB, selectedFrictionType));
  }

  const canAdvance = () => {
    if (step === 1) return !!personA && !!personB && personA.id !== personB.id;
    if (step === 2) return !!selectedFrictionType;
    if (step === 7) return !!bridgeInsights;
    return true;
  };

  function advance() {
    if (step === 6 && !bridgeInsights) handleGenerateInsights();
    if (step < 9) setStep(s => s + 1);
  }

  // Step 1: Select Two People
  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <SectionHeader title="Who are you bridging?" subtitle="Select any two people -- leader to staff, staff to staff, or any combination." />

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-disc-c mb-3">Person A</div>
          <div className="flex flex-col gap-2">
            {allPeople.map(person => {
              const dominant = person.disc?.natural ? getDominantDisc(person.disc.natural) : 'S';
              const isSelected = personA?.id === person.id;
              const isDisabled = personB?.id === person.id;
              return (
                <div key={person.id} className="w-full">
                  <PersonChip
                    name={person.name}
                    disc={dominant}
                    size="md"
                    selected={isSelected}
                    onClick={isDisabled ? undefined : () => setPersonA(person)}
                    fullWidth
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-disc-s mb-3">Person B</div>
          <div className="flex flex-col gap-2">
            {allPeople.map(person => {
              const dominant = person.disc?.natural ? getDominantDisc(person.disc.natural) : 'S';
              const isSelected = personB?.id === person.id;
              const isDisabled = personA?.id === person.id;
              return (
                <div key={person.id} className="w-full">
                  <PersonChip
                    name={person.name}
                    disc={dominant}
                    size="md"
                    selected={isSelected}
                    onClick={isDisabled ? undefined : () => setPersonB(person)}
                    fullWidth
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview moment -- fires after both selected */}
      <AnimatePresence>
        {personA && personB && personA.id !== personB.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mt-6"
          >
            <SelectionPreview personA={personA} personB={personB} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Step 2: Friction Map
  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <SectionHeader title="Where is the friction?" subtitle={`Three sources of friction between ${personA?.name} and ${personB?.name}. Select the one to address first.`} />

      <div className="space-y-4 mb-8">
        {[
          { type: 'preference', label: 'Preference Friction', description: 'HOW they work -- DISC behavioral style differences. Confirmed, measurable cost.', value: prefTax, icon: <Users size={18} /> },
          { type: 'passion', label: 'Passion Signal', description: 'WHY they work -- Values and motivation gaps. A signal worth investigating.', value: passTax, icon: <Heart size={18} /> },
          { type: 'process', label: 'Process Signal', description: 'HOW they think -- Attributes and decision-making style. A signal worth exploring.', value: procTax, icon: <Brain size={18} /> },
        ].map(({ type, label, description, value, icon }) => {
          const level = taxLevel(value);
          const isSelected = selectedFrictionType === type;
          const isHighest = type === dominantFriction;
          return (
            <button
              key={type}
              onClick={() => setSelectedFrictionType(type)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                isSelected ? 'border-nav-accent shadow-lg bg-subtle' : 'border-border hover:border-foreground/20 hover:shadow-md bg-card'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-${level.accent}/15 text-${level.accent}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-foreground">{label}</span>
                    {isHighest && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-friction-moderate/15 text-friction-moderate">
                        Highest
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted">{description}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xl font-extrabold text-${level.accent}`}>{value}%</div>
                  <div className={`text-xs font-semibold text-${level.accent}`}>{level.label}</div>
                </div>
                {isSelected && <CheckCircle2 size={20} className="text-nav-accent flex-shrink-0" />}
              </div>
              <div className="mt-3">
                <GapBar value={value} maxValue={100} showNumber={false} />
              </div>
            </button>
          );
        })}
      </div>

      {selectedFrictionType === 'preference' && personA?.disc?.natural && personB?.disc?.natural && (
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="text-sm font-bold text-foreground mb-4">Behavioral Style Comparison</div>
          {Object.entries(personA.disc.natural).map(([key, aVal]) => {
            const bVal = personB?.disc?.natural?.[key] || 0;
            const narr = getBridgeFrictionNarrative(key, aVal, bVal, personA.name, personB.name);
            return (
              <div key={key}>
                <DiscCompareRow dimKey={key} aVal={aVal} bVal={bVal} aName={personA.name} bName={personB.name} />
                {narr && (
                  <div className="mb-4 -mt-2 ml-[72px] mr-2 p-2.5 rounded-lg bg-alert-warning-bg border border-alert-warning-border">
                    <div className="text-[11px] text-alert-warning-text leading-relaxed">{narr.narrative}</div>
                    <div className="text-[10px] text-alert-success-accent mt-1.5"><strong>Try this:</strong> {narr.action}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  // Step 3: Impact Statement
  const renderStep3 = () => {
    const aDisc = personA?.disc?.natural ? getDominantDisc(personA.disc.natural) : 'S';
    const discBehaviors = {
      D: { behavior: 'move fast and make decisions without full consensus', interpretation: 'dismissive or controlling', intention: 'to get results and protect the team\'s time', impact: 'like their input doesn\'t matter' },
      I: { behavior: 'talk through ideas before they\'re fully formed', interpretation: 'unfocused or scattered', intention: 'to build energy and think collaboratively', impact: 'like the conversation isn\'t going anywhere' },
      S: { behavior: 'resist change until I understand the full picture', interpretation: 'resistant or slow', intention: 'to protect stability and make sure no one gets left behind', impact: 'like their urgency isn\'t being respected' },
      C: { behavior: 'ask a lot of clarifying questions before committing', interpretation: 'doubtful or overcautious', intention: 'to ensure quality and avoid costly mistakes', impact: 'like they\'re being interrogated' },
    };
    const defaults = discBehaviors[aDisc];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SectionHeader title="Own Your Impact" subtitle={`Tool 1: My Impact Statement. You can't build a bridge if you're standing on the other side blaming the gap.`} />
        <p className="text-sm text-muted mb-6">
          This is {personA?.name}'s opportunity to acknowledge their side of the friction -- not as an apology, but as an act of humility that opens the door.
        </p>

        <div className="bg-alert-info-bg rounded-2xl p-5 border border-alert-info-border mb-5">
          <div className="text-xs font-bold uppercase tracking-wide text-alert-info-accent mb-3">Suggested Template</div>
          <p className="text-sm text-alert-info-text leading-relaxed italic">
            "Because of my {DISC_LABELS[aDisc]} style, I tend to <strong>{defaults.behavior}</strong>. I know this can come across as <strong>{defaults.interpretation}</strong>, even though my intention is <strong>{defaults.intention}</strong>. When I do this, it may make you feel <strong>{defaults.impact}</strong>. I'm working on being more aware of this."
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            {personA?.name}'s Impact Statement <span className="text-muted font-normal">(edit or write your own)</span>
          </label>
          <textarea value={impactStatement} onChange={e => setImpactStatement(e.target.value)}
            placeholder={`"Because of my ${DISC_LABELS[aDisc]} style, I tend to ${defaults.behavior}..."`}
            rows={5} className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:border-nav-accent bg-card resize-none" />
        </div>

        <div className="mt-4 p-4 rounded-xl bg-subtle border border-border">
          <p className="text-xs text-muted leading-relaxed">
            This statement is optional but powerful. Research shows that acknowledging your own contribution to friction -- before asking the other person to change -- dramatically increases the likelihood of a successful bridge.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-bold text-foreground mb-2">What I Need From You</h3>
          <p className="text-sm text-muted mb-4">Each person states what they need from the other. This is vulnerability, not demand.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
                {personA?.name.split(' ')[0]} needs from {personB?.name.split(' ')[0]}
              </label>
              <textarea value={needsFromA} onChange={e => setNeedsFromA(e.target.value)}
                placeholder="What I need from you to do my best work..."
                rows={3} className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-nav-accent resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
                {personB?.name.split(' ')[0]} needs from {personA?.name.split(' ')[0]}
              </label>
              <textarea value={needsFromB} onChange={e => setNeedsFromB(e.target.value)}
                placeholder="What I need from you to do my best work..."
                rows={3} className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-nav-accent resize-none" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Step 4: Green/Red Zone
  const renderStep4 = () => {
    const aValues = personA?.values ? Object.entries(personA.values).sort(([, a], [, b]) => b - a) : [];
    const bValues = personB?.values ? Object.entries(personB.values).sort(([, a], [, b]) => b - a) : [];
    const aGreen = aValues.filter(([, s]) => s >= 55).map(([k]) => k);
    const aRed = aValues.filter(([, s]) => s < 25).map(([k]) => k);
    const bGreen = bValues.filter(([, s]) => s >= 55).map(([k]) => k);
    const bRed = bValues.filter(([, s]) => s < 25).map(([k]) => k);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SectionHeader title="Green / Red Zone" subtitle="What energizes each person (Green Zone) and what drains them (Red Zone)." />
        <p className="text-sm text-muted mb-6">This is a Passion signal -- it raises questions for investigation, not verdicts.</p>
        <div className="grid grid-cols-2 gap-6">
          {[{ person: personA, green: aGreen, red: aRed }, { person: personB, green: bGreen, red: bRed }].map(({ person, green, red }) => (
            <div key={person?.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <div className="font-bold text-foreground mb-3">{person?.name.split(' ')[0]}</div>
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-wide text-friction-low mb-2">Green Zone (Energizers)</div>
                {green.length > 0 ? green.map(v => (
                  <div key={v} className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-friction-low" />
                    <span className="text-sm text-foreground">{v}</span>
                  </div>
                )) : <p className="text-xs text-muted">No strong motivators detected</p>}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-friction-high mb-2">Red Zone (Drainers)</div>
                {red.length > 0 ? red.map(v => (
                  <div key={v} className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-friction-high" />
                    <span className="text-sm text-foreground">{v}</span>
                  </div>
                )) : <p className="text-xs text-muted">No strong drainers detected</p>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Step 5: Platinum Process
  const renderStep5 = () => {
    const phases = [
      { phase: 'Discover', desc: 'What did you learn about each other from the friction data?', key: 'discover' },
      { phase: 'Disclose', desc: 'What do you need the other person to know about how you\'re wired?', key: 'disclose' },
      { phase: 'Design', desc: 'What specific changes would reduce friction between you?', key: 'design' },
      { phase: 'Develop', desc: 'How will you practice and reinforce these changes over time?', key: 'develop' },
    ];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SectionHeader title="Platinum Process" subtitle="Discover > Disclose > Design > Develop. The heart of the framework." />
        <p className="text-sm text-muted mb-6">Each person sees their profile through the lens of "What you need to know about working with me."</p>
        <div className="space-y-4">
          {phases.map(({ phase, desc, key }) => (
            <div key={key} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-nav">
                  {phase[0]}
                </div>
                <div>
                  <div className="font-bold text-foreground">{phase}</div>
                  <div className="text-xs text-muted">{desc}</div>
                </div>
              </div>
              <textarea value={platinumNotes[key]} onChange={e => setPlatinumNotes(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={`Notes from the ${phase} conversation...`}
                rows={3} className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:border-nav-accent bg-card resize-none" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Step 6: 3H Protocol
  const renderStep6 = () => {
    const getProcessLens = (p) => {
      if (!p.attr?.ext) return 'Unknown';
      const e = p.attr.ext.find(a => a.label === 'Heart')?.score ?? 0;
      const pr = p.attr.ext.find(a => a.label === 'Hand')?.score ?? 0;
      const s = p.attr.ext.find(a => a.label === 'Head')?.score ?? 0;
      if (e >= pr && e >= s) return 'Heart (People)';
      if (pr >= s) return 'Hand (Results)';
      return 'Head (Systems)';
    };
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SectionHeader title="3H Decision Protocol" subtitle="Ensure all cognitive lenses are represented before decisions are made." />
        <p className="text-sm text-muted mb-6">This is a Process signal -- not a verdict. Each person naturally leads with one lens.</p>
        <div className="grid grid-cols-2 gap-6 mb-6">
          {[personA, personB].map(p => (
            <div key={p?.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm text-center">
              <div className="font-bold text-foreground mb-2">{p?.name.split(' ')[0]}</div>
              <div className="text-2xl font-extrabold text-nav-accent mb-1">{p ? getProcessLens(p) : ''}</div>
              <p className="text-xs text-muted">Primary decision-making lens</p>
            </div>
          ))}
        </div>
        <div className="bg-alert-info-bg rounded-2xl p-5 border border-alert-info-border">
          <div className="text-xs font-bold uppercase tracking-wide text-alert-info-accent mb-3">3H Protocol</div>
          <div className="space-y-3">
            {[
              { lens: 'Heart', q: 'How does this affect people? Who have we talked to?' },
              { lens: 'Hand', q: 'What is the fastest path to results? What is actionable now?' },
              { lens: 'Head', q: 'What is the system impact? What are we missing long-term?' },
            ].map(({ lens, q }) => (
              <div key={lens} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-nav">
                  {lens[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{lens}</div>
                  <div className="text-xs text-muted">{q}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Step 7: Bridge Insights
  const renderStep7 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <SectionHeader title="Bridge Insights" subtitle={`Based on the BTCG framework and both profiles, here are the specific commitments that will reduce ${selectedFrictionType} friction.`} />

      {!bridgeInsights && (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-nav">
            <Star size={28} className="text-white" />
          </div>
          <div className="font-bold text-foreground mb-2">Ready to generate insights</div>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            Framework-based commitments grounded in both profiles -- no AI required.
          </p>
          <button onClick={handleGenerateInsights} className="px-8 py-3 rounded-xl bg-nav text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            Generate Bridge Insights <Star size={16} />
          </button>
        </div>
      )}

      {bridgeInsights && (
        <div className="space-y-5">
          <InsightCard variant="standard">
            <div className="text-xs font-bold uppercase tracking-wide text-nav-accent mb-2">Core Friction Insight</div>
            <p className="text-sm text-foreground/80 leading-relaxed">{bridgeInsights.frictionInsight}</p>
          </InsightCard>

          {[
            { person: personA, commitments: bridgeInsights.aCommitments },
            { person: personB, commitments: bridgeInsights.bCommitments },
          ].map(({ person, commitments }) => {
            const dom = person?.disc?.natural ? getDominantDisc(person.disc.natural) : 'S';
            return (
              <div key={person?.id} className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <PersonChip name={person?.name} disc={dom} size="sm" />
                  <div>
                    <div className="font-bold text-foreground">{person?.name}'s Commitments</div>
                    <div className="text-xs text-muted">What {person?.name.split(' ')[0]} commits to</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {commitments.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-subtle">
                      <div className="w-6 h-6 rounded-full bg-nav flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="text-sm text-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  // Step 8: Repair Protocol
  const renderStep8 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <SectionHeader title="Repair Protocol" subtitle="When we miss, we will... Pre-defined recovery steps for when commitments break." />
      <p className="text-sm text-muted mb-6">Every bridge needs a repair plan. Not if it breaks -- when. The strength of the agreement is in the repair, not the perfection.</p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {[
          { person: personA, other: personB, value: needsFromA, set: setNeedsFromA },
          { person: personB, other: personA, value: needsFromB, set: setNeedsFromB },
        ].map(({ person, other, value, set }) => (
          <div key={person?.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="font-bold text-foreground mb-3">What {person?.name.split(' ')[0]} needs from {other?.name.split(' ')[0]}</div>
            <textarea value={value} onChange={e => set(e.target.value)}
              placeholder={`"When things get hard, I need you to..."`}
              rows={3} className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:border-nav-accent bg-card resize-none" />
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
        <div className="font-bold text-foreground mb-3">When We Miss -- Our Repair Protocol</div>
        <p className="text-xs text-muted mb-3">What will you both do when someone falls short of their commitments? This is not punitive -- it is the bridge back.</p>
        <textarea value={repairProtocol} onChange={e => setRepairProtocol(e.target.value)}
          placeholder={`"When one of us misses a commitment, we will: (1) Name it without blame within 24 hours. (2) Revisit the commitment together. (3) Adjust if needed -- agreements evolve."`}
          rows={4} className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:border-nav-accent bg-card resize-none" />
      </div>
    </motion.div>
  );

  // Step 9: Agreement
  const renderStep9 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <SectionHeader title="Document the Agreement" subtitle="Tool 3: Connection Agreement. The bridge is built through negotiated commitment, not imposed rules." />

      {saved ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-alert-success-bg flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-friction-low" />
          </div>
          <h3 className="text-xl font-extrabold text-foreground mb-2">Agreement Saved!</h3>
          <p className="text-muted mb-8 max-w-sm mx-auto">
            The Connection Agreement between {personA?.name} and {personB?.name} has been documented.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/app/agreements')} className="px-5 py-2.5 rounded-xl bg-nav text-white text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              View All Agreements <ArrowRight size={16} />
            </button>
            <button onClick={() => {
              setStep(1); setPersonA(null); setPersonB(null); setBridgeInsights(null);
              setSaved(false); setSelectedFrictionType(null); setImpactStatement('');
              setTriggersDrainA(['', '', '']); setTriggersDrainB(['', '', '']);
              setReconnectA(''); setReconnectB('');
              setNeedsFromA(''); setNeedsFromB(''); setRepairProtocol('');
              setPlatinumNotes({ discover: '', disclose: '', design: '', develop: '' });
              setAgreementTitle(''); setAgreementNotes('');
            }} className="px-5 py-2.5 rounded-xl bg-subtle text-foreground text-sm font-semibold border border-border hover:bg-card transition-colors">
              Start New Bridge
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Agreement Title</label>
            <input value={agreementTitle} onChange={e => setAgreementTitle(e.target.value)}
              placeholder={`Connection Agreement -- ${personA?.name} & ${personB?.name}`}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:border-nav-accent bg-card" />
          </div>

          {bridgeInsights && (
            <div className="bg-subtle rounded-2xl p-5 border border-border">
              <div className="text-sm font-bold text-foreground mb-3">Agreement Summary</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { person: personA, commitments: bridgeInsights.aCommitments },
                  { person: personB, commitments: bridgeInsights.bCommitments },
                ].map(({ person, commitments }) => (
                  <div key={person?.id}>
                    <div className="text-xs font-semibold text-nav-accent uppercase tracking-wide mb-2">{person?.name.split(' ')[0]} Commits To</div>
                    {commitments.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <CheckCircle2 size={12} className="text-nav-accent mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-foreground/70">{c}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Additional Notes (optional)</label>
            <textarea value={agreementNotes} onChange={e => setAgreementNotes(e.target.value)}
              placeholder="Any additional context, follow-up dates, or specific situations to address..."
              rows={3} className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:border-nav-accent bg-card resize-none" />
          </div>

          {/* Check-in Scheduling */}
          <div className="bg-subtle rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-nav-accent" />
              <span className="text-sm font-bold text-foreground">Follow-Up Schedule</span>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">How often will you check in?</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'biweekly', label: '2 Weeks' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCheckInFreq(opt.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      checkInFreq === opt.value
                        ? 'bg-nav-accent text-white'
                        : 'bg-card border border-border text-foreground hover:border-nav-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">First Check-In Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-nav-accent bg-card"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  <Bell size={12} className="inline mr-1" />
                  Remind {checkInReminder} day{checkInReminder !== 1 ? 's' : ''} before
                </label>
                <input
                  type="range"
                  min={0}
                  max={7}
                  value={checkInReminder}
                  onChange={e => setCheckInReminder(Number(e.target.value))}
                  className="w-full accent-nav-accent"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>Same day</span>
                  <span>1 week</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted">
              Both people will be reminded when check-in is approaching. Review commitments, celebrate wins, adjust what needs to change.
            </p>
          </div>

          <button onClick={handleSaveAgreement} disabled={saving}
            className="w-full py-3 rounded-xl bg-nav text-white text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {saving ? (<><Loader2 size={16} className="animate-spin" /> Saving...</>) : (<><CheckCircle2 size={18} /> Save Connection Agreement</>)}
          </button>
        </div>
      )}
    </motion.div>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8, renderStep9];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-nav">
                <Zap size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">Bridge Wizard</h1>
            </div>
            <p className="text-sm text-muted ml-10">BTCG 9-Step Bridge Building Framework</p>
          </div>
          <button onClick={() => router.push('/app')} className="px-4 py-2 rounded-xl bg-subtle text-foreground text-sm font-semibold border border-border hover:bg-card transition-colors inline-flex items-center gap-1.5">
            <X size={14} /> Exit
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => {
            const isComplete = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center min-w-[72px]">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isComplete ? 'bg-nav-accent text-white shadow-md' :
                    isCurrent ? 'bg-nav text-white shadow-lg scale-110' :
                    'bg-subtle text-muted'
                  }`}>
                    {isComplete ? <CheckCircle2 size={16} /> : s.icon}
                  </div>
                  <div className={`text-[10px] mt-1.5 font-medium transition-colors text-center leading-tight ${isCurrent ? 'text-foreground' : isComplete ? 'text-nav-accent' : 'text-muted/50'}`}>
                    {s.label}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-4 h-0.5 mb-4 rounded-full transition-colors duration-500 flex-shrink-0 ${step > s.id ? 'bg-nav-accent' : 'bg-subtle'}`} />
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
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/app')}
              className="px-4 py-2 rounded-xl bg-subtle text-foreground text-sm font-semibold border border-border hover:bg-card transition-colors inline-flex items-center gap-2">
              <ChevronLeft size={16} /> {step === 1 ? 'Cancel' : 'Back'}
            </button>
            {step < 9 && (
              <button onClick={advance} disabled={!canAdvance()}
                className="px-5 py-2.5 rounded-xl bg-nav text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
                {step === 6 ? (<>Generate Insights <Star size={16} /></>) : (<>Continue <ChevronRight size={16} /></>)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
