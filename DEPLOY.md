# Deploying from scratch

How to set up the form on a new, empty Supabase project. No secret values belong in this repo: keys go in the Supabase dashboard, GitHub secrets and the Sheet's Script Properties only.

The form is published to GitHub Pages on every push to `main`, built against the Supabase project named in the GitHub secrets. Until steps 1 and 2 are done, submissions fail.

## 1. Supabase project

1. Create a project in an **EU region**. Leave **Automatically expose new tables** unchecked (the default): `schema.sql` grants exactly what the form and the Sheet need.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql) once. It creates:
   - the `fellowship_applications` table, which anonymous visitors may only insert into, during the application window, and the Sheet may only read;
   - the private `cvs` bucket (PDF only, 5 MB), which anonymous visitors may only upload to, during the window, under a random `<uuid>.pdf` name;
   - a check that each application's CV was uploaded;
   - the job that deletes every application on 20 May 2027.
3. Check **Advisors → Security Advisor** and **Performance Advisor** report no issues.
4. In **Settings → API Keys**, create:
   - a **publishable key** (`sb_publishable_…`), for the form;
   - a **secret key** (`sb_secret_…`), for the Sheet only. It bypasses every access rule and unlocks every CV: never put it in the repo, a browser or a chat.
5. In **Storage → Settings**, check the global file size limit is at least 5 MB (the default is 50 MB).

## 2. GitHub secrets

In the repo's **Settings → Secrets and variables → Actions**, set:

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the publishable key |

Delete `VITE_SUPABASE_ANON_KEY` if it still exists. Then re-run the latest **Deploy** workflow (or push to `main`) so the published form picks up the new values.

## 3. Committee Sheet

1. In the committee's Sheet, open **Extensions → Apps Script**, replace the script with [`sheets/export.gs`](sheets/export.gs) and save. Start from an empty **Applications** tab: the script writes the data columns from column A, and the committee's own columns (notes, score, decision…) go to their right.
2. In **Project Settings → Script Properties**, set `SUPABASE_URL` (as above) and `SUPABASE_SECRET_KEY` (the secret key).
3. Run `refreshApplications` once and authorise it.
   - **If it fails with HTTP 401**, Supabase is refusing the secret key from Apps Script (it blocks secret keys in requests that look like they come from a browser). Stop here: the export needs another approach.
4. Run `installHourlyTrigger` and `installRetentionTrigger` once. The first refreshes the Sheet every hour, and deletes CVs no application points at after an hour. The second deletes every CV on 20 May 2027, through the Storage API.
5. Share the Sheet with the committee as **viewers or commenters**, not editors: editors can see the secret key in Script Properties.

## 4. Check the live form

1. Submit a test application on the published form, with a small PDF as the CV.
2. Run **Lightcone → Refresh applications** in the Sheet: the row should appear, and **Open CV** should open the PDF.
3. Delete the test application (**Table Editor → fellowship_applications**) and its file (**Storage → cvs**), and its row in the Sheet.

## Data retention

On 20 May 2027 at 03:00 UTC, the database job deletes every application and the Sheet's trigger deletes every CV. Afterwards, check that the table and the `cvs` bucket are empty, and clear the Applications tab of the Sheet.

## Changing the application window

The window is enforced in three places; keep them in sync:

- `OPENS_AT` / `CLOSES_AT` in [`src/config.ts`](src/config.ts);
- the `insert_anon_during_window` policy on `fellowship_applications`;
- the `cv_upload_anon_during_window` policy on `storage.objects`.

On a live project, change the policies with `ALTER POLICY … WITH CHECK (…)` in the SQL Editor; `schema.sql` is for new projects only.
