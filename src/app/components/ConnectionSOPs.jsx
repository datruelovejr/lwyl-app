'use client';

import { useState } from "react";
import { C } from "../constants/colors";

// ────── PRIORITY 8: SOPs INTEGRATION ──────
const sopDisc = {
  D: {
    label: "Dominance",
    sop: "Speed and decisiveness are your default. That's not a flaw - that's a feature. The work is making sure others are on board before you've already moved. Give people what they need to move with you, not behind you. Ask: who needs to weigh in before this becomes a decision?",
    irks: "Indecision, unnecessary approval loops, and people who analyze when action is what's needed.",
    need: "Autonomy over how problems get solved. Clear challenges and the room to run at them."
  },
  I: {
    label: "Influence",
    sop: "You create the spark. Others don't have to match your energy - your job is finding what lights them up, not keeping the spotlight on yourself. Figure out what excitement looks like for each person and help them get there. And recognize when you're doing too much - a good SOP for you has an off-switch.",
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
    sop: "The details you catch keep teams out of trouble. Share what you see in ways that invite people in. Not everyone needs every step - help them see the problem it solves. Be mindful of when more questions slow things down, and find the right time to get what you need without holding up the work.",
    irks: "Rushing past important details, skipping process, and decisions made without data.",
    need: "Accuracy, structure, time to analyze, and clear standards to work within."
  }
};

const sopValues = {
  Aesthetic:       { sop: "You need the work to mean something. Forced culture, empty rituals, and going-through-the-motions environments drain you. The initiative you'd thrive in: building how things feel, not just how they function. Creating trust and belonging where it's missing.", irks: "Cold top-down leadership, fake positivity, and work that feels empty." },
  Economic:        { sop: "If it's not moving the needle, you don't want to spend time on it. Your lens is ROI - time, energy, money. You'd thrive leading anything that cuts waste, improves efficiency, or creates a clear win. Just make sure not everyone around you sees effort the way you do.", irks: "Long meetings with no outcome, vague goals, and doing things 'because we've always done it.'" },
  Individualistic: { sop: "Micromanagement is your kryptonite. You need autonomy and the room to put your mark on the work. Give you a problem and let you run at it your way - you'll deliver. The challenge is staying connected to the team when independence is your default mode.", irks: "'Just follow the process' cultures, no room for creativity, being handed a plan with no input." },
  Political:       { sop: "You want a seat at the table where the real decisions happen. Visibility, influence, and real responsibility - not just busy work. You step up when others won't. Channel that into outcomes for the team and people will follow. Sideline it and you'll quietly disengage.", irks: "Being left out of decisions, leaders who expect compliance, ambition being mistaken for arrogance." },
  Altruistic:      { sop: "You're here to make a difference, not to be noticed. The work that lights you up is the work that helps someone else. Cold, numbers-first environments slowly cost you. What keeps you engaged: knowing your effort genuinely made someone's situation better.", irks: "Cultures that ignore the human cost, leaders who talk support but don't act on it, environments where ego matters more than impact." },
  Regulatory:      { sop: "You build order where it's missing. Clear expectations, consistent follow-through, and systems that work - that's your environment. Chaos and ambiguity cost you more than they cost most. The work you'd thrive in: fixing things that are scattered, creating processes that stick.", irks: "Last-minute changes, vague roles, reinventing the wheel every time, leadership that breaks its own rules." },
  Theoretical:     { sop: "You're always asking why - and that's a gift. Learning, analyzing, understanding the root of things keeps you engaged. Shallow 'just execute it' environments bore you fast. Give you a complex problem to research or a system to understand and you'll go deep. The challenge: not everyone needs the full picture before moving.", irks: "'Just do it' cultures, curiosity treated as overthinking, no time to reflect or learn." }
};

const sopProcess = {
  Heart: { sop: "Lead with who it affects before you explain what you're doing. Your ability to read how a decision lands on people is a read others don't have. Use it to catch what the data misses - and name it when you see it.", consideration: "How does this affect people? Who haven't we heard from? Have we considered everyone before we move?" },
  Hand:  { sop: "Keep the team focused on what's actually actionable. SMART goals, clear ownership, and following through on what was decided. The questions your team needs from you: What's the fastest path? What are we actually committing to? Who owns what?", consideration: "What can we realistically do now? How do we make sure what we decide actually gets done?" },
  Head:  { sop: "Ask the system question before anyone moves. What's the ripple effect? What are we not seeing long-term? Your SWOT lens is protection the team needs - especially from fast movers who'll commit before the consequences are visible.", consideration: "What's the big picture? What problems will we face before, during, and after? Are we keeping the main thing the main thing?" }
};

export function ConnectionSOPs({ person }) {
  const [open, setOpen] = useState(null);
  const domDims = ["D","I","S","C"].filter(d => person.disc.natural[d] >= 60);
  const topVals = Object.entries(person.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).slice(0,2);
  const leadAttr = person.attr.ext.reduce((a,b) => a.score >= b.score ? a : b);
  const leadLabel = leadAttr.name === "Empathy" ? "Heart" : leadAttr.name === "Practical Thinking" ? "Hand" : "Head";

  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Connection SOPs</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>How to work with {person.name.split(" ")[0]} - and what it costs when you don't.</div>
      </div>

      {/* DISC SOPs */}
      {domDims.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Preference (DISC)</div>
          {domDims.map(d => {
            const s = sopDisc[d];
            return (
              <div key={d} style={{ padding: 14, borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.disc[d]}`, marginBottom: 8 }}>
                <div onClick={() => setOpen(open === `disc-${d}` ? null : `disc-${d}`)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.disc[d] }}>High {d} - {s.label}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{open === `disc-${d}` ? "▲" : "▼"}</span>
                </div>
                {open === `disc-${d}` && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, marginBottom: 8 }}>{s.sop}</div>
                    <div style={{ fontSize: 11, color: C.muted }}><strong>What they need:</strong> {s.need}</div>
                    <div style={{ fontSize: 11, color: "#C62828", marginTop: 4 }}><strong>What irks them:</strong> {s.irks}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Values SOPs */}
      {topVals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Passion (Top Values)</div>
          {topVals.map(([v, score]) => {
            const s = sopValues[v];
            return (
              <div key={v} style={{ padding: 14, borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.values[v]}`, marginBottom: 8 }}>
                <div onClick={() => setOpen(open === `val-${v}` ? null : `val-${v}`)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.values[v] }}>{v} <span style={{ fontWeight: 400, fontSize: 11, color: C.muted }}>({score})</span></span>
                  <span style={{ fontSize: 12, color: C.muted }}>{open === `val-${v}` ? "▲" : "▼"}</span>
                </div>
                {open === `val-${v}` && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, marginBottom: 8 }}>{s.sop}</div>
                    <div style={{ fontSize: 11, color: "#C62828" }}><strong>What irks them:</strong> {s.irks}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Process SOP */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Process (Lead Attribute)</div>
        <div style={{ padding: 14, borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.attr.ext}` }}>
          <div onClick={() => setOpen(open === "proc" ? null : "proc")} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.attr.ext }}>{leadLabel} - {leadAttr.name} ({leadAttr.score})</span>
            <span style={{ fontSize: 12, color: C.muted }}>{open === "proc" ? "▲" : "▼"}</span>
          </div>
          {open === "proc" && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, marginBottom: 8 }}>{sopProcess[leadLabel].sop}</div>
              <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>"{sopProcess[leadLabel].consideration}"</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
