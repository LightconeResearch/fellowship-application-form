-- New questions: GitHub username, CV (PDF upload), readiness to start on
-- 1 December, why the project suits AI agents, whether it will reach a
-- shareable result, whether its data can be public, and links to relevant
-- code or previous work.
-- Run in the Supabase SQL Editor BEFORE the form change deploys: until these
-- columns exist, every submission from the new form is rejected.
-- All nullable: applications submitted before this change have no answers,
-- and the GitHub username and links are optional. The form requires a CV.
--
-- nersc_access and ccin2p3_access are no longer asked. They stay, with their
-- default of false, so earlier answers are kept.
--
-- project_status is no longer asked either (start_ready and shareable_result
-- replace it). It stays for earlier answers, but must accept NULL, or every
-- new submission is rejected.
ALTER TABLE public.fellowship_applications
  ALTER COLUMN project_status DROP NOT NULL;

ALTER TABLE public.fellowship_applications
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS agentic_fit     TEXT,
  ADD COLUMN IF NOT EXISTS relevant_links  TEXT,
  ADD COLUMN IF NOT EXISTS start_ready     TEXT
    CHECK (start_ready IN ('yes', 'mostly', 'no')),
  ADD COLUMN IF NOT EXISTS shareable_result TEXT
    CHECK (shareable_result IN ('yes', 'maybe', 'no')),
  ADD COLUMN IF NOT EXISTS data_sharing    TEXT
    CHECK (data_sharing IN ('public', 'partly', 'private')),
  ADD COLUMN IF NOT EXISTS cv_path         TEXT UNIQUE
    CHECK (cv_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$');

-- CVs: private bucket, PDF only, 5 MB at most. Anonymous visitors may only
-- upload, under a random <uuid>.pdf name, during the application window.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "cv_upload_anon_during_window" ON storage.objects;
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

DROP TRIGGER IF EXISTS fellowship_applications_cv_uploaded ON public.fellowship_applications;
CREATE TRIGGER fellowship_applications_cv_uploaded
  BEFORE INSERT OR UPDATE OF cv_path ON public.fellowship_applications
  FOR EACH ROW EXECUTE FUNCTION private.check_cv_uploaded();
