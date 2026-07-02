/**
 * teamFrictionReport — the four friction types for one team, named and quantified.
 *
 * This is the data behind The Method screen, built to the Tallassee_Friction_Breakdown
 * shape: one headline number per type, ranked by how much there is, each labeled
 * confirmed or signal. Retention is computed but kept SEPARATE from the friction types,
 * because self-worth is a turnover read, not friction between people.
 *
 * The four friction types:
 *   Difference     (confirmed) -> Translation        the everyday "we work differently"
 *   Whose-Standard (signal)    -> Set the Standard    both high on a quality/process drive
 *   Competition    (signal)    -> Split Ownership     both high on a scarce seat
 *   Coverage-Gap   (signal)    -> Create/Hire/Delegate an outward capacity no one covers
 * Plus, separate:
 *   Retention      (flagged)   -> leadership support  undervalued self-worth
 */

import { calculateFriction } from "./friction";
import { teamCoverageGap } from "./coverage-gap";
import { isDiscHigh, isValueHigh } from "./bands";
import { attrTier, normBiasChar } from "./attr-tiers";

const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
const sevFromPct = (p) => (p >= 60 ? "high" : p >= 35 ? "moderate" : p > 0 ? "low" : "none");

export function teamFrictionReport(people = []) {
  const team = people.filter((p) => p.disc || p.attr || (p.attr78 && p.attr78.length));
  const n = team.length;

  // ---- DIFFERENCE, confirmed. Share of pairs high on behavioral style and on values. ----
  let pairs = 0, prefHigh = 0, passHigh = 0;
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      const f = calculateFriction(team[i], team[j]);
      pairs++;
      if (f.preference?.tier === "high" || f.preference?.tier === "significant") prefHigh++;
      if (f.passion?.tier === "high" || f.passion?.tier === "significant") passHigh++;
    }
  }
  const diffPct = Math.max(pct(prefHigh, pairs), pct(passHigh, pairs));

  // How many people carry a usable band, so percentages read against the right base.
  let banded = 0;
  for (const p of team) if (p.discBands || p.valuesBands) banded++;
  const bandBase = banded || n;

  // ---- WHOSE-STANDARD, signal. High on the process / quality drive (DISC C or Regulatory). ----
  let processHigh = 0;
  for (const p of team) if (isDiscHigh(p.discBands, "C") || isValueHigh(p.valuesBands, "Regulatory")) processHigh++;

  // ---- COMPETITION, signal. High on the leadership-seat drive (DISC D or Political). ----
  let seatHigh = 0;
  for (const p of team) if (isDiscHigh(p.discBands, "D") || isValueHigh(p.valuesBands, "Political")) seatHigh++;

  // ---- COVERAGE-GAP, signal, needs the 78. ----
  const cov = teamCoverageGap(team);

  // ---- RETENTION, separate. Share who undervalue self-esteem (low tier or a minus bias). ----
  let selfLow = 0, intSeen = 0;
  for (const p of team) {
    const int = p.attr?.int || [];
    if (int.length) intSeen++;
    const se = int.find((a) => /self.?esteem/i.test(a.name || ""));
    if (se && (normBiasChar(se.bias) === "−" || attrTier(se.score) === "low")) selfLow++;
  }

  const difference = {
    key: "difference", name: "Difference", color: "#22a06b", fix: "Translation", status: "confirmed",
    prefPct: pct(prefHigh, pairs), passPct: pct(passHigh, pairs), pairs, headlinePct: diffPct,
    severity: sevFromPct(diffPct),
  };
  const whose = {
    key: "whose", name: "Whose-Standard", color: "#2f6fed", fix: "Set the Standard", status: "signal",
    pct: pct(processHigh, bandBase), count: processHigh, of: bandBase, severity: sevFromPct(pct(processHigh, bandBase)),
  };
  const competition = {
    key: "competition", name: "Competition", color: "#c43d2e", fix: "Split Ownership", status: "signal",
    pct: pct(seatHigh, bandBase), count: seatHigh, of: bandBase, severity: sevFromPct(pct(seatHigh, bandBase)),
  };
  const coverage = {
    key: "coverage", name: "Coverage-Gap", color: "#b9743a", fix: "Create, Hire, or Delegate",
    status: cov.ran ? "signal" : "cannot-assess", ran: cov.ran, gaps: cov.ran ? cov.gaps : [],
    severity: cov.ran ? (cov.gaps.length ? "moderate" : "low") : "none",
  };
  const retention = {
    key: "retention", name: "Retention signal", color: "#7c5cd6", fix: "leadership support, not a bridge",
    status: "flagged", pct: pct(selfLow, intSeen || n), count: selfLow, of: intSeen || n,
    severity: sevFromPct(pct(selfLow, intSeen || n)),
  };

  // Rank all five by magnitude of what's there, so the leader knows what to act on first.
  const mag = {
    whose: whose.pct, retention: retention.pct, difference: difference.headlinePct,
    competition: competition.pct, coverage: coverage.ran ? coverage.gaps.length * 20 : -1,
  };
  const priority = [whose, retention, difference, competition, coverage].sort(
    (a, b) => (mag[b.key] ?? 0) - (mag[a.key] ?? 0)
  );

  return { n, banded, difference, whose, competition, coverage, retention, priority };
}
