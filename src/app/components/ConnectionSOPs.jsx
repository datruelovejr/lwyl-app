'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Expandable } from './ui/Expandable';

const sopDisc = {
  D: {
    label: "Dominance",
    sop: "Speed and decisiveness are your default. That's not a flaw -- that's a feature. The work is making sure others are on board before you've already moved. Give people what they need to move with you, not behind you. Ask: who needs to weigh in before this becomes a decision?",
    irks: "Indecision, unnecessary approval loops, and people who analyze when action is what's needed.",
    need: "Autonomy over how problems get solved. Clear challenges and the room to run at them."
  },
  I: {
    label: "Influence",
    sop: "You create the spark. Others don't have to match your energy -- your job is finding what lights them up, not keeping the spotlight on yourself. Figure out what excitement looks like for each person and help them get there. And recognize when you're doing too much -- a good SOP for you has an off-switch.",
    irks: "Transactional environments, cold leadership, and rooms where nobody laughs.",
    need: "People interaction, recognition, and the freedom to communicate in your own way."
  },
  S: {
    label: "Steadiness",
    sop: "Stability is your superpower. When others move fast, you're the anchor. The challenge is building enough flexibility that fast movers don't feel slowed down, and that you can lean into change without it costing you. Plan for disruption so it doesn't catch you off guard.",
    irks: "Sudden changes, lack of process, and environments that mistake urgency for progress.",
    need: "Consistency, clear expectations, and enough time to do things right."
  },
  C: {
    label: "Compliance",
    sop: "The details you catch keep teams out of trouble. Share what you see in ways that invite people in. Not everyone needs every step -- help them see the problem it solves. Be mindful of when more questions slow things down, and find the right time to get what you need without holding up the work.",
    irks: "Rushing past important details, skipping process, and decisions made without data.",
    need: "Accuracy, structure, time to analyze, and clear standards to work within."
  }
};

const sopValues = {
  Aesthetic:       { sop: "You need the work to mean something. Forced culture, empty rituals, and going-through-the-motions environments drain you. The initiative you'd thrive in: building how things feel, not just how they function.", irks: "Cold top-down leadership, fake positivity, and work that feels empty." },
  Economic:        { sop: "If it's not moving the needle, you don't want to spend time on it. Your lens is ROI -- time, energy, money. You'd thrive leading anything that cuts waste, improves efficiency, or creates a clear win.", irks: "Long meetings with no outcome, vague goals, and doing things 'because we've always done it.'" },
  Individualistic: { sop: "Micromanagement is your kryptonite. You need autonomy and the room to put your mark on the work. Give you a problem and let you run at it your way -- you'll deliver.", irks: "'Just follow the process' cultures, no room for creativity, being handed a plan with no input." },
  Political:       { sop: "You want a seat at the table where the real decisions happen. Visibility, influence, and real responsibility -- not just busy work. You step up when others won't.", irks: "Being left out of decisions, leaders who expect compliance, ambition being mistaken for arrogance." },
  Altruistic:      { sop: "You're here to make a difference, not to be noticed. The work that lights you up is the work that helps someone else. Cold, numbers-first environments slowly cost you.", irks: "Cultures that ignore the human cost, leaders who talk support but don't act on it." },
  Regulatory:      { sop: "You build order where it's missing. Clear expectations, consistent follow-through, and systems that work -- that's your environment. Chaos and ambiguity cost you more than they cost most.", irks: "Last-minute changes, vague roles, reinventing the wheel every time, leadership that breaks its own rules." },
  Theoretical:     { sop: "You're always asking why -- and that's a gift. Learning, analyzing, understanding the root of things keeps you engaged. Shallow 'just execute it' environments bore you fast.", irks: "'Just do it' cultures, curiosity treated as overthinking, no time to reflect or learn." }
};

const sopProcess = {
  Heart: { sop: "Lead with who it affects before you explain what you're doing. Your ability to read how a decision lands on people is a read others don't have. Use it to catch what the data misses -- and name it when you see it.", consideration: "How does this affect people? Who haven't we heard from? Have we considered everyone before we move?" },
  Hand:  { sop: "Keep the team focused on what's actually actionable. SMART goals, clear ownership, and following through on what was decided. The questions your team needs from you: What's the fastest path? What are we actually committing to? Who owns what?", consideration: "What can we realistically do now? How do we make sure what we decide actually gets done?" },
  Head:  { sop: "Ask the system question before anyone moves. What's the ripple effect? What are we not seeing long-term? Your SWOT lens is protection the team needs -- especially from fast movers who'll commit before the consequences are visible.", consideration: "What's the big picture? What problems will we face before, during, and after? Are we keeping the main thing the main thing?" }
};

function SOPSection({ label, color, name, score, isOpen, onToggle, children }) {
  return (
    <div
      className="rounded-lg bg-subtle border border-border mb-2 overflow-hidden border-l-3"
      style={{ borderLeftColor: color }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-3.5 py-3 flex items-center justify-between cursor-pointer bg-transparent border-none"
      >
        <span className="text-sm font-bold" style={{ color }}>{name} {score != null && <span className="font-normal text-xs text-muted">({score})</span>}</span>
        <span className="text-xs text-muted">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-3.5 pb-3.5"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

export function ConnectionSOPs({ person }) {
  const [open, setOpen] = useState(null);
  const domDims = ['D', 'I', 'S', 'C'].filter(d => person.disc.natural[d] >= 60);
  const topVals = Object.entries(person.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const leadAttr = person.attr.ext.reduce((a, b) => a.score >= b.score ? a : b);
  const leadLabel = leadAttr.name === 'Empathy' ? 'Heart' : leadAttr.name === 'Practical Thinking' ? 'Hand' : 'Head';
  const firstName = person.name.split(' ')[0];

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-foreground">Connection SOPs</h3>
        <p className="text-xs text-muted mt-0.5">How to work with {firstName} -- and what it costs when you don't.</p>
      </div>

      {/* DISC SOPs */}
      {domDims.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Preference (DISC)</div>
          {domDims.map(d => {
            const s = sopDisc[d];
            return (
              <SOPSection
                key={d}
                label={d}
                color={`var(--disc-${d.toLowerCase()})`}
                name={`High ${d} -- ${s.label}`}
                isOpen={open === `disc-${d}`}
                onToggle={() => setOpen(open === `disc-${d}` ? null : `disc-${d}`)}
              >
                <p className="text-xs text-foreground leading-relaxed mb-2">{s.sop}</p>
                <p className="text-xs text-muted"><strong>What they need:</strong> {s.need}</p>
                <p className="text-xs text-friction-high mt-1"><strong>What irks them:</strong> {s.irks}</p>
              </SOPSection>
            );
          })}
        </div>
      )}

      {/* Values SOPs */}
      {topVals.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Passion (Top Values)</div>
          {topVals.map(([v, score]) => {
            const s = sopValues[v];
            return (
              <SOPSection
                key={v}
                color={`var(--values-${v.toLowerCase()})`}
                name={v}
                score={score}
                isOpen={open === `val-${v}`}
                onToggle={() => setOpen(open === `val-${v}` ? null : `val-${v}`)}
              >
                <p className="text-xs text-foreground leading-relaxed mb-2">{s.sop}</p>
                <p className="text-xs text-friction-high"><strong>What irks them:</strong> {s.irks}</p>
              </SOPSection>
            );
          })}
        </div>
      )}

      {/* Process SOP */}
      <div>
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Process (Lead Attribute)</div>
        <SOPSection
          color="var(--attr-ext)"
          name={`${leadLabel} -- ${leadAttr.name}`}
          score={leadAttr.score}
          isOpen={open === 'proc'}
          onToggle={() => setOpen(open === 'proc' ? null : 'proc')}
        >
          <p className="text-xs text-foreground leading-relaxed mb-2">{sopProcess[leadLabel].sop}</p>
          <p className="text-xs text-muted italic">"{sopProcess[leadLabel].consideration}"</p>
        </SOPSection>
      </div>
    </Card>
  );
}
