-- Pramod Printers: designs schema and administrator-only access.
-- Run this script in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'अन्य',
  image_url text not null,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.designs enable row level security;
alter table public.admin_users enable row level security;

-- SECURITY DEFINER avoids RLS recursion while checking admin membership.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Remove every existing policy on these tables so an older permissive
-- policy cannot accidentally OR-bypass the administrator restrictions.
do $
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('designs', 'admin_users')
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end
$;

-- Keep API table privileges explicit; RLS still decides which rows/actions apply.
revoke all on table public.designs from anon, authenticated;
grant select on table public.designs to anon, authenticated;
grant insert, update, delete on table public.designs to authenticated;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

create policy "Public can read published designs"
on public.designs for select
to anon, authenticated
using (is_published = true);

create policy "Admins can read all designs"
on public.designs for select
to authenticated
using ((select public.is_admin()));

create policy "Admins can insert designs"
on public.designs for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can update designs"
on public.designs for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete designs"
on public.designs for delete
to authenticated
using ((select public.is_admin()));

-- Admin membership is readable only by the matching signed-in user.
drop policy if exists "Users can read own admin membership" on public.admin_users;
create policy "Users can read own admin membership"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()));

-- No client-side INSERT/UPDATE/DELETE policy is granted on admin_users.
-- Bootstrap an administrator after creating the user in Supabase Auth:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
-- on conflict (user_id) do nothing;
