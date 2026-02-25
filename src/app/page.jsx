'use client';

import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList,
  PieChart, Pie, Legend
} from "recharts";
import { supabase, signIn, signUp, signOut, resetPassword, getSession, onAuthStateChange, getReflections, createReflection, deleteReflection } from "../lib/supabase";

// ────── BRAND COLORS ──────
const C = {
  disc: { D: "#C62828", I: "#FFC107", S: "#4CAF50", C: "#29B6F6", gray: "#9E9E9E" },
  values: { Aesthetic: "#7CB342", Economic: "#5C8DC4", Individualistic: "#F28C4E", Political: "#E05252", Altruistic: "#FFB74D", Regulatory: "#757575", Theoretical: "#B8864A" },
  attr: { ext: "#4f92cf", int: "#C62828" },
  bg: "#F9FAFB", card: "#FFFFFF", border: "#E5E7EB", text: "#111827", muted: "#6B7280", accent: "#1F2937", hi: "#F3F4F6", blue: "#29B6F6", green: "#2E7D32"
};

const discFull = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
const biasInfo = { "+": { word: "Requires", bg: "#F0FAF0", fg: "#2E7D32", bd: "#2E7D32" }, "−": { word: "Undervalues", bg: "#FFF8F5", fg: "#E65100", bd: "#E65100" }, "=": { word: "Balanced", bg: "#F5F9FF", fg: "#1565C0", bd: "#1565C0" } };
const valLevel = s => s >= 70 ? { l: "Very High", c: "#2E7D32" } : s >= 60 ? { l: "High", c: "#558B2F" } : s >= 40 ? { l: "Average", c: C.muted } : s >= 25 ? { l: "Low", c: "#E65100" } : { l: "Very Low", c: "#C62828" };
const getDom = n => { const sorted = Object.entries(n).sort((a, b) => b[1] - a[1]); return sorted.filter(e => e[1] >= 60).map(e => e[0]).join("/") || sorted[0][0]; };

// ─── HELPER ───
const mkP = (id, name, orgId, teamId, dn, da, vals, ext, int_) => ({
  id, name, orgId, teamId,
  disc: { natural: { D: dn[0], I: dn[1], S: dn[2], C: dn[3] }, adaptive: { D: da[0], I: da[1], S: da[2], C: da[3] } },
  values: { Aesthetic: vals[0], Economic: vals[1], Individualistic: vals[2], Political: vals[3], Altruistic: vals[4], Regulatory: vals[5], Theoretical: vals[6] },
  attr: {
    ext: [{ name: "Empathy", label: "Heart", score: ext[0], bias: ext[1] }, { name: "Practical Thinking", label: "Hand", score: ext[2], bias: ext[3] }, { name: "Systems Judgment", label: "Head", score: ext[4], bias: ext[5] }],
    int: [{ name: "Self-Esteem", score: int_[0], bias: int_[1] }, { name: "Role Awareness", score: int_[2], bias: int_[3] }, { name: "Self-Direction", score: int_[4], bias: int_[5] }]
  }
});

// ─── ALL 15 VERIFIED PROFILES ───
const initOrgs = [{ id: "org1", name: "BTCG", teams: [{ id: "t1", name: "Unassigned" }, { id: "t2", name: "Leadership Team" }] }];
const initPeople = [
  mkP("p1","Daniel Truelove Jr.","org1","t1",[81,99,46,25],[49,91,17,10],[16,49,60,60,81,48,43],[8.3,"−",8.3,"+",8.3,"="],[7.4,"−",7.1,"+",7.6,"+"]),
  mkP("p2","Sareya Truelove","org1","t1",[11,60,99,99],[10,25,91,28],[71,36,50,30,88,51,28],[8.6,"−",9.0,"−",7.9,"+"],[8.1,"−",7.9,"+",8.1,"+"]),
  mkP("p3","Pamela Truelove-Walker","org1","t1",[21,53,88,88],[42,53,25,74],[48,30,30,76,71,41,56],[7.4,"=",8.1,"−",8.1,"+"],[7.4,"−",7.1,"+",8.1,"+"]),
  mkP("p4","Timothy Hurd","org1","t2",[49,99,77,25],[42,67,46,28],[38,15,56,71,46,63,60],[7.4,"−",8.3,"−",9.3,"+"],[8.8,"+",6.9,"−",5.5,"+"]),
  mkP("p5","Glenn Greene","org1","t2",[49,67,63,46],[49,74,17,53],[55,61,55,73,53,26,36],[9.0,"−",7.4,"−",5.7,"−"],[7.4,"−",5.7,"+",4.0,"+"]),
  mkP("p6","Kinasha Brown","org1","t2",[99,53,63,32],[95,25,25,10],[36,56,43,83,60,30,50],[8.3,"=",7.6,"−",8.6,"−"],[8.6,"−",6.0,"+",7.1,"−"]),
  mkP("p7","Jamaica Canady","org1","t2",[25,46,99,77],[25,25,60,67],[43,59,41,48,46,68,53],[5.7,"−",4.0,"−",4.5,"+"],[6.0,"−",6.4,"+",4.0,"+"]),
  mkP("p8","Taquia Hylton","org1","t2",[35,67,46,88],[56,67,25,42],[41,40,41,58,58,85,31],[8.8,"=",9.0,"−",8.6,"+"],[7.4,"−",6.2,"+",6.2,"+"]),
  mkP("p9","Dr. Demetra Baxter-Oliver","org1","t2",[49,67,39,77],[56,60,32,42],[35,52,43,58,53,36,80],[7.9,"−",7.9,"=",8.3,"+"],[7.9,"−",5.2,"−",6.2,"+"]),
  mkP("p10","Lisa Green","org1","t2",[14,53,99,99],[10,39,70,53],[60,9,36,56,81,60,46],[7.6,"−",6.4,"−",7.1,"+"],[5.0,"−",6.0,"+",5.5,"+"]),
  mkP("p11","Lamarr Miller","org1","t2",[42,81,99,25],[42,25,70,28],[43,46,66,65,40,48,48],[8.6,"−",7.6,"−",6.9,"+"],[8.8,"+",6.4,"−",4.0,"+"]),
  mkP("p12","Jamie Crosen","org1","t2",[56,28,99,53],[49,39,46,53],[36,30,66,66,56,63,35],[8.3,"=",8.1,"−",9.0,"+"],[4.0,"−",5.0,"+",4.8,"+"]),
  mkP("p13","Kenndell Smith","org1","t2",[99,67,21,53],[77,67,10,28],[38,65,63,68,36,48,41],[8.1,"−",7.9,"−",6.2,"+"],[7.1,"−",6.4,"+",6.2,"+"]),
  mkP("p14","Carolyn Smiley","org1","t2",[56,60,39,77],[70,53,32,28],[48,49,73,40,63,43,41],[9.3,"=",6.4,"−",8.8,"+"],[7.6,"−",6.4,"+",4.0,"+"]),
  mkP("p15","Sophia Jones-Redmond","org1","t2",[25,81,99,39],[49,25,63,28],[60,71,60,36,50,50,35],[4.3,"−",4.0,"−",4.8,"+"],[8.6,"−",6.4,"=",4.0,"−"])
];

// ────── SMALL COMPONENTS ──────
const Bias = ({ bias }) => { const b = biasInfo[bias] || biasInfo["="]; return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: b.bg, color: b.fg, borderLeft: `3px solid ${b.bd}` }}>({bias}) {b.word}</span>; };
const CircleProgress = ({ value, max = 10, color, label, name, bias }) => {
  const radius = 32; const circ = 2 * Math.PI * radius;
  const offset = circ - (value / max) * circ;
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={radius} fill="none" stroke={C.hi} strokeWidth="8" />
        <circle cx="42" cy="42" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 42 42)" />
        <text x="42" y="47" textAnchor="middle" fontSize="18" fontWeight="700" fill={C.text}>{value}</text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.muted }}>{name}</div>
      {bias && <div style={{ marginTop: 4 }}><Bias bias={bias} /></div>}
    </div>
  );
};
const Sec = ({ title, sub, color }) => (<div style={{ marginBottom: 16 }}><h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{title}</h2>{sub && <div style={{ fontSize: 14, color: C.muted }}>{sub}</div>}</div>);

// ────── PHOTO AVATAR ──────
const PhotoAvatar = ({ personId, name, bgColor, photo, onUpload, size = 40, square = false }) => {
  const inputRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const radius = square ? 8 : "50%";
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(personId, ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      {photo ? (
        <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: radius, background: bgColor || C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.32, color: "#fff" }}>
          {initials}
        </div>
      )}
      {hovered && (
        <div style={{ position: "absolute", inset: 0, borderRadius: radius, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size * 0.35, color: "#fff" }}>📷</span>
        </div>
      )}
    </div>
  );
};
const Btn = ({ children, onClick, primary, small, disabled, style: s }) => (<button onClick={onClick} disabled={disabled} style={{ padding: small ? "4px 10px" : "12px 24px", borderRadius: 8, border: primary ? "none" : "2px solid #29B6F6", background: disabled ? "#D1D5DB" : primary ? "#29B6F6" : "#FFFFFF", color: disabled ? "#9CA3AF" : primary ? "#fff" : "#29B6F6", fontSize: small ? 11 : 16, fontWeight: 600, cursor: disabled ? "default" : "pointer", transition: "all 0.15s", ...s }}>{children}</button>);

// ────── TOOLTIPS ──────
const DTip = ({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0]?.payload; return (<div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{d.full}</div>{payload.map((p, i) => (<div key={i} style={{ fontSize: 12, color: C.muted }}><span style={{ color: p.color, fontWeight: 600 }}>{p.name}:</span> {p.value}</div>))}{d.gap !== undefined && <div style={{ fontSize: 11, color: Math.abs(d.gap) >= 10 ? "#C62828" : C.muted, marginTop: 3, fontWeight: 600 }}>Gap: {d.gap > 0 ? "+" : ""}{d.gap}{Math.abs(d.gap) >= 10 ? " ⚡ Energy cost" : ""}</div>}</div>); };
const VTip = ({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0]?.payload; const lv = valLevel(d.score); return (<div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}><div style={{ fontWeight: 700, fontSize: 13, color: d.color }}>{d.name}</div><div style={{ fontSize: 22, fontWeight: 800 }}>{d.score}</div><div style={{ fontSize: 11, color: lv.c, fontWeight: 600 }}>{lv.l}</div></div>); };
const ATip = ({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0]?.payload; return (<div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}><div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div><div style={{ fontSize: 22, fontWeight: 800 }}>{d.score}</div></div>); };

// ────── LIBRARY LOADERS ──────
let jsZipPromise = null;
function loadJSZip() {
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
function loadPDFJS() {
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

async function extractTextFromPDF(arrayBuffer) {
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

// ────── INNERMETRIX PARSERS ──────
function parseDISC(text) {
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

function parseValues(text) {
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

function parseAttributes(text) {
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
      else if (rawBias === "-" || rawBias === "−" || rawBias === "\u2013" || rawBias === "\u2014") result[biasKeys[idx]] = "−";
      else result[biasKeys[idx]] = "=";
      idx++;
    }
  }
  return result;
}

// ────── FRICTION CALCULATION ──────
// Calculate pairwise friction scores between two people
function calculateFriction(personA, personB) {
  const dims = ["D", "I", "S", "C"];

  // PREFERENCE friction (DISC gaps)
  // HIGH ≥ 40 pts | MODERATE 20–39 pts | LOW < 20 pts
  const discGaps = dims.map(d => {
    const aScore = personA.disc.natural[d];
    const bScore = personB.disc.natural[d];
    const gap = Math.abs(aScore - bScore);
    const tier = gap >= 40 ? "high" : gap >= 20 ? "moderate" : "low";
    return { dim: d, gap, tier, aScore, bScore };
  });

  const preferenceScore = discGaps.reduce((sum, g) => {
    if (g.tier === "high") return sum + 3;
    if (g.tier === "moderate") return sum + 1;
    return sum;
  }, 0);

  // PASSION friction (Values gaps)
  const aTopVals = Object.entries(personA.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const bTopVals = Object.entries(personB.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const sharedVals = aTopVals.filter(v => bTopVals.includes(v));
  const aOnlyVals = aTopVals.filter(v => !bTopVals.includes(v));
  const bOnlyVals = bTopVals.filter(v => !aTopVals.includes(v));
  const passionScore = aOnlyVals.length + bOnlyVals.length; // More unshared = more friction

  // PROCESS friction (Attributes bias comparison)
  // CONFLICT = + vs − (3 pts) | TENSION = + vs = or − vs = (1 pt) | ALIGNED = same (0 pts)
  const processBiasScore = (aBias, bBias) => {
    if ((aBias === "+" && bBias === "−") || (aBias === "−" && bBias === "+")) return { resultType: "conflict", score: 3 };
    if (aBias === bBias) return { resultType: "aligned", score: 0 };
    return { resultType: "tension", score: 1 };
  };

  const processResults = ["Heart", "Hand", "Head"].map(attrLabel => {
    const aAttr = personA.attr.ext.find(a => a.label === attrLabel);
    const bAttr = personB.attr.ext.find(a => a.label === attrLabel);
    if (!aAttr || !bAttr) return { label: attrLabel, resultType: "aligned", score: 0, aBias: "=", bBias: "=" };
    const result = processBiasScore(aAttr.bias, bAttr.bias);
    return { label: attrLabel, ...result, aBias: aAttr.bias, bBias: bAttr.bias };
  });

  const processScore = processResults.reduce((sum, r) => sum + r.score, 0);

  // Aggregate score (weighted)
  const totalScore = preferenceScore + passionScore + processScore;

  // Tier for display
  const tier = totalScore >= 12 ? "high" : totalScore >= 6 ? "moderate" : "low";

  return {
    preferenceScore,
    passionScore,
    processScore,
    totalScore,
    tier,
    discGaps,
    valuesDetail: { shared: sharedVals, aOnly: aOnlyVals, bOnly: bOnlyVals },
    processResults
  };
}

// ────── FRICTION MAP COMPONENT ──────
function FrictionMap({ people, teamId, orgId, onClose, onViewComparison }) {
  const [selectedPair, setSelectedPair] = useState(null);
  const members = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending" && p.disc);

  if (members.length < 2) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
        <div style={{ background: C.card, borderRadius: 12, padding: 48, maxWidth: 400, textAlign: "center", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Not Enough Data</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>Need at least 2 team members with complete assessments to generate a friction map.</div>
          <Btn primary onClick={onClose}>Close</Btn>
        </div>
      </div>
    );
  }

  // Calculate all pairwise friction
  const frictionMatrix = {};
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const key = `${members[i].id}-${members[j].id}`;
      frictionMatrix[key] = {
        personA: members[i],
        personB: members[j],
        friction: calculateFriction(members[i], members[j])
      };
    }
  }

  const getFriction = (idA, idB) => {
    if (idA === idB) return null;
    const key1 = `${idA}-${idB}`;
    const key2 = `${idB}-${idA}`;
    return frictionMatrix[key1] || frictionMatrix[key2];
  };

  const tierColors = {
    high: { bg: "#FFEBEE", border: "#EF9A9A", text: "#B71C1C" },
    moderate: { bg: "#FFF3E0", border: "#FFCC80", text: "#E65100" },
    low: { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" }
  };

  // Detail view for selected pair
  if (selectedPair) {
    const { personA, personB, friction } = selectedPair;
    const tierStyle = tierColors[friction.tier];

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
        <div style={{ background: C.card, borderRadius: 12, width: "min(700px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
          {/* Header */}
          <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Friction Analysis</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{personA.name} & {personB.name}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setSelectedPair(null)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back to Map</button>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          <div style={{ padding: "24px 32px" }}>
            {/* Overall score */}
            <div style={{ background: tierStyle.bg, border: `1px solid ${tierStyle.border}`, borderRadius: 10, padding: 20, marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: tierStyle.text, marginBottom: 6 }}>OVERALL FRICTION</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: tierStyle.text, lineHeight: 1 }}>{friction.totalScore}</div>
              <div style={{ fontSize: 13, color: tierStyle.text, fontWeight: 600, marginTop: 4 }}>{friction.tier.toUpperCase()} FRICTION</div>
            </div>

            {/* Three pillars breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Preference", sub: "DISC Style Gaps", score: friction.preferenceScore, max: 12, color: C.disc.D },
                { label: "Passion", sub: "Values Misalignment", score: friction.passionScore, max: 14, color: C.values.Altruistic },
                { label: "Process", sub: "Bias Conflicts", score: friction.processScore, max: 9, color: C.attr.ext }
              ].map(p => (
                <div key={p.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: p.score >= p.max * 0.5 ? "#C62828" : p.score >= p.max * 0.25 ? "#E65100" : "#2E7D32", lineHeight: 1 }}>{p.score}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{p.sub}</div>
                </div>
              ))}
            </div>

            {/* DISC gaps detail */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 12 }}>PREFERENCE GAPS (DISC)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {friction.discGaps.map(g => {
                  const ts = tierColors[g.tier];
                  return (
                    <div key={g.dim} style={{ padding: "10px 12px", borderRadius: 6, background: ts.bg, border: `1px solid ${ts.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: C.disc[g.dim] }}>{discFull[g.dim]}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: ts.text, padding: "2px 8px", borderRadius: 8, background: "#fff" }}>{g.tier.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.text }}>
                        {personA.name.split(" ")[0]}: {g.aScore} · {personB.name.split(" ")[0]}: {g.bScore} · Gap: {g.gap}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Values detail */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 12 }}>PASSION GAPS (VALUES)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {friction.valuesDetail.shared.length > 0 && (
                  <div style={{ padding: "8px 12px", borderRadius: 6, background: "#E8F5E9", borderLeft: "3px solid #2E7D32" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#2E7D32" }}>SHARED: </span>
                    {friction.valuesDetail.shared.map(v => (
                      <span key={v} style={{ fontSize: 11, marginLeft: 6, padding: "2px 8px", borderRadius: 10, background: C.values[v] + "20", color: C.values[v], fontWeight: 600 }}>{v}</span>
                    ))}
                  </div>
                )}
                {friction.valuesDetail.aOnly.length > 0 && (
                  <div style={{ padding: "8px 12px", borderRadius: 6, background: "#FFF3E0", borderLeft: "3px solid #E65100" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#E65100" }}>{personA.name.split(" ")[0]} ONLY: </span>
                    {friction.valuesDetail.aOnly.map(v => (
                      <span key={v} style={{ fontSize: 11, marginLeft: 6, padding: "2px 8px", borderRadius: 10, background: C.values[v] + "20", color: C.values[v], fontWeight: 600 }}>{v}</span>
                    ))}
                  </div>
                )}
                {friction.valuesDetail.bOnly.length > 0 && (
                  <div style={{ padding: "8px 12px", borderRadius: 6, background: "#E3F2FD", borderLeft: "3px solid #1565C0" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1565C0" }}>{personB.name.split(" ")[0]} ONLY: </span>
                    {friction.valuesDetail.bOnly.map(v => (
                      <span key={v} style={{ fontSize: 11, marginLeft: 6, padding: "2px 8px", borderRadius: 10, background: C.values[v] + "20", color: C.values[v], fontWeight: 600 }}>{v}</span>
                    ))}
                  </div>
                )}
                {friction.valuesDetail.shared.length === 0 && friction.valuesDetail.aOnly.length === 0 && friction.valuesDetail.bOnly.length === 0 && (
                  <div style={{ fontSize: 12, color: C.muted, padding: 8 }}>No strong value drivers (≥60) for either person</div>
                )}
              </div>
            </div>

            {/* Process detail */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 12 }}>PROCESS GAPS (ATTRIBUTES)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {friction.processResults.map(r => {
                  const colors = { conflict: { bg: "#FFEBEE", border: "#B71C1C", text: "#B71C1C" }, tension: { bg: "#FFF3E0", border: "#E65100", text: "#E65100" }, aligned: { bg: "#E8F5E9", border: "#2E7D32", text: "#2E7D32" } };
                  const c = colors[r.resultType];
                  return (
                    <div key={r.label} style={{ padding: "10px 14px", borderRadius: 6, background: c.bg, borderLeft: `3px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.label}</span>
                        <span style={{ fontSize: 11, color: C.muted, marginLeft: 12 }}>{personA.name.split(" ")[0]}: {r.aBias} · {personB.name.split(" ")[0]}: {r.bBias}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: c.text, padding: "2px 10px", borderRadius: 8, background: "#fff" }}>{r.resultType.toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main heatmap grid view
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div style={{ background: C.card, borderRadius: 12, width: "min(900px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 24, color: "#fff" }}>Friction Map</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{members.length} members · Pairwise conflict potential</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 11, color: C.muted }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: tierColors.low.bg, border: `1px solid ${tierColors.low.border}` }} /> Low Friction</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: tierColors.moderate.bg, border: `1px solid ${tierColors.moderate.border}` }} /> Moderate</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: tierColors.high.bg, border: `1px solid ${tierColors.high.border}` }} /> High Friction</div>
            <div style={{ marginLeft: "auto", fontWeight: 600 }}>Click any cell to see breakdown</div>
          </div>

          {/* Grid */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: members.length * 80 + 150 }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "left", borderBottom: `1px solid ${C.border}` }}></th>
                  {members.map(m => (
                    <th key={m.id} style={{ padding: 8, fontSize: 11, fontWeight: 600, color: C.text, textAlign: "center", borderBottom: `1px solid ${C.border}`, minWidth: 70 }}>
                      {m.name.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((rowPerson, rowIdx) => (
                  <tr key={rowPerson.id}>
                    <td style={{ padding: 8, fontSize: 11, fontWeight: 600, color: C.text, borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                      {rowPerson.name.split(" ")[0]}
                    </td>
                    {members.map((colPerson, colIdx) => {
                      if (rowIdx === colIdx) {
                        return (
                          <td key={colPerson.id} style={{ padding: 6, textAlign: "center", background: "#F5F5F5" }}>
                            <div style={{ width: 40, height: 40, margin: "0 auto", borderRadius: 6, background: "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9E9E9E" }}>—</div>
                          </td>
                        );
                      }
                      // Only show lower triangle (avoid duplicates)
                      if (colIdx > rowIdx) {
                        return <td key={colPerson.id} style={{ padding: 6, background: "#FAFAFA" }}></td>;
                      }
                      const pair = getFriction(rowPerson.id, colPerson.id);
                      if (!pair) return <td key={colPerson.id} style={{ padding: 6 }}></td>;
                      const tc = tierColors[pair.friction.tier];
                      return (
                        <td key={colPerson.id} style={{ padding: 6, textAlign: "center" }}>
                          <button
                            onClick={() => setSelectedPair(pair)}
                            style={{
                              width: 48, height: 48, margin: "0 auto", borderRadius: 8,
                              background: tc.bg, border: `2px solid ${tc.border}`,
                              cursor: "pointer", display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center", transition: "transform 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                          >
                            <div style={{ fontSize: 16, fontWeight: 800, color: tc.text, lineHeight: 1 }}>{pair.friction.totalScore}</div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: tc.text, opacity: 0.8, marginTop: 2 }}>{pair.friction.tier.slice(0, 3).toUpperCase()}</div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top friction pairs */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Highest Friction Pairs</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.values(frictionMatrix)
                .sort((a, b) => b.friction.totalScore - a.friction.totalScore)
                .slice(0, 3)
                .map((pair, i) => {
                  const tc = tierColors[pair.friction.tier];
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedPair(pair)}
                      style={{
                        padding: "12px 16px", borderRadius: 8, background: tc.bg,
                        border: `1px solid ${tc.border}`, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        textAlign: "left"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{pair.personA.name} & {pair.personB.name}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          Preference: {pair.friction.preferenceScore} · Passion: {pair.friction.passionScore} · Process: {pair.friction.processScore}
                        </div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: tc.text }}>{pair.friction.totalScore}</div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────── VOICE JOURNAL COMPONENT ──────
function VoiceJournal({ userId, people, teamId, orgId, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const recognitionRef = useRef(null);

  const teamMembers = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");

  // Load existing reflections (silently fails if table doesn't exist)
  useEffect(() => {
    async function loadReflections() {
      try {
        const data = await getReflections(userId);
        setReflections(data || []);
      } catch {
        // Table may not exist yet - silently handle
        setReflections([]);
      } finally {
        setLoading(false);
      }
    }
    if (userId) {
      loadReflections();
    } else {
      setLoading(false);
    }
  }, [userId]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(prev => prev + finalTranscript + interimTranscript.replace(prev, ""));
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          // Restart if we're still supposed to be recording
          try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const saveReflection = async () => {
    if (!transcript.trim()) return;

    setSaving(true);
    const reflection = {
      id: crypto.randomUUID(),
      leader_id: userId,
      person_id: selectedPersonId || null,
      content: transcript.trim(),
      created_at: new Date().toISOString()
    };

    // Try to save to database, but store locally regardless
    try {
      await createReflection(reflection);
    } catch {
      // Database save failed (table may not exist) - continue with local storage
    }

    setReflections(prev => [reflection, ...prev]);
    setTranscript("");
    setSelectedPersonId("");
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this reflection?")) return;
    // Try to delete from database
    try {
      await deleteReflection(id);
    } catch {
      // Silently handle - table may not exist
    }
    setReflections(prev => prev.filter(r => r.id !== id));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const getPersonName = (personId) => {
    const person = teamMembers.find(p => p.id === personId);
    return person ? person.name : "General";
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div style={{ background: C.card, borderRadius: 12, width: "min(700px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Leader Reflections</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Voice-powered journaling for leadership insights</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)" }}>✕</button>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Recording section */}
          <div style={{ background: isRecording ? "#FFEBEE" : C.hi, borderRadius: 12, padding: 24, marginBottom: 24, border: `2px solid ${isRecording ? "#EF5350" : C.border}`, transition: "all 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <button
                onClick={toggleRecording}
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: isRecording ? "#EF5350" : C.blue,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isRecording ? "0 0 0 8px rgba(239,83,80,0.2)" : "none",
                  transition: "all 0.3s"
                }}
              >
                {isRecording ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16c-2.47 0-4.52-1.8-4.93-4.15-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
                )}
              </button>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isRecording ? "#C62828" : C.text }}>
                  {isRecording ? "Recording..." : "Tap to Start Recording"}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {isRecording ? "Tap again to stop" : "Share your leadership insights and reflections"}
                </div>
              </div>
            </div>

            {/* Transcript area */}
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder={isRecording ? "Listening..." : "Your voice transcript will appear here, or type directly..."}
              style={{
                width: "100%", minHeight: 120, padding: 16, borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 14, lineHeight: 1.6,
                resize: "vertical", fontFamily: "inherit", background: "#fff"
              }}
            />

            {/* Person selector and save */}
            <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Associate with team member (optional)</label>
                <select
                  value={selectedPersonId}
                  onChange={e => setSelectedPersonId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}
                >
                  <option value="">General reflection</option>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <Btn
                primary
                onClick={saveReflection}
                disabled={!transcript.trim() || saving}
                style={{ marginTop: 16 }}
              >
                {saving ? "Saving..." : "Save Reflection"}
              </Btn>
            </div>
          </div>

          {/* Past reflections */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Past Reflections ({reflections.length})
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 32, color: C.muted }}>Loading reflections...</div>
            ) : reflections.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: C.muted, background: C.hi, borderRadius: 8 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                <div>No reflections yet. Start recording to capture your leadership insights.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto" }}>
                {reflections.map(r => (
                  <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 11, color: C.muted }}>{formatDate(r.created_at)}</span>
                        {r.person_id && (
                          <span style={{ fontSize: 11, marginLeft: 8, padding: "2px 8px", borderRadius: 10, background: C.blue + "15", color: C.blue, fontWeight: 600 }}>
                            Re: {getPersonName(r.person_id)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        style={{ background: "none", border: "none", fontSize: 14, color: "#C62828", cursor: "pointer", opacity: 0.6 }}
                        title="Delete"
                      >✕</button>
                    </div>
                    <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{r.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────── UPLOAD FORM ──────
function UploadForm({ orgs, selOrgId, selTeamId: parentTeamId, onAdd, onCancel }) {
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
        { name: "Empathy", label: "Heart", score: +data.e_emp || 0, bias: data.e_empB || "=" },
        { name: "Practical Thinking", label: "Hand", score: +data.e_pra || 0, bias: data.e_praB || "=" },
        { name: "Systems Judgment", label: "Head", score: +data.e_sys || 0, bias: data.e_sysB || "=" }
      ],
      int: [
        { name: "Self-Esteem", score: +data.i_se || 0, bias: data.i_seB || "=" },
        { name: "Role Awareness", score: +data.i_ra || 0, bias: data.i_raB || "=" },
        { name: "Self-Direction", score: +data.i_sd || 0, bias: data.i_sdB || "=" }
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
        ext: [{ name: "Empathy", label: "Heart", score: +form.e_emp || 0, bias: form.e_empB }, { name: "Practical Thinking", label: "Hand", score: +form.e_pra || 0, bias: form.e_praB }, { name: "Systems Judgment", label: "Head", score: +form.e_sys || 0, bias: form.e_sysB }],
        int: [{ name: "Self-Esteem", score: +form.i_se || 0, bias: form.i_seB }, { name: "Role Awareness", score: +form.i_ra || 0, bias: form.i_raB }, { name: "Self-Direction", score: +form.i_sd || 0, bias: form.i_sdB }]
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
                {r.name} <span style={{ opacity: 0.6 }}>— {r.fileName}</span>
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
                {r.name} <span style={{ opacity: 0.6 }}>— {r.fieldCount}/22 fields — {r.fileName}</span>
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
                {r.fileName} <span style={{ opacity: 0.8 }}>— {r.error}</span>
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
        <Btn onClick={() => setStep("entry")} style={{ flex: 1 }}>Skip — Enter Scores Manually</Btn>
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
              {extractStatus === "partial" && "Partial extraction — review highlighted fields"}
              {extractStatus === "failed" && "Extraction failed — enter scores manually"}
              {extractStatus === "cdn-blocked" && "Library unavailable — enter scores manually"}
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
        <div style={{ fontSize: 13, fontWeight: 700, color: C.attr.ext, marginBottom: 10 }}>Attributes — External (0–10)</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Empathy", "e_emp", 10, 65)}{biasSelect("e_empB")}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Practical", "e_pra", 10, 65)}{biasSelect("e_praB")}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>{inp("Systems", "e_sys", 10, 65)}{biasSelect("e_sysB")}</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.attr.int, marginBottom: 10, marginTop: 14 }}>Attributes — Internal (0–10)</div>
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

// ────── INDIVIDUAL COMPARISON (Sprint 3A) ──────
function IndividualComparison({ leader, person, agreements, setAgreements, onStartWizard }) {
  const dims = ["D", "I", "S", "C"];

  // DISC gap analysis — thresholds per Friction Finder Facilitator Guide
  // HIGH ≥ 40 pts | MODERATE 20–39 pts | LOW < 20 pts
  const discGaps = dims.map(d => {
    const lScore = leader.disc.natural[d];
    const pScore = person.disc.natural[d];
    const gap = Math.abs(lScore - pScore);
    const leaderHigher = lScore > pScore;
    const tier = gap >= 40 ? "high" : gap >= 20 ? "moderate" : "low";
    let text = "";
    if (tier === "low") {
      text = `Both around ${Math.round((lScore + pScore) / 2)} — natural compatibility here. Minor differences won't typically create tension.`;
    } else if (leaderHigher) {
      if (d === "D") text = `Your D is ${lScore}, theirs is ${pScore}. You push for decisions and speed. They need time to evaluate risk before committing.`;
      if (d === "I") text = `Your I is ${lScore}, theirs is ${pScore}. You communicate with energy and optimism. They prefer data and facts over enthusiasm.`;
      if (d === "S") text = `Your S is ${lScore}, theirs is ${pScore}. You value stability and consistency. They're comfortable with change and ambiguity.`;
      if (d === "C") text = `Your C is ${lScore}, theirs is ${pScore}. You want precision and process. They want to move forward without every detail nailed down.`;
    } else {
      if (d === "D") text = `Their D is ${pScore}, yours is ${lScore}. They move faster and push harder than you. Give them challenges and autonomy.`;
      if (d === "I") text = `Their I is ${pScore}, yours is ${lScore}. They need verbal processing, recognition, and social energy you may not naturally provide.`;
      if (d === "S") text = `Their S is ${pScore}, yours is ${lScore}. They need more consistency, patience, and predictability than you naturally deliver.`;
      if (d === "C") text = `Their C is ${pScore}, yours is ${lScore}. They need more specifics, clarity, and structured expectations than you naturally provide.`;
    }
    return { d, lScore, pScore, gap, tier, leaderHigher, text };
  });

  // Tier styles — white cards with left-border accents (no colored backgrounds)
  const tierStyle = {
    high:     { borderColor: "#B71C1C", label: "HIGH",     labelColor: "#B71C1C" },
    moderate: { borderColor: "#E65100", label: "MODERATE", labelColor: "#E65100" },
    low:      { borderColor: "#2E7D32", label: "LOW",      labelColor: "#2E7D32" },
  };

  // Process (Attributes) bias comparison — per Friction Finder Guide
  // CONFLICT = + vs −  |  TENSION = + vs = or − vs =  |  ALIGNED = same bias
  const processBiasResult = (lBias, pBias) => {
    if ((lBias === "+" && pBias === "−") || (lBias === "−" && pBias === "+")) return { label: "CONFLICT", color: "#B71C1C" };
    if (lBias === pBias) return { label: "ALIGNED", color: "#2E7D32" };
    return { label: "TENSION", color: "#E65100" };
  };

  // Values comparison
  const leaderTopVals = Object.entries(leader.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const personTopVals = Object.entries(person.values).filter(([, s]) => s >= 60).map(([k]) => k);
  const sharedVals = leaderTopVals.filter(v => personTopVals.includes(v));
  const leaderOnly = leaderTopVals.filter(v => !personTopVals.includes(v));
  const personOnly = personTopVals.filter(v => !leaderTopVals.includes(v));

  // Attributes comparison
  const leaderExtLead = leader.attr.ext.reduce((a, b) => a.score >= b.score ? a : b);
  const personExtLead = person.attr.ext.reduce((a, b) => a.score >= b.score ? a : b);
  const attrInsightMap = {
    Heart: "starts with people. Lead with how this decision affects the team before covering strategy or numbers.",
    Hand: "starts with what works. Show the practical outcome before the theory or the people dynamics.",
    Head: "starts with the system. Give the framework, data, and structure before the human story."
  };

  const existingAgreement = agreements.find(a => a.leaderId === leader.id && a.personId === person.id);

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "14px 18px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "#C8A96E", fontSize: 16 }}>★</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>CLOSING THE DISTANCE — {leader.name} &amp; {person.name}</div>
          <div style={{ fontSize: 11, color: C.muted }}>Friction map across Preference, Passion, and Process</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Btn primary onClick={onStartWizard} style={{ background: existingAgreement ? C.green : C.accent }}>
            {existingAgreement ? "✓ View Agreement" : "Start Connection Agreement"}
          </Btn>
        </div>
      </div>

      {/* DISC Gaps — Preference Friction */}
      <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PREFERENCE GAP</div>
          <div style={{ fontSize: 13, color: C.muted }}>How your behavioral styles differ across D, I, S, C</div>
        </div>
        {/* Score comparison — Comparison Panel style */}
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ flex: 1, padding: "12px 16px", background: C.card, borderLeft: "3px solid #C8A96E" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>★ {leader.name}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {dims.map(d => <span key={d} style={{ fontSize: 13, fontWeight: 800, color: C.disc[d] }}>{d}:{leader.disc.natural[d]}</span>)}
            </div>
          </div>
          <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: "12px 16px", background: C.card }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{person.name}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {dims.map(d => <span key={d} style={{ fontSize: 13, fontWeight: 800, color: C.disc[d] }}>{d}:{person.disc.natural[d]}</span>)}
            </div>
          </div>
        </div>
        {/* Per-dimension gap cards — white with left-border severity accent */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {discGaps.map(({ d, lScore, pScore, gap, tier, text }) => {
            const ts = tierStyle[tier];
            return (
              <div key={d} style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ts.borderColor}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.disc[d], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.disc[d] }}>{discFull[d]}</span>
                  <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: ts.labelColor, background: ts.labelColor + "10", border: `1px solid ${ts.labelColor}25`, borderRadius: 8, padding: "2px 8px" }}>{ts.label}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: C.hi, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 9, color: "#9A7A42", fontWeight: 700, marginBottom: 2 }}>★ Leader</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{lScore}</div>
                  </div>
                  <div style={{ fontSize: 11, color: tier === "high" ? ts.labelColor : C.muted, fontWeight: 800 }}>Δ{gap}</div>
                  <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: C.hi, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 2 }}>Member</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{pScore}</div>
                  </div>
                </div>
                {tier !== "low" && <div style={{ fontSize: 10, color: C.text, lineHeight: 1.55 }}>{text}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Values Comparison — Passion Friction */}
      <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PASSION GAP</div>
          <div style={{ fontSize: 13, color: C.muted }}>Motivational driver differences — what energizes each of you</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Shared Drivers</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {sharedVals.length > 0 ? sharedVals.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No shared top drivers</span>}
            </div>
          </div>
          <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #E65100" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#A83A00", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Your Blind Spot</div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>They care about this — you may not be fueling it</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {personOnly.length > 0 ? personOnly.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No gaps here</span>}
            </div>
          </div>
          <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #1565C0" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#0D4880", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Your Strength</div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>You care about this — they may not notice or share it</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {leaderOnly.length > 0 ? leaderOnly.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No gaps here</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Comparison — Process Friction */}
      <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PROCESS GAP</div>
          <div style={{ fontSize: 13, color: C.muted }}>Decision-making style — bias comparison per Heart · Hand · Head</div>
        </div>
        {/* Side-by-side attribute profiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[{ label: "★ " + leader.name, data: leader.attr.ext, isLeader: true }, { label: person.name, data: person.attr.ext, isLeader: false }].map(({ label, data, isLeader }) => {
            const sorted = [...data].sort((a, b) => b.score - a.score);
            return (
              <div key={label} style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: isLeader ? "3px solid #C8A96E" : `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isLeader ? "#9A7A42" : C.muted, marginBottom: 8 }}>{label}</div>
                {sorted.map((a, i) => (
                  <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: i === 0 ? C.attr.ext : C.hi, color: i === 0 ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0, border: `1px solid ${i === 0 ? "transparent" : C.border}` }}>{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? C.text : C.muted }}>{a.label}</span>
                    <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto" }}>{a.score}</span>
                    <Bias bias={a.bias} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {/* Bias-based friction analysis per dimension */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Heart", "Hand", "Head"].map(label => {
            const lAttr = leader.attr.ext.find(a => a.label === label);
            const pAttr = person.attr.ext.find(a => a.label === label);
            if (!lAttr || !pAttr) return null;
            const result = processBiasResult(lAttr.bias, pAttr.bias);
            const borderColors = { CONFLICT: "#B71C1C", TENSION: "#E65100", ALIGNED: "#2E7D32" };
            return (
              <div key={label} style={{ padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${borderColors[result.label]}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</span>
                  <span style={{ fontSize: 10, color: C.muted, marginLeft: 8 }}>★ {lAttr.bias} vs. {pAttr.bias}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: result.color, background: result.color + "10", border: `1px solid ${result.color}25`, borderRadius: 8, padding: "2px 10px" }}>{result.label}</span>
              </div>
            );
          })}
        </div>
        {leaderExtLead.label !== personExtLead.label && (
          <div style={{ marginTop: 10, padding: "12px 16px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, fontSize: 11, color: C.text, lineHeight: 1.6 }}>
            <strong>{person.name.split(" ")[0]}</strong> {attrInsightMap[personExtLead.label]}
          </div>
        )}
      </div>
    </div>
  );
}

// ────── CONNECTION AGREEMENT WIZARD (Sprint 3B) ──────
function BridgeWizard({ leader, person, agreements, setAgreements, onClose }) {
  const existing = agreements.find(a => a.leaderId === leader.id && a.personId === person.id);
  const [step, setStep] = useState(existing ? 4 : 1);
  const [discussion, setDiscussion] = useState(existing?.discussion || "");
  const [needFromThem, setNeedFromThem] = useState(existing?.needFromThem || "");
  const [myCommitment, setMyCommitment] = useState(existing?.myCommitment || "");
  const [repairProtocol, setRepairProtocol] = useState(existing?.repairProtocol || "");
  const [checkIn, setCheckIn] = useState(existing?.checkInCadence || "Weekly");

  // Auto-generate friction points from DISC gaps
  const dims = ["D", "I", "S", "C"];
  const frictionPoints = dims.map(d => {
    const lScore = leader.disc.natural[d];
    const pScore = person.disc.natural[d];
    const gap = Math.abs(lScore - pScore);
    if (gap < 20) return null;
    const leaderHigher = lScore > pScore;
    const tier = gap >= 30 ? "Major" : "Moderate";
    let text = "";
    if (leaderHigher) {
      if (d === "D") text = `Your D is ${lScore}, theirs is ${pScore}. You push for decisions. They need time to evaluate risk.`;
      if (d === "I") text = `Your I is ${lScore}, theirs is ${pScore}. You communicate with energy. They prefer facts over feelings.`;
      if (d === "S") text = `Your S is ${lScore}, theirs is ${pScore}. You value stability. They're comfortable with change.`;
      if (d === "C") text = `Your C is ${lScore}, theirs is ${pScore}. You want every detail right. They want to move forward.`;
    } else {
      if (d === "D") text = `Their D is ${pScore}, yours is ${lScore}. They move faster than you. Give them problems to solve.`;
      if (d === "I") text = `Their I is ${pScore}, yours is ${lScore}. They need verbal processing and social energy.`;
      if (d === "S") text = `Their S is ${pScore}, yours is ${lScore}. They need more consistency than you do.`;
      if (d === "C") text = `Their C is ${pScore}, yours is ${lScore}. They need more clarity and specifics than you naturally provide.`;
    }
    return { d, tier, text };
  }).filter(Boolean);

  const saveAgreement = () => {
    const newA = {
      id: "a" + Date.now(), leaderId: leader.id, personId: person.id,
      frictionPoints, discussion, needFromThem, myCommitment, repairProtocol,
      checkInCadence: checkIn, createdAt: new Date().toISOString()
    };
    setAgreements(prev => [...prev.filter(a => !(a.leaderId === leader.id && a.personId === person.id)), newA]);
    setStep(4);
  };

  const stepLabels = ["Discover", "Discuss", "Design", "Agreement"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: C.card, borderRadius: 14, width: "min(640px, 95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Connection Agreement</div>
            <div style={{ fontSize: 11, color: C.muted }}>{leader.name} &amp; {person.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: "0 4px" }}>✕</button>
        </div>
        {/* Step Progress */}
        <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 0 }}>
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={label} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: done ? C.green : active ? C.accent : C.border, color: (done || active) ? "#fff" : C.muted }}>{done ? "✓" : n}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: active ? C.text : C.muted, marginTop: 3 }}>{label}</div>
                </div>
                {i < 3 && <div style={{ flex: "0 0 20px", height: 2, background: done ? C.green : C.border, marginBottom: 14 }} />}
              </div>
            );
          })}
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {step === 1 && (
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800 }}>Step 1: Discover</h3>
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>These friction points were automatically identified from your assessment data. They represent the most likely sources of tension between you and {person.name.split(" ")[0]}.</p>
              {frictionPoints.length === 0 ? (
                <div style={{ padding: "16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "4px solid #2E7D32", fontSize: 12, color: "#2E7D32" }}>✓ No significant DISC gaps detected. Your styles are naturally aligned.</div>
              ) : frictionPoints.map(({ d, tier, text }) => (
                <div key={d} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${tier === "Major" ? "#C62828" : "#E65100"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.disc[d], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.disc[d] }}>{discFull[d]}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: tier === "Major" ? "#C62828" : "#F57F17", marginLeft: "auto" }}>{tier} Gap</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{text}</div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800 }}>Step 2: Discuss</h3>
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>Think of a specific moment when one of these friction points showed up in a real interaction with {person.name.split(" ")[0]}. Describe what happened.</p>
              <textarea value={discussion} onChange={e => setDiscussion(e.target.value)} placeholder={`Describe a real situation where you noticed friction with ${person.name.split(" ")[0]}...`}
                style={{ width: "100%", minHeight: 140, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800 }}>Step 3: Design</h3>
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>Build your commitment to {person.name.split(" ")[0]}.</p>
              {[
                { label: "What I need from them", hint: `What do you need ${person.name.split(" ")[0]} to understand or do differently?`, val: needFromThem, set: setNeedFromThem },
                { label: "What I commit to", hint: "What will you personally change or do consistently?", val: myCommitment, set: setMyCommitment },
                { label: "If things break down...", hint: "How will you repair the relationship when tension rises?", val: repairProtocol, set: setRepairProtocol }
              ].map(({ label, hint, val, set }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                  <textarea value={val} onChange={e => set(e.target.value)} placeholder={hint}
                    style={{ width: "100%", minHeight: 70, padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, lineHeight: 1.5, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Check-in Cadence</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Weekly", "Bi-weekly", "Monthly"].map(opt => (
                    <button key={opt} onClick={() => setCheckIn(opt)} style={{ padding: "5px 14px", borderRadius: 6, border: `1px solid ${checkIn === opt ? C.accent : C.border}`, background: checkIn === opt ? C.accent : "transparent", color: checkIn === opt ? "#fff" : C.text, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800 }}>Connection Agreement</h3>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>{leader.name} &amp; {person.name} · Agreed {new Date().toLocaleDateString()}</div>
              {frictionPoints.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>Identified Friction Points</div>
                  {frictionPoints.map(({ d, tier, text }) => (
                    <div key={d} style={{ fontSize: 11, padding: "6px 10px", borderRadius: 6, background: C.hi, border: `1px solid ${C.border}`, marginBottom: 5, lineHeight: 1.4 }}>
                      <strong style={{ color: C.disc[d] }}>{discFull[d]} ({tier}):</strong> {text}
                    </div>
                  ))}
                </div>
              )}
              {[
                { label: "What I Need From You", val: needFromThem },
                { label: "What I Commit To", val: myCommitment },
                { label: "If Things Break Down", val: repairProtocol },
              ].map(({ label, val }) => val && (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, padding: "8px 12px", borderRadius: 7, background: C.hi, border: `1px solid ${C.border}`, lineHeight: 1.5 }}>{val}</div>
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 4 }}>Check-in Cadence</div>
                <div style={{ fontSize: 12, padding: "8px 12px", borderRadius: 7, background: C.hi, border: `1px solid ${C.border}` }}>{checkIn}</div>
              </div>
              <button onClick={() => window.print()} style={{ padding: "8px 18px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.hi, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🖨 Print Agreement</button>
            </div>
          )}
        </div>
        {/* Footer Nav */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Btn onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>{step === 1 ? "Cancel" : "← Back"}</Btn>
          <div style={{ display: "flex", gap: 8 }}>
            {step < 3 && <Btn primary onClick={() => setStep(s => s + 1)}>Next →</Btn>}
            {step === 3 && <Btn primary onClick={saveAgreement}>Save Agreement →</Btn>}
            {step === 4 && <Btn primary onClick={onClose}>Done</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────── SPRINT 4A: ENVIRONMENT REPORT ──────
const discInterp = {
  D: {
    high:  "You drive toward results, challenge the status quo, and push through obstacles. You are decisive, direct, and determined. Your team experiences you as bold and fast-moving.",
    mod:   "You balance assertiveness with cooperation. You push when needed but know when to step back. You can lead decisively or follow strategically.",
    low:   "You prefer to work collaboratively and avoid confrontation. You may defer to others more than your situation warrants. Your team may underestimate your opinions."
  },
  I: {
    high:  "You lead with enthusiasm, optimism, and social energy. People are drawn to your communication style and warmth. You are at your best when connecting and inspiring.",
    mod:   "You can connect with people when needed but don't rely solely on charm. You balance influence with substance and can work alone or with groups.",
    low:   "You prefer facts over feelings and work over socializing. You may come across as reserved or intensely task-focused. Relationship-building takes intentional effort."
  },
  S: {
    high:  "You create stability, consistency, and a steady environment for others. You are dependable, patient, and team-oriented. People trust you because you show up the same way every time.",
    mod:   "You adapt to both stable and changing environments. You're comfortable with routine but can handle disruption when it's necessary.",
    low:   "You thrive on variety, change, and movement. Routine feels like a cage to you. You are comfortable initiating change others find threatening."
  },
  C: {
    high:  "You lead with precision, quality, and analytical depth. You hold yourself and others to a high standard. Getting it right matters more to you than getting it done fast.",
    mod:   "You care about accuracy but don't get paralyzed by it. You look for patterns and make thoughtful, calculated decisions without needing every data point.",
    low:   "You trust your gut over data and move fast. You may overlook important details when the pace is high. Rules and procedures feel like obstacles."
  }
};
const discLevel = s => s >= 70 ? "high" : s >= 40 ? "mod" : "low";
const discLevelLabel = s => s >= 70 ? "High" : s >= 40 ? "Moderate" : "Low";

const valInterp = {
  Aesthetic:       "driven by harmony, beauty, balance, and creative expression. Environments that lack aesthetic order slowly drain your energy.",
  Economic:        "highly practical, efficiency-driven, and focused on ROI. You want to know the return on every investment of time and energy.",
  Individualistic: "someone who craves independence, uniqueness, and the freedom to forge your own path. Being micromanaged costs you deeply.",
  Political:       "driven by influence, control, and leadership position. You want to lead — not follow — and you track power dynamics instinctively.",
  Altruistic:      "someone who leads from purpose and service. Helping others is not a job — it is a calling. When your work lacks meaning, it costs you.",
  Regulatory:      "someone who needs structure, order, rules, and tradition. Chaos and ambiguity are your kryptonite. Clear systems make you effective.",
  Theoretical:     "a knowledge-seeker at heart. Learning, analyzing, and understanding for its own sake energizes you. Shallow work bores you."
};

const attrExtInterp = {
  Heart: { high: "Your strongest lens is people. You instinctively read how decisions affect relationships before anything else.", low: "People dynamics are not your first filter. You may miss how decisions land emotionally before logic kicks in." },
  Hand:  { high: "Your first question is always: what works? You filter the world through practical results before theory or people.", low: "Practical outcomes are not your first filter. You may prefer theory or relationships before asking if it actually works." },
  Head:  { high: "Your strongest lens is systems and logic. You see structure, process, and data before people or practicality.", low: "Systems and frameworks are not your first filter. You may skip the data and trust instinct or relationship." }
};
const attrIntInterp = {
  "Self-Esteem":    { "+": "You undervalue your own worth. You may dismiss your contributions, defer too quickly, or need external validation to feel confident.", "−": "You undervalue your own worth. You may dismiss your contributions, defer too quickly, or need external validation to feel confident.", "=": "You have a stable sense of your own worth. You can receive feedback without it destabilizing your identity." },
  "Role Awareness": { "+": "You require clarity about your role and purpose to function at your best. Ambiguity about expectations costs you energy.", "−": "You undervalue role clarity. You may take on tasks outside your lane or lack boundaries about what is yours to carry.", "=": "You have a balanced relationship with your role. You know what's yours and what isn't, most of the time." },
  "Self-Direction": { "+": "You require significant guidance and structure from external sources to operate effectively. Independence is taxing.", "−": "You undervalue external direction. You may resist coaching, skip collaboration, or overestimate your own self-sufficiency.", "=": "You balance autonomy and collaboration effectively. You can lead yourself while remaining coachable." }
};

function ReportSection({ num, title, children }) {
  return (
    <div style={{ marginBottom: 36, pageBreakInside: "avoid" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 4, height: 24, borderRadius: 2, background: "#C8A96E", flexShrink: 0 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: "#C8A96E", textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>{String(num).padStart(2, "0")}</div>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3, color: C.text }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function EnvironmentReport({ person, onClose }) {
  const p = person;
  const dims = ["D", "I", "S", "C"];

  // DISC data
  const discRows = dims.map(d => ({
    d, full: discFull[d],
    nat: p.disc.natural[d], adp: p.disc.adaptive[d],
    gap: p.disc.adaptive[d] - p.disc.natural[d]
  }));

  // Preference Tax
  const prefTax = discRows.reduce((sum, r) => sum + Math.abs(r.gap), 0);
  const prefTaxLabel = prefTax >= 40 ? "Heavy" : prefTax >= 20 ? "Moderate" : "Light";
  const prefTaxColor = prefTax >= 40 ? "#C62828" : prefTax >= 20 ? "#E65100" : C.green;

  // Values
  const valRows = Object.entries(p.values).sort((a, b) => b[1] - a[1]);
  const topVals = valRows.filter(([, s]) => s >= 60);
  const lowVals = valRows.filter(([, s]) => s < 40);

  // Attributes
  const extSorted = [...p.attr.ext].sort((a, b) => b.score - a.score);
  const intRows = p.attr.int;

  // Process Tax (count of "−" on external)
  const extMinusBiases = p.attr.ext.filter(a => a.bias === "−").length;
  const processTaxLabel = extMinusBiases === 0 ? "None" : extMinusBiases === 1 ? "Light" : extMinusBiases === 2 ? "Moderate" : "Heavy";
  const processTaxColor = extMinusBiases === 0 ? C.green : extMinusBiases === 1 ? "#558B2F" : extMinusBiases === 2 ? "#E65100" : "#C62828";

  // Internal tax (count of "−" on internal)
  const intMinusBiases = p.attr.int.filter(a => a.bias === "−").length;
  const intTaxLabel = intMinusBiases === 0 ? "None" : intMinusBiases === 1 ? "Light" : intMinusBiases === 2 ? "Moderate" : "Heavy";

  const taxCard = (label, value, color, note) => (
    <div style={{ flex: 1, padding: "16px 18px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div style={{ background: C.card, borderRadius: 12, width: "min(900px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Controls */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 32, color: "#fff" }}>Environment Report: {p.name}</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Natural vs Adaptive · Love Where You Lead</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Print Report</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 48 }} id="report-content">

          {/* Cover */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 0 28px", borderBottom: `1px solid ${C.border}`, marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1A1A18", color: "#C8A96E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
              {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{p.name}</h1>
                {dims.map(d => <span key={d} style={{ padding: "3px 10px", borderRadius: 4, background: C.disc[d], color: d === "I" ? "#111827" : "#fff", fontWeight: 700, fontSize: 11 }}>{d}:{p.disc.natural[d]}</span>)}
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>Love Where You Lead — Environment Report</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          </div>

          {/* 1: YOUR PREFERENCE — Natural */}
          <ReportSection num={1} title="YOUR PREFERENCE — Natural Style">
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>Your Natural style reflects how you are hardwired to lead when you are comfortable, off-guard, or under pressure. This is who you are when no one is adjusting for the room.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
            {discRows.map(({ d, full, nat }) => (
              <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "16px 20px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.disc[d]}` }}>
                <div style={{ flexShrink: 0, minWidth: 100 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.disc[d], textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{full}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.disc[d], lineHeight: 1 }}>{nat}</div>
                </div>
                <div style={{ flex: 1, paddingTop: 2 }}>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{discInterp[d][discLevel(nat)]}</div>
                </div>
              </div>
            ))}
            </div>
          </ReportSection>

          {/* 2: Adaptive Style */}
          <ReportSection num={2} title="YOUR PREFERENCE — Adaptive Style">
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>Your Adaptive style reflects how you are adjusting to the demands of your current environment. When Natural and Adaptive differ significantly, your environment is asking you to be someone you are not — and that costs energy.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
            {discRows.map(({ d, full, nat, adp, gap }) => {
              const absgap = Math.abs(gap);
              const costly = absgap >= 20;
              const dir = gap > 0 ? "Environment is demanding more " + full : "Environment is suppressing your " + full;
              const borderColor = costly ? "#E65100" : C.disc[d];
              return (
                <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "16px 20px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${borderColor}` }}>
                  <div style={{ flexShrink: 0, minWidth: 100 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: borderColor, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{full}</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: borderColor, lineHeight: 1 }}>{adp}</div>
                    {costly && <div style={{ fontSize: 10, fontWeight: 600, color: "#E65100", marginTop: 4 }}>Δ{absgap} from natural</div>}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: costly ? 8 : 0 }}>
                      Natural: <strong>{nat}</strong> → Adaptive: <strong>{adp}</strong>
                    </div>
                    {costly && <div style={{ fontSize: 13, color: "#E65100", lineHeight: 1.6 }}>{dir}</div>}
                  </div>
                </div>
              );
            })}
            </div>
          </ReportSection>

          {/* 3: Preference Tax */}
          <ReportSection num={3} title="PREFERENCE TAX — The Cost of Adapting">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>The Preference Tax measures the total energy you spend each day adapting your natural behavioral style to meet the demands of your environment. The higher the number, the more exhausted you are at the end of each day — even if you cannot explain why.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              {taxCard("Total Gap Points", prefTax, prefTaxColor, `Across all 4 DISC dimensions`)}
              {taxCard("Tax Level", prefTaxLabel, prefTaxColor, prefTax >= 40 ? "You are paying a heavy daily tax." : prefTax >= 20 ? "Moderate daily energy drain." : "Your environment generally fits your style.")}
            </div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, padding: "10px 14px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
              {prefTaxLabel === "Heavy" && "A Heavy Preference Tax means your environment is significantly misaligned with your natural operating style. You are likely experiencing chronic fatigue, frustration, or the sense that you have to perform a version of yourself that doesn't feel authentic. This is not a character flaw — it is an environment problem."}
              {prefTaxLabel === "Moderate" && "A Moderate Preference Tax means your environment asks you to adapt in some meaningful ways. You have days where you feel in your element and days where you feel like you're swimming upstream. Identifying which dimensions carry the most cost can help you negotiate better conditions."}
              {prefTaxLabel === "Light" && "A Light Preference Tax means your environment generally allows you to operate in alignment with your natural style. This is a rare and valuable gift. The gap you do have is worth monitoring — environments change, and so do their demands."}
            </div>
          </ReportSection>

          {/* 4: YOUR PASSION — Values */}
          <ReportSection num={4} title="YOUR PASSION — What Drives You">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your Values reveal what you are fundamentally motivated by — what gets you out of bed, what gives your work meaning, and what drains you when it is absent. These are not preferences. They are the fuel your leadership runs on.</p>
            {topVals.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>Top Drivers (Score 60+)</div>
                {topVals.map(([name, score]) => (
                  <div key={name} style={{ marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.values[name], display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.values[name] }}>{name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 800, color: C.values[name] }}>{score}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#2E7D32", background: C.card, border: "1px solid #A5D6A7", borderLeft: "3px solid #2E7D32", borderRadius: 4, padding: "1px 7px" }}>Top Driver</span>
                    </div>
                    <div style={{ height: 4, background: C.hi, borderRadius: 2, marginBottom: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${score}%`, background: C.values[name], borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{name} at {score}. You are {valInterp[name]} This feeds your motivation.</div>
                  </div>
                ))}
              </div>
            )}
            {lowVals.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>Low Drivers (Score under 40)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lowVals.map(([name, score]) => (
                    <div key={name} style={{ flex: "1 1 200px", padding: "8px 10px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[name], display: "inline-block" }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.values[name] }}>{name}: {score}</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>This is not what gets you out of bed.</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ReportSection>

          {/* 5: YOUR PROCESS — External */}
          <ReportSection num={5} title="YOUR PROCESS — External (Heart, Hand, Head)">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your External Attributes determine what you see first when you look at any situation. This is your decision-making order — the lens through which all information is filtered before you act.</p>
            {extSorted.map((a, i) => {
              const key = i === 0 ? "high" : "low";
              const interp = attrExtInterp[a.label]?.[key] || "";
              return (
                <div key={a.name} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: i === 0 ? `4px solid ${C.attr.ext}` : `1px solid ${C.border}` }}>
                  <div style={{ flexShrink: 0, textAlign: "center", width: 52 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: i === 0 ? C.attr.ext : C.muted, textTransform: "uppercase" }}>{i + 1}.</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.attr.ext }}>{a.score}</div>
                    <Bias bias={a.bias} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.attr.ext : C.text, marginBottom: 3 }}>{a.label} — {a.name}</div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{interp}</div>
                    {a.bias === "−" && <div style={{ fontSize: 10, color: "#E65100", marginTop: 3, fontWeight: 600 }}>⚠ Undervalued — you have this capacity but your environment conditioned you to use it less.</div>}
                    {a.bias === "+" && <div style={{ fontSize: 10, color: "#2E7D32", marginTop: 3, fontWeight: 600 }}>↑ You require this sense to function well. When it is absent, decisions feel incomplete.</div>}
                  </div>
                </div>
              );
            })}
          </ReportSection>

          {/* 6: Internal Attributes */}
          <ReportSection num={6} title="YOUR PROCESS — Internal (Leadership Foundation)">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>Your Internal Attributes reflect how you see yourself — your own worth, your purpose, and your capacity to lead yourself. These are the foundation beneath everything else you do.</p>
            {intRows.map(a => (
              <div key={a.name} style={{ marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.attr.int, flexShrink: 0, width: 40 }}>{a.score}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{a.name}</div>
                    <Bias bias={a.bias} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{attrIntInterp[a.name]?.[a.bias] || attrIntInterp[a.name]?.["="]}</div>
              </div>
            ))}
          </ReportSection>

          {/* 7: Process Tax */}
          <ReportSection num={7} title="PROCESS TAX — Where Capacity Is Being Lost">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>The Process Tax measures how much of your innate decision-making capacity is underutilized. Every minus (−) bias on an External Attribute means you have a lens your environment has conditioned you not to trust.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              {taxCard("External Underutilized", `${extMinusBiases} of 3`, processTaxColor, extMinusBiases === 0 ? "All external capacities active" : `${extMinusBiases} lens${extMinusBiases > 1 ? "es" : ""} being underused`)}
              {taxCard("Internal Underutilized", `${intMinusBiases} of 3`, intMinusBiases === 0 ? C.green : "#E65100", intTaxLabel + " internal tax")}
              {taxCard("Process Tax Level", processTaxLabel, processTaxColor, "Based on external capacity")}
            </div>
            {extMinusBiases > 0 && (
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, padding: "12px 16px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, borderLeft: "4px solid #E65100" }}>
                You have decision-making capacity that your environment has trained you not to use. This shows up as second-guessing yourself, ignoring data you know matters, or defaulting to one lens even when the situation calls for another.
              </div>
            )}
          </ReportSection>

          {/* 8: Compound Bill */}
          <ReportSection num={8} title="THE COMPOUND BILL — Your Total Environment Tax">
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>The Compound Bill is the combined picture of what your environment costs you every day. Preference Tax drains your behavioral energy. Process Tax drains your decision-making capacity. Together, they explain the gap between who you are and how you show up.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {taxCard("Preference Tax", prefTaxLabel, prefTaxColor, `${prefTax} gap points across DISC`)}
              {taxCard("Process Tax", processTaxLabel, processTaxColor, `${extMinusBiases} external lenses underused`)}
            </div>
            {/* Peak-End Rule: Compound Bill Verdict — the session's peak moment */}
            {(() => {
              const overallLabel = prefTaxLabel === "Heavy" || processTaxLabel === "Heavy" ? "Heavy" : prefTaxLabel === "Moderate" || processTaxLabel === "Moderate" ? "Moderate" : "Light";
              const overallColor = overallLabel === "Heavy" ? "#C62828" : overallLabel === "Moderate" ? "#E65100" : C.green;
              const verdictCopy = overallLabel === "Heavy"
                ? `The exhaustion you feel is not a motivation problem. It is a design problem. Your environment is costing you more than it should — and you deserve to know that.`
                : overallLabel === "Moderate"
                ? `You have days where you feel in your element and days where you feel like you're performing. The gap between those days is solvable. It starts here.`
                : `Your environment is a rare and valuable fit. The work now is to protect it — and to help your team find the same alignment.`;
              return (
                <div style={{ padding: "24px 28px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, borderLeft: `5px solid ${overallColor}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Your Compound Bill</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: overallColor, lineHeight: 1, marginBottom: 12 }}>{overallLabel}</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, fontWeight: 500 }}>
                    {p.name.split(" ")[0]}, {verdictCopy}
                  </div>
                </div>
              );
            })()}
          </ReportSection>

        </div>
      </div>
    </div>
  );
}

// ────── SPRINT 4B: TEAM SUMMARY ──────
function TeamSummary({ people, teamId, orgId, leader, onClose, photos = {}, onUploadPhoto, onViewProfile, onCompare, onShowTips }) {
  const members = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");

  // Generate insight text based on person's profile
  const generateInsight = (p) => {
    const dom = getDom(p.disc.natural);
    const topVals = Object.entries(p.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const extLead = [...p.attr.ext].sort((a, b) => b.score - a.score)[0];
    const firstName = p.name.split(" ")[0];

    let insight = `${firstName} `;

    // DISC-based insight
    if (dom.includes("I") || dom.includes("S")) {
      insight += "tends to focus on the people and process aspects of decisions, requiring collaboration and structure, ";
    } else if (dom.includes("D")) {
      insight += "drives toward results and quick decisions, preferring autonomy and direct communication, ";
    } else {
      insight += "approaches decisions with analytical precision and attention to detail, ";
    }

    // Attribute-based insight
    if (extLead.label === "Heart") {
      insight += "while prioritizing emotional considerations.";
    } else if (extLead.label === "Hand") {
      insight += "while prioritizing practical outcomes.";
    } else {
      insight += "while undervaluing emotional considerations.";
    }

    return insight;
  };

  const summaryCard = (p) => {
    const dom = getDom(p.disc.natural);
    const domStyles = dom.split("/").map(d => discFull[d]);
    const topVals = Object.entries(p.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const extSorted = [...p.attr.ext].sort((a, b) => b.score - a.score);

    return (
      <div key={p.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, pageBreakInside: "avoid", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: 16 }}>
        {/* Card header */}
        <div style={{ background: "#1F2937", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <PhotoAvatar personId={p.id} name={p.name} bgColor="rgba(255,255,255,0.2)" photo={photos[p.id]} onUpload={onUploadPhoto} size={40} square={false} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{p.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>Love Where You Lead — Member Summary</div>
          </div>
        </div>

        {/* Three-column content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 0 }}>

          {/* LEFT: Leadership Style + DISC + Top Drivers */}
          <div style={{ padding: "16px 20px", borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>LEADERSHIP STYLE</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {domStyles.map(style => (
                <span key={style} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "#FFC107", color: "#1F2937" }}>{style}</span>
              ))}
            </div>

            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>Natural DISC scores</div>
            <div style={{ fontSize: 12, color: C.text, marginBottom: 14 }}>
              {["D","I","S","C"].map(d => (
                <span key={d} style={{ marginRight: 8 }}>
                  <span style={{ color: C.disc[d], fontWeight: 600 }}>{d}:</span>{p.disc.natural[d]}
                </span>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>TOP DRIVERS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {topVals.length > 0 ? topVals.slice(0, 4).map(v => (
                <div key={v} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[v], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.text }}>{v}</span>
                </div>
              )) : <div style={{ fontSize: 12, color: C.muted }}>No strong drivers</div>}
            </div>
          </div>

          {/* MIDDLE: Decision Style (Attributes) */}
          <div style={{ padding: "16px 20px", borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>DECISION STYLE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {extSorted.map(a => {
                const biasColor = a.bias === "+" ? "#2E7D32" : a.bias === "−" ? "#E65100" : C.muted;
                const biasText = a.bias === "+" ? "Requires" : a.bias === "−" ? "Undervalues" : "Balanced";
                return (
                  <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: a.bias === "+" ? "#F0FAF0" : a.bias === "−" ? "#FFF8F5" : C.hi, borderLeft: `3px solid ${biasColor}` }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text, minWidth: 40 }}>{a.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: biasColor }}>{a.score}</span>
                    <span style={{ fontSize: 10, color: biasColor, fontWeight: 600 }}>{biasText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: What Your Leader Learned + Go Deeper */}
          <div style={{ padding: "16px 20px", background: "#FFFDE7" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>WHAT YOUR LEADER LEARNED</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>
              {leader ? generateInsight(p) : "Designate a leader to see personalized insights"}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>GO DEEPER</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => { onClose(); onViewProfile?.(p.id); }} style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: C.blue, cursor: "pointer", textAlign: "left", textDecoration: "underline" }}>View full profile</button>
              <button onClick={() => { onClose(); onCompare?.(p.id); }} style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: C.blue, cursor: "pointer", textAlign: "left", textDecoration: "underline" }}>Compare with others</button>
              <button onClick={() => { onClose(); onShowTips?.(p.id); }} style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: C.blue, cursor: "pointer", textAlign: "left", textDecoration: "underline" }}>See leadership tips</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div style={{ background: C.card, borderRadius: 12, width: "min(1000px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 32, color: "#fff" }}>Team Summary</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{members.length} members · Love Where You Lead</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Print All</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ padding: "32px 48px" }}>
          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>No complete assessments to summarize.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {members.map(p => summaryCard(p))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────── LEADERSHIP TIPS MODAL ──────
function LeadershipTips({ person, onClose }) {
  const p = person;
  const dom = getDom(p.disc.natural);
  const topVals = Object.entries(p.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const extLead = [...p.attr.ext].sort((a, b) => b.score - a.score)[0];
  const firstName = p.name.split(" ")[0];

  // Generate DISC-based tips
  const discTips = [];
  if (p.disc.natural.D >= 60) {
    discTips.push({ title: "Leverage their drive", tip: `${firstName} thrives when given challenges and autonomy. Assign them problems to solve, not tasks to complete. Avoid micromanaging.` });
  }
  if (p.disc.natural.I >= 60) {
    discTips.push({ title: "Feed their need for connection", tip: `${firstName} needs verbal recognition and social energy. Schedule regular check-ins and celebrate wins publicly.` });
  }
  if (p.disc.natural.S >= 60) {
    discTips.push({ title: "Provide stability", tip: `${firstName} values consistency and clear expectations. Avoid sudden changes without explanation. Give them time to process before expecting buy-in.` });
  }
  if (p.disc.natural.C >= 60) {
    discTips.push({ title: "Respect their precision", tip: `${firstName} needs data and time to analyze. Don't rush decisions. Provide written details and allow questions.` });
  }

  // Generate Values-based tips
  const valuesTips = topVals.slice(0, 2).map(v => {
    const tips = {
      Aesthetic: { title: "Honor their need for harmony", tip: `${firstName} is energized by balance and creative expression. Involve them in decisions about team culture and environment.` },
      Economic: { title: "Show the ROI", tip: `${firstName} wants to know the return on their investment of time and energy. Frame requests in terms of practical outcomes.` },
      Individualistic: { title: "Give them autonomy", tip: `${firstName} craves independence. Avoid micromanagement. Let them forge their own path to results.` },
      Political: { title: "Acknowledge their influence", tip: `${firstName} is motivated by leadership and impact. Give them visibility and ownership over important initiatives.` },
      Altruistic: { title: "Connect work to purpose", tip: `${firstName} needs to know their work helps others. Frame projects in terms of who benefits.` },
      Regulatory: { title: "Provide structure", tip: `${firstName} thrives with clear rules and processes. Ambiguity drains them. Document expectations clearly.` },
      Theoretical: { title: "Feed their curiosity", tip: `${firstName} is energized by learning. Give them opportunities to research, analyze, and understand deeply.` }
    };
    return tips[v];
  }).filter(Boolean);

  // Generate Attribute-based tips
  const attrTips = [];
  if (extLead.label === "Heart") {
    attrTips.push({ title: "Lead with people impact", tip: `When presenting decisions to ${firstName}, start with how it affects relationships and team dynamics before covering strategy or numbers.` });
  } else if (extLead.label === "Hand") {
    attrTips.push({ title: "Lead with practical outcomes", tip: `When presenting decisions to ${firstName}, start with what works and the tangible results before theory or people considerations.` });
  } else {
    attrTips.push({ title: "Lead with logic and systems", tip: `When presenting decisions to ${firstName}, start with the framework, data, and structure before the human story.` });
  }

  // Bias-based tips
  p.attr.ext.forEach(a => {
    if (a.bias === "−") {
      attrTips.push({ title: `Reactivate their ${a.label}`, tip: `${firstName}'s ${a.label} lens has been undervalued. Create safe opportunities for them to use this capacity again.` });
    }
  });

  const allTips = [...discTips, ...valuesTips, ...attrTips];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "24px 16px" }}>
      <div style={{ background: C.card, borderRadius: 12, width: "min(600px, 100%)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Leadership Tips for {p.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>How to lead this person effectively</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)" }}>✕</button>
        </div>
        <div style={{ padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {allTips.map((t, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "4px solid #C8A96E" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9A7A42", marginBottom: 6 }}>{t.title}</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{t.tip}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 8, background: "#FFFDE7", border: "1px solid #FFF59D" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9A7A42", marginBottom: 4 }}>REMEMBER</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
              These tips are based on {firstName}'s assessment data. The best leadership comes from ongoing conversation — use these as starting points, not rules.
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
          <Btn primary onClick={onClose}>Done</Btn>
        </div>
      </div>
    </div>
  );
}

// ────── COMPARE WITH OTHERS MODAL ──────
function CompareWithOthers({ person, team, onClose, photos = {} }) {
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const p = person;
  const otherMembers = team.filter(m => m.id !== p.id && m.status !== "pending");
  const selectedMember = otherMembers.find(m => m.id === selectedMemberId);

  // Calculate team averages
  const teamAvgs = {
    disc: { D: 0, I: 0, S: 0, C: 0 },
    values: {},
    attr: { Heart: 0, Hand: 0, Head: 0 }
  };

  if (otherMembers.length > 0) {
    otherMembers.forEach(m => {
      ["D", "I", "S", "C"].forEach(d => { teamAvgs.disc[d] += m.disc.natural[d]; });
      Object.keys(m.values).forEach(v => { teamAvgs.values[v] = (teamAvgs.values[v] || 0) + m.values[v]; });
      m.attr.ext.forEach(a => { teamAvgs.attr[a.label] += a.score; });
    });
    ["D", "I", "S", "C"].forEach(d => { teamAvgs.disc[d] = Math.round(teamAvgs.disc[d] / otherMembers.length); });
    Object.keys(teamAvgs.values).forEach(v => { teamAvgs.values[v] = Math.round(teamAvgs.values[v] / otherMembers.length); });
    Object.keys(teamAvgs.attr).forEach(a => { teamAvgs.attr[a] = +(teamAvgs.attr[a] / otherMembers.length).toFixed(1); });
  }

  // Calculate differences from team average
  const discDiffs = ["D", "I", "S", "C"].map(d => ({
    dim: d,
    person: p.disc.natural[d],
    avg: teamAvgs.disc[d],
    diff: p.disc.natural[d] - teamAvgs.disc[d]
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const valuesDiffs = Object.entries(p.values).map(([name, score]) => ({
    name,
    person: score,
    avg: teamAvgs.values[name] || 50,
    diff: score - (teamAvgs.values[name] || 50)
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const attrDiffs = p.attr.ext.map(a => ({
    label: a.label,
    person: a.score,
    avg: teamAvgs.attr[a.label] || 5,
    diff: a.score - (teamAvgs.attr[a.label] || 5)
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  // Side-by-side comparison helper
  const SideBySide = ({ member }) => {
    if (!member) return null;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Person */}
        <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ background: "#1F2937", padding: "10px 14px", color: "#fff", fontWeight: 600, fontSize: 13 }}>{p.name}</div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>DISC</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["D","I","S","C"].map(d => (
                <span key={d} style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: C.disc[d], color: d === "I" ? "#111" : "#fff" }}>{d}:{p.disc.natural[d]}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>TOP VALUES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {Object.entries(p.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).slice(0,3).map(([v, score]) => (
                <div key={v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[v] }} />
                  <span>{v}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 600 }}>{score}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>DECISION STYLE</div>
            {[...p.attr.ext].sort((a,b) => b.score - a.score).map((a, i) => (
              <div key={a.label} style={{ fontSize: 11, marginBottom: 2 }}>{i+1}. {a.label} ({a.score})</div>
            ))}
          </div>
        </div>
        {/* Selected member */}
        <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ background: C.blue, padding: "10px 14px", color: "#fff", fontWeight: 600, fontSize: 13 }}>{member.name}</div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>DISC</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["D","I","S","C"].map(d => (
                <span key={d} style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: C.disc[d], color: d === "I" ? "#111" : "#fff" }}>{d}:{member.disc.natural[d]}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>TOP VALUES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {Object.entries(member.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).slice(0,3).map(([v, score]) => (
                <div key={v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[v] }} />
                  <span>{v}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 600 }}>{score}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>DECISION STYLE</div>
            {[...member.attr.ext].sort((a,b) => b.score - a.score).map((a, i) => (
              <div key={a.label} style={{ fontSize: 11, marginBottom: 2 }}>{i+1}. {a.label} ({a.score})</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div style={{ background: C.card, borderRadius: 12, width: "min(900px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Compare {p.name} with Others</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{otherMembers.length} team members available for comparison</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)" }}>✕</button>
        </div>

        <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>

          {/* Member Selector - Always visible */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: C.text, marginBottom: 6, display: "block" }}>Select a team member to compare with {p.name.split(" ")[0]}:</label>
            <select
              value={selectedMemberId || ""}
              onChange={e => setSelectedMemberId(e.target.value || null)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, minWidth: 250 }}
            >
              <option value="">Choose a person...</option>
              {otherMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {selectedMember && (
              <button onClick={() => setSelectedMemberId(null)} style={{ marginLeft: 12, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, fontSize: 13, cursor: "pointer" }}>
                ← Back to Team View
              </button>
            )}
          </div>

          {selectedMember ? (
            /* ===== INDIVIDUAL COMPARISON VIEW (Conflict Report) ===== */
            (() => {
              const m = selectedMember;
              const dims = ["D", "I", "S", "C"];

              // Calculate overall friction using shared function
              const friction = calculateFriction(p, m);

              // DISC gap analysis
              const discGaps = dims.map(d => {
                const pScore = p.disc.natural[d];
                const mScore = m.disc.natural[d];
                const gap = Math.abs(pScore - mScore);
                const pHigher = pScore > mScore;
                const tier = gap >= 40 ? "high" : gap >= 20 ? "moderate" : "low";
                let text = "";
                if (tier === "low") {
                  text = `Both around ${Math.round((pScore + mScore) / 2)} — natural compatibility here.`;
                } else if (pHigher) {
                  if (d === "D") text = `${p.name.split(" ")[0]}'s D is ${pScore}, ${m.name.split(" ")[0]}'s is ${mScore}. ${p.name.split(" ")[0]} pushes for decisions and speed; ${m.name.split(" ")[0]} needs time to evaluate.`;
                  if (d === "I") text = `${p.name.split(" ")[0]}'s I is ${pScore}, ${m.name.split(" ")[0]}'s is ${mScore}. ${p.name.split(" ")[0]} communicates with energy; ${m.name.split(" ")[0]} prefers data over enthusiasm.`;
                  if (d === "S") text = `${p.name.split(" ")[0]}'s S is ${pScore}, ${m.name.split(" ")[0]}'s is ${mScore}. ${p.name.split(" ")[0]} values stability; ${m.name.split(" ")[0]} is comfortable with change.`;
                  if (d === "C") text = `${p.name.split(" ")[0]}'s C is ${pScore}, ${m.name.split(" ")[0]}'s is ${mScore}. ${p.name.split(" ")[0]} wants precision; ${m.name.split(" ")[0]} wants to move forward quickly.`;
                } else {
                  if (d === "D") text = `${m.name.split(" ")[0]}'s D is ${mScore}, ${p.name.split(" ")[0]}'s is ${pScore}. ${m.name.split(" ")[0]} moves faster and pushes harder.`;
                  if (d === "I") text = `${m.name.split(" ")[0]}'s I is ${mScore}, ${p.name.split(" ")[0]}'s is ${pScore}. ${m.name.split(" ")[0]} needs verbal processing and social energy.`;
                  if (d === "S") text = `${m.name.split(" ")[0]}'s S is ${mScore}, ${p.name.split(" ")[0]}'s is ${pScore}. ${m.name.split(" ")[0]} needs more consistency and predictability.`;
                  if (d === "C") text = `${m.name.split(" ")[0]}'s C is ${mScore}, ${p.name.split(" ")[0]}'s is ${pScore}. ${m.name.split(" ")[0]} needs more specifics and structured expectations.`;
                }
                return { d, pScore, mScore, gap, tier, text };
              });

              const tierStyle = {
                high: { borderColor: "#B71C1C", label: "HIGH", labelColor: "#B71C1C" },
                moderate: { borderColor: "#E65100", label: "MODERATE", labelColor: "#E65100" },
                low: { borderColor: "#2E7D32", label: "LOW", labelColor: "#2E7D32" },
              };

              const tierColors = {
                high: { bg: "#FFEBEE", border: "#EF9A9A", text: "#B71C1C" },
                moderate: { bg: "#FFF3E0", border: "#FFCC80", text: "#E65100" },
                low: { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" }
              };
              const frictionTier = tierColors[friction.tier];

              // Values comparison
              const pTopVals = Object.entries(p.values).filter(([, s]) => s >= 60).map(([k]) => k);
              const mTopVals = Object.entries(m.values).filter(([, s]) => s >= 60).map(([k]) => k);
              const sharedVals = pTopVals.filter(v => mTopVals.includes(v));
              const pOnly = pTopVals.filter(v => !mTopVals.includes(v));
              const mOnly = mTopVals.filter(v => !pTopVals.includes(v));

              // Process bias comparison
              const processBiasResult = (pBias, mBias) => {
                if ((pBias === "+" && mBias === "−") || (pBias === "−" && mBias === "+")) return { label: "CONFLICT", color: "#B71C1C" };
                if (pBias === mBias) return { label: "ALIGNED", color: "#2E7D32" };
                return { label: "TENSION", color: "#E65100" };
              };

              return (
                <div className="conflict-report">
                  {/* Print-friendly header with overall friction score */}
                  <div style={{ marginBottom: 16, padding: "16px 20px", background: frictionTier.bg, borderRadius: 10, border: `1px solid ${frictionTier.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: frictionTier.text, marginBottom: 4 }}>CONFLICT REPORT</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{p.name} & {m.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Friction analysis across Preference, Passion, and Process</div>
                    </div>
                    <div style={{ textAlign: "center", minWidth: 100 }}>
                      <div style={{ fontSize: 36, fontWeight: 800, color: frictionTier.text, lineHeight: 1 }}>{friction.totalScore}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: frictionTier.text, marginTop: 4 }}>{friction.tier.toUpperCase()} FRICTION</div>
                    </div>
                  </div>

                  {/* Three pillars breakdown */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Preference", sub: "DISC Style", score: friction.preferenceScore, max: 12, color: C.disc.D },
                      { label: "Passion", sub: "Values", score: friction.passionScore, max: 14, color: C.values.Altruistic },
                      { label: "Process", sub: "Attributes", score: friction.processScore, max: 9, color: C.attr.ext }
                    ].map(pillar => (
                      <div key={pillar.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>{pillar.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: pillar.score >= pillar.max * 0.5 ? "#C62828" : pillar.score >= pillar.max * 0.25 ? "#E65100" : "#2E7D32", lineHeight: 1.2 }}>{pillar.score}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>{pillar.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Print Report button */}
                  <div style={{ marginBottom: 16, textAlign: "right" }} className="no-print">
                    <button
                      onClick={() => window.print()}
                      style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.text }}
                    >
                      🖨️ Print Report
                    </button>
                  </div>

                  {/* PREFERENCE GAP - DISC */}
                  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PREFERENCE GAP</div>
                      <div style={{ fontSize: 13, color: C.muted }}>How behavioral styles differ across D, I, S, C</div>
                    </div>
                    {/* Score comparison panel */}
                    <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                      <div style={{ flex: 1, padding: "12px 16px", background: C.card, borderLeft: "3px solid #C8A96E" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{p.name}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {dims.map(d => <span key={d} style={{ fontSize: 13, fontWeight: 800, color: C.disc[d] }}>{d}:{p.disc.natural[d]}</span>)}
                        </div>
                      </div>
                      <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: "12px 16px", background: C.card }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.name}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {dims.map(d => <span key={d} style={{ fontSize: 13, fontWeight: 800, color: C.disc[d] }}>{d}:{m.disc.natural[d]}</span>)}
                        </div>
                      </div>
                    </div>
                    {/* Per-dimension gap cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {discGaps.map(({ d, pScore, mScore, gap, tier, text }) => {
                        const ts = tierStyle[tier];
                        return (
                          <div key={d} style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ts.borderColor}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.disc[d], flexShrink: 0 }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: C.disc[d] }}>{discFull[d]}</span>
                              <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: ts.labelColor, background: ts.labelColor + "10", border: `1px solid ${ts.labelColor}25`, borderRadius: 8, padding: "2px 8px" }}>{ts.label}</span>
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                              <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: C.hi, border: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: 9, color: "#9A7A42", fontWeight: 700, marginBottom: 2 }}>{p.name.split(" ")[0]}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{pScore}</div>
                              </div>
                              <div style={{ fontSize: 11, color: tier === "high" ? ts.labelColor : C.muted, fontWeight: 800 }}>Δ{gap}</div>
                              <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: C.hi, border: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 2 }}>{m.name.split(" ")[0]}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{mScore}</div>
                              </div>
                            </div>
                            {tier !== "low" && <div style={{ fontSize: 10, color: C.text, lineHeight: 1.55 }}>{text}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PASSION GAP - Values */}
                  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PASSION GAP</div>
                      <div style={{ fontSize: 13, color: C.muted }}>Motivational driver differences — what energizes each person</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Shared Drivers</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {sharedVals.length > 0 ? sharedVals.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No shared top drivers</span>}
                        </div>
                      </div>
                      <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #E65100" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#A83A00", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{p.name.split(" ")[0]}&apos;s Unique Drivers</div>
                        <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>{p.name.split(" ")[0]} cares about these — {m.name.split(" ")[0]} may not share them</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {pOnly.length > 0 ? pOnly.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No unique drivers</span>}
                        </div>
                      </div>
                      <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #1565C0" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#0D4880", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{m.name.split(" ")[0]}&apos;s Unique Drivers</div>
                        <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>{m.name.split(" ")[0]} cares about these — {p.name.split(" ")[0]} may not share them</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {mOnly.length > 0 ? mOnly.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>) : <span style={{ fontSize: 10, color: C.muted }}>No unique drivers</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PROCESS GAP - Attributes */}
                  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>PROCESS GAP</div>
                      <div style={{ fontSize: 13, color: C.muted }}>Decision-making style — bias comparison per Heart · Hand · Head</div>
                    </div>
                    {/* Side-by-side attribute profiles */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      {[{ label: p.name, data: p.attr.ext, isPrimary: true }, { label: m.name, data: m.attr.ext, isPrimary: false }].map(({ label, data, isPrimary }) => {
                        const sorted = [...data].sort((a, b) => b.score - a.score);
                        return (
                          <div key={label} style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: isPrimary ? "3px solid #C8A96E" : `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: isPrimary ? "#9A7A42" : C.muted, marginBottom: 8 }}>{label}</div>
                            {sorted.map((a, i) => (
                              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                                <span style={{ width: 16, height: 16, borderRadius: "50%", background: i === 0 ? C.attr.ext : C.hi, color: i === 0 ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0, border: `1px solid ${i === 0 ? "transparent" : C.border}` }}>{i + 1}</span>
                                <span style={{ fontSize: 11, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? C.text : C.muted }}>{a.label}</span>
                                <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto" }}>{a.score}</span>
                                <Bias bias={a.bias} />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    {/* Bias-based friction analysis */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {["Heart", "Hand", "Head"].map(label => {
                        const pAttr = p.attr.ext.find(a => a.label === label);
                        const mAttr = m.attr.ext.find(a => a.label === label);
                        if (!pAttr || !mAttr) return null;
                        const result = processBiasResult(pAttr.bias, mAttr.bias);
                        const borderColors = { CONFLICT: "#B71C1C", TENSION: "#E65100", ALIGNED: "#2E7D32" };
                        return (
                          <div key={label} style={{ padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${borderColors[result.label]}`, display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</span>
                              <span style={{ fontSize: 10, color: C.muted, marginLeft: 8 }}>{pAttr.bias} vs. {mAttr.bias}</span>
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 700, color: result.color, background: result.color + "10", border: `1px solid ${result.color}25`, borderRadius: 8, padding: "2px 10px" }}>{result.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* ===== TEAM OVERVIEW (when no member selected) ===== */
            <div>
              {/* Team Comparison Matrix */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>TEAM COMPARISON MATRIX</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: C.hi }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>Team Member</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.disc.D }}>D</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.disc.I }}>I</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.disc.S }}>S</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.disc.C }}>C</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>Style</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>Top Value</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>Leads With</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: "#FFFDE7" }}>
                        <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>★ {p.name}</td>
                        {["D","I","S","C"].map(d => (
                          <td key={d} style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>{p.disc.natural[d]}</td>
                        ))}
                        <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{getDom(p.disc.natural)}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{Object.entries(p.values).sort((a,b) => b[1]-a[1])[0]?.[0] || "—"}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{[...p.attr.ext].sort((a,b) => b.score - a.score)[0]?.label || "—"}</td>
                      </tr>
                      {otherMembers.map(m => (
                        <tr key={m.id} style={{ background: C.card, cursor: "pointer" }} onClick={() => setSelectedMemberId(m.id)}>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, color: C.blue }}>{m.name}</td>
                          {["D","I","S","C"].map(d => {
                            const diff = m.disc.natural[d] - p.disc.natural[d];
                            const highlight = Math.abs(diff) >= 20;
                            return (
                              <td key={d} style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, background: highlight ? (diff > 0 ? "#E3F7E3" : "#FFE8E8") : "transparent", fontWeight: highlight ? 600 : 400 }}>
                                {m.disc.natural[d]}
                              </td>
                            );
                          })}
                          <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{getDom(m.disc.natural)}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{Object.entries(m.values).sort((a,b) => b[1]-a[1])[0]?.[0] || "—"}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{[...m.attr.ext].sort((a,b) => b.score - a.score)[0]?.label || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>
                  Click any row to compare directly ·
                  <span style={{ display: "inline-block", width: 12, height: 12, background: "#E3F7E3", marginLeft: 8, marginRight: 4, verticalAlign: "middle", borderRadius: 2 }}></span> Higher by 20+
                  <span style={{ display: "inline-block", width: 12, height: 12, background: "#FFE8E8", marginLeft: 8, marginRight: 4, verticalAlign: "middle", borderRadius: 2 }}></span> Lower by 20+
                </div>
              </div>

              {/* Difference from Team Averages */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{p.name.split(" ")[0]} vs TEAM AVERAGES</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>DISC vs Team Avg</div>
                    {discDiffs.map(({ dim, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 15;
                      return (
                        <div key={dim} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 8px", borderRadius: 6, background: significant ? (diff > 0 ? "#E3F7E3" : "#FFE8E8") : C.hi }}>
                          <span style={{ fontWeight: 700, color: C.disc[dim], width: 16 }}>{dim}</span>
                          <span style={{ fontSize: 12 }}>{pScore}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>vs</span>
                          <span style={{ fontSize: 12, color: C.muted }}>{avg}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: diff > 0 ? "#2E7D32" : diff < 0 ? "#C62828" : C.muted }}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>Values vs Team Avg</div>
                    {valuesDiffs.slice(0, 4).map(({ name, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 10;
                      return (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 8px", borderRadius: 6, background: significant ? (diff > 0 ? "#E3F7E3" : "#FFE8E8") : C.hi }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.values[name] }} />
                          <span style={{ fontSize: 11, flex: 1 }}>{name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: diff > 0 ? "#2E7D32" : diff < 0 ? "#C62828" : C.muted }}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>Decision Style vs Team Avg</div>
                    {attrDiffs.map(({ label, person: pScore, avg, diff }) => {
                      const significant = Math.abs(diff) >= 1;
                      return (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 8px", borderRadius: 6, background: significant ? (diff > 0 ? "#E3F7E3" : "#FFE8E8") : C.hi }}>
                          <span style={{ fontSize: 11, flex: 1 }}>{label}</span>
                          <span style={{ fontSize: 12 }}>{pScore}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>vs</span>
                          <span style={{ fontSize: 12, color: C.muted }}>{avg}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: diff > 0 ? "#2E7D32" : diff < 0 ? "#C62828" : C.muted }}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 8, background: "#FFFDE7", border: "1px solid #FFF59D" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9A7A42", marginBottom: 4 }}>KEY INSIGHT</div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                    {discDiffs[0] && Math.abs(discDiffs[0].diff) >= 15
                      ? `${p.name.split(" ")[0]}'s ${discFull[discDiffs[0].dim]} (${discDiffs[0].person}) is ${Math.abs(discDiffs[0].diff)} points ${discDiffs[0].diff > 0 ? "higher" : "lower"} than the team average (${discDiffs[0].avg}). This is the biggest behavioral difference from the team.`
                      : `${p.name.split(" ")[0]}'s DISC profile is relatively aligned with team averages. Look to Values and Decision Style for differentiation.`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
          <Btn primary onClick={onClose}>Done</Btn>
        </div>
      </div>
    </div>
  );
}

// ────── VIEWER ──────
function Viewer({ person, leader, agreements, setAgreements, photos = {}, onUploadPhoto, initialTab = "profile", initialShowTips = false, initialShowCompare = false, onClearShowTips, onClearShowCompare, team = [] }) {
  const [dv, setDv] = useState("both");
  const [tab, setTab] = useState(initialTab);
  const [showWizard, setShowWizard] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTips, setShowTips] = useState(initialShowTips);
  const [showCompare, setShowCompare] = useState(initialShowCompare);

  // Handle external triggers for showing tips
  useEffect(() => {
    if (initialShowTips) {
      setShowTips(true);
      onClearShowTips?.();
    }
  }, [initialShowTips, onClearShowTips]);

  // Handle external triggers for showing compare
  useEffect(() => {
    if (initialShowCompare) {
      setShowCompare(true);
      onClearShowCompare?.();
    }
  }, [initialShowCompare, onClearShowCompare]);

  // Sync tab when initialTab changes
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const sel = person;
  const canCompare = leader && leader.id !== person.id && leader.disc;
  const discD = ["D", "I", "S", "C"].map(d => ({ dim: d, full: discFull[d], Natural: sel.disc.natural[d], Adaptive: sel.disc.adaptive[d], gap: sel.disc.adaptive[d] - sel.disc.natural[d] }));
  const valD = Object.entries(sel.values).map(([n, s]) => ({ name: n, score: s, color: C.values[n] })).sort((a, b) => b.score - a.score);

  return (
    <div>
      {showWizard && canCompare && (
        <BridgeWizard leader={leader} person={person} agreements={agreements} setAgreements={setAgreements} onClose={() => setShowWizard(false)} />
      )}
      {showReport && (
        <EnvironmentReport person={sel} onClose={() => setShowReport(false)} />
      )}
      {showTips && (
        <LeadershipTips person={sel} onClose={() => setShowTips(false)} />
      )}
      {showCompare && team.length > 0 && (
        <CompareWithOthers person={sel} team={team} onClose={() => setShowCompare(false)} photos={photos} />
      )}

      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <PhotoAvatar personId={sel.id} name={sel.name} bgColor={C.disc[getDom(sel.disc.natural).split("/")[0]] || C.accent} photo={photos[sel.id]} onUpload={onUploadPhoto} size={72} square={true} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{sel.name}</h1>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Love Where You Lead Profile · click photo to update</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn onClick={() => setShowReport(true)} style={{ fontSize: 11 }}>📄 Environment Report</Btn>
          {canCompare && (
            <div style={{ display: "flex", background: C.hi, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {["profile", "compare"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", background: tab === t ? C.accent : "transparent", color: tab === t ? "#fff" : C.text, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{t === "compare" ? "Compare to Leader" : "Profile"}</button>
              ))}
            </div>
          )}
          <div style={{ padding: "6px 14px", background: C.hi, borderRadius: 8, border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Leadership Style</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{getDom(sel.disc.natural)}</div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      {tab === "compare" && canCompare ? (
        <IndividualComparison leader={leader} person={person} agreements={agreements} setAgreements={setAgreements} onStartWizard={() => setShowWizard(true)} />
      ) : (<div>

      {/* DISC */}
      <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Sec title="DISC Profile" sub={"How your environment shaped your leadership"} color={C.disc[getDom(sel.disc.natural).split("/")[0]] || C.accent} />
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {["both", "natural", "adaptive"].map(v => (
            <button key={v} onClick={() => setDv(v)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${dv === v ? C.accent : C.border}`, background: dv === v ? C.accent : "transparent", color: dv === v ? "#fff" : C.text, fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={discD} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis dataKey="dim" tick={{ fontSize: 12, fontWeight: 600, fill: C.text }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
            <Tooltip content={<DTip />} />
            {(dv === "both" || dv === "natural") && (
              <Bar dataKey="Natural" barSize={40} radius={[4, 4, 0, 0]}>
                {discD.map((e, i) => <Cell key={i} fill={C.disc[e.dim]} />)}
                <LabelList dataKey="Natural" position="center" style={{ fontSize: 13, fontWeight: 700, fill: "#fff" }} />
              </Bar>
            )}
            {(dv === "both" || dv === "adaptive") && (
              <Bar dataKey="Adaptive" barSize={40} radius={[4, 4, 0, 0]} fill={C.disc.gray}>
                <LabelList dataKey="Adaptive" position="center" style={{ fontSize: 13, fontWeight: 700, fill: "#fff" }} />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 8 }}>
          {discD.map(d => {
            const g = Math.abs(d.gap);
            return (
              <div key={d.dim} style={{ padding: "6px 8px", borderRadius: 7, background: C.hi, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.disc[d.dim] }}>{d.full}</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{d.Natural}</div>
                <div style={{ fontSize: 10, color: C.muted }}>A: {d.Adaptive}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: g >= 10 ? "#C62828" : C.muted, marginTop: 2 }}>
                  {g >= 10 ? `⚡ Gap: ${d.gap > 0 ? "+" : ""}${d.gap}` : `Gap: ${d.gap > 0 ? "+" : ""}${d.gap}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VALUES */}
      <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Sec title="Values &amp; Passion" sub={"The fuel your leadership runs on"} color={C.values.Altruistic} />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={valD} layout="vertical" barSize={32} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 13, fontWeight: 500, fill: C.text }} axisLine={false} tickLine={false} />
            <Tooltip content={<VTip />} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {valD.map((e, i) => <Cell key={i} fill={e.color} />)}
              <LabelList dataKey="score" position="insideRight" style={{ fontSize: 14, fontWeight: 700, fill: "#fff" }} offset={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ATTRIBUTES */}
      <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Sec title="Process &amp; Attributes" sub={"How your mind works best"} color={C.attr.ext} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {[{ label: "External", subtitle: "Heart · Hand · Head", color: C.attr.ext, data: sel.attr.ext, useLabel: true }, { label: "Internal", subtitle: "Foundation", color: C.attr.int, data: sel.attr.int, useLabel: false }].map(section => (
            <div key={section.label}>
              <div style={{ fontSize: 16, fontWeight: 600, color: section.color, marginBottom: 4 }}>{section.label}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>{section.subtitle}</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
                {section.data.map(a => (
                  <CircleProgress key={a.name} value={a.score} max={10} color={section.color}
                    label={section.useLabel ? a.label : a.name} name={section.useLabel ? a.name : ""} bias={a.bias} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>)}
    </div>
  );
}

// ────── LEADER-TO-TEAM COMPARISON ──────
const leaderFriction = {
  "D→S": "You move fast. They need time to process. Your speed feels like pressure to them. Their caution feels like resistance to you.",
  "D→C": "You want quick decisions. They want thorough analysis.",
  "D→I": "You're both fast-paced, but you focus on results while they focus on people.",
  "D→D": "You share Dominance as your dominant approach. This creates natural alignment but can also create blind spots.",
  "I→S": "You bring energy and change. They need stability and consistency.",
  "I→C": "You communicate with stories and enthusiasm. They want data and precision.",
  "I→D": "You both move fast, but you lead with connection while they lead with results.",
  "I→I": "You share Influence as your dominant approach. This creates natural alignment but can also create blind spots.",
  "S→D": "You value harmony. They value speed.",
  "S→I": "You both value people, but you prefer steady consistency while they prefer dynamic energy.",
  "S→C": "You both prefer a measured pace, but you prioritize people while they prioritize accuracy.",
  "S→S": "You share Steadiness as your dominant approach. This creates natural alignment but can also create blind spots.",
  "C→D": "You need data before deciding. They need to decide now.",
  "C→I": "You communicate with precision. They communicate with feeling.",
  "C→S": "You both appreciate a steady pace. You focus on getting it right. They focus on keeping it stable.",
  "C→C": "You share Compliance as your dominant approach. This creates natural alignment but can also create blind spots."
};

function LeaderComparison({ leader, team }) {
  // DISC: leader style vs team style (excluding leader)
  const teamWithout = team.filter(p => p.id !== leader.id && p.status !== "pending");
  const leaderDom = getDom(leader.disc.natural);
  const leaderPrimaryStyle = leaderDom.split("/")[0];

  // Count team dominant styles
  const teamStyleCounts = {};
  teamWithout.forEach(p => {
    const dom = getDom(p.disc.natural);
    dom.split("/").forEach(s => { teamStyleCounts[s] = (teamStyleCounts[s] || 0) + 1; });
  });
  const teamDomStyle = Object.entries(teamStyleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "S";
  const frictionKey = `${leaderPrimaryStyle}→${teamDomStyle}`;
  const frictionText = leaderFriction[frictionKey] || `You lead with ${discFull[leaderPrimaryStyle]}. Your team leans ${discFull[teamDomStyle]}.`;

  // Values: leader top 3 vs team top 3 (excluding leader)
  const leaderTopVals = Object.entries(leader.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const teamValCounts = {};
  teamWithout.forEach(p => { Object.entries(p.values).forEach(([k, s]) => { if (s >= 60) teamValCounts[k] = (teamValCounts[k] || 0) + 1; }); });
  const teamTopVals = Object.entries(teamValCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const sharedVals = leaderTopVals.filter(v => teamTopVals.includes(v));
  const blindSpots = teamTopVals.filter(v => !leaderTopVals.includes(v));
  const unmetNeeds = leaderTopVals.filter(v => !teamTopVals.includes(v));

  // Attributes: leader ext lead vs team avg
  const leaderExt = leader.attr.ext;
  const leaderExtLead = leaderExt.reduce((a, b) => a.score >= b.score ? a : b).label;
  const teamExtAvgs = { Heart: 0, Hand: 0, Head: 0 };
  teamWithout.forEach(p => {
    p.attr.ext.forEach(a => { teamExtAvgs[a.label] = (teamExtAvgs[a.label] || 0) + a.score; });
  });
  const n = teamWithout.length || 1;
  const teamDecisionOrder = Object.entries(teamExtAvgs).map(([k, v]) => [k, +(v / n).toFixed(1)]).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

      {/* Section header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>THE GAP</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#C8A96E", fontSize: 14 }}>★</span>
          <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{leader.name}</span>
          <span style={{ fontSize: 12, color: C.muted }}>· Your style vs. their needs</span>
        </div>
      </div>

      {/* Leadership Style — Comparison Panel */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Leadership Style Gap</div>
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, padding: "16px 18px", background: C.card, borderLeft: `3px solid ${C.disc[leaderPrimaryStyle]}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Your Style</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.disc[leaderPrimaryStyle], lineHeight: 1, marginBottom: 6 }}>{leaderDom}</div>
            <div style={{ fontSize: 10, color: C.muted }}>D:{leader.disc.natural.D} · I:{leader.disc.natural.I} · S:{leader.disc.natural.S} · C:{leader.disc.natural.C}</div>
          </div>
          <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: "16px 18px", background: C.card, borderLeft: `3px solid ${C.disc[teamDomStyle]}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Team Tendency</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.disc[teamDomStyle], lineHeight: 1, marginBottom: 6 }}>{teamDomStyle}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{teamWithout.length} members (excl. leader)</div>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: "12px 16px", background: C.hi, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
          {frictionText}
        </div>
      </div>

      {/* Motivational Driver Gap — Insight Strips */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Motivational Driver Gap</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sharedVals.length > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #C8A96E" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9A7A42", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Common Ground</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {sharedVals.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>)}
              </div>
            </div>
          )}
          {blindSpots.length > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #E65100" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#A83A00", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Your Blind Spot — Team cares about this, you may not</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {blindSpots.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>)}
              </div>
            </div>
          )}
          {unmetNeeds.length > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "3px solid #1565C0" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#0D4880", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Unmet Need — You care about this, they may not feel it</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {unmetNeeds.map(v => <span key={v} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: C.values[v] + "15", color: C.values[v], fontWeight: 600, border: `1px solid ${C.values[v]}30` }}>{v}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision-Making Gap */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Decision-Making Gap</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto", padding: "10px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.attr.ext}` }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>You Lead With</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.attr.ext }}>{leaderExtLead}</div>
          </div>
          <div style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Team Decision Order</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {teamDecisionOrder.map(([label, avg], i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: i === 0 ? 800 : 500, color: i === 0 ? C.text : C.muted }}>{i + 1}. {label}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>({avg})</span>
                  {i < 2 && <span style={{ color: C.border, fontSize: 12 }}>→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────── TEAM INSIGHTS ──────
function TeamInsights({ people, teamId, orgId, leaderId, userId, photos = {}, onUploadPhoto, onViewProfile, onCompare, onShowTips }) {
  const [showSummary, setShowSummary] = useState(false);
  const [showFrictionMap, setShowFrictionMap] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const complete = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");
  const pending = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status === "pending");
  const total = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true)).length;
  const leader = leaderId ? people.find(p => p.id === leaderId) : null;

  // ── 1C: DISC Distribution ──
  const discStyleDescs = {
    D: "driven by results, speed, and directness. They need autonomy, challenges, and quick decisions.",
    I: "energized by people, enthusiasm, and collaboration. They need recognition, social interaction, and optimism.",
    S: "anchored by consistency, support, and stability. They need clear expectations, patience, and a steady environment.",
    C: "focused on accuracy, quality, and process. They need clarity, data, and time to analyze."
  };
  const styleCounts = {};
  const dimCounts = { D: 0, I: 0, S: 0, C: 0 };
  complete.forEach(p => {
    const dom = getDom(p.disc.natural);
    styleCounts[dom] = (styleCounts[dom] || 0) + 1;
    dom.split("/").forEach(d => { if (dimCounts[d] !== undefined) dimCounts[d]++; });
  });

  // ── 1D: Values Distribution ──
  const valDescs = {
    Aesthetic: "harmony, balance, beauty, and creative expression",
    Economic: "ROI, efficiency, and practical return on investment",
    Individualistic: "independence, uniqueness, and standing out",
    Political: "control, influence, and leadership position",
    Altruistic: "service, purpose, and helping others",
    Regulatory: "order, structure, rules, and tradition",
    Theoretical: "knowledge, learning, and understanding for its own sake"
  };
  const valCounts = {};
  Object.keys(C.values).forEach(v => { valCounts[v] = 0; });
  complete.forEach(p => {
    Object.entries(p.values).forEach(([v, score]) => { if (score >= 60) valCounts[v]++; });
  });
  const valData = Object.entries(valCounts)
    .map(([name, count]) => ({ name, count, color: C.values[name] }))
    .sort((a, b) => b.count - a.count);

  // ── 1E: Attributes Distribution ──
  const attrInsights = {
    Heart: "They need to understand how decisions affect people. Lead with who is impacted before explaining strategy or numbers.",
    Hand: "They need to know what works and gets results. Lead with practical outcomes before theory or people dynamics.",
    Head: "They need to see the logic and structure. Lead with the framework and data before the human story."
  };
  const attrIcons = { Heart: "❤️", Hand: "✋", Head: "🧠" };
  // Average external scores across team to determine collective decision ORDER
  const attrAvgs = { Heart: 0, Hand: 0, Head: 0 };
  if (complete.length > 0) {
    complete.forEach(p => {
      attrAvgs.Heart += p.attr.ext[0].score;
      attrAvgs.Hand  += p.attr.ext[1].score;
      attrAvgs.Head  += p.attr.ext[2].score;
    });
    attrAvgs.Heart = Math.round((attrAvgs.Heart / complete.length) * 10) / 10;
    attrAvgs.Hand  = Math.round((attrAvgs.Hand  / complete.length) * 10) / 10;
    attrAvgs.Head  = Math.round((attrAvgs.Head  / complete.length) * 10) / 10;
  }
  const decisionOrder = Object.entries(attrAvgs).sort((a, b) => b[1] - a[1]);
  // Also track individual lead counts for secondary display
  const attrCounts = { Heart: 0, Hand: 0, Head: 0 };
  complete.forEach(p => {
    const [emp, pra, sys] = p.attr.ext.map(a => a.score);
    const maxScore = Math.max(emp, pra, sys);
    const minScore = Math.min(emp, pra, sys);
    if (maxScore - minScore <= 0.5) return;
    if (emp === maxScore) attrCounts.Heart++;
    else if (pra === maxScore) attrCounts.Hand++;
    else attrCounts.Head++;
  });

  if (complete.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>No complete assessments in this team yet</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Upload assessments to see team insights</div>
    </div>
  );

  return (
    <div>
      {showSummary && (
        <TeamSummary people={people} teamId={teamId} orgId={orgId} leader={leader} onClose={() => setShowSummary(false)} photos={photos} onUploadPhoto={onUploadPhoto} onViewProfile={onViewProfile} onCompare={onCompare} onShowTips={onShowTips} />
      )}
      {showFrictionMap && (
        <FrictionMap people={people} teamId={teamId} orgId={orgId} onClose={() => setShowFrictionMap(false)} />
      )}
      {showJournal && (
        <VoiceJournal userId={userId} people={people} teamId={teamId} orgId={orgId} onClose={() => setShowJournal(false)} />
      )}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Team Insights</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{complete.length} of {total} members with complete assessments</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => setShowJournal(true)} style={{ fontSize: 11 }}>🎙️ Journal</Btn>
          {complete.length > 0 && (
            <>
              <Btn onClick={() => setShowFrictionMap(true)} style={{ fontSize: 11 }}>🔥 Friction Map</Btn>
              <Btn onClick={() => setShowSummary(true)} style={{ fontSize: 11 }}>📋 Team Summary</Btn>
            </>
          )}
        </div>
      </div>

      {/* 2B: Completion Tracker */}
      {total > 0 && (
        <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Assessment Completion</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: complete.length === total ? C.green : C.muted }}>{complete.length}/{total} complete</div>
          </div>
          <div style={{ height: 6, background: C.hi, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", width: `${(complete.length / total) * 100}%`, background: complete.length === total ? C.green : C.blue, borderRadius: 3, transition: "width 0.3s" }} />
          </div>
          {pending.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {pending.map(p => (
                <span key={p.id} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#F5F5F5", color: C.muted, border: `1px solid ${C.border}` }}>⏳ {p.name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2A: Leader Comparison */}
      {leader && leader.status !== "pending" && leader.disc && (
        <LeaderComparison leader={leader} team={people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true))} />
      )}

      {/* 1C: DISC Distribution */}
      <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>THE TEAM YOU LEAD</div>
          <div style={{ fontSize: 13, color: C.muted }}>Natural DISC style distribution · {complete.length} assessed members</div>
        </div>
        {/* 4-column DISC card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {["D", "I", "S", "C"].map(d => {
            const count = dimCounts[d];
            const pct = complete.length > 0 ? Math.round((count / complete.length) * 100) : 0;
            return (
              <div key={d} style={{ background: C.card, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: `4px solid ${C.disc[d]}` }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.disc[d], lineHeight: 1, marginBottom: 8 }}>{d}</div>
                <div style={{ fontSize: 56, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 4 }}>{count}</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>{pct}%</div>
                <div style={{ height: 6, background: C.hi, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: C.disc[d], borderRadius: 4, transition: "width 0.6s ease-out" }} />
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.4 }}>
                  {count > 0
                    ? `${count} ${count === 1 ? "person is" : "people are"} ${discStyleDescs[d]}`
                    : `No ${discFull[d]}-dominant members.`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1D: Values Distribution */}
      <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Sec title="Team Values Distribution" sub="Motivational drivers across your team" color={C.values.Altruistic} />
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Values with score ≥ 60 count as a Top Driver</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={valData} layout="vertical" barSize={24} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
            <XAxis type="number" domain={[0, complete.length]} allowDecimals={false} tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fontWeight: 600, fill: C.text }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value, name) => [`${value} of ${complete.length} people`, "Top Driver"]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>{valData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {valData.filter(v => v.count > 0).slice(0, 3).map(v => (
            <div key={v.name} style={{ flex: "1 1 200px", padding: "8px 10px", borderRadius: 7, background: C.hi, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: v.color, marginBottom: 3 }}>{v.name} — {v.count} of {complete.length} people</div>
              <div style={{ fontSize: 10, color: C.muted }}>This team is motivated by {valDescs[v.name]}.</div>
            </div>
          ))}
        </div>
      </div>

      {/* 1E: Attributes Distribution */}
      <div style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Sec title="How Your Team Decides" sub="Decision-making order by average attribute score" color={C.attr.ext} />
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
          Ranked by team average score — this is the order your team processes decisions.
        </div>
        {decisionOrder.map(([label, avg], idx) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: idx === 0 ? `3px solid ${C.attr.ext}` : `1px solid ${C.border}`, marginBottom: 8 }}>
            <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: idx === 0 ? C.attr.ext : C.hi, color: idx === 0 ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, border: `1px solid ${idx === 0 ? "transparent" : C.border}` }}>{idx + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{attrIcons[label]}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: idx === 0 ? C.attr.ext : C.text }}>{label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: C.muted }}>avg {avg} / 10</span>
                {attrCounts[label] > 0 && <span style={{ fontSize: 10, color: C.muted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1px 7px" }}>{attrCounts[label]} lead here</span>}
              </div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{attrInsights[label]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────── SPRINT 5B: 4-WEEK ENVIRONMENT AUDIT ──────
const weekData = [
  {
    week: 1,
    title: "The Preference Bridge",
    subtitle: "Why You're Exhausted",
    theme: "DISC",
    color: C.disc.D,
    intro: "Your DISC profile reveals how you are hardwired to lead. When your environment asks you to operate differently, you pay a daily energy tax — whether you feel it or not.",
    reflection: "When do you feel most like yourself at work? When do you feel like you are performing a version of yourself you didn't choose?",
    challenge: "This week, notice one moment where you shifted out of your Natural style to meet the room's expectations. Write down what triggered it and how it felt."
  },
  {
    week: 2,
    title: "The Passion Bridge",
    subtitle: "The Quiet Quitting Myth",
    theme: "Values",
    color: C.values.Altruistic,
    intro: "People don't go quiet because they stop caring. They go quiet because what they care about stopped mattering at work. Your Values profile reveals the fuel your leadership runs on — and whether your environment is filling the tank or draining it.",
    reflection: "Which of your top drivers do you get to live out at work right now? Which feel invisible or unsupported?",
    challenge: "This week, find one small way to activate your highest-scoring value in a current project or interaction."
  },
  {
    week: 3,
    title: "The Process Bridge",
    subtitle: "The Lie Your Environment Told You",
    theme: "Attributes",
    color: C.attr.ext,
    intro: "Your Attributes reveal how you naturally process the world and yourself. The bias indicators show where your environment has conditioned you to underuse the capacity you were born with. That's not a preference — it's a loss.",
    reflection: "When you make decisions, which lens do you trust most — Heart, Hand, or Head? Which do you skip, rush, or ignore? Has that always been true?",
    challenge: "This week, before making one decision, deliberately use your lowest-scoring External attribute before moving forward. Notice what changes."
  },
  {
    week: 4,
    title: "The Build",
    subtitle: "You Don't Have to Move to Build a House",
    theme: "Compound",
    color: C.accent,
    intro: "You now have your Compound Bill — the full picture of what your environment costs you. This week is not about escaping. It's about designing. You cannot always change your environment overnight, but you can change how you negotiate with it.",
    reflection: "What does your ideal work environment look like — the one where you would stop paying the tax? What is one specific thing in that environment that you could ask for, or create, this week?",
    challenge: "Write one specific request to make to your leader, your team, or yourself based on what you've learned over the past three weeks. Make it concrete. Make it yours."
  }
];

function WeekCard({ weekDef, person, status, onComplete, expanded, onToggle }) {
  const [reflection, setReflection] = useState("");
  const [challengeDone, setChallengeDone] = useState(false);
  const { week, title, subtitle, theme, color, intro, reflection: reflectionPrompt, challenge } = weekDef;
  const isLocked = status === "locked";
  const isCurrent = status === "current";
  const isComplete = status === "complete";

  // Per-week content derived from person's data
  const renderContent = () => {
    if (theme === "DISC") {
      const dims = ["D", "I", "S", "C"];
      const prefTax = dims.reduce((sum, d) => sum + Math.abs(person.disc.adaptive[d] - person.disc.natural[d]), 0);
      const taxLabel = prefTax >= 40 ? "Heavy" : prefTax >= 20 ? "Moderate" : "Light";
      const taxColor = prefTax >= 40 ? "#C62828" : prefTax >= 20 ? "#E65100" : C.green;
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
            {dims.map(d => (
              <div key={d} style={{ padding: "8px 10px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.disc[d] }}>{discFull[d]}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{person.disc.natural[d]}</div>
                <div style={{ fontSize: 9, color: C.muted }}>Nat → {person.disc.adaptive[d]}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: Math.abs(person.disc.adaptive[d] - person.disc.natural[d]) >= 20 ? "#C62828" : C.muted }}>
                  Δ{Math.abs(person.disc.adaptive[d] - person.disc.natural[d])}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Preference Tax</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: taxColor }}>{taxLabel}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{prefTax} total gap points</div>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: C.text, lineHeight: 1.6, alignSelf: "center", paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}>
              {taxLabel === "Heavy" ? "Your environment is significantly misaligned. The exhaustion you feel is not a motivation problem — it is a design problem." : taxLabel === "Moderate" ? "You are adapting in meaningful ways. Some days feel natural; others feel like a performance." : "Your environment is a good fit. Protect this alignment — it is not guaranteed."}
            </div>
          </div>
        </div>
      );
    }

    if (theme === "Values") {
      const topVals = Object.entries(person.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]);
      const lowVals = Object.entries(person.values).filter(([, s]) => s < 40);
      const passionTax = lowVals.length;
      const taxLabel = passionTax >= 4 ? "Heavy" : passionTax >= 2 ? "Moderate" : "Light";
      const taxColor = passionTax >= 4 ? "#C62828" : passionTax >= 2 ? "#E65100" : C.green;
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {Object.entries(person.values).sort((a, b) => b[1] - a[1]).map(([name, score]) => (
              <div key={name} style={{ flex: "1 1 100px", padding: "8px 10px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.values[name] }}>{name}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{score}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: score >= 60 ? "#2E7D32" : score < 40 ? "#C62828" : C.muted }}>{score >= 60 ? "Top Driver" : score < 40 ? "Low" : "Average"}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Passion Tax</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: taxColor }}>{taxLabel}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{topVals.length} top drivers · {lowVals.length} unfunded</div>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: C.text, lineHeight: 1.6, alignSelf: "center", paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}>
              {topVals.length > 0 ? `Your top drivers — ${topVals.slice(0,2).map(([k]) => k).join(" and ")} — are what get you out of bed. When work doesn't honor these, it doesn't feel like lack of motivation. It feels like meaninglessness.` : "No strong value drivers found at or above 60. Your motivation may be scattered or suppressed."}
            </div>
          </div>
        </div>
      );
    }

    if (theme === "Attributes") {
      const extSorted = [...person.attr.ext].sort((a, b) => b.score - a.score);
      const extMinus = person.attr.ext.filter(a => a.bias === "−").length;
      const taxLabel = extMinus === 0 ? "None" : extMinus === 1 ? "Light" : extMinus === 2 ? "Moderate" : "Heavy";
      const taxColor = extMinus === 0 ? C.green : extMinus === 1 ? "#558B2F" : extMinus === 2 ? "#E65100" : "#C62828";
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>External — Your Decision Order</div>
            {extSorted.map((a, i) => (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: i === 0 ? `4px solid ${C.attr.ext}` : `1px solid ${C.border}`, marginBottom: 5 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.attr.ext, width: 20 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{a.label} — {a.name}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.attr.ext }}>{a.score}</div>
                <Bias bias={a.bias} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Process Tax</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: taxColor }}>{taxLabel}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{extMinus} lens{extMinus !== 1 ? "es" : ""} underused</div>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: C.text, lineHeight: 1.6, alignSelf: "center", paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}>
              {extMinus === 0 ? "All three external lenses are active. You use your full decision-making capacity." : `${extMinus} of your external lens${extMinus > 1 ? "es have" : " has"} been undervalued by your environment. You have the capacity — it has just been conditioned out of you.`}
            </div>
          </div>
        </div>
      );
    }

    if (theme === "Compound") {
      const dims = ["D", "I", "S", "C"];
      const prefTax = dims.reduce((sum, d) => sum + Math.abs(person.disc.adaptive[d] - person.disc.natural[d]), 0);
      const prefLabel = prefTax >= 40 ? "Heavy" : prefTax >= 20 ? "Moderate" : "Light";
      const topVals = Object.entries(person.values).filter(([, s]) => s >= 60);
      const lowVals = Object.entries(person.values).filter(([, s]) => s < 40);
      const passionTax = lowVals.length;
      const passionLabel = passionTax >= 4 ? "Heavy" : passionTax >= 2 ? "Moderate" : "Light";
      const extMinus = person.attr.ext.filter(a => a.bias === "−").length;
      const processLabel = extMinus === 0 ? "None" : extMinus === 1 ? "Light" : extMinus === 2 ? "Moderate" : "Heavy";
      const compound = [prefLabel, passionLabel, processLabel].filter(t => t !== "None");
      const compoundLabel = compound.includes("Heavy") ? "Heavy" : compound.includes("Moderate") ? "Moderate" : "Light";
      const compoundColor = compoundLabel === "Heavy" ? "#C62828" : compoundLabel === "Moderate" ? "#E65100" : C.green;
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            {[["Preference Tax", prefLabel, `${prefTax} gap pts`], ["Passion Tax", passionLabel, `${topVals.length} top · ${lowVals.length} low`], ["Process Tax", processLabel, `${extMinus} lens underused`]].map(([label, val, note]) => {
              const c = val === "Heavy" ? "#C62828" : val === "Moderate" ? "#E65100" : val === "None" ? C.green : C.green;
              return (
                <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{val}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>{note}</div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "20px 24px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, borderLeft: `5px solid ${compoundColor}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Your Compound Bill</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: compoundColor, lineHeight: 1, marginBottom: 10 }}>{compoundLabel}</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8, fontWeight: 500 }}>
              {person.name.split(" ")[0]}, this is the full picture of what your environment costs you. {compoundLabel === "Heavy" ? "You are paying a heavy compound tax across your behavior, your motivation, and your decision-making. This is not a personal failing — it is a design problem that has a design solution." : compoundLabel === "Moderate" ? "You carry a moderate compound load. Some dimensions of your environment align; others resist. The goal now is to reduce the gaps you can control." : "Your compound bill is relatively light. This is a sign of reasonable environment fit. The opportunity is to protect what works and address what doesn't before it compounds."}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ borderRadius: 12, border: `2px solid ${isComplete ? C.green : isCurrent ? color : C.border}`, marginBottom: 14, overflow: "hidden", opacity: isLocked ? 0.55 : 1, transition: "all 0.2s" }}>
      {/* Header */}
      <button onClick={isLocked ? undefined : onToggle} style={{ width: "100%", textAlign: "left", padding: "14px 18px", background: C.hi, border: "none", cursor: isLocked ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12, borderLeft: isComplete ? `4px solid ${C.green}` : isCurrent ? `4px solid ${color}` : "none" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: isComplete ? C.green : isCurrent ? color : C.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
          {isComplete ? "✓" : isLocked ? "🔒" : week}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Week {week}: {title}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: isComplete ? "#C8E6C9" : isCurrent ? `${color}20` : C.border, color: isComplete ? C.green : isCurrent ? color : C.muted }}>{isComplete ? "Complete" : isCurrent ? "In Progress" : "Locked"}</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{subtitle}</div>
        </div>
        {!isLocked && <span style={{ color: C.muted, fontSize: 14 }}>{expanded ? "▲" : "▼"}</span>}
      </button>

      {/* Expanded content */}
      {expanded && !isLocked && (
        <div style={{ padding: "16px 18px", borderTop: `1px solid ${C.border}`, background: C.card }}>
          {/* Video placeholder */}
          <div style={{ background: "#1A1A1A", borderRadius: 10, height: 140, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, position: "relative", overflow: "hidden" }}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>▶</div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>Week {week} — {title}</div>
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>Video coming soon</div>
            </div>
          </div>

          {/* Intro */}
          <div style={{ padding: "10px 14px", borderRadius: 8, background: `${color}0C`, border: `1px solid ${color}33`, marginBottom: 14, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
            {intro}
          </div>

          {/* Assessment data for this week */}
          {renderContent()}

          {/* Reflection */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>📝 Reflection</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, lineHeight: 1.5, fontStyle: "italic" }}>{reflectionPrompt}</div>
            <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Write your reflection here..."
              style={{ width: "100%", minHeight: 80, padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 11, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          {/* Challenge */}
          <div style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "4px solid #E65100", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#E65100", marginBottom: 5 }}>⚡ This Week&apos;s Challenge</div>
            <div style={{ fontSize: 11, color: "#5D4037", lineHeight: 1.6 }}>{challenge}</div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, cursor: "pointer", fontSize: 11, fontWeight: 600, color: challengeDone ? C.green : C.muted }}>
              <input type="checkbox" checked={challengeDone} onChange={e => setChallengeDone(e.target.checked)} style={{ width: 16, height: 16 }} />
              {challengeDone ? "Challenge complete!" : "Mark challenge complete"}
            </label>
          </div>

          {/* Complete week button */}
          {isCurrent && (
            <Btn primary onClick={onComplete} disabled={!challengeDone || !reflection.trim()} style={{ width: "100%" }}>
              {!challengeDone || !reflection.trim() ? "Complete the reflection and challenge to finish this week" : `Complete Week ${week} →`}
            </Btn>
          )}
          {isComplete && <div style={{ textAlign: "center", fontSize: 12, color: C.green, fontWeight: 700 }}>✓ Week {week} Complete — great work.</div>}
        </div>
      )}
    </div>
  );
}

function AuditDashboard({ person }) {
  const [completedWeeks, setCompletedWeeks] = useState(new Set());
  const [expandedWeek, setExpandedWeek] = useState(1);

  if (!person) return (
    <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🪞</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Select a person from the sidebar to begin their audit</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Switch to Team Mode to manage your roster</div>
    </div>
  );

  const getStatus = (week) => {
    if (completedWeeks.has(week)) return "complete";
    const prevComplete = week === 1 || completedWeeks.has(week - 1);
    return prevComplete ? "current" : "locked";
  };

  const totalTax = (() => {
    const dims = ["D", "I", "S", "C"];
    const pref = dims.reduce((sum, d) => sum + Math.abs(person.disc.adaptive[d] - person.disc.natural[d]), 0);
    const prefLabel = pref >= 40 ? "Heavy" : pref >= 20 ? "Moderate" : "Light";
    const passion = Object.entries(person.values).filter(([, s]) => s < 40).length;
    const passLabel = passion >= 4 ? "Heavy" : passion >= 2 ? "Moderate" : "Light";
    const proc = person.attr.ext.filter(a => a.bias === "−").length;
    const procLabel = proc === 0 ? "None" : proc === 1 ? "Light" : proc === 2 ? "Moderate" : "Heavy";
    const all = [prefLabel, passLabel, procLabel];
    return all.includes("Heavy") ? "Heavy" : all.includes("Moderate") ? "Moderate" : "Light";
  })();
  const taxColor = totalTax === "Heavy" ? "#C62828" : totalTax === "Moderate" ? "#E65100" : C.green;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Environment Audit</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{person.name} · 4-Week Self-Guided Experience</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: `${taxColor}12`, border: `1px solid ${taxColor}44`, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Compound Bill</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: taxColor }}>{totalTax}</div>
          </div>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: C.hi, border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Progress</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{completedWeeks.size}/4</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: C.hi, borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ height: "100%", width: `${(completedWeeks.size / 4) * 100}%`, background: C.green, borderRadius: 3, transition: "width 0.4s" }} />
      </div>

      {/* Week cards */}
      {weekData.map(wd => (
        <WeekCard
          key={wd.week}
          weekDef={wd}
          person={person}
          status={getStatus(wd.week)}
          expanded={expandedWeek === wd.week}
          onToggle={() => setExpandedWeek(expandedWeek === wd.week ? null : wd.week)}
          onComplete={() => {
            setCompletedWeeks(prev => new Set([...prev, wd.week]));
            setExpandedWeek(wd.week + 1);
          }}
        />
      ))}

      {completedWeeks.size === 4 && (
        <div style={{ padding: "24px 28px", borderRadius: 14, background: "#1A1A18", border: `1px solid #2E7D32`, marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#C8A96E", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Environment Audit Complete</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#C8A96E", lineHeight: 1, marginBottom: 12 }}>All 4 Weeks Done</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
            {person.name.split(" ")[0]}, you now have a complete picture of your environment — and a plan to lead within it on your own terms.
          </div>
        </div>
      )}
    </div>
  );
}

// ────── LOGIN PAGE ──────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot" | "reset-sent"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [remember, setRemember] = useState(false);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const inputStyle = (field) => ({
    width: "100%", height: 48, padding: "0 16px", borderRadius: 8, fontSize: 16,
    border: `1px solid ${focused === field ? C.blue : "#D1D5DB"}`,
    boxShadow: focused === field ? "0 0 0 3px rgba(41,182,246,0.1)" : "none",
    outline: "none", boxSizing: "border-box", transition: "border 0.15s, box-shadow 0.15s",
    background: "#fff", color: C.text,
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      onLogin();
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess("Account created! Check your email to confirm your account.");
      setMode("signin");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setMode("reset-sent");
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setError(null);
    setSuccess(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 960, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.1)", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>

        {/* LEFT — Branding */}
        <div style={{ background: "linear-gradient(160deg, #E3F7FF 0%, #F0FAF0 100%)", padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {/* Logo mark */}
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ marginBottom: 12 }}>
            <circle cx="36" cy="36" r="34" stroke={C.blue} strokeWidth="4" fill="#fff" />
            <circle cx="36" cy="36" r="6" fill={C.blue} />
            <line x1="36" y1="4" x2="36" y2="20" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
            <line x1="36" y1="52" x2="36" y2="68" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
            <line x1="4" y1="36" x2="20" y2="36" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
            <line x1="52" y1="36" x2="68" y2="36" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
            <line x1="36" y1="10" x2="48" y2="28" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 12, letterSpacing: "-0.5px" }}>
            LOVE WHERE<br />YOU LEAD
          </div>
          <div style={{ fontSize: 16, color: C.muted, marginBottom: 40, lineHeight: 1.5 }}>
            The Environment You Need.<br />Right Where You Are.
          </div>

          {/* Illustration — team climbing steps */}
          <svg width="280" height="220" viewBox="0 0 280 220" fill="none">
            {/* Steps */}
            <rect x="20" y="180" width="240" height="16" rx="4" fill={C.blue} opacity="0.15" />
            <rect x="40" y="155" width="200" height="16" rx="4" fill={C.blue} opacity="0.2" />
            <rect x="65" y="130" width="155" height="16" rx="4" fill={C.blue} opacity="0.3" />
            <rect x="90" y="105" width="110" height="16" rx="4" fill={C.blue} opacity="0.4" />
            <rect x="115" y="80" width="70" height="16" rx="4" fill={C.blue} opacity="0.55" />
            {/* Flag */}
            <line x1="150" y1="80" x2="150" y2="20" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="150,20 175,33 150,46" fill="#FFC107" />
            {/* Person 1 (front, blue) */}
            <circle cx="140" cy="68" r="9" fill={C.blue} />
            <path d="M132 90 Q140 78 148 90 L145 115 H135 Z" fill={C.blue} opacity="0.8" />
            {/* Person 2 (middle, green) */}
            <circle cx="110" cy="93" r="8" fill="#4CAF50" />
            <path d="M103 112 Q110 101 117 112 L115 134 H106 Z" fill="#4CAF50" opacity="0.8" />
            {/* Person 3 (back, navy) */}
            <circle cx="82" cy="118" r="7" fill="#1F2937" />
            <path d="M76 135 Q82 125 88 135 L86 155 H78 Z" fill="#1F2937" opacity="0.8" />
            {/* Connecting lines (team connection) */}
            <path d="M118 100 Q125 90 132 82" stroke={C.blue} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
            <path d="M89 124 Q100 112 103 108" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
          </svg>
        </div>

        {/* RIGHT — Form */}
        <div style={{ padding: 48, display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {/* SIGN IN MODE */}
          {mode === "signin" && (
            <>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Welcome back</div>
              <div style={{ fontSize: 15, color: C.muted, marginBottom: 36 }}>Sign in to your Love Where You Lead account</div>

              {error && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>{error}</div>}
              {success && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#D1FAE5", color: "#059669", fontSize: 14, marginBottom: 20 }}>{success}</div>}

              <form onSubmit={handleSignIn} aria-label="Sign in form">
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    style={inputStyle("email")} autoComplete="email" required />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    style={inputStyle("password")} autoComplete="current-password" required />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.muted, cursor: "pointer" }}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.blue }} />
                    Remember me
                  </label>
                  <button type="button" onClick={() => { resetForm(); setMode("forgot"); }} style={{ background: "none", border: "none", fontSize: 14, color: C.blue, cursor: "pointer", padding: 0, fontWeight: 500 }}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px 24px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : C.blue, color: "#fff", fontSize: 16, fontWeight: 600, cursor: loading ? "default" : "pointer", transition: "background 0.15s" }}>
                  {loading ? "Signing in..." : "Sign In to Your Dashboard"}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: C.muted }}>
                Don't have an account?{" "}
                <button onClick={() => { resetForm(); setMode("signup"); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", padding: 0, fontWeight: 600, fontSize: 14 }}>
                  Create one
                </button>
              </div>
            </>
          )}

          {/* SIGN UP MODE */}
          {mode === "signup" && (
            <>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Create your account</div>
              <div style={{ fontSize: 15, color: C.muted, marginBottom: 36 }}>Start your leadership transformation journey</div>

              {error && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>{error}</div>}

              <form onSubmit={handleSignUp} aria-label="Sign up form">
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name"
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                    style={inputStyle("name")} autoComplete="name" required />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    style={inputStyle("email")} autoComplete="email" required />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password (min 6 characters)"
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    style={inputStyle("password")} autoComplete="new-password" required />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password"
                    onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                    style={inputStyle("confirm")} autoComplete="new-password" required />
                </div>

                <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px 24px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : C.blue, color: "#fff", fontSize: 16, fontWeight: 600, cursor: loading ? "default" : "pointer", transition: "background 0.15s" }}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: C.muted }}>
                Already have an account?{" "}
                <button onClick={() => { resetForm(); setMode("signin"); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", padding: 0, fontWeight: 600, fontSize: 14 }}>
                  Sign in
                </button>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD MODE */}
          {mode === "forgot" && (
            <>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Reset your password</div>
              <div style={{ fontSize: 15, color: C.muted, marginBottom: 36 }}>Enter your email and we'll send you a reset link</div>

              {error && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>{error}</div>}

              <form onSubmit={handleForgotPassword} aria-label="Reset password form">
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    style={inputStyle("email")} autoComplete="email" required />
                </div>

                <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px 24px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : C.blue, color: "#fff", fontSize: 16, fontWeight: 600, cursor: loading ? "default" : "pointer", transition: "background 0.15s" }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: C.muted }}>
                <button onClick={() => { resetForm(); setMode("signin"); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", padding: 0, fontWeight: 600, fontSize: 14 }}>
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {/* RESET SENT MODE */}
          {mode === "reset-sent" && (
            <>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Check your email</div>
                <div style={{ fontSize: 15, color: C.muted, marginBottom: 36, lineHeight: 1.6 }}>
                  We've sent a password reset link to<br /><strong>{email}</strong>
                </div>
                <button onClick={() => { resetForm(); setMode("signin"); }} style={{ padding: "14px 32px", borderRadius: 8, border: "none", background: C.blue, color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: C.muted }}>
            🔒 Secure Login
          </div>
        </div>
      </div>
    </div>
  );
}

// ────── MAIN SYSTEM ──────
export default function BTCGSystem() {
  // Auth states
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [orgs, setOrgs] = useState(initOrgs);
  const [people, setPeople] = useState(initPeople);
  const [selOrgId, setSelOrgId] = useState("org1");
  const [selTeamId, setSelTeamId] = useState(null);
  const [selPersonId, setSelPersonId] = useState("p1");
  const [view, setView] = useState("viewer");
  const [search, setSearch] = useState("");
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newName, setNewName] = useState("");
  const [leaderId, setLeaderId] = useState(null);
  const [hoveredPersonId, setHoveredPersonId] = useState(null);
  const [photos, setPhotos] = useState({});
  const onUploadPhoto = (personId, dataUrl) => setPhotos(prev => ({ ...prev, [personId]: dataUrl }));
  const [showAddPending, setShowAddPending] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [agreements, setAgreements] = useState([]);
  const [mode, setMode] = useState("team"); // "team" | "individual"
  const [viewerInitialTab, setViewerInitialTab] = useState("profile");
  const [viewerShowTips, setViewerShowTips] = useState(false);
  const [viewerShowCompare, setViewerShowCompare] = useState(false);

  // Data persistence states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // CRUD modal states
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [showDeleteTeam, setShowDeleteTeam] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(null);
  const [showDeletePerson, setShowDeletePerson] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState(null);
  const [hoveredTeamId, setHoveredTeamId] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    async function loadData() {
      try {
        console.log('[LWYL] Loading data from Supabase...');

        const { data: dbOrgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at');

        const { data: dbTeams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at');

        const { data: dbPeople, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .order('created_at');

        console.log('[LWYL] Query results:', {
          orgs: dbOrgs?.length || 0,
          teams: dbTeams?.length || 0,
          people: dbPeople?.length || 0,
          orgsError,
          teamsError,
          peopleError
        });

        if (orgsError || teamsError || peopleError) {
          console.error('Error loading data:', orgsError || teamsError || peopleError);
          alert(`Database error: ${(orgsError || teamsError || peopleError)?.message}`);
          setIsLoading(false);
          return;
        }

        // If we have data in the database, use it
        if (dbOrgs && dbOrgs.length > 0) {
          // Transform database format to app format
          const transformedOrgs = dbOrgs.map(org => ({
            id: org.id,
            name: org.name,
            teams: dbTeams
              .filter(t => t.org_id === org.id)
              .map(t => ({ id: t.id, name: t.name }))
          }));

          const transformedPeople = dbPeople.map(p => ({
            id: p.id,
            name: p.name,
            orgId: dbTeams.find(t => t.id === p.team_id)?.org_id || null,
            teamId: p.team_id,
            role: p.role,
            isLeader: p.is_leader,
            status: p.disc_natural ? undefined : "pending",
            disc: p.disc_natural ? { natural: p.disc_natural, adaptive: p.disc_adapted } : null,
            values: p.values_data,
            attr: p.attributes,
            photoUrl: p.photo_url
          }));

          console.log('[LWYL] Setting state with:', {
            orgs: transformedOrgs.length,
            people: transformedPeople.length
          });
          setOrgs(transformedOrgs);
          setPeople(transformedPeople);
          if (transformedOrgs.length > 0) setSelOrgId(transformedOrgs[0].id);
          if (transformedPeople.length > 0) setSelPersonId(transformedPeople[0].id);
        } else {
          console.log('[LWYL] No orgs found, seeding initial data...');
          // Seed initial data to database
          await seedDataToSupabase();
        }
        setDataLoaded(true);
      } catch (err) {
        console.error('[LWYL] Failed to load data:', err);
        alert(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Seed initial mock data to Supabase
  async function seedDataToSupabase() {
    try {
      // Create ID mappings (old string IDs to new UUIDs)
      const orgIdMap = {};
      const teamIdMap = {};
      const personIdMap = {};

      // Generate new UUIDs for all entities
      for (const org of initOrgs) {
        orgIdMap[org.id] = crypto.randomUUID();
        for (const team of org.teams) {
          teamIdMap[team.id] = crypto.randomUUID();
        }
      }
      for (const p of initPeople) {
        personIdMap[p.id] = crypto.randomUUID();
      }

      // Insert organizations with new UUIDs
      for (const org of initOrgs) {
        const newOrgId = orgIdMap[org.id];
        const { error: orgError } = await supabase.from('organizations').insert({ id: newOrgId, name: org.name });
        if (orgError) console.error('Org insert error:', orgError);

        // Insert teams with new UUIDs
        for (const team of org.teams) {
          const newTeamId = teamIdMap[team.id];
          const { error: teamError } = await supabase.from('teams').insert({ id: newTeamId, org_id: newOrgId, name: team.name });
          if (teamError) console.error('Team insert error:', teamError);
        }
      }

      // Insert people with new UUIDs
      for (const p of initPeople) {
        const newPersonId = personIdMap[p.id];
        const newTeamId = teamIdMap[p.teamId];
        const { error: personError } = await supabase.from('people').insert({
          id: newPersonId,
          team_id: newTeamId,
          name: p.name,
          role: p.role || null,
          is_leader: false,
          disc_natural: p.disc?.natural || null,
          disc_adapted: p.disc?.adaptive || null,
          values_data: p.values || null,
          attributes: p.attr || null,
        });
        if (personError) console.error('Person insert error:', personError);
      }

      // Update local state with new UUIDs
      const newOrgs = initOrgs.map(org => ({
        id: orgIdMap[org.id],
        name: org.name,
        teams: org.teams.map(t => ({ id: teamIdMap[t.id], name: t.name }))
      }));

      const newPeople = initPeople.map(p => ({
        ...p,
        id: personIdMap[p.id],
        orgId: orgIdMap[p.orgId],
        teamId: teamIdMap[p.teamId]
      }));

      setOrgs(newOrgs);
      setPeople(newPeople);
      if (newOrgs.length > 0) setSelOrgId(newOrgs[0].id);
      if (newPeople.length > 0) setSelPersonId(newPeople[0].id);

    } catch (err) {
      console.error('Failed to seed data:', err);
    }
  }

  const org = orgs.find(o => o.id === selOrgId);
  const orgPeople = people.filter(p => p.orgId === selOrgId);
  const teamPeople = selTeamId ? orgPeople.filter(p => p.teamId === selTeamId) : orgPeople;
  const filtered = teamPeople.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const selPerson = people.find(p => p.id === selPersonId);

  const addOrg = async () => {
    if (!newName.trim()) return;
    const id = crypto.randomUUID();
    const newOrg = { id, name: newName.trim(), teams: [] };
    setOrgs([...orgs, newOrg]);
    setSelOrgId(id); setNewName(""); setShowNewOrg(false);
    // Persist to Supabase
    const { error } = await supabase.from('organizations').insert({ id, name: newName.trim() });
    if (error) {
      console.error('Failed to save organization to database:', error);
      alert(`Failed to save organization to database: ${error.message}`);
    }
  };

  const addTeam = async () => {
    if (!newName.trim()) return;
    const teamId = crypto.randomUUID();
    setOrgs(orgs.map(o => o.id === selOrgId ? { ...o, teams: [...o.teams, { id: teamId, name: newName.trim() }] } : o));
    setNewName(""); setShowNewTeam(false);
    // Persist to Supabase
    const { error } = await supabase.from('teams').insert({ id: teamId, org_id: selOrgId, name: newName.trim() });
    if (error) {
      console.error('Failed to save team to database:', error);
      alert(`Failed to save team to database: ${error.message}`);
    }
  };

  const addPerson = async (p, { bulk = false } = {}) => {
    setPeople(prev => [...prev, p]);
    if (!bulk) {
      setSelPersonId(p.id);
      setView("viewer");
    }
    // Persist to Supabase
    const { error } = await supabase.from('people').insert({
      id: p.id,
      team_id: p.teamId,
      name: p.name,
      role: p.role || null,
      is_leader: false,
      disc_natural: p.disc?.natural || null,
      disc_adapted: p.disc?.adaptive || null,
      values_data: p.values || null,
      attributes: p.attr || null,
    });
    if (error) {
      console.error('Failed to save person to database:', error);
      alert(`Failed to save ${p.name} to database: ${error.message}`);
    }
  };

  const addPendingPerson = async () => {
    if (!pendingName.trim()) return;
    const teamId = selTeamId || (org?.teams[0]?.id || "t1");
    const nm = pendingName.trim();
    const personId = crypto.randomUUID();
    const newPerson = { id: personId, name: nm, orgId: selOrgId, teamId, status: "pending", disc: null, values: null, attr: null };
    setPeople([...people, newPerson]);
    setPendingName(""); setShowAddPending(false);
    // Persist to Supabase
    const { error } = await supabase.from('people').insert({
      id: personId,
      team_id: teamId,
      name: nm,
      is_leader: false,
    });
    if (error) {
      console.error('Failed to save person to database:', error);
      alert(`Failed to save ${nm} to database: ${error.message}`);
    }
  };

  // Edit Team Name
  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setShowEditTeam(true);
  };

  const saveEditTeam = async () => {
    if (!editTeamName.trim() || !editingTeam) return;
    setOrgs(orgs.map(o => o.id === selOrgId ? {
      ...o,
      teams: o.teams.map(t => t.id === editingTeam.id ? { ...t, name: editTeamName.trim() } : t)
    } : o));
    setShowEditTeam(false);
    setEditingTeam(null);
    setEditTeamName("");
    // Persist to Supabase
    await supabase.from('teams').update({ name: editTeamName.trim() }).eq('id', editingTeam.id);
  };

  // Delete Team
  const handleDeleteTeam = (team) => {
    setDeletingTeam(team);
    setShowDeleteTeam(true);
  };

  const confirmDeleteTeam = async () => {
    if (!deletingTeam) return;
    // Remove team from orgs
    setOrgs(orgs.map(o => o.id === selOrgId ? {
      ...o,
      teams: o.teams.filter(t => t.id !== deletingTeam.id)
    } : o));
    // Remove people in that team
    setPeople(people.filter(p => p.teamId !== deletingTeam.id));
    if (selTeamId === deletingTeam.id) setSelTeamId(null);
    setShowDeleteTeam(false);
    setDeletingTeam(null);
    // Persist to Supabase (cascade will handle people)
    await supabase.from('teams').delete().eq('id', deletingTeam.id);
  };

  // Delete Person
  const handleDeletePerson = (person) => {
    setDeletingPerson(person);
    setShowDeletePerson(true);
  };

  const confirmDeletePerson = async () => {
    if (!deletingPerson) return;
    setPeople(people.filter(p => p.id !== deletingPerson.id));
    if (selPersonId === deletingPerson.id) {
      const remaining = people.filter(p => p.id !== deletingPerson.id);
      setSelPersonId(remaining.length > 0 ? remaining[0].id : null);
    }
    setShowDeletePerson(false);
    setDeletingPerson(null);
    // Persist to Supabase
    await supabase.from('people').delete().eq('id', deletingPerson.id);
  };

  const domColor = (p) => { if (!p.disc) return C.border; const dom = getDom(p.disc.natural); return dom.includes("D") ? C.disc.D : dom.includes("I") ? C.disc.I : dom.includes("S") ? C.disc.S : C.disc.C; };

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.text, marginBottom: 8 }}>Loading...</div>
          <div style={{ fontSize: 14, color: C.muted }}>Connecting to database</div>
        </div>
      </div>
    );
  }

  // Show auth checking state
  if (authChecking) {
    return (
      <div style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.text, marginBottom: 8 }}>Loading...</div>
          <div style={{ fontSize: 14, color: C.muted }}>Checking authentication</div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) return <LoginPage onLogin={() => {}} />;

  return (
    <div style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>

      {/* TOP BAR */}
      <nav style={{ background: "#1A1A18", color: "#fff", height: "48px", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#C8A96E", letterSpacing: "0.5px", textTransform: "uppercase" }}>BTCG · Bridging the Connection Gap</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>{user?.user_metadata?.full_name || user?.email}</span>
          <button onClick={handleLogout} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #4B5563", background: "transparent", color: "#9CA3AF", fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#9CA3AF"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#4B5563"; e.currentTarget.style.color = "#9CA3AF"; }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* New Org Modal */}
      {showNewOrg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>New Organization</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Organization name..." style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 16, background: "#FFFFFF", boxSizing: "border-box", marginBottom: 16 }} autoFocus />
            <div style={{ display: "flex", gap: 8 }}><Btn primary onClick={addOrg}>Create</Btn><Btn onClick={() => { setShowNewOrg(false); setNewName(""); }}>Cancel</Btn></div>
          </div>
        </div>
      )}

      {/* New Team Modal */}
      {showNewTeam && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>New Team in {org?.name}</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Team name..." style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 16, background: "#FFFFFF", boxSizing: "border-box", marginBottom: 16 }} autoFocus />
            <div style={{ display: "flex", gap: 8 }}><Btn primary onClick={addTeam}>Create</Btn><Btn onClick={() => { setShowNewTeam(false); setNewName(""); }}>Cancel</Btn></div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeam && editingTeam && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Edit Team Name</h3>
            <input value={editTeamName} onChange={e => setEditTeamName(e.target.value)} placeholder="Team name..." style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 16, background: "#FFFFFF", boxSizing: "border-box", marginBottom: 16 }} autoFocus onKeyDown={e => { if (e.key === "Enter") saveEditTeam(); }} />
            <div style={{ display: "flex", gap: 8 }}><Btn primary onClick={saveEditTeam}>Save</Btn><Btn onClick={() => { setShowEditTeam(false); setEditingTeam(null); setEditTeamName(""); }}>Cancel</Btn></div>
          </div>
        </div>
      )}

      {/* Delete Team Modal */}
      {showDeleteTeam && deletingTeam && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#C62828" }}>Delete Team</h3>
            <p style={{ margin: "0 0 8px", fontSize: 14, color: C.text }}>Are you sure you want to delete <strong>{deletingTeam.name}</strong>?</p>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: C.muted }}>This will also remove all {people.filter(p => p.teamId === deletingTeam.id).length} team members. This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn style={{ background: "#C62828", border: "none" }} primary onClick={confirmDeleteTeam}>Delete Team</Btn>
              <Btn onClick={() => { setShowDeleteTeam(false); setDeletingTeam(null); }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Delete Person Modal */}
      {showDeletePerson && deletingPerson && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#C62828" }}>Remove Team Member</h3>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: C.text }}>Are you sure you want to remove <strong>{deletingPerson.name}</strong> from the team? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn style={{ background: "#C62828", border: "none" }} primary onClick={confirmDeletePerson}>Remove</Btn>
              <Btn onClick={() => { setShowDeletePerson(false); setDeletingPerson(null); }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", minHeight: "calc(100vh - 48px)" }}>

        {/* SIDEBAR */}
        <div style={{ width: 260, flexShrink: 0, background: "#FFFFFF", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)", overflow: "hidden" }}>

          {/* Title */}
          <div style={{ padding: "20px 16px 12px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2, marginBottom: 16 }}>Love Where You Lead</div>

            {/* Mode Toggle */}
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 3, marginBottom: 16 }}>
              {[["team", "Team Mode"], ["individual", "Individual Mode"]].map(([m, label]) => (
                <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px 4px", background: mode === m ? C.blue : "transparent", color: mode === m ? "#fff" : C.blue, border: mode === m ? "none" : "none", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 8, transition: "all 0.15s ease-out", outline: "none" }}>{label}</button>
              ))}
            </div>

            {/* Org Selection */}
            {mode === "team" && (<>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }}>Organization selection</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <select value={selOrgId} onChange={e => { setSelOrgId(e.target.value); setSelTeamId(null); }} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.text, fontSize: 13, fontWeight: 500, outline: "none" }}>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name.length > 10 ? o.name.slice(0, 10) + "..." : o.name}</option>)}
                </select>
                <button onClick={() => setShowNewTeam(true)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.blue}`, background: "#fff", color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add Team</button>
              </div>

              {/* Team Filter Pills - scrollable container */}
              <div style={{ maxHeight: 140, overflowY: "auto", marginBottom: 16, padding: "2px 0" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button onClick={() => { setSelTeamId(null); setSelPersonId(null); setView("teamInsights"); }} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${view === "teamInsights" && !selTeamId ? C.blue : C.border}`, background: view === "teamInsights" && !selTeamId ? C.blue : "#fff", color: view === "teamInsights" && !selTeamId ? "#fff" : C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                    All ({orgPeople.length})
                  </button>
                  {org?.teams.map(t => {
                    const count = orgPeople.filter(p => p.teamId === t.id).length;
                    const active = view === "teamInsights" && selTeamId === t.id;
                    const isHovered = hoveredTeamId === t.id;
                    return (
                      <div key={t.id} style={{ position: "relative", display: "inline-flex" }}
                        onMouseEnter={() => setHoveredTeamId(t.id)}
                        onMouseLeave={() => setHoveredTeamId(null)}>
                        <button onClick={() => { setSelTeamId(t.id); setSelPersonId(null); setView("teamInsights"); }} style={{ padding: "6px 14px", paddingRight: isHovered ? 50 : 14, borderRadius: 20, border: `1.5px solid ${active ? C.blue : C.border}`, background: active ? C.blue : "#fff", color: active ? "#fff" : C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                          {t.name} ({count})
                        </button>
                        {isHovered && (
                          <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 2 }}>
                            <button onClick={(e) => { e.stopPropagation(); handleEditTeam(t); }} title="Edit team name" style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "rgba(0,0,0,0.1)", color: C.text, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t); }} title="Delete team" style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "rgba(198,40,40,0.15)", color: "#C62828", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🗑️</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>)}

            {/* Upload Assessment Button */}
            <button onClick={() => setView("upload")} style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: C.blue, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12, transition: "opacity 0.15s" }}>
              + Upload Assessment
            </button>

            {/* Search Bar */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14, pointerEvents: "none" }}>🔍</span>
              <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "9px 10px 9px 32px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* People List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 16px" }}>
            {filtered.map(p => {
              const isPending = p.status === "pending";
              const isLeader = p.id === leaderId;
              const isHovered = hoveredPersonId === p.id;
              const isSelected = selPersonId === p.id && view === "viewer";
              return (
                <div key={p.id} style={{ position: "relative", marginBottom: 4 }}
                  onMouseEnter={() => setHoveredPersonId(p.id)}
                  onMouseLeave={() => setHoveredPersonId(null)}>
                  <button onClick={() => { if (!isPending) { setSelPersonId(p.id); setView("viewer"); } }} style={{
                    width: "100%", textAlign: "left", padding: "10px 12px", background: isSelected ? "rgba(41, 182, 246, 0.1)" : C.card,
                    border: `1.5px solid ${isLeader ? "#FFC107" : isSelected ? "#29B6F6" : C.border}`,
                    borderRadius: 9, cursor: isPending ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
                    opacity: isPending ? 0.6 : 1
                  }}>
                    {isPending ? (
                      <div style={{ width: 34, height: 34, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, background: "#E0E0E0", border: `2px dashed ${C.border}` }}>⏳</div>
                    ) : (
                      <PhotoAvatar personId={p.id} name={p.name} bgColor={domColor(p)} photo={photos[p.id]} onUpload={onUploadPhoto} size={34} square={true} />
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {isLeader && <span style={{ color: "#FFC107", marginRight: 4 }}>★</span>}
                        {p.name}
                      </div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                        {isPending ? "Assessment pending" : (
                          <div style={{ display: "flex", gap: 2 }}>
                            {Object.entries(p.disc.natural).map(([d, v]) => (
                              <span key={d} style={{ padding: "0 4px", borderRadius: 3, fontWeight: 600, background: v >= 60 ? `${C.disc[d]}18` : "transparent", color: v >= 60 ? C.disc[d] : C.muted, fontSize: 9 }}>{d}:{v}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  {/* Star and Delete buttons */}
                  {(isHovered || isLeader) && (
                    <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4, alignItems: "center" }}>
                      {!isPending && (
                        <button onClick={(e) => { e.stopPropagation(); setLeaderId(isLeader ? null : p.id); }}
                          title={isLeader ? "Remove as leader" : "Set as leader"}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 2, color: isLeader ? "#FFC107" : "#ccc", transition: "color 0.15s" }}>
                          {isLeader ? "★" : "☆"}
                        </button>
                      )}
                      {isHovered && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePerson(p); }}
                          title="Remove team member"
                          style={{ background: "rgba(198,40,40,0.1)", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, lineHeight: 1, padding: 4, color: "#C62828", transition: "all 0.15s" }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, fontSize: 11, color: C.muted }}>{search ? "No matches found" : "No people in this team yet"}</div>}

            {/* Add Expected Member */}
            {showAddPending ? (
              <div style={{ padding: "8px 4px" }}>
                <input value={pendingName} onChange={e => setPendingName(e.target.value)} placeholder="Member name..." autoFocus
                  onKeyDown={e => { if (e.key === "Enter") addPendingPerson(); if (e.key === "Escape") { setShowAddPending(false); setPendingName(""); } }}
                  style={{ width: "100%", padding: "6px 9px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, boxSizing: "border-box", marginBottom: 5 }} />
                <div style={{ display: "flex", gap: 5 }}>
                  <Btn small primary onClick={addPendingPerson}>Add</Btn>
                  <Btn small onClick={() => { setShowAddPending(false); setPendingName(""); }}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddPending(true)} style={{ width: "100%", padding: "10px 0", background: "none", border: `2px dashed ${C.blue}`, borderRadius: 8, color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                + Add Expected Member
              </button>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto", maxHeight: "calc(100vh - 48px)" }}>
          {mode === "individual" ? (
            <AuditDashboard person={selPerson} />
          ) : view === "upload" ? (
            <UploadForm orgs={orgs} selOrgId={selOrgId} selTeamId={selTeamId} onAdd={addPerson} onCancel={() => setView(selPerson ? "viewer" : "teamInsights")} />
          ) : view === "teamInsights" ? (
            <TeamInsights
              people={people}
              teamId={selTeamId}
              orgId={selOrgId}
              leaderId={leaderId}
              userId={user?.id}
              photos={photos}
              onUploadPhoto={onUploadPhoto}
              onViewProfile={(personId) => { setSelPersonId(personId); setViewerInitialTab("profile"); setViewerShowTips(false); setViewerShowCompare(false); setView("viewer"); }}
              onCompare={(personId) => { setSelPersonId(personId); setViewerInitialTab("profile"); setViewerShowTips(false); setViewerShowCompare(true); setView("viewer"); }}
              onShowTips={(personId) => { setSelPersonId(personId); setViewerInitialTab("profile"); setViewerShowTips(true); setViewerShowCompare(false); setView("viewer"); }}
            />
          ) : selPerson ? (
            <Viewer person={selPerson} leader={people.find(p => p.id === leaderId) || null} agreements={agreements} setAgreements={setAgreements} photos={photos} onUploadPhoto={onUploadPhoto} initialTab={viewerInitialTab} initialShowTips={viewerShowTips} initialShowCompare={viewerShowCompare} onClearShowTips={() => setViewerShowTips(false)} onClearShowCompare={() => setViewerShowCompare(false)} team={teamPeople.filter(p => p.status !== "pending")} />
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select a person to view their assessment</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>or click a team to see Team Insights</div>
            </div>
          )}
          {view === "viewer" && <div style={{ textAlign: "center", padding: "8px 0 20px", fontSize: 9, color: C.muted }}>© Bridging the Connection Gap · Dr. Daniel Truelove Jr.</div>}
        </div>
      </div>
    </div>
  );
}
