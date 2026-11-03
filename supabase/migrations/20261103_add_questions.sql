-- New questions: GitHub username, why the project suits AI agents, and links
-- to relevant code or previous work.
-- Run in the Supabase SQL Editor BEFORE the form change deploys: until these
-- columns exist, every submission from the new form is rejected.
-- All nullable: applications submitted before this change have no answers,
-- and the GitHub username and links are optional.
--
-- nersc_access and ccin2p3_access are no longer asked. They stay, with their
-- default of false, so earlier answers are kept.
ALTER TABLE public.fellowship_applications
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS agentic_fit     TEXT,
  ADD COLUMN IF NOT EXISTS relevant_links  TEXT;
