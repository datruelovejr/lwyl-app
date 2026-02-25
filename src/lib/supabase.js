import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ AUTHENTICATION ============
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ============ ORGANIZATIONS ============
export async function getOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createOrganization(name) {
  const { data, error } = await supabase
    .from('organizations')
    .insert([{ name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrganization(id, name) {
  const { data, error } = await supabase
    .from('organizations')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOrganization(id) {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ TEAMS ============
export async function getTeams(orgId = null) {
  let query = supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: true });
  if (orgId) query = query.eq('org_id', orgId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createTeam(orgId, name) {
  const { data, error } = await supabase
    .from('teams')
    .insert([{ org_id: orgId, name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeam(id, name) {
  const { data, error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id) {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ PEOPLE ============
export async function getPeople(teamId = null) {
  let query = supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: true });
  if (teamId) query = query.eq('team_id', teamId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createPerson(teamId, personData) {
  const { data, error } = await supabase
    .from('people')
    .insert([{ team_id: teamId, ...personData }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePerson(id, personData) {
  const { data, error } = await supabase
    .from('people')
    .update(personData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePerson(id) {
  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ FULL DATA LOAD ============
export async function loadAllData() {
  const [orgsResult, teamsResult, peopleResult] = await Promise.all([
    supabase.from('organizations').select('*').order('created_at'),
    supabase.from('teams').select('*').order('created_at'),
    supabase.from('people').select('*').order('created_at'),
  ]);

  if (orgsResult.error) throw orgsResult.error;
  if (teamsResult.error) throw teamsResult.error;
  if (peopleResult.error) throw peopleResult.error;

  return {
    organizations: orgsResult.data,
    teams: teamsResult.data,
    people: peopleResult.data,
  };
}

// ============ LEADER REFLECTIONS / JOURNALING ============
export async function getReflections(leaderId = null) {
  let query = supabase
    .from('reflections')
    .select('*')
    .order('created_at', { ascending: false });
  if (leaderId) query = query.eq('leader_id', leaderId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createReflection(reflection) {
  const { data, error } = await supabase
    .from('reflections')
    .insert([reflection])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReflection(id, updates) {
  const { data, error } = await supabase
    .from('reflections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReflection(id) {
  const { error } = await supabase
    .from('reflections')
    .delete()
    .eq('id', id);
  if (error) throw error;
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
      await supabase.from('organizations').insert([{ id: org.id, name: org.name }]);
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
      await supabase.from('teams').insert([{ id: team.id, org_id: team.orgId, name: team.name }]);
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
      await supabase.from('people').insert([{
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
      }]);
    }
  }
}
