create extension if not exists pgcrypto;
create table if not exists public.designs (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 category text not null default 'other',
 image_url text not null,
 description text,
 is_published boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.designs enable row level security;
create policy "Public can view published designs" on public.designs for select using (is_published = true);
create policy "Authenticated users can view all designs" on public.designs for select to authenticated using (true);
create policy "Authenticated users can insert designs" on public.designs for insert to authenticated with check (true);
create policy "Authenticated users can update designs" on public.designs for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete designs" on public.designs for delete to authenticated using (true);
