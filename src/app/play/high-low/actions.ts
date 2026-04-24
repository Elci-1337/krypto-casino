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
 * Begin a new High-Low round. The server commits to a freshly generated
 * `serverSeed` and returns its SHA-256 hash; the actual seed is only
 * revealed after the bet is resolved.
 *
 * NOTE: wallet authentication and on-chain stake escrow will be wired in
 * alongside the Supabase write path. For now the action is state-free.
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
 * Resolve a pending round. Returns the revealed server seed so the client
 * can independently verify that the drawn card is a function of the public
 * inputs `(serverSeed, clientSeed, nonce)`.
 */
export async function resolveHighLowRound(input: {
  roundId: string;
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
