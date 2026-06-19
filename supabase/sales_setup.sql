create table if not exists public.sales (
    id text primary key,
    firebase_id text unique,
    timestamp_ms bigint not null,
    total double precision not null default 0,
    total_profit double precision,
    items jsonb not null default '[]'::jsonb,
    operator text not null default '',
    payment_method text not null default '',
    updater text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists sales_timestamp_ms_idx on public.sales (timestamp_ms desc);
create index if not exists sales_payment_method_idx on public.sales (payment_method);

create or replace function public.set_sales_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
before update on public.sales
for each row
execute function public.set_sales_updated_at();

alter table public.sales enable row level security;

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

drop policy if exists "sales authenticated read" on public.sales;
create policy "sales authenticated read"
on public.sales
for select
to authenticated
using ((select public.is_supabase_or_firebase_project_jwt()) is true);

drop policy if exists "sales authenticated insert" on public.sales;
create policy "sales authenticated insert"
on public.sales
for insert
to authenticated
with check ((select public.is_supabase_or_firebase_project_jwt()) is true);

drop policy if exists "sales authenticated update" on public.sales;
create policy "sales authenticated update"
on public.sales
for update
to authenticated
using ((select public.is_supabase_or_firebase_project_jwt()) is true)
with check ((select public.is_supabase_or_firebase_project_jwt()) is true);

drop policy if exists "sales authenticated delete" on public.sales;
create policy "sales authenticated delete"
on public.sales
for delete
to authenticated
using ((select public.is_supabase_or_firebase_project_jwt()) is true);
