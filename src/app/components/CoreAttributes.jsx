'use client';

/**
 * CoreAttributes — the per-person strengths screen, built to core-attributes-mockup.html.
 *
 * Shows three things, in the mockup's own layout and colors:
 *  1. The six-dimension profile, External red, Internal blue, with bias.
 *  2. All 78 Core Attributes by cluster and rank, sortable and filterable.
 *  3. The four moves, Own, Create Systems, Delegate, Hire, signal-labeled until a role demand lands.
 *
 * Reads real data, the 78 from person.attr78 and the rollups from person.attr. Uses the
 * locked clarity tiers and the strengths engine. Inward-facing attributes never route to a move.
 */

import { useMemo, useState } from "react";
import { personStrengths, routeGapsForPerson } from "../utils/strengths";
import { attrTier, normBiasChar } from "../utils/attr-tiers";

const EXT = "#c43d2e";
const INT = "#2766ad";
const EXTERNAL_CORE = ["Empathy", "Practical Thinking", "Systems Judgment"];
const isExt = (core) => EXTERNAL_CORE.includes(core);

function biasMark(bias) {
  const b = normBiasChar(bias);
  if (b === "+") return <span style={{ color: "#2f855a", fontWeight: 800 }}>+</span>;
  if (b === "−") return <span style={{ color: "#b7472a", fontWeight: 800 }}>{"−"}</span>;
  return <span style={{ color: "#8a8f98", fontWeight: 800 }}>=</span>;
}

// One row of the six-dimension profile.
function DimBar({ name, sub, score, bias, ext }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  const color = ext ? EXT : INT;
  return (
    <div className="grid items-center gap-3 my-2" style={{ gridTemplateColumns: "180px 1fr 64px" }}>
      <div className="text-[13px] text-foreground">{name} {sub && <small className="text-muted">{sub}</small>}</div>
      <div className="h-[15px] rounded-lg overflow-hidden" style={{ background: "var(--bar-bg, #ecebe4)" }}>
        <div className="h-full rounded-lg" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[13px] text-right tabular-nums">{score?.toFixed?.(1) ?? score} {biasMark(bias)}</div>
    </div>
  );
}

export function CoreAttributes({ person, team = [] }) {
  const [sortBy, setSortBy] = useState("rank"); // rank or score
  const [filter, setFilter] = useState("all");  // all, ext, int

  const has78 = Array.isArray(person.attr78) && person.attr78.length > 0;
  const strengths = useMemo(() => personStrengths(person), [person]);
  const routes = useMemo(() => routeGapsForPerson(person, team), [person, team]);

  const ext = person.attr?.ext || [];
  const int = person.attr?.int || [];

  // The 78 rows, filtered and sorted.
  const rows = useMemo(() => {
    if (!has78) return [];
    let r = person.attr78.map(a => ({ ...a, ext: isExt(a.coreDimension), tier: attrTier(a.rawScore) }));
    if (filter === "ext") r = r.filter(a => a.ext);
    if (filter === "int") r = r.filter(a => !a.ext);
    r.sort((a, b) => sortBy === "rank" ? (a.rank - b.rank) : (b.rawScore - a.rawScore));
    return r;
  }, [person, has78, filter, sortBy]);

  // Group the gap routes.
  const delegate = routes.filter(r => r.move === "delegate");
  const build = routes.filter(r => r.move === "create-systems-or-hire");

  return (
    <div className="max-w-4xl">
      {/* Signal banner */}
      <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium mb-4"
           style={{ background: "#f6e9dd", border: "1px solid #ecd9c6", color: "#8a5526" }}>
        Signal read. These name what to look into, not a verdict. They become firm once the role demand is set.
      </div>

      {/* Six-dimension profile */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted mb-3">The Six-Dimension Profile</div>
        <div className="mb-2">
          <span className="inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded-full mr-2" style={{ background: "#fae8e5", color: EXT }}>External, how you meet the world</span>
        </div>
        {ext.map(a => <DimBar key={a.name} name={a.name} sub={a.label} score={a.score} bias={a.bias} ext={true} />)}
        <div className="mt-3 mb-2">
          <span className="inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#e7eef8", color: INT }}>Internal, how you meet yourself</span>
        </div>
        {int.map(a => <DimBar key={a.name} name={a.name} score={a.score} bias={a.bias} ext={false} />)}
        <div className="flex gap-4 flex-wrap text-xs text-muted mt-3">
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: EXT }} /> External</span>
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: INT }} /> Internal</span>
          <span>{"+ requires · − undervalues · = balanced"}</span>
        </div>
      </div>

      {/* The four moves */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted mb-3">The Four Moves</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {/* Own */}
          <div className="rounded-xl p-3.5 flex flex-col" style={{ border: `1px solid #eccfc9`, background: "linear-gradient(180deg,#fdf3f1,#fff)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white rounded-full w-5 h-5 inline-flex items-center justify-center" style={{ background: EXT }}>1</span>
              <h4 className="m-0 text-sm font-bold text-foreground">Own</h4>
            </div>
            <div className="text-[11.5px] text-muted mt-2">Hold the work that plays to a real talent.</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {strengths.own.slice(0, 10).map(o => (
                <span key={o.attribute} className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "#fae8e5", color: EXT, border: "1px solid #eccfc9" }}>{o.attribute}</span>
              ))}
              {strengths.own.length === 0 && <span className="text-xs text-muted">No high-clarity outward talent on record.</span>}
            </div>
          </div>
          {/* Delegate */}
          <MoveCard num="2" title="Delegate" desc="Hand a gap to a teammate who already carries it.">
            {delegate.length === 0 ? <span className="text-xs text-muted">Nothing to hand off, or no teammate carries it.</span> :
              delegate.map(r => (
                <span key={r.capacity} className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "#eef1f4", color: "#42505f" }}>
                  {r.capacity} {r.delegateTo ? `→ ${r.delegateTo.name}` : ""}
                </span>
              ))}
          </MoveCard>
          {/* Create Systems or Hire */}
          <MoveCard num="3" title="Create Systems or Hire" desc="Build a process or hire for a gap no one covers.">
            {build.length === 0 ? <span className="text-xs text-muted">No uncovered outward gap.</span> :
              build.map(r => (
                <span key={r.capacity} className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "#fbf2ec", color: "#8a5526", border: "1px solid #ecd9c6" }}>{r.capacity}</span>
              ))}
          </MoveCard>
          {/* Internal, not a move */}
          <div className="rounded-xl p-3.5 flex flex-col" style={{ border: `1px dashed #cdddef`, background: "#e7eef8" }}>
            <h4 className="m-0 text-sm font-bold" style={{ color: INT }}>Inward, not a move</h4>
            <div className="text-[11.5px] mt-2" style={{ color: "#3f5570" }}>These stay with the person, development and retention. You cannot hire or hand off a self-concept.</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {int.map(a => (
                <span key={a.name} className="text-[11px] px-2 py-0.5 rounded-md bg-white" style={{ color: INT, border: "1px solid #cdddef" }}>{a.name} {biasMark(a.bias)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All 78 */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted">All 78 Core Attributes <span className="normal-case tracking-normal font-normal text-muted">by cluster and rank</span></div>
          {has78 && (
            <div className="flex gap-2 items-center flex-wrap">
              <div className="inline-flex rounded-lg p-0.5" style={{ background: "#eef1f4" }}>
                {[["all", "All"], ["ext", "External"], ["int", "Internal"]].map(([k, label]) => (
                  <button key={k} onClick={() => setFilter(k)} className="border-0 px-3 py-1.5 rounded-md text-[12px] cursor-pointer font-medium"
                          style={filter === k ? { background: "#fff", color: "#20272f", boxShadow: "0 1px 2px rgba(0,0,0,.08)" } : { background: "transparent", color: "#5f6b78" }}>{label}</button>
                ))}
              </div>
              <div className="inline-flex rounded-lg p-0.5" style={{ background: "#eef1f4" }}>
                {[["rank", "By rank"], ["score", "By score"]].map(([k, label]) => (
                  <button key={k} onClick={() => setSortBy(k)} className="border-0 px-3 py-1.5 rounded-md text-[12px] cursor-pointer font-medium"
                          style={sortBy === k ? { background: "#fff", color: "#20272f", boxShadow: "0 1px 2px rgba(0,0,0,.08)" } : { background: "transparent", color: "#5f6b78" }}>{label}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!has78 ? (
          <div className="text-sm text-muted">The full 78 are not loaded for this person, so the six rollups above are the read. Load the person's 78 to see the full list.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="text-left uppercase text-[11px] tracking-wide text-muted font-semibold py-1.5 px-2" style={{ borderBottom: "1px solid #f1f0ea" }}>#</th>
                  <th className="text-left uppercase text-[11px] tracking-wide text-muted font-semibold py-1.5 px-2" style={{ borderBottom: "1px solid #f1f0ea" }}>Attribute</th>
                  <th className="text-left uppercase text-[11px] tracking-wide text-muted font-semibold py-1.5 px-2" style={{ borderBottom: "1px solid #f1f0ea" }}>Side</th>
                  <th className="text-left uppercase text-[11px] tracking-wide text-muted font-semibold py-1.5 px-2" style={{ borderBottom: "1px solid #f1f0ea" }}>Cluster</th>
                  <th className="text-left uppercase text-[11px] tracking-wide text-muted font-semibold py-1.5 px-2" style={{ borderBottom: "1px solid #f1f0ea" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(a => {
                  const color = a.ext ? EXT : INT;
                  const pct = Math.max(0, Math.min(100, (a.rawScore / 10) * 100));
                  return (
                    <tr key={a.attribute} style={{ background: a.tier === "high" ? (a.ext ? "#fdf6f5" : "#f4f8fd") : "transparent" }}>
                      <td className="py-1.5 px-2 tabular-nums text-[#97a0ab]" style={{ borderBottom: "1px solid #f1f0ea", width: 38 }}>{a.rank}</td>
                      <td className="py-1.5 px-2 text-foreground" style={{ borderBottom: "1px solid #f1f0ea", fontWeight: a.tier === "high" ? 600 : 400 }}>{a.attribute}</td>
                      <td className="py-1.5 px-2" style={{ borderBottom: "1px solid #f1f0ea" }}>
                        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: a.ext ? "#fae8e5" : "#e7eef8", color }}>{a.ext ? "External" : "Internal"}</span>
                      </td>
                      <td className="py-1.5 px-2 text-[#42505f]" style={{ borderBottom: "1px solid #f1f0ea" }}>
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "#eef1f4" }}>{a.cluster || a.coreDimension}</span>
                      </td>
                      <td className="py-1.5 px-2 tabular-nums font-bold" style={{ borderBottom: "1px solid #f1f0ea", width: 90 }}>
                        {a.rawScore?.toFixed?.(1) ?? a.rawScore}
                        <span className="block h-1 rounded mt-1 overflow-hidden" style={{ background: "#ecebe4" }}>
                          <i className="block h-full rounded" style={{ width: `${pct}%`, background: color }} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-xs text-muted mt-3">
              Rank orders this person against themselves, rank 1 is their own top talent. Score compares across people. Talent is 8 and up, low is below 6.5, from the clarity tiers until per-attribute norms load.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MoveCard({ num, title, desc, children }) {
  return (
    <div className="rounded-xl p-3.5 flex flex-col" style={{ border: "1px solid #e6e3dc" }}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-white rounded-full w-5 h-5 inline-flex items-center justify-center" style={{ background: "#b08a5e" }}>{num}</span>
        <h4 className="m-0 text-sm font-bold text-foreground">{title}</h4>
      </div>
      <div className="text-[11.5px] text-muted mt-2">{desc}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">{children}</div>
    </div>
  );
}
