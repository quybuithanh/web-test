alter table public.products
add column if not exists sold boolean not null default false;
