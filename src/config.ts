// Application window. Keep in sync with the insert policy in supabase/schema.sql,
// which enforces the same window server-side.
export const OPENS_AT = new Date('2026-10-30T00:00:00+01:00');  // 30 Oct, midnight Paris
export const CLOSES_AT = new Date('2026-11-14T12:00:00Z');      // 13 Nov, end of day AoE (UTC−12)

export type WindowState = 'not-open' | 'open' | 'closed';

export function windowState(now: Date): WindowState {
  if (now < OPENS_AT) return 'not-open';
  if (now >= CLOSES_AT) return 'closed';
  return 'open';
}

// `?preview` shows the form before it opens, with submission disabled.
// The Supabase insert policy rejects early submissions regardless.
export function isPreview(): boolean {
  return new URLSearchParams(window.location.search).has('preview');
}

// In dev, `?now=<ISO date>` overrides the clock to preview each state.
export function currentTime(): Date {
  if (import.meta.env.DEV) {
    const override = new URLSearchParams(window.location.search).get('now');
    if (override && !Number.isNaN(Date.parse(override))) return new Date(override);
  }
  return new Date();
}
