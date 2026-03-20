'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { useLWYL } from "../../contexts/LWYLContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Handshake, CheckCircle2, Plus, Trash2, ChevronRight,
  Calendar, Bell, Clock, RefreshCw, ChevronDown, ChevronUp, Edit3, X
} from "lucide-react";

const DISC_COLORS = { D: "var(--disc-d)", I: "var(--disc-i)", S: "var(--disc-s)", C: "var(--disc-c)" };

const getDominantDisc = (disc) => Object.entries(disc).sort(([,a],[,b]) => b - a)[0][0];

const FRICTION_INFO = {
  preference: {
    label: "Preference Friction",
    color: "var(--disc-c)",
    desc: "HOW they work -- DISC behavioral style differences. Confirmed, measurable cost.",
    signal: "Confirmed friction"
  },
  passion: {
    label: "Passion Signal",
    color: "var(--values-individualistic)",
    desc: "WHY they work -- Values and motivation gaps. A signal worth investigating.",
    signal: "Signal to explore"
  },
  process: {
    label: "Process Signal",
    color: "var(--attr-ext)",
    desc: "HOW they think -- Attributes and decision-making style. A signal worth exploring.",
    signal: "Signal to explore"
  },
};

const GUIDED_PROMPTS = {
  preference: {
    leaderPrompts: [
      "I will adjust my communication pace to match their processing style by...",
      "Before making decisions that affect them, I will...",
      "When I notice tension between our styles, I will...",
      "I will create space for their natural working style by...",
    ],
    memberPrompts: [
      "I will communicate my needs proactively instead of waiting by...",
      "When I feel overwhelmed by their pace, I will...",
      "I will signal when I need more time or context by...",
      "I will stretch toward their style by...",
    ],
  },
  passion: {
    leaderPrompts: [
      "I will connect this work to what drives them by framing it as...",
      "I will honor their top motivators by...",
      "When our values seem to conflict, I will investigate by asking...",
      "I will create opportunities for them to work in their zone of passion by...",
    ],
    memberPrompts: [
      "I will share what energizes me about this work so that...",
      "When I feel disconnected from the purpose of a task, I will...",
      "I will help them understand what fills my tank by...",
      "I will stay curious about their motivations by...",
    ],
  },
  process: {
    leaderPrompts: [
      "I will use the 3H Protocol (Heart, Hand, Head) by explicitly inviting...",
      "Before finalizing decisions, I will ask for their processing lens by...",
      "I will slow down enough to honor their thinking style by...",
      "I will champion their perspective in team discussions by...",
    ],
    memberPrompts: [
      "I will name my processing lens at the start of discussions by saying...",
      "When I feel my perspective isn't being heard, I will...",
      "I will stay curious about their different thinking approach by...",
      "I will bring my full perspective to decisions by...",
    ],
  },
};

function CheckInCard({ checkIn, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [freq, setFreq] = useState(checkIn.frequency);
  const [nextDate, setNextDate] = useState(checkIn.nextDate);
  const [reminder, setReminder] = useState(checkIn.reminderDaysBefore);
  const [notes, setNotes] = useState(checkIn.notes);

  const freqLabels = {
    weekly: "Every week",
    biweekly: "Every 2 weeks",
    monthly: "Every month",
    quarterly: "Every quarter",
  };

  const daysUntil = nextDate
    ? Math.ceil((new Date(nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const urgencyColor = daysUntil === null ? "var(--disc-gray)"
    : daysUntil < 0 ? "var(--friction-high)"
    : daysUntil <= 3 ? "var(--alert-warning-accent)"
    : daysUntil <= 7 ? "var(--disc-i)"
    : "var(--disc-s)";

  function handleSave() {
    onUpdate({ ...checkIn, frequency: freq, nextDate, reminderDaysBefore: reminder, notes });
    setEditing(false);
    toast.success("Check-in schedule updated");
  }

  function handleMarkComplete() {
    const today = new Date().toISOString().split("T")[0];
    const next = new Date(nextDate || today);
    if (freq === "weekly") next.setDate(next.getDate() + 7);
    else if (freq === "biweekly") next.setDate(next.getDate() + 14);
    else if (freq === "monthly") next.setMonth(next.getMonth() + 1);
    else next.setMonth(next.getMonth() + 3);

    onUpdate({
      ...checkIn,
      frequency: freq,
      nextDate: next.toISOString().split("T")[0],
      completedDates: [...checkIn.completedDates, today],
    });
    toast.success("Check-in marked complete. Next date scheduled.");
  }

  if (editing) {
    return (
      <div className="bg-alert-info-bg rounded-xl p-4 border border-alert-info-border">
        <div className="text-xs font-bold uppercase tracking-wide text-disc-c mb-3">Edit Check-In Schedule</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Frequency</label>
            <select value={freq} onChange={e => setFreq(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-card focus:outline-none focus:border-disc-c">
              <option value="weekly">Every week</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Every month</option>
              <option value="quarterly">Every quarter</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Next Check-In</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-card focus:outline-none focus:border-disc-c" />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-muted mb-1 block">Remind me {reminder} day{reminder !== 1 ? "s" : ""} before</label>
          <input type="range" min={0} max={7} value={reminder} onChange={e => setReminder(Number(e.target.value))}
            className="w-full accent-disc-c" />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>Same day</span><span>1 week before</span>
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-muted mb-1 block">Check-In Notes / Agenda</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="What will you review in this check-in?"
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-card focus:outline-none focus:border-disc-c resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="text-sm py-1.5 px-4 rounded-lg bg-nav text-white font-semibold">Save</button>
          <button onClick={() => setEditing(false)} className="text-sm py-1.5 px-4 rounded-lg border border-border text-foreground font-semibold">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-subtle rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-disc-c" />
          <span className="text-xs font-bold text-foreground">Check-In Schedule</span>
        </div>
        <button onClick={() => setEditing(true)} className="text-muted hover:text-disc-c transition-colors">
          <Edit3 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <RefreshCw size={11} className="text-muted" />
            <span className="text-xs text-muted">Frequency</span>
          </div>
          <div className="text-sm font-bold text-foreground">{freqLabels[checkIn.frequency]}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={11} className="text-muted" />
            <span className="text-xs text-muted">Next Check-In</span>
          </div>
          <div className="text-sm font-bold" style={{ color: urgencyColor }}>
            {checkIn.nextDate
              ? daysUntil === 0 ? "Today"
                : daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue`
                : `In ${daysUntil}d`
              : "Not set"}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Bell size={11} className="text-muted" />
            <span className="text-xs text-muted">Reminder</span>
          </div>
          <div className="text-sm font-bold text-foreground">
            {checkIn.reminderDaysBefore === 0 ? "Same day" : `${checkIn.reminderDaysBefore}d before`}
          </div>
        </div>
      </div>

      {checkIn.notes && (
        <div className="text-xs text-muted italic mb-3 px-1">&quot;{checkIn.notes}&quot;</div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">
          {checkIn.completedDates.length} check-in{checkIn.completedDates.length !== 1 ? "s" : ""} completed
        </div>
        <button onClick={handleMarkComplete}
          className="text-xs font-semibold text-disc-c hover:opacity-80 transition-opacity flex items-center gap-1">
          <CheckCircle2 size={12} /> Mark Complete
        </button>
      </div>
    </div>
  );
}

export default function AgreementsPage() {
  const { teamPeople, agreements, saveAgreement, updateAgreement, deleteAgreement } = useLWYL();
  const allPeople = teamPeople.filter(p => p.status !== "pending" && p.disc);

  const [step, setStep] = useState("list");
  const [personA, setPersonA] = useState(null);
  const [personB, setPersonB] = useState(null);
  const [selectedFriction, setSelectedFriction] = useState(null);
  const [personACommitments, setPersonACommitments] = useState([""]);
  const [personBCommitments, setPersonBCommitments] = useState([""]);
  const [frictionInsight, setFrictionInsight] = useState("");
  const [checkInFreq, setCheckInFreq] = useState("biweekly");
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [checkInReminder, setCheckInReminder] = useState(1);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Framework-based insight generator (no AI needed)
  function generateFrameworkInsight(pA, pB, friction) {
    const aDisc = pA.disc?.natural ? getDominantDisc(pA.disc.natural) : "S";
    const bDisc = pB.disc?.natural ? getDominantDisc(pB.disc.natural) : "S";
    const discLabels = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Conscientiousness" };

    if (friction === "preference") {
      return `${pA.name.split(" ")[0]}'s ${discLabels[aDisc]} style and ${pB.name.split(" ")[0]}'s ${discLabels[bDisc]} style create natural friction in communication pace, decision-making, and how each person defines "getting it right." This agreement creates a bridge between those two realities.`;
    }
    if (friction === "passion") {
      const aTop = pA.values ? Object.entries(pA.values).sort(([,a],[,b]) => b - a)[0]?.[0] : "their values";
      const bTop = pB.values ? Object.entries(pB.values).sort(([,a],[,b]) => b - a)[0]?.[0] : "their values";
      return `${pA.name.split(" ")[0]} is most energized by ${aTop}. ${pB.name.split(" ")[0]} is most energized by ${bTop}. This is a Passion signal -- not a verdict, but an invitation to understand what fills each person's tank and what drains it.`;
    }
    return `${pA.name.split(" ")[0]} and ${pB.name.split(" ")[0]} approach decisions from different cognitive lenses. This agreement uses the 3H Protocol to ensure Heart, Hand, and Head perspectives are all represented before decisions are made.`;
  }

  function handleSaveAgreement() {
    if (!personA || !personB || !selectedFriction) return;
    const newAgreement = {
      id: Date.now().toString(),
      personAName: personA.name,
      personBName: personB.name,
      personAId: personA.id,
      personBId: personB.id,
      frictionType: selectedFriction,
      personACommitments: personACommitments.filter(c => c.trim()),
      personBCommitments: personBCommitments.filter(c => c.trim()),
      frictionInsight,
      createdAt: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      checkIn: {
        frequency: checkInFreq,
        nextDate: checkInDate,
        reminderDaysBefore: checkInReminder,
        notes: checkInNotes,
        completedDates: [],
      },
    };
    saveAgreement(newAgreement);
    setStep("complete");
    toast.success("Connection Agreement created!");
  }

  function handleDeleteAgreement(id) {
    deleteAgreement(id);
    toast.success("Agreement deleted");
  }

  function handleUpdateCheckIn(id, updated) {
    updateAgreement(id, { checkIn: updated });
  }

  function resetWizard() {
    setStep("list");
    setPersonA(null);
    setPersonB(null);
    setSelectedFriction(null);
    setPersonACommitments([""]);
    setPersonBCommitments([""]);
    setFrictionInsight("");
    setCheckInFreq("biweekly");
    setCheckInNotes("");
  }

  // ── Complete ──────────────────────────────────────────────────
  if (step === "complete") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-8 flex flex-col items-center justify-center min-h-[60vh]"
      >
        <div className="w-20 h-20 rounded-full bg-alert-success-bg flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-alert-success-accent" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-3 tracking-tight">
          Agreement Created
        </h2>
        <p className="text-muted text-center max-w-md mb-3">
          The Connection Agreement between {personA?.name} and {personB?.name} has been documented.
        </p>
        <p className="text-sm text-muted text-center max-w-md mb-8">
          Your first check-in is scheduled for <strong>{checkInDate}</strong>. Both people will be reminded {checkInReminder} day{checkInReminder !== 1 ? "s" : ""} before.
        </p>
        <div className="flex gap-4">
          <button onClick={resetWizard} className="px-4 py-2 rounded-lg border border-border text-foreground font-semibold text-sm">View All Agreements</button>
          <button onClick={() => { resetWizard(); setStep("select-people"); }} className="px-4 py-2 rounded-lg bg-nav text-white font-semibold text-sm flex items-center gap-2">
            <Plus size={16} /> Create Another
          </button>
        </div>
      </motion.div>
    );
  }

  // ── List ──────────────────────────────────────────────────────
  if (step === "list") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-8"
      >
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">
              Connection Agreements
            </h1>
            <p className="text-muted text-sm">Documented commitments that transform friction into trust</p>
          </div>
          <button onClick={() => setStep("select-people")} className="px-4 py-2 rounded-lg bg-nav text-white font-semibold text-sm flex items-center gap-2">
            <Plus size={16} /> New Agreement
          </button>
        </div>

        {agreements.length === 0 ? (
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm text-center py-16">
            <Handshake size={48} className="text-border mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No agreements yet</h3>
            <p className="text-muted text-sm mb-6">Create your first Connection Agreement to start bridging the gap.</p>
            <button onClick={() => setStep("select-people")} className="px-4 py-2 rounded-lg bg-nav text-white font-semibold text-sm">Create First Agreement</button>
          </div>
        ) : (
          <div className="space-y-4">
            {agreements.map(agreement => {
              const info = FRICTION_INFO[agreement.frictionType];
              const pA = teamPeople.find(p => p.id === agreement.personAId);
              const pB = teamPeople.find(p => p.id === agreement.personBId);
              const dominantA = pA?.disc?.natural ? getDominantDisc(pA.disc.natural) : "C";
              const dominantB = pB?.disc?.natural ? getDominantDisc(pB.disc.natural) : "S";
              const isExpanded = expandedId === agreement.id;

              // Check-in urgency
              const daysUntil = agreement.checkIn.nextDate
                ? Math.ceil((new Date(agreement.checkIn.nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              const isOverdue = daysUntil !== null && daysUntil < 0;
              const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3;

              return (
                <div key={agreement.id} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ring-2 ring-white"
                          style={{ background: DISC_COLORS[dominantA] }}>
                          {agreement.personAName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ring-2 ring-white"
                          style={{ background: DISC_COLORS[dominantB] }}>
                          {agreement.personBName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          {agreement.personAName.split(" ")[0]} & {agreement.personBName.split(" ")[0]}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `color-mix(in srgb, ${info.color} 8%, transparent)`, color: info.color }}>
                            {info.label}
                          </span>
                          <span className="text-xs text-muted">{agreement.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(isOverdue || isDueSoon) && (
                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                          isOverdue ? "bg-alert-critical-bg text-alert-critical-accent" : "bg-alert-warning-bg text-alert-warning-accent"
                        }`}>
                          <Bell size={11} />
                          {isOverdue ? `${Math.abs(daysUntil)}d overdue` : `Due in ${daysUntil}d`}
                        </div>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : agreement.id)}
                        className="text-muted hover:text-foreground transition-colors p-1"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteAgreement(agreement.id)}
                        className="text-border hover:text-alert-critical-accent transition-colors p-1"
                        title="Delete agreement"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Friction Insight */}
                  {agreement.frictionInsight && (
                    <div className="bg-subtle rounded-xl p-4 mb-4 border-l-4" style={{ borderLeftColor: info.color }}>
                      <p className="text-sm text-foreground italic">{agreement.frictionInsight}</p>
                    </div>
                  )}

                  {/* Commitments summary */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs font-bold text-muted uppercase tracking-wide mb-2">
                        {agreement.personAName.split(" ")[0]} Commits To
                      </div>
                      <ul className="space-y-1.5">
                        {agreement.personACommitments.slice(0, isExpanded ? undefined : 2).map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle2 size={13} className="text-disc-c mt-0.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                        {!isExpanded && agreement.personACommitments.length > 2 && (
                          <li className="text-xs text-muted">+{agreement.personACommitments.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted uppercase tracking-wide mb-2">
                        {agreement.personBName.split(" ")[0]} Commits To
                      </div>
                      <ul className="space-y-1.5">
                        {agreement.personBCommitments.slice(0, isExpanded ? undefined : 2).map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle2 size={13} className="text-alert-success-accent mt-0.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                        {!isExpanded && agreement.personBCommitments.length > 2 && (
                          <li className="text-xs text-muted">+{agreement.personBCommitments.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Check-in card (always visible) */}
                  <CheckInCard
                    checkIn={agreement.checkIn}
                    onUpdate={(updated) => handleUpdateCheckIn(agreement.id, updated)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  // ── Select People ─────────────────────────────────────────────
  if (step === "select-people") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-8 max-w-3xl"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">
            Who is this agreement between?
          </h1>
          <p className="text-muted text-sm">Select any two people -- leader to staff, staff to staff, any combination.</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-disc-c mb-3">Person A</div>
            <div className="space-y-2">
              {allPeople.map(person => {
                const dominant = person.disc?.natural ? getDominantDisc(person.disc.natural) : "S";
                const isSelected = personA?.id === person.id;
                const isDisabled = personB?.id === person.id;
                return (
                  <button key={person.id}
                    onClick={() => !isDisabled && setPersonA(person)}
                    disabled={isDisabled}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      isSelected ? "border-disc-c shadow-md" :
                      isDisabled ? "opacity-40 cursor-not-allowed border-border" :
                      "border-border hover:shadow-sm"
                    }`}
                    style={{ background: isSelected ? "color-mix(in srgb, var(--disc-c) 5%, transparent)" : "var(--bg-card)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: DISC_COLORS[dominant] }}>
                        {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">{person.name}</div>
                        <div className="text-xs text-muted">{person.role}</div>
                      </div>
                      {isSelected && <CheckCircle2 size={15} className="text-disc-c" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-alert-success-accent mb-3">Person B</div>
            <div className="space-y-2">
              {allPeople.map(person => {
                const dominant = person.disc?.natural ? getDominantDisc(person.disc.natural) : "S";
                const isSelected = personB?.id === person.id;
                const isDisabled = personA?.id === person.id;
                return (
                  <button key={person.id}
                    onClick={() => !isDisabled && setPersonB(person)}
                    disabled={isDisabled}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      isSelected ? "border-alert-success-accent shadow-md" :
                      isDisabled ? "opacity-40 cursor-not-allowed border-border" :
                      "border-border hover:shadow-sm"
                    }`}
                    style={{ background: isSelected ? "color-mix(in srgb, var(--alert-success-accent) 5%, transparent)" : "var(--bg-card)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: DISC_COLORS[dominant] }}>
                        {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">{person.name}</div>
                        <div className="text-xs text-muted">{person.role}</div>
                      </div>
                      {isSelected && <CheckCircle2 size={15} className="text-alert-success-accent" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={resetWizard} className="px-4 py-2 rounded-lg border border-border text-foreground font-semibold text-sm">Cancel</button>
          <button
            onClick={() => setStep("select-friction")}
            disabled={!personA || !personB || personA.id === personB.id}
            className="px-4 py-2 rounded-lg bg-nav text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
            Continue <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Select Friction ───────────────────────────────────────────
  if (step === "select-friction") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-8 max-w-3xl"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">
            What type of friction are you addressing?
          </h1>
          <p className="text-muted text-sm">Between {personA?.name} and {personB?.name}</p>
        </div>
        <div className="grid grid-cols-3 gap-5 mb-8">
          {Object.entries(FRICTION_INFO).map(([type, info]) => (
            <button key={type}
              onClick={() => {
                setSelectedFriction(type);
                if (personA && personB) {
                  setFrictionInsight(generateFrameworkInsight(personA, personB, type));
                  setPersonACommitments([GUIDED_PROMPTS[type].leaderPrompts[0], GUIDED_PROMPTS[type].leaderPrompts[1]]);
                  setPersonBCommitments([GUIDED_PROMPTS[type].memberPrompts[0], GUIDED_PROMPTS[type].memberPrompts[1]]);
                }
                setStep("build");
              }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm text-left hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg mb-4"
                style={{ background: info.color }}>
                {type === "preference" ? "P" : type === "passion" ? "V" : "Pr"}
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">{info.label}</h3>
              <p className="text-xs text-muted mb-2">{info.signal}</p>
              <p className="text-sm text-muted">{info.desc}</p>
            </button>
          ))}
        </div>
        <button onClick={() => setStep("select-people")} className="px-4 py-2 rounded-lg border border-border text-foreground font-semibold text-sm">Back</button>
      </motion.div>
    );
  }

  // ── Build ─────────────────────────────────────────────────────
  if (step === "build" && personA && personB && selectedFriction) {
    const info = FRICTION_INFO[selectedFriction];
    const prompts = GUIDED_PROMPTS[selectedFriction];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-8 max-w-4xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">
              Build the Agreement
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-muted text-sm">{personA.name} & {personB.name} {"\u00b7"}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `color-mix(in srgb, ${info.color} 8%, transparent)`, color: info.color }}>
                {info.label}
              </span>
            </div>
          </div>
        </div>

        {/* Framework principle */}
        <div className="p-4 rounded-xl mb-6 border-l-4"
          style={{ background: `color-mix(in srgb, ${info.color} 5%, transparent)`, borderLeftColor: info.color }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: info.color }}>
            BTCG Framework -- Connection Agreement Principle
          </div>
          <p className="text-sm text-foreground">
            A Connection Agreement is not a performance improvement plan. It is a <strong>negotiated commitment</strong> between two people who choose to invest in their working relationship. Both parties own their side. Both parties sign their name to it.
          </p>
        </div>

        {frictionInsight && (
          <div className="rounded-xl p-4 mb-6 bg-subtle border border-border">
            <div className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Friction Insight</div>
            <p className="text-sm text-foreground">{frictionInsight}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Person A Commitments */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: personA.disc?.natural ? DISC_COLORS[getDominantDisc(personA.disc.natural)] : "var(--disc-c)" }}>
                {personA.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <h3 className="text-sm font-bold text-foreground">{personA.name.split(" ")[0]} Commits To</h3>
            </div>

            <div className="text-xs text-muted mb-3">Guided prompts -- edit to make them specific:</div>
            <div className="space-y-3">
              {personACommitments.map((commitment, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-disc-c mt-2.5 flex-shrink-0" />
                  <textarea
                    value={commitment}
                    onChange={e => {
                      const updated = [...personACommitments];
                      updated[i] = e.target.value;
                      setPersonACommitments(updated);
                    }}
                    placeholder={prompts.leaderPrompts[i % prompts.leaderPrompts.length]}
                    className="flex-1 text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-disc-c resize-none"
                    rows={2}
                  />
                  <button onClick={() => setPersonACommitments(prev => prev.filter((_, j) => j !== i))}
                    className="text-border hover:text-alert-critical-accent mt-2 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setPersonACommitments(prev => [...prev, ""])}
                className="text-sm text-disc-c font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
                <Plus size={14} /> Add commitment
              </button>
            </div>
          </div>

          {/* Person B Commitments */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: personB.disc?.natural ? DISC_COLORS[getDominantDisc(personB.disc.natural)] : "var(--disc-s)" }}>
                {personB.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <h3 className="text-sm font-bold text-foreground">{personB.name.split(" ")[0]} Commits To</h3>
            </div>

            <div className="text-xs text-muted mb-3">Guided prompts -- edit to make them specific:</div>
            <div className="space-y-3">
              {personBCommitments.map((commitment, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-alert-success-accent mt-2.5 flex-shrink-0" />
                  <textarea
                    value={commitment}
                    onChange={e => {
                      const updated = [...personBCommitments];
                      updated[i] = e.target.value;
                      setPersonBCommitments(updated);
                    }}
                    placeholder={prompts.memberPrompts[i % prompts.memberPrompts.length]}
                    className="flex-1 text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-disc-c resize-none"
                    rows={2}
                  />
                  <button onClick={() => setPersonBCommitments(prev => prev.filter((_, j) => j !== i))}
                    className="text-border hover:text-alert-critical-accent mt-2 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setPersonBCommitments(prev => [...prev, ""])}
                className="text-sm text-disc-c font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
                <Plus size={14} /> Add commitment
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setStep("select-friction")} className="px-4 py-2 rounded-lg border border-border text-foreground font-semibold text-sm">Back</button>
          <button onClick={() => setStep("schedule")}
            disabled={personACommitments.filter(c => c.trim()).length === 0}
            className="px-4 py-2 rounded-lg bg-nav text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
            Set Check-In Schedule <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Schedule Check-In ─────────────────────────────────────────
  if (step === "schedule") {
    const freqLabels = {
      weekly: "Every week", biweekly: "Every 2 weeks", monthly: "Every month", quarterly: "Every quarter"
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-8 max-w-2xl"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">
            Schedule Your Check-Ins
          </h1>
          <p className="text-muted text-sm">
            Every Connection Agreement needs a check-in cadence. This is how you know if the bridge is holding.
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={18} className="text-disc-c" />
            <h3 className="font-bold text-foreground">Check-In Cadence</h3>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-foreground mb-3">How often will you check in?</label>
            <div className="grid grid-cols-2 gap-3">
              {["weekly", "biweekly", "monthly", "quarterly"].map(f => (
                <button key={f}
                  onClick={() => setCheckInFreq(f)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    checkInFreq === f ? "border-disc-c text-disc-c" : "border-border text-foreground hover:shadow-sm"
                  }`}
                  style={{ background: checkInFreq === f ? "color-mix(in srgb, var(--disc-c) 5%, transparent)" : "var(--bg-card)" }}>
                  {freqLabels[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-foreground mb-2">First Check-In Date</label>
            <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:border-disc-c bg-card" />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Remind both people <strong>{checkInReminder}</strong> day{checkInReminder !== 1 ? "s" : ""} before
            </label>
            <input type="range" min={0} max={7} value={checkInReminder} onChange={e => setCheckInReminder(Number(e.target.value))}
              className="w-full accent-disc-c" />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>Same day</span><span>1 week before</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Check-In Agenda (optional)</label>
            <textarea value={checkInNotes} onChange={e => setCheckInNotes(e.target.value)} rows={3}
              placeholder="What will you review? (e.g., Review commitments, identify new friction, celebrate wins)"
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:border-disc-c bg-card resize-none" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-alert-info-bg border border-alert-info-border mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-disc-c" />
            <span className="text-sm font-semibold text-alert-info-accent">What happens at check-in?</span>
          </div>
          <p className="text-sm text-foreground">
            Review each commitment. Celebrate what&apos;s working. Identify what needs to be amended. The agreement is a living document -- it should evolve as the relationship does.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setStep("build")} className="px-4 py-2 rounded-lg border border-border text-foreground font-semibold text-sm">Back</button>
          <button onClick={handleSaveAgreement} className="px-4 py-2 rounded-lg bg-nav text-white font-semibold text-sm flex items-center gap-2">
            <Handshake size={16} /> Save Agreement
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}
