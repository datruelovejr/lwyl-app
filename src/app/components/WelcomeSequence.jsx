'use client';

import { useState, useEffect, useCallback } from "react";
import { C } from "../constants/colors";
import { getDom, discFull } from "../constants/data";
import { Btn } from "./Btn";

/* ─── Insight generation ─── */
function generateFirstInsight(person) {
  if (!person?.disc || !person?.values) return null;

  // Priority 1: Values outlier
  const valEntries = Object.entries(person.values);
  const highVal = valEntries.find(([, v]) => v >= 70);
  const lowVal = valEntries.find(([, v]) => v <= 25);

  if (highVal) {
    const descriptions = {
      Aesthetic: "how environments and experiences shape your energy",
      Economic: "return on investment in everything you do",
      Individualistic: "standing out and leading from the front",
      Political: "influence, control, and driving outcomes",
      Altruistic: "serving others and making a meaningful difference",
      Regulatory: "order, structure, and doing things the right way",
      Theoretical: "understanding, learning, and discovering truth",
    };
    return {
      type: "values",
      dimension: highVal[0],
      score: highVal[1],
      title: `Your strongest Values driver is ${highVal[0]}`,
      text: `At ${highVal[1]} out of 100, ${descriptions[highVal[0]] || "this dimension"} shapes how you evaluate decisions, what fulfills you as a leader, and where you draw energy from.`,
      color: C.values[highVal[0]],
    };
  }

  // Priority 2: DISC Natural vs Adaptive gap
  if (person.disc.natural && person.disc.adaptive) {
    const gaps = Object.entries(person.disc.natural)
      .map(([dim, nat]) => ({
        dim,
        gap: Math.abs(nat - (person.disc.adaptive?.[dim] || nat)),
        nat,
        adapt: person.disc.adaptive?.[dim] || nat,
      }))
      .sort((a, b) => b.gap - a.gap);

    if (gaps[0].gap >= 20) {
      const g = gaps[0];
      const direction = g.nat > g.adapt ? "dialing back" : "amplifying";
      return {
        type: "disc_gap",
        dimension: g.dim,
        score: g.gap,
        title: `You're adapting your ${discFull[g.dim]} every day`,
        text: `Your natural ${discFull[g.dim]} is ${g.nat}, but you adapt to ${g.adapt} at work. You're ${direction} this trait daily. That takes real energy your team may never see.`,
        color: C.disc[g.dim],
      };
    }
  }

  // Priority 3: Low value
  if (lowVal) {
    return {
      type: "values_low",
      dimension: lowVal[0],
      score: lowVal[1],
      title: `${lowVal[0]} ranks low for you`,
      text: `At ${lowVal[1]} out of 100, this isn't what drives you. Knowing what doesn't motivate you is just as powerful as knowing what does. When your team leans on ${lowVal[0].toLowerCase()} values, now you'll understand why it feels misaligned.`,
      color: C.values[lowVal[0]],
    };
  }

  // Priority 4: Attributes decision order
  if (person.attr?.ext) {
    const order = [...person.attr.ext].sort((a, b) => b.score - a.score);
    return {
      type: "attributes",
      title: `You lead with ${order[0].label} first`,
      text: `Your decision-making flows ${order[0].label} then ${order[1].label} then ${order[2].label}. That means ${order[0].name.toLowerCase()} drives your choices before ${order[2].name.toLowerCase()} does. Your team experiences this order whether you intend it or not.`,
      color: C.attr.ext,
    };
  }

  return null;
}

/* ─── Team composition summary ─── */
function getTeamSummary(people, leaderId) {
  const withData = people.filter((p) => p.disc?.natural);
  if (withData.length === 0) return null;

  const domCounts = { D: 0, I: 0, S: 0, C: 0 };
  withData.forEach((p) => {
    const dom = getDom(p.disc.natural);
    const primary = dom.split("/")[0];
    if (domCounts[primary] !== undefined) domCounts[primary]++;
  });

  const sorted = Object.entries(domCounts).sort((a, b) => b[1] - a[1]);
  const topStyle = sorted[0][0];
  const topPct = Math.round((sorted[0][1] / withData.length) * 100);

  const leader = people.find((p) => p.id === leaderId);
  const leaderDom = leader?.disc?.natural ? getDom(leader.disc.natural).split("/")[0] : null;

  let narrative;
  if (leaderDom && leaderDom !== topStyle && topPct >= 40) {
    narrative = `You lead a team where ${topPct}% are High ${discFull[topStyle]} members. You're a High ${discFull[leaderDom]}. That gap is where most of your friction lives, and it's not anyone's fault.`;
  } else if (leaderDom && leaderDom === topStyle) {
    narrative = `You and your team share High ${discFull[topStyle]} energy. That alignment is a strength. This app will show you where to watch for blind spots.`;
  } else {
    const styles = sorted
      .filter(([, c]) => c > 0)
      .map(([s]) => discFull[s])
      .join(", ");
    narrative = `Your team is a mix of ${styles}. That diversity is powerful when you know how to lead each person differently.`;
  }

  return { domCounts, topStyle, topPct, narrative, total: withData.length };
}

/* ─── Step components ─── */

function StepRecognition({ firstName, onNext }) {
  return (
    <div className="onboarding-step">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.muted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>
          Love Where You Lead
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1.3, margin: 0 }}>
          Welcome, {firstName}.
        </h1>
        <p style={{ fontSize: 18, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
          Your leadership profile is ready.
        </p>
      </div>
      <Btn primary onClick={onNext}>Let's get started</Btn>
    </div>
  );
}

function StepEndowedProgress({ hasData, onNext }) {
  return (
    <div className="onboarding-step">
      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Your leadership journey</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>Step 1 of 4</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: "hidden" }}>
          <div className="onboarding-progress-fill" style={{ height: "100%", borderRadius: 4, background: C.blue, width: "25%", transition: "width 800ms ease-out" }} />
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.blue}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            {hasData ? "\u2713" : "1"}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
              {hasData ? "Profile Ready" : "Upload Your Assessment"}
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {hasData
                ? "Your leadership assessment revealed your Preference, Passion, and Process."
                : "Upload your Innermetrix assessment to unlock your profile."}
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: "0 0 8px", lineHeight: 1.3 }}>
        {hasData ? "You've already taken the first step." : "Let's start with your assessment."}
      </h2>
      <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "0 0 24px" }}>
        {hasData
          ? "Now let's put that to work."
          : "Once uploaded, your profile powers everything in this app."}
      </p>

      <Btn primary onClick={onNext}>
        {hasData ? "See your first insight" : "Continue"}
      </Btn>
    </div>
  );
}

function StepFirstInsight({ insight, onNext }) {
  if (!insight) {
    return (
      <div className="onboarding-step">
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>
          Your insights are waiting
        </h2>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "0 0 24px" }}>
          Once your assessment data is loaded, this is where your first personalized leadership insight will appear. Something you might not have noticed before.
        </p>
        <Btn primary onClick={onNext}>Continue</Btn>
      </div>
    );
  }

  return (
    <div className="onboarding-step">
      <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 16, letterSpacing: "0.3px", textTransform: "uppercase" }}>
        Your first insight
      </div>

      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${insight.color}`, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.3 }}>
          {insight.title}
        </div>
        {insight.score && (
          <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: `${insight.color}18`, color: insight.color, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            {insight.score}/100
          </div>
        )}
        <p style={{ fontSize: 16, color: C.text, lineHeight: 1.6, margin: 0, opacity: 0.85 }}>
          {insight.text}
        </p>
      </div>

      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, margin: "0 0 24px" }}>
        This is just the beginning. The deeper you go, the sharper these insights become.
      </p>

      <Btn primary onClick={onNext}>What matters most to you?</Btn>
    </div>
  );
}

function StepMicroCommitment({ selectedGoal, setSelectedGoal, onNext }) {
  const goals = [
    { id: "relationships", label: "Understanding why certain team relationships feel harder" },
    { id: "one-on-ones", label: "Getting better at one-on-ones" },
    { id: "environment", label: "Building a team environment where people thrive" },
    { id: "friction", label: "Reducing the friction that's draining my energy" },
  ];

  return (
    <div className="onboarding-step">
      <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: "0 0 8px", lineHeight: 1.3 }}>
        What matters most to you right now?
      </h2>
      <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "0 0 24px" }}>
        This helps us surface the insights that are most relevant to where you are as a leader.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {goals.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGoal(g.id)}
            style={{
              textAlign: "left",
              padding: "16px 20px",
              borderRadius: 10,
              border: `2px solid ${selectedGoal === g.id ? C.blue : C.border}`,
              background: selectedGoal === g.id ? `${C.blue}08` : C.card,
              cursor: "pointer",
              transition: "all 0.15s",
              fontSize: 15,
              fontWeight: 500,
              color: C.text,
              lineHeight: 1.4,
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      <Btn primary onClick={onNext} disabled={!selectedGoal}>
        {selectedGoal ? "Show me my team" : "Select one to continue"}
      </Btn>
    </div>
  );
}

function StepTeamReveal({ teamSummary, onNext }) {
  if (!teamSummary) {
    return (
      <div className="onboarding-step">
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: "0 0 12px", lineHeight: 1.3 }}>
          Your team view is almost ready
        </h2>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "0 0 24px" }}>
          Once your team completes their assessments, you'll see them like you've never seen them before. Their strengths. Their needs. The specific gaps between how you lead and what they need.
        </p>
        <Btn primary onClick={onNext}>Explore your dashboard</Btn>
      </div>
    );
  }

  const bars = Object.entries(teamSummary.domCounts).map(([style, count]) => ({
    style,
    label: discFull[style],
    count,
    pct: teamSummary.total > 0 ? Math.round((count / teamSummary.total) * 100) : 0,
    color: C.disc[style],
  }));

  return (
    <div className="onboarding-step">
      <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 16, letterSpacing: "0.3px", textTransform: "uppercase" }}>
        Your team at a glance
      </div>

      {/* DISC distribution bars */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bars.map((b) => (
            <div key={b.style}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: b.color }}>{b.label}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{b.count} member{b.count !== 1 ? "s" : ""} ({b.pct}%)</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: C.border }}>
                <div
                  className="onboarding-progress-fill"
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: b.color,
                    width: `${b.pct}%`,
                    transition: "width 800ms ease-out",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interpretive sentence */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.disc[teamSummary.topStyle]}`, padding: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 16, fontWeight: 500, color: C.text, lineHeight: 1.6, margin: 0 }}>
          {teamSummary.narrative}
        </p>
      </div>

      <Btn primary onClick={onNext}>Explore your dashboard</Btn>
    </div>
  );
}

function StepClose({ onComplete }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="onboarding-step" style={{ opacity: visible ? 1 : 0, transition: "opacity 600ms ease-out" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: "0 0 16px", lineHeight: 1.4 }}>
          You're already further than most leaders ever get.
        </h2>
        <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.6, margin: "0 0 32px" }}>
          The fact that you're here means you care about the people you lead. Let's make sure they feel it.
        </p>
        <Btn primary onClick={onComplete}>Enter your dashboard</Btn>
      </div>
    </div>
  );
}

/* ─── Main WelcomeSequence ─── */

export function WelcomeSequence({ user, people, leaderId, onComplete, onShowUpload }) {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  // Derive user's first name
  const fullName = user?.user_metadata?.full_name || user?.email || "";
  const firstName = fullName.includes("@")
    ? fullName.split("@")[0].charAt(0).toUpperCase() + fullName.split("@")[0].slice(1)
    : fullName.split(" ")[0];

  // Find the leader person (or first person with data)
  const leader = people.find((p) => p.id === leaderId);
  const personWithData = leader?.disc ? leader : people.find((p) => p.disc?.natural);
  const hasAssessmentData = !!personWithData?.disc;

  // Generate insight
  const insight = personWithData ? generateFirstInsight(personWithData) : null;

  // Team summary
  const teamSummary = getTeamSummary(people, leaderId);

  const goNext = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTransitioning(false);
    }, 250);
  }, []);

  const goBack = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => Math.max(1, s - 1));
      setTransitioning(false);
    }, 250);
  }, []);

  return (
    <div
      style={{
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: C.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 250ms ease-out, transform 250ms ease-out",
        }}
      >
        {/* Back button (steps 2-5) */}
        {step >= 2 && step <= 5 && (
          <button
            onClick={goBack}
            style={{
              background: "none",
              border: "none",
              color: C.muted,
              fontSize: 14,
              cursor: "pointer",
              padding: "4px 0",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 16 }}>&larr;</span> Back
          </button>
        )}

        {/* Steps */}
        {step === 1 && <StepRecognition firstName={firstName} onNext={goNext} />}
        {step === 2 && <StepEndowedProgress hasData={hasAssessmentData} onNext={goNext} />}
        {step === 3 && <StepFirstInsight insight={insight} onNext={goNext} />}
        {step === 4 && (
          <StepMicroCommitment
            selectedGoal={selectedGoal}
            setSelectedGoal={setSelectedGoal}
            onNext={goNext}
          />
        )}
        {step === 5 && <StepTeamReveal teamSummary={teamSummary} onNext={goNext} />}
        {step === 6 && <StepClose onComplete={() => onComplete(selectedGoal)} />}

        {/* Skip link (steps 3-5) */}
        {step >= 3 && step <= 5 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={goNext}
              style={{
                background: "none",
                border: "none",
                color: C.muted,
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
                padding: 4,
              }}
            >
              Skip this step
            </button>
          </div>
        )}

        {/* Step indicator dots (steps 1-6) */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: s === step ? C.blue : s < step ? C.blue : C.border,
                opacity: s < step ? 0.4 : 1,
                transition: "all 300ms ease-out",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
