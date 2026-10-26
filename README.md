# ReWork

Mobile-first web app that helps foreign workers in regional Japan see the
**real** numbers before leaving for a big city — and, if they do switch jobs,
switch **within their prefecture**. Built from `PRD v1.0 (MVP)`.

| Worker (vi / ja / en) | Organisations |
|---|---|
| **Tedori Map** — photo or type two job offers → money really left each month | **Employer** — anonymous team pulse (k ≥ 5), suggested actions, minimum-wage check, listings |
| **Life Assistant** — KB-grounded answers with sources, emergency + "talk to a human" routing, Japanese-for-my-job lessons | **Support org** — inbox of transfer-interest requests (status only) |
| **Community** — compatriot groups, events, buddy requests | **Prefecture** — weekly question topics (k ≥ 5, no text) |
| **Kenkai Swap** — 3 in-prefecture suggestions, transfer checklist, send to support org | **Admin** — KB, buddy queue, rules & rates with sources |

The look changes per prefecture (Kochi, Tokyo, + preview Osaka and Hokkaido):
see [DESIGN.md](DESIGN.md). Choices made where the PRD was open are in
[DECISIONS.md](DECISIONS.md).

## Run it

```bash
npm install
cp .env.example .env.local   # DEMO_MODE=true works with no other keys
npm run dev                  # http://localhost:3000
```

With no `DATABASE_URL`, the app boots an in-process Postgres (PGlite) from
`supabase/migrations` + `supabase/seed.sql`, with RLS on. Use **"View as"** in
the demo bar to switch between Linh (worker), Sato (employer), Tanaka (support
org), the prefecture office and admin. Data resets when the server restarts.

Without `ANTHROPIC_API_KEY` every AI feature falls back: manual offer entry,
keyword routing + article excerpts, sample lessons, template reasons,
rule-based employer actions.

## Tests

```bash
npm test                     # calculator, ranking, RLS, i18n parity, routing, LLM request shape
TEST_DATABASE_URL=postgres://… npm run test:pg   # same RLS suite on a real Postgres
npm run typecheck && npm run lint
```

## Supabase (pilot)

1. Run `supabase/migrations/*.sql`, then `supabase/seed.sql` and `supabase/seed_kb.sql`
   (`npm run sql` regenerates `seed_kb.sql` from `content/kb`).
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`
   and `DEMO_MODE=false`. Enable anonymous sign-ins in Supabase Auth.
3. Deploy to Vercel. `vercel.json` schedules the nightly retention/aggregation job.

## Before a real pilot (from the PRD)
- Verify tax/insurance rates (`config/tedori.ts`) and update minimum wages to
  FY2026 (`config/min-wage.ts`).
- Replace sample rent, employers and KB articles with real, sourced content.
- Legal review of the Kenkai Swap flow (職業安定法, 育成就労 rules) and the privacy notice (APPI).
- Exercise the Supabase Auth paths against a real project (see D-002).

## Layout
```
app/(worker)/…        home, tedori, assistant, community, swap, pulse, settings
app/(dash)/…          employer, org, municipality, admin
app/api/…             extract-offer, assistant (stream), cron/daily
app/actions/…         server actions (all DB writes go through RLS)
lib/tedori/calc.ts    deterministic take-home calculator (+ tests)
lib/swap/rank.ts      in-prefecture ranking, no paid input (+ tests)
lib/db/               PGlite / Postgres driver, RLS tests
lib/llm/              Anthropic client, prompts, Zod schemas
config/               prefectures, tedori rates, min wage, 育成就労 rules
content/kb/           sample knowledge base (vi/ja/en markdown)
supabase/             migrations, seed
messages/             vi.json, ja.json, en.json
```
