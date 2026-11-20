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

-- Remove the previous broad policies before installing restricted policies.
drop policy if exists "Public can view published designs" on public.designs;
drop policy if exists "Authenticated users can view all designs" on public.designs;
drop policy if exists "Authenticated users can insert designs" on public.designs;
drop policy if exists "Authenticated users can update designs" on public.designs;
drop policy if exists "Authenticated users can delete designs" on public.designs;
drop policy if exists "Public can read published designs" on public.designs;
drop policy if exists "Admins can read all designs" on public.designs;
drop policy if exists "Admins can insert designs" on public.designs;
drop policy if exists "Admins can update designs" on public.designs;
drop policy if exists "Admins can delete designs" on public.designs;

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
