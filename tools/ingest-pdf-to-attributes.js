/**
 * Idempotent ingestion script: PDF -> person_attributes
 *
 * Usage (from lwyl-app root):
 *   node tools/ingest-pdf-to-attributes.js <path-to-pdf> <person-uuid> <supabase-db-url>
 *
 * Example:
 *   node tools/ingest-pdf-to-attributes.js ./sample.pdf "123e4567-e89b-12d3-a456-426614174000" "postgresql://user:pass@host/db"
 *
 * This script:
 *   1. Extracts text from the PDF
 *   2. Parses the 78 Core Attributes with scores and bands
 *   3. Upserts rows into person_attributes (idempotent)
 *   4. Logs progress and any errors
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { extractTextFromPDF } from '../src/app/utils/pdf.js';
import { parseAttributes78, parseValuesBands, parseDISCBands, extractPersonName } from './pdf-parser-enhanced.js';
import { ATTRIBUTE_CATALOG, buildAttributeMap } from './attribute-catalog.js';

const attributeMap = buildAttributeMap();

/**
 * Main ingestion flow
 */
async function ingestPdfToAttributes(pdfPath, personId, supabaseUrl, supabaseKey) {
  console.log(`\n=== Ingestion Start ===`);
  console.log(`PDF: ${pdfPath}`);
  console.log(`Person ID: ${personId}`);

  // Step 1: Read and extract text from PDF
  console.log('\n[1/5] Extracting text from PDF...');
  let pdfBuffer;
  try {
    pdfBuffer = fs.readFileSync(pdfPath);
  } catch (err) {
    console.error(`ERROR reading PDF: ${err.message}`);
    process.exit(1);
  }

  let pageTexts;
  try {
    const result = await extractTextFromPDF(pdfBuffer);
    pageTexts = result.pageTexts;
  } catch (err) {
    console.error(`ERROR extracting text from PDF: ${err.message}`);
    process.exit(1);
  }

  const fullText = Object.values(pageTexts).join('\n\n');
  console.log(`Extracted ${Object.keys(pageTexts).length} pages.`);

  // Step 2: Parse attributes, bands, and metadata
  console.log('\n[2/5] Parsing attributes and bands...');
  const personName = extractPersonName(fullText);
  const attributes78 = parseAttributes78(fullText);
  const valuesBands = parseValuesBands(fullText);
  const discBands = parseDISCBands(fullText);

  console.log(`Found ${personName ? `person: ${personName}` : 'unknown person'}`);
  console.log(`Found ${attributes78.length} attributes (target: 78)`);
  console.log(`Found ${Object.keys(valuesBands).length} Values bands`);
  console.log(`Found ${Object.keys(discBands).length} DISC bands`);

  if (attributes78.length === 0) {
    console.error('ERROR: No attributes found in PDF. Check PDF format.');
    process.exit(1);
  }

  // Step 3: Build row objects for ingestion
  console.log('\n[3/5] Building rows for person_attributes...');
  const rows = [];
  for (const attr of attributes78) {
    const catalogEntry = attributeMap.get(attr.attribute);
    if (!catalogEntry) {
      console.warn(`WARN: Attribute "${attr.attribute}" not in catalog, skipping.`);
      continue;
    }

    rows.push({
      person_id: personId,
      attribute: attr.attribute,
      raw_score: attr.rawScore,
      rank: attr.rank,
      cluster: catalogEntry.cluster,
      core_dimension: catalogEntry.core_dimension,
      band: null, // Bands for attributes come from ranks, not directly parsed (for now)
      band_source: 'pdf-parsed',
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`Built ${rows.length} rows for ingestion.`);

  // Step 4: Connect to Supabase and upsert
  console.log('\n[4/5] Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n[5/5] Upserting rows...');
  const { data, error } = await supabase
    .from('person_attributes')
    .upsert(rows, { onConflict: 'person_id,attribute' });

  if (error) {
    console.error(`ERROR upserting: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  console.log(`SUCCESS: Upserted ${rows.length} rows.`);

  // Step 5: Verify the insert
  console.log('\n[Verification] Checking inserted rows...');
  const { data: inserted, error: verifyError } = await supabase
    .from('person_attributes')
    .select('rank, attribute, raw_score, cluster, band_source')
    .eq('person_id', personId)
    .order('rank', { ascending: true });

  if (verifyError) {
    console.error(`ERROR verifying: ${verifyError.message}`);
  } else {
    console.log(`\nVerified ${inserted.length} rows in database.`);
    console.log('\nFirst 5 rows:');
    inserted.slice(0, 5).forEach(row => {
      console.log(`  Rank ${row.rank}: ${row.attribute} (score: ${row.raw_score}, cluster: ${row.cluster})`);
    });
    console.log('\nLast 5 rows:');
    inserted.slice(-5).forEach(row => {
      console.log(`  Rank ${row.rank}: ${row.attribute} (score: ${row.raw_score}, cluster: ${row.cluster})`);
    });
  }

  console.log('\n=== Ingestion Complete ===\n');
}

/**
 * Parse command-line arguments and run ingestion
 */
async function main() {
  const [, , pdfPath, personId, supabaseUrl, supabaseKey] = process.argv;

  if (!pdfPath || !personId || !supabaseUrl) {
    console.error('Usage: node tools/ingest-pdf-to-attributes.js <pdf-path> <person-uuid> <supabase-url> [supabase-key]');
    console.error('Example: node tools/ingest-pdf-to-attributes.js ./sample.pdf "123e4567..." "https://..." "eyJ..."');
    console.error('\nIf supabase-key is not provided, SUPABASE_KEY env var will be used.');
    process.exit(1);
  }

  const key = supabaseKey || process.env.SUPABASE_KEY;
  if (!key) {
    console.error('ERROR: Supabase key not provided. Set SUPABASE_KEY env var or pass as argument.');
    process.exit(1);
  }

  try {
    await ingestPdfToAttributes(pdfPath, personId, supabaseUrl, key);
  } catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ingestPdfToAttributes };
