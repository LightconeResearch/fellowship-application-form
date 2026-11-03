-- Lightcone Research Fellowship — application form (LCR-221)
-- Run once, in the SQL Editor of a new, empty Supabase project (EU region).

-- ── Applications ───────────────────────────────────────────────────────────

CREATE TABLE public.fellowship_applications (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_at         TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- About you
  name                 TEXT        NOT NULL,
  email                TEXT        NOT NULL,
  institution          TEXT        NOT NULL,
  github_username      TEXT,
  -- Name of the CV in the `cvs` bucket (see below).
  cv_path              TEXT        NOT NULL UNIQUE
    CHECK (cv_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'),
  career_stage         TEXT        NOT NULL
    CHECK (career_stage IN ('phd', 'postdoc', 'other')),
  career_stage_other   TEXT,
  domain               TEXT        NOT NULL
    CHECK (domain IN ('astrophysics', 'particle', 'earth-climate', 'life-sciences',
                      'chemistry', 'cs-maths', 'social-sciences', 'other')),
  domain_other         TEXT,

  -- Project
  project_description  TEXT        NOT NULL,
  start_ready          TEXT        NOT NULL
    CHECK (start_ready IN ('yes', 'mostly', 'no')),
  project_goals        TEXT        NOT NULL,
  agentic_fit          TEXT        NOT NULL,
  shareable_result     TEXT        NOT NULL
    CHECK (shareable_result IN ('yes', 'maybe', 'no')),
  data_sharing         TEXT        NOT NULL
    CHECK (data_sharing IN ('public', 'partly', 'private')),
  relevant_links       TEXT,

  -- Computing resources
  compute_resources    TEXT[]      NOT NULL
    CHECK (cardinality(compute_resources) > 0
           AND compute_resources <@ ARRAY['laptop', 'lab-cluster', 'hpc-centre']),
  compute_details      TEXT,

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

ALTER TABLE public.fellowship_applications ENABLE ROW LEVEL SECURITY;

-- Grants decide whether a role can reach the table at all; RLS then decides
-- which rows. New Supabase projects grant nothing by default, and older ones
-- grant everything (TRUNCATE bypasses RLS), so set both explicitly:
-- - anon (the form, with the publishable key) may only insert;
-- - service_role (the Sheet export, with the secret key) may only read.
REVOKE ALL ON public.fellowship_applications FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON public.fellowship_applications TO anon;
GRANT SELECT ON public.fellowship_applications TO service_role;

-- Anonymous inserts are accepted only inside the application window:
-- 30 Oct 2026 00:00 Paris → 20 Nov 2026 end of day AoE.
-- Keep in sync with OPENS_AT / CLOSES_AT in src/config.ts.
-- There is no SELECT policy: anon cannot read anything back.
CREATE POLICY "insert_anon_during_window"
  ON public.fellowship_applications FOR INSERT TO anon
  WITH CHECK (now() >= '2026-10-29T23:00:00Z' AND now() < '2026-11-21T12:00:00Z');

-- ── CVs ────────────────────────────────────────────────────────────────────

-- A private bucket: PDF only, 5 MB at most (keep in sync with CV_MAX_BYTES in
-- src/api/submitApplication.ts). Note that Storage checks the declared
-- Content-Type, not the file's bytes; the form checks the bytes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 5242880, ARRAY['application/pdf']);

-- Anonymous visitors may only upload (INSERT), under a random <uuid>.pdf name,
-- during the application window. With no SELECT, UPDATE or DELETE policy they
-- cannot read, list, overwrite or remove any file. The Sheet export reads CVs
-- with the secret key through short-lived signed links.
CREATE POLICY "cv_upload_anon_during_window"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'cvs'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'
    AND now() >= '2026-10-29T23:00:00Z' AND now() < '2026-11-21T12:00:00Z'
  );

-- An application may only point at a CV that was actually uploaded. anon
-- cannot read storage.objects, so the check runs as its owner (SECURITY
-- DEFINER). Such functions must stay out of exposed schemas like public, so it
-- lives in a private schema the Data API never serves, and nobody may call it
-- directly. It looks up a single object and returns nothing.
CREATE SCHEMA private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.check_cv_uploaded() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects WHERE bucket_id = 'cvs' AND name = NEW.cv_path
  ) THEN
    RAISE EXCEPTION 'CV % has not been uploaded', NEW.cv_path;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.check_cv_uploaded() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER fellowship_applications_cv_uploaded
  BEFORE INSERT OR UPDATE OF cv_path ON public.fellowship_applications
  FOR EACH ROW EXECUTE FUNCTION private.check_cv_uploaded();

-- ── Retention ──────────────────────────────────────────────────────────────

-- All application data is deleted on 20 May 2027 (03:00 UTC); the job removes
-- itself after running. CV files cannot be deleted from SQL, which would leave
-- the files in object storage: the Sheet's Apps Script deletes them through the
-- Storage API at the same time (deleteAllCvs in sheets/export.gs).
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'fellowship-retention',
  '0 3 20 5 *',
  $$DELETE FROM public.fellowship_applications;
    SELECT cron.unschedule('fellowship-retention');$$
);
