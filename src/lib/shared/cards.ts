/**
 * Playing-card primitives. Pure and runtime-agnostic: must work identically
 * on the server (for round settlement) and in the browser (for independent
 * verification of a revealed round).
 */

export const SUITS = ["spades", "hearts", "diamonds", "clubs"] as const;
export type Suit = (typeof SUITS)[number];

/** Numeric rank: 2..10, then J=11, Q=12, K=13, A=14. */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export const RANKS: readonly Rank[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
] as const;

export type Card = { rank: Rank; suit: Suit };

export const DECK_SIZE = 52;

/** Deck index 0..51 → Card. Canonical ordering: suit-major, rank-minor. */
export function cardFromIndex(index: number): Card {
  if (!Number.isInteger(index) || index < 0 || index >= DECK_SIZE) {
    throw new RangeError(`card index out of range: ${index}`);
  }
  const suit = SUITS[Math.floor(index / 13)];
  const rank = RANKS[index % 13];
  return { rank, suit };
}

/** Card → deck index 0..51. Inverse of `cardFromIndex`. */
export function indexFromCard(card: Card): number {
  return SUITS.indexOf(card.suit) * 13 + RANKS.indexOf(card.rank);
}

/** Unicode suit glyph for UI. */
export function suitGlyph(suit: Suit): "♠" | "♥" | "♦" | "♣" {
  switch (suit) {
    case "spades":
      return "♠";
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
  }
}

/** Short label for UI: "A", "K", "Q", "J", or "2".."10". */
export function rankLabel(rank: Rank): string {
  switch (rank) {
    case 14:
      return "A";
    case 13:
      return "K";
    case 12:
      return "Q";
    case 11:
      return "J";
    default:
      return String(rank);
  }
}

/** True for hearts/diamonds — used by UI to colorize red suits. */
export function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}
