-- ============================================================================
-- LWYL Security Hardening Migration
-- ============================================================================
-- This migration:
--   1. Creates a user_organizations junction table (user <-> org membership)
--   2. Creates the reflections table (leader journaling feature)
--   3. Adds FK from user_preferences.user_id to auth.users(id)
--   4. Creates helper functions for org membership/admin checks
--   5. Drops ALL old permissive "allow all" RLS policies
--   6. Replaces them with auth.uid()-scoped policies via user_organizations
--
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS throughout).
-- Run AFTER: supabase-schema.sql, supabase-migration-user-prefs.sql,
--            supabase-migration-assessment-url.sql
-- ============================================================================


-- ============================================================================
-- 1. USER_ORGANIZATIONS JUNCTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_id ON user_organizations(organization_id);


-- ============================================================================
-- 2. REFLECTIONS TABLE
-- ============================================================================
-- Columns derived from VoiceJournal.jsx: id, leader_id, person_id, content, created_at

CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reflections_leader_id ON reflections(leader_id);


-- ============================================================================
-- 3. ADD FK ON user_preferences.user_id -> auth.users(id)
-- ============================================================================
-- Wrapped in a DO block so it's safe to re-run.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_preferences_user_id_fkey'
      AND table_name = 'user_preferences'
  ) THEN
    ALTER TABLE user_preferences
      ADD CONSTRAINT user_preferences_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;


-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid() AND organization_id = org_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid() AND organization_id = org_id AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_is_org_owner(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid() AND organization_id = org_id AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- 5. DROP OLD PERMISSIVE POLICIES
-- ============================================================================
-- Policy names come from supabase-schema.sql and supabase-migration-user-prefs.sql

DROP POLICY IF EXISTS "Allow all operations on organizations" ON organizations;
DROP POLICY IF EXISTS "Allow all operations on teams" ON teams;
DROP POLICY IF EXISTS "Allow all operations on people" ON people;
DROP POLICY IF EXISTS "Allow all operations on user_preferences" ON user_preferences;


-- ============================================================================
-- 6. NEW RLS POLICIES — ORGANIZATIONS
-- ============================================================================

-- SELECT: user can see orgs they belong to
CREATE POLICY "org_select_member"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid() AND organization_id = organizations.id
    )
  );

-- INSERT: any authenticated user can create an org (they must then add themselves as owner)
CREATE POLICY "org_insert_authenticated"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: only owner or admin
CREATE POLICY "org_update_admin"
  ON organizations FOR UPDATE
  USING (user_is_org_admin(id));

-- DELETE: only owner
CREATE POLICY "org_delete_owner"
  ON organizations FOR DELETE
  USING (user_is_org_owner(id));


-- ============================================================================
-- 6b. NEW RLS POLICIES — USER_ORGANIZATIONS
-- ============================================================================

-- SELECT: user can see their own memberships
CREATE POLICY "user_org_select_own"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: owner/admin can add members to their org, OR user is creating their own ownership row
CREATE POLICY "user_org_insert"
  ON user_organizations FOR INSERT
  WITH CHECK (
    -- Admin/owner of the org can add anyone
    user_is_org_admin(organization_id)
    OR
    -- User is creating their own ownership row (for new org creation flow)
    (user_id = auth.uid() AND role = 'owner')
  );

-- UPDATE: only owner/admin can change roles
CREATE POLICY "user_org_update_admin"
  ON user_organizations FOR UPDATE
  USING (user_is_org_admin(organization_id));

-- DELETE: owner can remove members, users can remove themselves
CREATE POLICY "user_org_delete"
  ON user_organizations FOR DELETE
  USING (
    user_is_org_owner(organization_id)
    OR user_id = auth.uid()
  );


-- ============================================================================
-- 6c. NEW RLS POLICIES — TEAMS
-- ============================================================================

-- SELECT: user can see teams in their orgs
CREATE POLICY "team_select_member"
  ON teams FOR SELECT
  USING (user_belongs_to_org(org_id));

-- INSERT: owner/admin of the org
CREATE POLICY "team_insert_admin"
  ON teams FOR INSERT
  WITH CHECK (user_is_org_admin(org_id));

-- UPDATE: owner/admin of the org
CREATE POLICY "team_update_admin"
  ON teams FOR UPDATE
  USING (user_is_org_admin(org_id));

-- DELETE: owner/admin of the org
CREATE POLICY "team_delete_admin"
  ON teams FOR DELETE
  USING (user_is_org_admin(org_id));


-- ============================================================================
-- 6d. NEW RLS POLICIES — PEOPLE
-- ============================================================================

-- SELECT: user can see people in teams that belong to their orgs
CREATE POLICY "people_select_member"
  ON people FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = people.team_id
        AND user_belongs_to_org(teams.org_id)
    )
  );

-- INSERT: owner/admin of the org that owns the team
CREATE POLICY "people_insert_admin"
  ON people FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = people.team_id
        AND user_is_org_admin(teams.org_id)
    )
  );

-- UPDATE: owner/admin of the org that owns the team
CREATE POLICY "people_update_admin"
  ON people FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = people.team_id
        AND user_is_org_admin(teams.org_id)
    )
  );

-- DELETE: owner/admin of the org that owns the team
CREATE POLICY "people_delete_admin"
  ON people FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = people.team_id
        AND user_is_org_admin(teams.org_id)
    )
  );


-- ============================================================================
-- 6e. NEW RLS POLICIES — REFLECTIONS
-- ============================================================================

-- SELECT: user can see reflections for people in their orgs
CREATE POLICY "reflections_select_member"
  ON reflections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM people
      JOIN teams ON teams.id = people.team_id
      WHERE people.id = reflections.leader_id
        AND user_belongs_to_org(teams.org_id)
    )
  );

-- INSERT: user can create reflections for people in their orgs
CREATE POLICY "reflections_insert_member"
  ON reflections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM people
      JOIN teams ON teams.id = people.team_id
      WHERE people.id = reflections.leader_id
        AND user_belongs_to_org(teams.org_id)
    )
  );

-- UPDATE: user can update reflections for people in their orgs
CREATE POLICY "reflections_update_member"
  ON reflections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM people
      JOIN teams ON teams.id = people.team_id
      WHERE people.id = reflections.leader_id
        AND user_belongs_to_org(teams.org_id)
    )
  );

-- DELETE: user can delete reflections for people in their orgs
CREATE POLICY "reflections_delete_member"
  ON reflections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM people
      JOIN teams ON teams.id = people.team_id
      WHERE people.id = reflections.leader_id
        AND user_belongs_to_org(teams.org_id)
    )
  );


-- ============================================================================
-- 6f. NEW RLS POLICIES — USER_PREFERENCES
-- ============================================================================

-- All operations: only the user's own row
CREATE POLICY "user_prefs_select_own"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_prefs_insert_own"
  ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_prefs_update_own"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "user_prefs_delete_own"
  ON user_preferences FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================================
-- DONE
-- ============================================================================
-- After running this migration, the app code needs to:
--   1. After creating an organization, INSERT into user_organizations
--      with role='owner' for the creating user.
--   2. Use the Supabase auth session (auth.uid()) for all queries —
--      the anon key + RLS now enforces row-level access.
-- ============================================================================
