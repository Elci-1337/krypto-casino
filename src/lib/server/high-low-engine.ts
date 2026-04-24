import "server-only";

import { randomBytes } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

import {
  commitServerSeed,
  floatFromRound,
} from "@/lib/shared/provably-fair";
import { cardFromIndex, DECK_SIZE, type Card } from "@/lib/shared/cards";
import {
  type Direction,
  type ResolvedRound,
  settleRound,
  STAKE_OPTIONS,
  winMultiplier,
} from "@/lib/shared/high-low";
import { supabaseAdmin } from "@/lib/server/supabase-admin";
import { signRoundToken, verifyRoundToken } from "@/lib/server/round-token";

/**
 * High-Low engine. Orchestrates three pieces:
 *
 *   1. Provably-fair card derivation (pure, in lib/shared/provably-fair).
 *   2. Stateless round tokens (HMAC-signed, in lib/server/round-token).
 *      Lets us skip a pre-bet DB write while still preventing the client
 *      from tampering with the committed seeds.
 *   3. Supabase RPCs (ensure_profile, start_game, safe_payout). All balance
 *      mutations happen inside Postgres transactions with row-level locks,
 *      so concurrent play cannot double-spend the same balance.
 *
 * Wallet authentication: TODO(siws) — replace the plain walletAddress input
 * with a Sign-In-With-Solana proof before going to production. Without it, a
 * malicious client can debit a wallet it does not own.
 */

function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

function assertValidPubkey(address: string): string {
  try {
    // Throws on bad base58.
    return new PublicKey(address).toBase58();
  } catch {
    throw new Error("Invalid Solana wallet address");
  }
}

async function drawCardIndex(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  modulus: number,
): Promise<number> {
  const f = await floatFromRound({ serverSeed, clientSeed, nonce });
  return Math.min(modulus - 1, Math.floor(f * modulus));
}

export type StartedRound = {
  roundToken: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  current: Card;
  blocked: Direction | null;
  stakeOptions: readonly number[];
};

export async function startRound(opts?: {
  clientSeed?: string;
}): Promise<StartedRound> {
  const serverSeed = randomHex(32);
  const serverSeedHash = await commitServerSeed(serverSeed);
  const clientSeed = opts?.clientSeed?.trim() || randomHex(8);

  const currentIndex = await drawCardIndex(
    serverSeed,
    clientSeed,
    0,
    DECK_SIZE,
  );
  const current = cardFromIndex(currentIndex);

  const roundToken = signRoundToken({
    serverSeed,
    serverSeedHash,
    clientSeed,
    currentIndex,
  });

  let blocked: Direction | null = null;
  if (winMultiplier(current, "higher") === 0) blocked = "higher";
  else if (winMultiplier(current, "lower") === 0) blocked = "lower";

  return {
    roundToken,
    serverSeedHash,
    clientSeed,
    nonce: 0,
    current,
    blocked,
    stakeOptions: STAKE_OPTIONS,
  };
}

export type ResolvedRoundPayload = ResolvedRound & {
  gameId: string;
  stake: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  balance: number;
};

export async function resolveRoundById(params: {
  /** Server-authoritative wallet address (from the session cookie). */
  walletAddress: string;
  roundToken: string;
  direction: Direction;
  stake: number;
}): Promise<ResolvedRoundPayload> {
  const { roundToken, direction, stake } = params;
  // The caller already pulled this from the session. We still validate it
  // to catch upstream bugs and normalize the base58 representation.
  const walletAddress = assertValidPubkey(params.walletAddress);

  if (!STAKE_OPTIONS.includes(stake)) throw new Error("Invalid stake");
  if (direction !== "higher" && direction !== "lower") {
    throw new Error("Invalid direction");
  }

  // 1. Verify the signed round: server seeds and current-card index are
  // bound by HMAC, so the client cannot swap them.
  const round = verifyRoundToken(roundToken);
  const current = cardFromIndex(round.currentIndex);

  const supa = supabaseAdmin();

  // 2. Ensure the profile exists (creates a stub on first interaction).
  const { data: userId, error: ensureErr } = await supa.rpc("ensure_profile", {
    p_wallet: walletAddress,
  });
  if (ensureErr || !userId) {
    throw new Error(ensureErr?.message ?? "Failed to ensure profile");
  }

  // 3. DEBIT BEFORE PLAY — atomic inside Postgres: the profile row is locked
  // FOR UPDATE, balance is checked, wager is deducted and a pending game row
  // is inserted. If the balance is short, Postgres raises and no state
  // changes.
  const { data: gameId, error: startErr } = await supa.rpc("start_game", {
    p_user_id: userId as string,
    p_game_type: "high-low",
    p_wager: stake,
    p_server_seed: round.serverSeed,
    p_client_seed: round.clientSeed,
    p_nonce: 1,
  });
  if (startErr || !gameId) {
    const msg = startErr?.message ?? "Failed to start game";
    if (/insufficient balance/i.test(msg)) {
      throw new Error("Guthaben reicht nicht für diesen Einsatz");
    }
    throw new Error(msg);
  }

  // 4. Draw the decisive card from the remaining 51 (skip currentIndex).
  const rawIndex = await drawCardIndex(
    round.serverSeed,
    round.clientSeed,
    1,
    DECK_SIZE - 1,
  );
  const nextIndex = rawIndex >= round.currentIndex ? rawIndex + 1 : rawIndex;
  const next = cardFromIndex(nextIndex);

  const resolved = settleRound(current, next, direction, stake);

  // 5. Settle atomically: lock the game row, flip status to 'settled', write
  // the result JSON, credit the payout. safe_payout is idempotent on retries.
  const { data: newBalance, error: payoutErr } = await supa.rpc("safe_payout", {
    p_game_id: gameId as string,
    p_payout: resolved.payout,
    p_result: {
      current,
      next,
      direction: resolved.direction,
      outcome: resolved.outcome,
      multiplier: resolved.multiplier,
      serverSeedHash: round.serverSeedHash,
    },
  });
  if (payoutErr || newBalance == null) {
    throw new Error(payoutErr?.message ?? "Failed to settle game");
  }

  return {
    gameId: gameId as string,
    stake,
    serverSeed: round.serverSeed,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    nonce: 1,
    balance: Number(newBalance),
    ...resolved,
  };
}

export async function getBalance(walletAddress: string): Promise<number> {
  const address = assertValidPubkey(walletAddress);
  const supa = supabaseAdmin();

  const { data, error } = await supa
    .from("profiles")
    .select("balance")
    .eq("wallet_address", address)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return 0;
  return Number(data.balance ?? 0);
}
