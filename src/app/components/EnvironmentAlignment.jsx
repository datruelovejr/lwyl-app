'use client';

import { useState } from "react";
import { C } from "../constants/colors";
import { normBias } from "../constants/data";

// ────── PRIORITY 6: ENVIRONMENT ALIGNMENT SELF-REPORT ──────
export function EnvironmentAlignment({ person, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Build personalized questions from their profile
  const questions = [];

  // DISC question - based on Natural dominant dim
  const domDim = ["D","I","S","C"].reduce((a,b) => person.disc.natural[b] > person.disc.natural[a] ? b : a, "D");
  const discQ = {
    D: { id: "q_disc", category: "Preference", text: "At work, can you make decisions and move quickly without waiting for approval at every turn?" },
    I: { id: "q_disc", category: "Preference", text: "Does your work give you regular chances to connect, communicate, and energize the people around you?" },
    S: { id: "q_disc", category: "Preference", text: "Is your work environment predictable enough that you're not burning energy on constant unexpected change?" },
    C: { id: "q_disc", category: "Preference", text: "Do you get the time and information you need to meet the quality standard you hold for your work?" }
  };
  questions.push(discQ[domDim]);

  // Values questions - top 2 values
  const valQ = {
    Aesthetic:       { id: "q_val_ae", category: "Passion", text: "Does your work environment feel like it actually cares about people - not just output?" },
    Economic:        { id: "q_val_ec", category: "Passion", text: "Do you see a clear, measurable return on the time and energy you invest at work?" },
    Individualistic: { id: "q_val_in", category: "Passion", text: "Do you have real autonomy over how you work - or do you mostly execute someone else's plan?" },
    Political:       { id: "q_val_po", category: "Passion", text: "Do you have genuine influence over decisions that matter at work - not just the ones you're assigned?" },
    Altruistic:      { id: "q_val_al", category: "Passion", text: "Does your work feel like it's genuinely helping people in ways that matter to you?" },
    Regulatory:      { id: "q_val_re", category: "Passion", text: "Are expectations, roles, and processes clear - or do you spend energy filling in what's left undefined?" },
    Theoretical:     { id: "q_val_th", category: "Passion", text: "Does your environment give you time to think, learn, and understand the 'why' behind what you're doing?" }
  };
  Object.entries(person.values).filter(([,s]) => s >= 60).sort((a,b) => b[1]-a[1]).slice(0,2).forEach(([v]) => questions.push(valQ[v]));

  // Attributes questions - for any − bias
  const extBiasQ = {
    "Empathy":           { id: "q_heart_bias", category: "Process", text: "Do the people around you pay attention to how decisions land on individuals - or does that tend to get skipped?" },
    "Practical Thinking":{ id: "q_hand_bias",  category: "Process", text: "Does your team actually follow through on what it decides, or do good plans die in the room?" },
    "Systems Judgment":  { id: "q_head_bias",  category: "Process", text: "Does your environment take time to think strategically, or does it mostly react to what's in front of it?" }
  };
  person.attr.ext.forEach(a => { if (normBias(a.bias) === "\u2212") questions.push(extBiasQ[a.name]); });

  const intBiasQ = {
    "Self-Esteem":    { id: "q_se",  category: "Internal", text: "Do you feel genuinely valued for what you bring - not just for finishing tasks?" },
    "Role Awareness": { id: "q_ra",  category: "Internal", text: "Is your role and what success looks like clearly defined - or does it feel like you're always guessing?" },
    "Self-Direction": { id: "q_sd",  category: "Internal", text: "Do you have a clear path forward - personal goals, a growth direction, something you're actively working toward?" }
  };
  person.attr.int.forEach(a => { if (normBias(a.bias) === "\u2212") questions.push(intBiasQ[a.name]); });

  const opts = ["Often","Sometimes","Rarely"];
  const score = { Often: 2, Sometimes: 1, Rarely: 0 };
  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  const results = submitted ? (() => {
    const byCategory = {};
    questions.forEach(q => {
      if (!byCategory[q.category]) byCategory[q.category] = { total: 0, max: 0 };
      byCategory[q.category].total += score[answers[q.id]] || 0;
      byCategory[q.category].max += 2;
    });
    return byCategory;
  })() : null;

  const getStatus = (total, max) => {
    const pct = total / max;
    return pct >= 0.7 ? { label: "Supported", color: "#2E7D32", bg: "#E8F5E9", text: "Your environment is working for this dimension." }
         : pct >= 0.4 ? { label: "Signal",    color: "#E65100", bg: "#FFF3E0", text: "Your environment partially supports this. Worth watching." }
         :               { label: "Tax",       color: "#B71C1C", bg: "#FFEBEE", text: "Your environment is actively costing you here. This is confirmed." };
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="modal-body" style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Environment Alignment</div>
            <div style={{ fontSize: 12, color: C.muted }}>Personalized for {person.name.split(" ")[0]}'s profile · {questions.length} questions</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: C.hi, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {!submitted ? (
            <>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
                These questions are built from {person.name.split(" ")[0]}'s actual profile data. Honest answers here turn signals into confirmed taxes - or clear them.
              </div>
              {questions.map((q, i) => (
                <div key={q.id} style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: C.hi, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{q.category}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.5, marginBottom: 12 }}>{q.text}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {opts.map(o => (
                      <button key={o} onClick={() => setAnswers(a => ({...a, [q.id]: o}))}
                        style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `2px solid ${answers[q.id] === o ? C.accent : C.border}`, background: answers[q.id] === o ? C.accent : "#fff", color: answers[q.id] === o ? "#fff" : C.text, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => setSubmitted(true)} disabled={!allAnswered}
                style={{ width: "100%", padding: "14px", borderRadius: 10, background: allAnswered ? C.accent : C.border, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: allAnswered ? "pointer" : "default", transition: "background 0.2s" }}>
                See Results
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>What the environment is actually doing to {person.name.split(" ")[0]}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Based on {person.name.split(" ")[0]}'s answers - not assumptions.</div>
              {Object.entries(results).map(([cat, {total, max}]) => {
                const st = getStatus(total, max);
                return (
                  <div key={cat} style={{ padding: 16, borderRadius: 10, background: st.bg, border: `1px solid`, borderColor: st.color + "44", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{cat}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: st.color, background: "#fff", padding: "2px 10px", borderRadius: 8 }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.text }}>{st.text}</div>
                  </div>
                );
              })}
              <button onClick={() => { setAnswers({}); setSubmitted(false); }} style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 10, background: C.hi, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.text }}>Retake</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
