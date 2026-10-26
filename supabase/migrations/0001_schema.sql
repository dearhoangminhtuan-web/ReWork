-- ReWork MVP schema (PRD §9.1). Every table carries or derives a prefecture_code
-- so a new prefecture is config + seed only (PRD §7.3).

create schema if not exists app;

-- ---------------------------------------------------------------- orgs
create table public.support_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefecture_code text not null,
  contact jsonb not null default '{}'::jsonb, -- {phone, email, hours, languages[]}
  is_sample boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.employers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  prefecture_code text not null,
  municipality text not null,
  industry text not null,
  is_sample boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  name text not null
);

-- ---------------------------------------------------------------- people
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'worker'
    check (role in ('worker', 'employer', 'support_org', 'municipality', 'admin')),
  language text not null default 'vi' check (language in ('vi', 'ja', 'en')),
  prefecture_code text not null,
  municipality text,
  industry text,
  residence_status text check (residence_status in ('ikusei', 'titp', 'ssw', 'other')),
  years_in_japan numeric(4, 1) not null default 0 check (years_in_japan >= 0),
  months_at_employer integer check (months_at_employer >= 0),
  support_org_id uuid references public.support_orgs (id) on delete set null,
  employer_id uuid references public.employers (id) on delete set null,
  team_id uuid references public.teams (id) on delete set null,
  display_name text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.consents (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  chat_improve boolean not null default false,        -- FR-002 (a)
  survey_aggregate boolean not null default false,    -- FR-002 (b)
  share_swap_with_org boolean not null default false, -- FR-002 (c)
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- tedori
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  label text not null check (label in ('A', 'B')),
  extracted_json jsonb,
  edited_json jsonb not null,
  image_path text, -- MVP stores no images (see DECISIONS.md D-006)
  created_at timestamptz not null default now()
);

create table public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  offer_a_id uuid not null references public.offers (id) on delete cascade,
  offer_b_id uuid not null references public.offers (id) on delete cascade,
  result_json jsonb not null,
  assumptions_json jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- jobs
-- NOTE (FR-044): there is intentionally NO sponsored / paid / boost / priority
-- column. Listing order must never be influenced by payment.
create table public.job_listings (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  title text not null,
  title_i18n jsonb not null default '{}'::jsonb,
  industry text not null,
  municipality text not null,
  wage_type text not null check (wage_type in ('hourly', 'monthly')),
  wage_amount integer not null check (wage_amount > 0),
  hours_month integer check (hours_month > 0),
  dormitory boolean not null default false,
  housing_fee integer check (housing_fee >= 0),
  languages text[] not null default '{ja}',
  active boolean not null default true,
  is_sample boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles (user_id) on delete cascade,
  support_org_id uuid not null references public.support_orgs (id) on delete cascade,
  answers_json jsonb not null,
  suggested_listing_ids uuid[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- assistant
create table public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  prefecture_code text, -- null = national
  topic text not null,
  language text not null check (language in ('vi', 'ja', 'en')),
  title text not null,
  body_md text not null,
  tags text[] not null default '{}',
  source_url text,
  is_sample boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  topic text check (topic in ('daily_life', 'japanese_learning', 'visa_legal', 'labor_dispute', 'emergency', 'other')),
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index chat_messages_user_idx on public.chat_messages (user_id, created_at);
create index chat_messages_created_idx on public.chat_messages (created_at);

-- ---------------------------------------------------------------- pulse
create table public.pulse_surveys (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  created_at timestamptz not null default now(),
  unique (team_id, period)
);

-- Proves "answered once". Holds no answers and no timestamp (so it can't be
-- joined to pulse_answers by time).
create table public.pulse_participation (
  survey_id uuid not null references public.pulse_surveys (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  primary key (survey_id, user_id)
);

-- PRD §9.1: NO user_id column. Also no timestamp, for the same reason.
create table public.pulse_answers (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.pulse_surveys (id) on delete cascade,
  q1 smallint not null check (q1 between 1 and 5),
  q2 smallint not null check (q2 between 1 and 5),
  q3 smallint not null check (q3 between 1 and 5),
  q4 smallint not null check (q4 between 1 and 5),
  q5 smallint not null check (q5 between 1 and 5),
  free_text text
);

-- LLM-written themes (Japanese) + suggested actions, built from aggregates only.
create table public.pulse_summaries (
  survey_id uuid primary key references public.pulse_surveys (id) on delete cascade,
  response_count integer not null,
  themes_ja jsonb not null default '[]'::jsonb,
  actions_ja jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- community
create table public.community_groups (
  id uuid primary key default gen_random_uuid(),
  prefecture_code text not null,
  municipality text,
  language text not null, -- main language of the group (vi, id, ne, tl, my, ja…)
  name jsonb not null,
  description jsonb not null,
  meets text,
  contact text,
  is_sample boolean not null default true
);

create table public.community_events (
  id uuid primary key default gen_random_uuid(),
  prefecture_code text not null,
  municipality text,
  kind text not null default 'event',
  title jsonb not null,
  description jsonb not null,
  starts_at timestamptz not null,
  place text not null,
  is_sample boolean not null default true
);

create table public.buddy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  interests text not null,
  availability text not null,
  language text not null,
  status text not null default 'new' check (status in ('new', 'matched', 'closed')),
  admin_note text,
  created_at timestamptz not null default now()
);

-- Aggregated nightly by app.refresh_topic_counts(). No message text, ever.
create table public.topic_counts (
  prefecture_code text not null,
  week date not null,
  topic text not null,
  distinct_users integer not null,
  primary key (prefecture_code, week, topic)
);
