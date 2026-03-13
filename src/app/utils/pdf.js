let jsZipPromise = null;
export function loadJSZip() {
  if (jsZipPromise) return jsZipPromise;
  jsZipPromise = new Promise((resolve, reject) => {
    if (window.JSZip) { resolve(window.JSZip); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => {
      if (window.JSZip) resolve(window.JSZip);
      else { jsZipPromise = null; reject(new Error("JSZip not available")); }
    };
    script.onerror = () => { jsZipPromise = null; reject(new Error("Failed to load JSZip")); };
    document.head.appendChild(script);
  });
  return jsZipPromise;
}

let pdfJsPromise = null;
export function loadPDFJS() {
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else { pdfJsPromise = null; reject(new Error("PDF.js not available")); }
    };
    script.onerror = () => { pdfJsPromise = null; reject(new Error("Failed to load PDF.js")); };
    document.head.appendChild(script);
  });
  return pdfJsPromise;
}

export async function extractTextFromPDF(arrayBuffer) {
  const pdfjsLib = await loadPDFJS();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts = {};
  const pagesToRead = [2, 3, 4];
  for (const pageNum of pagesToRead) {
    if (pageNum <= pdf.numPages) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      pageTexts[pageNum] = textContent.items.map(item => item.str).join("\n");
    }
  }
  return { pageTexts, totalPages: pdf.numPages };
}

export function parseDISC(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const skipPatterns = [
    /^advanced\s*insights/i, /^executive\s*summary/i, /^copyright/i,
    /^innermetrix/i, /^natural\s*(and|&)\s*adaptive/i,
    /^styles?\s*comparison/i, /^adv\s*anced/i, /^\d+$/, /^0$/,
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
