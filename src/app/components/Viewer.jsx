'use client';

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";
import { C } from "../constants/colors";
import { discFull, getDom } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Btn } from "./Btn";
import { PhotoAvatar } from "./PhotoAvatar";
import { CircleProgress } from "./CircleProgress";
import { Sec } from "./Sec";
import { DTip, VTip } from "./Tooltips";
import { IndividualComparison } from "./IndividualComparison";
import { BridgeWizard } from "./BridgeWizard";
import { EnvironmentReport } from "./EnvironmentReport";
import { LeadershipTips } from "./LeadershipTips";
import { CompareWithOthers } from "./CompareWithOthers";
import { ConnectionSOPs } from "./ConnectionSOPs";
import { EnvironmentAlignment } from "./EnvironmentAlignment";

export function Viewer({ person, leader, agreements, setAgreements, photos = {}, onUploadPhoto, initialTab = "profile", initialShowTips = false, initialShowCompare = false, onClearShowTips, onClearShowCompare, team = [] }) {
  const isMobile = useIsMobile();
  const [dv, setDv] = useState("both");
  const [tab, setTab] = useState(initialTab);
  const [showWizard, setShowWizard] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTips, setShowTips] = useState(initialShowTips);
  const [showCompare, setShowCompare] = useState(initialShowCompare);
  const [showAlignment, setShowAlignment] = useState(false);

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
      {showAlignment && (
        <EnvironmentAlignment person={sel} onClose={() => setShowAlignment(false)} />
      )}
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

      <div style={{ marginBottom: 20, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-start", justifyContent: "space-between", gap: isMobile ? 12 : 0 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <PhotoAvatar personId={sel.id} name={sel.name} bgColor={C.disc[getDom(sel.disc.natural).split("/")[0]] || C.accent} photo={photos[sel.id]} onUpload={onUploadPhoto} size={isMobile ? 56 : 72} square={true} />
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: -0.5 }}>{sel.name}</h1>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{isMobile ? "LWYL Profile" : "Love Where You Lead Profile · click photo to update"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
          <Btn onClick={() => setShowAlignment(true)} style={{ fontSize: 11 }}>{isMobile ? "🎯 Align" : "🎯 Env. Alignment"}</Btn>
          <Btn onClick={() => setShowReport(true)} style={{ fontSize: 11 }}>{isMobile ? "📄 Report" : "📄 Environment Report"}</Btn>
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
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 6, marginTop: 8 }}>
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
            <YAxis type="category" dataKey="name" width={isMobile ? 80 : 110} tick={{ fontSize: isMobile ? 11 : 13, fontWeight: 500, fill: C.text }} axisLine={false} tickLine={false} />
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
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 32 }}>
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

      {/* CONNECTION SOPs */}
      <ConnectionSOPs person={sel} />

      </div>)}
    </div>
  );
}
