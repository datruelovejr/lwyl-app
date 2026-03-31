'use client';

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, signIn, signUp, signOut, resetPassword, getSession, onAuthStateChange } from "../../lib/supabase";
import { z } from 'zod';
import { cache } from "../../lib/cache";

// Validation schemas for context-level writes
const orgInsertSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).trim(),
  assessment_url: z.string().url().max(2048).nullish().or(z.literal('')).transform(v => v || null),
});

const orgUpdateSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  assessment_url: z.string().url().max(2048).nullish().or(z.literal('')).transform(v => v || null).optional(),
});

const teamInsertSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string().min(1).max(255).trim(),
});

const teamUpdateSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});

const personInsertSchema = z.object({
  id: z.string().uuid(),
  team_id: z.string().uuid(),
  name: z.string().min(1).max(255).trim(),
  role: z.string().max(255).nullish().transform(v => v || null),
  is_leader: z.boolean().default(false),
  disc_natural: z.any().nullish().transform(v => v || null),
  disc_adapted: z.any().nullish().transform(v => v || null),
  values_data: z.any().nullish().transform(v => v || null),
  attributes: z.any().nullish().transform(v => v || null),
});

const userPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  onboarding_completed: z.boolean().optional(),
  onboarding_goal: z.string().max(500).nullish().transform(v => v || null),
  updated_at: z.string().optional(),
});

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
  const [orgs, setOrgs] = useState([]);
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Selection
  const [selOrgId, setSelOrgId] = useState("org1");
  const [selTeamId, setSelTeamId] = useState(null);
  const [leaderId, setLeaderId] = useState(null);
  const [photos, setPhotos] = useState({});

  // Assessment panel
  const [showAssessment, setShowAssessment] = useState(false);

  // Agreements (persisted to localStorage)
  const [agreements, setAgreements] = useState([]);

  // Hydrate agreements from localStorage on mount
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' && localStorage.getItem('lwyl_agreements');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setAgreements(parsed);
      }
    } catch {}
  }, []);

  // Save agreement with persistence
  const saveAgreement = useCallback((agreement) => {
    setAgreements(prev => {
      const updated = [agreement, ...prev];
      try { localStorage.setItem('lwyl_agreements', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // Update agreement (for check-in updates)
  const updateAgreement = useCallback((id, updates) => {
    setAgreements(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...updates } : a);
      try { localStorage.setItem('lwyl_agreements', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // Delete agreement
  const deleteAgreement = useCallback((id) => {
    setAgreements(prev => {
      const updated = prev.filter(a => a.id !== id);
      try { localStorage.setItem('lwyl_agreements', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // View mode (admin vs member)
  const [viewMode, setViewMode] = useState("admin");

  // Hydrate viewMode from localStorage on mount
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' && localStorage.getItem('lwyl_viewMode');
      if (stored === 'member' || stored === 'admin') setViewMode(stored);
    } catch {}
  }, []);

  // Hydrate leaderId from localStorage when org changes (per-org leader storage)
  useEffect(() => {
    if (!selOrgId) return;
    try {
      const stored = typeof window !== 'undefined' && localStorage.getItem(`lwyl_leaderId_${selOrgId}`);
      setLeaderId(stored || null);
    } catch {
      setLeaderId(null);
    }
  }, [selOrgId]);

  // Persist leaderId to localStorage (per-org)
  const setLeaderIdPersistent = useCallback((id) => {
    setLeaderId(id);
    if (!selOrgId) return;
    try {
      if (id) {
        localStorage.setItem(`lwyl_leaderId_${selOrgId}`, id);
      } else {
        localStorage.removeItem(`lwyl_leaderId_${selOrgId}`);
      }
    } catch {}
  }, [selOrgId]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const next = prev === 'admin' ? 'member' : 'admin';
      try { localStorage.setItem('lwyl_viewMode', next); } catch {}
      return next;
    });
  }, []);

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
        console.error('Auth check failed');
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
    try { await signOut(); cache.clearAll(); setUser(null); }
    catch (err) { console.error('Logout failed'); }
  };

  // ── Data Loading (stale-while-revalidate) ─────────────────
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    // Clear cache if it belongs to a different user
    const cachedUserId = cache.get('user_id');
    if (cachedUserId && cachedUserId.data !== user.id) {
      cache.clearAll();
    }
    cache.set('user_id', user.id);

    async function loadData() {
      // (a) Serve from cache immediately if available
      const cachedOrgs = cache.get('orgs');
      const cachedPeople = cache.get('people');
      let servedFromCache = false;

      if (cachedOrgs?.data && cachedPeople?.data) {
        setOrgs(cachedOrgs.data);
        setPeople(cachedPeople.data);
        if (cachedOrgs.data.length > 0) setSelOrgId(cachedOrgs.data[0].id);
        setIsLoading(false);
        setDataLoaded(true);
        servedFromCache = true;
      }

      // (b) Fetch fresh data from Supabase regardless
      try {
        // Step 1: Load orgs (RLS will scope to user's orgs)
        const { data: dbOrgs, error: orgsError } = await supabase
          .from('organizations').select('*').order('created_at');

        if (orgsError) {
          console.error('Error loading orgs');
          if (!servedFromCache) setIsLoading(false);
          return;
        }

        if (dbOrgs && dbOrgs.length > 0) {
          // Step 2: Load teams filtered by org IDs (server-side)
          const orgIds = dbOrgs.map(o => o.id);
          const { data: dbTeams, error: teamsError } = await supabase
            .from('teams').select('*').in('org_id', orgIds).order('created_at');

          if (teamsError) {
            console.error('Error loading teams');
            if (!servedFromCache) setIsLoading(false);
            return;
          }

          // Step 3: Load people filtered by team IDs (server-side)
          const teamIds = (dbTeams || []).map(t => t.id);
          let dbPeople = [];
          if (teamIds.length > 0) {
            const { data: peopleData, error: peopleError } = await supabase
              .from('people').select('*').in('team_id', teamIds).order('created_at');

            if (peopleError) {
              console.error('Error loading people');
              if (!servedFromCache) setIsLoading(false);
              return;
            }
            dbPeople = peopleData || [];
          }

          // Build a team-to-org lookup from server-filtered teams
          const teamOrgMap = {};
          for (const t of (dbTeams || [])) {
            teamOrgMap[t.id] = t.org_id;
          }

          const transformedOrgs = dbOrgs.map(org => ({
            id: org.id,
            name: org.name,
            assessmentUrl: org.assessment_url || "",
            teams: (dbTeams || []).filter(t => t.org_id === org.id).map(t => ({ id: t.id, name: t.name }))
          }));
          const transformedPeople = dbPeople.map(p => ({
            id: p.id,
            name: p.name,
            orgId: teamOrgMap[p.team_id] || null,
            teamId: p.team_id,
            role: p.role,
            isLeader: p.is_leader,
            status: p.disc_natural ? undefined : "pending",
            disc: p.disc_natural ? { natural: p.disc_natural, adaptive: p.disc_adapted } : null,
            values: p.values_data,
            attr: p.attributes,
            photoUrl: p.photo_url
          }));

          // (c) Update state with fresh data
          setOrgs(transformedOrgs);
          setPeople(transformedPeople);
          if (transformedOrgs.length > 0) setSelOrgId(transformedOrgs[0].id);

          // (d) Update cache with fresh transformed data
          cache.set('orgs', transformedOrgs);
          cache.set('people', transformedPeople);
        } else if (!servedFromCache) {
          // New clients see empty state - no demo data
          setOrgs([]);
          setPeople([]);
        }
        setDataLoaded(true);
      } catch (err) {
        console.error('[LWYL] Failed to load data');
        // (e) If fetch failed but we already served cached data, keep it visible
        if (!servedFromCache) {
          // (f) No cache and fetch failed -- error state
          console.error('[LWYL] No cached data available, load failed');
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

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
      const validated = userPreferencesSchema.parse({
        user_id: user.id, onboarding_completed: true,
        onboarding_goal: selectedGoal || null, updated_at: new Date().toISOString(),
      });
      await supabase.from('user_preferences').upsert(validated, { onConflict: 'user_id' });
    } catch (err) { console.error('[LWYL] Failed to save onboarding state'); }
  };

  // ── CRUD Operations (validated) ────────────────────────
  const addOrg = async (name, assessmentUrl = "") => {
    const id = crypto.randomUUID();
    const validated = orgInsertSchema.parse({ id, name, assessment_url: assessmentUrl || null });
    const newOrg = { id: validated.id, name: validated.name, assessmentUrl: assessmentUrl || "", teams: [] };
    setOrgs(prev => [...prev, newOrg]);
    setSelOrgId(validated.id);
    await supabase.from('organizations').insert(validated);
    // Link the creating user as owner so RLS grants access
    await supabase.from('user_organizations').insert({
      user_id: user.id,
      organization_id: validated.id,
      role: 'owner',
    });
    return validated.id;
  };

  const updateOrg = async (orgId, updates) => {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.assessmentUrl !== undefined) dbUpdates.assessment_url = updates.assessmentUrl || null;
    const validated = orgUpdateSchema.parse(dbUpdates);
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, ...updates } : o));
    await supabase.from('organizations').update(validated).eq('id', orgId);
  };

  const addTeam = async (name) => {
    const teamId = crypto.randomUUID();
    const validated = teamInsertSchema.parse({ id: teamId, org_id: selOrgId, name });
    setOrgs(prev => prev.map(o => o.id === selOrgId ? { ...o, teams: [...o.teams, { id: validated.id, name: validated.name }] } : o));
    await supabase.from('teams').insert(validated);
    return validated.id;
  };

  const updateTeam = async (teamId, name) => {
    const validated = teamUpdateSchema.parse({ name });
    setOrgs(prev => prev.map(o => o.id === selOrgId ? { ...o, teams: o.teams.map(t => t.id === teamId ? { ...t, name: validated.name } : t) } : o));
    await supabase.from('teams').update(validated).eq('id', teamId);
  };

  const deleteTeam = async (teamId) => {
    setOrgs(prev => prev.map(o => o.id === selOrgId ? { ...o, teams: o.teams.filter(t => t.id !== teamId) } : o));
    setPeople(prev => prev.filter(p => p.teamId !== teamId));
    if (selTeamId === teamId) setSelTeamId(null);
    await supabase.from('teams').delete().eq('id', teamId);
  };

  const addPerson = async (p, { bulk = false } = {}) => {
    try {
      const validated = personInsertSchema.parse({
        id: p.id, team_id: p.teamId, name: p.name, role: p.role || null, is_leader: false,
        disc_natural: p.disc?.natural || null, disc_adapted: p.disc?.adaptive || null,
        values_data: p.values || null, attributes: p.attr || null,
      });

      // Add to local state first
      setPeople(prev => [...prev, p]);

      // Also update the cache immediately so profile page can find the person
      const currentCachedPeople = cache.get('people')?.data || [];
      cache.set('people', [...currentCachedPeople, p]);

      // Then persist to Supabase
      const { error } = await supabase.from('people').insert(validated);
      if (error) {
        console.error('[LWYL] Failed to save person to database:', error.message);
        // Rollback local state on DB error
        setPeople(prev => prev.filter(person => person.id !== p.id));
        throw error;
      }

      return p.id;
    } catch (err) {
      console.error('[LWYL] addPerson failed:', err);
      throw err;
    }
  };

  const addPendingPerson = async (name) => {
    const teamId = selTeamId || (org?.teams[0]?.id || null);
    if (!teamId) return null;
    const personId = crypto.randomUUID();
    const validated = personInsertSchema.parse({ id: personId, team_id: teamId, name, is_leader: false });
    const newPerson = { id: personId, name: validated.name, orgId: selOrgId, teamId, status: "pending", disc: null, values: null, attr: null };
    setPeople(prev => [...prev, newPerson]);
    await supabase.from('people').insert(validated);
    return personId;
  };

  const deletePerson = async (personId) => {
    setPeople(prev => prev.filter(p => p.id !== personId));
    await supabase.from('people').delete().eq('id', personId);
  };

  const updatePerson = async (personId, updates) => {
    // Build the Supabase update payload
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role || null;
    if (updates.disc !== undefined) {
      dbUpdates.disc_natural = updates.disc?.natural || null;
      dbUpdates.disc_adapted = updates.disc?.adaptive || null;
    }
    if (updates.values !== undefined) dbUpdates.values_data = updates.values || null;
    if (updates.attr !== undefined) dbUpdates.attributes = updates.attr || null;

    // Update local state immediately
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      const updated = { ...p, ...updates };
      // Remove pending status if assessment data is being added
      if (updates.disc) delete updated.status;
      return updated;
    }));

    // Persist to Supabase
    await supabase.from('people').update(dbUpdates).eq('id', personId);
    return personId;
  };

  // ── Assessment ────────────────────────────────────────
  const openAssessment = () => { if (org?.assessmentUrl) setShowAssessment(true); };
  const closeAssessment = () => setShowAssessment(false);

  const copyAssessmentLink = () => {
    if (!org?.assessmentUrl) return;
    navigator.clipboard.writeText(org.assessmentUrl);
  };

  // ── Context Value ─────────────────────────────────────
  const safeUser = user ? { id: user.id, email: user.email } : null;

  const value = {
    // Auth
    authChecking, user: safeUser, handleLogout,
    // Data
    orgs, people, isLoading, dataLoaded, org, orgPeople, teamPeople,
    // Selection
    selOrgId, setSelOrgId, selTeamId, setSelTeamId, leaderId, setLeaderId: setLeaderIdPersistent,
    // Photos
    photos, onUploadPhoto,
    // Onboarding
    onboardingDone, handleOnboardingComplete,
    // CRUD
    addOrg, updateOrg, addTeam, updateTeam, deleteTeam, addPerson, addPendingPerson, updatePerson, deletePerson,
    // Assessment
    showAssessment, openAssessment, closeAssessment, copyAssessmentLink,
    // View mode
    viewMode, toggleViewMode,
    // Agreements
    agreements, saveAgreement, updateAgreement, deleteAgreement,
  };

  return <LWYLContext.Provider value={value}>{children}</LWYLContext.Provider>;
}
