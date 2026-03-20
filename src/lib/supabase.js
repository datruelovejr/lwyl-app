import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { withReadRetry, withWriteRetry, withAuthRetry } from './retry';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ VALIDATION SCHEMAS ============
const organizationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255).trim(),
  assessment_url: z.string().url().max(2048).nullish().or(z.literal('')).transform(v => v || null),
});

const organizationUpdateSchema = organizationSchema.partial().omit({ id: true });

const teamSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
  name: z.string().min(1).max(255).trim(),
});

const teamUpdateSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});

const personSchema = z.object({
  id: z.string().uuid().optional(),
  team_id: z.string().uuid(),
  name: z.string().min(1).max(255).trim(),
  role: z.string().max(255).nullish().transform(v => v || null),
  is_leader: z.boolean().default(false),
  disc_natural: z.string().max(50).nullish().transform(v => v || null),
  disc_adapted: z.string().max(50).nullish().transform(v => v || null),
  values_data: z.any().nullish().transform(v => v || null),
  attributes: z.any().nullish().transform(v => v || null),
  photo_url: z.string().url().max(2048).nullish().or(z.literal('')).transform(v => v || null),
});

const personUpdateSchema = personSchema.partial().omit({ id: true });

const reflectionSchema = z.object({
  leader_id: z.string().uuid(),
  content: z.string().min(1).max(10000).trim().optional(),
  title: z.string().max(500).trim().optional(),
  mood: z.string().max(100).optional(),
  tags: z.array(z.string().max(100)).optional(),
}).passthrough();

const reflectionUpdateSchema = reflectionSchema.partial().omit({ leader_id: true }).passthrough();

const userPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  onboarding_completed: z.boolean().optional(),
  onboarding_goal: z.string().max(500).nullish().transform(v => v || null),
  updated_at: z.string().optional(),
});

// ============ AUTHENTICATION ============
export async function signUp(email, password, fullName) {
  return withAuthRetry(async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    return data;
  }, 'Unable to create your account. Please check your connection and try again.');
}

export async function signIn(email, password) {
  return withAuthRetry(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, 'Unable to sign in. Please check your credentials and try again.');
}

export async function signOut() {
  return withAuthRetry(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, 'Unable to sign out. Please try again.');
}

export async function resetPassword(email) {
  return withAuthRetry(async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  }, 'Unable to send password reset email. Please try again.');
}

export async function updatePassword(newPassword) {
  return withAuthRetry(async () => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  }, 'Unable to update your password. Please try again.');
}

export async function getSession() {
  return withAuthRetry(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }, 'Unable to verify your session. Please refresh the page.');
}

export async function getUser() {
  return withAuthRetry(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }, 'Unable to load your profile. Please refresh the page.');
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ============ ORGANIZATIONS ============
export async function getOrganizations() {
  return withReadRetry(async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }, 'Unable to load organizations. Please check your connection.');
}

export async function createOrganization(name) {
  const validated = organizationSchema.parse({ name });
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('organizations')
      .insert([validated])
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to create the organization. Please try again.');
}

export async function updateOrganization(id, name) {
  const validated = organizationUpdateSchema.parse({ name });
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('organizations')
      .update(validated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to update the organization. Please try again.');
}

export async function deleteOrganization(id) {
  return withWriteRetry(async () => {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, 'Unable to delete the organization. Please try again.');
}

// ============ TEAMS ============
export async function getTeams(orgId = null) {
  return withReadRetry(async () => {
    let query = supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: true });
    if (orgId) query = query.eq('org_id', orgId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }, 'Unable to load teams. Please check your connection.');
}

export async function getTeamsByOrgIds(orgIds) {
  if (!orgIds || orgIds.length === 0) return [];
  return withReadRetry(async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .in('org_id', orgIds)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }, 'Unable to load teams. Please check your connection.');
}

export async function createTeam(orgId, name) {
  const validated = teamSchema.parse({ org_id: orgId, name });
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('teams')
      .insert([validated])
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to create the team. Please try again.');
}

export async function updateTeam(id, name) {
  const validated = teamUpdateSchema.parse({ name });
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('teams')
      .update(validated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to update the team. Please try again.');
}

export async function deleteTeam(id) {
  return withWriteRetry(async () => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, 'Unable to delete the team. Please try again.');
}

// ============ PEOPLE ============
export async function getPeople(teamId = null) {
  return withReadRetry(async () => {
    let query = supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: true });
    if (teamId) query = query.eq('team_id', teamId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }, 'Unable to load people. Please check your connection.');
}

export async function getPeopleByTeamIds(teamIds) {
  if (!teamIds || teamIds.length === 0) return [];
  return withReadRetry(async () => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .in('team_id', teamIds)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }, 'Unable to load people. Please check your connection.');
}

export async function createPerson(teamId, personData) {
  const validated = personSchema.parse({ team_id: teamId, ...personData });
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('people')
      .insert([validated])
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to add person. Please try again.');
}

export async function updatePerson(id, personData) {
  const validated = personUpdateSchema.parse(personData);
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('people')
      .update(validated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to update person. Please try again.');
}

export async function deletePerson(id) {
  return withWriteRetry(async () => {
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, 'Unable to remove person. Please try again.');
}

// ============ FULL DATA LOAD ============
export async function loadAllData() {
  // Step 1: Load orgs (RLS will scope to user's orgs)
  const orgs = await withReadRetry(async () => {
    const orgsResult = await supabase.from('organizations').select('*').order('created_at');
    if (orgsResult.error) throw orgsResult.error;
    return orgsResult.data || [];
  }, 'Unable to load your organizations. Please check your connection.');

  const orgIds = orgs.map(o => o.id);

  // Step 2: Load teams filtered by org IDs (server-side)
  let teams = [];
  if (orgIds.length > 0) {
    teams = await withReadRetry(async () => {
      const teamsResult = await supabase
        .from('teams')
        .select('*')
        .in('org_id', orgIds)
        .order('created_at');
      if (teamsResult.error) throw teamsResult.error;
      return teamsResult.data || [];
    }, 'Unable to load teams. Please check your connection.');
  }

  // Step 3: Load people filtered by team IDs (server-side)
  const teamIds = teams.map(t => t.id);
  let people = [];
  if (teamIds.length > 0) {
    people = await withReadRetry(async () => {
      const peopleResult = await supabase
        .from('people')
        .select('*')
        .in('team_id', teamIds)
        .order('created_at');
      if (peopleResult.error) throw peopleResult.error;
      return peopleResult.data || [];
    }, 'Unable to load people. Please check your connection.');
  }

  return {
    organizations: orgs,
    teams,
    people,
  };
}

// ============ LEADER REFLECTIONS / JOURNALING ============
export async function getReflections(leaderId = null) {
  return withReadRetry(async () => {
    let query = supabase
      .from('reflections')
      .select('*')
      .order('created_at', { ascending: false });
    if (leaderId) query = query.eq('leader_id', leaderId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }, 'Unable to load reflections. Please check your connection.');
}

export async function createReflection(reflection) {
  const validated = reflectionSchema.parse(reflection);
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('reflections')
      .insert([validated])
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to save your reflection. Please try again.');
}

export async function updateReflection(id, updates) {
  const validated = reflectionUpdateSchema.parse(updates);
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('reflections')
      .update(validated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to update your reflection. Please try again.');
}

export async function deleteReflection(id) {
  return withWriteRetry(async () => {
    const { error } = await supabase
      .from('reflections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, 'Unable to delete the reflection. Please try again.');
}

// ============ USER PREFERENCES ============
export async function upsertUserPreferences(prefs) {
  const validated = userPreferencesSchema.parse(prefs);
  return withWriteRetry(async () => {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(validated, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'Unable to save your preferences. Please try again.');
}

// ============ SEED INITIAL DATA ============
export async function seedInitialData(organizations, teams, people) {
  // Insert organizations
  for (const org of organizations) {
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', org.id)
      .single();

    if (!existingOrg) {
      const validated = organizationSchema.parse({ id: org.id, name: org.name });
      await withWriteRetry(async () => {
        const { error } = await supabase.from('organizations').insert([validated]);
        if (error) throw error;
      }, 'Unable to set up initial data. Please refresh the page.');
    }
  }

  // Insert teams
  for (const team of teams) {
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('id', team.id)
      .single();

    if (!existingTeam) {
      const validated = teamSchema.parse({ id: team.id, org_id: team.orgId, name: team.name });
      await withWriteRetry(async () => {
        const { error } = await supabase.from('teams').insert([validated]);
        if (error) throw error;
      }, 'Unable to set up initial data. Please refresh the page.');
    }
  }

  // Insert people
  for (const person of people) {
    const { data: existingPerson } = await supabase
      .from('people')
      .select('id')
      .eq('id', person.id)
      .single();

    if (!existingPerson) {
      const validated = personSchema.parse({
        id: person.id,
        team_id: person.teamId,
        name: person.name,
        role: person.role || null,
        is_leader: person.isLeader || false,
        disc_natural: person.disc?.natural || null,
        disc_adapted: person.disc?.adapted || null,
        values_data: person.values || null,
        attributes: person.attributes || null,
        photo_url: person.photoUrl || null,
      });
      await withWriteRetry(async () => {
        const { error } = await supabase.from('people').insert([validated]);
        if (error) throw error;
      }, 'Unable to set up initial data. Please refresh the page.');
    }
  }
}
