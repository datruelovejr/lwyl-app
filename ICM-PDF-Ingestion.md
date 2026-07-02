# ICM: PDF Assessment Ingestion

**Status:** Ready for Stage -1 Verification  
**PDF Count:** 485 assessment files in `lwyl-app/tools/pdfs/`  
**Source:** Tallassee High School assessments  
**Method:** Innermetrix Advanced Insights reports  

## Objective

Ingest 485 locally downloaded assessment PDFs into Supabase, parsing the 78-attribute Innermetrix assessments and populating `people` and `person_attributes` tables. Do not store raw PDF files in Supabase storage; parse and store attributes only.

## Critical Rules (ICM Build Standard)

1. **Verify before you build** — One real PDF inspected, schema confirmed, sample row probed.
2. **Separate reviewer at every stage boundary** — Each stage output is graded by a clean agent.
3. **Never fake a number** — Report actual counts; never guess or infer missing data.
4. **Be honest about signal vs. confirmed** — Label every claim with confidence level.
5. **Report by the thing you measure** — Organize findings by the PDF sources, match quality, ingestion results.

## Current state

- `lwyl-app` is a Next.js application using Supabase for database access.
- Existing upload flow parses PDFs in-browser and inserts parsed person data; it does not persist raw PDF files.
- Local CLI tools under `tools/`:
  - `tools/ingest-pdf-to-attributes.js` — single PDF parser
  - `tools/ingest-all-pdfs.js` — batch runner with dry-run and mapping support
- Supabase credentials via `.env` or CLI flags
- Schema: `person_attributes` table with 78 attributes per person (CONFIRMED in migration file)

## Scope

**Include:**
- Parse 485 PDFs from `lwyl-app/tools/pdfs/` (organized by school)
- Match each PDF filename to `people` table by name or JSON mapping
- Extract 78-attribute scores from each PDF
- Upsert into `person_attributes` table
- Support dry-run before production ingestion
- Report final match quality: matched, skipped, failed

**Exclude:**
- Storing raw PDF files in Supabase storage
- Creating new person records (use existing people only)
- Web upload UI ingestion (local CLI only)

## Success criteria

- 485 PDFs processed: matched, skipped (reported by filename), or failed
- All matched PDFs written to `person_attributes` without duplication
- Dry-run output matches production ingestion without data loss
- Final report: [matched count], [skipped + reason], [failed + reason], [confidence level]
- No raw PDF persistence in Supabase

## Requirements

1. Use `SUPABASE_URL` and `SUPABASE_KEY` from environment variables or CLI args.
2. Keep PDF source files in one place, preferably a dedicated local directory such as `lwyl-app/tools/pdfs/` or a referenced `reference/` folder.
3. Supply a mapping file when filename matching is uncertain:
   - JSON map from PDF filename to person UUID.
   - Use the `--map` option with `tools/ingest-all-pdfs.js`.
4. Validate with `--dry-run` before actual ingestion.
5. Preserve existing person records and avoid creating duplicate people from PDF names unless explicitly approved.

## Implementation plan

### Stage -1: Verify Before Build (PRE-INGESTION)

**Rigor checkpoint: Inspect actual data shapes and schema.**

1. Read Supabase `person_attributes` schema and sample `people` records
2. Pick one real PDF from the batch (e.g., `insights-Judy_Nunn1780794604.pdf`)
3. Extract text manually and verify:
   - 78 attributes are present and parseable
   - Attribute format matches parser regex expectations
   - Name extraction logic finds person name correctly
4. Probe one sample person record from Supabase to confirm column types and constraints
5. **Gap list** (carry forward through all stages):
   - [ ] Schema confirmed: person_attributes table is deployed
   - [ ] One PDF verified: 78 attributes extracted and parsed
   - [ ] Sample person record inspected: UUID and name format confirmed
   - [ ] Filename-to-person matching strategy validated (exact name, fuzzy, or mapping required)

**Approval gate:** Separate reviewer confirms data shapes and parsing expectations are sound before proceeding.

---

### Stage 0: Define & Scope (REQUIREMENTS)

**Output: Final approved requirements and constraints.**

Confirm with stakeholders:
- All 485 PDFs are source-of-truth for attribute ingestion (CONFIRMED: 485 files in `tools/pdfs/`)
- Do not create new people; match only to existing records (DECISION: Skip unmatched, report)
- Dry-run must be validated before production run (PROCESS: --dry-run mode mandatory)
- Result will be idempotent upserts to `person_attributes` (CONFIRMED: Supabase upsert key is `(person_id, attribute)`)

**Approval gate:** User confirms scope, gap list, and approval to proceed to Stage 1 Prepare.

---

### Stage 1: Prepare (ENVIRONMENT & TOOLING)

**Output: Ready-to-run environment with credentials and mapping.**

1. Copy `.env.example` → `.env` and fill in Supabase credentials
2. Inspect PDF folder structure and count by school/org
3. Build or update `tools/pdf-person-map.json` for any files that won't match by name
4. Validate tooling:
   - `node tools/ingest-all-pdfs.js --help` runs without error
   - `pdfjs-dist` and dependencies are installed

**Deliverable:** `.env` with credentials, optional mapping file, verified tools.

**Approval gate:** Separate reviewer confirms credentials are not leaked, tooling is ready, and prep is complete before validation run.

---

### Stage 2: Validate (DRY-RUN)

**Output: Full dry-run report with match quality and final file list.**

1. Run: `node tools/ingest-all-pdfs.js --dir ./tools/pdfs --recursive --dry-run`
2. Capture output:
   - Total PDFs scanned: [count]
   - Matched to person: [count] + person IDs
   - Skipped (no match): [count] + filenames
   - Ambiguous matches: [count] + candidate names
3. Review gaps:
   - If skipped > 10%, inspect filenames and build mapping file
   - If ambiguous, clarify with mapping or rename files
4. **Confidence label:** All dry-run matches are "signal"; production run will "confirm"

**Approval gate:** Separate reviewer grades match quality. If < 80% matched or > 5% ambiguous, return to Stage 1 and fix mapping before proceeding.

---

### Stage 3: Ingest (PRODUCTION RUN)

**Output: Ingestion log with success/failure counts and upserted row count.**

1. Run: `node tools/ingest-all-pdfs.js --dir ./tools/pdfs --recursive` (no `--dry-run`)
2. Log all output to `ingestion-run-[timestamp].log`
3. Capture:
   - Successfully ingested: [count]
   - Failed to parse or upsert: [count] + error details
   - Total rows upserted to `person_attributes`: [count]
4. **Confidence:** "Confirmed" for ingested; "Failed" for errors.

**Approval gate:** Separate reviewer confirms ingestion log shows no data loss, all counts match dry-run, and no raw PDFs were stored.

---

### Stage 4: Verify (DATA INSPECTION)

**Output: Sample queries confirming 78 attributes per person and data integrity.**

1. Query Supabase for a matched person:
   ```sql
   SELECT COUNT(*), person_id 
   FROM person_attributes 
   GROUP BY person_id 
   ORDER BY COUNT(*) DESC 
   LIMIT 5;
   ```
   Expected: Rows = 78 per person ID.

2. Sample attribute row:
   ```sql
   SELECT rank, attribute, raw_score, cluster, core_dimension 
   FROM person_attributes 
   WHERE person_id = '[sample-uuid]' 
   ORDER BY rank 
   LIMIT 5;
   ```
   Expected: Non-null scores, valid ranks 1–78, cluster and core_dimension populated.

3. Confirm no raw PDF storage in Supabase:
   ```
   Check supabase.storage buckets — no "pdfs" or "assessments" bucket created.
   ```

**Approval gate:** Separate reviewer confirms sample queries match expected schema and 78-attribute assertion.

---

### Stage 5: Document & Handoff

**Output: ICM_HANDOFF.md with decisions, gaps, next steps.**

See section "ICM Handoff Template" below.

---

## Gap List (Carry Forward)

## Gap List (Carry Forward)

- [ ] **Stage -1 Verification Complete** — One PDF parsed, schema confirmed, sample person inspected
- [ ] **Supabase migration deployed** — `person_attributes` table exists and is writable
- [ ] **Mapping file created** — If > 10% of filenames don't match existing people names
- [ ] **Dry-run > 80% matched** — If not, investigate filename patterns and build mapping
- [ ] **Zero ambiguous matches** — If ambiguous > 5%, clarify with mapping file
- [ ] **Ingestion log complete** — All success/fail counts captured
- [ ] **Sample queries verified** — 78 rows per person confirmed in 5 random samples
- [ ] **No raw PDFs stored** — Supabase storage inspection shows no "pdfs" bucket

## Notes and risks

- **Signal vs. Confirmed:** Dry-run shows what we _would_ ingest; production confirms what actually wrote.
- **Name matching fallacy:** PDF filenames like `insights-Judy_Nunn1780794604.pdf` may not match exact `people.name`. Fuzzy matching helps, but mapping file may be needed.
- **Person record requirement:** A person must exist in `people` table before ingestion. New people from PDF names are NOT created (decision: skip and report).
- **No bands yet:** The `band` column in `person_attributes` remains NULL; rank is used as proxy for percentile. Attribute bands are not parsed from PDF.
- **Idempotency risk:** Running ingestion twice on same PDF for same person is safe (upsert by `(person_id, attribute)`), but check for duplicates in Supabase before trusting.
- **Storage constraint:** Supabase project may have storage limits. Monitor ingestion for write quota errors.

## Mapping file format

If filenames don't match people names, create `tools/pdf-person-map.json`:

```json
{
  "Judy_Nunn": "0b280fe1-3ec1-47d4-8168-04dc83b01683",
  "insights-Judy_Nunn1780794604": "0b280fe1-3ec1-47d4-8168-04dc83b01683",
  "Brooke_Barron": "eb345a07-c988-4c34-90e8-febf91dc4761"
}
```

Or as array:

```json
[
  { "file": "Judy_Nunn", "personId": "0b280fe1-3ec1-47d4-8168-04dc83b01683" },
  { "file": "insights-Judy_Nunn1780794604", "personId": "0b280fe1-3ec1-47d4-8168-04dc83b01683" }
]
```

## Recommended command examples

```bash
cd /Users/truelove/Desktop/ICM/lwyl-app

# 1. Set up environment
cp .env.example .env
# Edit .env and fill in SUPABASE_URL and SUPABASE_KEY

# 2. Inspect one PDF (Stage -1 verification)
node tools/ingest-pdf-to-attributes.js ./tools/pdfs/Tallassee\ High\ School/insights-Judy_Nunn1780794604.pdf "0b280fe1-3ec1-47d4-8168-04dc83b01683"

# 3. Run dry-run (Stage 2 validation)
node tools/ingest-all-pdfs.js --dir ./tools/pdfs --recursive --dry-run 2>&1 | tee dry-run-[date].log

# 4. After approval, ingest (Stage 3)
node tools/ingest-all-pdfs.js --dir ./tools/pdfs --recursive 2>&1 | tee ingestion-run-[date].log

# 5. Verify with SQL (Stage 4)
# Use Supabase dashboard or psql to run sample queries
```

## ICM Handoff Template

When Stage 5 completes, produce this file as `lwyl-app/ICM_HANDOFF.md`:

```markdown
# ICM HANDOFF: PDF Assessment Ingestion

**Date:** [TODAY]  
**Project:** lwyl-app PDF Assessment Ingestion  
**Status:** [In Progress / Complete / Paused]

## CRITICAL RULES

- Verify before build: inspect one PDF, confirm schema, probe sample person record.
- Separate reviewer at stage boundary: each stage output is graded by clean agent.
- Never fake a number: report actual counts only.
- Signal vs. confirmed: dry-run is signal; production run confirms.
- Report by category: PDF match quality, ingestion results, data integrity.

## STAGE STATUS

| Stage | Artifact | Status | Reviewer Verdict |
|-------|----------|--------|------------------|
| -1 Verify | One PDF parsed, schema confirmed | [PASS/FAIL] | [Reviewer name] |
| 0 Scope | Requirements and gap list approved | [PASS/FAIL] | [Reviewer name] |
| 1 Prepare | .env, mapping, tooling ready | [PASS/FAIL] | [Reviewer name] |
| 2 Validate | Dry-run report: [X] matched, [Y] skipped | [PASS/FAIL] | [Reviewer name] |
| 3 Ingest | Production ingestion log with counts | [PASS/FAIL] | [Reviewer name] |
| 4 Verify | Sample queries: 78 attributes per person | [PASS/FAIL] | [Reviewer name] |
| 5 Document | This handoff | [PASS/FAIL] | [Reviewer name] |

## SOURCE OF TRUTH AND DATA FACTS

- **PDFs location:** `/Users/truelove/Desktop/ICM/lwyl-app/tools/pdfs/` (485 files, organized by school)
- **Schema:** `people` (id, name, ...) + `person_attributes` (person_id, attribute, raw_score, rank, cluster, core_dimension, band, band_source, updated_at)
- **Ingestion method:** Batch runner `tools/ingest-all-pdfs.js` with dry-run validation
- **Ground-truth check:** 78 attributes per person, no duplicates, no raw PDFs in storage
- **Confirmed:** person_attributes schema deployed, sample person record matches expected format

## OPEN GAPS (Live List)

- [ ] [Gap description, why it blocks, what closes it]

## SIGNAL VERSUS CONFIRMED

- **Signal:** Dry-run match counts (what we _would_ ingest)
- **Confirmed:** Production ingestion results + sample query verification (what actually wrote)
- **Pending:** [Any input needed to confirm a finding]

## DECISIONS MADE AND WHY

- **Do not create new people from PDF names** because existing workflow depends on pre-populated `people` table.
- **Use dry-run before every production run** to catch filename/mapping issues early.
- **Report match quality as % matched** to show data quality for stakeholders.

## EXACT NEXT STEPS

1. [Specific action for next session]
2. [Approval needed from X for Y]
3. [Follow-up verification required]

## WHAT ALMOST WENT WRONG

- [Lesson learned this session]
```
