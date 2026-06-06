# Claude Code Brief, Pull the 78 Core Attributes and Bands

Paste everything below the line into Claude Code, run from the lwyl-app repo.

---

## Your job

Capture the full Innermetrix Attribute Index for every assessed person, all 78 Core Attributes with their scores and ranks, plus the validated band per dimension, and store them in Supabase so the friction engine can run coverage-gap by cluster and rank and run every high-low call off real bands. Today the database stores only the six rollup dimensions and no bands, which makes coverage-gap impossible and forces a flat-cutoff fake for bands.

## Context, what is true now

- Repo, datruelovejr/lwyl-app, Next.js with Supabase. Data layer at src/lib/supabase.js, friction at src/app/utils/friction.js, seed at src/app/constants/data.js, schema at supabase-schema.sql.
- Supabase project, Love Where You Lead App, ref jhmyhuetrmrqlnteflns. The people table stores attributes as JSONB with only ext (Heart, Hand, Head) and int (Self-Esteem, Role Awareness, Self-Direction), six items. No 78. No band. No assessment token. No rawscores URL.
- A prior codebase analysis documented an Innermetrix raw-scores endpoint of the form GET https://profiles.innermetrix.com/remote/AI/{token}/rawscores/ returning results.attributes, the full individual attribute set, documented at about 77 items. Treat this as a lead to verify, not a fact to trust.

## Step 1, verify the source before building anything

Do not assume the endpoint, the auth, or the field shape. First confirm all of it.

- Search the repo and any Innermetrix integration code for how assessments are launched and retrieved, the real endpoint, the auth method, and where the per-person token or assessment ID lives.
- Confirm whether the raw-scores response actually contains all 78 Core Attributes, and whether it carries bands or only raw scores. If it carries only raw scores, find where the band comes from, the per-dimension norm tables or the report, because bands must come from the instrument, never from a flat numeric cutoff.
- Reconcile the count. The raw feed is documented at 77, the methodology uses a 78 Core Attribute List. Identify the exact roster and the one-item difference. Do not proceed on a guess.
- Report back what you found before writing the schema or the ingestion. If a piece is missing, for example the tokens were never stored, say so and propose how to map each person back to their Innermetrix assessment.

## Step 2, design the storage, show me before applying

Propose a migration, do not apply it to production until I approve.

- New table person_attributes, columns person_id references people(id), attribute text, raw_score numeric, rank int within the person, cluster text mapping to the core dimension, band text. Primary key person_id plus attribute. 78 rows per person.
- Add to people, assessment_token text and rawscores_url text, so the pull is repeatable and never lost again.
- New reference table attribute_catalog, attribute, cluster, core_dimension, defined once from the Innermetrix library, so the 78 roll up correctly.
- Add band storage for the seven Values and the DISC dimensions too, sourced from the instrument norms, since bands are needed for the same-pole reads as well, not only attributes.
- Keep the existing six-dimension rollup as is. The 78 sit alongside it, they do not replace it.

## Step 3, build the ingestion

- Write a script that, given a person and their token, pulls the raw scores, extracts all 78 attributes with score and rank, attaches the cluster from attribute_catalog and the band from the norm source, and upserts into person_attributes. Idempotent, safe to re-run.
- Pull the bands for DISC and Values the same way and store them.
- Log every person processed and every failure. Never silently drop a record. Never write a guessed value, if a band or attribute is missing, mark it missing.

## Step 4, test small, then backfill

- Run the full pull for one org first, Tallasee Central Office, 13 people, the smallest.
- Verify, every person has 78 rows, ranks are 1 to 78 with no duplicates, clusters are populated, and bands are present and come from the instrument.
- Show me the result for one person end to end before backfilling the rest.
- Then backfill all orgs.

## Step 5, expose it to the engine

- Write the coverage-gap query that reads person_attributes by cluster and rank, External clusters only, and flags a team gap when fewer than 40 percent clear the bar on a demanded cluster. Gate it on a role-demand reference, note that input if it does not exist yet.
- Replace the flat valLevel band logic in the app with the stored instrument bands.

## Hard constraints

- Verify, do not assume. Confirm the endpoint, the auth, the field shape, and the band source from the real code and account before building.
- Bands come from the instrument's validated per-dimension norms, never from a universal numeric cutoff. A 48 can be High on one value and a 49 Average on another.
- Do not alter the production schema or run a backfill without my explicit approval. Show me the migration and the one-person test first.
- Do not fabricate. If something is missing, report it and stop, do not fill it with a plausible value.
- Keep the six-dimension rollup intact.

## What I will provide

- Innermetrix practitioner or API access, the credentials to retrieve raw scores.
- Confirmation of the endpoint and auth once you have identified the candidate.
- The token-to-person mapping if the app never stored tokens.
- Approval for the schema migration and the backfill, after I see the test.

## Definition of done

- person_attributes holds 78 attributes per assessed person, with score, rank, cluster, and band.
- DISC and Values bands are stored from the instrument norms.
- The pull is repeatable, tokens and URLs are stored.
- The coverage-gap query runs by cluster and rank on real data.
- The flat valLevel cutoff is retired.
