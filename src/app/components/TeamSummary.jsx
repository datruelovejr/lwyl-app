'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { discFull, getDom } from '../constants/data';
import { PhotoAvatar } from './PhotoAvatar';
import { getDiscNarrative, getExtAttrNarrative, getValuesNarrative } from '../knowledge/narrativeEngine';
import { ActionLink } from './ui/ActionLink';

export function TeamSummary({ people, teamId, orgId, leader, onClose, photos = {}, onUploadPhoto, onViewProfile, onCompare, onShowTips }) {
  const members = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== 'pending');

  const generateInsight = (p) => {
    const firstName = p.name.split(' ')[0];
    const parts = [];
    const discScores = Object.entries(p.disc.natural)
      .filter(([k]) => ['D', 'I', 'S', 'C'].includes(k))
      .sort(([, a], [, b]) => b - a);
    const [topDim, topScore] = discScores[0] || [];
    const [secDim, secScore] = discScores[1] || [];
    const topNarr = topDim && getDiscNarrative(topDim, topScore);
    if (topNarr?.short) parts.push(`${firstName} naturally ${topNarr.short}`);
    const secNarr = secDim && secScore >= 60 && getDiscNarrative(secDim, secScore);
    if (secNarr?.short) parts.push(`and ${secNarr.short}`);
    const topVals = Object.entries(p.values).filter(([, s]) => s >= 60).sort(([, a], [, b]) => b - a);
    if (topVals.length > 0) {
      const [valName, valScore] = topVals[0];
      const valNarr = getValuesNarrative(valName, valScore);
      if (valNarr?.narrative) parts.push(`-- driven by ${valName} (${valNarr.narrative.split('.')[0].toLowerCase()})`);
    }
    const extLead = [...p.attr.ext].sort((a, b) => b.score - a.score)[0];
    if (extLead) {
      const attrNarr = getExtAttrNarrative(extLead.label, extLead.score, extLead.bias);
      if (attrNarr?.biasExplanation) parts.push(`. ${attrNarr.biasExplanation}`);
    }
    return parts.join(' ') || `${firstName}'s assessment data is available -- view their full profile for detailed insights.`;
  };

  const summaryCard = (p, i) => {
    const dom = getDom(p.disc.natural);
    const domStyles = dom.split('/').map(d => discFull[d]);
    const topVals = Object.entries(p.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const extSorted = [...p.attr.ext].sort((a, b) => b.score - a.score);

    return (
      <motion.div
        key={p.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: i * 0.06 }}
        className="bg-card rounded-xl border border-border overflow-hidden shadow-sm mb-4"
        style={{ pageBreakInside: 'avoid' }}
      >
        {/* Card header */}
        <div className="bg-nav px-5 py-3.5 flex items-center gap-3">
          <PhotoAvatar personId={p.id} name={p.name} bgColor="rgba(255,255,255,0.2)" photo={photos[p.id]} onUpload={onUploadPhoto} size={40} square={false} />
          <div>
            <div className="font-bold text-base text-white">{p.name}</div>
            <div className="text-xs text-white/60 mt-0.5">Love Where You Lead -- Member Summary</div>
          </div>
        </div>

        {/* Three-column content */}
        <div className="grid grid-cols-[1fr_1fr_1.2fr]">
          {/* LEFT: Leadership Style + DISC + Top Drivers */}
          <div className="px-5 py-4 border-r border-border">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">LEADERSHIP STYLE</div>
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {domStyles.map(style => (
                <span key={style} className="px-2.5 py-1 rounded text-xs font-bold bg-disc-i text-foreground">{style}</span>
              ))}
            </div>
            <div className="text-[10px] text-muted mb-1.5">Natural DISC scores</div>
            <div className="text-xs text-foreground mb-3.5">
              {['D', 'I', 'S', 'C'].map(d => (
                <span key={d} className="mr-2">
                  <span className={`font-semibold text-disc-${d.toLowerCase()}`}>{d}:</span>{p.disc.natural[d]}
                </span>
              ))}
            </div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">TOP DRIVERS</div>
            <div className="flex flex-col gap-1">
              {topVals.length > 0 ? topVals.slice(0, 4).map(v => (
                <div key={v} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: `var(--values-${v.toLowerCase()})` }} />
                  <span className="text-xs text-foreground">{v}</span>
                </div>
              )) : <div className="text-xs text-muted">No strong drivers</div>}
            </div>
          </div>

          {/* MIDDLE: Decision Style */}
          <div className="px-5 py-4 border-r border-border">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2.5">DECISION STYLE</div>
            <div className="flex flex-col gap-2">
              {extSorted.map(a => {
                const biasClass = a.bias === '+' ? 'border-l-friction-low bg-alert-success-bg' : a.bias === '\u2212' ? 'border-l-friction-moderate bg-alert-warning-bg' : 'border-l-border bg-subtle';
                const biasTextClass = a.bias === '+' ? 'text-friction-low' : a.bias === '\u2212' ? 'text-friction-moderate' : 'text-muted';
                const biasText = a.bias === '+' ? 'Requires' : a.bias === '\u2212' ? 'Undervalues' : 'Balanced';
                return (
                  <div key={a.name} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border-l-3 ${biasClass}`}>
                    <span className="text-xs font-bold text-foreground min-w-[40px]">{a.label}</span>
                    <span className={`text-sm font-extrabold ${biasTextClass}`}>{a.score}</span>
                    <span className={`text-[10px] font-semibold ${biasTextClass}`}>{biasText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: What Your Leader Learned */}
          <div className="px-5 py-4 bg-subtle">
            <div className="text-[10px] font-bold text-nav-accent uppercase tracking-wider mb-2">WHAT YOUR LEADER LEARNED</div>
            <p className="text-xs text-foreground leading-relaxed mb-4">
              {leader ? generateInsight(p) : 'Designate a leader to see personalized insights'}
            </p>
            <div className="text-[10px] font-bold text-nav-accent uppercase tracking-wider mb-2">GO DEEPER</div>
            <div className="flex flex-col gap-1.5">
              <ActionLink onClick={() => { onClose(); onViewProfile?.(p.id); }}>View full profile</ActionLink>
              <ActionLink onClick={() => { onClose(); onCompare?.(p.id); }}>Compare with others</ActionLink>
              <ActionLink onClick={() => { onClose(); onShowTips?.(p.id); }} variant="subtle">See leadership tips</ActionLink>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 flex items-start justify-center z-300 overflow-y-auto p-6"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 300 }}
    >
      <div className="modal-body bg-card rounded-xl w-full max-w-[1000px] shadow-2xl">
        <div className="bg-nav text-white rounded-t-xl px-12 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-3xl text-white">Team Summary</h2>
            <div className="text-sm text-white/65 mt-0.5">{members.length} members -- Love Where You Lead</div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => window.print()} className="px-5 py-2.5 rounded-lg border border-white/30 bg-white/10 text-white text-sm font-semibold cursor-pointer hover:bg-white/20 transition-colors">Print All</button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 border-none cursor-pointer text-white/70 hover:bg-white/20 transition-colors flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="px-12 py-8">
          {members.length === 0 ? (
            <div className="text-center py-10 text-muted">No complete assessments to summarize.</div>
          ) : (
            <div className="flex flex-col">
              {members.map((p, i) => summaryCard(p, i))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
