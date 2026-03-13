'use client';

import { C } from '../constants/colors';
import { getDom } from '../constants/data';
import { Btn } from './Btn';

// ────── LEADERSHIP TIPS MODAL ──────
export function LeadershipTips({ person, onClose }) {
  const p = person;
  const dom = getDom(p.disc.natural);
  const topVals = Object.entries(p.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const extLead = [...p.attr.ext].sort((a, b) => b.score - a.score)[0];
  const firstName = p.name.split(" ")[0];

  // Generate DISC-based tips
  const discTips = [];
  if (p.disc.natural.D >= 60) {
    discTips.push({ title: "Use their drive", tip: `${firstName} thrives when given challenges and autonomy. Assign them problems to solve, not tasks to complete. Avoid micromanaging.` });
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
      <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(600px, 100%)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
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
              These tips are based on {firstName}'s assessment data. The best leadership comes from ongoing conversation - use these as starting points, not rules.
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
