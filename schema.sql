-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run

-- 1) Profiles: one row per user, role is 'customer' unless YOU change it to 'partner'
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','partner'))
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id) values (new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_partner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'partner')
$$;

-- 2) Orders
create table public.orders (
  id bigint generated always as identity primary key,
  customer_id uuid not null default auth.uid() references auth.users(id),
  partner_id uuid references auth.users(id),
  title text not null, address text not null, postal text not null,
  city text not null, region text not null, slot text not null,
  pay_method text not null, currency text not null,
  subtotal numeric not null, total numeric not null,
  status int not null default 0 check (status between 0 and 4),
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;

create policy "customer reads own" on public.orders
  for select to authenticated using (customer_id = auth.uid());
create policy "customer creates own" on public.orders
  for insert to authenticated
  with check (customer_id = auth.uid() and status = 0 and partner_id is null);
create policy "partner reads open and own" on public.orders
  for select to authenticated
  using (public.is_partner() and (partner_id = auth.uid() or (partner_id is null and status = 0)));
create policy "partner updates" on public.orders
  for update to authenticated
  using (public.is_partner() and (partner_id = auth.uid() or (partner_id is null and status = 0)))
  with check (public.is_partner() and partner_id = auth.uid());

-- 3) Live updates for the tracker
alter publication supabase_realtime add table public.orders;

-- 4) Make YOURSELF a partner (after you sign up on the site). Replace the email:
-- update public.profiles set role = 'partner'
--   where id = (select id from auth.users where email = 'you@example.com');