"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import { useSession } from "@/components/providers/session-provider";

/**
 * Small SIWS control next to the wallet button.
 *   - Wallet disconnected: nothing (the wallet button handles that state).
 *   - Wallet connected, no session: "Anmelden" triggers signMessage flow.
 *   - Session active: "Abmelden" clears the cookie.
 */
export function AuthButton() {
  const { connected } = useWallet();
  const { status, busy, error, signIn, signOut } = useSession();

  if (!connected) return null;
  if (status === "unknown") {
    return <Placeholder label="…" />;
  }

  if (status === "authenticated") {
    return (
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={busy}
        className="inline-flex h-9 items-center justify-center border border-[var(--border)] bg-transparent px-3 font-mono text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
      >
        Abmelden
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void signIn()}
        disabled={busy}
        className="inline-flex h-9 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-3 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
        title="Sign-In-With-Solana: signiert eine Nonce mit deiner Wallet"
      >
        {busy ? "…" : "Anmelden"}
      </button>
      {error ? (
        <span
          role="alert"
          className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--accent)] md:inline"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-9 items-center justify-center border border-[var(--border)] bg-transparent px-3 font-mono text-xs font-bold uppercase tracking-wider text-foreground/50"
    >
      {label}
    </span>
  );
}
