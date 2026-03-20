'use client';

import { motion } from 'framer-motion';
import { discFull, getDom } from '../constants/data';

const leaderFriction = {
  "D>S": "You move fast. They need time to process. Your speed feels like pressure to them. Their caution feels like resistance to you.",
  "D>C": "You want quick decisions. They want thorough analysis.",
  "D>I": "You're both fast-paced, but you focus on results while they focus on people.",
  "D>D": "You share Dominance as your dominant approach. This creates natural alignment but can also create blind spots.",
  "I>S": "You bring energy and change. They need stability and consistency.",
  "I>C": "You communicate with stories and enthusiasm. They want data and precision.",
  "I>D": "You both move fast, but you lead with connection while they lead with results.",
  "I>I": "You share Influence as your dominant approach. This creates natural alignment but can also create blind spots.",
  "S>D": "You value harmony. They value speed.",
  "S>I": "You both value people, but you prefer steady consistency while they prefer dynamic energy.",
  "S>C": "You both prefer a measured pace, but you prioritize people while they prioritize accuracy.",
  "S>S": "You share Steadiness as your dominant approach. This creates natural alignment but can also create blind spots.",
  "C>D": "You need data before deciding. They need to decide now.",
  "C>I": "You communicate with precision. They communicate with feeling.",
  "C>S": "You both appreciate a steady pace. You focus on getting it right. They focus on keeping it stable.",
  "C>C": "You share Compliance as your dominant approach. This creates natural alignment but can also create blind spots."
};

export function LeaderComparison({ leader, team }) {
  const teamWithout = team.filter(p => p.id !== leader.id && p.status !== 'pending');
  const leaderDom = getDom(leader.disc.natural);
  const leaderPrimaryStyle = leaderDom.split('/')[0];

  const teamStyleCounts = {};
  teamWithout.forEach(p => {
    const dom = getDom(p.disc.natural);
    dom.split('/').forEach(s => { teamStyleCounts[s] = (teamStyleCounts[s] || 0) + 1; });
  });
  const teamDomStyle = Object.entries(teamStyleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'S';
  const frictionKey = `${leaderPrimaryStyle}>${teamDomStyle}`;
  const frictionText = leaderFriction[frictionKey] || `You lead with ${discFull[leaderPrimaryStyle]}. Your team leans ${discFull[teamDomStyle]}.`;

  const leaderTopVals = Object.entries(leader.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const teamValCounts = {};
  teamWithout.forEach(p => { Object.entries(p.values).forEach(([k, s]) => { if (s >= 60) teamValCounts[k] = (teamValCounts[k] || 0) + 1; }); });
  const teamTopVals = Object.entries(teamValCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const sharedVals = leaderTopVals.filter(v => teamTopVals.includes(v));
  const blindSpots = teamTopVals.filter(v => !leaderTopVals.includes(v));
  const unmetNeeds = leaderTopVals.filter(v => !teamTopVals.includes(v));

  const leaderExt = leader.attr.ext;
  const leaderExtLead = leaderExt.reduce((a, b) => a.score >= b.score ? a : b).label;
  const teamExtAvgs = { Heart: 0, Hand: 0, Head: 0 };
  teamWithout.forEach(p => {
    p.attr.ext.forEach(a => { teamExtAvgs[a.label] = (teamExtAvgs[a.label] || 0) + a.score; });
  });
  const n = teamWithout.length || 1;
  const teamDecisionOrder = Object.entries(teamExtAvgs).map(([k, v]) => [k, +(v / n).toFixed(1)]).sort((a, b) => b[1] - a[1]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl px-6 py-5 border border-border border-l-3 border-l-nav-accent mb-4 shadow-sm"
    >
      {/* Header */}
      <div className="mb-4">
        <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-1.5">THE GAP</div>
        <div className="flex items-center gap-1.5">
          <span className="text-nav-accent text-sm">★</span>
          <span className="text-sm text-foreground font-semibold">{leader.name}</span>
          <span className="text-xs text-muted">· Your style vs. their needs</span>
        </div>
      </div>

      {/* Leadership Style Gap */}
      <div className="mb-5">
        <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Leadership Style Gap</div>
        <div className="flex rounded-xl overflow-hidden border border-border">
          <div className="flex-1 px-4 py-4 bg-card border-l-3" style={{ borderLeftColor: `var(--disc-${leaderPrimaryStyle.toLowerCase()})` }}>
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Your Style</div>
            <div className="text-3xl font-extrabold leading-none mb-1.5" style={{ color: `var(--disc-${leaderPrimaryStyle.toLowerCase()})` }}>{leaderDom}</div>
            <div className="text-[10px] text-muted">D:{leader.disc.natural.D} · I:{leader.disc.natural.I} · S:{leader.disc.natural.S} · C:{leader.disc.natural.C}</div>
          </div>
          <div className="w-px bg-border shrink-0" />
          <div className="flex-1 px-4 py-4 bg-card border-l-3" style={{ borderLeftColor: `var(--disc-${teamDomStyle.toLowerCase()})` }}>
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Team Tendency</div>
            <div className="text-3xl font-extrabold leading-none mb-1.5" style={{ color: `var(--disc-${teamDomStyle.toLowerCase()})` }}>{teamDomStyle}</div>
            <div className="text-[10px] text-muted">{teamWithout.length} members (excl. leader)</div>
          </div>
        </div>
        <div className="mt-2 px-4 py-3 bg-subtle rounded-lg border border-border text-xs text-foreground leading-relaxed">
          {frictionText}
        </div>
      </div>

      {/* Motivational Driver Gap */}
      <div className="mb-5">
        <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Motivational Driver Gap</div>
        <div className="flex flex-col gap-1.5">
          {sharedVals.length > 0 && (
            <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3 border-l-nav-accent">
              <div className="text-[9px] font-bold text-nav-accent uppercase tracking-wider mb-1.5">Common Ground</div>
              <div className="flex gap-1 flex-wrap">
                {sharedVals.map(v => <span key={v} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border" style={{ color: `var(--values-${v.toLowerCase()})`, borderColor: `var(--values-${v.toLowerCase()})`, backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)` }}>{v}</span>)}
              </div>
            </div>
          )}
          {blindSpots.length > 0 && (
            <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3 border-l-friction-moderate">
              <div className="text-[9px] font-bold text-friction-moderate uppercase tracking-wider mb-1.5">Your Blind Spot: Team cares about this, you may not</div>
              <div className="flex gap-1 flex-wrap">
                {blindSpots.map(v => <span key={v} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border" style={{ color: `var(--values-${v.toLowerCase()})`, borderColor: `var(--values-${v.toLowerCase()})`, backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)` }}>{v}</span>)}
              </div>
            </div>
          )}
          {unmetNeeds.length > 0 && (
            <div className="px-4 py-2.5 rounded-lg bg-card border border-border border-l-3 border-l-disc-c">
              <div className="text-[9px] font-bold text-disc-c uppercase tracking-wider mb-1.5">Unmet Need: You care about this, they may not feel it</div>
              <div className="flex gap-1 flex-wrap">
                {unmetNeeds.map(v => <span key={v} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border" style={{ color: `var(--values-${v.toLowerCase()})`, borderColor: `var(--values-${v.toLowerCase()})`, backgroundColor: `color-mix(in srgb, var(--values-${v.toLowerCase()}) 10%, transparent)` }}>{v}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision-Making Gap */}
      <div>
        <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Decision-Making Gap</div>
        <div className="flex gap-2 flex-wrap">
          <div className="shrink-0 px-4 py-2.5 rounded-lg bg-card border border-border border-l-3 border-l-attr-ext">
            <div className="text-[9px] text-muted font-bold uppercase tracking-wider mb-1">You Lead With</div>
            <div className="text-lg font-extrabold text-attr-ext">{leaderExtLead}</div>
          </div>
          <div className="flex-1 px-4 py-2.5 rounded-lg bg-subtle border border-border">
            <div className="text-[9px] text-muted font-bold uppercase tracking-wider mb-1.5">Team Decision Order</div>
            <div className="flex gap-2 flex-wrap">
              {teamDecisionOrder.map(([label, avg], i) => (
                <div key={label} className="flex items-center gap-1">
                  <span className={`text-xs ${i === 0 ? 'font-extrabold text-foreground' : 'font-medium text-muted'}`}>{i + 1}. {label}</span>
                  <span className="text-[10px] text-muted">({avg})</span>
                  {i < 2 && <span className="text-border text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
