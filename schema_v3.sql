-- Run ONCE in Supabase: SQL Editor -> New query -> paste -> Run (after schema.sql and schema_v2.sql)

-- 1) Photo storage (public bucket, max 2 MB images, partners write only to their own folder)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos','photos',true,2097152,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
create policy "public read photos" on storage.objects for select to anon, authenticated using (bucket_id = 'photos');
create policy "partners upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "partners delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.partners add column logo_url text;
grant update (logo_url) on public.partners to authenticated;
alter table public.partner_services add column photo_url text;

-- 2) Public partner profile (no phone number) for approved partners
create view public.public_partners as
  select id, business_name, city, region, about, logo_url from public.partners where approved;
grant select on public.public_partners to anon, authenticated;

-- 3) Reviews: only the customer of a COMPLETED order, one per order
create table public.reviews (
  id bigint generated always as identity primary key,
  order_id bigint not null unique references public.orders(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  customer_id uuid not null default auth.uid() references auth.users(id),
  author text not null default 'Customer',
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "anyone reads reviews" on public.reviews for select to anon, authenticated using (true);
create policy "customer reviews own completed order" on public.reviews for insert to authenticated
  with check (customer_id = auth.uid() and exists (
    select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()
      and o.status = 4 and o.partner_id = reviews.partner_id));

-- 4) Workers (assigned people): own login linked by an invite code
alter table public.team_members
  add column user_id uuid unique references auth.users(id) on delete set null,
  add column code text not null default upper(substr(md5(random()::text),1,6)),
  add column online boolean not null default false,
  add column last_seen timestamptz;
create policy "worker reads own row" on public.team_members for select to authenticated using (user_id = auth.uid());
create policy "worker updates own row" on public.team_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.team_members from authenticated;
grant update (name, phone, skill, active, online, last_seen) on public.team_members to authenticated;

create function public.claim_member(p_code text) returns text
language plpgsql security definer set search_path = '' as $$
declare m public.team_members;
begin
  update public.team_members set user_id = auth.uid()
    where code = upper(trim(p_code)) and user_id is null returning * into m;
  if m.id is null then raise exception 'Invalid or already used code'; end if;
  return m.name;
end $$;
revoke execute on function public.claim_member(text) from public, anon;
grant execute on function public.claim_member(text) to authenticated;

-- 5) Orders: worker acceptance + what a worker may see and change
alter table public.orders add column worker_accepted boolean not null default false;
create function public.worker_of(oid bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.orders o join public.team_members m on m.id = o.assigned_to
                where o.id = oid and m.user_id = auth.uid())
$$;
create policy "worker reads assigned" on public.orders for select to authenticated using (public.worker_of(id));
create policy "worker updates assigned" on public.orders for update to authenticated
  using (public.worker_of(id))
  with check (public.worker_of(id) and partner_id = (select m.partner_id from public.team_members m where m.user_id = auth.uid()));
grant update (worker_accepted) on public.orders to authenticated;

-- 6) Live location (one row per active job, deleted when the job completes)
create table public.locations (
  order_id bigint primary key references public.orders(id) on delete cascade,
  worker_id uuid not null default auth.uid() references auth.users(id),
  lat double precision not null, lng double precision not null,
  updated_at timestamptz not null default now()
);
alter table public.locations enable row level security;
create function public.can_view_order(oid bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.orders where id = oid and (customer_id = auth.uid() or partner_id = auth.uid()))
$$;
create policy "see location of own orders" on public.locations for select to authenticated
  using (public.can_view_order(order_id) or worker_id = auth.uid());
create policy "worker shares location" on public.locations for insert to authenticated
  with check (worker_id = auth.uid() and public.worker_of(order_id));
create policy "worker updates location" on public.locations for update to authenticated
  using (worker_id = auth.uid()) with check (worker_id = auth.uid() and public.worker_of(order_id));
create policy "worker deletes location" on public.locations for delete to authenticated using (worker_id = auth.uid());

-- 7) Live updates
alter publication supabase_realtime add table public.locations, public.team_members;