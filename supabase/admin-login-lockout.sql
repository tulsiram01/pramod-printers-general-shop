-- Admin-only password lockout for Supabase Auth Password Verification Attempt hook.
-- Run this migration in Supabase SQL Editor as a database owner.
-- Then enable Auth > Hooks > Password Verification Attempt and select
-- public.hook_admin_password_verification.

create table if not exists public.admin_login_lockouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  failed_attempts integer not null default 0
    check (failed_attempts >= 0 and failed_attempts <= 3),
  first_failed_at timestamptz,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.admin_login_lockouts enable row level security;

-- The table is not accessible through the public client API.
revoke all on table public.admin_login_lockouts from public, anon, authenticated;
grant all on table public.admin_login_lockouts to supabase_auth_admin;

create or replace function public.hook_admin_password_verification(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_valid boolean;
  v_attempts integer;
  v_first_failed_at timestamptz;
  v_locked_until timestamptz;
  v_now timestamptz := clock_timestamp();
begin
  v_user_id := nullif(event->>'user_id', '')::uuid;
  v_valid := coalesce((event->>'valid')::boolean, false);

  if v_user_id is null then
    return jsonb_build_object('decision', 'continue');
  end if;

  -- Apply this policy only to accounts explicitly designated as admins.
  if not exists (
    select 1
    from public.admin_users
    where user_id = v_user_id
  ) then
    return jsonb_build_object('decision', 'continue');
  end if;

  -- Serialize updates per admin so simultaneous attempts cannot bypass the
  -- threshold through a read/modify/write race.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select failed_attempts, first_failed_at, locked_until
    into v_attempts, v_first_failed_at, v_locked_until
  from public.admin_login_lockouts
  where user_id = v_user_id
  for update;

  -- A lock blocks even a correct password until the full 15-minute period ends.
  if v_locked_until is not null and v_locked_until > v_now then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'Login temporarily blocked. Please try again after 15 minutes.',
      'should_logout_user', false
    );
  end if;

  -- A successful password verification clears the consecutive-failure state.
  if v_valid then
    delete from public.admin_login_lockouts where user_id = v_user_id;
    return jsonb_build_object('decision', 'continue');
  end if;

  if not found then
    insert into public.admin_login_lockouts (
      user_id, failed_attempts, first_failed_at, locked_until, updated_at
    ) values (
      v_user_id, 1, v_now, null, v_now
    );
    return jsonb_build_object('decision', 'continue');
  end if;

  -- Start a fresh sequence if the previous 15-minute failure window elapsed.
  if v_first_failed_at is null or v_first_failed_at <= v_now - interval '15 minutes' then
    v_attempts := 1;
    v_first_failed_at := v_now;
  else
    v_attempts := coalesce(v_attempts, 0) + 1;
  end if;

  if v_attempts >= 3 then
    update public.admin_login_lockouts
    set failed_attempts = 3,
        first_failed_at = v_first_failed_at,
        locked_until = v_now + interval '15 minutes',
        updated_at = v_now
    where user_id = v_user_id;

    return jsonb_build_object(
      'decision', 'reject',
      'message', 'Login temporarily blocked. Please try again after 15 minutes.',
      'should_logout_user', false
    );
  end if;

  update public.admin_login_lockouts
  set failed_attempts = v_attempts,
      first_failed_at = v_first_failed_at,
      locked_until = null,
      updated_at = v_now
  where user_id = v_user_id;

  return jsonb_build_object('decision', 'continue');
end;
$function$;

revoke all on function public.hook_admin_password_verification(jsonb)
  from public, anon, authenticated;
grant execute on function public.hook_admin_password_verification(jsonb)
  to supabase_auth_admin;

comment on table public.admin_login_lockouts is
  'Private server-side failed password state for admin accounts; managed by the Supabase Auth hook.';
