'use client';

import { useState } from 'react';
import { C } from '../constants/colors';
import { discFull } from '../constants/data';
import { Btn } from './Btn';

// ────── CONNECTION AGREEMENT WIZARD (Sprint 3B) ──────
export function BridgeWizard({ leader, person, agreements, setAgreements, onClose }) {
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
      <div className="modal-body" style={{ background: C.card, borderRadius: 14, width: "min(640px, 95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
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
