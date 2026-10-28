# Lightcone Research Fellows — Application Form

Application form for the first cohort of Lightcone Research Fellows (Scientific Pilot Program, LCR-221). It is a single-page form deployed on GitHub Pages, with Supabase as the backend and a Google Sheet where the selection committee reviews applications.

| Date | |
|---|---|
| Fri 30 Oct 2026 | Applications open (midnight Paris) |
| Fri 13 Nov 2026 | Applications close (end of day AoE) |
| Fri 20 Nov 2026 | Selection and notification |
| Thu 20 May 2027 | All application data deleted (6 months after selection) |

The window is enforced twice: in the UI (`src/config.ts`) and by the Supabase insert policy (`supabase/schema.sql`). Keep the two in sync.

## Local development

```bash
make install   # install dependencies
make dev       # start dev server at http://localhost:5173
make build     # production build → dist/
make preview   # serve dist/ locally
make lint      # run ESLint
make clean     # remove dist/ and node_modules/
```

In dev, `?now=<ISO date>` overrides the clock to preview each state:

- `http://localhost:5173/?now=2026-10-29T12:00Z`: not open yet
- `http://localhost:5173/?now=2026-11-01T12:00Z`: open
- `http://localhost:5173/?now=2026-11-14T13:00Z`: closed

Local submits need a `.env.local` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## Setup guide

### 1. Create the Supabase project

1. Create a **dedicated** project on [supabase.com](https://supabase.com) in an EU region.
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). It creates:
   - the `fellowship_applications` table;
   - an anon insert policy restricted to the application window;
   - a `pg_cron` job that deletes all rows on 20 May 2027.
3. From **Project Settings → API**, note the **Project URL**, the **anon** key (for the form) and the **service_role** key (for the Sheet only, never in the frontend).

To test before the window opens, widen it temporarily, then restore it:

```sql
ALTER POLICY "insert_anon_during_window" ON fellowship_applications
  WITH CHECK (true);

-- restore
ALTER POLICY "insert_anon_during_window" ON fellowship_applications
  WITH CHECK (now() >= '2026-10-29T23:00:00Z' AND now() < '2026-11-14T12:00:00Z');
```

### 2. GitHub secrets and Pages

In **Settings → Secrets and variables → Actions**, set:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon/public key |

Set **Settings → Pages → Source** to **GitHub Actions**. Every push to `main` deploys to `https://lightconeresearch.github.io/fellowship-application/`. The base path is derived from the repository name.

### 3. Committee review Sheet

1. Create a Google Sheet and share it **only** with the selection committee.
2. Go to **Extensions → Apps Script**, paste [`sheets/export.gs`](sheets/export.gs) and save.
3. In **Project Settings → Script Properties**, add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (the service_role key).
4. Run `installHourlyTrigger` once and accept the permissions.
5. Reload the Sheet. The **Lightcone → Refresh applications** menu syncs on demand.

The script fills the data columns of the `Applications` tab and upserts rows by application ID. Add review columns to the **right** of the data, for example reviewer notes, score, decision and decline reason. Refreshes never overwrite them. Record decline and withdrawal reasons: the pilot learning report (Q2) needs them.

---

## Data retention runbook

On **20 May 2027**:

1. Check that the `pg_cron` job ran: `SELECT count(*) FROM fellowship_applications;` should return 0. If not, run `DELETE FROM fellowship_applications;`.
2. Delete the committee Google Sheet and empty it from Drive's trash.
3. Delete any CSV exports or local copies.

For an access, correction or deletion request sent to info@lightconeresearch.org, act on the row in the Supabase Table Editor. For a deletion, also delete the matching row in the Sheet: the sync does not remove rows.
