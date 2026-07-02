'use client';

/**
 * TeamCoreAttributes — the team's 78, plus a drill-down into any one person's full 78.
 *
 * Top: what the team is built to do well, strength by cluster, where it runs thin.
 * Bottom: pick a person to open their complete Core Attributes read.
 */

import { useMemo, useState } from "react";
import { teamAttributeSummary } from "../utils/team-attributes";
import { CoreAttributes } from "./CoreAttributes";

const EXT = "#c43d2e";
const INT = "#2766ad";

export function TeamCoreAttributes({ people = [] }) {
  const team = useMemo(
    () => people.filter((p) => Array.isArray(p.attr78) && p.attr78.length),
    [people]
  );
  const summary = useMemo(() => teamAttributeSummary(people), [people]);
  const [selId, setSelId] = useState(null);
  const selected = team.find((p) => p.id === selId) || null;

  if (!summary.ran) {
    return (
      <div className="max-w-4xl">
        <div className="text-lg font-extrabold text-foreground mb-1">Core Attributes</div>
        <div className="text-sm text-muted">The full 78 attributes are not loaded for this team yet, so the team read cannot run. Load a team that has the 78 captured, for example Morengo District Leaders.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <div className="text-lg font-extrabold text-foreground">Core Attributes</div>
        <div className="text-xs text-muted mt-1">The team's 78, by cluster and rank. {summary.n} people with the full attributes loaded. External is routable, Internal is a personal read.</div>
      </div>

      {/* What the team is built to do well */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted mb-3">What this team is built to do well <span className="normal-case tracking-normal font-normal">outward capacities most of the team holds as a talent</span></div>
        {summary.strengths.length === 0 ? (
          <div className="text-sm text-muted">No outward capacity is held as a talent across the team.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {summary.strengths.slice(0, 10).map((s) => (
              <div key={s.attribute} className="flex items-center gap-3">
                <span className="text-sm text-foreground flex-1">{s.attribute} <span className="text-muted text-xs">· {s.cluster}</span></span>
                <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: "#ecebe4" }}>
                  <div className="h-full rounded-full" style={{ width: `${s.talentPct}%`, background: EXT }} />
                </div>
                <span className="text-xs tabular-nums text-muted w-24 text-right">{s.talentPct}% hold it</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strength by cluster */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted mb-3">Strength by cluster <span className="normal-case tracking-normal font-normal">where the 78 concentrate</span></div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {summary.clusters.map((c) => (
            <div key={c.cl} className="rounded-xl p-3.5" style={{ border: `1px solid ${c.isExt ? "#eccfc9" : "#cdddef"}`, background: c.isExt ? "linear-gradient(180deg,#fdf3f1,#fff)" : "linear-gradient(180deg,#f2f6fc,#fff)" }}>
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span>{c.cl}</span>
                <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: c.isExt ? "#fae8e5" : "#e7eef8", color: c.isExt ? EXT : INT }}>{c.isExt ? "routable" : "personal"}</span>
              </div>
              <div className="text-xs text-muted mt-1.5">{c.avgTalent}% average talent share · {c.count} attributes</div>
              {c.top && <div className="text-xs mt-1.5" style={{ color: "#46525f" }}>strongest: <b className="text-foreground">{c.top.attribute}</b> ({c.top.talentPct}%)</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Where the team runs thin */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted mb-1">Where the team runs thin <span className="normal-case tracking-normal font-normal">outward capacities fewer than 40% clear the bar on</span></div>
        <div className="text-xs text-muted mb-3">A signal to confirm against what the roles actually need. Outward capacities only, you cannot hire or hand off a self-concept.</div>
        {summary.gaps.length === 0 ? (
          <div className="text-sm text-foreground">No outward capacity falls below the line. The team covers its needs.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {summary.gaps.slice(0, 10).map((g) => (
              <div key={g.attribute} className="flex items-center gap-3">
                <span className="text-sm text-foreground flex-1">{g.attribute} <span className="text-muted text-xs">· {g.cluster}</span></span>
                <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: "#ecebe4" }}>
                  <div className="h-full rounded-full" style={{ width: `${g.presentPct}%`, background: "#b9743a" }} />
                </div>
                <span className="text-xs tabular-nums text-muted w-24 text-right">{g.presentPct}% carry it</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drill into one person's full 78 */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted mb-2">One person's full 78</div>
        <select
          value={selId || ""}
          onChange={(e) => setSelId(e.target.value || null)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
        >
          <option value="">Pick a person to open their Core Attributes</option>
          {team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selected && (
        <div className="mt-2">
          <div className="text-sm font-bold text-foreground mb-2">{selected.name} · Core Attributes</div>
          <CoreAttributes person={selected} team={team} />
        </div>
      )}
    </div>
  );
}
