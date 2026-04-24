"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import { useBalance } from "@/components/providers/balance-provider";
import { formatSol } from "@/lib/shared/sol";

export function WalletBalance() {
  const { connected } = useWallet();
  const { balance, loading, error } = useBalance();

  if (!connected) return null;

  let display: string;
  let tone = "text-foreground";
  if (error) {
    display = "err";
    tone = "text-[var(--accent)]";
  } else if (loading && balance == null) {
    display = "…";
  } else {
    display = `${formatSol(balance ?? 0, 4)} SOL`;
  }

  return (
    <span
      aria-live="polite"
      aria-label={`Guthaben ${display}`}
      className={`hidden h-9 items-center gap-2 border border-[var(--border)] bg-black px-3 font-mono text-xs font-bold uppercase tracking-wider sm:inline-flex ${tone}`}
      title={error ?? undefined}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
      />
      {display}
    </span>
  );
}
