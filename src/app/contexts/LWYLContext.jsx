'use client';

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, signIn, signUp, signOut, resetPassword, getSession, onAuthStateChange } from "../../lib/supabase";
import { initOrgs, initPeople } from "../constants/data";

const LWYLContext = createContext(null);

export function useLWYL() {
  const ctx = useContext(LWYLContext);
  if (!ctx) throw new Error("useLWYL must be used within LWYLProvider");
  return ctx;
}

export function LWYLProvider({ children }) {
  // Auth
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);

  // Data
  const [orgs, setOrgs] = useState(initOrgs);
  const [people, setPeople] = useState(initPeople);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Selection
  const [selOrgId, setSelOrgId] = useState("org1");
  const [selTeamId, setSelTeamId] = useState(null);
  const [leaderId, setLeaderId] = useState(null);
  const [photos, setPhotos] = useState({});

  // Assessment panel
  const [showAssessment, setShowAssessment] = useState(false);

  // Onboarding
  const [onboardingDone, setOnboardingDone] = useState(null);

  // Derived
  const org = orgs.find(o => o.id === selOrgId);
  const orgPeople = people.filter(p => p.orgId === selOrgId);
  const teamPeople = selTeamId ? orgPeople.filter(p => p.teamId === selTeamId) : orgPeople;

  const onUploadPhoto = (personId, dataUrl) => setPhotos(prev => ({ ...prev, [personId]: dataUrl }));

  // ── Auth ──────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSession();
        if (session?.user) setUser(session.user);
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) setUser(session.user);
      else if (event === 'SIGNED_OUT') setUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try { await signOut(); setUser(null); }
    catch (err) { console.error('Logout failed:', err); }
  };

  // ── Data Loading ──────────────────────────────────────
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    async function loadData() {
      try {
        const { data: dbOrgs, error: orgsError } = await supabase.from('organizations').select('*').order('created_at');
        const { data: dbTeams, error: teamsError } = await supabase.from('teams').select('*').order('created_at');
        const { data: dbPeople, error: peopleError } = await supabase.from('people').select('*').order('created_at');

        if (orgsError || teamsError || peopleError) {
          console.error('Error loading data:', orgsError || teamsError || peopleError);
          setIsLoading(false);
          return;
        }

        if (dbOrgs && dbOrgs.length > 0) {
          const transformedOrgs = dbOrgs.map(org => ({
            id: org.id,
            name: org.name,
            assessmentUrl: org.assessment_url || "",
            teams: dbTeams.filter(t => t.org_id === org.id).map(t => ({ id: t.id, name: t.name }))
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
          setOrgs(transformedOrgs);
          setPeople(transformedPeople);
          if (transformedOrgs.length > 0) setSelOrgId(transformedOrgs[0].id);
        } else {
          await seedDataToSupabase();
        }
        setDataLoaded(true);
      } catch (err) {
        console.error('[LWYL] Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // ── Seed Data ─────────────────────────────────────────
  async function seedDataToSupabase() {
    try {
      const orgIdMap = {}, teamIdMap = {}, personIdMap = {};
      for (const org of initOrgs) {
        orgIdMap[org.id] = crypto.randomUUID();
        for (const team of org.teams) teamIdMap[team.id] = crypto.randomUUID();
      }
      for (const p of initPeople) personIdMap[p.id] = crypto.randomUUID();

      for (const org of initOrgs) {
        const newOrgId = orgIdMap[org.id];
        await supabase.from('organizations').insert({ id: newOrgId, name: org.name });
        for (const team of org.teams) {
          await supabase.from('teams').insert({ id: teamIdMap[team.id], org_id: newOrgId, name: team.name });
        }
      }
      for (const p of initPeople) {
        await supabase.from('people').insert({
          id: personIdMap[p.id], team_id: teamIdMap[p.teamId], name: p.name,
          role: p.role || null, is_leader: false,
          disc_natural: p.disc?.natural || null, disc_adapted: p.disc?.adaptive || null,
          values_data: p.values || null, attributes: p.attr || null,
        });
      }

      const newOrgs = initOrgs.map(org => ({ id: orgIdMap[org.id], name: org.name, assessmentUrl: "", teams: org.teams.map(t => ({ id: teamIdMap[t.id], name: t.name })) }));
      const newPeople = initPeople.map(p => ({ ...p, id: personIdMap[p.id], orgId: orgIdMap[p.orgId], teamId: teamIdMap[p.teamId] }));
      setOrgs(newOrgs);
      setPeople(newPeople);
      if (newOrgs.length > 0) setSelOrgId(newOrgs[0].id);
    } catch (err) {
      console.error('Failed to seed data:', err);
    }
  }

  // ── Onboarding ────────────────────────────────────────
  useEffect(() => {
    if (!user || !dataLoaded) return;
    async function checkOnboarding() {
      try {
        const { data, error } = await supabase.from('user_preferences').select('onboarding_completed').eq('user_id', user.id).maybeSingle();
        if (error) { setOnboardingDone(true); return; }
        setOnboardingDone(data?.onboarding_completed ?? false);
      } catch { setOnboardingDone(true); }
    }
    checkOnboarding();
  }, [user, dataLoaded]);

  const handleOnboardingComplete = async (selectedGoal) => {
    setOnboardingDone(true);
    try {
      await supabase.from('user_preferences').upsert({
        user_id: user.id, onboarding_completed: true,
        onboarding_goal: selectedGoal || null, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err) { console.error('[LWYL] Failed to save onboarding state:', err); }
  };

  // ── CRUD Operations ───────────────────────────────────
  const addOrg = async (name, assessmentUrl = "") => {
    const id = crypto.randomUUID();
    const newOrg = { id, name, assessmentUrl, teams: [] };
    setOrgs(prev => [...prev, newOrg]);
    setSelOrgId(id);
    await supabase.from('organizations').insert({ id, name, assessment_url: assessmentUrl || null });
    return id;
  };

  const updateOrg = async (orgId, updates) => {
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, ...updates } : o));
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.assessmentUrl !== undefined) dbUpdates.assessment_url = updates.assessmentUrl || null;
    await supabase.from('organizations').update(dbUpdates).eq('id', orgId);
  };

  const addTeam = async (name) => {
    const teamId = crypto.randomUUID();
    setOrgs(prev => prev.map(o => o.id === selOrgId ? { ...o, teams: [...o.teams, { id: teamId, name }] } : o));
    await supabase.from('teams').insert({ id: teamId, org_id: selOrgId, name });
    return teamId;
  };

  const updateTeam = async (teamId, name) => {
    setOrgs(prev => prev.map(o => o.id === selOrgId ? { ...o, teams: o.teams.map(t => t.id === teamId ? { ...t, name } : t) } : o));
    await supabase.from('teams').update({ name }).eq('id', teamId);
  };

  const deleteTeam = async (teamId) => {
    setOrgs(prev => prev.map(o => o.id === selOrgId ? { ...o, teams: o.teams.filter(t => t.id !== teamId) } : o));
    setPeople(prev => prev.filter(p => p.teamId !== teamId));
    if (selTeamId === teamId) setSelTeamId(null);
    await supabase.from('teams').delete().eq('id', teamId);
  };

  const addPerson = async (p, { bulk = false } = {}) => {
    setPeople(prev => [...prev, p]);
    await supabase.from('people').insert({
      id: p.id, team_id: p.teamId, name: p.name, role: p.role || null, is_leader: false,
      disc_natural: p.disc?.natural || null, disc_adapted: p.disc?.adaptive || null,
      values_data: p.values || null, attributes: p.attr || null,
    });
    return p.id;
  };

  const addPendingPerson = async (name) => {
    const teamId = selTeamId || (org?.teams[0]?.id || null);
    if (!teamId) return null;
    const personId = crypto.randomUUID();
    const newPerson = { id: personId, name, orgId: selOrgId, teamId, status: "pending", disc: null, values: null, attr: null };
    setPeople(prev => [...prev, newPerson]);
    await supabase.from('people').insert({ id: personId, team_id: teamId, name, is_leader: false });
    return personId;
  };

  const deletePerson = async (personId) => {
    setPeople(prev => prev.filter(p => p.id !== personId));
    await supabase.from('people').delete().eq('id', personId);
  };

  // ── Assessment ────────────────────────────────────────
  const openAssessment = () => { if (org?.assessmentUrl) setShowAssessment(true); };
  const closeAssessment = () => setShowAssessment(false);

  const copyAssessmentLink = () => {
    if (!org?.assessmentUrl) return;
    navigator.clipboard.writeText(org.assessmentUrl);
  };

  // ── Context Value ─────────────────────────────────────
  const value = {
    // Auth
    authChecking, user, handleLogout,
    // Data
    orgs, people, isLoading, dataLoaded, org, orgPeople, teamPeople,
    // Selection
    selOrgId, setSelOrgId, selTeamId, setSelTeamId, leaderId, setLeaderId,
    // Photos
    photos, onUploadPhoto,
    // Onboarding
    onboardingDone, handleOnboardingComplete,
    // CRUD
    addOrg, updateOrg, addTeam, updateTeam, deleteTeam, addPerson, addPendingPerson, deletePerson,
    // Assessment
    showAssessment, openAssessment, closeAssessment, copyAssessmentLink,
  };

  return <LWYLContext.Provider value={value}>{children}</LWYLContext.Provider>;
}
