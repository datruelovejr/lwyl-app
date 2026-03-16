'use client';

import { useState } from "react";
import { useLWYL } from "../../contexts/LWYLContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Handshake, CheckCircle2, Plus, Trash2, ChevronRight,
  Calendar, Bell, Clock, RefreshCw, ChevronDown, ChevronUp, Edit3, X
} from "lucide-react";

const DISC_COLORS = { D: "#C62828", I: "#F59E0B", S: "#16A34A", C: "#2563EB" };

const getDominantDisc = (disc) => Object.entries(disc).sort(([,a],[,b]) => b - a)[0][0];

const FRICTION_INFO = {
  preference: {
    label: "Preference Friction",
    color: "#29B6F6",
    desc: "HOW they work — DISC behavioral style differences. Confirmed, measurable cost.",
    signal: "Confirmed friction"
  },
  passion: {
    label: "Passion Signal",
    color: "#FF7043",
    desc: "WHY they work — Values and motivation gaps. A signal worth investigating.",
    signal: "Signal to explore"
  },
  process: {
    label: "Process Signal",
    color: "#7E57C2",
    desc: "HOW they think — Attributes and decision-making style. A signal worth exploring.",
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

  const urgencyColor = daysUntil === null ? "#9E9E9E"
    : daysUntil < 0 ? "#C62828"
    : daysUntil <= 3 ? "#FF7043"
    : daysUntil <= 7 ? "#FFC107"
    : "#4CAF50";

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
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="text-xs font-bold uppercase tracking-wide text-[#29B6F6] mb-3">Edit Check-In Schedule</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
            <select value={freq} onChange={e => setFreq(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#29B6F6]">
              <option value="weekly">Every week</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Every month</option>
              <option value="quarterly">Every quarter</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Next Check-In</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#29B6F6]" />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Remind me {reminder} day{reminder !== 1 ? "s" : ""} before</label>
          <input type="range" min={0} max={7} value={reminder} onChange={e => setReminder(Number(e.target.value))}
            className="w-full accent-[#29B6F6]" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Same day</span><span>1 week before</span>
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Check-In Notes / Agenda</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="What will you review in this check-in?"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#29B6F6] resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="lwyl-btn-primary text-sm py-1.5 px-4">Save</button>
          <button onClick={() => setEditing(false)} className="lwyl-btn-secondary text-sm py-1.5 px-4">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#29B6F6]" />
          <span className="text-xs font-bold text-gray-700">Check-In Schedule</span>
        </div>
        <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-[#29B6F6] transition-colors">
          <Edit3 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <RefreshCw size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">Frequency</span>
          </div>
          <div className="text-sm font-bold text-gray-900">{freqLabels[checkIn.frequency]}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">Next Check-In</span>
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
            <Bell size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">Reminder</span>
          </div>
          <div className="text-sm font-bold text-gray-900">
            {checkIn.reminderDaysBefore === 0 ? "Same day" : `${checkIn.reminderDaysBefore}d before`}
          </div>
        </div>
      </div>

      {checkIn.notes && (
        <div className="text-xs text-gray-500 italic mb-3 px-1">&quot;{checkIn.notes}&quot;</div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {checkIn.completedDates.length} check-in{checkIn.completedDates.length !== 1 ? "s" : ""} completed
        </div>
        <button onClick={handleMarkComplete}
          className="text-xs font-semibold text-[#29B6F6] hover:text-[#0288D1] transition-colors flex items-center gap-1">
          <CheckCircle2 size={12} /> Mark Complete
        </button>
      </div>
    </div>
  );
}

export default function AgreementsPage() {
  const { teamPeople } = useLWYL();
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

  const [agreements, setAgreements] = useState([]);

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
      return `${pA.name.split(" ")[0]} is most energized by ${aTop}. ${pB.name.split(" ")[0]} is most energized by ${bTop}. This is a Passion signal — not a verdict, but an invitation to understand what fills each person's tank and what drains it.`;
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
    setAgreements(prev => [newAgreement, ...prev]);
    setStep("complete");
    toast.success("Connection Agreement created!");
  }

  function handleDeleteAgreement(id) {
    setAgreements(prev => prev.filter(a => a.id !== id));
    toast.success("Agreement deleted");
  }

  function handleUpdateCheckIn(id, updated) {
    setAgreements(prev => prev.map(a => a.id === id ? { ...a, checkIn: updated } : a));
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
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3" style={{ letterSpacing: "-0.02em" }}>
          Agreement Created
        </h2>
        <p className="text-gray-500 text-center max-w-md mb-3">
          The Connection Agreement between {personA?.name} and {personB?.name} has been documented.
        </p>
        <p className="text-sm text-gray-400 text-center max-w-md mb-8">
          Your first check-in is scheduled for <strong>{checkInDate}</strong>. Both people will be reminded {checkInReminder} day{checkInReminder !== 1 ? "s" : ""} before.
        </p>
        <div className="flex gap-4">
          <button onClick={resetWizard} className="lwyl-btn-secondary">View All Agreements</button>
          <button onClick={() => { resetWizard(); setStep("select-people"); }} className="lwyl-btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Another
          </button>
        </div>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────
  if (step === "list") {
    return (
      <div className="p-8 animate-fade-in">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
              Connection Agreements
            </h1>
            <p className="text-gray-500 text-sm">Documented commitments that transform friction into trust</p>
          </div>
          <button onClick={() => setStep("select-people")} className="lwyl-btn-primary flex items-center gap-2">
            <Plus size={16} /> New Agreement
          </button>
        </div>

        {agreements.length === 0 ? (
          <div className="lwyl-card text-center py-16">
            <Handshake size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No agreements yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first Connection Agreement to start bridging the gap.</p>
            <button onClick={() => setStep("select-people")} className="lwyl-btn-primary">Create First Agreement</button>
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
                <div key={agreement.id} className="lwyl-card">
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
                        <h3 className="text-base font-bold text-gray-900">
                          {agreement.personAName.split(" ")[0]} & {agreement.personBName.split(" ")[0]}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${info.color}15`, color: info.color }}>
                            {info.label}
                          </span>
                          <span className="text-xs text-gray-400">{agreement.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(isOverdue || isDueSoon) && (
                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                          isOverdue ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                        }`}>
                          <Bell size={11} />
                          {isOverdue ? `${Math.abs(daysUntil)}d overdue` : `Due in ${daysUntil}d`}
                        </div>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : agreement.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteAgreement(agreement.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1"
                        title="Delete agreement"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Friction Insight */}
                  {agreement.frictionInsight && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border-l-4" style={{ borderLeftColor: info.color }}>
                      <p className="text-sm text-gray-700 italic">{agreement.frictionInsight}</p>
                    </div>
                  )}

                  {/* Commitments summary */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        {agreement.personAName.split(" ")[0]} Commits To
                      </div>
                      <ul className="space-y-1.5">
                        {agreement.personACommitments.slice(0, isExpanded ? undefined : 2).map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 size={13} className="text-[#29B6F6] mt-0.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                        {!isExpanded && agreement.personACommitments.length > 2 && (
                          <li className="text-xs text-gray-400">+{agreement.personACommitments.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        {agreement.personBName.split(" ")[0]} Commits To
                      </div>
                      <ul className="space-y-1.5">
                        {agreement.personBCommitments.slice(0, isExpanded ? undefined : 2).map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                        {!isExpanded && agreement.personBCommitments.length > 2 && (
                          <li className="text-xs text-gray-400">+{agreement.personBCommitments.length - 2} more</li>
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
      </div>
    );
  }

  // ── Select People ─────────────────────────────────────────────
  if (step === "select-people") {
    return (
      <div className="p-8 animate-fade-in max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
            Who is this agreement between?
          </h1>
          <p className="text-gray-500 text-sm">Select any two people — leader to staff, staff to staff, any combination.</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-[#29B6F6] mb-3">Person A</div>
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
                      isSelected ? "border-[#29B6F6] shadow-md" :
                      isDisabled ? "opacity-40 cursor-not-allowed border-gray-100" :
                      "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                    }`}
                    style={isSelected ? { background: "rgba(41,182,246,0.05)" } : { background: "white" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: DISC_COLORS[dominant] }}>
                        {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{person.name}</div>
                        <div className="text-xs text-gray-400">{person.role}</div>
                      </div>
                      {isSelected && <CheckCircle2 size={15} className="text-[#29B6F6]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-green-600 mb-3">Person B</div>
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
                      isSelected ? "border-green-500 shadow-md" :
                      isDisabled ? "opacity-40 cursor-not-allowed border-gray-100" :
                      "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                    }`}
                    style={isSelected ? { background: "rgba(34,197,94,0.05)" } : { background: "white" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: DISC_COLORS[dominant] }}>
                        {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{person.name}</div>
                        <div className="text-xs text-gray-400">{person.role}</div>
                      </div>
                      {isSelected && <CheckCircle2 size={15} className="text-green-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={resetWizard} className="lwyl-btn-secondary">Cancel</button>
          <button
            onClick={() => setStep("select-friction")}
            disabled={!personA || !personB || personA.id === personB.id}
            className="lwyl-btn-primary flex items-center gap-2 disabled:opacity-50">
            Continue <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Select Friction ───────────────────────────────────────────
  if (step === "select-friction") {
    return (
      <div className="p-8 animate-fade-in max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
            What type of friction are you addressing?
          </h1>
          <p className="text-gray-500 text-sm">Between {personA?.name} and {personB?.name}</p>
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
              className="lwyl-card text-left hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg mb-4"
                style={{ background: info.color }}>
                {type === "preference" ? "P" : type === "passion" ? "V" : "Pr"}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{info.label}</h3>
              <p className="text-xs text-gray-400 mb-2">{info.signal}</p>
              <p className="text-sm text-gray-500">{info.desc}</p>
            </button>
          ))}
        </div>
        <button onClick={() => setStep("select-people")} className="lwyl-btn-secondary">Back</button>
      </div>
    );
  }

  // ── Build ─────────────────────────────────────────────────────
  if (step === "build" && personA && personB && selectedFriction) {
    const info = FRICTION_INFO[selectedFriction];
    const prompts = GUIDED_PROMPTS[selectedFriction];

    return (
      <div className="p-8 animate-fade-in max-w-4xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
              Build the Agreement
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">{personA.name} & {personB.name} ·</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${info.color}15`, color: info.color }}>
                {info.label}
              </span>
            </div>
          </div>
        </div>

        {/* Framework principle */}
        <div className="p-4 rounded-xl mb-6 border-l-4" style={{ background: `${info.color}08`, borderLeftColor: info.color }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: info.color }}>
            BTCG Framework — Connection Agreement Principle
          </div>
          <p className="text-sm text-gray-700">
            A Connection Agreement is not a performance improvement plan. It is a <strong>negotiated commitment</strong> between two people who choose to invest in their working relationship. Both parties own their side. Both parties sign their name to it.
          </p>
        </div>

        {frictionInsight && (
          <div className="rounded-xl p-4 mb-6 bg-gray-50 border border-gray-100">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Friction Insight</div>
            <p className="text-sm text-gray-700">{frictionInsight}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Person A Commitments */}
          <div className="lwyl-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: personA.disc?.natural ? DISC_COLORS[getDominantDisc(personA.disc.natural)] : "#29B6F6" }}>
                {personA.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <h3 className="text-sm font-bold text-gray-900">{personA.name.split(" ")[0]} Commits To</h3>
            </div>

            <div className="text-xs text-gray-400 mb-3">Guided prompts — edit to make them specific:</div>
            <div className="space-y-3">
              {personACommitments.map((commitment, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#29B6F6] mt-2.5 flex-shrink-0" />
                  <textarea
                    value={commitment}
                    onChange={e => {
                      const updated = [...personACommitments];
                      updated[i] = e.target.value;
                      setPersonACommitments(updated);
                    }}
                    placeholder={prompts.leaderPrompts[i % prompts.leaderPrompts.length]}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#29B6F6] resize-none"
                    rows={2}
                  />
                  <button onClick={() => setPersonACommitments(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 hover:text-red-400 mt-2 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setPersonACommitments(prev => [...prev, ""])}
                className="text-sm text-[#29B6F6] font-semibold flex items-center gap-1 hover:text-[#0288D1] transition-colors">
                <Plus size={14} /> Add commitment
              </button>
            </div>
          </div>

          {/* Person B Commitments */}
          <div className="lwyl-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: personB.disc?.natural ? DISC_COLORS[getDominantDisc(personB.disc.natural)] : "#4CAF50" }}>
                {personB.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <h3 className="text-sm font-bold text-gray-900">{personB.name.split(" ")[0]} Commits To</h3>
            </div>

            <div className="text-xs text-gray-400 mb-3">Guided prompts — edit to make them specific:</div>
            <div className="space-y-3">
              {personBCommitments.map((commitment, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-500 mt-2.5 flex-shrink-0" />
                  <textarea
                    value={commitment}
                    onChange={e => {
                      const updated = [...personBCommitments];
                      updated[i] = e.target.value;
                      setPersonBCommitments(updated);
                    }}
                    placeholder={prompts.memberPrompts[i % prompts.memberPrompts.length]}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#29B6F6] resize-none"
                    rows={2}
                  />
                  <button onClick={() => setPersonBCommitments(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 hover:text-red-400 mt-2 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setPersonBCommitments(prev => [...prev, ""])}
                className="text-sm text-[#29B6F6] font-semibold flex items-center gap-1 hover:text-[#0288D1] transition-colors">
                <Plus size={14} /> Add commitment
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setStep("select-friction")} className="lwyl-btn-secondary">Back</button>
          <button onClick={() => setStep("schedule")}
            disabled={personACommitments.filter(c => c.trim()).length === 0}
            className="lwyl-btn-primary flex items-center gap-2 disabled:opacity-50">
            Set Check-In Schedule <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Schedule Check-In ─────────────────────────────────────────
  if (step === "schedule") {
    const freqLabels = {
      weekly: "Every week", biweekly: "Every 2 weeks", monthly: "Every month", quarterly: "Every quarter"
    };

    return (
      <div className="p-8 animate-fade-in max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
            Schedule Your Check-Ins
          </h1>
          <p className="text-gray-500 text-sm">
            Every Connection Agreement needs a check-in cadence. This is how you know if the bridge is holding.
          </p>
        </div>

        <div className="lwyl-card mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={18} className="text-[#29B6F6]" />
            <h3 className="font-bold text-gray-900">Check-In Cadence</h3>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">How often will you check in?</label>
            <div className="grid grid-cols-2 gap-3">
              {["weekly", "biweekly", "monthly", "quarterly"].map(f => (
                <button key={f}
                  onClick={() => setCheckInFreq(f)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    checkInFreq === f ? "border-[#29B6F6] text-[#29B6F6]" : "border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}
                  style={checkInFreq === f ? { background: "rgba(41,182,246,0.05)" } : { background: "white" }}>
                  {freqLabels[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">First Check-In Date</label>
            <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white" />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remind both people <strong>{checkInReminder}</strong> day{checkInReminder !== 1 ? "s" : ""} before
            </label>
            <input type="range" min={0} max={7} value={checkInReminder} onChange={e => setCheckInReminder(Number(e.target.value))}
              className="w-full accent-[#29B6F6]" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Same day</span><span>1 week before</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-In Agenda (optional)</label>
            <textarea value={checkInNotes} onChange={e => setCheckInNotes(e.target.value)} rows={3}
              placeholder="What will you review? (e.g., Review commitments, identify new friction, celebrate wins)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#29B6F6] bg-white resize-none" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-[#29B6F6]" />
            <span className="text-sm font-semibold text-[#0288D1]">What happens at check-in?</span>
          </div>
          <p className="text-sm text-gray-600">
            Review each commitment. Celebrate what&apos;s working. Identify what needs to be amended. The agreement is a living document — it should evolve as the relationship does.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setStep("build")} className="lwyl-btn-secondary">Back</button>
          <button onClick={handleSaveAgreement} className="lwyl-btn-primary flex items-center gap-2">
            <Handshake size={16} /> Save Agreement
          </button>
        </div>
      </div>
    );
  }

  return null;
}
