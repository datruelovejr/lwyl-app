'use client';

import { useState, useEffect } from "react";
import { supabase, signIn, signUp, signOut, resetPassword, getSession, onAuthStateChange } from "../lib/supabase";

import { C } from "./constants/colors";
import { initOrgs, initPeople, getDom } from "./constants/data";
import { useIsMobile } from "./utils/useIsMobile";

import { Btn } from "./components/Btn";
import { PhotoAvatar } from "./components/PhotoAvatar";
import { UploadForm } from "./components/UploadForm";
import { TeamInsights } from "./components/TeamInsights";
import { Viewer } from "./components/Viewer";
import { AuditDashboard } from "./components/AuditDashboard";
import { LoginPage } from "./components/LoginPage";
import { WelcomeSequence } from "./components/WelcomeSequence";

export default function BTCGSystem() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth states
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [orgs, setOrgs] = useState(initOrgs);
  const [people, setPeople] = useState(initPeople);
  const [selOrgId, setSelOrgId] = useState("org1");
  const [selTeamId, setSelTeamId] = useState(null);
  const [selPersonId, setSelPersonId] = useState("p1");
  const [view, setView] = useState("viewer");
  const [search, setSearch] = useState("");
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newName, setNewName] = useState("");
  const [leaderId, setLeaderId] = useState(null);
  const [hoveredPersonId, setHoveredPersonId] = useState(null);
  const [photos, setPhotos] = useState({});
  const onUploadPhoto = (personId, dataUrl) => setPhotos(prev => ({ ...prev, [personId]: dataUrl }));
  const [showAddPending, setShowAddPending] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [agreements, setAgreements] = useState([]);
  const [mode, setMode] = useState("team"); // "team" | "individual"
  const [onboardingDone, setOnboardingDone] = useState(null); // null = checking, false = show, true = skip
  const [viewerInitialTab, setViewerInitialTab] = useState("profile");
  const [viewerShowTips, setViewerShowTips] = useState(false);
  const [viewerShowCompare, setViewerShowCompare] = useState(false);

  // Data persistence states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // CRUD modal states
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [showDeleteTeam, setShowDeleteTeam] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(null);
  const [showDeletePerson, setShowDeletePerson] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState(null);
  const [hoveredTeamId, setHoveredTeamId] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    async function loadData() {
      try {
        console.log('[LWYL] Loading data from Supabase...');

        const { data: dbOrgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at');

        const { data: dbTeams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at');

        const { data: dbPeople, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .order('created_at');

        console.log('[LWYL] Query results:', {
          orgs: dbOrgs?.length || 0,
          teams: dbTeams?.length || 0,
          people: dbPeople?.length || 0,
          orgsError,
          teamsError,
          peopleError
        });

        if (orgsError || teamsError || peopleError) {
          console.error('Error loading data:', orgsError || teamsError || peopleError);
          alert(`Database error: ${(orgsError || teamsError || peopleError)?.message}`);
          setIsLoading(false);
          return;
        }

        // If we have data in the database, use it
        if (dbOrgs && dbOrgs.length > 0) {
          // Transform database format to app format
          const transformedOrgs = dbOrgs.map(org => ({
            id: org.id,
            name: org.name,
            teams: dbTeams
              .filter(t => t.org_id === org.id)
              .map(t => ({ id: t.id, name: t.name }))
          }));

          const transformedPeople = dbPeople.map(p => ({
            id: p.id,
            name: p.name,
            orgId: dbTeams.find(t => t.id === p.team_id)?.org_id || null,
            teamId: p.team_id,
            role: p.role,
            isLeader: p.is_leader,
            status: p.disc_natural ? undefined : "pending",
            disc: p.disc_natural ? { natural: p.disc_natural, adaptive: p.disc_adapted } : null,
            values: p.values_data,
            attr: p.attributes,
            photoUrl: p.photo_url
          }));

          console.log('[LWYL] Setting state with:', {
            orgs: transformedOrgs.length,
            people: transformedPeople.length
          });
          setOrgs(transformedOrgs);
          setPeople(transformedPeople);
          if (transformedOrgs.length > 0) setSelOrgId(transformedOrgs[0].id);
          if (transformedPeople.length > 0) setSelPersonId(transformedPeople[0].id);
        } else {
          console.log('[LWYL] No orgs found, seeding initial data...');
          // Seed initial data to database
          await seedDataToSupabase();
        }
        setDataLoaded(true);
      } catch (err) {
        console.error('[LWYL] Failed to load data:', err);
        alert(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Seed initial mock data to Supabase
  async function seedDataToSupabase() {
    try {
      // Create ID mappings (old string IDs to new UUIDs)
      const orgIdMap = {};
      const teamIdMap = {};
      const personIdMap = {};

      // Generate new UUIDs for all entities
      for (const org of initOrgs) {
        orgIdMap[org.id] = crypto.randomUUID();
        for (const team of org.teams) {
          teamIdMap[team.id] = crypto.randomUUID();
        }
      }
      for (const p of initPeople) {
        personIdMap[p.id] = crypto.randomUUID();
      }

      // Insert organizations with new UUIDs
      for (const org of initOrgs) {
        const newOrgId = orgIdMap[org.id];
        const { error: orgError } = await supabase.from('organizations').insert({ id: newOrgId, name: org.name });
        if (orgError) console.error('Org insert error:', orgError);

        // Insert teams with new UUIDs
        for (const team of org.teams) {
          const newTeamId = teamIdMap[team.id];
          const { error: teamError } = await supabase.from('teams').insert({ id: newTeamId, org_id: newOrgId, name: team.name });
          if (teamError) console.error('Team insert error:', teamError);
        }
      }

      // Insert people with new UUIDs
      for (const p of initPeople) {
        const newPersonId = personIdMap[p.id];
        const newTeamId = teamIdMap[p.teamId];
        const { error: personError } = await supabase.from('people').insert({
          id: newPersonId,
          team_id: newTeamId,
          name: p.name,
          role: p.role || null,
          is_leader: false,
          disc_natural: p.disc?.natural || null,
          disc_adapted: p.disc?.adaptive || null,
          values_data: p.values || null,
          attributes: p.attr || null,
        });
        if (personError) console.error('Person insert error:', personError);
      }

      // Update local state with new UUIDs
      const newOrgs = initOrgs.map(org => ({
        id: orgIdMap[org.id],
        name: org.name,
        teams: org.teams.map(t => ({ id: teamIdMap[t.id], name: t.name }))
      }));

      const newPeople = initPeople.map(p => ({
        ...p,
        id: personIdMap[p.id],
        orgId: orgIdMap[p.orgId],
        teamId: teamIdMap[p.teamId]
      }));

      setOrgs(newOrgs);
      setPeople(newPeople);
      if (newOrgs.length > 0) setSelOrgId(newOrgs[0].id);
      if (newPeople.length > 0) setSelPersonId(newPeople[0].id);

    } catch (err) {
      console.error('Failed to seed data:', err);
    }
  }

  // Check onboarding status once data is loaded
  useEffect(() => {
    if (!user || !dataLoaded) return;
    async function checkOnboarding() {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) {
          console.error('[LWYL] Onboarding check error:', error);
          setOnboardingDone(true); // fail open -- show dashboard
          return;
        }
        setOnboardingDone(data?.onboarding_completed ?? false);
      } catch (err) {
        console.error('[LWYL] Onboarding check failed:', err);
        setOnboardingDone(true);
      }
    }
    checkOnboarding();
  }, [user, dataLoaded]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (selectedGoal) => {
    setOnboardingDone(true);
    try {
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        onboarding_completed: true,
        onboarding_goal: selectedGoal || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.error('[LWYL] Failed to save onboarding state:', err);
    }
  };

  const org = orgs.find(o => o.id === selOrgId);
  const orgPeople = people.filter(p => p.orgId === selOrgId);
  const teamPeople = selTeamId ? orgPeople.filter(p => p.teamId === selTeamId) : orgPeople;
  const filtered = teamPeople.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const selPerson = people.find(p => p.id === selPersonId);

  const addOrg = async () => {
    if (!newName.trim()) return;
    const id = crypto.randomUUID();
    const newOrg = { id, name: newName.trim(), teams: [] };
    setOrgs([...orgs, newOrg]);
    setSelOrgId(id); setNewName(""); setShowNewOrg(false);
    const { error } = await supabase.from('organizations').insert({ id, name: newName.trim() });
    if (error) {
      console.error('Failed to save organization to database:', error);
      alert(`Failed to save organization to database: ${error.message}`);
    }
  };

  const addTeam = async () => {
    if (!newName.trim()) return;
    const teamId = crypto.randomUUID();
    setOrgs(orgs.map(o => o.id === selOrgId ? { ...o, teams: [...o.teams, { id: teamId, name: newName.trim() }] } : o));
    setNewName(""); setShowNewTeam(false);
    const { error } = await supabase.from('teams').insert({ id: teamId, org_id: selOrgId, name: newName.trim() });
    if (error) {
      console.error('Failed to save team to database:', error);
      alert(`Failed to save team to database: ${error.message}`);
    }
  };

  const addPerson = async (p, { bulk = false } = {}) => {
    setPeople(prev => [...prev, p]);
    if (!bulk) {
      setSelPersonId(p.id);
      setView("viewer");
    }
    const { error } = await supabase.from('people').insert({
      id: p.id,
      team_id: p.teamId,
      name: p.name,
      role: p.role || null,
      is_leader: false,
      disc_natural: p.disc?.natural || null,
      disc_adapted: p.disc?.adaptive || null,
      values_data: p.values || null,
      attributes: p.attr || null,
    });
    if (error) {
      console.error('Failed to save person to database:', error);
      alert(`Failed to save ${p.name} to database: ${error.message}`);
    }
  };

  const addPendingPerson = async () => {
    if (!pendingName.trim()) return;
    const teamId = selTeamId || (org?.teams[0]?.id || "t1");
    const nm = pendingName.trim();
    const personId = crypto.randomUUID();
    const newPerson = { id: personId, name: nm, orgId: selOrgId, teamId, status: "pending", disc: null, values: null, attr: null };
    setPeople([...people, newPerson]);
    setPendingName(""); setShowAddPending(false);
    const { error } = await supabase.from('people').insert({
      id: personId,
      team_id: teamId,
      name: nm,
      is_leader: false,
    });
    if (error) {
      console.error('Failed to save person to database:', error);
      alert(`Failed to save ${nm} to database: ${error.message}`);
    }
  };

  // Edit Team Name
  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setShowEditTeam(true);
  };

  const saveEditTeam = async () => {
    if (!editTeamName.trim() || !editingTeam) return;
    setOrgs(orgs.map(o => o.id === selOrgId ? {
      ...o,
      teams: o.teams.map(t => t.id === editingTeam.id ? { ...t, name: editTeamName.trim() } : t)
    } : o));
    setShowEditTeam(false);
    setEditingTeam(null);
    setEditTeamName("");
    await supabase.from('teams').update({ name: editTeamName.trim() }).eq('id', editingTeam.id);
  };

  // Delete Team
  const handleDeleteTeam = (team) => {
    setDeletingTeam(team);
    setShowDeleteTeam(true);
  };

  const confirmDeleteTeam = async () => {
    if (!deletingTeam) return;
    setOrgs(orgs.map(o => o.id === selOrgId ? {
      ...o,
      teams: o.teams.filter(t => t.id !== deletingTeam.id)
    } : o));
    setPeople(people.filter(p => p.teamId !== deletingTeam.id));
    if (selTeamId === deletingTeam.id) setSelTeamId(null);
    setShowDeleteTeam(false);
    setDeletingTeam(null);
    await supabase.from('teams').delete().eq('id', deletingTeam.id);
  };

  // Delete Person
  const handleDeletePerson = (person) => {
    setDeletingPerson(person);
    setShowDeletePerson(true);
  };

  const confirmDeletePerson = async () => {
    if (!deletingPerson) return;
    setPeople(people.filter(p => p.id !== deletingPerson.id));
    if (selPersonId === deletingPerson.id) {
      const remaining = people.filter(p => p.id !== deletingPerson.id);
      setSelPersonId(remaining.length > 0 ? remaining[0].id : null);
    }
    setShowDeletePerson(false);
    setDeletingPerson(null);
    await supabase.from('people').delete().eq('id', deletingPerson.id);
  };

  const domColor = (p) => { if (!p.disc) return C.border; const dom = getDom(p.disc.natural); return dom.includes("D") ? C.disc.D : dom.includes("I") ? C.disc.I : dom.includes("S") ? C.disc.S : C.disc.C; };

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.text, marginBottom: 8 }}>Loading...</div>
          <div style={{ fontSize: 14, color: C.muted }}>Connecting to database</div>
        </div>
      </div>
    );
  }

  // Show auth checking state
  if (authChecking) {
    return (
      <div style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.text, marginBottom: 8 }}>Loading...</div>
          <div style={{ fontSize: 14, color: C.muted }}>Checking authentication</div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) return <LoginPage onLogin={() => {}} />;

  // Show onboarding welcome sequence for new users
  if (onboardingDone === false) {
    return (
      <WelcomeSequence
        user={user}
        people={people}
        leaderId={leaderId}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <div style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>

      {/* TOP BAR */}
      <nav style={{ background: "#1A1A18", color: "#fff", height: "48px", padding: isMobile ? "0 12px" : "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "#C8A96E", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1 }} aria-label="Toggle sidebar">
              {sidebarOpen ? "✕" : "☰"}
            </button>
          )}
          <div style={{ fontWeight: 700, fontSize: 13, color: "#C8A96E", letterSpacing: "0.5px", textTransform: "uppercase" }}>{isMobile ? "BTCG" : "BTCG · Bridging the Connection Gap"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
          {!isMobile && <span style={{ fontSize: 13, color: "#9CA3AF" }}>{user?.user_metadata?.full_name || user?.email}</span>}
          <button onClick={handleLogout} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #4B5563", background: "transparent", color: "#9CA3AF", fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#9CA3AF"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#4B5563"; e.currentTarget.style.color = "#9CA3AF"; }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* New Org Modal */}
      {showNewOrg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: isMobile ? "calc(100% - 32px)" : 360, maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>New Organization</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Organization name..." style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 16, background: "#FFFFFF", boxSizing: "border-box", marginBottom: 16 }} autoFocus />
            <div style={{ display: "flex", gap: 8 }}><Btn primary onClick={addOrg}>Create</Btn><Btn onClick={() => { setShowNewOrg(false); setNewName(""); }}>Cancel</Btn></div>
          </div>
        </div>
      )}

      {/* New Team Modal */}
      {showNewTeam && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: isMobile ? "calc(100% - 32px)" : 360, maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>New Team in {org?.name}</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Team name..." style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 16, background: "#FFFFFF", boxSizing: "border-box", marginBottom: 16 }} autoFocus />
            <div style={{ display: "flex", gap: 8 }}><Btn primary onClick={addTeam}>Create</Btn><Btn onClick={() => { setShowNewTeam(false); setNewName(""); }}>Cancel</Btn></div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeam && editingTeam && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: isMobile ? "calc(100% - 32px)" : 360, maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Edit Team Name</h3>
            <input value={editTeamName} onChange={e => setEditTeamName(e.target.value)} placeholder="Team name..." style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 16, background: "#FFFFFF", boxSizing: "border-box", marginBottom: 16 }} autoFocus onKeyDown={e => { if (e.key === "Enter") saveEditTeam(); }} />
            <div style={{ display: "flex", gap: 8 }}><Btn primary onClick={saveEditTeam}>Save</Btn><Btn onClick={() => { setShowEditTeam(false); setEditingTeam(null); setEditTeamName(""); }}>Cancel</Btn></div>
          </div>
        </div>
      )}

      {/* Delete Team Modal */}
      {showDeleteTeam && deletingTeam && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: isMobile ? "calc(100% - 32px)" : 400, maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#C62828" }}>Delete Team</h3>
            <p style={{ margin: "0 0 8px", fontSize: 14, color: C.text }}>Are you sure you want to delete <strong>{deletingTeam.name}</strong>?</p>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: C.muted }}>This will also remove all {people.filter(p => p.teamId === deletingTeam.id).length} team members. This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn style={{ background: "#C62828", border: "none" }} primary onClick={confirmDeleteTeam}>Delete Team</Btn>
              <Btn onClick={() => { setShowDeleteTeam(false); setDeletingTeam(null); }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Delete Person Modal */}
      {showDeletePerson && deletingPerson && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: isMobile ? "calc(100% - 32px)" : 400, maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#C62828" }}>Remove Team Member</h3>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: C.text }}>Are you sure you want to remove <strong>{deletingPerson.name}</strong> from the team? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn style={{ background: "#C62828", border: "none" }} primary onClick={confirmDeletePerson}>Remove</Btn>
              <Btn onClick={() => { setShowDeletePerson(false); setDeletingPerson(null); }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, top: 48, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      <div style={{ display: "flex", minHeight: "calc(100vh - 48px)" }}>

        {/* SIDEBAR */}
        <div style={{
          width: isMobile ? 280 : 260, flexShrink: 0, background: "#FFFFFF", borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)", overflow: "hidden",
          ...(isMobile ? { position: "fixed", top: 48, left: 0, bottom: 0, zIndex: 50, boxShadow: "4px 0 24px rgba(0,0,0,0.15)", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease-out" } : {})
        }}>

          {/* Title */}
          <div style={{ padding: "20px 16px 12px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2, marginBottom: 16 }}>Love Where You Lead</div>

            {/* Mode Toggle */}
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 3, marginBottom: 16 }}>
              {[["team", "Team Mode"], ["individual", "Individual Mode"]].map(([m, label]) => (
                <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px 4px", background: mode === m ? C.blue : "transparent", color: mode === m ? "#fff" : C.blue, border: mode === m ? "none" : "none", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 8, transition: "all 0.15s ease-out", outline: "none" }}>{label}</button>
              ))}
            </div>

            {/* Org Selection */}
            {mode === "team" && (<>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }}>Organization selection</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <select value={selOrgId} onChange={e => { setSelOrgId(e.target.value); setSelTeamId(null); }} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.text, fontSize: 13, fontWeight: 500, outline: "none" }}>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name.length > 10 ? o.name.slice(0, 10) + "..." : o.name}</option>)}
                </select>
                <button onClick={() => setShowNewTeam(true)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.blue}`, background: "#fff", color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add Team</button>
              </div>

              {/* Team Filter Pills - scrollable container */}
              <div style={{ maxHeight: 140, overflowY: "auto", marginBottom: 16, padding: "2px 0" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button onClick={() => { setSelTeamId(null); setSelPersonId(null); setView("teamInsights"); if (isMobile) setSidebarOpen(false); }} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${view === "teamInsights" && !selTeamId ? C.blue : C.border}`, background: view === "teamInsights" && !selTeamId ? C.blue : "#fff", color: view === "teamInsights" && !selTeamId ? "#fff" : C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                    All ({orgPeople.length})
                  </button>
                  {org?.teams.map(t => {
                    const count = orgPeople.filter(p => p.teamId === t.id).length;
                    const active = view === "teamInsights" && selTeamId === t.id;
                    const isHovered = hoveredTeamId === t.id;
                    return (
                      <div key={t.id} style={{ position: "relative", display: "inline-flex" }}
                        onMouseEnter={() => setHoveredTeamId(t.id)}
                        onMouseLeave={() => setHoveredTeamId(null)}>
                        <button onClick={() => { setSelTeamId(t.id); setSelPersonId(null); setView("teamInsights"); if (isMobile) setSidebarOpen(false); }} style={{ padding: "6px 14px", paddingRight: isHovered ? 50 : 14, borderRadius: 20, border: `1.5px solid ${active ? C.blue : C.border}`, background: active ? C.blue : "#fff", color: active ? "#fff" : C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                          {t.name} ({count})
                        </button>
                        {isHovered && (
                          <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 2 }}>
                            <button onClick={(e) => { e.stopPropagation(); handleEditTeam(t); }} title="Edit team name" style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "rgba(0,0,0,0.1)", color: C.text, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t); }} title="Delete team" style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "rgba(198,40,40,0.15)", color: "#C62828", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🗑️</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>)}

            {/* Upload Assessment Button */}
            <button onClick={() => { setView("upload"); if (isMobile) setSidebarOpen(false); }} style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: C.blue, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12, transition: "opacity 0.15s" }}>
              + Upload Assessment
            </button>

            {/* Search Bar */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14, pointerEvents: "none" }}>🔍</span>
              <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "9px 10px 9px 32px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* People List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 16px" }}>
            {filtered.map(p => {
              const isPending = p.status === "pending";
              const isLeader = p.id === leaderId;
              const isHovered = hoveredPersonId === p.id;
              const isSelected = selPersonId === p.id && view === "viewer";
              return (
                <div key={p.id} style={{ position: "relative", marginBottom: 4 }}
                  onMouseEnter={() => setHoveredPersonId(p.id)}
                  onMouseLeave={() => setHoveredPersonId(null)}>
                  <button onClick={() => { if (!isPending) { setSelPersonId(p.id); setView("viewer"); if (isMobile) setSidebarOpen(false); } }} style={{
                    width: "100%", textAlign: "left", padding: "10px 12px", background: isSelected ? "rgba(41, 182, 246, 0.1)" : C.card,
                    border: `1.5px solid ${isLeader ? "#FFC107" : isSelected ? "#29B6F6" : C.border}`,
                    borderRadius: 9, cursor: isPending ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
                    opacity: isPending ? 0.6 : 1
                  }}>
                    {isPending ? (
                      <div style={{ width: 34, height: 34, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, background: "#E0E0E0", border: `2px dashed ${C.border}` }}>⏳</div>
                    ) : (
                      <PhotoAvatar personId={p.id} name={p.name} bgColor={domColor(p)} photo={photos[p.id]} onUpload={onUploadPhoto} size={34} square={true} />
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {isLeader && <span style={{ color: "#FFC107", marginRight: 4 }}>★</span>}
                        {p.name}
                      </div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                        {isPending ? "Assessment pending" : (
                          <div style={{ display: "flex", gap: 2 }}>
                            {Object.entries(p.disc.natural).map(([d, v]) => (
                              <span key={d} style={{ padding: "0 4px", borderRadius: 3, fontWeight: 600, background: v >= 60 ? `${C.disc[d]}18` : "transparent", color: v >= 60 ? C.disc[d] : C.muted, fontSize: 9 }}>{d}:{v}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  {/* Star and Delete buttons */}
                  {(isHovered || isLeader) && (
                    <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4, alignItems: "center" }}>
                      {!isPending && (
                        <button onClick={(e) => { e.stopPropagation(); setLeaderId(isLeader ? null : p.id); }}
                          title={isLeader ? "Remove as leader" : "Set as leader"}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 2, color: isLeader ? "#FFC107" : "#ccc", transition: "color 0.15s" }}>
                          {isLeader ? "★" : "☆"}
                        </button>
                      )}
                      {isHovered && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePerson(p); }}
                          title="Remove team member"
                          style={{ background: "rgba(198,40,40,0.1)", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, lineHeight: 1, padding: 4, color: "#C62828", transition: "all 0.15s" }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, fontSize: 11, color: C.muted }}>{search ? "No matches found" : "No people in this team yet"}</div>}

            {/* Add Expected Member */}
            {showAddPending ? (
              <div style={{ padding: "8px 4px" }}>
                <input value={pendingName} onChange={e => setPendingName(e.target.value)} placeholder="Member name..." autoFocus
                  onKeyDown={e => { if (e.key === "Enter") addPendingPerson(); if (e.key === "Escape") { setShowAddPending(false); setPendingName(""); } }}
                  style={{ width: "100%", padding: "6px 9px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, boxSizing: "border-box", marginBottom: 5 }} />
                <div style={{ display: "flex", gap: 5 }}>
                  <Btn small primary onClick={addPendingPerson}>Add</Btn>
                  <Btn small onClick={() => { setShowAddPending(false); setPendingName(""); }}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddPending(true)} style={{ width: "100%", padding: "10px 0", background: "none", border: `2px dashed ${C.blue}`, borderRadius: 8, color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                + Add Expected Member
              </button>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: isMobile ? "12px 12px" : "16px 24px", overflowY: "auto", maxHeight: "calc(100vh - 48px)" }}>
          {mode === "individual" ? (
            <AuditDashboard person={selPerson} />
          ) : view === "upload" ? (
            <UploadForm orgs={orgs} selOrgId={selOrgId} selTeamId={selTeamId} onAdd={addPerson} onCancel={() => setView(selPerson ? "viewer" : "teamInsights")} />
          ) : view === "teamInsights" ? (
            <TeamInsights
              people={people}
              teamId={selTeamId}
              orgId={selOrgId}
              leaderId={leaderId}
              userId={user?.id}
              photos={photos}
              onUploadPhoto={onUploadPhoto}
              onViewProfile={(personId) => { setSelPersonId(personId); setViewerInitialTab("profile"); setViewerShowTips(false); setViewerShowCompare(false); setView("viewer"); }}
              onCompare={(personId) => { setSelPersonId(personId); setViewerInitialTab("profile"); setViewerShowTips(false); setViewerShowCompare(true); setView("viewer"); }}
              onShowTips={(personId) => { setSelPersonId(personId); setViewerInitialTab("profile"); setViewerShowTips(true); setViewerShowCompare(false); setView("viewer"); }}
            />
          ) : selPerson ? (
            <Viewer person={selPerson} leader={people.find(p => p.id === leaderId) || null} agreements={agreements} setAgreements={setAgreements} photos={photos} onUploadPhoto={onUploadPhoto} initialTab={viewerInitialTab} initialShowTips={viewerShowTips} initialShowCompare={viewerShowCompare} onClearShowTips={() => setViewerShowTips(false)} onClearShowCompare={() => setViewerShowCompare(false)} team={teamPeople.filter(p => p.status !== "pending")} />
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select a person to view their assessment</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>or click a team to see Team Insights</div>
            </div>
          )}
          {view === "viewer" && <div style={{ textAlign: "center", padding: "8px 0 20px", fontSize: 9, color: C.muted }}>© Bridging the Connection Gap · Dr. Daniel Truelove Jr.</div>}
        </div>
      </div>
    </div>
  );
}
