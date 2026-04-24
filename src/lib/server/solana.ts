import "server-only";

import {
  clusterApiUrl,
  Connection,
  PublicKey,
  type Cluster,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";

import { LAMPORTS_PER_SOL } from "@/lib/shared/sol";

let cachedConnection: Connection | null = null;

export function solanaConnection(): Connection {
  if (cachedConnection) return cachedConnection;
  const explicit = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  const endpoint =
    explicit && explicit.length > 0
      ? explicit
      : clusterApiUrl(
          (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet") as Cluster,
        );
  cachedConnection = new Connection(endpoint, "confirmed");
  return cachedConnection;
}

export function houseWalletAddress(): string {
  // Public on-chain address — fine to ship to the browser.
  const a = process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS;
  if (!a) {
    throw new Error("NEXT_PUBLIC_HOUSE_WALLET_ADDRESS is not configured");
  }
  // Throws on bad base58.
  return new PublicKey(a).toBase58();
}

export type VerifiedDeposit = {
  signature: string;
  sender: string;
  lamports: bigint;
  sol: number;
  slot: number;
};

/**
 * Fetch a confirmed transaction and verify that it represents a SOL transfer
 * from `sender` to the house wallet. Only successful, non-reverted transfers
 * with a positive lamport delta on the house side are accepted.
 *
 * We derive the actual transferred amount from the pre/postBalance diff
 * rather than trusting the instruction payload — that way partial failures,
 * reversals and fee-only transactions cannot be presented as deposits.
 */
export async function verifyDepositSignature(input: {
  signature: string;
  expectedSender: string;
  minLamports: bigint;
}): Promise<VerifiedDeposit> {
  const signature = input.signature.trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(signature)) {
    throw new Error("Malformed transaction signature");
  }

  const sender = new PublicKey(input.expectedSender).toBase58();
  const house = houseWalletAddress();

  const conn = solanaConnection();
  const tx: ParsedTransactionWithMeta | null =
    await conn.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

  if (!tx) throw new Error("Transaction not found or not yet confirmed");
  if (tx.meta?.err) throw new Error("Transaction failed on-chain");

  const keys = tx.transaction.message.accountKeys;
  const houseIdx = keys.findIndex((k) => k.pubkey.toBase58() === house);
  const senderIdx = keys.findIndex((k) => k.pubkey.toBase58() === sender);

  if (houseIdx === -1) {
    throw new Error("Transaction does not credit the house wallet");
  }
  if (senderIdx === -1) {
    throw new Error("Declared sender is not a signer of this transaction");
  }
  if (!keys[senderIdx].signer) {
    throw new Error("Declared sender is not a signer of this transaction");
  }

  const pre = tx.meta?.preBalances?.[houseIdx] ?? 0;
  const post = tx.meta?.postBalances?.[houseIdx] ?? 0;
  const delta = BigInt(post) - BigInt(pre);

  if (delta <= 0n) {
    throw new Error("Transaction did not transfer SOL to the house wallet");
  }
  if (delta < input.minLamports) {
    throw new Error(
      `Transferred amount ${delta} lamports below minimum ${input.minLamports}`,
    );
  }

  return {
    signature,
    sender,
    lamports: delta,
    sol: Number(delta) / Number(LAMPORTS_PER_SOL),
    slot: tx.slot ?? 0,
  };
}
