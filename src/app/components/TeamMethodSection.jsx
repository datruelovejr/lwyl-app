'use client';

/**
 * TeamMethodSection — the three team-level method reads (strengths, the coverage-gap
 * hole, same-pole tensions), as a drop-in section any team screen can render with
 * one line: <TeamMethodSection people={team} />.
 *
 * Same reads and same copy as MethodView, so the four sources show up consistently
 * across the app. Signals are labeled signals, never verdicts.
 */

import { useMemo } from "react";
import { teamMethod } from "../utils/team-method";

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

export function TeamMethodSection({ people = [], heading = true }) {
  const { graded, teamStrengths, coverage, samePole } = useMemo(() => teamMethod(people), [people]);

  if (graded.length === 0) return null;

  return (
    <div>
      {heading && (
        <div className="mb-3">
          <div className="text-sm font-extrabold text-foreground">The Method, this team</div>
          <div className="text-xs text-muted mt-0.5">
            Read from each person's own assessment grades, not a flat cutoff. {graded.length} people.
          </div>
        </div>
      )}

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
    </div>
  );
}
