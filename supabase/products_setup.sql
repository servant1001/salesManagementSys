create table if not exists public.products (
    id text primary key,
    firebase_id text unique,
    gtin text,
    code text not null unique,
    name text not null,
    price double precision not null default 0,
    selling_price double precision not null default 0,
    cost double precision not null default 0,
    stock integer not null default 0,
    supplier_name text not null default '',
    supplier_code text not null default '',
    image_url text not null default '',
    website text not null default '',
    note text not null default '',
    created_ms bigint not null,
    updated_ms bigint,
    created_by text,
    updated_by text
);

alter table public.products alter column gtin drop not null;
alter table public.products drop constraint if exists products_gtin_key;

create unique index if not exists products_gtin_unique_idx
on public.products (gtin)
where gtin is not null and btrim(gtin) <> '';

create index if not exists products_gtin_idx on public.products (gtin);
create index if not exists products_code_idx on public.products (code);
create index if not exists products_supplier_code_idx on public.products (supplier_code);
create index if not exists products_created_ms_idx on public.products (created_ms desc);

alter table public.products enable row level security;

create or replace function public.is_supabase_or_firebase_project_jwt()
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
    )
);

drop policy if exists "products authenticated read" on public.products;
create policy "products authenticated read"
on public.products
for select
to authenticated
using ((select public.is_supabase_or_firebase_project_jwt()) is true);

drop policy if exists "products authenticated insert" on public.products;
create policy "products authenticated insert"
on public.products
for insert
to authenticated
with check ((select public.is_supabase_or_firebase_project_jwt()) is true);

drop policy if exists "products authenticated update" on public.products;
create policy "products authenticated update"
on public.products
for update
to authenticated
using ((select public.is_supabase_or_firebase_project_jwt()) is true)
with check ((select public.is_supabase_or_firebase_project_jwt()) is true);

drop policy if exists "products authenticated delete" on public.products;
create policy "products authenticated delete"
on public.products
for delete
to authenticated
using ((select public.is_supabase_or_firebase_project_jwt()) is true);
