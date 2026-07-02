'use client';

import { LWYLProvider, useLWYL } from "../contexts/LWYLContext";
import { LoginPage } from "../components/LoginPage";
import { WelcomeSequence } from "../components/WelcomeSequence";
import { SetupWizard, getHasCompletedSetup, setSetupComplete } from "../components/SetupWizard";
import { AssessmentPanel } from "../components/AssessmentPanel";
import ConnectionStatus from "../components/ConnectionStatus";
import { LoadingMoment } from "../components/ui/LoadingMoment";
import { useIsMobile } from "../utils/useIsMobile";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDominantDisc } from "../constants/data";

export default function AppLayout({ children }) {
  return (
    <LWYLProvider>
      <ConnectionStatus />
      <AppShell>{children}</AppShell>
    </LWYLProvider>
  );
}

function AppShell({ children }) {
  const {
    authChecking, user, isLoading, onboardingDone,
    handleOnboardingComplete, people, leaderId,
    showAssessment, org, closeAssessment,
    viewMode, toggleViewMode,
  } = useLWYL();
  const isMobile = useIsMobile();
  const currentPath = usePathname();

  // Setup wizard state (localStorage-driven, checked after auth resolves)
  const [setupChecked, setSetupChecked] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  useEffect(() => {
    if (!user) return;
    const completed = getHasCompletedSetup();
    setShowSetupWizard(!completed);
    setSetupChecked(true);
  }, [user]);

  if (authChecking || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingMoment message="Loading your leadership lens..." />
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={() => {}} />;

  if (setupChecked && showSetupWizard) {
    return (
      <SetupWizard
        onComplete={() => {
          setShowSetupWizard(false);
        }}
      />
    );
  }

  if (onboardingDone === false) {
    return <WelcomeSequence user={user} people={people} leaderId={leaderId} onComplete={handleOnboardingComplete} />;
  }

  const isConsultantView = currentPath === "/app";

  return (
    <div className="min-h-screen flex bg-background">
      {!isConsultantView && <LWYLSidebar isMobile={isMobile} />}
      <div className="flex-1 min-w-0 flex flex-col max-h-screen">
        <AnimatePresence>
          {viewMode === 'member' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-2.5 bg-card border-b border-border">
                <span className="text-xs font-semibold text-muted">
                  Viewing as team member -- switch back in Settings
                </span>
                <button
                  onClick={toggleViewMode}
                  className="text-xs font-semibold text-disc-c bg-transparent border-none cursor-pointer hover:underline"
                >
                  Switch to Admin
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
      {showAssessment && org?.assessmentUrl && (
        <AssessmentPanel assessmentUrl={org.assessmentUrl} orgName={org.name} onClose={closeAssessment} isMobile={isMobile} />
      )}
    </div>
  );
}

function LWYLSidebar({ isMobile }) {
  const { user, handleLogout, org, orgPeople, leaderId, viewMode } = useLWYL();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const domColor = (p) => {
    if (!p.disc) return 'var(--border-default)';
    const dom = getDominantDisc(p.disc.natural, p.disc.adaptive);
    const colors = { D: 'var(--disc-d)', I: 'var(--disc-i)', S: 'var(--disc-s)', C: 'var(--disc-c)' };
    // Handle hybrid (e.g., "S/C") with diagonal gradient
    if (dom.includes('/')) {
      const dims = dom.split('/');
      return `linear-gradient(135deg, ${colors[dims[0]]} 50%, ${colors[dims[1]]} 50%)`;
    }
    return colors[dom] || 'var(--disc-c)';
  };

  const navItems = [
    { label: "Dashboard", path: "/app/dashboard", icon: "📊" },
    { label: "The Method", path: "/app/method", icon: "🧭" },
    { label: "Leader Insights", path: "/app/leader", icon: "⭐" },
    { label: "Team Insights", path: "/app/team", icon: "👥" },
    { label: "Friction Map", path: "/app/friction", icon: "🔥" },
    { label: "Retention Risk", path: "/app/kri", icon: "🛡️" },
  ];

  const toolItems = [
    { label: "Bridge Wizard", path: "/app/bridge", icon: "⚡" },
    { label: "Agreements", path: "/app/agreements", icon: "🤝" },
  ];

  const assessmentItems = [
    { label: "Upload Assessment", path: "/app/upload", icon: "📤" },
  ];

  const NavButton = ({ item }) => {
    const isActive = pathname === item.path;
    return (
      <button
        onClick={() => router.push(item.path)}
        className={`w-full text-left px-3 py-2 rounded-lg border-none text-sm cursor-pointer flex items-center gap-2.5 transition-all duration-150 ${
          isActive ? 'bg-disc-c/10 text-disc-c font-semibold' : 'bg-transparent text-foreground font-medium hover:bg-subtle'
        }`}
      >
        <span className="text-base w-5 text-center">{item.icon}</span>
        {item.label}
      </button>
    );
  };

  if (isMobile && !sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-60 bg-nav border-none text-nav-accent text-xl cursor-pointer px-2.5 py-1.5 rounded-lg"
      >
        ☰
      </button>
    );
  }

  return (
    <>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} />
      )}

      <aside className={`w-[264px] shrink-0 bg-card border-r border-border flex flex-col max-h-screen overflow-hidden ${
        isMobile ? 'fixed top-0 left-0 bottom-0 z-50 shadow-2xl' : ''
      }`}>

        {/* Logo */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-nav text-white text-sm">
              ♥
            </div>
            <div>
              <div className="text-sm font-extrabold text-foreground leading-tight">Love Where</div>
              <div className="text-xs font-semibold text-disc-c leading-tight">You Lead</div>
            </div>
          </div>
        </div>

        {/* Back to all orgs */}
        <button
          onClick={() => router.push("/app")}
          className="w-full text-left px-4 py-2 border-none bg-transparent cursor-pointer text-xs font-semibold text-disc-c flex items-center gap-1.5 border-b border-border"
        >
          ← All Organizations
        </button>

        {/* Org Context */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">Organization</div>
              <div className="text-sm font-semibold text-foreground mt-0.5 max-w-[160px] truncate">
                {org?.name || "No organization"}
              </div>
            </div>
            {viewMode === 'admin' && (
              <button
                onClick={() => router.push("/app/settings")}
                title="Settings"
                className="p-1.5 rounded-md border border-border bg-card text-muted text-sm cursor-pointer shrink-0 hover:bg-subtle transition-colors"
              >
                ⚙️
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 pt-2 pb-1">Platform</div>
          {navItems.map(item => <NavButton key={item.path} item={item} />)}

          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 pt-4 pb-1">Tools</div>
          {toolItems.map(item => <NavButton key={item.path} item={item} />)}

          {viewMode === 'admin' && (
            <>
              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 pt-4 pb-1">Assessments</div>
              {assessmentItems.map(item => <NavButton key={item.path} item={item} />)}
            </>
          )}

          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 pt-4 pb-1">Team Members</div>
          {orgPeople.map(p => {
            const isPending = p.status === "pending";
            const isLeader = p.id === leaderId;
            const isActive = pathname === `/app/profile/${p.id}`;
            const initials = p.name.split(" ").map(n => n[0]).join("").slice(0, 2);
            const avatarColor = isPending ? 'var(--disc-gray)' : domColor(p);

            return (
              <button
                key={p.id}
                onClick={() => { if (!isPending) router.push(`/app/profile/${p.id}`); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg border-none flex items-center gap-2.5 transition-all duration-150 mb-0.5 ${
                  isActive ? 'bg-disc-c/10' : 'bg-transparent'
                } ${isPending ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: avatarColor }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm text-foreground truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {p.name}
                  </div>
                  {isLeader && <div className="text-[10px] text-disc-c">★ Leader</div>}
                  {isPending && <div className="text-[10px] text-muted">Pending</div>}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile + Sign Out */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-disc-c flex items-center justify-center text-white text-xs font-bold">
              {(user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{user?.user_metadata?.full_name || "Leader"}</div>
              <div className="text-xs text-muted truncate">{user?.email || ""}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg border-none bg-transparent text-friction-high text-sm font-medium cursor-pointer flex items-center gap-2 hover:bg-alert-critical-bg transition-colors">
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
