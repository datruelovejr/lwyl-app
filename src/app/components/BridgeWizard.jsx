'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { discFull } from '../constants/data';
import { Btn } from './Btn';
import { getBridgeFrictionNarrative } from '../knowledge/narrativeEngine';
import { GapBar } from './ui/GapBar';
import { InsightCard } from './ui/InsightCard';
import { AlertCard } from './ui/AlertCard';

export function BridgeWizard({ leader, person, agreements, setAgreements, onClose }) {
  const existing = agreements.find(a => a.leaderId === leader.id && a.personId === person.id);
  const [step, setStep] = useState(existing ? 4 : 1);
  const [discussion, setDiscussion] = useState(existing?.discussion || '');
  const [needFromThem, setNeedFromThem] = useState(existing?.needFromThem || '');
  const [myCommitment, setMyCommitment] = useState(existing?.myCommitment || '');
  const [repairProtocol, setRepairProtocol] = useState(existing?.repairProtocol || '');
  const [checkIn, setCheckIn] = useState(existing?.checkInCadence || 'Weekly');
  const firstName = person.name.split(' ')[0];

  const dims = ['D', 'I', 'S', 'C'];
  const frictionPoints = dims.map(d => {
    const lScore = leader.disc.natural[d];
    const pScore = person.disc.natural[d];
    const narr = getBridgeFrictionNarrative(d, lScore, pScore, leader.name, person.name);
    if (!narr) return null;
    return { d, tier: narr.tier, text: narr.narrative, action: narr.action };
  }).filter(Boolean);

  const saveAgreement = () => {
    const newA = {
      id: 'a' + Date.now(), leaderId: leader.id, personId: person.id,
      frictionPoints, discussion, needFromThem, myCommitment, repairProtocol,
      checkInCadence: checkIn, createdAt: new Date().toISOString()
    };
    setAgreements(prev => [...prev.filter(a => !(a.leaderId === leader.id && a.personId === person.id)), newA]);
    setStep(4);
  };

  const stepLabels = ['Discover', 'Discuss', 'Design', 'Agreement'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 flex items-center justify-center z-200"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="modal-body bg-card rounded-xl w-[min(640px,95vw)] max-h-[85vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Connection Agreement</h3>
            <p className="text-xs text-muted">{leader.name} & {person.name}</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-muted hover:text-foreground transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-5 py-2.5 border-b border-border flex">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={label} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                    done ? 'bg-friction-low text-white' : active ? 'bg-nav text-white' : 'bg-border text-muted'
                  }`}>
                    {done ? '\u2713' : n}
                  </div>
                  <div className={`text-[9px] font-semibold mt-0.5 ${active ? 'text-foreground' : 'text-muted'}`}>{label}</div>
                </div>
                {i < 3 && <div className={`w-5 h-0.5 mb-3.5 ${done ? 'bg-friction-low' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <h3 className="text-base font-extrabold text-foreground mb-2">Step 1: Discover</h3>
              <p className="text-xs text-muted mb-3.5">These friction points were automatically identified from your assessment data. They represent the most likely sources of tension between you and {firstName}.</p>
              {frictionPoints.length === 0 ? (
                <AlertCard severity="success" title="Naturally aligned">No significant DISC gaps detected. Your styles work well together.</AlertCard>
              ) : frictionPoints.map(({ d, tier, text, action }) => (
                <InsightCard key={d} variant={tier === 'Major' ? 'priority' : 'standard'} enterDelay={0}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full bg-disc-${d.toLowerCase()}`} />
                    <span className={`text-xs font-bold text-disc-${d.toLowerCase()}`}>{discFull[d]}</span>
                    <span className={`text-[10px] font-semibold ml-auto ${tier === 'Major' ? 'text-friction-high' : 'text-friction-moderate'}`}>{tier} Gap</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mb-1">{text}</p>
                  {action && (
                    <InsightCard.Callout>
                      <strong>What to try:</strong> {action}
                    </InsightCard.Callout>
                  )}
                </InsightCard>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <h3 className="text-base font-extrabold text-foreground mb-2">Step 2: Discuss</h3>
              <p className="text-xs text-muted mb-2">Think of a specific moment when one of these friction points showed up in a real interaction with {firstName}. Describe what happened.</p>
              <AlertCard severity="info">
                <strong>Why this matters:</strong> Friction between people is invisible until you name it. A specific situation makes it real. Without a concrete example, the agreement stays theoretical. With one, it becomes actionable.
              </AlertCard>
              <textarea value={discussion} onChange={e => setDiscussion(e.target.value)} placeholder={`Describe a real situation where you noticed friction with ${firstName}...`}
                className="w-full min-h-[140px] px-3 py-2.5 rounded-lg border border-border text-xs leading-relaxed resize-y font-[inherit] mt-3 focus:outline-none focus:border-nav-accent" />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <h3 className="text-base font-extrabold text-foreground mb-2">Step 3: Design</h3>
              <p className="text-xs text-muted mb-2">Build your commitment to {firstName}.</p>
              <AlertCard severity="info">
                <strong>Why this matters:</strong> An agreement without specifics is a wish. What you write here becomes the standard both of you can point to. Be concrete. "I'll give you advance notice before changes" beats "I'll communicate better."
              </AlertCard>
              {[
                { label: 'What I need from them', hint: `What do you need ${firstName} to understand or do differently?`, val: needFromThem, set: setNeedFromThem },
                { label: 'What I commit to', hint: 'What will you personally change or do consistently?', val: myCommitment, set: setMyCommitment },
                { label: 'If things break down...', hint: 'How will you repair the relationship when tension rises?', val: repairProtocol, set: setRepairProtocol },
              ].map(({ label, hint, val, set }) => (
                <div key={label} className="mt-3.5">
                  <div className="text-xs font-bold text-foreground mb-1">{label}</div>
                  <textarea value={val} onChange={e => set(e.target.value)} placeholder={hint}
                    className="w-full min-h-[70px] px-3 py-2 rounded-lg border border-border text-xs leading-relaxed resize-y font-[inherit] focus:outline-none focus:border-nav-accent" />
                </div>
              ))}
              <div className="mt-3.5">
                <div className="text-xs font-bold text-foreground mb-1">Check-in Cadence</div>
                <div className="flex gap-1.5">
                  {['Weekly', 'Bi-weekly', 'Monthly'].map(opt => (
                    <button key={opt} onClick={() => setCheckIn(opt)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                        checkIn === opt ? 'border-nav bg-nav text-white border' : 'border border-border bg-transparent text-foreground'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <h3 className="text-base font-extrabold text-foreground mb-1">Connection Agreement</h3>
              <p className="text-xs text-muted mb-3.5">{leader.name} & {person.name} -- Agreed {new Date().toLocaleDateString()}</p>
              {frictionPoints.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Identified Friction Points</div>
                  {frictionPoints.map(({ d, tier, text, action }) => (
                    <div key={d} className={`text-xs px-2.5 py-2 rounded-md bg-subtle border border-border mb-1.5 leading-relaxed border-l-3 border-l-disc-${d.toLowerCase()}`}>
                      <div><strong className={`text-disc-${d.toLowerCase()}`}>{discFull[d]} ({tier}):</strong> {text}</div>
                      {action && <div className="text-[10px] text-alert-success-accent mt-1"><strong>Action:</strong> {action}</div>}
                    </div>
                  ))}
                </div>
              )}
              {[
                { label: 'What I Need From You', val: needFromThem },
                { label: 'What I Commit To', val: myCommitment },
                { label: 'If Things Break Down', val: repairProtocol },
              ].map(({ label, val }) => val && (
                <div key={label} className="mb-2.5">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">{label}</div>
                  <div className="text-xs px-3 py-2 rounded-md bg-subtle border border-border leading-relaxed">{val}</div>
                </div>
              ))}
              <div className="mb-2.5">
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Check-in Cadence</div>
                <div className="text-xs px-3 py-2 rounded-md bg-subtle border border-border">{checkIn}</div>
              </div>
              <button onClick={() => window.print()} className="px-4 py-2 rounded-md border border-border bg-subtle text-xs font-semibold cursor-pointer text-foreground hover:bg-card transition-colors">
                Print Agreement
              </button>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-between items-center">
          <Btn onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>{step === 1 ? 'Cancel' : '\u2190 Back'}</Btn>
          <div className="flex gap-2">
            {step < 3 && <Btn primary onClick={() => setStep(s => s + 1)}>Next \u2192</Btn>}
            {step === 3 && <Btn primary onClick={saveAgreement}>Save Agreement \u2192</Btn>}
            {step === 4 && <Btn primary onClick={onClose}>Done</Btn>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
