'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'lwyl_hasCompletedSetup';

export function getHasCompletedSetup() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setSetupComplete() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function resetSetupWizard() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Step animation wrapper ── */
const stepVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function StepWrapper({ children }) {
  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="onboarding-step"
    >
      {children}
    </motion.div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Getting started</span>
        <span className="text-xs font-medium text-muted">{current} of {total}</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="onboarding-progress-fill h-full rounded-full bg-nav"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Step 1: Welcome ── */
function StepWelcome({ onNext }) {
  return (
    <StepWrapper>
      <div className="mb-8">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
          Love Where You Lead
        </div>
        <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-4">
          Welcome. Let's get you oriented.
        </h1>
        <p className="text-base text-muted leading-relaxed mb-3">
          This is a leadership tool built for one purpose -- to help you see the people you lead more clearly. Not through spreadsheets or surveys, but through the behavioral data that actually explains how your team works together.
        </p>
        <p className="text-base text-muted leading-relaxed mb-3">
          You'll find DISC profiles, friction signals between team members, values that drive decision-making, and tools to bridge the gaps that cost your team energy every day.
        </p>
        <p className="text-base text-muted leading-relaxed">
          It takes about 60 seconds to walk through how everything works. Let's do that now.
        </p>
      </div>
      <button
        onClick={onNext}
        className="px-6 py-3 rounded-xl bg-nav text-white text-sm font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity"
      >
        Show me around
      </button>
    </StepWrapper>
  );
}

/* ── Step 2: Your Role ── */
function StepRole({ role, setRole, onNext }) {
  const roles = [
    {
      id: 'leader',
      label: 'I lead a team',
      description: 'You want to understand how your team works together, where friction lives, and how to lead each person differently.',
    },
    {
      id: 'member',
      label: 'I am a team member',
      description: 'You want to understand your own profile, how you show up at work, and how your style connects with others.',
    },
  ];

  return (
    <StepWrapper>
      <h2 className="text-2xl font-extrabold text-foreground leading-tight mb-2">
        How will you use this?
      </h2>
      <p className="text-base text-muted leading-relaxed mb-6">
        This shapes what you see first. You can always explore everything later.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`text-left p-5 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
              role === r.id
                ? 'border-nav bg-nav/5'
                : 'border-border bg-card hover:border-foreground/20'
            }`}
          >
            <div className={`text-sm font-bold mb-1 ${role === r.id ? 'text-foreground' : 'text-foreground'}`}>
              {r.label}
            </div>
            <div className="text-xs text-muted leading-relaxed">
              {r.description}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!role}
        className={`px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer border-none transition-opacity ${
          role
            ? 'bg-nav text-white hover:opacity-90'
            : 'bg-border text-muted cursor-default'
        }`}
      >
        {role ? 'Next' : 'Select your role to continue'}
      </button>
    </StepWrapper>
  );
}

/* ── Step 3: What You'll Find ── */
function StepScreenPreview({ role, onNext }) {
  const screens = [
    {
      icon: '📊',
      name: 'Dashboard',
      forLeader: 'Your command center. See which relationships carry the most friction and where your team needs you most.',
      forMember: 'A snapshot of your team dynamics -- who aligns naturally and where the tension points live.',
    },
    {
      icon: '🔥',
      name: 'Friction Map',
      forLeader: 'A visual map of every relationship on your team, scored and explained. No guessing, just data-backed signals.',
      forMember: 'See how your behavioral style interacts with each teammate -- and why some conversations feel harder than others.',
    },
    {
      icon: '⚡',
      name: 'Bridge Wizard',
      forLeader: 'Pick any two people and get a specific, actionable plan to reduce friction between them.',
      forMember: 'Understand the gap between you and a teammate and get real steps to close it.',
    },
  ];

  return (
    <StepWrapper>
      <h2 className="text-2xl font-extrabold text-foreground leading-tight mb-2">
        Here's what you'll find inside
      </h2>
      <p className="text-sm text-muted leading-relaxed mb-6">
        Three screens that do the heavy lifting.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {screens.map((s) => (
          <div
            key={s.name}
            className="bg-card rounded-xl border border-border p-4 flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-lg bg-subtle flex items-center justify-center text-lg shrink-0">
              {s.icon}
            </div>
            <div>
              <div className="text-sm font-bold text-foreground mb-1">{s.name}</div>
              <div className="text-xs text-muted leading-relaxed">
                {role === 'member' ? s.forMember : s.forLeader}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="px-6 py-3 rounded-xl bg-nav text-white text-sm font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity"
      >
        Got it -- what should I do first?
      </button>
    </StepWrapper>
  );
}

/* ── Step 4: Your First Step ── */
function StepFirstAction({ role, onComplete }) {
  const isLeader = role === 'leader';

  return (
    <StepWrapper>
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-extrabold text-foreground leading-tight mb-3">
          {isLeader
            ? 'Start with your Dashboard.'
            : 'Start with your Profile.'}
        </h2>
        <p className="text-base text-muted leading-relaxed mb-3">
          {isLeader
            ? 'Your Dashboard shows the relationships that need attention right now. The friction signals, the environment costs, and the specific pairs where your leadership makes the biggest difference.'
            : 'Your Profile shows how you naturally lead, how you adapt at work, and where that gap costs you energy. It is the foundation for every insight this tool gives you.'}
        </p>
        <p className="text-sm text-muted leading-relaxed mb-8">
          {isLeader
            ? 'From there, you can dive into any relationship, run the Bridge Wizard, or explore the Friction Map. Everything is one click away.'
            : 'Once you see your own data, explore the Friction Map to understand how your style connects with your teammates.'}
        </p>

        <button
          onClick={onComplete}
          className="px-8 py-3.5 rounded-xl bg-nav text-white text-base font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity"
        >
          Get Started
        </button>
      </div>
    </StepWrapper>
  );
}

/* ── Main SetupWizard ── */
export function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const router = useRouter();
  const totalSteps = 4;

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const handleComplete = useCallback(() => {
    setSetupComplete();
    // Store the selected role for potential later use
    if (role) {
      localStorage.setItem('lwyl_setupRole', role);
    }
    onComplete(role);
    // Navigate based on role
    if (role === 'member') {
      router.push('/app/dashboard');
    } else {
      router.push('/app/dashboard');
    }
  }, [role, onComplete, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <ProgressBar current={step} total={totalSteps} />

        {/* Back button */}
        {step > 1 && (
          <button
            onClick={goBack}
            className="bg-transparent border-none text-muted text-sm cursor-pointer flex items-center gap-1 mb-4 p-0 hover:text-foreground transition-colors"
          >
            <span>&larr;</span> Back
          </button>
        )}

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && <StepWelcome key="welcome" onNext={goNext} />}
          {step === 2 && <StepRole key="role" role={role} setRole={setRole} onNext={goNext} />}
          {step === 3 && <StepScreenPreview key="preview" role={role} onNext={goNext} />}
          {step === 4 && <StepFirstAction key="action" role={role} onComplete={handleComplete} />}
        </AnimatePresence>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-6 bg-nav'
                  : s < step
                    ? 'w-2 bg-nav opacity-40'
                    : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
