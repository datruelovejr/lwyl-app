/**
 * PDF and ZIP utilities -- loads JSZip and PDF.js from npm packages.
 * pdfjs-dist is loaded lazily to avoid SSR issues on Vercel.
 */

import JSZip from 'jszip';

// Lazy-load pdfjs-dist to avoid SSR issues
let pdfjsLib = null;
async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
  return pdfjsLib;
}

export function loadJSZip() {
  return Promise.resolve(JSZip);
}

export async function loadPDFJS() {
  return getPdfjs();
}

export async function extractTextFromPDF(arrayBuffer) {
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageTexts = {};
  const pagesToRead = [1, 2, 3, 4];
  for (const pageNum of pagesToRead) {
    if (pageNum <= pdf.numPages) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      pageTexts[pageNum] = textContent.items.map(item => item.str).join("\n");
    }
  }
  return { pageTexts, totalPages: pdf.numPages };
}

// Extract name from page 1 (cover page) - name is typically the first line
export function parseNameFromCover(text) {
  if (!text) return "";
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Skip patterns - things that are definitely NOT names
  const skipPatterns = [
    /^advanced\s*insights/i, /^profile/i, /^assessment/i, /^report/i,
    /^prepared\s*(for|by)/i, /^innermetrix/i, /^copyright/i, /^thomas/i,
    /^\d+$/, /^page\s*\d+/i, /^disc\s*index/i, /behavioral/i,
    /^this\s/i, /^the\s/i, /marston/i, /quadrant/i,
  ];

  // Date patterns - name should appear before the date
  const datePatterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{2,4}\b/i,
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
    /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/,
  ];

  // Find date line to limit search
  let dateLineIdx = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (datePatterns.some(p => p.test(lines[i]))) {
      dateLineIdx = i;
      break;
    }
  }

  // Look for first name-like line before the date (check first 10 lines max)
  for (let i = 0; i < Math.min(dateLineIdx, 10); i++) {
    const line = lines[i];

    // Skip if matches any skip pattern
    if (skipPatterns.some(p => p.test(line))) continue;

    // Skip very short or very long lines
    if (line.length < 3 || line.length > 60) continue;

    // Skip pure numbers
    if (/^\d+$/.test(line)) continue;

    // Name should be mostly letters, spaces, periods, hyphens
    const nameChars = (line.match(/[a-zA-Z\s.\-']/g) || []).length;
    const ratio = nameChars / line.length;

    // Accept if >85% valid name characters and has at least one space (first + last name)
    if (ratio > 0.85 && line.includes(' ')) {
      return line;
    }
  }

  return "";
}

export function parseDISC(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const skipPatterns = [
    /^advanced\s*insights/i, /^executive\s*summary/i, /^copyright/i,
    /^innermetrix/i, /^natural\s*(and|&)\s*adaptive/i, /^natural\s*style/i,
    /^adaptive\s*style/i, /^styles?\s*comparison/i, /^adv\s*anced/i,
    /^\d+$/, /^0$/, /^page\s*\d+/i, /^the\s+natural\s+style/i,
    /^the\s+adaptive\s+style/i, /how\s+you\s+behave/i, /^behaviors?\s/i,
  ];
  let name = "";
  for (const line of lines) {
    const isHeader = skipPatterns.some(p => p.test(line));
    const isShort = line.length <= 2;
    const isNumber = /^\d+(\s*\/\s*\d+)?$/.test(line);
    const isDISCDim = /^[DISC]$/.test(line) && line.length === 1;
    if (!isHeader && !isShort && !isNumber && !isDISCDim && line.length >= 3) {
      const letterRatio = (line.match(/[a-zA-Z]/g) || []).length / line.length;
      if (letterRatio > 0.7) { name = line; break; }
    }
  }
  const result = { name, dN_D: "", dN_I: "", dN_S: "", dN_C: "", dA_D: "", dA_I: "", dA_S: "", dA_C: "" };
  const dims = ["D", "I", "S", "C"];
  let dimIdx = 0;
  for (let i = 0; i < lines.length && dimIdx < 4; i++) {
    if (lines[i] === dims[dimIdx]) {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const parts = nextLine.split(/\s*\/\s*/);
        if (parts.length >= 2) {
          const nat = parseInt(parts[0], 10);
          const adp = parseInt(parts[1], 10);
          if (!isNaN(nat)) result[`dN_${dims[dimIdx]}`] = String(nat);
          if (!isNaN(adp)) result[`dA_${dims[dimIdx]}`] = String(adp);
        } else {
          const num = parseInt(parts[0], 10);
          if (!isNaN(num)) result[`dN_${dims[dimIdx]}`] = String(num);
        }
      }
      dimIdx++;
    }
  }
  return result;
}

export function parseValues(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = { v_Aes: "", v_Eco: "", v_Ind: "", v_Pol: "", v_Alt: "", v_Reg: "", v_The: "" };
  const keys = ["v_Aes", "v_Eco", "v_Ind", "v_Pol", "v_Alt", "v_Reg", "v_The"];
  let sdCount = 0;
  let scoreIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("1 SD")) {
      sdCount++;
      if (sdCount >= 2) {
        for (let j = i + 1; j < lines.length && scoreIdx < 7; j++) {
          const nums = lines[j].match(/\d+/g);
          if (nums) {
            const val = parseInt(nums[0], 10);
            if (!isNaN(val) && val >= 0 && val <= 100) { result[keys[scoreIdx]] = String(val); scoreIdx++; }
          }
        }
        break;
      }
    }
  }
  if (scoreIdx === 0) {
    const allNums = [];
    for (const line of lines) {
      const nums = line.match(/\b\d{1,3}\b/g);
      if (nums) nums.forEach(n => { const v = parseInt(n, 10); if (v >= 0 && v <= 100) allNums.push(v); });
    }
    if (allNums.length >= 7) {
      const start = allNums.length >= 14 ? 7 : 0;
      for (let k = 0; k < 7 && (start + k) < allNums.length; k++) result[keys[k]] = String(allNums[start + k]);
    }
  }
  return result;
}

export function parseAttributes(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {
    e_emp: "", e_empB: "=", e_pra: "", e_praB: "=", e_sys: "", e_sysB: "=",
    i_se: "", i_seB: "=", i_ra: "", i_raB: "=", i_sd: "", i_sdB: "="
  };
  const scoreKeys = ["e_emp", "e_pra", "e_sys", "i_se", "i_ra", "i_sd"];
  const biasKeys = ["e_empB", "e_praB", "e_sysB", "i_seB", "i_raB", "i_sdB"];
  let idx = 0;
  const attrPattern = /(\d+\.?\d*)\s*([+\-=\u2212\u2013\u2014])/;
  for (const line of lines) {
    const match = line.match(attrPattern);
    if (match && idx < 6) {
      result[scoreKeys[idx]] = match[1];
      const rawBias = match[2];
      if (rawBias === "+") result[biasKeys[idx]] = "+";
      else if (rawBias === "-" || rawBias === "\u2212" || rawBias === "\u2013" || rawBias === "\u2014") result[biasKeys[idx]] = "\u2212";
      else result[biasKeys[idx]] = "=";
      idx++;
    }
  }
  return result;
}
