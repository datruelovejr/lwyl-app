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
  const attributes = [];
  const attributeMap = buildAttributeMap();

  // Look for lines that match the pattern: number. name score
  // e.g., "1. Accountability For Others 8.2"
  // or in tables: might have pipes or extra whitespace
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip headers and common non-attribute lines
    if (/^(rank|attribute|score|#|index|core|dimension|cluster)/i.test(line)) continue;
    if (/^---+|^===+/.test(line)) continue;
    if (/^(attribute index|core attribute|attributes ranked)/i.test(line)) continue;

    // Try to parse: "N. Attribute Name Score"
    // The score should be a decimal between ~0 and ~10
    const match = line.match(/^(\d+)\.\s+(.+?)\s+([\d.]+)$/);
    if (match) {
      const [, rankStr, attrNameRaw, scoreStr] = match;
      const rank = parseInt(rankStr, 10);
      const attrName = attrNameRaw.trim();
      const score = parseFloat(scoreStr);

      // Verify score is in valid range
      if (!isNaN(rank) && !isNaN(score) && score >= 0 && score <= 10) {
        // Look up in catalog to confirm it's a real attribute
        if (attributeMap.has(attrName)) {
          attributes.push({ rank, attribute: attrName, rawScore: score });
        }
      }
    }

    // Fallback: try comma-separated or pipe-separated formats
    // e.g., "1, Accountability For Others, 8.2" or "1 | Accountability For Others | 8.2"
    if (attributes.length === 0 || i < 100) {
      const altMatch = line.match(/^(\d+)\s*[,|]\s*(.+?)\s*[,|]\s*([\d.]+)$/);
      if (altMatch) {
        const [, rankStr, attrNameRaw, scoreStr] = altMatch;
        const rank = parseInt(rankStr, 10);
        const attrName = attrNameRaw.trim();
        const score = parseFloat(scoreStr);

        if (!isNaN(rank) && !isNaN(score) && score >= 0 && score <= 10) {
          if (attributeMap.has(attrName)) {
            const existing = attributes.find(a => a.rank === rank);
            if (!existing) {
              attributes.push({ rank, attribute: attrName, rawScore: score });
            }
          }
        }
      }
    }
  }

  return attributes;
}

/**
 * Parse band labels for Values dimensions.
 * Bands are typically: Very High, High, Average, Low, Very Low.
 * Expected format in the report:
 *   [Value Name]: [Band Label]
 * or in a table row.
 *
 * @param {string} text - The full extracted text from the PDF.
 * @returns {Object} - Map of value name to band, e.g., { "Aesthetic": "High", "Economic": "Average" }
 */
export function parseValuesBands(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const bands = {};
  const valueNames = ["Aesthetic", "Economic", "Individualistic", "Political", "Altruistic", "Regulatory", "Theoretical"];
  const bandLabels = ["Very High", "Very Low", "High", "Average", "Low"];

  for (const line of lines) {
    for (const valueName of valueNames) {
      for (const bandLabel of bandLabels) {
        // Match: "Aesthetic: High" or "Aesthetic High" or in a row
        const regex = new RegExp(`\\b${valueName}\\b[:\\s]+(?:Band[:\\s]+)?(${bandLabel})\\b`, 'i');
        if (regex.test(line)) {
          bands[valueName] = bandLabel;
          break;
        }
      }
    }
  }

  return bands;
}

/**
 * Parse band labels for DISC dimensions.
 * Each DISC dimension (Decisive, Interactive, Stabilizing, Cautious) has a spectrum band.
 * Expected format in the report:
 *   [DISC Name]: [Band/Spectrum]
 * or in a narrative describing the spectrum.
 *
 * @param {string} text - The full extracted text from the PDF.
 * @returns {Object} - Map of DISC dimension to band, e.g., { "Decisive": "High", "Interactive": "Low" }
 */
export function parseDISCBands(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const bands = {};
  const discNames = ["Decisive", "Interactive", "Stabilizing", "Cautious"];
  const bandLabels = ["Very High", "High", "Moderate", "Low", "Very Low"];

  for (const line of lines) {
    for (const discName of discNames) {
      for (const bandLabel of bandLabels) {
        const regex = new RegExp(`\\b${discName}\\b[:\\s]+(${bandLabel})\\b`, 'i');
        if (regex.test(line)) {
          bands[discName] = bandLabel;
          break;
        }
      }
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
