/**
 * High-Low payout math. Pure, deterministic, runtime-agnostic.
 *
 * Rules:
 *   - Two cards are drawn from a single 52-card deck without replacement.
 *   - Player sees the first card, then bets direction ("higher" / "lower")
 *     on the second.
 *   - A tie returns the stake (push).
 *   - Win pays `stake * multiplier`, where the multiplier is the fair
 *     inverse odds across the 51 remaining cards, times (1 - HOUSE_EDGE).
 */

import { type Card, RANKS } from "./cards";

export type Direction = "higher" | "lower";
export type Outcome = "win" | "loss" | "push";

export const HOUSE_EDGE = 0.03;

export type ResolvedRound = {
  current: Card;
  next: Card;
  direction: Direction;
  outcome: Outcome;
  /** Payout amount in the same unit as the stake. Loss = 0, push = stake. */
  payout: number;
  /** Win multiplier applied on win (1 on push, 0 on loss). */
  multiplier: number;
};

/** Count of remaining cards that satisfy `direction` given the visible card. */
export function favorableCount(current: Card, direction: Direction): number {
  let count = 0;
  for (const rank of RANKS) {
    if (direction === "higher" && rank > current.rank) count += 4;
    if (direction === "lower" && rank < current.rank) count += 4;
  }
  return count;
}

/**
 * Fair win multiplier. Derived from the actual remaining deck (51 cards),
 * minus the house edge. Returns 0 for a card with no favorable outcomes
 * (e.g. "higher" on an Ace) so the UI can block that bet.
 */
export function winMultiplier(current: Card, direction: Direction): number {
  const favorable = favorableCount(current, direction);
  if (favorable === 0) return 0;
  return (51 / favorable) * (1 - HOUSE_EDGE);
}

/** Round outcome decision. */
export function decideOutcome(
  current: Card,
  next: Card,
  direction: Direction,
): Outcome {
  if (next.rank === current.rank) return "push";
  if (direction === "higher") return next.rank > current.rank ? "win" : "loss";
  return next.rank < current.rank ? "win" : "loss";
}

export function settleRound(
  current: Card,
  next: Card,
  direction: Direction,
  stake: number,
): ResolvedRound {
  const outcome = decideOutcome(current, next, direction);
  const multiplier = outcome === "win" ? winMultiplier(current, direction) : 0;
  let payout = 0;
  if (outcome === "win") payout = stake * multiplier;
  else if (outcome === "push") payout = stake;
  return { current, next, direction, outcome, payout, multiplier };
}

export const STAKE_OPTIONS: readonly number[] = [0.01, 0.1, 0.5] as const;
