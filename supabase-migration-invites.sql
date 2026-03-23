-- ============================================================
-- LWYL Leader Invite System Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create invites table
-- ============================================================
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id)
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_org ON invites(organization_id);

-- 2. Add user_id to people table (links person profile to auth user)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE people ADD COLUMN user_id UUID REFERENCES auth.users(id);
    CREATE INDEX idx_people_user_id ON people(user_id);
  END IF;
END $$;

-- 3. RLS Policies for invites table
-- ============================================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
DROP POLICY IF EXISTS "invites_super_admin" ON invites;
CREATE POLICY "invites_super_admin" ON invites FOR ALL
USING (is_super_admin());

-- Org owners/admins can create invites for their orgs
DROP POLICY IF EXISTS "invites_create_by_org_admin" ON invites;
CREATE POLICY "invites_create_by_org_admin" ON invites FOR INSERT
WITH CHECK (
  is_super_admin() OR user_is_org_admin(organization_id)
);

-- Anyone can read an invite by token (for redemption)
DROP POLICY IF EXISTS "invites_read_by_token" ON invites;
CREATE POLICY "invites_read_by_token" ON invites FOR SELECT
USING (true);

-- Only the redeemer or super admin can update (mark as redeemed)
DROP POLICY IF EXISTS "invites_update_redeem" ON invites;
CREATE POLICY "invites_update_redeem" ON invites FOR UPDATE
USING (
  is_super_admin()
  OR (redeemed_at IS NULL AND redeemed_by IS NULL)
);

-- 4. Function to redeem an invite
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_invite(invite_token TEXT)
RETURNS JSON AS $$
DECLARE
  inv RECORD;
  result JSON;
BEGIN
  -- Find the invite
  SELECT * INTO inv FROM invites
  WHERE token = invite_token
    AND redeemed_at IS NULL
    AND expires_at > NOW();

  IF inv IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;

  -- Check email restriction if set
  IF inv.email IS NOT NULL AND inv.email != auth.email() THEN
    RETURN json_build_object('success', false, 'error', 'This invite is for a different email address');
  END IF;

  -- Link user to organization
  INSERT INTO user_organizations (user_id, organization_id, role)
  VALUES (auth.uid(), inv.organization_id, inv.role)
  ON CONFLICT (user_id, organization_id) DO UPDATE SET role = inv.role;

  -- If person_id specified, link the user to their profile
  IF inv.person_id IS NOT NULL THEN
    UPDATE people
    SET user_id = auth.uid(), is_leader = true
    WHERE id = inv.person_id;
  END IF;

  -- Mark invite as redeemed
  UPDATE invites
  SET redeemed_at = NOW(), redeemed_by = auth.uid()
  WHERE id = inv.id;

  RETURN json_build_object(
    'success', true,
    'organization_id', inv.organization_id,
    'person_id', inv.person_id,
    'role', inv.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION redeem_invite(TEXT) TO authenticated;

-- 5. Update people RLS to allow users to see their own profile
-- ============================================================
DROP POLICY IF EXISTS "people_select_own" ON people;
CREATE POLICY "people_select_own" ON people FOR SELECT
USING (
  is_super_admin()
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = people.team_id
      AND user_belongs_to_org(teams.org_id)
  )
);
