'use client';

import { LWYLProvider, useLWYL } from "../contexts/LWYLContext";
import { LoginPage } from "../components/LoginPage";
import { WelcomeSequence } from "../components/WelcomeSequence";
import { AssessmentPanel } from "../components/AssessmentPanel";
import { useIsMobile } from "../utils/useIsMobile";

export default function AppLayout({ children }) {
  return (
    <LWYLProvider>
      <AppShell>{children}</AppShell>
    </LWYLProvider>
  );
}

function AppShell({ children }) {
  const {
    authChecking, user, isLoading, onboardingDone,
    handleOnboardingComplete, people, leaderId,
    showAssessment, org, closeAssessment,
  } = useLWYL();
  const isMobile = useIsMobile();

  // Loading states
  if (authChecking || isLoading) {
    return (
      <div style={{ fontFamily: "Inter, -apple-system, sans-serif", background: "#F9FAFB", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, border: "3px solid #E5E7EB", borderTopColor: "#29B6F6", borderRadius: "50%", animation: "lwyl-spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>Loading your leadership lens...</p>
          <style>{`@keyframes lwyl-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!user) return <LoginPage onLogin={() => {}} />;

  // Onboarding
  if (onboardingDone === false) {
    return <WelcomeSequence user={user} people={people} leaderId={leaderId} onComplete={handleOnboardingComplete} />;
  }

  // Hide sidebar on consultant dashboard (/app)
  const { usePathname: getPath } = require("next/navigation");
  const currentPath = getPath();
  const isConsultantView = currentPath === "/app";

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", minHeight: "100vh", display: "flex", background: "#F9FAFB" }}>
      {!isConsultantView && <LWYLSidebar isMobile={isMobile} />}
      <main style={{ flex: 1, minWidth: 0, overflowY: "auto", maxHeight: "100vh" }}>
        {children}
      </main>

      {/* Assessment iFrame Panel */}
      {showAssessment && org?.assessmentUrl && (
        <AssessmentPanel assessmentUrl={org.assessmentUrl} orgName={org.name} onClose={closeAssessment} isMobile={isMobile} />
      )}
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────

function LWYLSidebar({ isMobile }) {
  const { user, handleLogout, org, orgPeople, leaderId } = useLWYL();

  const { useState: useLocalState } = require("react");
  const { usePathname, useRouter } = require("next/navigation");
  const { getDom } = require("../constants/data");
  const { C } = require("../constants/colors");

  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useLocalState(!isMobile);

  const domColor = (p) => {
    if (!p.disc) return C.border;
    const dom = getDom(p.disc.natural);
    return dom.includes("D") ? C.disc.D : dom.includes("I") ? C.disc.I : dom.includes("S") ? C.disc.S : C.disc.C;
  };

  const navItems = [
    { label: "Dashboard", path: "/app/dashboard", icon: "📊" },
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
        style={{
          width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none",
          background: isActive ? "rgba(41,182,246,0.1)" : "transparent",
          color: isActive ? "#29B6F6" : "#374151",
          fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
        }}
      >
        <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
        {item.label}
      </button>
    );
  };

  // Mobile toggle
  if (isMobile && !sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        style={{ position: "fixed", top: 12, left: 12, zIndex: 60, background: "#1A1A18", border: "none", color: "#C8A96E", fontSize: 22, cursor: "pointer", padding: "6px 10px", borderRadius: 8 }}
      >
        ☰
      </button>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 264, flexShrink: 0, background: "#fff", borderRight: "1px solid #F3F4F6",
        display: "flex", flexDirection: "column", maxHeight: "100vh", overflow: "hidden",
        ...(isMobile ? { position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, boxShadow: "4px 0 24px rgba(0,0,0,0.15)" } : {}),
      }}>

        {/* Logo */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #29B6F6, #0288D1)", color: "#fff", fontSize: 14 }}>
              ♥
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>Love Where</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#29B6F6", lineHeight: 1.1 }}>You Lead</div>
            </div>
          </div>
        </div>

        {/* Back to all orgs */}
        <button
          onClick={() => router.push("/app")}
          style={{ width: "100%", textAlign: "left", padding: "8px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#29B6F6", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #F3F4F6" }}>
          ← All Organizations
        </button>

        {/* Org Context — display only */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Organization</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 2, maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {org?.name || "No organization"}
              </div>
            </div>
            <button
              onClick={() => router.push("/app/settings")}
              title="Settings"
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #E5E7EB", background: "#fff", color: "#9CA3AF", fontSize: 13, cursor: "pointer", flexShrink: 0 }}
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
          {/* Platform */}
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px 12px 4px" }}>Platform</div>
          {navItems.map(item => <NavButton key={item.path} item={item} />)}

          {/* Tools */}
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", padding: "16px 12px 4px" }}>Tools</div>
          {toolItems.map(item => <NavButton key={item.path} item={item} />)}

          {/* Assessments */}
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", padding: "16px 12px 4px" }}>Assessments</div>
          {assessmentItems.map(item => <NavButton key={item.path} item={item} />)}

          {/* Team Members */}
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", padding: "16px 12px 4px" }}>
            Team Members
          </div>
          {orgPeople.map(p => {
            const isPending = p.status === "pending";
            const isLeader = p.id === leaderId;
            const isActive = pathname === `/app/profile/${p.id}`;
            const initials = p.name.split(" ").map(n => n[0]).join("").slice(0, 2);
            const avatarColor = isPending ? "#9E9E9E" : domColor(p);

            return (
              <button
                key={p.id}
                onClick={() => { if (!isPending) router.push(`/app/profile/${p.id}`); }}
                style={{
                  width: "100%", textAlign: "left", padding: "6px 12px", borderRadius: 8, border: "none",
                  background: isActive ? "rgba(41,182,246,0.1)" : "transparent",
                  cursor: isPending ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10,
                  opacity: isPending ? 0.5 : 1, transition: "all 0.15s", marginBottom: 2,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0, background: avatarColor }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </div>
                  {isLeader && <div style={{ fontSize: 10, color: "#29B6F6" }}>★ Leader</div>}
                  {isPending && <div style={{ fontSize: 10, color: "#9CA3AF" }}>Pending</div>}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile + Sign Out */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#29B6F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              {(user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.user_metadata?.full_name || "Leader"}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || ""}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#EF4444", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
