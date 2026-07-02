'use client';

/**
 * MethodView — the full method, running live on the selected team.
 *
 * This view shows both sides at once, read from the real data.
 *  - The strength side: what the team is built to do well, and each person's talents to Own.
 *  - The clash side: the same-pole flags (possible competition and whose-standard), all signals.
 *  - The hole: the team coverage-gap, External only.
 *
 * Every read here comes from the engine modules, which read the instrument's own grades,
 * never a flat cutoff. Signals are labeled signals, never verdicts.
 */

import { useMemo, useState } from "react";
import { calculateSamePole } from "../utils/samepole";
import { teamCoverageGap } from "../utils/coverage-gap";
import { personStrengths } from "../utils/strengths";

function Chip({ children, tone = "muted" }) {
  const tones = {
    high: "bg-disc-c/10 text-disc-c",
    warn: "bg-alert-critical-bg text-friction-high",
    muted: "bg-subtle text-muted",
  };
  return <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${tones[tone]}`}>{children}</span>;
}

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4">
      <div className="text-sm font-extrabold text-foreground">{title}</div>
      {subtitle && <div className="text-xs text-muted mt-0.5 mb-3">{subtitle}</div>}
      {children}
    </div>
  );
}

export function MethodView({ people = [] }) {
  const graded = useMemo(() => people.filter(p => p.disc || (p.attr78 && p.attr78.length) || p.attr), [people]);
  const [selId, setSelId] = useState(null);

  // Team strengths: External capacities most of the team holds as a talent (score 8+).
  const teamStrengths = useMemo(() => {
    const tally = new Map();
    for (const p of graded) {
      for (const a of (p.attr78 || [])) {
        if (!["Empathy", "Practical Thinking", "Systems Judgment"].includes(a.coreDimension)) continue;
        const t = tally.get(a.attribute) || { attribute: a.attribute, talent: 0, total: 0 };
        t.total += 1;
        if (a.rawScore >= 8.0) t.talent += 1;
        tally.set(a.attribute, t);
      }
    }
    const ranked = [...tally.values()]
      .map(t => ({ ...t, pct: t.total ? Math.round(100 * t.talent / t.total) : 0 }))
      .filter(t => t.talent > 0)
      .sort((a, b) => b.pct - a.pct || a.attribute.localeCompare(b.attribute));
    // Show the top group without cutting a tie. Take everything at or above the
    // sixth-place share, so co-leaders never get dropped arbitrarily.
    if (ranked.length <= 6) return ranked;
    const cutoff = ranked[5].pct;
    return ranked.filter(t => t.pct >= cutoff);
  }, [graded]);

  const coverage = useMemo(() => teamCoverageGap(graded), [graded]);

  // Same-pole flags across every pair, gathered into one list.
  const samePole = useMemo(() => {
    const comp = new Map();
    const whose = new Map();
    for (let i = 0; i < graded.length; i++) {
      for (let j = i + 1; j < graded.length; j++) {
        const r = calculateSamePole(graded[i], graded[j]);
        for (const c of r.competition) {
          const k = `${c.instrument}:${c.dim}`;
          const e = comp.get(k) || { label: `${c.dim}`, instrument: c.instrument, pairs: 0 };
          e.pairs += 1; comp.set(k, e);
        }
        for (const w of r.whoseStandard) {
          const k = `${w.instrument}:${w.dim}`;
          const e = whose.get(k) || { label: `${w.dim}`, about: w.about, pairs: 0 };
          e.pairs += 1; whose.set(k, e);
        }
      }
    }
    return {
      competition: [...comp.values()].sort((a, b) => b.pairs - a.pairs),
      whoseStandard: [...whose.values()].sort((a, b) => b.pairs - a.pairs),
    };
  }, [graded]);

  const selected = graded.find(p => p.id === selId) || null;
  const selStrength = useMemo(() => selected ? personStrengths(selected) : null, [selected]);

  if (graded.length === 0) {
    return <div className="text-sm text-muted">No graded people are loaded for this team yet.</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <div className="text-lg font-extrabold text-foreground">The Method, Running Live</div>
        <div className="text-xs text-muted mt-1">
          Both sides of one team, read from each person's own assessment grades. {graded.length} people.
        </div>
      </div>

      <Card title="What this team is built to do well" subtitle="Real strengths that show up across the group. Share of the team holding each as a true talent.">
        {teamStrengths.length === 0 ? (
          <div className="text-sm text-muted">The full 78 are not loaded for this team, so the strength roll-up is not available.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {teamStrengths.map(t => (
              <div key={t.attribute} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{t.attribute}</span>
                <Chip tone="high">{t.pct}% of the team</Chip>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="The hole no one covers" subtitle="A capacity the team runs thin on. Outward-facing only, since you cannot hire or hand off a person's self-regard.">
        {!coverage.ran ? (
          <div className="text-sm text-muted">The full 78 are not loaded, so the team gap read cannot run.</div>
        ) : coverage.gaps.length === 0 ? (
          <div className="text-sm text-foreground">No outward capacity falls below the line. The team covers its needs.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {coverage.gaps.map(g => (
              <div key={g.capacity} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground">{g.capacity}</span>
                  <span className="text-xs text-muted ml-2">only {g.sharePresent}% carry it</span>
                </div>
                <Chip tone="warn">build a system, hand off, or hire</Chip>
              </div>
            ))}
            <div className="text-[11px] text-muted mt-1">A signal to confirm against what the role actually needs, not a verdict.</div>
          </div>
        )}
      </Card>

      <Card title="Tensions worth a look" subtitle="Where two strong people both sit at the top of the same thing. Both right, in their own way. All signals to check, never facts.">
        {samePole.competition.length === 0 && samePole.whoseStandard.length === 0 ? (
          <div className="text-sm text-foreground">No same-pole tensions surfaced on this team.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {samePole.competition.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-foreground mb-1">Who owns the one call</div>
                {samePole.competition.map(c => (
                  <div key={c.label} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{c.label}</span>
                    <Chip>{c.pairs} pair{c.pairs > 1 ? "s" : ""} to look into</Chip>
                  </div>
                ))}
              </div>
            )}
            {samePole.whoseStandard.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-foreground mb-1">Whose way wins</div>
                {samePole.whoseStandard.map(w => (
                  <div key={w.label} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{w.label} <span className="text-xs text-muted">({w.about})</span></span>
                    <Chip>{w.pairs} pair{w.pairs > 1 ? "s" : ""} to look into</Chip>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card title="One person, up close" subtitle="Pick a person to see what they should own and what to cover.">
        <select
          value={selId || ""}
          onChange={(e) => setSelId(e.target.value || null)}
          className="w-full mb-3 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
        >
          <option value="">Pick a person</option>
          {graded.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {selStrength && (
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-semibold text-foreground mb-1">Talents to own ({selStrength.own.length})</div>
              {selStrength.own.length === 0 ? (
                <div className="text-sm text-muted">No high-clarity outward talents on record.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selStrength.own.slice(0, 12).map(o => (
                    <Chip key={o.attribute} tone="high">{o.attribute}</Chip>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground mb-1">Gaps to cover ({selStrength.gaps.length})</div>
              {selStrength.gaps.length === 0 ? (
                <div className="text-sm text-foreground">No outward gaps. Strong all around.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selStrength.gaps.map(g => <Chip key={g.attribute} tone="warn">{g.attribute}</Chip>)}
                </div>
              )}
            </div>
            <div className="text-[11px] text-muted">
              Read from {selStrength.readFrom === "78" ? "the full 78" : selStrength.readFrom === "rollups" ? "the six core rollups" : "no attribute data"}. Inward-facing traits stay out of the moves, by design. All a signal until the role is confirmed.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
