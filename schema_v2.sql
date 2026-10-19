-- Run ONCE in Supabase: SQL Editor -> New query -> paste -> Run (after schema.sql)

-- Partners register themselves, but YOU approve them (approved = true)
create table public.partners (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  business_name text not null, phone text not null,
  region text not null, city text not null, about text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.partners enable row level security;
create policy "partner reads own" on public.partners for select to authenticated using (id = auth.uid());
create policy "partner registers self" on public.partners for insert to authenticated
  with check (id = auth.uid() and approved = false);
create policy "partner edits own" on public.partners for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.partners from authenticated;
grant update (business_name, phone, about, city, region) on public.partners to authenticated;

-- Services partners sell
create table public.partner_services (
  id bigint generated always as identity primary key,
  partner_id uuid not null default auth.uid() references public.partners(id) on delete cascade,
  partner_name text not null,
  name text not null, category int not null check (category between 0 and 5),
  price_sek numeric not null check (price_sek > 0), minutes int not null check (minutes >= 15),
  features text, active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.partner_services enable row level security;

create or replace function public.is_approved(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.partners where id = pid and approved)
$$;
create policy "everyone sees active approved services" on public.partner_services
  for select to anon, authenticated using (active and public.is_approved(partner_id));
create policy "partner manages own services" on public.partner_services
  for all to authenticated using (partner_id = auth.uid()) with check (partner_id = auth.uid());

-- People a partner can assign to jobs
create table public.team_members (
  id bigint generated always as identity primary key,
  partner_id uuid not null default auth.uid() references public.partners(id) on delete cascade,
  name text not null, phone text, skill text, active boolean not null default true
);
alter table public.team_members enable row level security;
create policy "partner manages own team" on public.team_members
  for all to authenticated using (partner_id = auth.uid()) with check (partner_id = auth.uid());

-- Orders: who is assigned, and partner rules now use the partners table
alter table public.orders add column assigned_to bigint references public.team_members(id) on delete set null;
alter table public.orders add column assigned_name text;

create or replace function public.is_partner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.partners where id = auth.uid() and approved)
$$;
create or replace function public.my_region() returns text
language sql stable security definer set search_path = '' as $$
  select region from public.partners where id = auth.uid() and approved
$$;
drop policy "partner reads open and own" on public.orders;
drop policy "partner updates" on public.orders;
create policy "partner reads open and own" on public.orders for select to authenticated
  using (public.is_partner() and (partner_id = auth.uid()
    or (partner_id is null and status = 0 and region = public.my_region())));
create policy "partner updates" on public.orders for update to authenticated
  using (public.is_partner() and (partner_id = auth.uid()
    or (partner_id is null and status = 0 and region = public.my_region())))
  with check (public.is_partner() and partner_id = auth.uid());
-- Partners may only change these columns (not prices or addresses)
revoke update on public.orders from authenticated;
grant update (status, partner_id, assigned_to, assigned_name) on public.orders to authenticated;

-- APPROVE a partner (replace the business name):
-- update public.partners set approved = true where business_name = 'My Business';