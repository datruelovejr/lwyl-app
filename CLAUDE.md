# CLAUDE.md, lwyl-app

Place this file at the root of the lwyl-app repo. Claude Code reads it on every session, so it carries the methodology and the rules without anyone relaying messages.

---

## What this app is

Love Where You Lead measures workplace friction from the Innermetrix ADVanced Insights assessments, DISC, Values, and Attributes, and routes each kind of friction to the right fix. The friction methodology is the source of truth. Build to it, do not improvise it.

## The source of truth

The complete methodology lives in `/methodology/Friction_Methodology.md`. Read it before changing any friction logic. Supporting files in `/methodology/`, the four friction sources and their fixes, the construct definitions, the coverage-gap data plan, and the build briefs. If code and the methodology disagree, the methodology wins, fix the code.

## The four friction types, and the rule that governs them

Friction comes in two families. Approach-clash, Difference and Whose-standard, runs on the lens and is solved by reconciliation. Structural, Competition and Coverage-gap, runs on a scarce thing or an unmet demand and is solved by structure. Never apply lens-understanding to a structural problem.

## Hard rules, do not break these

1. **Bands come from the instrument, never a flat cutoff.** Every high and low call uses the Innermetrix validated per-dimension band. A 48 can be High on one value and a 49 Average on another. The current `valLevel` flat ladder is wrong and is being retired. If a band is missing, store NULL with a `band_source` tag, never a guessed value.
2. **Coverage-gap needs all 78 attributes and is External only.** It reads the 78 Core Attribute List by cluster and rank, never a single raw score, and never touches the three Internal attributes. With only the six rollup dimensions stored, coverage-gap cannot run, say so, do not approximate it.
3. **Signal versus confirmed.** Only Difference is confirmed from scores. Competition, Whose-standard, and Coverage-gap are signals until their confirmation input fires, a shared scarce unit, differing standards, or a role demand. Label friction as signal or confirmed, never overclaim.
4. **Internal stays separate from External.** The three Internal attributes are a retention signal, KRI, not friction and not coverage-gap. Never merge the two patterns.
5. **Verify before you build.** Confirm endpoints, auth, and data shape in the real code and account before writing ingestion. Do not assume the Innermetrix endpoint or the band source.
6. **Do not fabricate, and do not touch production without approval.** Missing data is reported, not filled. Schema changes and backfills wait for explicit sign-off and a one-person test.

## Known build gaps, the current work list

- The 78 attributes are not stored, only the six rollups. Coverage-gap is blocked. See `/methodology/Coverage_Gap_Data_Plan.md` and `/methodology/ClaudeCode_Brief_Pull78_and_Bands.md`.
- Bands and norms are not stored, the app fakes them with the flat `valLevel` cutoff.
- No person is flagged as leader, so Leader-Team friction cannot run. Capture the leader flag.
- No role-demand reference, so coverage-gap and competition stay signals.
- Assessment tokens and rawscores URLs are not stored, so pulls are not repeatable. Store them.

## How to work here

Read the methodology, propose the change, show the migration and a one-person test, then apply after approval. If a rigor skill is present in `.claude/skills`, the psychometric validator and the blindspot reviewer, run them on methodology changes before delivering.
