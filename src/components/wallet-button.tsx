"use client";

import dynamic from "next/dynamic";

/**
 * `next/dynamic` with `ssr: false` is not allowed in Server Components, so
 * this tiny client wrapper owns the dynamic import. The heavy wallet-adapter
 * UI (~100 KB) is excluded from the initial HTML payload and only shipped
 * after hydration.
 */
const WalletMultiButton = dynamic(
  async () => {
    const mod = await import("@solana/wallet-adapter-react-ui");
    return { default: mod.WalletMultiButton };
  },
  {
    ssr: false,
    loading: () => <WalletButtonPlaceholder />,
  },
);

function WalletButtonPlaceholder() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-9 items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-4 font-mono text-sm font-bold uppercase tracking-wider text-black"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-black" />
      Connect Wallet
    </span>
  );
}

export function WalletButton() {
  return (
    <div className="wallet-button-slot">
      <WalletMultiButton />
    </div>
  );
}
