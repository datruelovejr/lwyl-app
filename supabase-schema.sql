-- LWYL App Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jhmyhuetrmrqlnteflns/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- People table (with assessment data embedded)
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  is_leader BOOLEAN DEFAULT FALSE,
  disc_natural JSONB,
  disc_adapted JSONB,
  values_data JSONB,
  attributes JSONB,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON teams(org_id);
CREATE INDEX IF NOT EXISTS idx_people_team_id ON people(team_id);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for now - no auth)
-- Organizations policies
CREATE POLICY "Allow all operations on organizations" ON organizations
  FOR ALL USING (true) WITH CHECK (true);

-- Teams policies
CREATE POLICY "Allow all operations on teams" ON teams
  FOR ALL USING (true) WITH CHECK (true);

-- People policies
CREATE POLICY "Allow all operations on people" ON people
  FOR ALL USING (true) WITH CHECK (true);
