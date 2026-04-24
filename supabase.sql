-- =============================================================================
-- Krypto Casino - Supabase schema
-- =============================================================================
-- Security model:
--   * Each user sees ONLY their own profile (including balance).
--   * Users can update cosmetic profile fields (username, wallet_address) but
--     NEVER the balance column directly. Balance is mutated exclusively by
--     trusted server code using the service-role key (which bypasses RLS).
--   * Each user sees ONLY their own game rounds and cannot insert / update /
--     delete them from the client. Game rows are written by the server.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique,
  wallet_address text unique,
  balance        numeric(20, 8) not null default 0 check (balance >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists profiles_wallet_address_idx
  on public.profiles (wallet_address);

-- -----------------------------------------------------------------------------
-- games
-- -----------------------------------------------------------------------------
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  game_type   text not null,
  wager       numeric(20, 8) not null check (wager >= 0),
  payout      numeric(20, 8) not null default 0 check (payout >= 0),
  server_seed text not null,
  client_seed text not null,
  nonce       bigint not null,
  result      jsonb,
  status      text not null default 'pending'
                check (status in ('pending', 'settled', 'voided')),
  created_at  timestamptz not null default now(),
  settled_at  timestamptz
);

create index if not exists games_user_id_idx on public.games (user_id);
create index if not exists games_status_idx  on public.games (status);
create unique index if not exists games_user_nonce_uniq
  on public.games (user_id, client_seed, nonce);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.games    enable row level security;

-- --- profiles policies ------------------------------------------------------

-- A user may read ONLY their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- A user may insert their own profile row once (e.g. on sign-up).
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- A user may update their OWN row, but NEVER the balance column.
-- The USING clause restricts which rows, the WITH CHECK clause ensures that
-- after the update the balance is unchanged vs. the prior row.
drop policy if exists "profiles_update_self_no_balance" on public.profiles;
create policy "profiles_update_self_no_balance"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and balance = (select p.balance from public.profiles p where p.id = auth.uid())
  );

-- Hard guarantee: even if a policy is ever misconfigured, a trigger blocks
-- any balance change that does not originate from the service role.
create or replace function public.prevent_balance_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.balance is distinct from old.balance
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'balance column can only be modified by the service role';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_prevent_balance_change on public.profiles;
create trigger profiles_prevent_balance_change
  before update on public.profiles
  for each row execute function public.prevent_balance_change();

-- No DELETE policy on profiles: clients cannot delete their own row.

-- --- games policies ---------------------------------------------------------

-- A user may read ONLY their own game rounds.
drop policy if exists "games_select_own" on public.games;
create policy "games_select_own"
  on public.games
  for select
  using (auth.uid() = user_id);

-- No INSERT / UPDATE / DELETE policies for authenticated users: all game
-- writes must go through the server (service-role key), which bypasses RLS.

-- -----------------------------------------------------------------------------
-- Revoke any default privileges so only RLS-granted access works.
-- -----------------------------------------------------------------------------
revoke all on public.profiles from anon, authenticated;
revoke all on public.games    from anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select                   on public.games    to authenticated;
