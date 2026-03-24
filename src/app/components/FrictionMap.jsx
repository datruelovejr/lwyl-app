'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { List, Network } from 'lucide-react';
import { discFull, getDom } from '../constants/data';
import { calculateFriction } from '../utils/friction';
import { getEnvironmentTaxSummary } from '../knowledge/assessmentInsights';
import { useIsMobile } from '../utils/useIsMobile';
import { Btn } from './Btn';
import { SectionHeader } from './ui/SectionHeader';
import { StatBlock } from './ui/StatBlock';
import { InsightCard } from './ui/InsightCard';
import { PersonChip } from './ui/PersonChip';
import { GapBar } from './ui/GapBar';
import { AlertCard } from './ui/AlertCard';
import { ActionLink } from './ui/ActionLink';
import { Expandable } from './ui/Expandable';
import { Card } from './ui/Card';
import { FrictionNetwork } from './FrictionNetwork';

const discLabel = { D: 'Dominance', I: 'Influence', S: 'Steadiness', C: 'Compliance' };
const processLabel = { Heart: 'Empathy', Hand: 'Practical Thinking', Head: 'Systems Judgment' };

function getPairStory(personA, personB, friction) {
  const a = personA.name.split(' ')[0];
  const b = personB.name.split(' ')[0];
  const stories = [];

  friction.preference.details.filter(g => g.tier !== 'low').sort((x, y) => y.gap - x.gap).forEach(g => {
    const higher = g.aScore > g.bScore ? a : b;
    const lower = g.aScore > g.bScore ? b : a;
    const hiScore = Math.max(g.aScore, g.bScore);
    const loScore = Math.min(g.aScore, g.bScore);
    const hiLevel = hiScore >= 70 ? 'high' : 'moderate';
    const loLevel = loScore <= 39 ? 'low' : 'moderate';

    if (g.dim === 'D') {
      stories.push({ area: 'Preference', dim: g.dim, severity: g.tier, gap: g.gap,
        story: hiLevel === 'high' && loLevel === 'low'
          ? `${higher} moves fast and makes decisions on the spot. ${lower} prefers to build consensus and include everyone before committing. ${higher} reads ${lower}'s caution as stalling. ${lower} reads ${higher}'s speed as reckless.`
          : `There's a ${g.gap}-point gap on Dominance between ${a} and ${b}. ${higher} naturally pushes harder for results. ${lower} takes a more measured approach.`,
        fix: hiLevel === 'high' && loLevel === 'low'
          ? `Build a decision checkpoint. Before any shared decision, agree upfront: is this a "move now" or "think first" situation? Give ${higher} the fast-lane decisions and ${lower} the ones that need deliberation.`
          : `Name it out loud. "${higher}, you're going to want to move fast on this. ${lower}, you're going to want more time. Let's decide together how much runway this decision actually needs."`
      });
    }
    if (g.dim === 'I') {
      stories.push({ area: 'Preference', dim: g.dim, severity: g.tier, gap: g.gap,
        story: hiLevel === 'high' && loLevel === 'low'
          ? `${higher} leads with energy, conversation, and connection. ${lower} leads with substance, follow-through, and results. ${higher} thinks ${lower} is cold. ${lower} thinks ${higher} is all talk. Neither is true.`
          : `${higher} brings more social energy. ${lower} brings more task focus. The gap is ${g.gap} points.`,
        fix: hiLevel === 'high' && loLevel === 'low'
          ? `${higher}: give ${lower} written context before meetings. ${lower}: give ${higher} face time. A five-minute conversation does more than a detailed email.`
          : `Set the rhythm. ${higher} handles the relational side. ${lower} handles the follow-through. Both show up visibly.`
      });
    }
    if (g.dim === 'S') {
      stories.push({ area: 'Preference', dim: g.dim, severity: g.tier, gap: g.gap,
        story: hiLevel === 'high' && loLevel === 'low'
          ? `${higher} needs stability, advance notice, and time to adjust. ${lower} thrives on change, variety, and moving fast. When change happens without warning, ${higher} feels blindsided.`
          : `There's a ${g.gap}-point gap on Steadiness. ${higher} is more anchored by routine. ${lower} is more comfortable with disruption.`,
        fix: hiLevel === 'high' && loLevel === 'low'
          ? `${lower}: give ${higher} at least 24 hours before a shift. Not a debate. Just a heads up. ${higher}: tell ${lower} what you need to get comfortable. Specifics beat silence.`
          : `Frame change as evolution, not disruption. ${higher} needs the thread connecting old to new. ${lower} needs to not treat patience as resistance.`
      });
    }
    if (g.dim === 'C') {
      stories.push({ area: 'Preference', dim: g.dim, severity: g.tier, gap: g.gap,
        story: hiLevel === 'high' && loLevel === 'low'
          ? `${higher} trusts data, process, and precision. ${lower} trusts instincts and moves without waiting for proof. The friction is about whether the process was followed.`
          : `${higher} wants more rigor. ${lower} wants more speed. The gap is ${g.gap} points on Compliance.`,
        fix: hiLevel === 'high' && loLevel === 'low'
          ? `Agree on "minimum viable analysis." What's the least amount of data both people need before moving? Set that bar once. Reference it every time.`
          : `Define "done" together before starting. "What does good enough look like?" eliminates the argument.`
      });
    }
  });

  // Values gap
  const aTopVals = Object.entries(personA.values).filter(([, s]) => s >= 60).sort((x, y) => y[1] - x[1]).map(([k]) => k);
  const bTopVals = Object.entries(personB.values).filter(([, s]) => s >= 60).sort((x, y) => y[1] - x[1]).map(([k]) => k);
  const aOnly = aTopVals.filter(v => !bTopVals.includes(v));
  const bOnly = bTopVals.filter(v => !aTopVals.includes(v));

  if (aOnly.length > 0 || bOnly.length > 0) {
    const parts = [];
    if (aOnly.length > 0) parts.push(`${a} is fueled by ${aOnly.join(' and ')}. That's not what drives ${b}.`);
    if (bOnly.length > 0) parts.push(`${b} is fueled by ${bOnly.join(' and ')}. That's not what drives ${a}.`);
    stories.push({
      area: 'Passion', dim: 'Values', severity: 'moderate', gap: null,
      story: `${parts.join(' ')} Neither person is wrong. They just get energy from different places.`,
      fix: `Stop interpreting the other person's priorities as wrong. Name it: "I know ${aOnly[0] || bOnly[0]} matters to you. It's not my top driver, but I see why it matters here."`
    });
  }

  // Process conflicts
  friction.processResults.filter(r => r.resultType === 'conflict').forEach(r => {
    stories.push({
      area: 'Process', dim: r.label, severity: 'high', gap: null,
      story: `${a} and ${b} have opposite biases on ${processLabel[r.label] || r.label}. One requires it. The other dismisses it. Every time they make a decision together, this gap costs them.`,
      fix: `Give ${r.label} a seat at the table. Build a 60-second check into shared decisions: "Have we addressed the ${r.label.toLowerCase()} angle?"`
    });
  });

  return stories;
}

function getConnectionAgreementPrompts(personA, personB, friction) {
  const a = personA.name.split(' ')[0];
  const b = personB.name.split(' ')[0];
  const prompts = [];
  const topGap = friction.preference.details.filter(g => g.tier !== 'low').sort((x, y) => y.gap - x.gap)[0];
  if (topGap) prompts.push(`How do ${a} and ${b} want to handle ${discLabel[topGap.dim].toLowerCase()} differences?`);
  if (friction.passion.tier !== 'low') prompts.push(`What does ${a} need to feel motivated that ${b} might not naturally provide? And the reverse?`);
  if (friction.process.details.some(r => r.result === 'conflict')) prompts.push(`When ${a} and ${b} make decisions together, whose process instinct leads?`);
  prompts.push(`What's the one thing ${a} needs ${b} to stop assuming about them? And the reverse?`);
  return prompts;
}

// Pair Detail View
function PairDetail({ personA, personB, friction, onBack }) {
  const a = personA.name.split(' ')[0];
  const b = personB.name.split(' ')[0];
  const aDom = getDom(personA.disc.natural);
  const bDom = getDom(personB.disc.natural);
  const stories = getPairStory(personA, personB, friction);
  const prompts = getConnectionAgreementPrompts(personA, personB, friction);

  const taxA = getEnvironmentTaxSummary(personA);
  const taxB = getEnvironmentTaxSummary(personB);
  const eitherStressed = taxA.totalGap >= 80 || taxB.totalGap >= 80;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1">
            <PersonChip name={personA.name} disc={aDom} size="sm" />
            <PersonChip name={personB.name} disc={bDom} size="sm" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{a} & {b}</h1>
            <p className="text-xs text-muted mt-0.5">What creates friction between them and what to do about it.</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            (friction.tier === 'significant' || friction.tier === 'high') ? 'bg-friction-high/10 text-friction-high' :
            friction.tier === 'moderate' ? 'bg-friction-moderate/10 text-friction-moderate' :
            'bg-friction-low/10 text-friction-low'
          }`}>
            {friction.tier === 'significant' ? 'Significant Friction' : friction.tier === 'high' ? 'High Friction' : friction.tier === 'moderate' ? 'Moderate' : 'Low Friction'}
          </span>
          {onBack && <ActionLink onClick={onBack}>Back</ActionLink>}
        </div>
      </div>

      {/* Score summary - using gap points and tiers from validated methodology */}
      <div className="flex gap-3 flex-wrap mb-6">
        <StatBlock value={friction.preference.gap} label="Preference" sublabel="DISC gaps" accentColor={friction.preference.tier === 'significant' || friction.preference.tier === 'high' ? 'friction-high' : friction.preference.tier === 'moderate' ? 'friction-moderate' : 'friction-low'} />
        <StatBlock value={friction.passion.gap} label="Passion" sublabel="Values gaps" accentColor={friction.passion.tier === 'significant' || friction.passion.tier === 'high' ? 'friction-high' : friction.passion.tier === 'moderate' ? 'friction-moderate' : 'friction-low'} />
        <StatBlock value={friction.process.tier.charAt(0).toUpperCase() + friction.process.tier.slice(1)} label="Process" sublabel="How they decide" accentColor={friction.process.tier === 'high' ? 'friction-high' : friction.process.tier === 'moderate' ? 'friction-moderate' : 'friction-low'} />
      </div>

      {/* Environment stress */}
      {eitherStressed && (
        <AlertCard severity="warning" title="Environment context matters here">
          {taxA.totalGap >= 80 && <span>{a} is carrying {taxA.totalGap} gap points of environment tax. </span>}
          {taxB.totalGap >= 80 && <span>{b} is carrying {taxB.totalGap} gap points of environment tax. </span>}
          Some of this friction might be environment-amplified. Two stressed people collide harder.
        </AlertCard>
      )}

      {/* Stories */}
      {stories.length > 0 ? (
        <div className="mb-4">
          <SectionHeader title="Where the friction lives" subtitle={`${stories.length} friction point${stories.length !== 1 ? 's' : ''} between ${a} and ${b}`} />
          {stories.map((s, i) => (
            <InsightCard key={i} variant={s.severity === 'high' ? 'priority' : 'standard'} enterDelay={i * 80}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-muted uppercase tracking-wide">{s.area}</span>
                {s.dim && s.dim !== 'Values' && <span className="text-xs font-bold text-muted uppercase tracking-wide">: {discLabel[s.dim] || s.dim}</span>}
                {s.gap && (
                  <div className="ml-auto w-32">
                    <GapBar value={s.gap} dimension={s.dim !== 'Values' ? s.dim : undefined} showNumber={true} maxValue={80} />
                  </div>
                )}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-1">{s.story}</p>
              <InsightCard.Callout>
                <div className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-1">What to do about it</div>
                {s.fix}
              </InsightCard.Callout>
            </InsightCard>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-5 text-muted">
            <div className="text-sm font-semibold">Low friction pair</div>
            <div className="text-xs mt-1">{a} and {b} are naturally well-aligned.</div>
          </div>
        </Card>
      )}

      {/* Connection Agreement prompts */}
      <div className="bg-nav rounded-2xl p-5 mb-4">
        <div className="text-sm font-bold text-white mb-1">Connection Agreement starters</div>
        <div className="text-xs text-white/60 mb-4">Use these to start a conversation between {a} and {b}.</div>
        <div className="bg-card rounded-xl p-4 space-y-3">
          {prompts.map((p, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-subtle text-muted text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
              <div className="text-xs text-foreground leading-relaxed">{p}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw scores expandable */}
      <Expandable label="Show raw scores" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {friction.discGaps.map(g => (
            <div key={g.dim} className="p-2.5 rounded-lg bg-subtle border border-border text-[11px]">
              <span className={`font-bold text-disc-${g.dim.toLowerCase()}`}>{discLabel[g.dim]}</span>
              <span className="text-muted ml-2">{a}: {g.aScore} / {b}: {g.bScore} / Gap: {g.gap}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {friction.passion.details.filter(g => g.tier !== 'low').map(g => (
            <div key={g.dim} className="p-2.5 rounded-lg bg-subtle border border-border text-[11px]">
              <span className="font-bold" style={{ color: `var(--values-${g.dim.toLowerCase()})` }}>{g.dim}</span>
              <span className="text-muted ml-2">{a}: {g.aScore} / {b}: {g.bScore} / Gap: {g.gap}</span>
            </div>
          ))}
        </div>
      </Expandable>
    </div>
  );
}

// Main Friction Map
export function FrictionMap({ people, teamId, orgId, onClose, isPage }) {
  const isMobile = useIsMobile();
  const [selectedPair, setSelectedPair] = useState(null);
  const [viewMode, setViewMode] = useState(isMobile ? 'list' : 'network');
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(700);

  const members = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== 'pending' && p.disc);

  // Measure container width for network
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(Math.min(entry.contentRect.width, 900));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (members.length < 2) {
    const content = (
      <div className="text-center py-16 text-muted">
        <p className="text-sm font-semibold">Need at least 2 team members</p>
        <p className="text-xs mt-1">Once your team completes their assessments, you will see your team's relationship network here -- the connections, the friction points, and exactly where the bridges need to be built.</p>
        {onClose && <div className="mt-4"><Btn onClick={onClose}>Close</Btn></div>}
      </div>
    );
    if (isPage) return content;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 flex items-center justify-center z-300" style={{ background: 'rgba(0,0,0,0.55)', zIndex: 300 }}>
        <div className="modal-body bg-card rounded-xl p-12 max-w-[400px] shadow-2xl">{content}</div>
      </motion.div>
    );
  }

  // Calculate all pairs -- memoized to prevent O(n^2) recalc on every render
  const memberIds = members.map(m => m.id).join(',');
  const pairs = useMemo(() => {
    const result = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        result.push({ personA: members[i], personB: members[j], friction: calculateFriction(members[i], members[j]) });
      }
    }
    result.sort((a, b) => b.friction.preference.gap - a.friction.preference.gap);
    return result;
  }, [memberIds]);

  const highPairs = pairs.filter(p => p.friction.tier === 'significant' || p.friction.tier === 'high');
  const modPairs = pairs.filter(p => p.friction.tier === 'moderate');
  const lowPairs = pairs.filter(p => p.friction.tier === 'low');

  // Build graph data for FrictionNetwork -- memoized with pairs
  const graphNodes = useMemo(() => members.map(m => {
    const tax = getEnvironmentTaxSummary(m);
    return { id: m.id, name: m.name, disc: getDom(m.disc.natural), gapLoad: tax.totalGap };
  }), [memberIds]);
  const graphLinks = useMemo(() => pairs.map(p => ({
    source: p.personA.id, target: p.personB.id,
    frictionScore: p.friction.preference.gap, tier: p.friction.tier,
  })), [pairs]);

  // Detail view
  if (selectedPair) {
    const inner = (
      <PairDetail personA={selectedPair.personA} personB={selectedPair.personB} friction={selectedPair.friction} onBack={() => setSelectedPair(null)} />
    );
    if (isPage) return <div className="px-8 py-6 max-w-[800px] mx-auto">{inner}</div>;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 flex items-start justify-center z-300 overflow-y-auto p-6" style={{ background: 'rgba(0,0,0,0.55)', zIndex: 300 }}>
        <div className="modal-body bg-card rounded-xl w-full max-w-[780px] px-8 py-6 shadow-2xl">{inner}</div>
      </motion.div>
    );
  }

  // Main view
  const mainContent = (
    <div className="max-w-3xl mx-auto" ref={containerRef}>
      <div className="flex items-center justify-between mb-2">
        <SectionHeader title="Friction Map" subtitle={`${members.length} members / ${pairs.length} relationships`} />
        <div className="flex gap-2 items-center">
          {!isMobile && (
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setViewMode('network')} className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors ${viewMode === 'network' ? 'bg-nav text-white' : 'bg-card text-muted hover:bg-subtle'}`}>
                <Network size={12} /> Network
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors ${viewMode === 'list' ? 'bg-nav text-white' : 'bg-card text-muted hover:bg-subtle'}`}>
                <List size={12} /> List
              </button>
            </div>
          )}
          {onClose && <Btn onClick={onClose} small style={{ fontSize: 11 }}>Close</Btn>}
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-3 flex-wrap mb-6">
        <StatBlock value={highPairs.length} label="Need Attention" sublabel="high friction relationships" accentColor="friction-high" enterDelay={0} />
        <StatBlock value={modPairs.length} label="Worth Watching" sublabel="moderate friction present" accentColor="friction-moderate" enterDelay={100} />
        <StatBlock value={lowPairs.length} label="Naturally Aligned" sublabel="low friction relationships" accentColor="friction-low" enterDelay={200} />
      </div>

      {/* Network View */}
      {viewMode === 'network' && !isMobile && (
        <div className="mb-8">
          <FrictionNetwork
            nodes={graphNodes}
            links={graphLinks}
            width={containerWidth}
            height={Math.max(500, Math.min(containerWidth * 0.7, 600))}
            onNodeClick={(node) => {
              const nodePairs = pairs.filter(p => p.personA.id === node.id || p.personB.id === node.id);
              if (nodePairs.length > 0) setSelectedPair(nodePairs[0]);
            }}
            onLinkClick={(link) => {
              const srcId = typeof link.source === 'object' ? link.source.id : link.source;
              const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
              const pair = pairs.find(p =>
                (p.personA.id === srcId && p.personB.id === tgtId) ||
                (p.personA.id === tgtId && p.personB.id === srcId)
              );
              if (pair) setSelectedPair(pair);
            }}
          />
        </div>
      )}

      {/* List View */}
      {(viewMode === 'list' || isMobile) && (
        <>
          {/* High friction */}
          {highPairs.length > 0 && (
            <div className="mb-6">
              <SectionHeader title="Pairs that need attention" subtitle="These relationships have enough friction to cause real problems if left unaddressed." />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
                className="text-xs text-foreground/70 leading-relaxed mb-4"
              >
                Start with the pair at the top. That is where the most energy is being lost.
              </motion.p>
              {highPairs.map((pair, i) => {
                const a = pair.personA.name.split(' ')[0];
                const b = pair.personB.name.split(' ')[0];
                const aDom = getDom(pair.personA.disc.natural);
                const bDom = getDom(pair.personB.disc.natural);
                const topStory = getPairStory(pair.personA, pair.personB, pair.friction)[0];
                return (
                  <InsightCard key={i} variant="priority" enterDelay={i * 80}>
                    <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setSelectedPair(pair)}>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          <PersonChip name={pair.personA.name} disc={aDom} size="sm" />
                          <PersonChip name={pair.personB.name} disc={bDom} size="sm" />
                        </div>
                        <span className="text-sm font-bold text-foreground">{a} & {b}</span>
                      </div>
                      <span className="text-xs font-semibold text-friction-high">High Friction</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                      {topStory ? topStory.story : `Preference gap of ${pair.friction.preference.gap} points. Multiple dimensions creating tension.`}
                    </p>
                    <InsightCard.Actions>
                      <ActionLink onClick={() => setSelectedPair(pair)}>See full analysis</ActionLink>
                    </InsightCard.Actions>
                  </InsightCard>
                );
              })}

              {/* Post-list CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
                className="mt-4 pt-4 border-t border-border"
              >
                <p className="text-xs text-foreground/70 leading-relaxed mb-2">
                  Ready to act? Pick your highest pair and start a Connection Agreement in the Bridge Wizard.
                </p>
                <ActionLink href="/app/bridge">Open Bridge Wizard</ActionLink>
              </motion.div>
            </div>
          )}

          {/* Moderate friction */}
          {modPairs.length > 0 && (
            <div className="mb-6">
              <SectionHeader title="Worth watching" subtitle="Not urgent, but these gaps can grow if ignored." />
              {modPairs.map((pair, i) => {
                const a = pair.personA.name.split(' ')[0];
                const b = pair.personB.name.split(' ')[0];
                const aDom = getDom(pair.personA.disc.natural);
                const bDom = getDom(pair.personB.disc.natural);
                return (
                  <InsightCard key={i} variant="standard" enterDelay={i * 60}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setSelectedPair(pair)}>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          <PersonChip name={pair.personA.name} disc={aDom} size="sm" />
                          <PersonChip name={pair.personB.name} disc={bDom} size="sm" />
                        </div>
                        <span className="text-sm font-bold text-foreground">{a} & {b}</span>
                      </div>
                      <ActionLink onClick={() => setSelectedPair(pair)}>View</ActionLink>
                    </div>
                  </InsightCard>
                );
              })}
            </div>
          )}

          {/* Low friction */}
          {lowPairs.length > 0 && (
            <Expandable label={`${lowPairs.length} low-friction pairs`} defaultOpen={false}>
              {lowPairs.map((pair, i) => {
                const a = pair.personA.name.split(' ')[0];
                const b = pair.personB.name.split(' ')[0];
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md bg-subtle mb-1 cursor-pointer text-xs hover:bg-card transition-colors" onClick={() => setSelectedPair(pair)}>
                    <span className="font-semibold text-foreground">{a} & {b}</span>
                    <span className="font-semibold text-friction-low">Aligned</span>
                  </div>
                );
              })}
            </Expandable>
          )}
        </>
      )}
    </div>
  );

  if (isPage) return <div className="px-8 py-6">{mainContent}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 flex items-start justify-center z-300 overflow-y-auto p-6" style={{ background: 'rgba(0,0,0,0.55)', zIndex: 300 }}>
      <div className="modal-body bg-card rounded-xl w-full max-w-[860px] px-8 py-6 shadow-2xl">{mainContent}</div>
    </motion.div>
  );
}
