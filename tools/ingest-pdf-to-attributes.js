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
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { extractTextFromPDF } from '../src/app/utils/pdf.js';
import { parseAttributes78, parseDimensionalBalance, buildDimensionRecord, parseDISCBands, parseValuesBands, normalizeBias, extractPersonName } from './pdf-parser-enhanced.js';
import { ATTRIBUTE_CATALOG, buildAttributeMap } from './attribute-catalog.js';

const attributeMap = buildAttributeMap();

function loadDotenvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  console.log(`Loading environment variables from ${envPath}`);
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    let [, key, value] = match;
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotenvFile();

/**
 * Six-dimension verification gate. Compare the six core dimensions and bias
 * parsed from the PDF against the six already stored in people.attributes from
 * the same report. They must match. A mismatch means the PDF was matched to the
 * wrong person or the parse is wrong, so do not write. Returns one of:
 *   { status: 'ok' }
 *   { status: 'unverifiable', detail }  no stored rollup to check against
 *   { status: 'mismatch', detail }      stored and parsed disagree
 */
function verifySixDimensions(parsedDims, storedAttributes) {
  if (!parsedDims || parsedDims.length !== 6) {
    return { status: 'unverifiable', detail: `parsed ${parsedDims ? parsedDims.length : 0} of 6 dimensions from PDF` };
  }
  if (!storedAttributes || !Array.isArray(storedAttributes.ext) || !Array.isArray(storedAttributes.int)) {
    return { status: 'unverifiable', detail: 'person has no stored six-dimension rollup' };
  }
  const stored = [...storedAttributes.ext, ...storedAttributes.int];
  if (stored.length !== 6) {
    return { status: 'unverifiable', detail: `stored rollup has ${stored.length} of 6 dimensions` };
  }
  const mismatches = [];
  for (let i = 0; i < 6; i++) {
    const p = parsedDims[i];
    const s = stored[i];
    const sScore = typeof s.score === 'number' ? s.score : parseFloat(s.score);
    const scoreOk = !isNaN(sScore) && Math.abs(p.score - sScore) < 0.05;
    const biasOk = normalizeBias(p.bias) === normalizeBias(s.bias);
    if (!scoreOk || !biasOk) {
      mismatches.push(`${p.name}: pdf ${p.score}${p.bias} vs stored ${sScore}${normalizeBias(s.bias)}`);
    }
  }
  if (mismatches.length) return { status: 'mismatch', detail: mismatches.join('; ') };
  return { status: 'ok' };
}

/**
 * Main ingestion flow. Returns a status object, never a silent partial:
 *   { status: 'ingested', rows, name, sample }
 *   { status: 'skipped', reason, name }        no attribute section, partial, unverifiable
 *   { status: 'verify-failed', detail, name }  six-dimension mismatch, do not write
 * Throws only on infrastructure errors, read or connection failures.
 */
async function ingestPdfToAttributes(pdfPath, personId, supabaseUrl, supabaseKey) {
  const url = supabaseUrl || process.env.SUPABASE_URL;
  const key = supabaseKey || process.env.SUPABASE_KEY;

  if (!url) {
    throw new Error('Supabase URL not provided. Set SUPABASE_URL env var or pass it as an argument.');
  }
  if (!key) {
    throw new Error('Supabase key not provided. Set SUPABASE_KEY env var or pass it as an argument.');
  }

  console.log(`\n=== Ingestion Start ===`);
  console.log(`PDF: ${pdfPath}`);
  console.log(`Person ID: ${personId}`);

  // Step 1: Read and extract text from PDF
  let pdfBuffer;
  try {
    pdfBuffer = fs.readFileSync(pdfPath);
  } catch (err) {
    throw new Error(`ERROR reading PDF: ${err.message}`);
  }

  let pageTexts;
  try {
    const result = await extractTextFromPDF(pdfBuffer);
    pageTexts = result.pageTexts;
  } catch (err) {
    throw new Error(`ERROR extracting text from PDF: ${err.message}`);
  }

  const fullText = Object.values(pageTexts).join('\n\n');

  // Step 2: Parse the 78 from the Core Attribute List page, the six core
  // dimensions from the Dimensional Balance page, and the DISC and Values bands.
  const personName = extractPersonName(fullText);
  const attributes78 = parseAttributes78(fullText);
  const dims = parseDimensionalBalance(fullText);
  const discBands = parseDISCBands(fullText);
  const valuesBands = parseValuesBands(fullText);

  console.log(`Person: ${personName || 'unknown'} | attributes: ${attributes78.length} | dimensions: ${dims.length} | DISC bands: ${Object.keys(discBands).length} | Values bands: ${Object.keys(valuesBands).length}`);

  // Step 3: Shape gates. Never load a partial.
  if (attributes78.length === 0) {
    console.warn('SKIP: no "Core Attribute List" page, not an Attribute Index report.');
    return { status: 'skipped', reason: 'no-attribute-section', name: personName };
  }
  if (attributes78.length !== 78) {
    console.warn(`SKIP: parsed ${attributes78.length} attributes, expected 78. Not loading a partial.`);
    return { status: 'skipped', reason: `partial-${attributes78.length}`, name: personName };
  }

  // Step 4: Connect to Supabase.
  const supabase = createClient(url, key);

  // Step 5: Six-dimension verification gate against the stored rollup.
  const { data: personRow, error: personErr } = await supabase
    .from('people').select('attributes').eq('id', personId).single();
  if (personErr) {
    throw new Error(`ERROR loading person for verification: ${personErr.message}`);
  }
  const gate = verifySixDimensions(dims, personRow?.attributes);
  if (gate.status === 'mismatch') {
    console.warn(`VERIFY-FAILED: six dimensions disagree, not writing. ${gate.detail}`);
    return { status: 'verify-failed', reason: 'mismatch', detail: gate.detail, name: personName };
  }
  if (gate.status === 'unverifiable') {
    console.warn(`SKIP: cannot verify, not writing. ${gate.detail}`);
    return { status: 'skipped', reason: 'unverifiable', detail: gate.detail, name: personName };
  }
  console.log(`Six-dimension check passed for ${personName || personId}.`);

  // Step 6: Build rows. Rank comes from the Core Attribute List order. The band
  // is not parsed yet, store NULL with an honest band_source, never a guess.
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
      band: null,
      band_source: 'unparsed',
      updated_at: new Date().toISOString(),
    });
  }
  if (rows.length !== 78) {
    console.warn(`SKIP: ${rows.length} of 78 attributes mapped to the catalog. Not loading a partial.`);
    return { status: 'skipped', reason: `catalog-miss-${rows.length}`, name: personName };
  }

  // Step 7: Upsert the 78, idempotent on (person_id, attribute).
  const { error } = await supabase
    .from('person_attributes')
    .upsert(rows, { onConflict: 'person_id,attribute' });
  if (error) {
    throw new Error(`ERROR upserting attributes: ${error.message}`);
  }

  // Step 8: Write the rest of the Attribute side from this same authoritative
  // read. The six core dimensions go back into people.attributes in the exact
  // shape the app reads, and the DISC and Values band words go into their
  // columns. The gate already confirmed the six match the stored rollup, so this
  // writes verified values, never a blank, and the app keeps reading the same
  // shape. Bands are read straight from the report, never computed.
  const dimensionRecord = buildDimensionRecord(dims);
  const peopleUpdate = { disc_bands: discBands, values_bands: valuesBands };
  if (dimensionRecord) peopleUpdate.attributes = dimensionRecord;
  const { error: peopleErr } = await supabase
    .from('people')
    .update(peopleUpdate)
    .eq('id', personId);
  if (peopleErr) {
    throw new Error(`ERROR writing dimensions and bands: ${peopleErr.message}`);
  }

  // Step 9: Read back and confirm 78 rows.
  const { data: inserted, error: verifyError } = await supabase
    .from('person_attributes')
    .select('rank, attribute, raw_score, cluster, band_source')
    .eq('person_id', personId)
    .order('rank', { ascending: true });
  if (verifyError) {
    throw new Error(`ERROR verifying: ${verifyError.message}`);
  }

  console.log(`SUCCESS: upserted ${rows.length} attribute rows, wrote six dimensions and bands. ${inserted.length} attribute rows present in DB.`);
  console.log('=== Ingestion Complete ===\n');
  return {
    status: 'ingested', rows: rows.length, name: personName,
    sample: inserted.slice(0, 5), dimensions: dimensionRecord, discBands, valuesBands,
  };
}

/**
 * Parse command-line arguments and run ingestion
 */
async function main() {
  const [, , pdfPath, personId, supabaseUrl, supabaseKey] = process.argv;

  if (!pdfPath || !personId) {
    console.error('Usage: node tools/ingest-pdf-to-attributes.js <pdf-path> <person-uuid> [supabase-url] [supabase-key]');
    console.error('Example: node tools/ingest-pdf-to-attributes.js ./sample.pdf "123e4567..." "https://..." "eyJ..."');
    console.error('\nIf supabase-url and supabase-key are not provided, SUPABASE_URL and SUPABASE_KEY env vars will be used.');
    process.exit(1);
  }

  try {
    const result = await ingestPdfToAttributes(pdfPath, personId, supabaseUrl, supabaseKey);
    console.log(`\nResult: ${result.status}${result.reason ? ` (${result.reason})` : ''}`);
    if (result.status === 'ingested' && result.sample) {
      console.log('First 5 by rank:');
      result.sample.forEach(r => console.log(`  ${r.rank}. ${r.attribute} (${r.raw_score}, ${r.cluster})`));
    }
    if (result.status === 'verify-failed') process.exit(2);
  } catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main();
}

export { ingestPdfToAttributes, verifySixDimensions };
