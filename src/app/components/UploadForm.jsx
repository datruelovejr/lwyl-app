'use client';

import { useState, useRef } from 'react';
import { C } from '../constants/colors';
import { normBias } from '../constants/data';
import { Btn } from './Btn';
import { loadJSZip, extractTextFromPDF, parseDISC, parseValues, parseAttributes } from '../utils/pdf';

// ────── UPLOAD FORM ──────
export function UploadForm({ orgs, selOrgId, selTeamId: parentTeamId, onAdd, onCancel }) {
  const [step, setStep] = useState("upload"); // "upload" | "entry" | "bulk" | "bulkResults"
  const [fileName, setFileName] = useState("");
  const [extractStatus, setExtractStatus] = useState(null);
  const [filledFields, setFilledFields] = useState(new Set());
  const [extractLog, setExtractLog] = useState("");
  const [form, setForm] = useState({
    name: "", teamId: parentTeamId || "",
    dN_D: "", dN_I: "", dN_S: "", dN_C: "", dA_D: "", dA_I: "", dA_S: "", dA_C: "",
    v_Aes: "", v_Eco: "", v_Ind: "", v_Pol: "", v_Alt: "", v_Reg: "", v_The: "",
    e_emp: "", e_empB: "=", e_pra: "", e_praB: "=", e_sys: "", e_sysB: "=",
    i_se: "", i_seB: "=", i_ra: "", i_raB: "=", i_sd: "", i_sdB: "="
  });

  // Bulk upload states
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentFile: "" });
  const [bulkResults, setBulkResults] = useState({ success: [], partial: [], failed: [] });
  const [bulkTeamId, setBulkTeamId] = useState(parentTeamId || "");

  const fileRef = useRef();
  const org = orgs.find(o => o.id === selOrgId);

  // Extract person data from a single PDF buffer - returns { success, data, name, error }
  const extractFromPDF = async (arrayBuffer, fileName) => {
    try {
      const headerBytes = new Uint8Array(arrayBuffer.slice(0, 4));
      const isPDF = headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46;

      if (!isPDF) {
        return { success: false, error: "Not a PDF file", fileName };
      }

      let pdfResult;
      try {
        pdfResult = await extractTextFromPDF(arrayBuffer);
      } catch (e) {
        return { success: false, error: `PDF parsing failed: ${e.message}`, fileName };
      }

      const page2 = pdfResult.pageTexts[2] || "";
      const page3 = pdfResult.pageTexts[3] || "";
      const page4 = pdfResult.pageTexts[4] || "";

      if (!page2 && !page3 && !page4) {
        return { success: false, error: "No text found on pages 2-4", fileName };
      }

      const discData = page2 ? parseDISC(page2) : {};
      const valData = page3 ? parseValues(page3) : {};
      const attrData = page4 ? parseAttributes(page4) : {};

      // Count extracted fields
      const extracted = {};
      let fieldCount = 0;

      if (discData.name && discData.name.length > 1) extracted.name = discData.name;

      const discFields = ["dN_D", "dN_I", "dN_S", "dN_C", "dA_D", "dA_I", "dA_S", "dA_C"];
      for (const key of discFields) { if (discData[key]) { extracted[key] = discData[key]; fieldCount++; } }

      const valFields = ["v_Aes", "v_Eco", "v_Ind", "v_Pol", "v_Alt", "v_Reg", "v_The"];
      for (const key of valFields) { if (valData[key]) { extracted[key] = valData[key]; fieldCount++; } }

      const attrScoreFields = ["e_emp", "e_pra", "e_sys", "i_se", "i_ra", "i_sd"];
      const attrBiasFields = ["e_empB", "e_praB", "e_sysB", "i_seB", "i_raB", "i_sdB"];
      for (const key of attrScoreFields) { if (attrData[key]) { extracted[key] = attrData[key]; fieldCount++; } }
      for (const key of attrBiasFields) { if (attrData[key]) extracted[key] = attrData[key]; }

      // Need at least name + 4 DISC natural scores for auto-submit
      const hasName = !!extracted.name;
      const hasMinDISC = extracted.dN_D && extracted.dN_I && extracted.dN_S && extracted.dN_C;

      if (hasName && hasMinDISC) {
        return { success: true, partial: fieldCount < 20, data: extracted, name: extracted.name, fileName, fieldCount };
      } else {
        const missing = [];
        if (!hasName) missing.push("name");
        if (!hasMinDISC) missing.push("DISC scores");
        return { success: false, error: `Missing required: ${missing.join(", ")}`, fileName, data: extracted };
      }
    } catch (e) {
      return { success: false, error: `Unexpected error: ${e.message}`, fileName };
    }
  };

  // Create person object from extracted data
  const createPersonFromData = (data, teamId) => ({
    id: crypto.randomUUID(),
    name: data.name,
    orgId: selOrgId,
    teamId: teamId,
    disc: {
      natural: { D: +data.dN_D || 0, I: +data.dN_I || 0, S: +data.dN_S || 0, C: +data.dN_C || 0 },
      adaptive: { D: +data.dA_D || 0, I: +data.dA_I || 0, S: +data.dA_S || 0, C: +data.dA_C || 0 }
    },
    values: {
      Aesthetic: +data.v_Aes || 0, Economic: +data.v_Eco || 0, Individualistic: +data.v_Ind || 0,
      Political: +data.v_Pol || 0, Altruistic: +data.v_Alt || 0, Regulatory: +data.v_Reg || 0, Theoretical: +data.v_The || 0
    },
    attr: {
      ext: [
        { name: "Empathy", label: "Heart", score: +data.e_emp || 0, bias: normBias(data.e_empB || "=") },
        { name: "Practical Thinking", label: "Hand", score: +data.e_pra || 0, bias: normBias(data.e_praB || "=") },
        { name: "Systems Judgment", label: "Head", score: +data.e_sys || 0, bias: normBias(data.e_sysB || "=") }
      ],
      int: [
        { name: "Self-Esteem", score: +data.i_se || 0, bias: normBias(data.i_seB || "=") },
        { name: "Role Awareness", score: +data.i_ra || 0, bias: normBias(data.i_raB || "=") },
        { name: "Self-Direction", score: +data.i_sd || 0, bias: normBias(data.i_sdB || "=") }
      ]
    }
  });

  // Process bulk files
  const processBulkFiles = async (pdfFiles, teamId) => {
    const results = { success: [], partial: [], failed: [] };

    for (let i = 0; i < pdfFiles.length; i++) {
      const { file, name } = pdfFiles[i];
      setBulkProgress({ current: i + 1, total: pdfFiles.length, currentFile: name });

      const arrayBuffer = await file.arrayBuffer();
      const result = await extractFromPDF(arrayBuffer, name);

      if (result.success) {
        const person = createPersonFromData(result.data, teamId);
        onAdd(person, { bulk: true });
        if (result.partial) {
          results.partial.push({ name: result.name, fileName: name, fieldCount: result.fieldCount });
        } else {
          results.success.push({ name: result.name, fileName: name });
        }
      } else {
        results.failed.push({ fileName: name, error: result.error });
      }
    }

    setBulkResults(results);
    setStep("bulkResults");
  };

  const handleFile = async (files) => {
    if (!files?.length) return;

    // Check if multiple PDFs or a ZIP with PDFs
    const fileArray = Array.from(files);

    // If multiple files, go to bulk mode
    if (fileArray.length > 1) {
      const pdfFiles = fileArray.filter(f => f.name.toLowerCase().endsWith('.pdf'));
      if (pdfFiles.length > 1) {
        setBulkTeamId(parentTeamId || "");
        setStep("bulk");
        setBulkProgress({ current: 0, total: pdfFiles.length, currentFile: "" });
        setBulkResults({ success: [], partial: [], failed: [] });
        // Store files for processing after team selection
        fileRef.current = pdfFiles.map(f => ({ file: f, name: f.name }));
        return;
      }
    }

    const file = fileArray[0];
    const arrayBuffer = await file.arrayBuffer();
    const headerBytes = new Uint8Array(arrayBuffer.slice(0, 4));
    const isZIP = headerBytes[0] === 0x50 && headerBytes[1] === 0x4B;

    // Check if ZIP contains multiple PDFs
    if (isZIP) {
      let JSZip;
      try { JSZip = await loadJSZip(); } catch (e) {
        // Fall back to single file mode for text-based ZIP
        handleSingleFile(file, arrayBuffer);
        return;
      }

      let zip;
      try { zip = await JSZip.loadAsync(arrayBuffer); } catch (e) {
        setFileName(file.name);
        setStep("entry");
        setExtractStatus("failed");
        setExtractLog(`ZIP extraction failed: ${e.message}. Enter scores manually.`);
        return;
      }

      // Check for PDF files in the ZIP
      const pdfFiles = [];
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir && path.toLowerCase().endsWith('.pdf')) {
          const pdfBuffer = await zipEntry.async('arraybuffer');
          pdfFiles.push({ file: { arrayBuffer: () => Promise.resolve(pdfBuffer) }, name: path.split('/').pop() });
        }
      }

      if (pdfFiles.length > 1) {
        // Multiple PDFs in ZIP - bulk mode
        setBulkTeamId(parentTeamId || "");
        setStep("bulk");
        setBulkProgress({ current: 0, total: pdfFiles.length, currentFile: "" });
        setBulkResults({ success: [], partial: [], failed: [] });
        fileRef.current = pdfFiles;
        return;
      } else if (pdfFiles.length === 1) {
        // Single PDF in ZIP - extract and process
        const pdfBuffer = await pdfFiles[0].file.arrayBuffer();
        handleSingleFile({ name: pdfFiles[0].name }, pdfBuffer);
        return;
      }

      // No PDFs - check for legacy text files (2.txt, 3.txt, 4.txt)
      handleSingleFile(file, arrayBuffer);
      return;
    }

    // Single file - use original logic
    handleSingleFile(file, arrayBuffer);
  };

  const handleSingleFile = async (file, arrayBuffer) => {
    setFileName(file.name);
    setStep("entry");
    setExtractStatus("extracting");
    setFilledFields(new Set());
    setExtractLog("");

    try {
      const headerBytes = new Uint8Array(arrayBuffer.slice(0, 4));
      const isPDF = headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46;
      const isZIP = headerBytes[0] === 0x50 && headerBytes[1] === 0x4B;

      let page2 = "", page3 = "", page4 = "";
      const logs = [];

      if (isZIP) {
        logs.push("Detected ZIP archive");
        let JSZip;
        try { JSZip = await loadJSZip(); } catch (e) {
          setExtractStatus("cdn-blocked");
          setExtractLog("Could not load JSZip library. Enter scores manually.");
          return;
        }
        let zip;
        try { zip = await JSZip.loadAsync(arrayBuffer); } catch (e) {
          setExtractStatus("failed");
          setExtractLog(`ZIP extraction failed: ${e.message}. Enter scores manually.`);
          return;
        }
        try { page2 = await zip.file("2.txt")?.async("string") || ""; } catch (e) { logs.push("Could not read 2.txt"); }
        try { page3 = await zip.file("3.txt")?.async("string") || ""; } catch (e) { logs.push("Could not read 3.txt"); }
        try { page4 = await zip.file("4.txt")?.async("string") || ""; } catch (e) { logs.push("Could not read 4.txt"); }

      } else if (isPDF) {
        logs.push("Detected PDF document");
        let pdfResult;
        try {
          pdfResult = await extractTextFromPDF(arrayBuffer);
        } catch (e) {
          setExtractStatus("failed");
          setExtractLog(`PDF parsing failed: ${e.message}. Enter scores manually.`);
          return;
        }
        page2 = pdfResult.pageTexts[2] || "";
        page3 = pdfResult.pageTexts[3] || "";
        page4 = pdfResult.pageTexts[4] || "";
        logs.push(`Read ${Object.keys(pdfResult.pageTexts).length} pages from ${pdfResult.totalPages}-page PDF`);

      } else {
        setExtractStatus("failed");
        const hex = Array.from(headerBytes).map(b => b.toString(16).padStart(2, "0")).join(" ");
        setExtractLog(`Unrecognized file format (first bytes: ${hex}). Expected PDF or ZIP. Enter scores manually.`);
        return;
      }

      if (!page2 && !page3 && !page4) {
        setExtractStatus("failed");
        setExtractLog(`File was read but no text found on pages 2-4. ${logs.join(". ")}. Enter scores manually.`);
        return;
      }

      const discData = page2 ? parseDISC(page2) : {};
      const valData = page3 ? parseValues(page3) : {};
      const attrData = page4 ? parseAttributes(page4) : {};

      const extracted = {};
      const filled = new Set();

      if (discData.name && discData.name.length > 1) { extracted.name = discData.name; filled.add("name"); }

      const discFields = ["dN_D", "dN_I", "dN_S", "dN_C", "dA_D", "dA_I", "dA_S", "dA_C"];
      for (const key of discFields) { if (discData[key]) { extracted[key] = discData[key]; filled.add(key); } }

      const valFields = ["v_Aes", "v_Eco", "v_Ind", "v_Pol", "v_Alt", "v_Reg", "v_The"];
      for (const key of valFields) { if (valData[key]) { extracted[key] = valData[key]; filled.add(key); } }

      const attrScoreFields = ["e_emp", "e_pra", "e_sys", "i_se", "i_ra", "i_sd"];
      const attrBiasFields = ["e_empB", "e_praB", "e_sysB", "i_seB", "i_raB", "i_sdB"];
      for (const key of attrScoreFields) { if (attrData[key]) { extracted[key] = attrData[key]; filled.add(key); } }
      for (const key of attrBiasFields) { if (attrData[key]) { extracted[key] = attrData[key]; filled.add(key); } }

      setForm(prev => ({ ...prev, ...extracted }));
      setFilledFields(filled);

      const totalScoreFields = 22;
      const scoreFieldsFilled = [...filled].filter(f => !f.endsWith("B")).length;

      if (scoreFieldsFilled >= 20) {
        setExtractStatus("success");
        setExtractLog(`Extracted ${scoreFieldsFilled} of ${totalScoreFields} fields. ${logs.join(". ")}. Review all values before submitting.`);
      } else if (scoreFieldsFilled > 0) {
        setExtractStatus("partial");
        setExtractLog(`Extracted ${scoreFieldsFilled} of ${totalScoreFields} fields. ${totalScoreFields - scoreFieldsFilled} need manual entry. ${logs.join(". ")}.`);
      } else {
        setExtractStatus("failed");
        setExtractLog(`File was parsed but no scores matched expected patterns. ${logs.join(". ")}. Enter scores manually.`);
      }

    } catch (e) {
      setExtractStatus("failed");
      setExtractLog(`Unexpected error: ${e.message}. Enter scores manually.`);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer?.files); };
  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));
  const fb = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const valid = form.name && form.teamId && form.dN_D && form.dN_I && form.dN_S && form.dN_C;

  const submit = () => {
    const person = {
      id: crypto.randomUUID(), name: form.name, orgId: selOrgId, teamId: form.teamId,
      disc: { natural: { D: +form.dN_D, I: +form.dN_I, S: +form.dN_S, C: +form.dN_C }, adaptive: { D: +form.dA_D || 0, I: +form.dA_I || 0, S: +form.dA_S || 0, C: +form.dA_C || 0 } },
      values: { Aesthetic: +form.v_Aes || 0, Economic: +form.v_Eco || 0, Individualistic: +form.v_Ind || 0, Political: +form.v_Pol || 0, Altruistic: +form.v_Alt || 0, Regulatory: +form.v_Reg || 0, Theoretical: +form.v_The || 0 },
      attr: {
        ext: [{ name: "Empathy", label: "Heart", score: +form.e_emp || 0, bias: normBias(form.e_empB) }, { name: "Practical Thinking", label: "Hand", score: +form.e_pra || 0, bias: normBias(form.e_praB) }, { name: "Systems Judgment", label: "Head", score: +form.e_sys || 0, bias: normBias(form.e_sysB) }],
        int: [{ name: "Self-Esteem", score: +form.i_se || 0, bias: normBias(form.i_seB) }, { name: "Role Awareness", score: +form.i_ra || 0, bias: normBias(form.i_raB) }, { name: "Self-Direction", score: +form.i_sd || 0, bias: normBias(form.i_sdB) }]
      }
    };
    onAdd(person);
  };

  const fieldStyle = (key) => ({
    padding: "6px 8px", borderRadius: 6,
    border: `1px solid ${filledFields.has(key) ? "#4CAF50" : C.border}`,
    background: filledFields.has(key) ? "#E8F5E9" : "#fff",
    fontSize: 13, fontWeight: 600, width: "100%", boxSizing: "border-box", textAlign: "center"
  });

  const inp = (label, key, max, w) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: w || 70 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>{label}</label>
      <input type="number" min="0" max={max} value={form[key]} onChange={f(key)} style={fieldStyle(key)} />
    </div>
  );

  const biasSelect = (key) => (
    <select value={form[key]} onChange={fb(key)} style={{
      padding: "6px 4px", borderRadius: 6, fontSize: 12, fontWeight: 600,
      border: `1px solid ${filledFields.has(key) ? "#4CAF50" : C.border}`,
      background: filledFields.has(key) ? "#E8F5E9" : "#fff"
    }}>
      <option value="=">= Balanced</option>
      <option value="+">+ Requires</option>
      <option value="−">− Undervalues</option>
    </select>
  );

  const statusColors = {
    extracting: { bg: "#E3F2FD", border: "#90CAF9", text: "#1565C0", icon: "⏳" },
    success:    { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32", icon: "✅" },
    partial:    { bg: "#FFF3E0", border: "#FFCC80", text: "#E65100", icon: "⚠️" },
    failed:     { bg: "#FFEBEE", border: "#EF9A9A", text: "#C62828", icon: "❌" },
    "cdn-blocked": { bg: "#FFEBEE", border: "#EF9A9A", text: "#C62828", icon: "🚫" }
  };

  // Bulk processing progress (check first - takes priority when processing is active)
  if (step === "bulkProcessing") return (
    <div style={{ padding: 48, maxWidth: 600, margin: "0 auto", background: C.card, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Processing Assessments</div>
      <div style={{ fontSize: 18, color: "#4CAF50", fontWeight: 600, marginBottom: 16 }}>
        {bulkProgress.current} of {bulkProgress.total}
      </div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>{bulkProgress.currentFile}</div>
      <div style={{ height: 8, background: "#E0E0E0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "#4CAF50", borderRadius: 4,
          width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
          transition: "width 0.3s ease"
        }} />
      </div>
    </div>
  );

  // Bulk mode - team selection before processing
  if (step === "bulk") return (
    <div style={{ padding: 48, maxWidth: 600, margin: "0 auto", background: C.card, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 16, display: "block", margin: "0 auto 16px" }}>
          <circle cx="32" cy="32" r="32" fill="#E8F5E9" />
          <path d="M22 32h20M32 22v20" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round"/>
          <path d="M18 24h8M38 24h8M18 40h8M38 40h8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        </svg>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Bulk Upload</div>
        <div style={{ fontSize: 16, color: C.muted }}>{fileRef.current?.length || 0} assessment files ready to process</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: C.text, display: "block", marginBottom: 8 }}>Assign all to team *</label>
        <select value={bulkTeamId} onChange={e => setBulkTeamId(e.target.value)} style={{
          width: "100%", padding: 14, borderRadius: 8, fontSize: 16, boxSizing: "border-box",
          border: `1px solid ${C.border}`, background: "#fff"
        }}>
          <option value="">Select team...</option>
          {org?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <button
        onClick={() => {
          if (!bulkTeamId || !fileRef.current?.length) return;
          setStep("bulkProcessing");
          processBulkFiles(fileRef.current, bulkTeamId);
        }}
        disabled={!bulkTeamId}
        style={{
          width: "100%", padding: "14px 24px", borderRadius: 8, border: "none",
          background: bulkTeamId ? "#4CAF50" : "#E0E0E0",
          color: bulkTeamId ? "#fff" : "#9E9E9E",
          fontSize: 16, fontWeight: 600, cursor: bulkTeamId ? "pointer" : "not-allowed", marginBottom: 16
        }}
      >
        Process {fileRef.current?.length || 0} Files
      </button>

      <Btn onClick={onCancel} style={{ width: "100%" }}>Cancel</Btn>
    </div>
  );

  // Bulk results summary
  if (step === "bulkResults") return (
    <div style={{ padding: 32, maxWidth: 700, margin: "0 auto", background: C.card, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {bulkResults.failed.length === 0 ? "✅" : bulkResults.success.length > 0 ? "⚠️" : "❌"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Upload Complete</div>
        <div style={{ fontSize: 16, color: C.muted }}>
          {bulkResults.success.length + bulkResults.partial.length} added successfully
          {bulkResults.failed.length > 0 && `, ${bulkResults.failed.length} failed`}
        </div>
      </div>

      {bulkResults.success.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>✓</span> Fully Extracted ({bulkResults.success.length})
          </div>
          <div style={{ background: "#E8F5E9", borderRadius: 8, padding: 12, fontSize: 13 }}>
            {bulkResults.success.map((r, i) => (
              <div key={i} style={{ padding: "4px 0", color: "#2E7D32" }}>
                {r.name} <span style={{ opacity: 0.6 }}>- {r.fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bulkResults.partial.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E65100", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠</span> Partial Extraction ({bulkResults.partial.length})
          </div>
          <div style={{ background: "#FFF3E0", borderRadius: 8, padding: 12, fontSize: 13 }}>
            {bulkResults.partial.map((r, i) => (
              <div key={i} style={{ padding: "4px 0", color: "#E65100" }}>
                {r.name} <span style={{ opacity: 0.6 }}>- {r.fieldCount}/22 fields - {r.fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bulkResults.failed.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#C62828", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>✕</span> Failed ({bulkResults.failed.length})
          </div>
          <div style={{ background: "#FFEBEE", borderRadius: 8, padding: 12, fontSize: 13 }}>
            {bulkResults.failed.map((r, i) => (
              <div key={i} style={{ padding: "4px 0", color: "#C62828" }}>
                {r.fileName} <span style={{ opacity: 0.8 }}>- {r.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Btn primary onClick={onCancel} style={{ width: "100%" }}>Done</Btn>
    </div>
  );

  if (step === "upload") return (
    <div style={{ padding: 48, maxWidth: 600, margin: "0 auto", background: C.card, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => fileRef.current?.click?.() || document.getElementById('bulkFileInput')?.click()}
        style={{ border: "2px dashed #29B6F6", borderRadius: 12, padding: "48px 32px", textAlign: "center", cursor: "pointer", background: "#F9FAFB", transition: "all 0.15s", marginBottom: 24 }}>
        {/* Blue upload arrow SVG */}
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 20, display: "block", margin: "0 auto 20px" }}>
          <circle cx="32" cy="32" r="32" fill="#E3F2FD" />
          <path d="M32 42V24M32 24L24 32M32 24L40 32" stroke="#29B6F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 44h24" stroke="#29B6F6" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Drag &amp; Drop Assessment Files Here</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 4 }}>Or click to browse</div>
        <div style={{ fontSize: 14, color: "#4CAF50", fontWeight: 600, marginBottom: 4 }}>Drop multiple PDFs or a ZIP file for bulk upload</div>
        <div style={{ fontSize: 14, color: C.muted }}>Supported: PDF, ZIP containing PDFs</div>
        <input id="bulkFileInput" type="file" accept=".pdf,.zip" multiple style={{ display: "none" }} onChange={e => handleFile(e.target.files)} />
      </div>
      <button onClick={() => document.getElementById('bulkFileInput')?.click()} style={{ width: "100%", padding: "14px 24px", borderRadius: 8, border: "none", background: "#29B6F6", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
        Select Files to Upload
      </button>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => setStep("entry")} style={{ flex: 1 }}>Skip - Enter Scores Manually</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );

  const sc = extractStatus ? statusColors[extractStatus] : null;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: "0 auto", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.text }}>{fileName ? "Review Extracted Data" : "Enter Assessment Scores"}</h2>
          {fileName && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Source: {fileName}</div>}
        </div>
      </div>

      {sc && (
        <div style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${sc.border}`, background: sc.bg, marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{sc.icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: sc.text }}>
              {extractStatus === "extracting" && "Extracting scores from file..."}
              {extractStatus === "success" && "Extraction successful"}
              {extractStatus === "partial" && "Partial extraction. Review highlighted fields."}
              {extractStatus === "failed" && "Extraction failed. Enter scores manually."}
              {extractStatus === "cdn-blocked" && "Library unavailable. Enter scores manually."}
            </div>
            {extractLog && <div style={{ fontSize: 11, color: sc.text, marginTop: 2, opacity: 0.85 }}>{extractLog}</div>}
            {filledFields.size > 0 && (
              <div style={{ fontSize: 10, color: sc.text, marginTop: 4, opacity: 0.7 }}>
                Fields highlighted in green were auto-filled. Review all values for accuracy before submitting.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Name + Team */}
      <div style={{ background: C.card, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: C.text, display: "block", marginBottom: 6 }}>Full Name *</label>
            <input value={form.name} onChange={f("name")} placeholder="e.g. Jane Smith" style={{
              width: "100%", padding: 12, borderRadius: 8, fontSize: 16, boxSizing: "border-box",
              border: "1px solid #D1D5DB",
              background: "#FFFFFF"
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: C.text, display: "block", marginBottom: 6 }}>Assign to Team *</label>
            <select value={form.teamId} onChange={f("teamId")} style={{
              width: "100%", padding: 12, borderRadius: 8, fontSize: 16, boxSizing: "border-box",
              border: "1px solid #D1D5DB",
              background: "#FFFFFF"
            }}>
              <option value="">Select team...</option>
              {org?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* DISC */}
      <div style={{ background: C.card, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.disc.D, marginBottom: 10 }}>DISC Scores (0–100)</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>NATURAL</div>
            <div style={{ display: "flex", gap: 6 }}>{inp("D", "dN_D", 100)}{inp("I", "dN_I", 100)}{inp("S", "dN_S", 100)}{inp("C", "dN_C", 100)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>ADAPTIVE</div>
            <div style={{ display: "flex", gap: 6 }}>{inp("D", "dA_D", 100)}{inp("I", "dA_I", 100)}{inp("S", "dA_S", 100)}{inp("C", "dA_C", 100)}</div>
          </div>
        </div>
      </div>

      {/* VALUES */}
      <div style={{ background: C.card, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.values.Altruistic, marginBottom: 10 }}>Values Scores (0–100)</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {inp("Aesthetic", "v_Aes", 100)}{inp("Economic", "v_Eco", 100)}{inp("Individ.", "v_Ind", 100)}{inp("Political", "v_Pol", 100)}{inp("Altruistic", "v_Alt", 100)}{inp("Regulatory", "v_Reg", 100)}{inp("Theoretic.", "v_The", 100)}
        </div>
      </div>

      {/* ATTRIBUTES */}
      <div style={{ background: C.card, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.attr.ext, marginBottom: 10 }}>Attributes - External (0–10)</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Empathy", "e_emp", 10, 65)}{biasSelect("e_empB")}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Practical", "e_pra", 10, 65)}{biasSelect("e_praB")}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Systems", "e_sys", 10, 65)}{biasSelect("e_sysB")}</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.attr.int, marginBottom: 10, marginTop: 14 }}>Attributes - Internal (0–10)</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Self-Esteem", "i_se", 10, 80)}{biasSelect("i_seB")}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Role Aware.", "i_ra", 10, 80)}{biasSelect("i_raB")}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Self-Direct.", "i_sd", 10, 80)}{biasSelect("i_sdB")}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <Btn primary onClick={submit} disabled={!valid}>Add to Roster</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
        {!valid && (
          <div style={{ fontSize: 11, color: "#E65100", fontWeight: 600 }}>
            ⚠️ Still needed: {[
              !form.name && "Name",
              !form.teamId && "Team assignment",
              !form.dN_D && "D Natural",
              !form.dN_I && "I Natural",
              !form.dN_S && "S Natural",
              !form.dN_C && "C Natural"
            ].filter(Boolean).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
