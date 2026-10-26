-- Local / demo shim. On Supabase these objects already exist and every block
-- below is a no-op. It lets the same migrations run on plain Postgres and on
-- PGlite (the in-process demo database).

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

create schema if not exists auth;

do $$
begin
  if not exists (
    select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users'
  ) then
    create table auth.users (
      id uuid primary key,
      email text,
      is_anonymous boolean not null default false,
      created_at timestamptz not null default now()
    );
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    execute $f$
      create function auth.uid() returns uuid
      language sql stable
      as $body$
        select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
      $body$
    $f$;
  end if;
end
$$;

grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
