'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { normBias } from '../constants/data';

export function EnvironmentAlignment({ person, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const firstName = person.name.split(' ')[0];

  const questions = [];
  const domDim = ['D', 'I', 'S', 'C'].reduce((a, b) => person.disc.natural[b] > person.disc.natural[a] ? b : a, 'D');
  const discQ = {
    D: { id: 'q_disc', category: 'Preference', text: 'At work, can you make decisions and move quickly without waiting for approval at every turn?' },
    I: { id: 'q_disc', category: 'Preference', text: 'Does your work give you regular chances to connect, communicate, and energize the people around you?' },
    S: { id: 'q_disc', category: 'Preference', text: "Is your work environment predictable enough that you're not burning energy on constant unexpected change?" },
    C: { id: 'q_disc', category: 'Preference', text: 'Do you get the time and information you need to meet the quality standard you hold for your work?' },
  };
  questions.push(discQ[domDim]);

  const valQ = {
    Aesthetic:       { id: 'q_val_ae', category: 'Passion', text: 'Does your work environment feel like it actually cares about people -- not just output?' },
    Economic:        { id: 'q_val_ec', category: 'Passion', text: 'Do you see a clear, measurable return on the time and energy you invest at work?' },
    Individualistic: { id: 'q_val_in', category: 'Passion', text: "Do you have real autonomy over how you work -- or do you mostly execute someone else's plan?" },
    Political:       { id: 'q_val_po', category: 'Passion', text: "Do you have genuine influence over decisions that matter at work -- not just the ones you're assigned?" },
    Altruistic:      { id: 'q_val_al', category: 'Passion', text: 'Does your work feel like it\'s genuinely helping people in ways that matter to you?' },
    Regulatory:      { id: 'q_val_re', category: 'Passion', text: "Are expectations, roles, and processes clear -- or do you spend energy filling in what's left undefined?" },
    Theoretical:     { id: 'q_val_th', category: 'Passion', text: "Does your environment give you time to think, learn, and understand the 'why' behind what you're doing?" },
  };
  Object.entries(person.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([v]) => questions.push(valQ[v]));

  const extBiasQ = {
    'Empathy':           { id: 'q_heart_bias', category: 'Process', text: 'Do the people around you pay attention to how decisions land on individuals -- or does that tend to get skipped?' },
    'Practical Thinking':{ id: 'q_hand_bias',  category: 'Process', text: 'Does your team actually follow through on what it decides, or do good plans die in the room?' },
    'Systems Judgment':  { id: 'q_head_bias',  category: 'Process', text: 'Does your environment take time to think strategically, or does it mostly react to what\'s in front of it?' },
  };
  person.attr.ext.forEach(a => { if (normBias(a.bias) === '\u2212') questions.push(extBiasQ[a.name]); });

  const intBiasQ = {
    'Self-Esteem':    { id: 'q_se', category: 'Internal', text: 'Do you feel genuinely valued for what you bring -- not just for finishing tasks?' },
    'Role Awareness': { id: 'q_ra', category: 'Internal', text: "Is your role and what success looks like clearly defined -- or does it feel like you're always guessing?" },
    'Self-Direction': { id: 'q_sd', category: 'Internal', text: "Do you have a clear path forward -- personal goals, a growth direction, something you're actively working toward?" },
  };
  person.attr.int.forEach(a => { if (normBias(a.bias) === '\u2212') questions.push(intBiasQ[a.name]); });

  const opts = ['Often', 'Sometimes', 'Rarely'];
  const score = { Often: 2, Sometimes: 1, Rarely: 0 };
  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  const results = submitted ? (() => {
    const byCategory = {};
    questions.forEach(q => {
      if (!byCategory[q.category]) byCategory[q.category] = { total: 0, max: 0 };
      byCategory[q.category].total += score[answers[q.id]] || 0;
      byCategory[q.category].max += 2;
    });
    return byCategory;
  })() : null;

  const getStatus = (total, max) => {
    const pct = total / max;
    return pct >= 0.7 ? { label: 'Supported', severity: 'success', text: 'Your environment is working for this dimension.' }
         : pct >= 0.4 ? { label: 'Signal', severity: 'warning', text: 'Your environment partially supports this. Worth watching.' }
         :               { label: 'Tax', severity: 'critical', text: 'Your environment is actively costing you here. This is confirmed.' };
  };

  const nextSteps = {
    Preference: {
      Tax: "Your behavioral environment is working against your natural style. The first step: identify the one daily interaction that costs you the most energy, and have a conversation about how to adjust it.",
      Signal: "Parts of your environment support your style, parts don't. Name the specific meetings, tasks, or relationships where you feel like you're performing -- that's where the cost lives.",
      Supported: "Your environment lets you lead the way you're built to. Protect this by noticing if new responsibilities or team changes start pulling you out of alignment."
    },
    Passion: {
      Tax: "What drives you isn't being fed here. That's not a motivation problem -- it's a fuel problem. Ask yourself: what would need to change for this work to actually energize me again?",
      Signal: "Some of what matters to you is present, some isn't. Identify the one value that's most starved and find one way to feed it this week -- even a small one.",
      Supported: "Your motivational drivers are being met. This is rare. Make sure you can articulate what's working so you can protect it."
    },
    Process: {
      Tax: "Your decision-making capacity is being suppressed. You're not using lenses you actually have. Start with: which decisions feel forced or incomplete? That's the lens your environment is blocking.",
      Signal: "You have capacity you're partially using. Look at where you second-guess yourself most -- that's often the suppressed lens trying to activate.",
      Supported: "Your full decision-making architecture is active. You're seeing situations through all available lenses."
    },
    Internal: {
      Tax: "Your internal foundation is taking hits. This is the most personal category -- it affects how you see yourself, not just how you perform. Start with one honest conversation with someone you trust about where you feel most uncertain.",
      Signal: "Parts of your internal foundation are solid, parts are wobbly. Name the specific area where your confidence wavers most -- that's where external support would have the highest return.",
      Supported: "Your internal foundation is strong. You trust yourself, your role, and your direction. That stability makes everything else easier to act on."
    }
  };

  const severityClasses = {
    success: { card: 'bg-alert-success-bg border-alert-success-border', label: 'text-alert-success-accent', arrow: 'text-alert-success-accent' },
    warning: { card: 'bg-alert-warning-bg border-alert-warning-border', label: 'text-alert-warning-accent', arrow: 'text-alert-warning-accent' },
    critical: { card: 'bg-alert-critical-bg border-alert-critical-border', label: 'text-alert-critical-accent', arrow: 'text-alert-critical-accent' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-300 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
    >
      <div className="modal-body bg-card rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-auto shadow-2xl">
        <div className="px-6 pt-5 pb-4 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10 rounded-t-2xl">
          <div>
            <h3 className="text-base font-extrabold text-foreground">Does this match your experience?</h3>
            <p className="text-xs text-muted">Personalized for {firstName}'s profile -- {questions.length} questions</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-subtle border border-border cursor-pointer flex items-center justify-center hover:bg-card transition-colors">
            <X size={14} className="text-muted" />
          </button>
        </div>

        <div className="p-6">
          {!submitted ? (
            <>
              <p className="text-xs text-muted mb-5 leading-relaxed">
                These questions are built from {firstName}'s actual profile data. Honest answers here turn signals into confirmed taxes -- or clear them.
              </p>
              {questions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="mb-5 p-4 rounded-xl bg-subtle border border-border"
                >
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">{q.category}</div>
                  <div className="text-sm font-semibold text-foreground leading-snug mb-3">{q.text}</div>
                  <div className="flex gap-2">
                    {opts.map(o => (
                      <button key={o} onClick={() => setAnswers(a => ({ ...a, [q.id]: o }))}
                        className={`flex-1 py-2 px-1 rounded-lg border-2 text-xs font-semibold cursor-pointer transition-all ${
                          answers[q.id] === o
                            ? 'border-nav bg-nav text-white'
                            : 'border-border bg-card text-foreground hover:border-foreground/30'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
              <button onClick={() => setSubmitted(true)} disabled={!allAnswered}
                className={`w-full py-3.5 rounded-xl border-none text-sm font-bold cursor-pointer transition-colors ${
                  allAnswered ? 'bg-nav text-white hover:opacity-90' : 'bg-border text-white cursor-default'
                }`}
              >
                See Results
              </button>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-foreground mb-1">What the environment is actually doing to {firstName}</div>
              <p className="text-xs text-muted mb-5">Based on {firstName}'s answers -- not assumptions.</p>
              {Object.entries(results).map(([cat, { total, max }]) => {
                const st = getStatus(total, max);
                const sc = severityClasses[st.severity];
                const catQuestions = questions.filter(q => q.category === cat);
                const problematic = catQuestions.filter(q => score[answers[q.id]] <= 1);

                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-xl border mb-3 ${sc.card}`}
                  >
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-bold text-foreground">{cat}</span>
                      <span className={`text-xs font-extrabold bg-card px-2.5 py-0.5 rounded-md ${sc.label}`}>{st.label}</span>
                    </div>
                    {problematic.length > 0 && (
                      <div className={`text-xs mb-1.5 leading-relaxed ${sc.arrow}`}>
                        {problematic.map(q => (
                          <div key={q.id} className="flex gap-1.5 mb-0.5">
                            <span className="shrink-0">→</span>
                            <span>You answered "{answers[q.id]}" to: <em>{q.text}</em></span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-foreground leading-relaxed mb-2">{st.text}</p>
                    <div className="text-xs leading-relaxed px-3 py-2 bg-card rounded-md font-medium">
                      <strong>Next step:</strong> {nextSteps[cat]?.[st.label] || 'Review this area and consider what changes would make the biggest difference.'}
                    </div>
                  </motion.div>
                );
              })}
              <button onClick={() => { setAnswers({}); setSubmitted(false); }}
                className="w-full mt-2 py-3 rounded-xl bg-subtle border border-border text-sm font-semibold cursor-pointer text-foreground hover:bg-card transition-colors">
                Retake
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
