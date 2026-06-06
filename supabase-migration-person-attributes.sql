-- ============================================================================
-- Migration: Add person_attributes table and assessment tracking columns
-- ============================================================================
-- 
-- This migration:
-- 1. Adds assessment_token and rawscores_url to people table for repeatability
-- 2. Creates person_attributes table to store all 78 Core Attributes
-- 3. Keeps existing six-dimension rollup intact
--
-- Status: PROPOSAL ONLY — Do not apply until approved
-- Date: June 6, 2026

-- Step 1: Add assessment tracking columns to people table
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS assessment_token TEXT,
  ADD COLUMN IF NOT EXISTS rawscores_url TEXT;

COMMENT ON COLUMN people.assessment_token IS 'Innermetrix assessment token for this person, used to re-pull raw scores from the API';
COMMENT ON COLUMN people.rawscores_url IS 'Full URL to the raw-scores endpoint (e.g., https://profiles.innermetrix.com/remote/AI/{token}/rawscores/), captured for repeatability';

-- Step 2: Create person_attributes table
-- Stores all 78 Core Attributes per assessed person, with score, rank, cluster, and band
CREATE TABLE IF NOT EXISTS person_attributes (
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  raw_score NUMERIC,
  "rank" INT,
  cluster TEXT,
  core_dimension TEXT,
  band TEXT,
  band_source TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (person_id, attribute)
);

COMMENT ON TABLE person_attributes IS 'All 78 Core Attributes per assessed person, ranked by score, with cluster and band information';
COMMENT ON COLUMN person_attributes.person_id IS 'Reference to the person';
COMMENT ON COLUMN person_attributes.attribute IS 'One of the 78 Core Attributes from the Innermetrix Attribute Index';
COMMENT ON COLUMN person_attributes.raw_score IS 'Raw score from the assessment (0-10 scale typically)';
COMMENT ON COLUMN person_attributes."rank" IS 'Rank 1-78 within the person, 1 = highest score';
COMMENT ON COLUMN person_attributes.cluster IS 'Cluster name (Heart, Hand, Head, Self-Esteem, Role Awareness, Self-Direction)';
COMMENT ON COLUMN person_attributes.core_dimension IS 'Core dimension (Empathy, Practical Thinking, Systems Judgment, Self-Esteem, Role Awareness, Self-Direction)';
COMMENT ON COLUMN person_attributes.band IS 'Instrument band label (Very High, High, Average, Low, Very Low) or NULL if not yet determined';
COMMENT ON COLUMN person_attributes.band_source IS 'Source of the band (e.g., pdf-parsed, api-norms, manual)';
COMMENT ON COLUMN person_attributes.updated_at IS 'Timestamp of last update';

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_person_attributes_person_id ON person_attributes(person_id);
CREATE INDEX IF NOT EXISTS idx_person_attributes_cluster ON person_attributes(cluster);
CREATE INDEX IF NOT EXISTS idx_person_attributes_rank ON person_attributes("rank");

-- Step 3: Create attribute_catalog reference table (optional, for data integrity)
-- If you prefer to store the 78-to-cluster mapping in the database instead of code
CREATE TABLE IF NOT EXISTS attribute_catalog (
  attribute TEXT PRIMARY KEY,
  cluster TEXT NOT NULL,
  core_dimension TEXT NOT NULL,
  description TEXT
);

COMMENT ON TABLE attribute_catalog IS 'Reference table: maps each of the 78 Core Attributes to its cluster and core dimension';

-- Insert the 78 attributes into the catalog (from orgharmony-psychometric-validator SKILL.md)
-- This is optional; you can also keep the mapping in code (tools/attribute-catalog.js)
INSERT INTO attribute_catalog (attribute, cluster, core_dimension, description)
VALUES
  ('Accountability For Others', 'Heart', 'Empathy', 'Ability to be responsible for consequences of actions of those whom the person manages'),
  ('Attention To Detail', 'Hand', 'Practical Thinking', 'Ability to see and pay attention to details'),
  ('Attitude Toward Honesty', 'Role Awareness', 'Role Awareness', 'Openness to being honest even when it involves reporting lack of results'),
  ('Attitude Toward Others', 'Heart', 'Empathy', 'Ability to maintain positive, open, and objective attitude toward others'),
  ('Balanced Decision Making', 'Self-Esteem', 'Self-Esteem', 'Ability to be objective and weigh aspects of situation fairly'),
  ('Conceptual Thinking', 'Head', 'Systems Judgment', 'Ability to see big picture, determine direction, and use resources strategically'),
  ('Concrete Organization', 'Hand', 'Practical Thinking', 'Understanding immediate needs and setting effective plan of action'),
  ('Consistency and Reliability', 'Role Awareness', 'Role Awareness', 'Internal need to be conscientious and consistent across life roles'),
  ('Conveying Role Value', 'Heart', 'Empathy', 'Ability to instill sense of value for task in employees'),
  ('Correcting Others', 'Role Awareness', 'Role Awareness', 'Ability to confront difficult issues objectively'),
  ('Creativity', 'Head', 'Systems Judgment', 'Ability to think innovatively and think outside the box'),
  ('Developing Others', 'Heart', 'Empathy', 'Ability to understand needs of others and use to develop them'),
  ('Diplomacy', 'Heart', 'Empathy', 'Ability to balance personal emotions with needs of situation'),
  ('Emotional Control', 'Self-Esteem', 'Self-Esteem', 'Ability to stay rational and objective under stress'),
  ('Empathetic Outlook', 'Heart', 'Empathy', 'Capacity to understand feelings of others'),
  ('Enjoyment Of The Job', 'Self-Direction', 'Self-Direction', 'Degree to which person finds job fulfilling'),
  ('Evaluating Others', 'Self-Direction', 'Self-Direction', 'Ability to make realistic judgments about others'),
  ('Evaluating What Is Said', 'Heart', 'Empathy', 'Willingness to hear what is actually said'),
  ('Flexibility', 'Self-Direction', 'Self-Direction', 'Ability to integrate, modify, and respond to change'),
  ('Following Directions', 'Role Awareness', 'Role Awareness', 'Ability to hear, understand, and follow directions'),
  ('Freedom From Prejudices', 'Heart', 'Empathy', 'Ability to keep prejudices from affecting relationships'),
  ('Gaining Commitment', 'Heart', 'Empathy', 'Ability to develop self-motivating attitude in others'),
  ('Handling Rejection', 'Self-Esteem', 'Self-Esteem', 'Ability to avoid taking rejection overly personally'),
  ('Handling Stress', 'Self-Esteem', 'Self-Esteem', 'Ability to balance and defuse inner tension'),
  ('Human Awareness', 'Heart', 'Empathy', 'Ability to be conscious of others feelings'),
  ('Initiative', 'Self-Direction', 'Self-Direction', 'Ability to direct energy toward goal without external catalyst'),
  ('Integrative Ability', 'Head', 'Systems Judgment', 'Ability to identify elements of problem and decide what to do'),
  ('Intuitive Decision Making', 'Head', 'Systems Judgment', 'Ability to compile intuitive perceptions into decision'),
  ('Job Ethic', 'Role Awareness', 'Role Awareness', 'Personal commitment to execution of specific task'),
  ('Leading Others', 'Heart', 'Empathy', 'Ability to organize and motivate people'),
  ('Long Range Planning', 'Head', 'Systems Judgment', 'Ability to identify resources and plan across long-range projects'),
  ('Material Possessions', 'Self-Direction', 'Self-Direction', 'Importance of money or material possessions in motivation'),
  ('Meeting Standards', 'Role Awareness', 'Role Awareness', 'Ability to see standard requirements and commitment to meeting them'),
  ('Monitoring Others', 'Hand', 'Practical Thinking', 'Ability to focus on actions of others to identify successes'),
  ('Persistence', 'Self-Direction', 'Self-Direction', 'Ability to stay on course in times of difficulty'),
  ('Personal Accountability', 'Role Awareness', 'Role Awareness', 'Ability to be responsible for decisions without shifting blame'),
  ('Personal Commitment', 'Self-Direction', 'Self-Direction', 'Ability to focus and stay committed to task'),
  ('Personal Drive', 'Self-Direction', 'Self-Direction', 'How strongly person feels need to achieve'),
  ('Personal Relationships', 'Heart', 'Empathy', 'Motivation to form personal relationships with coworkers'),
  ('Persuading Others', 'Heart', 'Empathy', 'Ability to present viewpoint so others accept it'),
  ('Practical Thinking', 'Hand', 'Practical Thinking', 'Ability to identify problems and solutions practically'),
  ('Proactive Thinking', 'Head', 'Systems Judgment', 'Ability to determine future implications of current decisions'),
  ('Problem and Situation Analysis', 'Hand', 'Practical Thinking', 'Ability to identify elements of problem'),
  ('Problem Management', 'Hand', 'Practical Thinking', 'Ability to keep critical issues in context'),
  ('Problem Solving', 'Hand', 'Practical Thinking', 'Ability to identify alternatives and select best'),
  ('Project and Goal Focus', 'Self-Direction', 'Self-Direction', 'Ability to stay on target regardless of circumstances'),
  ('Project Scheduling', 'Hand', 'Practical Thinking', 'Ability to allocate resources to complete on time'),
  ('Quality Orientation', 'Hand', 'Practical Thinking', 'Affinity for seeing details and grading against standard'),
  ('Realistic Expectations', 'Self-Direction', 'Self-Direction', 'Whether persons expectations of others realistically met'),
  ('Realistic Goal Setting For Others', 'Self-Direction', 'Self-Direction', 'Ability to set achievable goals for others'),
  ('Realistic Personal Goal Setting', 'Self-Direction', 'Self-Direction', 'Ability to set achievable goals for oneself'),
  ('Relating To Others', 'Heart', 'Empathy', 'Ability to coordinate insight into effective interactions'),
  ('Respect For Policies', 'Role Awareness', 'Role Awareness', 'Appreciation for conducting business per policy intent'),
  ('Respect For Property', 'Role Awareness', 'Role Awareness', 'Ability to protect and use company property correctly'),
  ('Results Orientation', 'Hand', 'Practical Thinking', 'Ability to identify actions needed to obtain results'),
  ('Role Awareness', 'Role Awareness', 'Role Awareness', 'Ability to understand role expectations'),
  ('Role Confidence', 'Self-Esteem', 'Self-Esteem', 'Ability to develop inner strength based on belief in success'),
  ('Seeing Potential Problems', 'Hand', 'Practical Thinking', 'Ability to identify future problems'),
  ('Self Assessment', 'Self-Direction', 'Self-Direction', 'Ability to identify own strengths and weaknesses'),
  ('Self Confidence', 'Self-Esteem', 'Self-Esteem', 'Ability to maintain inner strength based on belief in capabilities'),
  ('Self Control', 'Self-Esteem', 'Self-Esteem', 'Ability to stay rational in stressful situations'),
  ('Self Direction', 'Self-Direction', 'Self-Direction', 'Internal drive to excel in career path'),
  ('Self Discipline and Sense of Duty', 'Role Awareness', 'Role Awareness', 'How strongly person feels need to be consistent'),
  ('Self Esteem', 'Self-Esteem', 'Self-Esteem', 'Ability to realize and appreciate own unique self-worth'),
  ('Self Improvement', 'Self-Direction', 'Self-Direction', 'Motivation to improve oneself'),
  ('Self Management', 'Self-Direction', 'Self-Direction', 'Ability to manage oneself and develop own abilities'),
  ('Self Starting Ability', 'Self-Direction', 'Self-Direction', 'Ability to find own motivation and maintain against adversity'),
  ('Sense of Belonging', 'Self-Direction', 'Self-Direction', 'Importance of feeling part of team for motivation'),
  ('Sense of Mission', 'Self-Direction', 'Self-Direction', 'Importance and commitment to ideals and goals'),
  ('Sense of Timing', 'Self-Direction', 'Self-Direction', 'Ability to read situation so statements land effectively'),
  ('Sensitivity To Others', 'Heart', 'Empathy', 'Ability to be aware of others feelings without blocking decisions'),
  ('Status and Recognition', 'Self-Direction', 'Self-Direction', 'Importance of social status and recognition'),
  ('Surrendering Control', 'Self-Direction', 'Self-Direction', 'Ability to surrender control to another person'),
  ('Systems Judgment', 'Head', 'Systems Judgment', 'Schematic thinking ability within system of people'),
  ('Theoretical Problem Solving', 'Head', 'Systems Judgment', 'Ability to envision situation and apply problem-solving'),
  ('Understanding Attitude', 'Heart', 'Empathy', 'Ability to read body language and emotion'),
  ('Understanding Motivational Needs', 'Heart', 'Empathy', 'Ability to understand needs of employees'),
  ('Using Common Sense', 'Hand', 'Practical Thinking', 'Ability to see world clearly and make sensible decisions')
ON CONFLICT (attribute) DO NOTHING;

-- ============================================================================
-- End Migration
-- ============================================================================
