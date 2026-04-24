"use server";

import {
  resolveRoundById,
  startRound,
  type ResolvedRoundPayload,
  type StartedRound,
} from "@/lib/server/high-low-engine";
import type { Direction } from "@/lib/shared/high-low";

export type StartResult =
  | { ok: true; round: StartedRound }
  | { ok: false; error: string };

export type ResolveResult =
  | { ok: true; round: ResolvedRoundPayload }
  | { ok: false; error: string };

/**
 * Begin a new round. Stateless on the server — the returned token carries the
 * committed server seed and the pre-drawn first card, signed with HMAC so the
 * client cannot tamper with it.
 */
export async function startHighLowRound(input?: {
  clientSeed?: string;
}): Promise<StartResult> {
  try {
    const round = await startRound({ clientSeed: input?.clientSeed });
    return { ok: true, round };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to start round",
    };
  }
}

/**
 * Settle a round. Flow:
 *   1. Verify round token signature + expiry.
 *   2. Supabase `start_game` RPC: lock profile, debit wager, insert pending
 *      game. Fails with a clear error if balance is insufficient.
 *   3. Draw the decisive card from the remaining 51.
 *   4. Supabase `safe_payout` RPC: mark settled and credit the payout,
 *      atomically.
 *
 * TODO(siws): replace `walletAddress` with a verified Sign-In-With-Solana
 * proof before production.
 */
export async function resolveHighLowRound(input: {
  walletAddress: string;
  roundToken: string;
  direction: Direction;
  stake: number;
}): Promise<ResolveResult> {
  try {
    const round = await resolveRoundById(input);
    return { ok: true, round };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to resolve round",
    };
  }
}
