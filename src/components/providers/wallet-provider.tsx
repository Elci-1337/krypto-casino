"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, type Cluster } from "@solana/web3.js";
import type { Adapter } from "@solana/wallet-adapter-base";
import { useMemo, type ReactNode } from "react";

import "@solana/wallet-adapter-react-ui/styles.css";

type Props = { children: ReactNode };

/**
 * Top-level Solana context. Must be mounted above any component that
 * uses `useWallet`, `useConnection`, or `<WalletMultiButton />`.
 *
 * Endpoint:
 *   - NEXT_PUBLIC_SOLANA_RPC_URL wins if set.
 *   - Otherwise we fall back to `clusterApiUrl(cluster)` with the cluster
 *     taken from NEXT_PUBLIC_SOLANA_CLUSTER (defaults to "devnet").
 */
export function WalletContextProvider({ children }: Props) {
  const endpoint = useMemo(() => {
    const explicit = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (explicit && explicit.length > 0) return explicit;
    const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ??
      "devnet") as Cluster;
    return clusterApiUrl(cluster);
  }, []);

  // Wallet Standard auto-discovers Phantom, Solflare, Backpack, etc. at
  // runtime, so we don't need to hard-code adapters.
  const wallets = useMemo<Adapter[]>(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
