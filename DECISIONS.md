# Decisions

Choices made where the PRD was ambiguous or the environment forced a call
(PRD §0 rule 8). Each entry: what, why, and what to revisit.

## D-001 · One SQL path, two drivers (PGlite for demo, Postgres for pilot)
The app talks to Postgres through `lib/db`. With `DATABASE_URL` set it uses
node-postgres (point it at the Supabase project's Postgres). Without it, it boots
**PGlite** — real Postgres compiled to WASM, in-process — from the same
`supabase/migrations` + `seed.sql`.
- **Why:** the demo works from a bare `npm run dev` or a Vercel deploy with zero
  setup, and RLS is *always* enforced — the demo can't drift from the pilot.
- **How RLS applies:** every user query runs in a transaction with
  `set local role authenticated` + `request.jwt.claims = {sub: <user id>}`, which
  is exactly what Supabase/PostgREST does. `auth.uid()` works the same.
- **Cost:** PGlite data resets when the server restarts (fine for a demo).
- `DATABASE_URL` is an extra env var not listed in PRD §10.3.

## D-002 · Auth
- `DEMO_MODE=true` → signed cookie sessions, seeded accounts, role switcher.
- Supabase configured and not demo → Supabase Auth: anonymous sign-in for
  workers (FR-001), magic link for other roles (FR-004).
- No Supabase and not demo → anonymous workers still work (cookie); org login
  shows "needs Supabase".
- Supabase mode code paths are written against `@supabase/ssr` but **not yet
  exercised against a real project** — verify before pilot.
- Role always comes from `profiles.role` (never from the client). Workers can
  only self-create `role = 'worker'` (RLS `with check`).

## D-003 · No shadcn/ui
The PRD suggests shadcn/ui. We use a small set of hand-made components
(`components/ui`) instead, because the brief for this build was explicitly
"not generic, not AI-looking" and shadcn's defaults are the most recognisable
look of AI-generated apps. Same accessibility basics (labels, roles, focus,
44px targets).

## D-004 · Locale in a cookie, not the URL
Workers choose a language once; URLs stay short and shareable. `next-intl`
without i18n routing. All UI strings are in `messages/{vi,ja,en}.json`;
`lib/i18n/messages.test.ts` fails if a key or `{placeholder}` is missing in
any language. Prefecture names/greetings live in `config/prefectures.ts` as
`{vi, ja, en}` objects.

## D-005 · Prefecture themes
Each prefecture has a theme (`app/globals.css`), artwork (`components/art`)
and registry entry (`config/prefectures.ts`). Seeded: Kochi (pilot) and Tokyo
(comparison). Adding one = registry entry + CSS block + art + seed rows.

## D-006 · Offer photos are not stored
PRD §7.2 allows a private bucket with 7-day TTL. The MVP reads the image in
memory, extracts fields, and discards it (`offers.image_path` stays null). Less
data to protect; nothing to clean up. Revisit only if workers need to re-open
their original photo.

## D-007 · Pulse-survey anonymity details
- `pulse_answers` has no `user_id` **and no timestamp**, so it can't be joined
  to `pulse_participation` by time.
- Below k = 5 the employer learns nothing, not even the exact count.
- Workers must have consent (b) on to answer; the UI asks in context.
- Free text is never shown raw: only LLM-summarised themes (Japanese) built
  server-side, and only at ≥ 5 responses.

## D-008 · Team membership
Workers' `employer_id`/`team_id` are seeded for the demo. A real pilot needs
an employer-issued team invite code (P2). Employers can't read who is in a team.

## D-009 · Compatriots = same app language
Kenkai Swap's "near compatriots" uses community groups whose language matches
the worker's app language. Good enough for vi/ja/en; add a nationality field
when more languages launch.
