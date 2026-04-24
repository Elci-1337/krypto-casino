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
import { useWallet } from "@solana/wallet-adapter-react";

type BalanceState = {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Optimistic override used between bet submit and server response. */
  setOptimistic: (balance: number) => void;
};

const BalanceContext = createContext<BalanceState | null>(null);

async function fetchBalance(address: string): Promise<number> {
  const res = await fetch(
    `/api/wallet/balance?address=${encodeURIComponent(address)}`,
    { cache: "no-store" },
  );
  const json = (await res.json()) as
    | { balance: number }
    | { error: string };
  if (!res.ok || !("balance" in json)) {
    throw new Error(("error" in json && json.error) || "Balance error");
  }
  return json.balance;
}

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58() ?? null;

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load balance whenever the connected wallet changes. All setState calls
  // live inside the async callback to satisfy react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!address) {
        if (!cancelled) {
          setBalance(null);
          setError(null);
          setLoading(false);
        }
        return;
      }
      try {
        const b = await fetchBalance(address);
        if (cancelled) return;
        setBalance(b);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setBalance(null);
        setError(err instanceof Error ? err.message : "Balance error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const refresh = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const b = await fetchBalance(address);
      setBalance(b);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Balance error");
    } finally {
      setLoading(false);
    }
  }, [address]);

  const setOptimistic = useCallback((v: number) => setBalance(v), []);

  const value = useMemo<BalanceState>(
    () => ({ balance, loading, error, refresh, setOptimistic }),
    [balance, loading, error, refresh, setOptimistic],
  );

  return (
    <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>
  );
}

export function useBalance(): BalanceState {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error("useBalance must be used within BalanceProvider");
  return ctx;
}
