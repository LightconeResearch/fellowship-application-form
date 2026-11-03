-- Lightcone Research Fellows — application form (LCR-221)
-- Run once in the SQL Editor of the dedicated Supabase project (EU region).

CREATE TABLE fellowship_applications (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- About you
  name                 TEXT        NOT NULL,
  email                TEXT        NOT NULL,
  institution          TEXT        NOT NULL,
  github_username      TEXT,
  -- Name of the CV in the `cvs` bucket. Nullable: added after the form opened.
  cv_path              TEXT        UNIQUE
    CHECK (cv_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'),
  career_stage         TEXT        NOT NULL
    CHECK (career_stage IN ('phd', 'postdoc', 'engineer', 'faculty', 'other')),
  career_stage_other   TEXT,
  domain               TEXT        NOT NULL
    CHECK (domain IN ('astrophysics', 'particle', 'earth-climate', 'life-sciences',
                      'chemistry', 'cs-maths', 'social-sciences', 'other')),
  domain_other         TEXT,

  -- Project
  project_description  TEXT        NOT NULL,
  -- No longer asked (replaced by start_ready and shareable_result); kept for
  -- applications submitted before.
  project_status       TEXT
    CHECK (project_status IN ('new', 'conversion')),
  -- The next three are nullable: added after the form opened.
  start_ready          TEXT
    CHECK (start_ready IN ('yes', 'mostly', 'no')),
  shareable_result     TEXT
    CHECK (shareable_result IN ('yes', 'maybe', 'no')),
  data_sharing         TEXT
    CHECK (data_sharing IN ('public', 'partly', 'private')),
  project_goals        TEXT        NOT NULL,
  -- Nullable: added after the form opened, so the first applications have none.
  agentic_fit          TEXT,
  relevant_links       TEXT,

  -- Computing resources
  compute_resources    TEXT[]      NOT NULL
    CHECK (cardinality(compute_resources) > 0
           AND compute_resources <@ ARRAY['laptop', 'lab-cluster', 'hpc-centre']),
  compute_details      TEXT,
  -- No longer asked; kept for applications submitted before the questions were removed.
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
-- 30 Oct 2026 00:00 Paris → 20 Nov 2026 end of day AoE.
-- Keep in sync with OPENS_AT / CLOSES_AT in src/config.ts.
CREATE POLICY "insert_anon_during_window"
  ON fellowship_applications FOR INSERT TO anon
  WITH CHECK (now() >= '2026-10-29T23:00:00Z' AND now() < '2026-11-21T12:00:00Z');

-- No SELECT policy: only the service role (used by the Google Sheet export) can read.
-- Supabase grants every privilege to anon/authenticated by default, and TRUNCATE
-- bypasses RLS, so strip them back to INSERT only.
REVOKE ALL ON public.fellowship_applications FROM anon, authenticated;
GRANT INSERT ON public.fellowship_applications TO anon;

-- CVs: a private bucket, PDF only, 5 MB at most (keep in sync with CV_MAX_BYTES in
-- src/api/submitApplication.ts). Anonymous visitors may only upload, under a
-- random <uuid>.pdf name, during the application window. With no SELECT, UPDATE
-- or DELETE policy they cannot read, list, overwrite or remove any file; the
-- Google Sheet export reads them with the service role through signed links.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['application/pdf'];

CREATE POLICY "cv_upload_anon_during_window"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'cvs'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'
    AND now() >= '2026-10-29T23:00:00Z' AND now() < '2026-11-21T12:00:00Z'
  );

-- An application may only point at a CV that was actually uploaded. The check
-- needs to read storage.objects, so it runs as its owner (SECURITY DEFINER):
-- Supabase's guidance is to keep such functions out of exposed schemas like
-- public, so it lives in a private schema the Data API never serves.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.check_cv_uploaded() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.cv_path IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects WHERE bucket_id = 'cvs' AND name = NEW.cv_path
  ) THEN
    RAISE EXCEPTION 'CV % has not been uploaded', NEW.cv_path;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.check_cv_uploaded() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER fellowship_applications_cv_uploaded
  BEFORE INSERT OR UPDATE OF cv_path ON public.fellowship_applications
  FOR EACH ROW EXECUTE FUNCTION private.check_cv_uploaded();

-- Retention: all application data is deleted on 20 May 2027 (03:00 UTC). The job removes itself after running.
-- CV files cannot be deleted from SQL (that would leave the files in object storage):
-- the Sheet's Apps Script deletes them through the Storage API (deleteAllCvs in sheets/export.gs).
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'fellowship-retention',
  '0 3 20 5 *',
  $$DELETE FROM public.fellowship_applications;
    SELECT cron.unschedule('fellowship-retention');$$
);
