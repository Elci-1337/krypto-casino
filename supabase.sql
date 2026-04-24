-- =============================================================================
-- Krypto Casino - Supabase schema
-- =============================================================================
-- Security model:
--   * Users see ONLY their own profile + game rows via RLS.
--   * The `balance` column is untouchable from the client. Two independent
--     gates enforce this:
--       1. An UPDATE policy whose WITH CHECK clause pins the new balance to
--          the old balance for authenticated users.
--       2. A SECURITY DEFINER trigger that raises unless the caller's JWT
--          claim `role` is `service_role`.
--   * All balance mutations run through three SECURITY DEFINER RPCs that
--     are only executable by the service_role (EXECUTE revoked from anon /
--     authenticated). Each RPC performs its work in a single transaction
--     with row-level locking to eliminate race conditions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
-- `balance` uses numeric(20, 9) so SOL <-> lamport conversion is loss-less
-- (1 lamport = 1e-9 SOL).
create table if not exists public.profiles (
  id             uuid primary key default gen_random_uuid(),
  auth_user_id   uuid unique references auth.users(id) on delete cascade,
  username       text unique,
  wallet_address text unique,
  balance        numeric(20, 9) not null default 0 check (balance >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists profiles_wallet_address_idx
  on public.profiles (wallet_address);
create index if not exists profiles_auth_user_id_idx
  on public.profiles (auth_user_id);

-- -----------------------------------------------------------------------------
-- games
-- -----------------------------------------------------------------------------
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  game_type   text not null,
  wager       numeric(20, 9) not null check (wager >= 0),
  payout      numeric(20, 9) not null default 0 check (payout >= 0),
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
-- deposits
-- -----------------------------------------------------------------------------
-- Every successful deposit is pinned to the on-chain Solana signature as its
-- primary key. The credit_deposit RPC relies on this uniqueness for idempotent
-- retries: re-submitting the same signature is a no-op.
create table if not exists public.deposits (
  signature  text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(20, 9) not null check (amount > 0),
  slot       bigint,
  created_at timestamptz not null default now()
);

create index if not exists deposits_user_id_idx on public.deposits (user_id);

-- -----------------------------------------------------------------------------
-- withdrawals
-- -----------------------------------------------------------------------------
-- Two-step lifecycle:
--   1. request_withdrawal: debit balance + insert pending row (atomic).
--   2. On-chain transfer runs outside of Postgres.
--   3. mark_withdrawal_completed on success, mark_withdrawal_failed on error
--      (the failure handler refunds the balance, also atomic).
create table if not exists public.withdrawals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  amount              numeric(20, 9) not null check (amount > 0),
  destination_address text not null,
  signature           text unique,
  status              text not null default 'pending'
                        check (status in ('pending', 'completed', 'failed')),
  error               text,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

create index if not exists withdrawals_user_id_idx on public.withdrawals (user_id);
create index if not exists withdrawals_status_idx  on public.withdrawals (status);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.games       enable row level security;
alter table public.deposits    enable row level security;
alter table public.withdrawals enable row level security;

-- --- profiles policies ------------------------------------------------------

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = auth_user_id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  with check (auth.uid() = auth_user_id);

-- User may update their own row except the balance column.
drop policy if exists "profiles_update_self_no_balance" on public.profiles;
create policy "profiles_update_self_no_balance"
  on public.profiles
  for update
  using (auth.uid() = auth_user_id)
  with check (
    auth.uid() = auth_user_id
    and balance = (
      select p.balance from public.profiles p where p.auth_user_id = auth.uid()
    )
  );

-- Belt-and-braces: a SECURITY DEFINER trigger rejects any balance mutation
-- whose JWT role is not service_role. This also catches bugs in RLS.
create or replace function public.prevent_balance_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.balance is distinct from old.balance
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'balance column can only be modified via service_role RPCs';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_prevent_balance_change on public.profiles;
create trigger profiles_prevent_balance_change
  before update on public.profiles
  for each row execute function public.prevent_balance_change();

-- --- games policies ---------------------------------------------------------

drop policy if exists "games_select_own" on public.games;
create policy "games_select_own"
  on public.games
  for select
  using (
    user_id in (
      select p.id from public.profiles p where p.auth_user_id = auth.uid()
    )
  );

-- No INSERT / UPDATE / DELETE policies for clients: all writes go through
-- the service-role RPCs below.

-- --- deposits policies ------------------------------------------------------

drop policy if exists "deposits_select_own" on public.deposits;
create policy "deposits_select_own"
  on public.deposits
  for select
  using (
    user_id in (
      select p.id from public.profiles p where p.auth_user_id = auth.uid()
    )
  );

-- No write policies for clients — credit_deposit is the only writer.

-- --- withdrawals policies ---------------------------------------------------

drop policy if exists "withdrawals_select_own" on public.withdrawals;
create policy "withdrawals_select_own"
  on public.withdrawals
  for select
  using (
    user_id in (
      select p.id from public.profiles p where p.auth_user_id = auth.uid()
    )
  );

-- No write policies for clients — request_withdrawal / mark_withdrawal_* own
-- the write path, and they only run under service_role.

-- -----------------------------------------------------------------------------
-- Table-level privileges. Revoke default grants, hand back the minimum.
-- -----------------------------------------------------------------------------
revoke all on public.profiles    from anon, authenticated;
revoke all on public.games       from anon, authenticated;
revoke all on public.deposits    from anon, authenticated;
revoke all on public.withdrawals from anon, authenticated;

grant select, insert, update on public.profiles    to authenticated;
grant select                   on public.games       to authenticated;
grant select                   on public.deposits    to authenticated;
grant select                   on public.withdrawals to authenticated;

-- =============================================================================
-- RPCs (Stored Procedures)
-- =============================================================================
-- All three are SECURITY DEFINER and EXECUTE-revoked from anon / authenticated
-- so only the service-role key (used by the Next.js server) can invoke them.
-- Each RPC is atomic: the function body runs in a single transaction and the
-- profile row is locked with SELECT ... FOR UPDATE to prevent double-spend.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ensure_profile(wallet)
--   Returns the profile id for a given wallet address, creating a stub if
--   necessary. Used by the server when a wallet first interacts with the
--   casino.
-- -----------------------------------------------------------------------------
create or replace function public.ensure_profile(p_wallet text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_wallet is null or length(p_wallet) = 0 then
    raise exception 'wallet address required';
  end if;

  select id into v_id from public.profiles where wallet_address = p_wallet;
  if v_id is not null then return v_id; end if;

  insert into public.profiles (wallet_address)
  values (p_wallet)
  on conflict (wallet_address) do update set updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- start_game(user, type, wager, seeds)
--   Atomically: lock profile, verify balance >= wager, debit wager, insert a
--   new pending game row. Returns the newly created game id.
-- -----------------------------------------------------------------------------
create or replace function public.start_game(
  p_user_id     uuid,
  p_game_type   text,
  p_wager       numeric,
  p_server_seed text,
  p_client_seed text,
  p_nonce       bigint
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_game_id uuid;
begin
  if p_wager <= 0 then
    raise exception 'wager must be positive';
  end if;

  -- Lock the profile row for the remainder of this transaction so two
  -- concurrent start_game calls cannot both see the pre-debit balance.
  select balance into v_balance
    from public.profiles
    where id = p_user_id
    for update;

  if v_balance is null then
    raise exception 'profile % not found', p_user_id;
  end if;

  if v_balance < p_wager then
    raise exception 'insufficient balance: have %, need %', v_balance, p_wager
      using errcode = 'P0001';
  end if;

  update public.profiles
     set balance = balance - p_wager
   where id = p_user_id;

  insert into public.games (
    user_id, game_type, wager, server_seed, client_seed, nonce, status
  ) values (
    p_user_id, p_game_type, p_wager, p_server_seed, p_client_seed, p_nonce, 'pending'
  )
  returning id into v_game_id;

  return v_game_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- safe_payout(game_id, payout, result)
--   Atomically settle a game: lock the game row, verify it is still pending,
--   mark it settled, credit the player's balance by `payout`. No-op if the
--   game is already settled (idempotent retries).
--   Returns the updated balance.
-- -----------------------------------------------------------------------------
create or replace function public.safe_payout(
  p_game_id uuid,
  p_payout  numeric,
  p_result  jsonb
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_status  text;
  v_balance numeric;
begin
  if p_payout < 0 then
    raise exception 'payout must be non-negative';
  end if;

  -- Lock the game row; second concurrent caller will block here and then
  -- see status='settled' and exit.
  select user_id, status into v_user_id, v_status
    from public.games
    where id = p_game_id
    for update;

  if v_user_id is null then
    raise exception 'game % not found', p_game_id;
  end if;

  if v_status = 'settled' then
    -- Idempotent: return the current balance without mutating state.
    select balance into v_balance from public.profiles where id = v_user_id;
    return v_balance;
  end if;

  if v_status <> 'pending' then
    raise exception 'game % is in terminal state %', p_game_id, v_status;
  end if;

  update public.games
     set status     = 'settled',
         payout     = p_payout,
         result     = p_result,
         settled_at = now()
   where id = p_game_id;

  update public.profiles
     set balance = balance + p_payout
   where id = v_user_id
   returning balance into v_balance;

  return v_balance;
end;
$$;

-- -----------------------------------------------------------------------------
-- credit_deposit(signature, wallet, amount, slot)
--   Idempotent: uses `deposits.signature` as the primary-key guard. Inserts
--   the deposit row and credits the player's balance in the same transaction.
--   Returns the updated balance.
-- -----------------------------------------------------------------------------
create or replace function public.credit_deposit(
  p_signature text,
  p_wallet    text,
  p_amount    numeric,
  p_slot      bigint
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'deposit amount must be positive';
  end if;

  v_user_id := public.ensure_profile(p_wallet);

  -- Uniqueness on `signature` makes this idempotent. A duplicate submission
  -- hits the on conflict branch and simply returns the current balance.
  insert into public.deposits (signature, user_id, amount, slot)
  values (p_signature, v_user_id, p_amount, p_slot)
  on conflict (signature) do nothing;

  if not found then
    select balance into v_balance from public.profiles where id = v_user_id;
    return v_balance;
  end if;

  update public.profiles
     set balance = balance + p_amount
   where id = v_user_id
   returning balance into v_balance;

  return v_balance;
end;
$$;

-- -----------------------------------------------------------------------------
-- request_withdrawal(user, amount, destination)
--   Atomically: lock profile, verify balance >= amount, debit balance, insert
--   pending withdrawal. Returns the new withdrawal id. The on-chain transfer
--   is kicked off by the Node server AFTER this returns.
-- -----------------------------------------------------------------------------
create or replace function public.request_withdrawal(
  p_user_id     uuid,
  p_amount      numeric,
  p_destination text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance      numeric;
  v_withdraw_id  uuid;
begin
  if p_amount <= 0 then
    raise exception 'withdrawal amount must be positive';
  end if;
  if coalesce(length(p_destination), 0) = 0 then
    raise exception 'destination address required';
  end if;

  select balance into v_balance
    from public.profiles
    where id = p_user_id
    for update;

  if v_balance is null then
    raise exception 'profile % not found', p_user_id;
  end if;

  if v_balance < p_amount then
    raise exception 'insufficient balance: have %, need %', v_balance, p_amount
      using errcode = 'P0001';
  end if;

  update public.profiles
     set balance = balance - p_amount
   where id = p_user_id;

  insert into public.withdrawals (user_id, amount, destination_address, status)
  values (p_user_id, p_amount, p_destination, 'pending')
  returning id into v_withdraw_id;

  return v_withdraw_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- mark_withdrawal_completed(id, signature)
--   Flip status pending -> completed and record the on-chain signature. Uses
--   the signature uniqueness + status lock to be safe against retries.
-- -----------------------------------------------------------------------------
create or replace function public.mark_withdrawal_completed(
  p_withdrawal_id uuid,
  p_signature     text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
    from public.withdrawals
    where id = p_withdrawal_id
    for update;

  if v_status is null then
    raise exception 'withdrawal % not found', p_withdrawal_id;
  end if;
  if v_status = 'completed' then
    return; -- idempotent
  end if;
  if v_status <> 'pending' then
    raise exception 'withdrawal % is in terminal state %', p_withdrawal_id, v_status;
  end if;

  update public.withdrawals
     set status       = 'completed',
         signature    = p_signature,
         completed_at = now(),
         error        = null
   where id = p_withdrawal_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- mark_withdrawal_failed(id, error)
--   Flip status pending -> failed AND refund the user's balance, atomically.
-- -----------------------------------------------------------------------------
create or replace function public.mark_withdrawal_failed(
  p_withdrawal_id uuid,
  p_error         text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status  text;
  v_user_id uuid;
  v_amount  numeric;
begin
  select user_id, amount, status into v_user_id, v_amount, v_status
    from public.withdrawals
    where id = p_withdrawal_id
    for update;

  if v_user_id is null then
    raise exception 'withdrawal % not found', p_withdrawal_id;
  end if;
  if v_status <> 'pending' then
    return; -- only pending withdrawals can be failed + refunded
  end if;

  update public.withdrawals
     set status       = 'failed',
         error        = p_error,
         completed_at = now()
   where id = p_withdrawal_id;

  -- Refund.
  update public.profiles
     set balance = balance + v_amount
   where id = v_user_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Function execute privileges
-- -----------------------------------------------------------------------------
revoke all on function public.ensure_profile(text)                                   from public, anon, authenticated;
revoke all on function public.start_game(uuid, text, numeric, text, text, bigint)    from public, anon, authenticated;
revoke all on function public.safe_payout(uuid, numeric, jsonb)                      from public, anon, authenticated;
revoke all on function public.credit_deposit(text, text, numeric, bigint)            from public, anon, authenticated;
revoke all on function public.request_withdrawal(uuid, numeric, text)                from public, anon, authenticated;
revoke all on function public.mark_withdrawal_completed(uuid, text)                  from public, anon, authenticated;
revoke all on function public.mark_withdrawal_failed(uuid, text)                     from public, anon, authenticated;

grant execute on function public.ensure_profile(text)                                   to service_role;
grant execute on function public.start_game(uuid, text, numeric, text, text, bigint)    to service_role;
grant execute on function public.safe_payout(uuid, numeric, jsonb)                      to service_role;
grant execute on function public.credit_deposit(text, text, numeric, bigint)            to service_role;
grant execute on function public.request_withdrawal(uuid, numeric, text)                to service_role;
grant execute on function public.mark_withdrawal_completed(uuid, text)                  to service_role;
grant execute on function public.mark_withdrawal_failed(uuid, text)                     to service_role;
