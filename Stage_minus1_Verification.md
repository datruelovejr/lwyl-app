# Stage -1 Verification, PDF Assessment Ingestion

**Date:** 2026-06-07
**Project:** lwyl-app, 78-attribute PDF ingestion
**Target:** Supabase project jhmyhuetrmrqlnteflns, Love Where You Lead App
**Source of truth read first:** friction-methodology-workspace/ClaudeCode_Brief_PDF_Extraction.md, lwyl-app/CLAUDE.md, icm-build-standard.skill
**Verdict:** Data shapes confirmed. Parser is NOT sound as written. Three blockers must close before any production load.

---

## What I checked, and what is true

### Check 1, schema is deployed. PASS
- `person_attributes` exists with the nine expected columns: person_id uuid, attribute text, raw_score numeric, rank int, cluster text, core_dimension text, band text, band_source text, updated_at timestamptz.
- Primary key is `(person_id, attribute)`. The upsert `onConflict: 'person_id,attribute'` is a real constraint, so re-runs update in place. Idempotency holds.
- `people` carries the six-dimension rollup in `attributes` jsonb, plus `disc_natural`, `disc_adapted`, `values_data`, `is_leader`, `assessment_token`, `rawscores_url`.
- Current state is not a clean slate: 234 rows across 3 people already loaded, exactly 78 each. Those three were loaded by the current parser, so their rank is wrong. See Blocker 1. They must be reloaded after the fix.

### Check 2, one real PDF parses. PASS on count and scores, FAIL on rank
- File: insights-Judy_Nunn1780794604.pdf, 72 pages.
- Name extraction returns "Judy Nunn". Correct.
- The parser returns exactly 78 attributes, all 78 map to the catalog, scores sit in 0 to 10 and read correctly.
- The 78 sit on the last page, page 72, titled "Core Attribute List", one per line as `Name (score)`, in descending score order. Rank 1 is "Handling Stress (7.6)", rank 78 is "Self Control (4.0)".
- The parser captures each attribute from the FIRST place its `Name (score)` appears in the document. The "Category Component Graphs" sections on pages 64 to 70 come before the Core Attribute List on page 72, so the attributes listed there win and inherit document order. For Judy, 52 of the 78 come from the Core Attribute List page in correct order, and 26 come from the earlier graph pages and take document-order ranks 1 to 26, displacing the rest. So the stored rank is corrupted, not score order. Proof: the parser stored "Evaluating What Is Said" (4.7) as rank 1, but on the Core Attribute List that attribute is rank 77. The true rank 1 is "Handling Stress" (7.6). Confirmed across 22 of 22 attribute-bearing sample PDFs: stored rank never equals score-descending order.
- Because the displaced set is whichever attributes the report's category sections happen to list, the corruption pattern is template-dependent. The Customer Service template corrupts a different 26 than another template would. Any fix must be checked across more than one report template.

### Check 3, sample person record. PASS, and the required cross-check works
- Judy Nunn stored six dimensions: Empathy 6.0 minus, Practical Thinking 6.7 plus, Systems Judgment 5.2 minus, Self-Esteem 7.6 minus, Role Awareness 5.5 minus, Self-Direction 4.8 plus.
- The PDF "Dimensional Balance" page, page 4, shows the same six scores and the same six bias signs, exactly.
- So the brief's required built-in proof, compare the six parsed dimensions against the stored six before loading, is feasible and passes for this person. The bias is stored with the Unicode minus U+2212, as the brief expects.
- UUID format is standard. `assessment_token` and `rawscores_url` are NULL, the known later-stage gap, not a Stage -1 blocker.

### Check 4, filename to person matching. FAIL as written
- 485 PDFs, 419 people. Filename-only matching across all 485: 365 match by fuzzy substring, 86 match nothing, 31 are fuzzy-ambiguous, 3 are exact-ambiguous.
- Most of the 365 are the safe case, the person name is a substring of a templated filename like `insights-Judy_Nunn1780794604`. The real exposure is the 86 no-match, the 34 ambiguous, and the collision risk a short name creates. The six-dimension gate in Blocker 2 is what catches a wrong match.
- Full algorithm on 12 cohort samples, filename then parsed-name fallback: 5 matched, 4 ambiguous, 3 no match.
- The runner's fuzzy path matches when one name is a substring of the other. That is guessing, which the brief forbids: "if a name does not match exactly, do not guess, log it as unmatched."
- The people table has 16 duplicate normalized names (samuel mixson, meghan bush, glenda carwile, jade snell, kaley pugh, tracey salzedas, tessie williams, jimmy osmore, stacy sidney, donna cunningham, hannah taylor, jacklyn free, laqueta hutchinson, laura mullins, terri hamilton, tyrone tarver). Each auto-skips on match.
- One junk person row exists, "Natural Style:", a parse artifact. The brief names it. Skip it.

---

## Gap list, carry forward

- [ ] **Blocker 1, corrupted rank from first-occurrence capture.** Parser takes each attribute from the first `Name (score)` in the document. The Category Component graph pages precede the Core Attribute List page, so 26 of 78 attributes inherit document-order ranks and displace the rest. The corrupted set is template-dependent. Fix: read only the "Core Attribute List" page, parse `Name (score)` lines in order, rank is the line position. Verify on more than one report template. Reload the 3 already-loaded people after the fix.
- [ ] **Blocker 2, no six-dimension verification gate.** The brief requires comparing the six parsed dimensions against the stored `people.attributes` per person and stopping on a mismatch. Not implemented. It is also the only guard against a wrong fuzzy match writing to the wrong person. Build it into the load.
- [ ] **Blocker 3, unsafe matching.** Replace fuzzy substring guessing with exact normalized match or an explicit mapping file, then confirm every match with the six-dimension gate. 86 of 485 match nothing on filename, 34 are ambiguous. A mapping file is required, the skip rate already exceeds the plan's 10 percent line.
- [ ] **Major 4, DISC and Values band parsers produce wrong output.** Found by the Stage -1 reviewer, missed in my first pass. `parseDISCBands` returns Decisive High, Interactive High, Stabilizing High, Cautious High for Judy, but the report narrative reads D very low, I, S, C very high on the spectrum. The parser false-matches stray "High" tokens instead of reading the spectrum phrase. `parseValuesBands` is token-fragile the same way. Storing this output would fabricate bands, which the standard forbids. Fix the parsers to read the DISC `'X' spectrum` narrative and the per-value band word, and prove them on one report before any band load.
- [ ] **Major 5, DISC and Values bands not stored.** Separate from the parser defect above. The schema has no DISC or Values band column or table. The brief requires storing the band words. The 78-attribute load can proceed without it, but this brief deliverable stays open.
- [ ] **Major 6, 64 DISC Plus reports carry no attributes.** The entire Alabama Administrative Assistants cohort, 64 of 485, are "DISC Plus" reports with a Values Index and a DISC Index but no Attribute Index. They yield 0 of 78. They cannot feed person_attributes. Skip and report them, do not fail the run on them.
- [ ] **Minor 7, blank can overwrite a good band, and band_source is mislabeled.** The upsert sends `band: null` with `band_source: 'pdf-parsed'` every run. Two problems. First, once a band exists, a re-run blanks it, and the brief forbids overwriting a good value with a blank. Second, tagging a null band as `pdf-parsed` claims a parse that produced nothing. Guard the upsert and tag an absent band honestly.
- [ ] **Minor 8, data-quality reconciliation.** 419 people, 485 PDFs, 414 attribute-bearing PDFs, 16 duplicate names, 1 junk row. Tallassee Central Office has 12 PDFs, the brief says 13 people. Reconcile coverage and the start-org count before the first load.

---

## Signal versus confirmed
- Confirmed from data: schema shape, primary key, the 78 live on the Core Attribute List page in descending order, the six-dimension cross-check passes for Judy Nunn, the 64 DISC Plus reports carry no attributes, the duplicate and junk rows.
- Signal, not yet confirmed: the full 485 match outcome. Tier 1 and the 12-sample Tier 2 are a preview. The full dry-run is Stage 2, after the matching fix.
- Proven on one person only: score fidelity. I confirmed 0 of 78 score mismatches for Judy Nunn against the Core Attribute List. The cross-cohort batch probe checked count and rank order, not score correctness. Add a score-versus-Core-Attribute-List check to the Stage 2 dry-run.

## Stage -1 reviewer verdict
A separate reviewer, clean window, read-only, Opus class, graded this artifact per the icm-build-standard. Verdict: ISSUES FOUND. The three Blockers are correctly identified and correctly classified, and every data-shape number reproduced exactly. The reviewer corrected Blocker 1's mechanism, it is first-occurrence capture, not a failure to read the page, and it surfaced the broken band parsers now recorded as Major 4. Both corrections are folded in above. The do-not-load verdict stands.

## Recommended next step
Do not proceed to a load. Close Blockers 1 to 3 in the parser and runner, then run the one-person end-to-end proof on Tallassee Central Office that the brief asks for, the 78 with correct ranks, the six with bias, and the six-dimension gate passing, before loading the rest.

---

## Fix applied, 2026-06-07

Owner approved closing all blockers and excluding the 64 no-attribute reports. Changes, verified read-only against real PDFs and the live database, no production writes:

- **Blocker 1 closed.** `parseAttributes78` in pdf-parser-enhanced.js now reads only the "Core Attribute List" page and ranks by position. Verified on Judy Nunn: 78 attributes, rank 1 "Handling Stress" 7.6, rank 78 "Self Control" 4.0, scores monotonic non-increasing.
- **Blocker 2 closed.** Added `parseDimensionalBalance` and a `verifySixDimensions` gate in ingest-pdf-to-attributes.js. It compares the six parsed dimensions and bias against the stored `people.attributes` and refuses to write on a mismatch. Verified both ways: passes for Judy against her own rollup, flags a mismatch when Judy's dimensions are checked against Caleb Stewart's rollup, which proves it catches a wrong-person match.
- **Blocker 3 closed.** Removed the fuzzy substring matching from ingest-all-pdfs.js. Matching is now exact normalized name or an explicit mapping only, by filename then by parsed cover name. Unmatched and ambiguous files are reported, never guessed.
- **64 DISC Plus reports excluded.** The runner parses each file first and routes any report with no Core Attribute List page to a "no attributes" bucket, in both dry-run and the real run. This is content-based, so it catches exactly the reports that lack the 78, not a filename guess.
- **Honesty fixes.** The ingest never loads a partial, it returns a status and skips. A missing band stores NULL with `band_source` set to `unparsed`, not `pdf-parsed`.

Still open, by the owner's decision, for a later session: the DISC and Values band parsers are broken (Major 4) and bands are not stored (Major 5). The 3 already-loaded people carry old wrong ranks and need a re-load. The 64 DISC Plus people will be completed separately.
