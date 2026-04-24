/**
 * Server-only High-Low engine. Handles round lifecycle, provably-fair card
 * derivation, and settlement math. Never import from client components.
 *
 * Round lifecycle
 * ---------------
 *   startRound()
 *     1. Generate a fresh random `serverSeed` (32 bytes).
 *     2. Publish `serverSeedHash = SHA256(serverSeed)` to the client — this
 *        is the commitment: the server cannot change its mind afterwards.
 *     3. Derive the first card deterministically from (serverSeed, clientSeed,
 *        nonce=0). Stash the round in the in-memory store.
 *     4. Return { roundId, serverSeedHash, clientSeed, current, nonce }.
 *
 *   resolveRound({ roundId, direction, stake })
 *     1. Look up the round; ensure it is still pending.
 *     2. Derive the second card from (serverSeed, clientSeed, nonce=1), skipping
 *        the index of the first card (draw without replacement).
 *     3. Settle the bet, mark the round revealed, and return the full result
 *        including the now-public serverSeed so the client can verify.
 *
 * TODO(supabase): persist rounds in the `games` table instead of this Map.
 *   * On start: insert row with status='pending', serverSeed, clientSeed,
 *     nonce, wager=0 (pre-bet round).
 *   * On resolve: update with payout, result jsonb, status='settled',
 *     settled_at=now(), under service-role key so RLS is bypassed.
 *   * Also debit / credit the player's profiles.balance within the same
 *     transaction (RLS prevents the client from touching balance directly).
 */

import { randomBytes } from "node:crypto";

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

type StoredRound = {
  roundId: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  current: Card;
  currentIndex: number;
  createdAt: number;
  status: "pending" | "settled";
};

const ROUND_TTL_MS = 5 * 60 * 1000;

// Scaffold-only: single-process in-memory store. Replace with Supabase writes.
const rounds = new Map<string, StoredRound>();

function gc() {
  const now = Date.now();
  for (const [id, r] of rounds) {
    if (now - r.createdAt > ROUND_TTL_MS) rounds.delete(id);
  }
}

function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

async function drawCardIndex(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  modulus: number,
): Promise<number> {
  const f = await floatFromRound({ serverSeed, clientSeed, nonce });
  // `f` is in [0, 1). Multiply by modulus then floor -> uniform index.
  return Math.min(modulus - 1, Math.floor(f * modulus));
}

export type StartedRound = {
  roundId: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  current: Card;
  /** Blocked direction (if any) because there are no favorable cards left. */
  blocked: Direction | null;
  stakeOptions: readonly number[];
};

export async function startRound(opts?: {
  clientSeed?: string;
}): Promise<StartedRound> {
  gc();
  const serverSeed = randomHex(32);
  const serverSeedHash = await commitServerSeed(serverSeed);
  const clientSeed = opts?.clientSeed?.trim() || randomHex(8);
  const roundId = randomHex(16);

  const currentIndex = await drawCardIndex(
    serverSeed,
    clientSeed,
    0,
    DECK_SIZE,
  );
  const current = cardFromIndex(currentIndex);

  rounds.set(roundId, {
    roundId,
    serverSeed,
    serverSeedHash,
    clientSeed,
    current,
    currentIndex,
    createdAt: Date.now(),
    status: "pending",
  });

  // If the drawn card makes one direction impossible (A for "higher",
  // 2 for "lower"), surface it so the UI can disable the button.
  let blocked: Direction | null = null;
  if (winMultiplier(current, "higher") === 0) blocked = "higher";
  else if (winMultiplier(current, "lower") === 0) blocked = "lower";

  return {
    roundId,
    serverSeedHash,
    clientSeed,
    nonce: 0,
    current,
    blocked,
    stakeOptions: STAKE_OPTIONS,
  };
}

export type ResolvedRoundPayload = ResolvedRound & {
  roundId: string;
  stake: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
};

export async function resolveRoundById(params: {
  roundId: string;
  direction: Direction;
  stake: number;
}): Promise<ResolvedRoundPayload> {
  const { roundId, direction, stake } = params;

  if (!STAKE_OPTIONS.includes(stake)) {
    throw new Error("Invalid stake");
  }
  if (direction !== "higher" && direction !== "lower") {
    throw new Error("Invalid direction");
  }

  const round = rounds.get(roundId);
  if (!round) throw new Error("Round not found or expired");
  if (round.status !== "pending") throw new Error("Round already settled");

  // Draw next card from the remaining 51 (skip currentIndex).
  const rawIndex = await drawCardIndex(
    round.serverSeed,
    round.clientSeed,
    1,
    DECK_SIZE - 1,
  );
  const nextIndex =
    rawIndex >= round.currentIndex ? rawIndex + 1 : rawIndex;
  const next = cardFromIndex(nextIndex);

  const resolved = settleRound(round.current, next, direction, stake);

  round.status = "settled";
  rounds.set(roundId, round);

  // TODO(supabase): at this point, inside a single transaction:
  //   1) update profiles.balance: -stake + resolved.payout (service-role).
  //   2) upsert into games with status='settled', server_seed (now public),
  //      client_seed, nonce=1, result = { current, next, direction, outcome }.
  //   3) insert a fairness audit entry keyed by serverSeedHash.

  return {
    roundId,
    stake,
    serverSeed: round.serverSeed,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    nonce: 1,
    ...resolved,
  };
}
