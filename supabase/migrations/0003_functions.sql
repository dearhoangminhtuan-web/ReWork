-- Privacy-preserving entry points (security definer, narrow on purpose).

-- FR-050/051: a worker answers their team's survey once. The answer row is
-- stored WITHOUT user id; participation is stored without the answer.
create or replace function app.submit_pulse(
  p_survey uuid, p_q1 int, p_q2 int, p_q3 int, p_q4 int, p_q5 int, p_free_text text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_team uuid;
begin
  if v_uid is null or app.my_role() <> 'worker' then
    raise exception 'not_a_worker' using errcode = '42501';
  end if;
  select team_id into v_team from public.pulse_surveys where id = p_survey;
  if v_team is null or v_team is distinct from app.my_team_id() then
    raise exception 'not_your_team' using errcode = '42501';
  end if;
  if not exists (select 1 from public.consents where user_id = v_uid and survey_aggregate) then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  insert into public.pulse_participation (survey_id, user_id) values (p_survey, v_uid); -- PK blocks duplicates
  insert into public.pulse_answers (survey_id, q1, q2, q3, q4, q5, free_text)
  values (p_survey, p_q1, p_q2, p_q3, p_q4, p_q5, nullif(btrim(coalesce(p_free_text, '')), ''));
end
$$;

-- FR-052: team-level averages, only when responses >= k. Below k the caller
-- learns nothing (not even the exact count).
create or replace function app.pulse_results(p_survey uuid)
returns table (
  shown boolean,
  response_count integer,
  avg_q1 numeric, avg_q2 numeric, avg_q3 numeric, avg_q4 numeric, avg_q5 numeric,
  free_text_count integer
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_emp uuid;
  v_n integer;
begin
  select employer_id into v_emp from public.pulse_surveys where id = p_survey;
  if v_emp is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not ((app.my_role() = 'employer' and app.my_employer_id() = v_emp) or app.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select count(*) into v_n from public.pulse_answers where survey_id = p_survey;
  if v_n < app.k_min() then
    return query select false, null::integer, null::numeric, null::numeric, null::numeric, null::numeric, null::numeric, null::integer;
    return;
  end if;
  return query
    select true, v_n,
      round(avg(a.q1), 2), round(avg(a.q2), 2), round(avg(a.q3), 2), round(avg(a.q4), 2), round(avg(a.q5), 2),
      count(a.free_text)::integer
    from public.pulse_answers a where a.survey_id = p_survey;
end
$$;

-- Nightly aggregate for the municipality dashboard (FR-070). Service only.
create or replace function app.refresh_topic_counts() returns integer
language plpgsql security definer set search_path = public as $$
declare v_rows integer;
begin
  insert into public.topic_counts (prefecture_code, week, topic, distinct_users)
  select p.prefecture_code, date_trunc('week', m.created_at)::date, m.topic, count(distinct m.user_id)
  from public.chat_messages m
  join public.profiles p on p.user_id = m.user_id
  where m.role = 'user' and m.topic is not null
  group by 1, 2, 3
  on conflict (prefecture_code, week, topic)
    do update set distinct_users = greatest(public.topic_counts.distinct_users, excluded.distinct_users);
  get diagnostics v_rows = row_count;
  return v_rows;
end
$$;

-- Retention (FR-025, §9.2). Service only; called by cron and opportunistically.
create or replace function app.purge_expired() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.chat_messages where created_at < now() - interval '30 days';
  delete from public.swap_requests where status = 'closed' and updated_at < now() - interval '6 months';
end
$$;

-- FR-006: delete everything linked to the calling worker. Pulse answers are
-- unlinked by design, so they cannot (and need not) be found.
create or replace function app.delete_my_data() returns void
language plpgsql security definer set search_path = public, auth as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  delete from public.chat_messages where user_id = v_uid;
  delete from public.comparisons where user_id = v_uid;
  delete from public.offers where user_id = v_uid;
  delete from public.swap_requests where worker_id = v_uid;
  delete from public.buddy_requests where user_id = v_uid;
  delete from public.pulse_participation where user_id = v_uid;
  delete from public.consents where user_id = v_uid;
  delete from public.profiles where user_id = v_uid;
  -- Local/demo auth shim. On Supabase the server also calls the Auth admin API.
  begin
    delete from auth.users where id = v_uid;
  exception when insufficient_privilege then
    null;
  end;
end
$$;

revoke execute on function app.refresh_topic_counts() from public, authenticated, anon;
revoke execute on function app.purge_expired() from public, authenticated, anon;
grant execute on function app.submit_pulse(uuid, int, int, int, int, int, text) to authenticated;
grant execute on function app.pulse_results(uuid) to authenticated;
grant execute on function app.delete_my_data() to authenticated;
grant execute on function app.k_min(), app.my_role(), app.my_employer_id(), app.my_support_org_id(),
  app.my_team_id(), app.my_prefecture(), app.is_admin() to authenticated;
