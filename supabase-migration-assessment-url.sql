-- Add assessment_url to organizations table
-- This stores the Innermetrix white-label assessment link for each org.
-- Everyone who takes this link gets filed under this org.
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jhmyhuetrmrqlnteflns/sql

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS assessment_url TEXT;

COMMENT ON COLUMN organizations.assessment_url IS 'Innermetrix white-label assessment URL for this organization (e.g. https://profiles.innermetrix.com/VO/xxxxx/en)';
