import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { ingestPdfToAttributes, verifySixDimensions } from './ingest-pdf-to-attributes.js';
import { extractTextFromPDF } from '../src/app/utils/pdf.js';
import { parseAttributes78, parseDimensionalBalance, extractPersonName } from './pdf-parser-enhanced.js';

const DEFAULT_REFERENCE_DIR = path.resolve(process.cwd(), '../friction-methodology-workspace/reference');

function printUsage() {
  console.log(`Usage: node tools/ingest-all-pdfs.js [options]

Options:
  --dir <path>           Path to a directory containing PDF assessment reports
  --map <path>           Optional JSON file mapping PDF filenames to person UUIDs
  --recursive            Scan subdirectories for PDF files
  --dry-run, -n          Do not perform ingestion; only print what would run
  --supabase-url <url>   Optional Supabase URL (falls back to SUPABASE_URL)
  --supabase-key <key>   Optional Supabase key (falls back to SUPABASE_KEY)
  --help                 Show this help message

Environment variables:
  SUPABASE_URL           Supabase project URL
  SUPABASE_KEY           Supabase service role key or API key
  ASSESSMENT_PDF_DIR     Default path to search for assessment PDF files
  ASSESSMENT_PDF_MAP     Default path to a JSON mapping file
`);
}

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help') {
      flags.help = true;
    } else if (arg === '--dry-run' || arg === '-n') {
      flags.dryRun = true;
    } else if (arg === '--recursive') {
      flags.recursive = true;
    } else if (arg === '--dir' || arg === '--map' || arg === '--supabase-url' || arg === '--supabase-key') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        throw new Error(`Missing value for ${arg}`);
      }
      flags[arg.replace(/^-+/g, '')] = next;
      i += 1;
    } else if (!flags.dir && !arg.startsWith('-')) {
      flags.dir = arg;
    } else {
      console.warn(`Ignored unknown argument: ${arg}`);
    }
  }
  return flags;
}

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKD')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildPersonIndex(people) {
  const index = new Map();

  function add(key, person) {
    if (!key) return;
    const normalized = normalizeText(key);
    if (!normalized) return;
    const existing = index.get(normalized) || [];
    // The underscore and hyphen variants re-normalize back to the spaced key, so
    // the same person can land here several times. Dedupe by id, otherwise every
    // person looks ambiguous against themselves. Only genuinely distinct people
    // sharing a normalized name stay as a real ambiguous match.
    if (existing.some(p => p.id === person.id)) return;
    existing.push(person);
    index.set(normalized, existing);
  }

  for (const person of people) {
    if (!person?.id || !person?.name) continue;
    const normalizedName = normalizeText(person.name);
    add(normalizedName, person);
    add(normalizedName.replace(/\s+/g, ''), person);
    add(normalizedName.replace(/ /g, '_'), person);
    add(normalizedName.replace(/ /g, '-'), person);
    const words = normalizedName.split(' ').filter(Boolean);
    if (words.length >= 2) {
      add(words.slice().reverse().join(' '), person);
      add(words.slice().reverse().join(''), person);
    }
  }

  return index;
}

function loadPdfMapping(mappingPath) {
  if (!mappingPath) return null;
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`Mapping file not found: ${mappingPath}`);
  }

  const contents = fs.readFileSync(mappingPath, 'utf8').trim();
  if (!contents) return null;

  const parsed = JSON.parse(contents);
  const map = new Map();

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const fileKey = entry.file || entry.filename || entry.name;
      if (!fileKey || !entry.personId) continue;
      map.set(normalizeText(path.basename(fileKey, path.extname(fileKey))), entry.personId);
      map.set(normalizeText(fileKey), entry.personId);
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'string') continue;
      map.set(normalizeText(path.basename(key, path.extname(key))), value);
      map.set(normalizeText(key), value);
    }
  }

  return map;
}

// Match a PDF to a person by exact normalized name or an explicit mapping only.
// No substring or fuzzy guessing. The brief is explicit: if a name does not
// match exactly, do not guess, log it as unmatched. Returns { id, status }
// where status is 'matched', 'ambiguous', or 'none'.
function findPersonIdForPdf(filePath, mapping, personIndex) {
  const fileName = path.basename(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const normalizedBase = normalizeText(baseName);

  if (mapping) {
    const mapped = mapping.get(normalizedBase) || mapping.get(normalizeText(fileName));
    if (mapped) return { id: mapped, status: 'matched' };
  }

  for (const key of [normalizedBase, normalizedBase.replace(/\s+/g, ''), normalizeText(fileName)]) {
    const hit = personIndex.get(key);
    if (hit && hit.length === 1) return { id: hit[0].id, status: 'matched' };
    if (hit && hit.length > 1) {
      console.warn(`Ambiguous filename match for ${fileName}: ${hit.map(p => p.name).join(', ')}`);
      return { id: null, status: 'ambiguous' };
    }
  }

  return { id: null, status: 'none' };
}

// Match by the name parsed from the PDF cover, exact normalized only.
function findPersonIdByParsedName(parsedName, personIndex) {
  if (!parsedName) return { id: null, status: 'none' };
  for (const key of [normalizeText(parsedName), normalizeText(parsedName).replace(/\s+/g, '')]) {
    const hit = personIndex.get(key);
    if (hit && hit.length === 1) return { id: hit[0].id, status: 'matched' };
    if (hit && hit.length > 1) return { id: null, status: 'ambiguous' };
  }
  return { id: null, status: 'none' };
}

function walkDirectory(directory, recursive) {
  if (!fs.existsSync(directory)) return [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...walkDirectory(resolved, recursive));
      }
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      files.push(resolved);
    }
  }

  return files;
}

async function queryPeople(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are required to query people. Set SUPABASE_URL and SUPABASE_KEY or pass --supabase-url/--supabase-key.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('people').select('id,name,attributes');
  if (error) {
    throw new Error(`Failed to query people: ${error.message}`);
  }

  return data || [];
}

// Open a PDF once and return the cover name, the count of attributes on the
// Core Attribute List page, and the six core dimensions from the Dimensional
// Balance page. attrCount -1 signals a read or parse error. The dims feed the
// gate-based disambiguation of double-entered names. dims is [] on error.
async function parsePdfForRouting(filePath) {
  try {
    const raw = fs.readFileSync(filePath);
    const result = await extractTextFromPDF(raw);
    const fullText = Object.values(result.pageTexts).join('\n\n');
    return {
      name: extractPersonName(fullText),
      attrCount: parseAttributes78(fullText).length,
      dims: parseDimensionalBalance(fullText),
    };
  } catch (err) {
    console.warn(`Could not parse ${path.basename(filePath)}: ${err.message}`);
    return { name: '', attrCount: -1, dims: [] };
  }
}

// Return every person whose name collides with this PDF's filename or cover
// name, the candidate set for a double-entered name. Used only after matching
// has already reported the file ambiguous, to feed gate-based disambiguation.
function getAmbiguousCandidates(filePath, parsedName, personIndex) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const keys = [
    normalizeText(baseName),
    normalizeText(baseName).replace(/\s+/g, ''),
    normalizeText(path.basename(filePath)),
  ];
  if (parsedName) {
    keys.push(normalizeText(parsedName), normalizeText(parsedName).replace(/\s+/g, ''));
  }
  for (const key of keys) {
    const hit = personIndex.get(key);
    if (hit && hit.length > 1) return hit;
  }
  return [];
}

// Gate-based disambiguation. When a name is double-entered in people, the only
// honest way to pick the right record is the same six-dimension gate the writer
// uses: the PDF belongs to the record whose stored rollup it matches. Returns
// the unique matching person id, or null with a reason when zero or several
// records match (then the file stays ambiguous and is reported, never guessed).
function disambiguateByGate(dims, candidates) {
  const passes = candidates.filter(c => verifySixDimensions(dims, c.attributes).status === 'ok');
  if (passes.length === 1) return { id: passes[0].id, reason: 'gate-unique' };
  if (passes.length === 0) return { id: null, reason: 'no-record-matches-rollup' };
  return { id: null, reason: `rollup matches ${passes.length} records (identical duplicates)` };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    printUsage();
    process.exit(0);
  }

  const dryRun = Boolean(flags.dryRun);
  const recursive = Boolean(flags.recursive);
  const supabaseUrl = flags['supabase-url'] || process.env.SUPABASE_URL;
  const supabaseKey = flags['supabase-key'] || process.env.SUPABASE_KEY;
  const pdfDir = flags.dir
    ? path.resolve(process.cwd(), flags.dir)
    : process.env.ASSESSMENT_PDF_DIR
      ? path.resolve(process.cwd(), process.env.ASSESSMENT_PDF_DIR)
      : DEFAULT_REFERENCE_DIR;
  const mappingPath = flags.map || process.env.ASSESSMENT_PDF_MAP || null;

  if (!fs.existsSync(pdfDir) || !fs.statSync(pdfDir).isDirectory()) {
    console.error(`PDF directory not found or not a directory: ${pdfDir}`);
    process.exit(1);
  }

  const mapping = mappingPath ? loadPdfMapping(path.resolve(process.cwd(), mappingPath)) : null;
  const pdfFiles = walkDirectory(pdfDir, recursive);

  if (!pdfFiles.length) {
    console.error(`No PDF files found in ${pdfDir}`);
    process.exit(1);
  }

  const people = await queryPeople(supabaseUrl, supabaseKey);
  const personIndex = buildPersonIndex(people);

  console.log(`\n=== Batch Ingestion ===`);
  console.log(`PDF folder: ${pdfDir}`);
  console.log(`Found ${pdfFiles.length} PDF(s).`);
  if (mappingPath) console.log(`Using mapping file: ${mappingPath}`);
  if (dryRun) console.log('Dry-run mode, no writes.');

  const buckets = {
    ingested: [], wouldIngest: [], disambiguated: [], wouldDisambiguate: [],
    noAttributes: [], partial: [], noMatch: [], ambiguous: [],
    verifyFailed: [], unverifiable: [], failed: [],
  };

  for (const filePath of pdfFiles) {
    const fileName = path.basename(filePath);
    const { name: parsedName, attrCount, dims } = await parsePdfForRouting(filePath);

    // Shape gates first, so DISC Plus and partials are excluded the same way in
    // dry-run and in the real run.
    if (attrCount === -1) { buckets.failed.push(fileName); continue; }
    if (attrCount === 0) { buckets.noAttributes.push(fileName); continue; }
    if (attrCount !== 78) { buckets.partial.push(`${fileName} (${attrCount})`); continue; }

    // Match exactly, by filename then by parsed cover name. Never guess.
    let m = findPersonIdForPdf(filePath, mapping, personIndex);
    if (m.status === 'none') m = findPersonIdByParsedName(parsedName, personIndex);

    // A double-entered name is ambiguous by filename alone. Resolve it with the
    // six-dimension gate: the PDF belongs to the record whose stored rollup it
    // matches. Only an unique gate match is accepted, otherwise it stays
    // ambiguous and is reported. This never invents a match.
    if (m.status === 'ambiguous') {
      const candidates = getAmbiguousCandidates(filePath, parsedName, personIndex);
      const resolved = disambiguateByGate(dims, candidates);
      if (!resolved.id) {
        buckets.ambiguous.push(`${fileName} (${candidates.length} records, ${resolved.reason})`);
        continue;
      }
      if (dryRun) { buckets.wouldDisambiguate.push(`${fileName} -> ${resolved.id}`); continue; }
      try {
        const result = await ingestPdfToAttributes(filePath, resolved.id, supabaseUrl, supabaseKey);
        if (result.status === 'ingested') buckets.disambiguated.push(`${fileName} -> ${resolved.id}`);
        else if (result.status === 'verify-failed') buckets.verifyFailed.push(`${fileName}: ${result.detail}`);
        else if (result.reason === 'unverifiable') buckets.unverifiable.push(`${fileName}: ${result.detail || ''}`);
        else buckets.partial.push(`${fileName} (${result.reason})`);
      } catch (err) {
        buckets.failed.push(`${fileName}: ${err.message}`);
      }
      continue;
    }
    if (!m.id) { buckets.noMatch.push(fileName); continue; }

    if (dryRun) { buckets.wouldIngest.push(fileName); continue; }

    try {
      const result = await ingestPdfToAttributes(filePath, m.id, supabaseUrl, supabaseKey);
      if (result.status === 'ingested') buckets.ingested.push(fileName);
      else if (result.status === 'verify-failed') buckets.verifyFailed.push(`${fileName}: ${result.detail}`);
      else if (result.reason === 'unverifiable') buckets.unverifiable.push(`${fileName}: ${result.detail || ''}`);
      else if (result.reason === 'no-attribute-section') buckets.noAttributes.push(fileName);
      else buckets.partial.push(`${fileName} (${result.reason})`);
    } catch (err) {
      buckets.failed.push(`${fileName}: ${err.message}`);
    }
  }

  const n = k => buckets[k].length;
  console.log(`\n=== Batch Complete ===`);
  console.log(`Scanned:         ${pdfFiles.length}`);
  console.log(dryRun ? `Would ingest:    ${n('wouldIngest')}` : `Ingested:        ${n('ingested')}`);
  console.log(dryRun
    ? `Would disambig:  ${n('wouldDisambiguate')} (double-entered, resolved by gate)`
    : `Disambiguated:   ${n('disambiguated')} (double-entered, resolved by gate)`);
  console.log(`No attributes:   ${n('noAttributes')} (DISC Plus / no Attribute Index)`);
  console.log(`Partial (<78):   ${n('partial')}`);
  console.log(`No person match: ${n('noMatch')}`);
  console.log(`Ambiguous:       ${n('ambiguous')} (unresolved)`);
  if (!dryRun) {
    console.log(`Verify-failed:   ${n('verifyFailed')} (NOT written)`);
    console.log(`Unverifiable:    ${n('unverifiable')} (NOT written)`);
  }
  console.log(`Errors:          ${n('failed')}`);

  const detail = (label, arr) => { if (arr.length) console.log(`\n${label}:\n  ${arr.join('\n  ')}`); };
  detail(dryRun ? 'Would disambiguate (gate-unique)' : 'Disambiguated (gate-unique)',
    dryRun ? buckets.wouldDisambiguate : buckets.disambiguated);
  detail('No attributes (skipped)', buckets.noAttributes);
  detail('Partial (skipped)', buckets.partial);
  detail('No person match', buckets.noMatch);
  detail('Ambiguous', buckets.ambiguous);
  detail('Verify-failed, NOT written', buckets.verifyFailed);
  detail('Unverifiable, NOT written', buckets.unverifiable);
  detail('Errors', buckets.failed);

  if (n('failed') > 0 || n('verifyFailed') > 0) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  });
}
