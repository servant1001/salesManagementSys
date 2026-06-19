create extension if not exists pgcrypto;

create table if not exists public.vendors (
    id text primary key,
    firebase_id text unique,
    vendor_id text not null unique,
    vendor_name text not null,
    contact text not null default '',
    website text not null default '',
    note text not null default '',
    created_by text not null,
    updated_by text not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists vendors_vendor_id_idx on public.vendors (vendor_id);
create index if not exists vendors_vendor_name_idx on public.vendors (vendor_name);

alter table public.vendors enable row level security;

create or replace function public.is_valid_supabase_or_firebase_vendor_jwt()
returns boolean
language sql
stable
returns null on null input
return (
    (auth.jwt()->>'iss' = 'https://rowbcfjiqmetzthuebqx.supabase.co/auth/v1')
    or
    (
        auth.jwt()->>'iss' = 'https://securetoken.google.com/sales-management-system-82d97'
        and auth.jwt()->>'aud' = 'sales-management-system-82d97'
        and auth.jwt()->>'role' = 'authenticated'
    )
);

drop policy if exists "vendors authenticated read" on public.vendors;
create policy "vendors authenticated read"
on public.vendors
for select
to authenticated
using ((select public.is_valid_supabase_or_firebase_vendor_jwt()) is true);

drop policy if exists "vendors authenticated insert" on public.vendors;
create policy "vendors authenticated insert"
on public.vendors
for insert
to authenticated
with check ((select public.is_valid_supabase_or_firebase_vendor_jwt()) is true);

drop policy if exists "vendors authenticated update" on public.vendors;
create policy "vendors authenticated update"
on public.vendors
for update
to authenticated
using ((select public.is_valid_supabase_or_firebase_vendor_jwt()) is true)
with check ((select public.is_valid_supabase_or_firebase_vendor_jwt()) is true);

drop policy if exists "vendors authenticated delete" on public.vendors;
create policy "vendors authenticated delete"
on public.vendors
for delete
to authenticated
using ((select public.is_valid_supabase_or_firebase_vendor_jwt()) is true);
