"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";

type SessionStatus = "unknown" | "unauthenticated" | "authenticated";

type SessionState = {
  status: SessionStatus;
  /** Authenticated wallet address, or null. */
  address: string | null;
  /** True while a login or logout is in flight. */
  busy: boolean;
  error: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

async function fetchSessionAddress(): Promise<string | null> {
  const res = await fetch("/api/auth/session", { cache: "no-store" });
  if (!res.ok) return null;
  const j = (await res.json()) as { address: string | null };
  return j.address ?? null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  const [status, setStatus] = useState<SessionStatus>("unknown");
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial session probe + re-probe whenever the connected wallet changes.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const addr = await fetchSessionAddress();
        if (cancelled) return;
        setAddress(addr);
        setStatus(addr ? "authenticated" : "unauthenticated");

        // If the session is for a wallet the user no longer has connected,
        // drop it so we don't pretend to be authed as the wrong address.
        if (addr && walletAddress && addr !== walletAddress) {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          if (cancelled) return;
          setAddress(null);
          setStatus("unauthenticated");
        }
      } catch {
        if (cancelled) return;
        setStatus("unauthenticated");
        setAddress(null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const refresh = useCallback(async () => {
    const addr = await fetchSessionAddress();
    setAddress(addr);
    setStatus(addr ? "authenticated" : "unauthenticated");
  }, []);

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      setError("Wallet unterstützt keine Signaturen");
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const addr = publicKey.toBase58();
      const chRes = await fetch(
        `/api/auth/challenge?address=${encodeURIComponent(addr)}`,
        { method: "GET", cache: "no-store" },
      );
      const chJson = (await chRes.json()) as
        | { message: string; nonce: string }
        | { error: string };
      if (!chRes.ok || !("message" in chJson)) {
        throw new Error(
          ("error" in chJson && chJson.error) || "Challenge fehlgeschlagen",
        );
      }

      const messageBytes = new TextEncoder().encode(chJson.message);
      const signatureBytes = await signMessage(messageBytes);
      const signatureB58 = bs58.encode(signatureBytes);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: addr, signature: signatureB58 }),
      });
      const verifyJson = (await verifyRes.json()) as
        | { ok: true; address: string }
        | { error: string };
      if (!verifyRes.ok || !("ok" in verifyJson)) {
        throw new Error(
          ("error" in verifyJson && verifyJson.error) ||
            "Anmeldung fehlgeschlagen",
        );
      }

      setAddress(verifyJson.address);
      setStatus("authenticated");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen");
      return false;
    } finally {
      setBusy(false);
    }
  }, [publicKey, signMessage]);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAddress(null);
      setStatus("unauthenticated");
      setBusy(false);
    }
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      status,
      address,
      busy,
      error,
      signIn,
      signOut,
      refresh,
    }),
    [status, address, busy, error, signIn, signOut, refresh],
  );

  // Silence unused-var lint when wallet isn't connected but we still render.
  void connected;

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
