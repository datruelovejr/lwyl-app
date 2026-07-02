'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";
import { motion } from 'framer-motion';
import { discFull, getDom } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Btn } from "./Btn";
import { PhotoAvatar } from "./PhotoAvatar";
import { CircleProgress } from "./CircleProgress";
import { DTip, VTip } from "./Tooltips";
import { IndividualComparison } from "./IndividualComparison";
import { ConnectionSOPs } from "./ConnectionSOPs";
import { CoreAttributes } from "./CoreAttributes";
import { Card } from './ui/Card';

// Lazy-load heavy modals -- only parsed when user opens them
const BridgeWizard = dynamic(() => import("./BridgeWizard").then(m => m.BridgeWizard), { ssr: false });
const EnvironmentReport = dynamic(() => import("./EnvironmentReport").then(m => m.EnvironmentReport), { ssr: false });
const LeadershipTips = dynamic(() => import("./LeadershipTips").then(m => m.LeadershipTips), { ssr: false });
const CompareWithOthers = dynamic(() => import("./CompareWithOthers").then(m => m.CompareWithOthers), { ssr: false });
const EnvironmentAlignment = dynamic(() => import("./EnvironmentAlignment").then(m => m.EnvironmentAlignment), { ssr: false });
const MeetingRoom = dynamic(() => import("./MeetingRoom").then(m => m.MeetingRoom), { ssr: false });

export function Viewer({ person, leader, agreements, setAgreements, photos = {}, onUploadPhoto, initialTab = "profile", initialShowTips = false, initialShowCompare = false, onClearShowTips, onClearShowCompare, team = [] }) {
  const isMobile = useIsMobile();
  const [dv, setDv] = useState("both");
  const [tab, setTab] = useState(initialTab);
  const [showWizard, setShowWizard] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTips, setShowTips] = useState(initialShowTips);
  const [showCompare, setShowCompare] = useState(initialShowCompare);
  const [showAlignment, setShowAlignment] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);

  useEffect(() => {
    if (initialShowTips) {
      setShowTips(true);
      onClearShowTips?.();
    }
  }, [initialShowTips, onClearShowTips]);

  useEffect(() => {
    if (initialShowCompare) {
      setShowCompare(true);
      onClearShowCompare?.();
    }
  }, [initialShowCompare, onClearShowCompare]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const sel = person;
  const canCompare = leader && leader.id !== person.id && leader.disc;
  const domStyle = getDom(sel.disc.natural);
  const primaryDim = domStyle.split("/")[0];
  const discD = ["D", "I", "S", "C"].map(d => ({
    dim: d,
    full: discFull[d],
    Natural: sel.disc.natural[d],
    Adaptive: sel.disc.adaptive[d],
    gap: sel.disc.adaptive[d] - sel.disc.natural[d]
  }));
  const valD = Object.entries(sel.values)
    .map(([n, s]) => ({ name: n, score: s, color: `var(--values-${n.toLowerCase()})` }))
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      {showAlignment && (
        <EnvironmentAlignment person={sel} onClose={() => setShowAlignment(false)} />
      )}
      {showMeeting && (
        <MeetingRoom person={sel} leader={leader} onClose={() => setShowMeeting(false)} />
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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`mb-5 flex ${isMobile ? 'flex-col items-stretch gap-3' : 'flex-row items-start justify-between'}`}
      >
        <div className="flex gap-3 items-center">
          <PhotoAvatar
            personId={sel.id}
            name={sel.name}
            bgColor={`var(--disc-${primaryDim.toLowerCase()})`}
            photo={photos[sel.id]}
            onUpload={onUploadPhoto}
            size={isMobile ? 56 : 72}
            square={true}
          />
          <div>
            <h1 className={`m-0 font-extrabold tracking-tight ${isMobile ? 'text-xl' : 'text-2xl'}`}>{sel.name}</h1>
            <div className="text-xs text-muted mt-0.5">
              {isMobile ? "LWYL Profile" : "Love Where You Lead Profile \u00b7 click photo to update"}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 flex-wrap ${isMobile ? 'justify-start' : 'justify-end'}`}>
          <Btn onClick={() => setShowMeeting(true)} style={{ fontSize: 11 }}>
            {isMobile ? "\ud83e\udd1d Prep" : "\ud83e\udd1d Meeting Room"}
          </Btn>
          <Btn onClick={() => setShowAlignment(true)} style={{ fontSize: 11 }}>
            {isMobile ? "\ud83c\udfaf Align" : "\ud83c\udfaf Env. Alignment"}
          </Btn>
          <Btn onClick={() => setShowReport(true)} style={{ fontSize: 11 }}>
            {isMobile ? "\ud83d\udcc4 Report" : "\ud83d\udcc4 Environment Report"}
          </Btn>
          <div className="flex bg-subtle rounded-lg border border-border overflow-hidden">
            {[
              ["profile", "Profile"],
              ["attributes", "Core Attributes"],
              ...(canCompare ? [["compare", "Compare to Leader"]] : []),
            ].map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 border-none text-[11px] font-semibold cursor-pointer ${
                  tab === t ? 'bg-nav text-white' : 'bg-transparent text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="px-3.5 py-1.5 bg-subtle rounded-lg border border-border text-center">
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider">Leadership Style</div>
            <div className="text-base font-extrabold mt-0.5">{domStyle}</div>
          </div>
        </div>
      </motion.div>

      {/* Tab content */}
      {tab === "compare" && canCompare ? (
        <IndividualComparison leader={leader} person={person} agreements={agreements} setAgreements={setAgreements} onStartWizard={() => setShowWizard(true)} />
      ) : tab === "attributes" ? (
        <CoreAttributes person={sel} team={team} />
      ) : (<div>

      {/* DISC */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-foreground leading-tight m-0 mb-1">DISC Profile</h2>
            <p className="text-sm text-muted m-0">How your environment shaped your leadership</p>
          </div>
          <div className="flex gap-1 mb-3">
            {["both", "natural", "adaptive"].map(v => (
              <button
                key={v}
                onClick={() => setDv(v)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold cursor-pointer capitalize border ${
                  dv === v ? 'bg-nav text-white border-nav' : 'bg-transparent text-foreground border-border'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={discD} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis dataKey="dim" tick={{ fontSize: 12, fontWeight: 600, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<DTip />} />
              {(dv === "both" || dv === "natural") && (
                <Bar dataKey="Natural" barSize={40} radius={[4, 4, 0, 0]}>
                  {discD.map((e, i) => <Cell key={i} fill={`var(--disc-${e.dim.toLowerCase()})`} />)}
                  <LabelList dataKey="Natural" position="center" style={{ fontSize: 13, fontWeight: 700, fill: "var(--bg-card)" }} />
                </Bar>
              )}
              {(dv === "both" || dv === "adaptive") && (
                <Bar dataKey="Adaptive" barSize={40} radius={[4, 4, 0, 0]} fill="var(--disc-gray)">
                  <LabelList dataKey="Adaptive" position="center" style={{ fontSize: 13, fontWeight: 700, fill: "var(--bg-card)" }} />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-1.5 mt-2`}>
            {discD.map(d => {
              const g = Math.abs(d.gap);
              return (
                <div key={d.dim} className="py-1.5 px-2 rounded-lg bg-subtle border border-border text-center">
                  <div className="text-[9px] font-bold" style={{ color: `var(--disc-${d.dim.toLowerCase()})` }}>{d.full}</div>
                  <div className="text-base font-extrabold mt-0.5">{d.Natural}</div>
                  <div className="text-[10px] text-muted">A: {d.Adaptive}</div>
                  <div
                    className="text-[10px] font-bold mt-0.5"
                    style={{ color: g >= 10 ? "var(--friction-high)" : "var(--text-muted)" }}
                  >
                    {g >= 10 ? `\u26a1 Gap: ${d.gap > 0 ? "+" : ""}${d.gap}` : `Gap: ${d.gap > 0 ? "+" : ""}${d.gap}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* VALUES */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-foreground leading-tight m-0 mb-1">Values &amp; Passion</h2>
            <p className="text-sm text-muted m-0">The fuel your leadership runs on</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={valD} layout="vertical" barSize={32} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={isMobile ? 80 : 110} tick={{ fontSize: isMobile ? 11 : 13, fontWeight: 500, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<VTip />} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {valD.map((e, i) => <Cell key={i} fill={e.color} />)}
                <LabelList dataKey="score" position="insideRight" style={{ fontSize: 14, fontWeight: 700, fill: "var(--bg-card)" }} offset={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* ATTRIBUTES */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-foreground leading-tight m-0 mb-1">Process &amp; Attributes</h2>
            <p className="text-sm text-muted m-0">How your mind works best</p>
          </div>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${isMobile ? 'gap-6' : 'gap-8'}`}>
            {[
              { label: "External", subtitle: "Heart \u00b7 Hand \u00b7 Head", color: "var(--attr-ext)", data: sel.attr.ext, useLabel: true },
              { label: "Internal", subtitle: "Foundation", color: "var(--attr-int)", data: sel.attr.int, useLabel: false }
            ].map(section => (
              <div key={section.label}>
                <div className="text-base font-semibold mb-1" style={{ color: section.color }}>{section.label}</div>
                <div className="text-[13px] text-muted mb-4">{section.subtitle}</div>
                <div className="flex gap-2 justify-around">
                  {section.data.map(a => (
                    <CircleProgress
                      key={a.name}
                      value={a.score}
                      max={10}
                      color={section.color}
                      label={section.useLabel ? a.label : a.name}
                      name={section.useLabel ? a.name : ""}
                      bias={a.bias}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* CONNECTION SOPs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <ConnectionSOPs person={sel} />
      </motion.div>

      </div>)}
    </div>
  );
}
