# Person Attributes Ingestion from PDF

## Overview

This toolset enables extracting all 78 Core Attributes from Innermetrix Attribute Index report PDFs and loading them into Supabase for friction methodology analysis.

## Components

- **`attribute-catalog.js`** — Reference table mapping the 78 attributes to clusters and core dimensions. Used by all parsers.
- **`pdf-parser-enhanced.js`** — Enhanced PDF text parsing for extracting all 78 attributes, bands, and metadata from report PDFs.
- **`ingest-pdf-to-attributes.js`** — Idempotent ingestion script; reads a PDF, parses attributes, and upserts into `person_attributes` table.
- **`supabase-migration-person-attributes.sql`** — Database schema migration (proposal only, do not apply without approval).

## Quick Start

### 1. Review the Migration (Proposal)

The migration adds two columns to `people` and creates `person_attributes` table:

```bash
cat supabase-migration-person-attributes.sql
```

**Status:** Proposal only. Do not apply until reviewed and approved.

### 2. Test with One PDF

Prepare:
- A sample Innermetrix report PDF for one person.
- Their UUID from the `people` table.
- Supabase connection credentials (URL and service role key).
- A local `.env` file copied from `../.env.example` for convenience.

Run the ingestion:

```bash
export SUPABASE_URL="https://jhmyhuetrmrqlnteflns.supabase.co"
export SUPABASE_KEY="<your-service-role-key>"

node tools/ingest-pdf-to-attributes.js \
  /path/to/sample-person.pdf \
  "550e8400-e29b-41d4-a716-446655440000" \
  "$SUPABASE_URL" \
  "$SUPABASE_KEY"
```

Or pass the key as an env var:

```bash
export SUPABASE_KEY="<your-service-role-key>"

node tools/ingest-pdf-to-attributes.js \
  /path/to/sample-person.pdf \
  "550e8400-e29b-41d4-a716-446655440000" \
  "$SUPABASE_URL"
```

### Batch ingestion

If you want to ingest all available assessment PDFs automatically, use the batch runner:

```bash
node tools/ingest-all-pdfs.js --dry-run
```

When you are ready to ingest for real:

```bash
node tools/ingest-all-pdfs.js
```

By default the script scans the reference folder:

```bash
../friction-methodology-workspace/reference
```

To scan a different folder or a local assessment archive, pass `--dir` and optionally `--recursive`:

```bash
node tools/ingest-all-pdfs.js --dir /path/to/assessments --recursive
```

If your PDF filenames do not directly map to Supabase person UUIDs, you can provide a JSON map file:

```bash
node tools/ingest-all-pdfs.js --dir /path/to/assessments --map ./tools/pdf-person-map.json
```

The script uses the same `.env` credentials handling as the ingestion tool, so it can load `SUPABASE_URL` and `SUPABASE_KEY` from a local `.env` file.

### 3. Verify the Results

Query the ingested person's attributes:

```sql
SELECT rank, attribute, raw_score, cluster, core_dimension, band_source
FROM person_attributes
WHERE person_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY rank
LIMIT 10;
```

Expect: exactly 78 rows per person, ranks 1–78, clusters populated, band_source = 'pdf-parsed'.

## PDF Format Expectations

The ingestion script expects a standard Innermetrix ADVanced Insights report PDF with:

- **Cover page** — Person name appears in the first 20 lines (used for logging).
- **Attribute Index section** — Lists all 78 attributes, ranked, with scores.
  - Expected format: `N. Attribute Name Score` (e.g., `1. Accountability For Others 8.2`)
  - Alternative formats: comma-separated or pipe-separated rows.
- **Values section** — Band labels like "Very High", "High", "Average", "Low", "Very Low" for each value.
- **DISC section** — Spectrum band labels for each DISC dimension.

If the PDF structure differs, the parser may need adjustments (see `pdf-parser-enhanced.js`).

## What Gets Stored

For each person and attribute:

| Column | Source | Example |
|--------|--------|---------|
| `person_id` | Argument | `550e8400-e29b-41d4-a716-446655440000` |
| `attribute` | PDF | `Accountability For Others` |
| `raw_score` | PDF | `8.2` |
| `rank` | PDF | `1` (highest score = rank 1) |
| `cluster` | Catalog | `Heart` |
| `core_dimension` | Catalog | `Empathy` |
| `band` | Parsed (if available) | `NULL` (currently, use rank percentile) |
| `band_source` | Hardcoded | `pdf-parsed` |
| `updated_at` | Timestamp | `2026-06-06T18:00:00Z` |

## Idempotency

The ingestion script upserts with primary key `(person_id, attribute)`. Running the script twice on the same PDF for the same person is safe — it will update the rows, not duplicate them.

## Constraints & Limitations

1. **Bands for attributes** — Currently, attribute bands are not parsed from the PDF. The `band` column is NULL. Bands for Values and DISC are parsed but not yet stored in the schema.
2. **PDF format variation** — If an org uses a non-standard Innermetrix report format (e.g., custom competency lists), the parser may miss attributes. Check logs for "Attribute not in catalog" warnings.
3. **No API integration yet** — This pipeline uses PDFs only. To use the rawscores API endpoint, per-person assessment tokens must be obtained from Innermetrix or retrieved from existing reports.

## Common Issues

### Error: "No attributes found in PDF"

**Cause:** The PDF parser could not find lines matching the expected attribute format.

**Solution:**
1. Check the PDF opens correctly and contains the Attribute Index.
2. Examine the raw text extraction: add a debug log in `pdf-parser-enhanced.js` to print the first 50 lines of parsed text.
3. If the format is non-standard, adjust the regex patterns in `parseAttributes78()`.

### Error: "Attribute 'X' not in catalog"

**Cause:** The parser found an attribute name that doesn't match the 78 in the catalog.

**Solution:**
1. Check for typos in the parsed name vs. the catalog.
2. If a new attribute is discovered, add it to `ATTRIBUTE_CATALOG` in `attribute-catalog.js` and update the schema.

### Error: "Supabase connection failed"

**Cause:** Invalid credentials or network issue.

**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct.
2. Ensure the service role key has permissions on the `person_attributes` table.
3. Check network connectivity to Supabase.

## Next Steps

1. **Get approval** on the schema migration before applying to production.
2. **Test with one org** (Tallassee Central Office, 13 people).
3. **Verify the one-person end-to-end result**, then backfill the rest.
4. **Implement band extraction** for Values and DISC, store in schema.
5. **Build the coverage-gap query** using the 78-attribute data by cluster and rank.

## Questions?

See [methodology/ClaudeCode_Brief_Pull78_and_Bands.md](../methodology/ClaudeCode_Brief_Pull78_and_Bands.md) for the full brief and constraints.
