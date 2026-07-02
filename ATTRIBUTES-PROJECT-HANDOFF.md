# ICM Attributes Project — Handoff for Cowork

**Date:** 2026-06-14
**Project:** Love Where You Lead (lwyl-app) — the 78 Core Attribute capability layer
**Status:** Retrieval (ingestion) complete. Display and Utilization not yet built.
**Source of truth:** `lwyl-app/methodology/` — build to it, do not improvise it.

---

## 1. One-paragraph description (refined)

> This ICM project builds the **capability layer** of Love Where You Lead: it retrieves each
> person's 78 Innermetrix Core Attributes (their ranked **talents and gifts**), stores them so
> they can be read by cluster and rank, surfaces them per person and per team, and turns them
> into action through the methodology's **coverage-gap** analysis — which, when a needed
> capability is missing, routes to exactly one of three fixes: **Create Systems, Delegate, or
> Hire Talent.** The same attribute data also becomes a **selection signal for hiring** (the
> candidate who supplies the missing capability closes the gap) and a **delegation map** (who
> already carries a strength so work can be routed to them).

**Why this is sharper than the first draft.** "Creating, delegation, and hiring" is not a loose
list of use cases — it is the methodology's **named triad of fixes** for a confirmed coverage-gap
(`methodology/Coverage_Gap_Rule.md`: *"A confirmed gap routes to Create Systems, Hire Talent, or
Delegate."*). Framing the project around that triad keeps Cowork building to the methodology.
"Talents and gifts" = a person's **top-ranked attributes** (their strengths); the project is as
much about routing those strengths (delegation) as about filling their absence (create/hire).

---

## 2. What "talents and gifts" actually are — the data

Every person who completed the Innermetrix **ADVanced Insights / Attribute Index** assessment has
**78 Core Attributes**, each with a raw score (0–10) and a **rank 1–78** (the person's own ordering
of strengths — rank 1 is their single strongest capability). The 78 roll up into **six core
dimensions**, split Internal vs. External:

| Cluster (label) | Core dimension | Family | # attributes |
|---|---|---|---|
| Heart | Empathy | **External** | 17 |
| Hand | Practical Thinking | **External** | 12 |
| Head | Systems Judgment | **External** | 8 |
| Self-Esteem | Self-Esteem | **Internal** | 8 |
| Role Awareness | Role Awareness | **Internal** | 11 |
| Self-Direction | Self-Direction | **Internal** | 22 |

- **External (Heart/Hand/Head)** = capabilities the team draws on — *these* drive coverage-gap,
  delegation, and hiring.
- **Internal (Self-Esteem / Role Awareness / Self-Direction)** = how a person relates to
  themselves. **Never used for coverage-gap, delegation, or hiring decisions** — a shared-low
  Internal is a personal-development / retention signal (a KRI), not a team gap. You cannot
  delegate someone's self-esteem. Keeping this boundary intact is a hard rule.

The full 78→cluster→dimension map is `lwyl-app/tools/attribute-catalog.js` (verified against the
psychometric validator). This is the reference table that lets a "talent" roll up correctly.

---

## 3. RETRIEVE — done ✅

The 78 attributes were **never stored** originally (only the six rollups were), which blocked
everything downstream. They have now been ingested from the original Innermetrix Attribute Index
report PDFs into a normalized table.

**Current live state (Supabase project `jhmyhuetrmrqlnteflns`, table `person_attributes`):**

- **398 people** loaded, **31,044 attribute rows = exactly 78 per person, zero off-78.**
- 395 of 485 source PDFs ingested (365 by exact name match + 30 by gate-based disambiguation).
- The six-dimension rollup in `people.attributes` and the DISC/Values bands
  (`people.disc_bands`, `people.values_bands`) are written from the same verified read.

**How retrieval is kept honest (the gates):**

1. **Rank is read from the "Core Attribute List" page**, not document order — so rank 1 truly is
   the person's top strength.
2. **Six-dimension verification gate** — before writing a PDF's 78 to a person, the parsed six
   dimensions must match that person's already-stored rollup. A mismatch means wrong-person or
   bad parse → **it refuses to write.** Never a guessed or mis-attributed load.
3. **Matching is exact name, explicit mapping, or gate-disambiguation only** — no fuzzy guessing.
   When a name was double-entered in `people` (16 names, real distinct people sharing a name),
   the gate parses the PDF's dimensions and routes it to the one record whose stored rollup
   matches — writing only when exactly one matches.

**Still NOT loaded (90 PDFs — all by design, none are silent failures):**

- **64 DISC Plus reports** (Alabama Administrative Assistants cohort) — these reports have **no
  Attribute Index**, so there are no 78 to parse. Owner pulling them separately.
- **24 no-match** — the person has **no `people` record** (mostly West Alabama Chamber, plus a
  few Stillman/Tallassee Elementary). Decision: **never create a person from a PDF name**, so
  these wait until records exist.
- **1 unresolved (`Tessie_Williams.pdf`)** — two `people` records with byte-identical rollups
  and only one PDF; the gate cannot pick one. Needs an **owner record-merge decision**, not a guess.
- **1 verify-failed (`Kalvin_Eaton.pdf`)** — a different person (Marengo) from the Kalvin Eaton
  who owns the single record (Stillman). Correctly refused.

Tooling: `tools/ingest-all-pdfs.js` (batch runner, dry-run + disambiguation),
`tools/ingest-pdf-to-attributes.js` (single-PDF parser + gate). Run history:
`ingestion-run-2026-06-08.log`. Full narrative: `ICM-PDF-Ingestion.md`.

---

## 4. DISPLAY — to build

The data now supports two read levels. Neither view exists in the app yet; this is the next build.

**Per person — "talents and gifts" card.** A person's **top-ranked External attributes** are their
strengths to feature; their lowest are blind spots. Show rank, attribute name, cluster, and the
six-dimension rollup. (Bands are not yet stored — see gap below — so display rank/percentile-proxy,
not a "High/Low" band word, until norms land.)

**Per team — capability coverage.** For a demanded cluster, show the **share of the team that
clears the bar**; below **40%** the capability is effectively absent at the group level. Always
read **by cluster and rank, never by a single raw score** (the 78 are noisier than the six
dimensions — the six give the faster, more reliable read; the 78 give the detail).

---

## 5. UTILIZE — the methodology (to build)

This is the "creating, delegation, and hiring" half, stated precisely. It runs through
**coverage-gap**, the one friction type that needed the 78 (now unblocked).

**The chain (`methodology/Coverage_Gap_Rule.md`):**

1. **Signal** — scores flag a shared-low capability, or a team below the 40% threshold on a
   cluster. *External only.*
2. **Required?** — does the role/shared work actually call for this capability? Answered by the
   **role-demand reference**.
3. **Uncovered?** — does no person, system, or delegate already supply it? The **complement check**.
4. **Verdict** — a real coverage-gap exists only when **required AND uncovered** are both true.
5. **Fix** — route to the named missing capability's solve:
   - **Create Systems** — for a *capability/behavior* gap: build a checklist, cadence, or process.
   - **Delegate** — assign someone who already carries the strength (this is where each person's
     ranked talents become a routing map).
   - **Hire Talent** — bring in the missing capability; the candidate who supplies it closes the
     gap. **Coverage-gap used as a selection signal.**

**The kind of gap shapes the fix:** *capability* gap (no one can) → system/hire/delegate;
*drive* gap (no one is motivated) → assign accountability / hire for the motivation; *behavior*
gap (no one naturally does it) → name the role + build cadence.

**Two honesty gates Cowork must respect (do not overclaim):**

- Coverage-gap is a **signal, not a confirmed verdict**, until **two inputs exist that are still
  unbuilt**: (a) the **role-demand reference** (maps a role to the capabilities it requires — until
  it exists, "required" is a judgment, not a lookup), and (b) **instrument bands & norms** (so
  "clears the bar" is the validated band, not a flat cutoff). Label every hiring/delegation output
  **signal vs. confirmed** accordingly.
- The **40% threshold** is borrowed from existing TeamInsights logic and is **not yet validated
  against outcomes**.

---

## 6. Data model

```
person_attributes                         people (existing, relevant cols)
  person_id   uuid  → people(id)            id            uuid
  attribute   text  one of the 78            attributes    jsonb  (six-dim rollup: ext[3], int[3])
  raw_score   numeric  0–10                  disc_bands    jsonb  (DISC band words)
  rank        int   1–78 (person's own)      values_bands  jsonb  (Values band words)
  cluster     text  Heart/Hand/Head/…
  core_dimension text  Empathy/…
  band        text  NULL for now (norms not stored)
  band_source text  'unparsed' until norms land
  updated_at  timestamptz
  primary key (person_id, attribute)
```

Migration: `add_disc_values_bands` (applied). `attribute_catalog` reference lives in code
(`tools/attribute-catalog.js`).

---

## 7. Non-negotiable rules (from `lwyl-app/CLAUDE.md`)

1. **Bands come from the instrument, never a flat cutoff.** Missing band → store NULL with a
   `band_source` tag, never a guessed value.
2. **Coverage-gap needs all 78 and is External only.** Read by cluster and rank, never a single
   raw score; never touch the three Internal dimensions.
3. **Signal vs. confirmed.** Only "Difference" friction is confirmed from scores. Coverage-gap
   (and competition, whose-standard) are signals until their confirmation input fires.
4. **Internal stays separate from External.** Internal = retention signal (KRI), not friction,
   not coverage-gap.
5. **Verify before you build.** Confirm data shape in the real DB before writing logic.
6. **Do not fabricate; no production changes without approval.** Missing data is reported, not
   filled. Schema changes and backfills need explicit sign-off and a one-person test.

A rigor pair exists in `.claude/skills`: `orgharmony-psychometric-validator` and
`blindspot-reviewer` — run them on any methodology-touching change before delivering.

---

## 8. Open gaps & exact next steps

| # | Gap | Blocks | What closes it |
|---|---|---|---|
| 1 | **Role-demand reference** does not exist | Confirmed coverage-gap; "required" is a judgment | Build the role→required-capabilities map (`Coverage_Gap_Data_Plan.md` §4) |
| 2 | **Bands & norms** not stored (`band` is NULL) | "Clears the bar" is a flat cutoff, not the validated band | Source Innermetrix norms; backfill `band`/`band_source` |
| 3 | **Display** (per-person + per-team) not built | Nobody can see talents/gifts or team coverage | Build the two views in §4 |
| 4 | **Coverage-gap query** not built | The utilize chain in §5 | Write the by-cluster-and-rank read + 40% team logic |
| 5 | 90 PDFs unloaded (§3) | Full population | 64 DISC Plus (owner), 24 need records, Tessie merge, Kalvin is a true mismatch |
| 6 | No leader flag; tokens/rawscores URLs not stored | Repeatable re-pulls; Leader-Team friction | Capture leader flag + `assessment_token`/`rawscores_url` on `people` |

**Recommended order:** (1) build the role-demand reference for one small org as a test
(Tallassee Central Office, 13 people, is smallest) → (2) build the coverage-gap query → (3) run it
on that org → (4) build the display views → (5) source bands/norms → (6) backfill the rest.

---

## 9. File map for Cowork

| Need | File |
|---|---|
| Project rules (read first) | `lwyl-app/CLAUDE.md` |
| The 78→cluster→dimension map | `lwyl-app/tools/attribute-catalog.js` |
| Why the 78 matter + storage plan | `lwyl-app/methodology/Coverage_Gap_Data_Plan.md` |
| When a gap is real + the fix triad | `lwyl-app/methodology/Coverage_Gap_Rule.md` |
| Full friction methodology | `lwyl-app/methodology/Friction_Methodology.md` |
| Ingestion design & state | `lwyl-app/ICM-PDF-Ingestion.md` |
| Ingestion tooling | `lwyl-app/tools/ingest-all-pdfs.js`, `tools/ingest-pdf-to-attributes.js` |
| Last run log | `lwyl-app/ingestion-run-2026-06-08.log` |
