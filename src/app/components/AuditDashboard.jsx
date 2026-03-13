'use client';

import { useState } from "react";
import { C } from "../constants/colors";
import { discFull, isEqualExtProfile } from "../constants/data";
import { useIsMobile } from "../utils/useIsMobile";
import { Btn } from "./Btn";
import { Bias } from "./Bias";

const weekData = [
  {
    week: 1,
    title: "The Preference Bridge",
    subtitle: "Why You're Exhausted",
    theme: "DISC",
    color: C.disc.D,
    intro: "Your DISC profile shows how you're built to lead. When your environment asks you to operate differently, you pay a daily energy tax. Whether you feel it or not.",
    reflection: "When do you feel most like yourself at work? When do you feel like you're performing a version of yourself you didn't choose?",
    challenge: "This week, notice one moment where you shifted out of your Natural style to meet the room's expectations. Write down what triggered it and how it felt."
  },
  {
    week: 2,
    title: "The Passion Bridge",
    subtitle: "The Quiet Quitting Myth",
    theme: "Values",
    color: C.values.Altruistic,
    intro: "People don't go quiet because they stop caring. They go quiet because what they care about stopped mattering at work. Your Values profile reveals the fuel your leadership runs on, and whether your environment is filling the tank or draining it.",
    reflection: "Which of your top drivers do you get to live out at work right now? Which feel invisible or unsupported?",
    challenge: "This week, find one small way to activate your highest-scoring value in a current project or interaction."
  },
  {
    week: 3,
    title: "The Process Bridge",
    subtitle: "The Lie Your Environment Told You",
    theme: "Attributes",
    color: C.attr.ext,
    intro: "Your Attributes reveal how you naturally process the world and yourself. The bias indicators show where you may not be fully using the capacity you were built with. Whether that's environment-driven, experience-driven, or simply a natural preference, the pattern is worth understanding.",
    reflection: "When you make decisions, which lens do you trust most. Heart, Hand, or Head? Which do you skip, rush, or ignore? Has that always been true?",
    challenge: "This week, before making one decision, deliberately use your lowest-scoring External attribute before moving forward. Notice what changes."
  },
  {
    week: 4,
    title: "The Build",
    subtitle: "You Don't Have to Move to Build a House",
    theme: "Compound",
    color: C.accent,
    intro: "You now have your Compound Bill. The full picture of what your environment costs you. This week isn't about escaping. It's about designing. You can't always change your environment overnight, but you can change how you negotiate with it.",
    reflection: "What does your ideal work environment look like. The one where you'd stop paying the tax? What's one specific thing in that environment that you could ask for, or create, this week?",
    challenge: "Write one specific request to make to your leader, your team, or yourself based on what you've learned over the past three weeks. Make it concrete. Make it yours."
  }
];

function WeekCard({ weekDef, person, status, onComplete, expanded, onToggle, isMobile }) {
  const [reflection, setReflection] = useState("");
  const [challengeDone, setChallengeDone] = useState(false);
  const { week, title, subtitle, theme, color, intro, reflection: reflectionPrompt, challenge } = weekDef;
  const isLocked = status === "locked";
  const isCurrent = status === "current";
  const isComplete = status === "complete";

  const renderContent = () => {
    if (theme === "DISC") {
      const dims = ["D", "I", "S", "C"];
      const prefTax = dims.reduce((sum, d) => sum + Math.abs(person.disc.adaptive[d] - person.disc.natural[d]), 0);
      const taxLabel = prefTax >= 160 ? "Critical" : prefTax >= 120 ? "Heavy" : prefTax >= 80 ? "Significant" : prefTax >= 40 ? "Moderate" : "Aligned";
      const taxColor = prefTax >= 160 ? "#7F1D1D" : prefTax >= 120 ? "#C62828" : prefTax >= 80 ? "#E65100" : prefTax >= 40 ? "#F59E0B" : C.green;
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
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
              {taxLabel === "Critical" ? "Your environment is demanding near-maximum adaptation. This isn't a motivation problem. It's a design problem at a critical level." : taxLabel === "Heavy" ? "Your environment doesn't fit your natural style. The fatigue you feel is real. It's the cost of showing up as someone you're not." : taxLabel === "Significant" ? "Two to three dimensions are under sustained pressure. Adaptation isn't occasional right now. It's constant." : taxLabel === "Moderate" ? "You're adapting in meaningful ways. Some days feel natural. Others feel like a performance." : "Your environment fits your natural style. Protect this. It's not guaranteed."}
            </div>
          </div>
        </div>
      );
    }

    if (theme === "Values") {
      const topVals = Object.entries(person.values).filter(([, s]) => s >= 60).sort((a, b) => b[1] - a[1]);
      const lowVals = Object.entries(person.values).filter(([, s]) => s < 40);
      const passionTax = lowVals.length;
      const taxLabel = topVals.length === 0 ? "Unknown" : topVals.length >= 3 ? "3+ Active" : topVals.length >= 1 ? `${topVals.length} Active` : "Unknown";
      const taxColor = topVals.length === 0 ? C.muted : topVals.length >= 3 ? C.green : "#E65100";
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
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Passion Profile</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: taxColor }}>{taxLabel}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{topVals.length} top driver{topVals.length !== 1 ? "s" : ""} identified</div>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: C.text, lineHeight: 1.6, alignSelf: "center", paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}>
              {topVals.length > 0 ? `Your top drivers, ${topVals.slice(0,2).map(([k]) => k).join(" and ")}, are what get you out of bed. Whether your environment honors or starves these determines your Passion Tax. That requires examining your environment, not just your profile.` : "No strong value drivers found at or above 60. Your motivation may be scattered or suppressed."}
            </div>
          </div>
        </div>
      );
    }

    if (theme === "Attributes") {
      const extSorted = [...person.attr.ext].sort((a, b) => b.score - a.score);
      const isEqual = isEqualExtProfile(person.attr.ext);
      const extMinus = person.attr.ext.filter(a => a.bias === "\u2212").length;
      const taxColor = extMinus === 0 ? C.green : extMinus === 1 ? "#558B2F" : extMinus === 2 ? "#E65100" : "#C62828";
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.muted, marginBottom: 6 }}>{isEqual ? "External: Versatile Profile (Equal Capacity)" : "External: Your Decision Order"}</div>
            {(isEqual ? person.attr.ext : extSorted).map((a, i) => (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: isEqual || i === 0 ? `4px solid ${C.attr.ext}` : `1px solid ${C.border}`, marginBottom: 5 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.attr.ext, width: 20 }}>{isEqual ? "=" : i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{a.label} - {a.name}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.attr.ext }}>{a.score}</div>
                <Bias bias={a.bias} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Process Signals</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: taxColor }}>{extMinus === 0 ? "Clear" : `${extMinus} detected`}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{extMinus} bias pattern{extMinus !== 1 ? "s" : ""} to examine</div>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: C.text, lineHeight: 1.6, alignSelf: "center", paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}>
              {extMinus === 0 ? "All three external lenses show active use. No patterns requiring further examination." : `${extMinus} of your external lens${extMinus > 1 ? "es show" : " shows"} a bias pattern worth investigating. You have the capacity. Something is creating distance between your ability and your use of it.`}
            </div>
          </div>
        </div>
      );
    }

    if (theme === "Compound") {
      const dims = ["D", "I", "S", "C"];
      const prefTax = dims.reduce((sum, d) => sum + Math.abs(person.disc.adaptive[d] - person.disc.natural[d]), 0);
      const prefLabel = prefTax >= 160 ? "Critical" : prefTax >= 120 ? "Heavy" : prefTax >= 80 ? "Significant" : prefTax >= 40 ? "Moderate" : "Aligned";
      const topVals = Object.entries(person.values).filter(([, s]) => s >= 60);
      const extMinus = person.attr.ext.filter(a => a.bias === "\u2212").length;
      const processLabel = extMinus === 0 ? "Clear" : extMinus === 1 ? "1 Signal" : extMinus === 2 ? "2 Signals" : "3 Signals";
      const compoundColor = prefLabel === "Critical" ? "#7F1D1D" : prefLabel === "Heavy" ? "#C62828" : prefLabel === "Significant" ? "#E65100" : prefLabel === "Moderate" ? "#F59E0B" : C.green;
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            {[
              ["Preference Tax", prefLabel, `${prefTax} gap pts`, prefLabel === "Critical" ? "#7F1D1D" : prefLabel === "Heavy" ? "#C62828" : prefLabel === "Significant" ? "#E65100" : prefLabel === "Moderate" ? "#F59E0B" : C.green],
              ["Passion Profile", `${topVals.length} Drivers`, `${topVals.length} top identified`, topVals.length >= 3 ? C.green : topVals.length >= 1 ? "#E65100" : C.muted],
              ["Process Signals", processLabel, `${extMinus} pattern${extMinus !== 1 ? "s" : ""} detected`, extMinus === 0 ? C.green : extMinus >= 2 ? "#E65100" : "#558B2F"]
            ].map(([label, val, note, c]) => (
                <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{val}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>{note}</div>
                </div>
              ))}
          </div>
          <div style={{ padding: "20px 24px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, borderLeft: `5px solid ${compoundColor}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Your Compound Bill</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: compoundColor, lineHeight: 1, marginBottom: 10 }}>Preference: {prefLabel}</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8, fontWeight: 500 }}>
              {person.name.split(" ")[0]}, your Preference Tax is the confirmed cost your environment charges you every day. {prefLabel === "Critical" ? "You're paying a critical behavioral cost right now. That's not a personal failing. It's a design problem at a level that requires a real solution." : prefLabel === "Heavy" ? "You're paying a heavy behavioral price. The fatigue isn't weakness. It's what sustained adaptation costs." : prefLabel === "Significant" ? "You're carrying a significant daily cost. Multiple dimensions of who you are are under real pressure." : prefLabel === "Moderate" ? "You're carrying a moderate load. Some dimensions fit. Others don't. Knowing which is which is how you start building a better environment." : "Your behavioral environment largely fits who you are. That's worth protecting."} Your Passion and Process dimensions show patterns worth digging into through the Environment Alignment. That's where the full picture comes together.
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ borderRadius: 12, border: `2px solid ${isComplete ? C.green : isCurrent ? color : C.border}`, marginBottom: 14, overflow: "hidden", opacity: isLocked ? 0.55 : 1, transition: "all 0.2s" }}>
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

      {expanded && !isLocked && (
        <div style={{ padding: "16px 18px", borderTop: `1px solid ${C.border}`, background: C.card }}>
          <div style={{ background: "#1A1A1A", borderRadius: 10, height: 140, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, position: "relative", overflow: "hidden" }}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>▶</div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>Week {week} - {title}</div>
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>Video coming soon</div>
            </div>
          </div>

          <div style={{ padding: "10px 14px", borderRadius: 8, background: `${color}0C`, border: `1px solid ${color}33`, marginBottom: 14, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
            {intro}
          </div>

          {renderContent()}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>📝 Reflection</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, lineHeight: 1.5, fontStyle: "italic" }}>{reflectionPrompt}</div>
            <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Write your reflection here..."
              style={{ width: "100%", minHeight: 80, padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 11, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ padding: "12px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: "4px solid #E65100", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#E65100", marginBottom: 5 }}>⚡ This Week&apos;s Challenge</div>
            <div style={{ fontSize: 11, color: "#5D4037", lineHeight: 1.6 }}>{challenge}</div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, cursor: "pointer", fontSize: 11, fontWeight: 600, color: challengeDone ? C.green : C.muted }}>
              <input type="checkbox" checked={challengeDone} onChange={e => setChallengeDone(e.target.checked)} style={{ width: 16, height: 16 }} />
              {challengeDone ? "Challenge complete!" : "Mark challenge complete"}
            </label>
          </div>

          {isCurrent && (
            <Btn primary onClick={onComplete} disabled={!challengeDone || !reflection.trim()} style={{ width: "100%" }}>
              {!challengeDone || !reflection.trim() ? "Complete the reflection and challenge to finish this week" : `Complete Week ${week} →`}
            </Btn>
          )}
          {isComplete && <div style={{ textAlign: "center", fontSize: 12, color: C.green, fontWeight: 700 }}>✓ Week {week} Complete. Great work.</div>}
        </div>
      )}
    </div>
  );
}

export function AuditDashboard({ person }) {
  const isMobile = useIsMobile();
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
    const prefLabel = pref >= 160 ? "Critical" : pref >= 120 ? "Heavy" : pref >= 80 ? "Significant" : pref >= 40 ? "Moderate" : "Aligned";
    const passion = Object.entries(person.values).filter(([, s]) => s < 40).length;
    const passLabel = passion >= 4 ? "Heavy" : passion >= 2 ? "Moderate" : "Light";
    const proc = person.attr.ext.filter(a => a.bias === "\u2212").length;
    const procLabel = proc === 0 ? "None" : proc === 1 ? "Light" : proc === 2 ? "Moderate" : "Heavy";
    const all = [prefLabel, passLabel, procLabel];
    return all.includes("Heavy") ? "Heavy" : all.includes("Moderate") ? "Moderate" : "Light";
  })();
  const taxColor = totalTax === "Heavy" ? "#C62828" : totalTax === "Moderate" ? "#E65100" : C.green;

  return (
    <div>
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

      <div style={{ height: 6, background: C.hi, borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ height: "100%", width: `${(completedWeeks.size / 4) * 100}%`, background: C.green, borderRadius: 3, transition: "width 0.4s" }} />
      </div>

      {weekData.map(wd => (
        <WeekCard
          key={wd.week}
          weekDef={wd}
          person={person}
          isMobile={isMobile}
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
            {person.name.split(" ")[0]}, you now have a complete picture of your environment, and a plan to lead within it on your own terms.
          </div>
        </div>
      )}
    </div>
  );
}
