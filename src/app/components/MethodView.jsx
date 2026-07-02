'use client';

/**
 * MethodView — the friction breakdown by type, for the selected team.
 *
 * Built to Tallassee_Friction_Breakdown: a priority list, then one card per friction
 * type, always the same four questions (what it is, how much you have, why it matters,
 * how you solve it), each with a confidence line. Retention is kept separate, it is a
 * turnover read, not friction between people. No raw signal dumps, no jargon.
 */

import { useMemo } from "react";
import { teamFrictionReport } from "../utils/friction-report";

const SEV_LABEL = { high: "HIGH", moderate: "MODERATE", low: "LOW", none: "CANNOT ASSESS" };

function SevPill({ severity, verify }) {
  const bg = { high: "bg-friction-high/12 text-friction-high", moderate: "bg-friction-moderate/15 text-friction-moderate", low: "bg-friction-low/12 text-friction-low", none: "bg-subtle text-muted" }[severity] || "bg-subtle text-muted";
  return <span className={`text-[10.5px] font-bold tracking-wide px-2.5 py-0.5 rounded-full whitespace-nowrap ${bg}`}>{SEV_LABEL[severity]}{verify ? " · VERIFY" : ""}</span>;
}

// Fixed copy per type. The one headline number is filled from the live report.
const COPY = {
  difference: {
    whatItIs: "The everyday one. Two people work differently, want different things, or weigh decisions differently, and each reads the other's way as wrong. This is the friction the tool already measured.",
    howMuch: (d) => `${d.prefPct}% of pairs carry high behavioral-style friction, and ${d.passPct}% carry high values friction. High and everywhere, which is normal for a group this size.`,
    whyItMatters: "The daily tax on collaboration. It matters, but it is the background level, not the thing that sets this team apart. Treat it as ongoing maintenance, not a fire.",
    howToSolve: "Translation. Help people see each other's style and agree how to work together, the Preference, Passion, and Process agreements. Best as team training, not one pair at a time.",
    conf: "Confirmed. Computed exactly as the engine does, and validated against its own ground-truth check.",
  },
  whose: {
    whatItIs: "Two people who both care about the same thing, but each holds a different version of the right way to do it. Nobody is wrong. They just run different playbooks for the same job.",
    howMuch: (w) => `${w.count} of ${w.of} people (${w.pct}%) sit high on the process-and-procedure drive. Where this runs high, it is usually a team's defining friction.`,
    whyItMatters: "The friction that fills meetings with relitigating procedure, two strong people each sure their system is the correct one. Left alone it quietly burns time and trust.",
    howToSolve: "Set the Standard. Pick one operating standard where the work is shared, or give each leader a clear lane where their standard governs. An agreement, not a translation. Highest-leverage, because one decision settles friction for many at once.",
    conf: "Signal. Reads the both-high pattern from each person's stored bands. Firms up once the role demands confirm the work is actually shared.",
  },
  competition: {
    whatItIs: "Two or more people reaching for the same single thing, the one seat, the one final decision. Nobody is wrong, there is just one of it.",
    howMuch: (c) => `${c.count} of ${c.of} people (${c.pct}%) run high on the leadership-seat drive. A real contest only where those people share one decision.`,
    whyItMatters: "Where it concentrates, it is the power struggle that stalls decisions and turns peers into rivals. Watch who owns which calls.",
    howToSolve: "Split Ownership. Carve the scarce thing into clear pieces so each person owns a real part. Name who owns which decisions before the contest hardens.",
    conf: "Signal. A contest is only real if those people actually share one decision. Confirm the shared decision before acting, the data shows the drive, not the org chart.",
  },
  coverage: {
    whatItIs: "A capability the work needs that nobody on the team carries. Everyone agrees, but the job goes uncovered. Outward capacities only, you cannot hire or hand off a self-concept.",
    howMuch: (c) =>
      !c.ran
        ? "Cannot be measured for this team yet. It reads the full 78 attributes per person, and they are not loaded here."
        : c.gaps.length === 0
        ? "No outward capacity falls below the line. The team covers its needs."
        : `${c.gaps.length} outward ${c.gaps.length === 1 ? "capacity runs" : "capacities run"} thin: ${c.gaps.map((g) => `${g.capacity} (${g.sharePresent}% carry it)`).join(", ")}.`,
    whyItMatters: "The one friction type that can make a team fail a task no matter how well they get along. Do not guess at it.",
    howToSolve: "Create a system, hand it off, or hire, against a real role demand. First confirm the role actually needs the capacity.",
    conf: (c) => (c.ran ? "Signal. The low is real, whether it is a gap depends on the role. Confirm against what the work requires." : "Not assessable until the 78 attributes are loaded for this team."),
  },
  retention: {
    whatItIs: "Not friction between people. It is how each person sees their own worth and direction. Tracked separately because it predicts burnout and turnover, not arguments.",
    howMuch: (r) => `${r.count} of ${r.of} people (${r.pct}%) undervalue themselves on the self-esteem read.`,
    whyItMatters: "A workforce that undervalues itself is a retention and morale risk. In a school district that is teacher turnover, the most expensive problem you have.",
    howToSolve: "Not a bridge between two people. Leadership work, recognition, clear roles, visible growth paths. It belongs in the leader view.",
    conf: "Flagged, kept off the friction score by design. If the rate is extreme, confirm against a few raw Innermetrix reports before acting.",
  },
};

function PriorityRow({ rank, item, desc }) {
  return (
    <div className="flex items-center gap-3 py-3 px-3.5 border-t border-border first:border-t-0">
      <span className="w-6 h-6 rounded-full bg-subtle border border-border flex items-center justify-center text-[12px] font-bold flex-none">{rank}</span>
      <span className="font-semibold flex-none w-[130px]" style={{ color: item.color }}>{item.name}</span>
      <span className="text-[13.5px] text-muted flex-1 min-w-[160px]">{desc}</span>
      <SevPill severity={item.severity} verify={item.key === "retention" && item.severity === "high"} />
    </div>
  );
}

const PRIORITY_DESC = {
  difference: "The everyday “we work and value things differently” friction. Broad and ongoing, the baseline everywhere.",
  whose: "People who each believe in the right way to run things. Where it is high, it is the defining friction.",
  competition: "A few people reaching for the same seat or decision. Real only where they share it.",
  coverage: "An outward capability the team may run thin on. Reads the full 78 attributes.",
  retention: "People undervaluing themselves. Not interpersonal friction, a morale and turnover risk. Verify.",
};

function TypeCard({ item, howMuch, conf }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4" style={{ borderLeft: `4px solid ${item.color}` }}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h3 className="m-0 text-lg font-extrabold" style={{ color: item.color }}>{item.name}{item.key === "retention" ? " · self-worth read" : " friction"}</h3>
        <div className="text-[12.5px] text-muted">Solve with <b className="text-foreground">{item.fix}</b></div>
      </div>
      <div className="mt-3">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-0.5">What it is</div>
        <p className="m-0 mb-3 text-[14.5px] text-foreground/90">{COPY[item.key].whatItIs}</p>
        <div className="text-[11px] uppercase tracking-wide text-muted mb-0.5">How much you have</div>
        <p className="m-0 mb-3 text-[15px] text-foreground font-medium">{howMuch}</p>
        <div className="text-[11px] uppercase tracking-wide text-muted mb-0.5">Why it matters</div>
        <p className="m-0 mb-3 text-[14.5px] text-foreground/90">{COPY[item.key].whyItMatters}</p>
        <div className="text-[11px] uppercase tracking-wide text-muted mb-0.5">How you solve it</div>
        <p className="m-0 text-[14.5px] text-foreground/90">{COPY[item.key].howToSolve}</p>
      </div>
      <p className="text-[12.5px] text-muted border-t border-dashed border-border pt-2.5 mt-3.5 mb-0">
        <b className="text-foreground/80">Confidence.</b> {conf}
      </p>
    </div>
  );
}

export function MethodView({ people = [] }) {
  const report = useMemo(() => teamFrictionReport(people), [people]);

  if (report.n === 0) {
    return <div className="text-sm text-muted">No graded people are loaded for this team yet.</div>;
  }

  const { difference, whose, competition, coverage, retention, priority } = report;

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <div className="text-lg font-extrabold text-foreground">Friction breakdown by type</div>
        <div className="text-xs text-muted mt-1">
          What you have, why it matters, and how you solve it. Read from each person's own assessment grades. {report.n} people.
        </div>
      </div>

      {/* Priority banner */}
      <div className="bg-card border border-border rounded-xl p-2 mb-6">
        <div className="px-2.5 pt-2 pb-1 text-[11px] uppercase tracking-wide text-muted font-bold">Start here, what to act on first</div>
        {priority.map((item, i) => (
          <PriorityRow key={item.key} rank={i + 1} item={item} desc={PRIORITY_DESC[item.key]} />
        ))}
      </div>

      {/* The four friction types */}
      <TypeCard item={difference} howMuch={COPY.difference.howMuch(difference)} conf={COPY.difference.conf} />
      <TypeCard item={whose} howMuch={COPY.whose.howMuch(whose)} conf={COPY.whose.conf} />
      <TypeCard item={competition} howMuch={COPY.competition.howMuch(competition)} conf={COPY.competition.conf} />
      <TypeCard item={coverage} howMuch={COPY.coverage.howMuch(coverage)} conf={COPY.coverage.conf(coverage)} />

      {/* Retention, kept separate */}
      <div className="text-[11px] uppercase tracking-wide text-muted font-bold mt-8 mb-2">Kept separate, not friction</div>
      <TypeCard item={retention} howMuch={COPY.retention.howMuch(retention)} conf={COPY.retention.conf} />

      {/* What blocks a fully confirmed read */}
      <div className="text-[12.5px] text-muted border border-border rounded-xl p-4 mt-4">
        <b className="text-foreground/80">What blocks certainty.</b> Three things turn these signals into confirmed reads: mark who the leader is, read the true per-dimension bands, and map each role to the capacities it demands. Difference is already confirmed. The rest are honest signals until then.
      </div>
    </div>
  );
}
