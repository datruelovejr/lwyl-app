'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, FileEdit, Zap, TrendingUp, Award, Target, X, ArrowLeft
} from 'lucide-react';
import { discFull, getDom } from '../constants/data';
import { Btn } from './Btn';
import {
  discInsights, valuesInsights, getEnvironmentTaxSummary, getGapInsight
} from '../knowledge/assessmentInsights';
import { PersonChip } from './ui/PersonChip';
import { GapBar } from './ui/GapBar';
import { InsightCard } from './ui/InsightCard';
import { AlertCard } from './ui/AlertCard';
import { WalkInTheirShoes } from './WalkInTheirShoes';

const purposes = [
  { id: 'checkin', label: 'Check-In', icon: <MessageSquare size={20} />, desc: 'Regular 1:1 check-in' },
  { id: 'feedback', label: 'Give Feedback', icon: <FileEdit size={20} />, desc: 'Deliver constructive feedback' },
  { id: 'difficult', label: 'Difficult Conversation', icon: <Zap size={20} />, desc: 'Address a hard topic' },
  { id: 'development', label: 'Development', icon: <TrendingUp size={20} />, desc: 'Career or skill growth' },
  { id: 'recognition', label: 'Recognition', icon: <Award size={20} />, desc: 'Acknowledge contributions' },
  { id: 'delegation', label: 'Delegation', icon: <Target size={20} />, desc: 'Assign new responsibility' },
];

function getDiscGapFriction(leader, person) {
  if (!leader?.disc) return [];
  const dims = ['D', 'I', 'S', 'C'];
  return dims.map(d => {
    const gap = leader.disc.natural[d] - person.disc.natural[d];
    const abs = Math.abs(gap);
    if (abs < 15) return null;
    return { dim: d, gap, abs, full: discFull[d] };
  }).filter(Boolean).sort((a, b) => b.abs - a.abs);
}

function getValuesAlignment(leader, person) {
  if (!leader) return { shared: [], leaderOnly: [], personOnly: [] };
  const lTop = Object.entries(leader.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const pTop = Object.entries(person.values).filter(([, s]) => s >= 60).map(([k]) => k);
  return {
    shared: lTop.filter(v => pTop.includes(v)),
    leaderOnly: lTop.filter(v => !pTop.includes(v)),
    personOnly: pTop.filter(v => !lTop.includes(v)),
  };
}

function getProcessMismatch(leader, person) {
  if (!leader) return null;
  const lLead = [...leader.attr.ext].sort((a, b) => b.score - a.score)[0];
  const pLead = [...person.attr.ext].sort((a, b) => b.score - a.score)[0];
  if (lLead.label === pLead.label) return null;
  return { leader: lLead.label, person: pLead.label };
}

function getApproachGuidance(person, purpose) {
  const firstName = person.name.split(' ')[0];
  const highD = person.disc.natural.D >= 70;
  const highI = person.disc.natural.I >= 70;
  const highS = person.disc.natural.S >= 70;
  const highC = person.disc.natural.C >= 70;
  const topVals = Object.entries(person.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const leadAttr = [...person.attr.ext].sort((a, b) => b.score - a.score)[0];

  const guidance = { open: [], avoid: [], language: [] };

  if (highD) { guidance.open.push('Get to the point quickly. State the purpose upfront.'); guidance.avoid.push("Don't start with small talk that feels like stalling."); }
  if (highI) { guidance.open.push("Start with genuine connection. Ask how they're doing and mean it."); guidance.avoid.push("Don't jump straight to business without warming up the relationship."); }
  if (highS) { guidance.open.push("Set the context. Tell them what you want to talk about and why -- no surprises."); guidance.avoid.push("Don't spring topics on them without warning. They need time to process."); }
  if (highC) { guidance.open.push('Bring data. If you have specifics, lead with them.'); guidance.avoid.push("Don't make vague, feeling-based claims without evidence."); }

  if (leadAttr.label === 'Heart') guidance.language.push('Lead with impact on people before covering data or results.');
  else if (leadAttr.label === 'Hand') guidance.language.push('Lead with what\'s actionable. What can they do with this information?');
  else guidance.language.push('Lead with the framework. Help them see the system before the details.');

  if (purpose === 'feedback') {
    if (highD) guidance.language.push('Be direct. They respect honesty more than diplomacy.');
    if (highI) guidance.language.push("Affirm the relationship first. Make it clear feedback doesn't change how you see them.");
    if (highS) guidance.language.push("Be steady. Don't overload them. One or two items, delivered calmly.");
    if (highC) guidance.language.push('Be specific. Vague feedback is worse than no feedback for them.');
    if (person.attr.int.find(a => a.name === 'Self-Esteem' && (a.bias === '\u2212' || a.bias === '-')))
      guidance.avoid.push('Their Self-Esteem is environment-sensitive. Frame feedback as investment, not criticism.');
  }
  if (purpose === 'difficult') {
    guidance.open.push("Name the elephant. Don't circle the topic.");
    if (highS) guidance.language.push("Reassure them about what's NOT changing before addressing what is.");
    if (highI) guidance.language.push("Separate the issue from the person. Make it clear you're addressing the situation, not them.");
    if (highD) guidance.language.push("Give them agency. Frame the problem, then ask how they'd solve it.");
    if (highC) guidance.language.push('Expect questions. Give them permission to process before expecting a response.');
  }
  if (purpose === 'development') {
    topVals.forEach(v => {
      if (v === 'Individualistic') guidance.language.push('Frame growth opportunities as paths to greater autonomy and impact.');
      if (v === 'Theoretical') guidance.language.push('Frame development as learning and mastery, not just career advancement.');
      if (v === 'Political') guidance.language.push('Connect development to visibility and influence. Show how growth increases their seat at the table.');
      if (v === 'Altruistic') guidance.language.push('Connect development to how they can better serve others and increase their impact.');
    });
  }
  if (purpose === 'recognition') {
    if (highI) guidance.language.push('Public recognition lands well. They want to be seen.');
    if (highS) guidance.language.push("Private, sincere recognition. They don't need the spotlight -- they need to know you noticed.");
    if (highD) guidance.language.push('Recognize the result, not the effort. They value outcomes.');
    if (highC) guidance.language.push('Be specific about what they did right. Vague praise feels empty.');
  }
  if (purpose === 'delegation') {
    if (highD) guidance.language.push('Give the goal, not the method. Let them own the how.');
    if (highC) guidance.language.push('Define clear parameters, quality standards, and deadlines upfront.');
    if (highS) guidance.language.push("Explain why this is changing and what support they'll have.");
    if (highI) guidance.language.push('Frame it as trust and opportunity, not just more work.');
    if (person.attr.int.find(a => a.name === 'Role Awareness' && a.bias === '+'))
      guidance.avoid.push('Their Role Awareness is high -- be crystal clear about scope and boundaries.');
  }
  return guidance;
}

function getConversationStarters(person, purpose, leader) {
  const firstName = person.name.split(' ')[0];
  const envTax = getEnvironmentTaxSummary(person);
  const starters = [];

  if (envTax.totalGap >= 80)
    starters.push({ type: 'environment', text: `"${firstName}, I want to check in on how things are feeling for you in this environment right now. Not the work -- the environment itself."` });
  if (envTax.hasFrustratedPT)
    starters.push({ type: 'signal', text: '"I want to make sure the work you\'re doing feels like it matters. Are the things you\'re producing landing the way you\'d want them to?"' });

  const gaps = leader ? getDiscGapFriction(leader, person) : [];
  if (gaps.length > 0) {
    const top = gaps[0];
    starters.push({ type: 'friction', text: top.gap > 0
      ? `"I know my pace on ${top.full.toLowerCase()} can be different from yours. I want to make sure my style isn't creating friction for you."`
      : `"I know you bring more ${top.full.toLowerCase()} energy than I naturally do. I want to make sure you have the room to use that strength."`
    });
  }

  if (purpose === 'checkin') {
    starters.push({ type: 'purpose', text: '"What\'s one thing that\'s working well for you right now, and one thing that\'s costing you energy?"' });
    starters.push({ type: 'purpose', text: '"If you could change one thing about how we work together, what would it be?"' });
  }
  if (purpose === 'feedback') starters.push({ type: 'purpose', text: '"I have some observations I want to share because I think they\'ll help. Can I walk you through what I\'m seeing?"' });
  if (purpose === 'difficult') starters.push({ type: 'purpose', text: '"There\'s something I need to address with you. It\'s not easy, but I respect you enough to be honest about it."' });
  if (purpose === 'development') starters.push({ type: 'purpose', text: '"I see growth potential in you that I want to talk about. Where do you see yourself heading?"' });
  if (purpose === 'recognition') starters.push({ type: 'purpose', text: '"I want to name something I\'ve noticed about your work. It matters, and I don\'t want it to go unsaid."' });
  if (purpose === 'delegation') starters.push({ type: 'purpose', text: '"I have something I want to put in your hands because I think you\'re the right person for it. Let me walk you through what I\'m thinking."' });

  const topVal = Object.entries(person.values).sort((a, b) => b[1] - a[1])[0];
  if (topVal[1] >= 60) {
    const valStarters = {
      Altruistic: '"Is the work you\'re doing right now connecting to the impact you want to have?"',
      Economic: '"Are you getting a good return on the energy you\'re investing here?"',
      Individualistic: '"Do you feel like you have enough autonomy in how you approach your work?"',
      Political: '"Do you feel like you have the influence and visibility you need in this role?"',
      Regulatory: '"Do you have the structure and clarity you need to do your best work?"',
      Theoretical: '"Are you getting the depth of understanding you need, or does the work feel too surface-level?"',
      Aesthetic: '"Does the work environment feel right to you? Is there something about how things flow that\'s off?"',
    };
    if (valStarters[topVal[0]]) starters.push({ type: 'values', text: valStarters[topVal[0]] });
  }
  return starters;
}

export function MeetingRoom({ person, leader, onClose }) {
  const [purpose, setPurpose] = useState(null);
  const firstName = person.name.split(' ')[0];
  const dom = getDom(person.disc.natural);
  const envTax = getEnvironmentTaxSummary(person);
  const prefTax = envTax.totalGap;
  const prefTaxLabel = prefTax >= 160 ? 'Critical' : prefTax >= 120 ? 'Heavy' : prefTax >= 80 ? 'Significant' : prefTax >= 40 ? 'Moderate' : 'Aligned';

  const friction = leader ? getDiscGapFriction(leader, person) : [];
  const valAlign = getValuesAlignment(leader, person);
  const procMismatch = getProcessMismatch(leader, person);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-300 flex items-start justify-center overflow-y-auto p-6"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 300 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="modal-body bg-card rounded-xl w-full max-w-[720px] shadow-2xl"
      >
        {/* Header */}
        <div className="bg-nav text-white rounded-t-xl px-7 py-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-xl">Meeting Room: {person.name}</div>
            <div className="text-sm text-white/65 mt-0.5">Conversation prep powered by assessment data</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 border-none cursor-pointer text-white/70 hover:bg-white/20 transition-colors flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="px-7 pt-7 pb-5">
          <AnimatePresence mode="wait">
            {!purpose ? (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {/* Purpose Selector */}
                <div className="mb-3">
                  <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-1">What's this conversation about?</div>
                  <div className="text-xs text-muted">Select a purpose to get tailored prep</div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {purposes.map(p => (
                    <motion.button
                      key={p.id}
                      onClick={() => setPurpose(p.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 rounded-xl border border-border bg-card cursor-pointer text-center hover:border-nav-accent hover:bg-subtle transition-colors"
                    >
                      <div className="text-nav-accent mb-1.5 flex justify-center">{p.icon}</div>
                      <div className="text-sm font-bold text-foreground">{p.label}</div>
                      <div className="text-[10px] text-muted mt-0.5">{p.desc}</div>
                    </motion.button>
                  ))}
                </div>

                {/* Quick Intel */}
                <div className="mb-3">
                  <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-1">Quick Intel</div>
                  <div className="text-xs text-muted">What to know about {firstName} before you walk in</div>
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {/* DISC snapshot */}
                  <div className="flex-1 min-w-[200px] p-3 rounded-lg bg-subtle border border-border">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1.5">Natural Style</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['D', 'I', 'S', 'C'].map(d => {
                        const score = person.disc.natural[d];
                        const isHigh = score >= 60;
                        return (
                          <span key={d} className={`px-2 py-0.5 rounded text-xs font-bold ${
                            isHigh ? `bg-disc-${d.toLowerCase()} text-white` : 'bg-subtle text-muted border border-border'
                          }`}
                            style={isHigh && d === 'I' ? { color: 'var(--text-primary)' } : undefined}
                          >
                            {d}:{score}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {/* Environment Tax */}
                  <div className="flex-1 min-w-[200px] p-3 rounded-lg bg-subtle border border-border border-l-3 border-l-friction-high">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Environment Tax</div>
                    <div className={`text-lg font-extrabold ${prefTax >= 80 ? 'text-friction-high' : prefTax >= 40 ? 'text-friction-moderate' : 'text-friction-low'}`}>
                      {prefTaxLabel}
                    </div>
                    <div className="text-[10px] text-muted">{prefTax} gap points</div>
                  </div>
                  {/* Top Values */}
                  <div className="flex-1 min-w-[200px] p-3 rounded-lg bg-subtle border border-border">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1.5">Top Drivers</div>
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(person.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([v, s]) => (
                        <span key={v} className="text-[10px] font-semibold bg-card border border-border px-1.5 py-0.5 rounded"
                          style={{ color: `var(--values-${v.toLowerCase()})` }}
                        >
                          {v} {s}
                        </span>
                      ))}
                      {Object.entries(person.values).filter(([, s]) => s >= 60).length === 0 && (
                        <span className="text-[10px] text-muted">No strong drivers (60+)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Walk In Their Shoes moment */}
                {envTax.totalGap >= 40 && envTax.costlyGaps.length > 0 && (() => {
                  const topGap = envTax.costlyGaps[0];
                  return (
                    <WalkInTheirShoes
                      name={firstName}
                      dimension={topGap.dim}
                      gapScore={envTax.totalGap}
                    />
                  );
                })()}

                {/* Friction Points with leader */}
                {leader && friction.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-1">Friction Points with You</div>
                    <div className="text-xs text-muted mb-2">Where your styles naturally clash</div>
                    {friction.map((f, i) => (
                      <motion.div
                        key={f.dim}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.08 }}
                      >
                        <InsightCard variant={f.abs >= 30 ? 'priority' : 'standard'} enterDelay={0}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold text-disc-${f.dim.toLowerCase()}`}>{f.full}</span>
                            <span className="text-[10px] font-semibold text-muted ml-auto">
                              You: {leader.disc.natural[f.dim]} / Them: {person.disc.natural[f.dim]}
                            </span>
                          </div>
                          <GapBar value={f.abs} dimension={f.dim} label={`${f.abs}-point gap`} maxValue={80} />
                          <p className="text-xs text-foreground/80 leading-relaxed mt-2">
                            {f.gap > 0
                              ? `You naturally bring more ${f.full.toLowerCase()} than ${firstName}. Your pace here may overwhelm them.`
                              : `${firstName} naturally brings more ${f.full.toLowerCase()} than you. They may feel held back by your approach here.`}
                          </p>
                        </InsightCard>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Process mismatch */}
                {procMismatch && (
                  <AlertCard severity="info" title="Decision-Making Mismatch">
                    You lead with <strong>{procMismatch.leader}</strong>, they lead with <strong>{procMismatch.person}</strong>. You're processing information through different lenses. Start conversations in their language, not yours.
                  </AlertCard>
                )}
              </motion.div>
            ) : (
              <motion.div key="prep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {/* Purpose selected -- full prep */}
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setPurpose(null)} className="bg-transparent border-none cursor-pointer text-muted p-0 hover:text-foreground transition-colors">
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <div className="text-sm font-bold text-foreground flex items-center gap-2">
                      {purposes.find(p => p.id === purpose)?.icon}
                      {purposes.find(p => p.id === purpose)?.label}: {firstName}
                    </div>
                    <div className="text-xs text-muted">Your prep is ready. Review before you walk in.</div>
                  </div>
                </div>

                {/* Environment Context */}
                {prefTax >= 40 && (
                  <AlertCard severity="warning" title="Environment Context">
                    <p className="leading-relaxed">
                      {firstName}'s environment tax is <strong>{prefTaxLabel}</strong> ({prefTax} gap points). {prefTax >= 80
                        ? "They're carrying significant adaptation cost right now. Be aware that fatigue and frustration may be present even if they don't show it."
                        : "They're adapting to their environment in meaningful ways. Some friction may be environment-driven, not personal."}
                    </p>
                    {envTax.hasFrustratedPT && (
                      <p className="text-[10px] font-semibold text-friction-high mt-1.5">Environment damage signal active (Practical Thinking frustrated). Their relationship with results may be strained.</p>
                    )}
                  </AlertCard>
                )}

                {/* Approach Guidance */}
                {(() => {
                  const guidance = getApproachGuidance(person, purpose);
                  return (
                    <>
                      {guidance.open.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-2">How to Open</div>
                          {guidance.open.map((g, i) => (
                            <div key={i} className="text-xs text-foreground leading-relaxed px-3 py-1.5 rounded-md bg-alert-success-bg border border-alert-success-border border-l-3 border-l-alert-success-accent mb-1">
                              {g}
                            </div>
                          ))}
                        </div>
                      )}
                      {guidance.language.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-2">Language That Works</div>
                          {guidance.language.map((g, i) => (
                            <div key={i} className="text-xs text-foreground leading-relaxed px-3 py-1.5 rounded-md bg-alert-info-bg border border-alert-info-border border-l-3 border-l-alert-info-accent mb-1">
                              {g}
                            </div>
                          ))}
                        </div>
                      )}
                      {guidance.avoid.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-2">What to Avoid</div>
                          {guidance.avoid.map((g, i) => (
                            <div key={i} className="text-xs text-alert-critical-text leading-relaxed px-3 py-1.5 rounded-md bg-alert-critical-bg border border-alert-critical-border border-l-3 border-l-alert-critical-accent mb-1">
                              {g}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Friction with Leader */}
                {friction.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-1">Watch Your Friction</div>
                    <div className="text-xs text-muted mb-2">Where your styles naturally diverge</div>
                    {friction.slice(0, 2).map((f, i) => (
                      <motion.div key={f.dim} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.08 }}>
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold text-disc-${f.dim.toLowerCase()}`}>{f.full}</span>
                            <GapBar value={f.abs} dimension={f.dim} showNumber={true} maxValue={80} />
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed pl-0.5">
                            {f.gap > 0
                              ? `You're naturally ${f.abs >= 30 ? 'significantly' : 'noticeably'} higher in ${f.full.toLowerCase()}. Dial back your intensity here. Let them set the pace.`
                              : `They're naturally ${f.abs >= 30 ? 'significantly' : 'noticeably'} higher in ${f.full.toLowerCase()}. Give them room to express it. Don't interpret their energy as a challenge.`}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Values context */}
                {(valAlign.shared.length > 0 || valAlign.personOnly.length > 0) && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-2">Values Context</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {valAlign.shared.map(v => (
                        <span key={v} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-alert-success-bg text-alert-success-accent border border-alert-success-border">Shared: {v}</span>
                      ))}
                      {valAlign.personOnly.map(v => (
                        <span key={v} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-alert-warning-bg text-alert-warning-accent border border-alert-warning-border">Their driver: {v}</span>
                      ))}
                    </div>
                    {valAlign.personOnly.length > 0 && (
                      <p className="text-xs text-muted mt-1.5 leading-relaxed">
                        {firstName} is driven by {valAlign.personOnly.join(' and ')} -- {valAlign.personOnly.length === 1 ? 'a value' : 'values'} you don't share at the same intensity. Acknowledge what fuels them even if it doesn't fuel you.
                      </p>
                    )}
                  </div>
                )}

                {/* Conversation Starters */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-nav-accent uppercase tracking-wider mb-1">Conversation Starters</div>
                  <div className="text-xs text-muted mb-2">Data-driven openers you can use</div>
                  {getConversationStarters(person, purpose, leader).map((s, i) => {
                    const typeMap = {
                      signal: { severity: 'critical' },
                      friction: { severity: 'warning' },
                      environment: { severity: 'warning' },
                      purpose: { severity: 'info' },
                      values: { severity: 'info' },
                    };
                    const config = typeMap[s.type] || typeMap.purpose;
                    return (
                      <div key={i} className="mb-1.5">
                        <AlertCard severity={config.severity} title={s.type.toUpperCase()}>
                          <p className="italic leading-relaxed">{s.text}</p>
                        </AlertCard>
                      </div>
                    );
                  })}
                </div>

                {/* Before You Walk In */}
                <InsightCard variant="muted">
                  <div className="text-xs font-bold text-nav-accent mb-1">BEFORE YOU WALK IN</div>
                  <p className="text-xs text-foreground leading-relaxed">
                    This prep is built from {firstName}'s assessment data and {leader ? 'your style comparison' : 'their profile'}. Use it as a compass, not a script. The best conversations happen when you're prepared enough to be present -- not when you're following a playbook.
                  </p>
                </InsightCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-border flex justify-between items-center">
          {purpose && (
            <button onClick={() => setPurpose(null)} className="bg-transparent border-none cursor-pointer text-xs font-semibold text-muted p-0 hover:text-foreground transition-colors">
              <ArrowLeft size={12} className="inline mr-1" /> Change Purpose
            </button>
          )}
          <div className="ml-auto">
            <Btn primary onClick={onClose}>Close</Btn>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
