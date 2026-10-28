-- Lightcone Research Fellows — application form (LCR-221)
-- Run once in the SQL Editor of the dedicated Supabase project (EU region).

CREATE TABLE fellowship_applications (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- About you
  name                 TEXT        NOT NULL,
  email                TEXT        NOT NULL,
  institution          TEXT        NOT NULL,
  career_stage         TEXT        NOT NULL
    CHECK (career_stage IN ('phd', 'postdoc', 'engineer', 'faculty', 'other')),
  career_stage_other   TEXT,
  domain               TEXT        NOT NULL
    CHECK (domain IN ('astrophysics', 'particle', 'earth-climate', 'life-sciences',
                      'chemistry', 'cs-maths', 'social-sciences', 'other')),
  domain_other         TEXT,

  -- Project
  project_description  TEXT        NOT NULL,
  project_status       TEXT        NOT NULL
    CHECK (project_status IN ('new', 'conversion')),
  project_goals        TEXT        NOT NULL,

  -- Computing resources
  compute_resources    TEXT[]      NOT NULL
    CHECK (cardinality(compute_resources) > 0
           AND compute_resources <@ ARRAY['laptop', 'lab-cluster', 'hpc-centre']),
  compute_details      TEXT,
  nersc_access         BOOLEAN     DEFAULT false NOT NULL,
  ccin2p3_access       BOOLEAN     DEFAULT false NOT NULL,

  -- PI or supervisor
  pi_name              TEXT        NOT NULL,
  pi_email             TEXT        NOT NULL,
  pi_agreement         BOOLEAN     NOT NULL CHECK (pi_agreement),

  -- Group
  group_members        TEXT,

  -- Availability
  availability         TEXT        NOT NULL
    CHECK (availability IN ('full', 'partial')),
  availability_notes   TEXT,
  workshop_attendance  TEXT        NOT NULL
    CHECK (workshop_attendance IN ('yes', 'no', 'unsure')),

  -- Consent
  consent_data_policy  BOOLEAN     NOT NULL CHECK (consent_data_policy)
);

ALTER TABLE fellowship_applications ENABLE ROW LEVEL SECURITY;

-- Anonymous inserts are accepted only inside the application window:
-- 30 Oct 2026 00:00 Paris → 13 Nov 2026 end of day AoE.
-- Keep in sync with OPENS_AT / CLOSES_AT in src/config.ts.
CREATE POLICY "insert_anon_during_window"
  ON fellowship_applications FOR INSERT TO anon
  WITH CHECK (now() >= '2026-10-29T23:00:00Z' AND now() < '2026-11-14T12:00:00Z');

-- No SELECT policy: only the service role (used by the Google Sheet export) can read.
GRANT INSERT ON public.fellowship_applications TO anon;

-- Retention: all application data is deleted 6 months after selection
-- (20 May 2027, 03:00 UTC). The job removes itself after running.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'fellowship-retention',
  '0 3 20 5 *',
  $$DELETE FROM public.fellowship_applications;
    SELECT cron.unschedule('fellowship-retention');$$
);
