"use server";

import {
  resolveRoundById,
  startRound,
  type ResolvedRoundPayload,
  type StartedRound,
} from "@/lib/server/high-low-engine";
import type { Direction } from "@/lib/shared/high-low";
import { getSession } from "@/lib/server/session";

export type StartResult =
  | { ok: true; round: StartedRound }
  | { ok: false; error: string };

export type ResolveResult =
  | { ok: true; round: ResolvedRoundPayload }
  | { ok: false; error: string };

/**
 * Begin a new round. Auth is required (SIWS) even for the pre-bet phase:
 * there's no reason for an unauthenticated client to allocate server seeds.
 */
export async function startHighLowRound(input?: {
  clientSeed?: string;
}): Promise<StartResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Bitte zuerst mit deiner Wallet anmelden." };
  }
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
 * Settle a round. The wallet address is taken from the SIWS session cookie;
 * clients cannot supply it themselves, which eliminates the earlier risk of
 * debiting someone else's balance.
 */
export async function resolveHighLowRound(input: {
  roundToken: string;
  direction: Direction;
  stake: number;
}): Promise<ResolveResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Bitte zuerst mit deiner Wallet anmelden." };
  }
  try {
    const round = await resolveRoundById({
      walletAddress: session.wallet,
      roundToken: input.roundToken,
      direction: input.direction,
      stake: input.stake,
    });
    return { ok: true, round };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to resolve round",
    };
  }
}
