export type GameType = "dice" | "coinflip" | "crash" | "mines" | "slots";

export type GameStatus = "pending" | "settled" | "voided";

export type GameRecord = {
  id: string;
  userId: string;
  gameType: GameType;
  wager: number;
  payout: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  result: unknown;
  status: GameStatus;
};

export type Profile = {
  id: string;
  username: string | null;
  walletAddress: string | null;
  balance: number;
};
