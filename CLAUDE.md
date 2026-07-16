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

State of the database as verified on 2026-07-02 (Supabase project `jhmyhuetrmrqlnteflns`, "Love Where You Lead App"). The `person_attributes` and `disc_values_bands` migrations, once proposals, are now applied and populated in production. See `/methodology/Coverage_Gap_Data_Plan.md` and `/methodology/ClaudeCode_Brief_Pull78_and_Bands.md`.

- **The 78 attributes are now stored.** `person_attributes` holds 31,044 rows, 398 people times 78 attributes each, with raw_score, rank, cluster, and core_dimension. Coverage-gap has the data it needs. The optional `attribute_catalog` table was not created; the catalog lives in code at `tools/attribute-catalog.js`.
- **DISC and Values bands are stored, the 78-attribute bands are not.** `people.disc_bands` and `people.values_bands` hold the real instrument band words for 395 of 419 people, read from the PDF. But `person_attributes.band` is NULL for every row; the app orders each person's 78 attributes by rank and uses that rank as a stand-in for the band. Rank is a person-relative position, not the instrument's absolute High/Low grade, so any true high/low call on an attribute is not yet on the validated band. `band_source` is set to `pdf-parsed` or `unparsed`. Coverage-gap by cluster and rank (Hard Rule 2) is fine on rank; other high/low calls are not.
- **The flat `valLevel` cutoff is still in the app** and must still be retired in favor of the stored bands (Hard Rule 1).
- No person is flagged as leader, so Leader-Team friction cannot run. Capture the leader flag.
- No role-demand reference, so coverage-gap and competition stay signals.
- **Assessment tokens and rawscores URLs are still not populated.** The `people.assessment_token` and `people.rawscores_url` columns exist but hold 0 rows of data, so pulls are still not repeatable. Populate them.

## How to work here

Read the methodology, propose the change, show the migration and a one-person test, then apply after approval. If a rigor skill is present in `.claude/skills`, the psychometric validator and the blindspot reviewer, run them on methodology changes before delivering.

## Skills and how we work, in `.claude/skills`

- **icm-build-standard.** The operating standard for this project, the authority when a choice feels arbitrary. Verify before you build, let a separate agent grade the work, never fake a number, label signal versus confirmed, speak plainly. Load it at the start of any stage.
- **orgharmony-psychometric-validator** and **blindspot-reviewer.** The rigor pair. Validator on every methodological decision, then a clean-window blindspot review before approval.
- **build-a-worker.** Sets up AI workers before any build. Use it to plan parallel-agent sessions, right-size the office, brief before build.
- **handoff.** Produces the session handoff. Guidelines live in this skill and in icm-build-standard, not restated here.

## Handoff guidelines

At session end, or when the owner says wrap up or hand off, run the `handoff` skill. It writes a dated `HANDOFF-YYYY-MM-DD-<slug>.md` at the repo root, carries the prior handoff's rules and open gaps forward, and never wipes history. The full section format is in the `handoff` and `icm-build-standard` skills.
