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

import { useSession } from "@/components/providers/session-provider";

type BalanceState = {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Optimistic override used between bet submit and server response. */
  setOptimistic: (balance: number) => void;
};

const BalanceContext = createContext<BalanceState | null>(null);

async function fetchBalance(): Promise<number> {
  const res = await fetch(`/api/wallet/balance`, { cache: "no-store" });
  const json = (await res.json()) as
    | { balance: number }
    | { error: string };
  if (!res.ok || !("balance" in json)) {
    throw new Error(("error" in json && json.error) || "Balance error");
  }
  return json.balance;
}

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { status, address } = useSession();

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (status !== "authenticated") {
        if (!cancelled) {
          setBalance(null);
          setError(null);
          setLoading(false);
        }
        return;
      }
      try {
        const b = await fetchBalance();
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
  }, [status, address]);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const b = await fetchBalance();
      setBalance(b);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Balance error");
    } finally {
      setLoading(false);
    }
  }, [status]);

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
