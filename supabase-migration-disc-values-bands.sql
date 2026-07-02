-- Migration PROPOSAL, do not apply until reviewed and approved.
-- Adds storage for the DISC and Values band words read from the assessment PDF.
--
-- Why: the friction methodology bands every high and low call from the
-- instrument's own validated band, never a flat cutoff. The six core dimensions
-- already store score and bias in people.attributes. DISC and Values store
-- scores in people.disc_natural, people.disc_adapted, and people.values_data,
-- but the band words are not stored anywhere. These two columns hold them.
--
-- Shape, both keyed for direct lookup:
--   disc_bands   jsonb  e.g. {"D":"Very Low","I":"Moderately High","S":"Moderately High","C":"Moderately High"}
--                The DISC spectrum is a six-level scale observed in the reports:
--                Very High, Moderately High, High Average, Low Average, Moderately Low, Very Low.
--   values_bands jsonb  e.g. {"Aesthetic":"High","Economic":"Very High","Individualistic":"Low",
--                              "Political":"High","Altruistic":"Average","Regulatory":"High","Theoretical":"High"}
--                The Values band is a five-level scale: Very High, High, Average, Low, Very Low.
--
-- Both are read verbatim from the report. NULL means not parsed, never a guess.
--
-- The six core dimensions need no new column. The pipeline re-writes them into
-- the existing people.attributes column in the same shape the app reads, after
-- the verification gate confirms they match, so the whole Attribute side, the 78
-- and the 6, is written by one pipeline from one read.

ALTER TABLE people ADD COLUMN IF NOT EXISTS disc_bands jsonb;
ALTER TABLE people ADD COLUMN IF NOT EXISTS values_bands jsonb;

COMMENT ON COLUMN people.disc_bands IS 'DISC spectrum band word per letter D/I/S/C, read from the PDF, never computed from the score.';
COMMENT ON COLUMN people.values_bands IS 'Values band word per dimension, read from the PDF, never computed from the score.';
