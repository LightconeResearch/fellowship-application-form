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

Before the window opens, add `?preview` to the URL to see the form on the published site, e.g. `https://lightconeresearch.github.io/fellowship-application-form/?preview`. Submission is disabled in preview, and the database refuses early inserts anyway.

Local submits need `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in a gitignored `.env.local`. Setup, secrets and the data-retention runbook live in an internal doc, not in this repo.
