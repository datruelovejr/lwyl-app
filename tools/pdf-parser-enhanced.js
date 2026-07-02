/**
 * Enhanced PDF parsing for 78 Core Attributes and band labels.
 * Extends the logic in src/app/utils/pdf.js with deeper attribute extraction.
 */

import { buildAttributeMap } from './attribute-catalog.js';

/**
 * Parse the full 78 Core Attributes from the Attribute Index section of the report.
 * The Attribute Index typically lists all 78 attributes ranked by score.
 *
 * Expected format (one attribute per line or a table-like structure):
 *   [Rank Number]. [Attribute Name] [Score]
 * or in a table:
 *   Rank | Attribute Name | Score
 *
 * @param {string} text - The full extracted text from the PDF.
 * @returns {Array<{rank: number, attribute: string, rawScore: number}>}
 */
export function parseAttributes78(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const attributeMap = buildAttributeMap();
  const attributes = [];

  // The 78 live on the report's "Core Attribute List" page, one per line as
  // "Attribute Name (score)", already in descending score order. Rank is the
  // position in that list, 1 is the highest score. Read only that page, so the
  // rank is the instrument's rank and not document order. Find the last
  // occurrence of the header, the list sits at the end of the report.
  let start = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^core attribute list$/i.test(lines[i])) { start = i + 1; break; }
  }
  if (start === -1) {
    // No Core Attribute List page. This is not an Attribute Index report, for
    // example a DISC Plus report. Return empty, the caller skips and reports it.
    return attributes;
  }

  const seen = new Set();
  for (let i = start; i < lines.length && attributes.length < 78; i++) {
    const m = lines[i].match(/^(.+?)\s*\((\d+(?:\.\d+)?)\)$/);
    if (!m) continue;
    const name = m[1].trim();
    const score = parseFloat(m[2]);
    if (isNaN(score) || score < 0 || score > 10) continue;
    if (!attributeMap.has(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    attributes.push({ rank: attributes.length + 1, attribute: name, rawScore: score });
  }

  return attributes;
}

/**
 * Normalize an attribute or dimension bias sign to one of "+", "-", "=".
 * The PDF and the stored data use several minus glyphs, fold them all to "-".
 */
export function normalizeBias(sign) {
  if (sign === '+') return '+';
  if (sign === '=' || sign == null || sign === '') return '=';
  return '-'; // covers "-", U+2212, U+2013, U+2014
}

/**
 * Parse the six core dimensions and their bias from the "Dimensional Balance"
 * page. The page lists them in a fixed order, External then Empathy, Practical
 * Thinking, Systems Judgment, Internal then Self Esteem, Role Awareness, Self
 * Direction. Each dimension shows a "score bias" line such as "6.7 +". The
 * axis labels on that page are bare numbers with no bias sign, so they do not
 * match. Returns an array of six { name, score, bias } in that fixed order, or
 * fewer if the page is missing or malformed.
 *
 * @param {string} text - The full extracted text from the PDF.
 * @returns {Array<{name: string, score: number, bias: string}>}
 */
export function parseDimensionalBalance(text) {
  const ORDER = ['Empathy', 'Practical Thinking', 'Systems Judgment', 'Self-Esteem', 'Role Awareness', 'Self-Direction'];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^dimensional balance$/i.test(lines[i])) { start = i + 1; break; }
  }
  if (start === -1) return [];

  const found = [];
  const window = Math.min(lines.length, start + 80);
  for (let i = start; i < window && found.length < 6; i++) {
    const m = lines[i].match(/^(\d+(?:\.\d+)?)\s+([+\-=−–—])$/);
    if (!m) continue;
    found.push({ score: parseFloat(m[1]), bias: normalizeBias(m[2]) });
  }

  return found.map((d, i) => ({ name: ORDER[i], score: d.score, bias: d.bias }));
}

/**
 * Build the six-dimension storage record in the exact shape the app reads from
 * people.attributes, External as ext with Heart, Hand, Head labels, Internal as
 * int with no label, bias stored with the Unicode minus U+2212 to match the
 * existing data. Returns null unless all six dimensions parsed, never a partial.
 *
 * @param {Array<{name:string,score:number,bias:string}>} dims - from parseDimensionalBalance
 * @returns {{ext: Array, int: Array} | null}
 */
export function buildDimensionRecord(dims) {
  if (!dims || dims.length !== 6) return null;
  const MINUS = '−';
  const glyph = b => (b === '+' ? '+' : b === '=' ? '=' : MINUS);
  const labels = ['Heart', 'Hand', 'Head'];
  const ext = dims.slice(0, 3).map((d, i) => ({ bias: glyph(d.bias), name: d.name, label: labels[i], score: d.score }));
  const int = dims.slice(3, 6).map(d => ({ bias: glyph(d.bias), name: d.name, score: d.score }));
  return { ext, int };
}

/**
 * Title-case a band phrase, "very low" becomes "Very Low", "high" becomes "High".
 */
function titleCaseBand(s) {
  return s.toLowerCase().trim().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse the instrument's band word for each of the seven Values. On the "Seven
 * Dimensions of Value and Motivation" page the report prints the band word on
 * the line immediately above each value name, for example:
 *   "High"
 *   "Aesthetic"
 *   "You very much prefer form, harmony and balance ..."
 * The band is read straight from the report, never computed from the score.
 * The page writes Altruistic as "Altruist", map it back. Returns a map keyed by
 * the canonical value name, for example { Aesthetic: "High", Economic: "Average" }.
 *
 * @param {string} text - The full extracted text from the PDF.
 * @returns {Object}
 */
export function parseValuesBands(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const valueMap = {
    Aesthetic: 'Aesthetic', Economic: 'Economic', Individualistic: 'Individualistic',
    Political: 'Political', Altruist: 'Altruistic', Altruistic: 'Altruistic',
    Regulatory: 'Regulatory', Theoretical: 'Theoretical',
  };
  const bandLine = /^(very high|very low|high|low|average)$/i;
  const bands = {};

  for (let i = 0; i + 1 < lines.length; i++) {
    if (!bandLine.test(lines[i])) continue;
    const canonical = valueMap[lines[i + 1]];
    if (canonical && !bands[canonical]) {
      bands[canonical] = titleCaseBand(lines[i]);
    }
  }

  return bands;
}

/**
 * Parse the instrument's band phrase for each DISC dimension. Each DISC page
 * carries a sentence such as "Your score shows a moderately high score on the
 * 'I' spectrum." The DISC spectrum uses a six-level descriptive scale, observed
 * across the reports as: very high, moderately high, high average, low average,
 * moderately low, very low. Capture the whole phrase verbatim, never reduce it
 * to a guess and never compute it from the score. Returns a map keyed by the
 * DISC letter, for example { D: "Very Low", I: "Moderately High" }.
 *
 * @param {string} text - The full extracted text from the PDF.
 * @returns {Object}
 */
export function parseDISCBands(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // Capture the full phrase between "shows a" and "score on the 'X' spectrum".
  // Requiring "shows a" and the quoted letter avoids the explanatory lines such
  // as "A high score doesn't mean good".
  const re = /shows a (.+?) score on the '([DISC])'\s+spectrum/i;
  const bands = {};

  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      const letter = m[2].toUpperCase();
      if (!bands[letter]) bands[letter] = titleCaseBand(m[1]);
    }
  }

  return bands;
}

/**
 * Extract person name from the report (usually on cover or early pages).
 * @param {string} text - Extracted text from the first few pages.
 * @returns {string} - The person's name or empty string if not found.
 */
export function extractPersonName(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const skipPatterns = [
    /^advanced\s*insights/i, /^profile/i, /^assessment/i, /^report/i,
    /^prepared\s*(for|by)/i, /^innermetrix/i, /^copyright/i, /^\d+$/, /^page\s*\d+/i,
  ];

  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i];
    if (skipPatterns.some(p => p.test(line))) continue;
    if (line.length < 3 || line.length > 60) continue;

    const nameChars = (line.match(/[a-zA-Z\s.\-']/g) || []).length;
    const ratio = nameChars / line.length;

    if (ratio > 0.85 && line.includes(' ')) {
      return line;
    }
  }

  return '';
}
