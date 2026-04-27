-- GMB Scraper – Supabase schema
-- Run this once in the SQL editor of a NEW Supabase project (do NOT mix with the casino project).
-- The Service Role key bypasses RLS, so we don't need policies for this internal tool.

create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  keyword       text not null,
  location      text not null,
  country_code  text not null default 'DE',
  language      text not null default 'de',
  max_results   int  not null,
  apify_run_id      text,
  apify_dataset_id  text,
  status        text not null default 'pending',
  error         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.places (
  id            bigserial primary key,
  job_id        uuid not null references public.jobs(id) on delete cascade,
  place_id      text,
  name          text,
  category      text,
  address       text,
  city          text,
  postal_code   text,
  country_code  text,
  phone         text,
  email         text,
  website       text,
  domain        text,
  rating        real,
  review_count  int,
  lat           double precision,
  lng           double precision,
  maps_url      text,
  raw           jsonb,
  unique (job_id, place_id)
);
create index if not exists places_job_idx    on public.places (job_id);
create index if not exists places_domain_idx on public.places (domain);

create table if not exists public.domain_checks (
  domain        text primary key,
  dns_status    text,
  rdap_status   text,
  is_available  boolean,
  checked_at    timestamptz not null default now(),
  error         text
);

-- Enable RLS but don't define policies. Only the Service Role key (server-side)
-- will be used to read/write — anon/authenticated keys cannot reach this data.
alter table public.jobs           enable row level security;
alter table public.places         enable row level security;
alter table public.domain_checks  enable row level security;
