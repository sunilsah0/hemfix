-- Safe to run again if it failed before. Needs schema.sql, schema_v2.sql and schema_v3.sql first.
-- Run in Supabase SQL Editor (after schema.sql, schema_v2.sql, schema_v3.sql)

-- Admins: only listed users can use the admin dashboard. No policy = nobody can read this table via the API.
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admins where user_id = auth.uid())
$$;

-- Admin may read all orders and remove reviews
drop policy if exists "admin reads orders" on public.orders;
create policy "admin reads orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "admin deletes reviews" on public.reviews;
create policy "admin deletes reviews" on public.reviews for delete to authenticated using (public.is_admin());

-- Admin list of partners with e-mail and service count
create or replace function public.admin_partners() returns table (
  id uuid, business_name text, phone text, region text, city text, about text,
  approved boolean, created_at timestamptz, email text, services bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return query
    select p.id, p.business_name, p.phone, p.region, p.city, p.about, p.approved, p.created_at,
           u.email::text, (select count(*) from public.partner_services s where s.partner_id = p.id)
    from public.partners p join auth.users u on u.id = p.id
    order by p.approved, p.created_at desc;
end $$;

create or replace function public.admin_set_approval(pid uuid, ok boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.partners set approved = ok where id = pid;
end $$;

create or replace function public.admin_delete_partner(pid uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  delete from public.partners where id = pid;
end $$;

revoke execute on function public.admin_partners() from public, anon;
revoke execute on function public.admin_set_approval(uuid, boolean) from public, anon;
revoke execute on function public.admin_delete_partner(uuid) from public, anon;
grant execute on function public.admin_partners() to authenticated;
grant execute on function public.admin_set_approval(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_partner(uuid) to authenticated;

-- MAKE YOURSELF ADMIN (the only SQL you will ever need again).
-- 1) Open admin.html and click "Create account" (or use an existing account).
-- 2) Replace the e-mail below with yours and run just this line:
-- insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';