# HANDOFF, Friction Methodology Surfacing and Deploy RCA

**Date created:** 2026-07-08
**Work performed:** session of 2026-07-02
**Author:** Claude Code (Opus 4.8, 1M context), working with Daniel Truelove
**Status:** Screens re-wired and live. The mockup-quality rework is NOT built, it is scoped and waiting on five decisions (see Section 9).

---

## 0. What this handoff is, in one line

This is the handoff for the session that (a) traced why most of the "app rebuild" was built but never reached the live app, (b) surfaced the four-source friction engine onto the real screens and shipped them, and (c) established, from Daniel's own mockups, what "good" actually looks like and why the shipped work still falls short of it. It relates to the **Love Where You Lead (lwyl-app)** friction platform, the **Innermetrix / ICM friction methodology**, and the **app-rebuild workspace**.

If you are picking this up: the engine is right and deployed, the *experience* is not. The next build is making the screens feel like the mockups in `app-rebuild/explainers/`. Do not start until Section 9 is answered.

---

## 1. The environment and topology (read first, this caused the original failure)

Two directories on the Mac under `~/Desktop/ICM/`:

- **`lwyl-app/`** — THE deploy repo. This is the git clone wired to GitHub and Vercel. The Next.js app is at the repo root (`src/`, `public/`, `next.config.ts`). **All code work happens here.**
- **`app-rebuild/`** — a WORKSPACE, not a deploy source. Its own local git repo, no remote. The deployable app copy is nested at `app-rebuild/app/` and can be STALE versus the clone. The outer folder holds `methodology/`, `explainers/`, `reviews/`, `workers/`, `Stage*.md`.

**Identifiers:**
- GitHub: `github.com/datruelovejr/lwyl-app`, branch `main`
- Vercel: project `lwyl-app` id `prj_U90Ar0nnmyTa82JbQ1bFVs0mV7jR`, team `team_AmlriM7gDmzRutpezkCb65F7` ("Daniel Truelove Jr's projects"). Push to `main` auto-deploys production.
- Supabase: project `jhmyhuetrmrqlnteflns` ("Love Where You Lead App"), status ACTIVE_HEALTHY
- Live URL: https://lwyl-app.vercel.app
- App reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Local `.env` only has the CLI vars `SUPABASE_URL` / `SUPABASE_KEY`, so a local `next build` fails at prerender with "supabaseUrl is required" unless you export the NEXT_PUBLIC names. Vercel has them, so Vercel builds fine. To validate locally:
  ```
  export NEXT_PUBLIC_SUPABASE_URL="$(grep '^SUPABASE_URL=' .env | cut -d= -f2)"
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(grep '^SUPABASE_KEY=' .env | cut -d= -f2)"
  npm run build
  ```

**Demo org:** use **Morengo District Leaders** (16 people, fully loaded, bands + all 78 attributes). Do NOT demo on the org named **"Demo"** — it has 21 people but only 1 with bands and 4 with the 78, so every new-engine screen renders empty there.

---

## 2. The RCA, why the rebuild did not reach the app

Full document: **`app-rebuild/reviews/RCA_Deployed_vs_Built.md`** (written this session). Prior corroborating doc: `app-rebuild/methodology/.../RCA_Why_It_Looks_The_Same.md`.

Root cause in one line: the rebuild defined "done" as *a correct engine proven in one demo view*, not *the app people use runs the new engine*. Every stage review graded code and the database in the workspace. No review ever opened the deployed app. So a proven engine and correct docs passed five "Pass with fixes" gates while about 90 percent of the intended screens were never built or never wired.

Contributing causes: no deploy-verification gate, deployment had no owner, all gates passed "with fixes" (none blocked), the two-workspace split (work in `app-rebuild/app/` was treated as shipped), and the Cowork sandbox could not finish `npm install && build && deploy`.

**Prevention now in force:** "done" means live in production and visible to a user. Verify the deployed URL. I now confirm every deploy reaches Vercel state READY before calling anything done.

---

## 3. The methodology, the non-negotiables

Source of truth: `app-rebuild/methodology/` and this repo's `CLAUDE.md`. The four friction types, two families:

| Type | Family | Fix | Status | Instruments |
|---|---|---|---|---|
| Difference | approach-clash | Translation | CONFIRMED from scores | DISC, Values, Attributes |
| Whose-Standard | approach-clash | Set the Standard | signal | DISC, Values |
| Competition | structural | Split Ownership | signal | DISC, Values |
| Coverage-Gap | structural | Create / Hire / Delegate | signal, External only | Attributes (all 78) |

Plus, kept SEPARATE from friction: **Retention / KRI** (undervalued self-worth), solved by leadership support, never a bridge, never on the friction score.

Hard rules: bands come from the instrument, never a flat cutoff. Coverage-gap is External only and never touches the 3 Internal attributes. Lens work (EBIB / understanding) applies to approach-clash only, never structural. Only Difference is confirmed, the rest are signals until a confirmation input fires. Never composite across instruments. Writing style in product copy: no em dashes, no semicolons, no ellipses, active voice, plain words, lead with strength.

**Manufactured Weakness (the logic behind the four moves):** a low attribute is just a blind spot, neutral. It becomes a manufactured weakness ONLY when the role demands it AND no complement covers it. So per person: Own = top External talents, and the bottom-tier External attributes route to Create Systems / Hire / Delegate as a complement system, and it stays SIGNAL until a role demand confirms it. Reframe: never "what is wrong with this person," always "what does the role demand that they do not lead with, and what covers it." Source: `app-rebuild/explainers/Manufactured Weakness.md`.

---

## 4. What shipped this session (all live on `main`, all Vercel READY)

Deploy repo `lwyl-app`, in order:

| Commit | What |
|---|---|
| `d37ce1a` | Core Attributes screen (six-dim profile, 78 by cluster and rank, four moves) copied from the workspace |
| `a50e678` | PDF ingestion pipeline for the 78 attributes (tools + migration proposal + docs), client logs and PDFs gitignored |
| `be81257` | Removed redundant `playwright` from production dependencies |
| `90cc11a` | Updated `CLAUDE.md` build-gaps to match live DB |
| `830ebd4` | (superseded) Team Insights + Dashboard method section |
| `5847b54` | Friction Map, four sources on a pair (PairDetail) |
| `4f425c3` | Core Attributes faithful port (78 dictionary `attribute-dictionary.js`, cluster map, four moves) |
| `e808766` | Leader Insights, same-pole signal per team member |
| `9f47c73` | The Method rebuilt as a four-type friction breakdown, removed the duplicated section from Dashboard and Team Insights |
| `a6b9771` | New `Core Attributes` nav page (`/app/attributes`), team read plus per-person drill-down |

Working tree is clean, `origin/main` up to date, last deploy `a6b9771` READY.

**Files created this session (in `src/app/`):**
- `utils/friction-report.js` — `teamFrictionReport(people)`, the four-type numbers for The Method
- `utils/team-attributes.js` — `teamAttributeSummary(people)`, team read of the 78
- `utils/attribute-dictionary.js` — the 78 plain-language entries, ported verbatim from the mockup DICT
- `components/TeamCoreAttributes.jsx` — the `/app/attributes` team view + person picker
- `app/attributes/page.jsx` — the route
- Rewrote `components/MethodView.jsx` and `components/CoreAttributes.jsx`
- Deleted `components/TeamMethodSection.jsx` and `utils/team-method.js` (orphaned after the Method rebuild)

**Engine files (built in the prior July 2 commit `2e3e632`, already deployed):** `utils/bands.js`, `utils/samepole.js`, `utils/coverage-gap.js`, `utils/strengths.js`, `utils/attr-tiers.js`. These are correct and reviewed. Do not rewrite them, reuse them.

---

## 5. Current state of the live app (what each screen does now)

Nav (left sidebar): Dashboard, The Method, Core Attributes, Leader Insights, Team Insights, Friction Map, Retention Risk, plus Bridge Wizard, Agreements, Upload, Settings.

- **The Method** (`/app/method`) — a friction breakdown by type built to `Tallassee_Friction_Breakdown.html`: a priority banner ranking the five reads, then one card per type (what it is / how much you have / why it matters / how you solve it) plus a confidence line, retention kept separate, a "what blocks certainty" footer. Numbers computed by `friction-report.js`.
- **Core Attributes** (`/app/attributes`) — team read on top (what the team is built to do well, strength by cluster, where it runs thin) plus a person picker that renders the full per-person 78 (`CoreAttributes.jsx`: sortable/filterable table, click-a-row dictionary, cluster map, four moves).
- **Friction Map** (`/app/friction`) — pair detail now shows all four sources (distance stories plus competition, whose-standard, and shared coverage hole).
- **Leader Insights** (`/app/leader`) — per-member "both high" same-pole signal in the friction list.
- The per-person Core Attributes also still lives in a person's profile → "Core Attributes" tab.

---

## 6. The real gap, why Daniel is not satisfied

The engine and the numbers are right. The EXPERIENCE is not. Daniel reviewed the mockups and made clear the shipped screens are dry data breakdowns, not the interpreted, brand-skinned, blame-free reads his mockups show. Specifics he called out:

- The Method "serves no purpose, provides 0 valuable insights."
- Internal jargon leaked to the UI ("no same-pole positions").
- The section was duplicated across pages (now removed).
- "Preference tax" language from the old model still shows on Dashboard, Leader, Friction.
- The four-move cards are wrong: they dump the same gap list into both Create Systems and Hire, carry no manufactured-weakness reframe, and no role-demand gate.

---

## 7. What "good" is (established from Daniel's mockups, the target for the next build)

Source files, all in `app-rebuild/explainers/`:
- `Dashboard_PhaseA.html` — the Team Friction dashboard
- `Dashboard_PhaseB.html` — the live interpretation engine
- `Friction_Explainer_LWYL.html` — the client-facing teaching module
- `core-attributes-mockup.html` — the per-person 78 and four moves
- `Tallassee_Friction_Breakdown.html` — the by-type report shape (The Method is built to this)
- `Manufactured Weakness.md` — the logic behind the four moves

The shared DNA:
1. **Interpreted, never a data dump.** Every screen opens with ONE peak insight in plain, warm, blame-free voice ("Three of your people are quietly reaching for the same chair") followed by "what to do about it." Understandable in under 60 seconds. Ends on a human note ("Your team is not broken").
2. **The four types are the spine**, each routed to its named fix, each labeled confirmed vs signal.
3. **Team Friction dashboard (Phase A):** the one peak, a "Look by Instrument or Kind" lens toggle, three instrument glances (a DISC centroid map, a Values wheel, an Attributes coverage bar) each an interpreted visual with a so-what line, and drill-down slide-over sheets with a Daniel-voice lead plus the specific people/pairs and severity.
4. **Interpretation engine (Phase B):** the read rewrites itself live as you change the slice (whole team, a subgroup, after a hypothetical hire, a school, a district). Auto-narrative what/how/why/where plus fix.
5. **Manufactured Weakness** drives the four moves (Section 3).
6. **Brand skin:** cream `#FAFAF8`, gold `#C8A96E`, Fraunces display + DM Sans. Current app uses generic styling.
7. **Friction Explainer** is a separate client-facing teaching module (triad, interactive blind-spot demo, four-kind accordion, blame-free).

---

## 8. Data reality (verified against Supabase, project `jhmyhuetrmrqlnteflns`)

- 419 people total. Migrations for `person_attributes` and `disc_values_bands` are APPLIED (not just proposals). `person_attributes` holds 31,044 rows, 398 people times 78.
- DISC and Values bands populated for 395 of 419. Per-attribute `band` column is NULL for every row, the app uses the clarity tiers (talent 8+, low below 6.5) as a stand-in.
- `assessment_token` and `rawscores_url` columns exist but are EMPTY, so pulls are not repeatable yet.
- No one is flagged `is_leader` in the DB. The leader is chosen in-app (localStorage), so for Leader Insights the demo user must set a leader in Settings.
- Morengo District Leaders, 16 people, all with bands and the 78. The Method shows: Whose-Standard 94 percent (15 of 16 high on the process/standard drive), Competition 56 percent (9 of 16 high on the leadership-seat drive, driven by Political not DISC D).
- Example person, Amber Matthews (`c71f4a43-13d5-4b7f-8213-7803943c4e69`): External attributes route to Own = 2 talents (Concrete Organization 8.8, Practical Thinking 8.8), 16 low External that feed Create/Delegate/Hire, plus Internal that never routes.
- TO VERIFY before building the coverage glance: that Morengo people carry the External rollups WITH bias (`person.attr.ext` with `bias`) that the Phase A coverage read needs. They have bands and the 78, bias field on the rollups is unconfirmed.

---

## 9. Open decisions, the build is blocked on these five answers

1. **Priority for the meeting:** which one must nail the mockup, the Team Friction dashboard (Phase A), or the per-person Core Attributes with the manufactured-weakness routing, or the overall feel on a couple of screens?
2. **Brand skin:** adopt the mockups' cream/gold/Fraunces skin, and if so app-wide or just the new screens, or match the current app system?
3. **Team Friction vs The Method:** is "Team Friction" a rebuild/rename of The Method, or a new screen alongside it?
4. **Depth for v1:** build the real instrument visuals (DISC map, Values wheel, coverage bars) and the live-slice engine (Phase B) now, or is the peak plus four-type drill-downs in the right voice enough for v1 with visuals and slicing as a fast-follow?
5. **Voice:** is there a copy/voice guide for "Daniel's voice," or write to the tone in the mockups?

---

## 10. Known issues and caveats

- "Preference tax" (the per-person environment/adaptation cost) still appears on Dashboard, Leader Insights, Friction Map. It is a different concept from friction between people. Decision pending: remove, rename, or keep as a separate personal read.
- The four-move cards in `CoreAttributes.jsx` need the manufactured-weakness rework (role-demand gate, distinct Create vs Hire, no duplicate lists).
- No brand skin yet, screens use the app's existing generic components.
- The per-attribute band is NULL for all rows, so all high/low attribute calls use the clarity-tier stand-in, not a true instrument band. Correct per methodology for now, flag when norms load.
- Local `next build` needs the NEXT_PUBLIC env exported (Section 1).

---

## 11. Exact next steps

1. Daniel answers the five questions in Section 9.
2. Verify Morengo `person.attr.ext` carries `bias` (Section 8).
3. Build to the chosen priority, in the mockup voice and skin, reusing the existing engine utils. Deploy incrementally, one screen per commit, and confirm each reaches Vercel READY before moving on.
4. Resolve the "preference tax" decision.
5. Rework the four-move cards to the Manufactured Weakness model.

---

## 12. Pointers

- RCA: `app-rebuild/reviews/RCA_Deployed_vs_Built.md`
- Mockups and source of truth: `app-rebuild/explainers/`
- Methodology: `app-rebuild/methodology/` and this repo `CLAUDE.md`
- Engine utils: `src/app/utils/{bands,samepole,coverage-gap,strengths,attr-tiers,friction-report,team-attributes}.js`
- This handoff: `HANDOFF-2026-07-08-friction-methodology-surfacing.md` (repo root)
