-- Row-level security (PRD FR-003, §9.3). Hard rules:
--  * employers never read chat, offers, comparisons, swap requests, individual
--    pulse answers, or who answered;
--  * any aggregate shown to employers / municipalities needs k >= 5.

-- ---------------------------------------------------------------- helpers
create or replace function app.k_min() returns integer
language sql immutable as $$ select 5 $$;

create or replace function app.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function app.my_employer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select employer_id from public.profiles where user_id = auth.uid()
$$;

create or replace function app.my_support_org_id() returns uuid
language sql stable security definer set search_path = public as $$
  select support_org_id from public.profiles where user_id = auth.uid()
$$;

create or replace function app.my_team_id() returns uuid
language sql stable security definer set search_path = public as $$
  select team_id from public.profiles where user_id = auth.uid()
$$;

create or replace function app.my_prefecture() returns text
language sql stable security definer set search_path = public as $$
  select prefecture_code from public.profiles where user_id = auth.uid()
$$;

create or replace function app.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where user_id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------- grants
grant usage on schema public, app to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema app to authenticated;

-- Individual pulse answers are never readable by any app user. Writes go
-- through app.submit_pulse(); reads through app.pulse_results() (k >= 5).
revoke all on public.pulse_answers from authenticated, anon;
revoke insert, update, delete on public.pulse_participation from authenticated, anon;
revoke insert, update, delete on public.pulse_summaries from authenticated, anon;
revoke insert, update, delete on public.topic_counts from authenticated, anon;
-- Support orgs may only change the status of a request, never its contents.
revoke update on public.swap_requests from authenticated;
grant update (status, updated_at) on public.swap_requests to authenticated;
-- Nobody can rewrite chat history.
revoke update on public.chat_messages from authenticated;

-- ---------------------------------------------------------------- enable RLS
alter table public.support_orgs enable row level security;
alter table public.employers enable row level security;
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.offers enable row level security;
alter table public.comparisons enable row level security;
alter table public.job_listings enable row level security;
alter table public.swap_requests enable row level security;
alter table public.kb_articles enable row level security;
alter table public.chat_messages enable row level security;
alter table public.pulse_surveys enable row level security;
alter table public.pulse_participation enable row level security;
alter table public.pulse_answers enable row level security;
alter table public.pulse_summaries enable row level security;
alter table public.community_groups enable row level security;
alter table public.community_events enable row level security;
alter table public.buddy_requests enable row level security;
alter table public.topic_counts enable row level security;

-- ---------------------------------------------------------------- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (user_id = auth.uid() or app.is_admin());
-- Self-service sign-up can only create a worker profile (no self-escalation).
create policy profiles_insert on public.profiles for insert to authenticated
  with check (user_id = auth.uid() and role = 'worker');
create policy profiles_update on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and role = app.my_role());
create policy profiles_delete on public.profiles for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------- consents
create policy consents_own on public.consents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- offers / comparisons (owner only)
create policy offers_own on public.offers for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy comparisons_own on public.comparisons for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- directory data
create policy support_orgs_read on public.support_orgs for select to authenticated using (true);
create policy support_orgs_admin on public.support_orgs for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy employers_read on public.employers for select to authenticated using (true);
create policy employers_update_own on public.employers for update to authenticated
  using (app.my_role() = 'employer' and id = app.my_employer_id())
  with check (app.my_role() = 'employer' and id = app.my_employer_id());
create policy employers_admin on public.employers for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy teams_read on public.teams for select to authenticated using (true);
create policy teams_write_own on public.teams for all to authenticated
  using (app.my_role() = 'employer' and employer_id = app.my_employer_id())
  with check (app.my_role() = 'employer' and employer_id = app.my_employer_id());

create policy listings_read on public.job_listings for select to authenticated
  using (active or employer_id = app.my_employer_id() or app.is_admin());
create policy listings_write_own on public.job_listings for all to authenticated
  using ((app.my_role() = 'employer' and employer_id = app.my_employer_id()) or app.is_admin())
  with check ((app.my_role() = 'employer' and employer_id = app.my_employer_id()) or app.is_admin());

create policy kb_read on public.kb_articles for select to authenticated using (true);
create policy kb_admin on public.kb_articles for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy groups_read on public.community_groups for select to authenticated using (true);
create policy groups_admin on public.community_groups for all to authenticated
  using (app.is_admin()) with check (app.is_admin());
create policy events_read on public.community_events for select to authenticated using (true);
create policy events_admin on public.community_events for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

-- ---------------------------------------------------------------- swap requests
-- Visible to the worker and to *their* support org only. Never to employers.
create policy swap_select on public.swap_requests for select to authenticated
  using (
    worker_id = auth.uid()
    or (app.my_role() = 'support_org' and support_org_id = app.my_support_org_id())
  );
create policy swap_insert on public.swap_requests for insert to authenticated
  with check (
    worker_id = auth.uid()
    and app.my_role() = 'worker'
    and support_org_id = app.my_support_org_id()
    and exists (
      select 1 from public.consents c
      where c.user_id = auth.uid() and c.share_swap_with_org
    )
  );
create policy swap_update_org on public.swap_requests for update to authenticated
  using (app.my_role() = 'support_org' and support_org_id = app.my_support_org_id())
  with check (app.my_role() = 'support_org' and support_org_id = app.my_support_org_id());
create policy swap_delete_own on public.swap_requests for delete to authenticated
  using (worker_id = auth.uid());

-- ---------------------------------------------------------------- chat (owner only, no admin read)
create policy chat_own_select on public.chat_messages for select to authenticated
  using (user_id = auth.uid());
create policy chat_own_insert on public.chat_messages for insert to authenticated
  with check (user_id = auth.uid());
create policy chat_own_delete on public.chat_messages for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------- pulse
create policy pulse_surveys_select on public.pulse_surveys for select to authenticated
  using (
    (app.my_role() = 'employer' and employer_id = app.my_employer_id())
    or team_id = app.my_team_id()
    or app.is_admin()
  );
create policy pulse_surveys_insert on public.pulse_surveys for insert to authenticated
  with check (
    app.my_role() = 'employer'
    and employer_id = app.my_employer_id()
    and exists (select 1 from public.teams t where t.id = team_id and t.employer_id = app.my_employer_id())
  );

create policy pulse_participation_own on public.pulse_participation for select to authenticated
  using (user_id = auth.uid());

create policy pulse_summaries_select on public.pulse_summaries for select to authenticated
  using (
    exists (
      select 1 from public.pulse_surveys s
      where s.id = survey_id
        and ((app.my_role() = 'employer' and s.employer_id = app.my_employer_id()) or app.is_admin())
    )
  );
-- pulse_answers: RLS on + no grants = unreadable. (No policy on purpose.)

-- ---------------------------------------------------------------- buddy requests
create policy buddy_own on public.buddy_requests for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy buddy_admin_select on public.buddy_requests for select to authenticated
  using (app.is_admin());
create policy buddy_admin_update on public.buddy_requests for update to authenticated
  using (app.is_admin()) with check (app.is_admin());

-- ---------------------------------------------------------------- topic counts (k >= 5 in the policy itself)
create policy topic_counts_select on public.topic_counts for select to authenticated
  using (
    distinct_users >= app.k_min()
    and (
      (app.my_role() = 'municipality' and prefecture_code = app.my_prefecture())
      or app.is_admin()
    )
  );
