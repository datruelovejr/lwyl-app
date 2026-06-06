# Capturing the 78 Attributes, so Coverage-Gap Can Run Right

**Date:** June 6, 2026.
**Why this exists:** Coverage-gap reads the full 78 Core Attribute List by cluster and rank. The database stores only the six rollup dimensions, Heart, Hand, Head, Self-Esteem, Role Awareness, Self-Direction. So coverage-gap cannot run, and any "no gap" claim off the six is false. This is the plan to fix that.

---

## 1. What I verified in the live database

- Every one of 418 people has an `attributes` field with exactly six items, three external and three internal. No 78. Confirmed by query.
- The `people` table has no assessment token and no rawscores URL. The `organizations.assessment_url` is empty for all seven target orgs.
- So the 78 are not in the system and not recoverable from the system. They must be re-pulled from the original Innermetrix source.

---

## 2. Where the 78 actually live

The Innermetrix Attribute Index holds the full ranked attribute list per person. There are two ways to get it.

**Source A, the rawscores API, best for repeatability.** Innermetrix exposes a raw-scores endpoint that returns the full individual attribute set per assessment, the codebase analysis documents it as `results.attributes`, the complete attribute library, retrieved per assessment token. This is how an enterprise integration pulls the data without a human reading a report.

- Needs, Dr. Truelove's Innermetrix practitioner or API access, and each person's assessment token or ID.
- One caveat to reconcile, the raw feed is documented at 77 attributes, the methodology uses a 78 Core Attribute List. Confirm the exact roster and the one-item difference during ingestion, do not assume.

**Source B, the report PDFs, the fallback.** Each person's Attribute Index report lists the 78 ranked. If the API or the tokens are not available, the 78 can be parsed from the PDFs. Slower and more manual, but it works.

Either way, this is your data and your Innermetrix account, so this step needs your credentials and your go. I cannot reach Innermetrix from here.

---

## 3. How to store them, so the read runs by cluster and rank

The methodology reads the 78 by cluster and rank, never by a single raw score. The storage should make that natural.

**Recommended, a normalized table.**

```
person_attributes
  person_id   uuid    references people(id)
  attribute   text    one of the 78 names
  raw_score   numeric
  rank        int     1 to 78 within the person
  cluster     text    which core dimension or cluster it rolls up to
  band        text    the instrument band, once norms are available
  primary key (person_id, attribute)
```

Seventy-eight rows per person. This lets coverage-gap query by cluster and by rank directly, which the JSONB blob cannot do cleanly.

**Plus, make the pull repeatable.** Add to `people`, `assessment_token text` and `rawscores_url text`, so the data can be re-pulled and refreshed instead of pulled once and lost, which is exactly what happened the first time.

**Plus, a small reference table.** `attribute_catalog(attribute, cluster, core_dimension)` maps each of the 78 to its cluster and to the six core dimensions, so the read can roll the 78 up correctly. Define it once from the Innermetrix library.

Keep the existing six-dimension rollup as is, it still drives the difference and Internal reads. The 78 sit alongside it, they do not replace it.

---

## 4. Then coverage-gap runs the right way

With the 78 in place, the read the methodology specifies becomes possible.

1. For a team, read each demanded capacity by cluster and rank across the members, not by one raw score.
2. A team coverage-gap fires when fewer than 40 percent of the team clear the bar on a demanded cluster, External only, never the Internal three.
3. Gate it on a real role demand, which capacities the role actually requires, the role-demand reference still to be built.
4. The fix follows, Create Systems, Hire Talent, or Delegate, against the named missing capacity.

Two inputs still gate a confirmed read even after the 78 land, the instrument bands and norms, and the role-demand reference. Both are already on the Stage 07 build list.

---

## 5. What I can do, and what needs you

**I can, on your go,** write the migration SQL for the new table and columns, write the ingestion spec that maps a rawscores pull into `person_attributes`, and write the coverage-gap query that reads by cluster and rank, ready to run the moment the data is loaded.

**You need to provide,** Innermetrix API access or the report PDFs, and approval to change the production schema. I will not alter the live database or pull from Innermetrix without that.

**Order of work.** Confirm the 78 roster and source. Add the schema. Pull and load the 78 for one org as a test, Tallassee Central Office is smallest at 13. Run the coverage-gap read on that org. Then backfill the rest.

---

## 6. The honest bottom line

Coverage-gap is the one friction type we currently cannot measure on real data, because the data was never stored. Every other type ran. Fixing this is a data-capture job, not a methodology change, and it is the highest-priority item to make the friction analysis complete and trustworthy end to end.
