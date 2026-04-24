import "server-only";

import bs58 from "bs58";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { solanaConnection, houseWalletAddress } from "@/lib/server/solana";

/**
 * Treasury module. Loads the house keypair at first use from
 * SOLANA_HOUSE_SECRET_KEY, verifies that its public key matches the public
 * NEXT_PUBLIC_HOUSE_WALLET_ADDRESS (belt + braces so a mis-configured deploy
 * cannot silently send from the wrong wallet), and exposes a single
 * `payoutSol` helper.
 *
 * SECURITY: the secret key NEVER appears in the source tree, in logs, or on
 * the client. It is only read from process.env inside this module. Rotate
 * by updating the env var — the key is re-loaded on the next cold start.
 */

let cachedKeypair: Keypair | null = null;

function parseSecret(raw: string): Uint8Array {
  const trimmed = raw.trim();

  // JSON array of 64 bytes (Solana CLI keypair file format).
  if (trimmed.startsWith("[")) {
    const arr = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(arr) || arr.length !== 64) {
      throw new Error("JSON secret must be a 64-byte array");
    }
    const bytes = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      const n = arr[i];
      if (typeof n !== "number" || n < 0 || n > 255 || !Number.isInteger(n)) {
        throw new Error("JSON secret contains non-byte entries");
      }
      bytes[i] = n;
    }
    return bytes;
  }

  // Base58-encoded secret (Phantom / Solflare export format).
  const decoded = bs58.decode(trimmed);
  if (decoded.length !== 64) {
    throw new Error(
      `Base58 secret must decode to 64 bytes (got ${decoded.length})`,
    );
  }
  return decoded;
}

function loadHouseKeypair(): Keypair {
  if (cachedKeypair) return cachedKeypair;

  const raw = process.env.SOLANA_HOUSE_SECRET_KEY;
  if (!raw || raw.length === 0) {
    throw new Error("SOLANA_HOUSE_SECRET_KEY is not configured");
  }

  const bytes = parseSecret(raw);
  const kp = Keypair.fromSecretKey(bytes);

  const expected = houseWalletAddress();
  const actual = kp.publicKey.toBase58();
  if (expected !== actual) {
    throw new Error(
      `House keypair mismatch: secret resolves to ${actual} but NEXT_PUBLIC_HOUSE_WALLET_ADDRESS=${expected}`,
    );
  }

  cachedKeypair = kp;
  return kp;
}

export type PayoutResult = {
  signature: string;
  lamports: bigint;
  sol: number;
};

/**
 * Sign & submit a SOL transfer from the house wallet to `destination`. Waits
 * for "confirmed" commitment before returning. Throws on any error so the
 * caller can flip the withdrawal to 'failed' and refund the user.
 */
export async function payoutSol(input: {
  destination: string;
  sol: number;
}): Promise<PayoutResult> {
  if (!Number.isFinite(input.sol) || input.sol <= 0) {
    throw new Error("Payout amount must be a positive number");
  }

  let dest: PublicKey;
  try {
    dest = new PublicKey(input.destination);
  } catch {
    throw new Error("Invalid destination address");
  }

  const kp = loadHouseKeypair();
  if (dest.equals(kp.publicKey)) {
    throw new Error("Destination must differ from the house wallet");
  }

  const lamports = BigInt(Math.round(input.sol * LAMPORTS_PER_SOL));
  if (lamports <= 0n) throw new Error("Payout amount rounds to zero lamports");

  const connection = solanaConnection();

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({
    feePayer: kp.publicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: kp.publicKey,
      toPubkey: dest,
      lamports: Number(lamports),
    }),
  );

  tx.sign(kp);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  return { signature, lamports, sol: input.sol };
}
