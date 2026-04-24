"use client";

import { useCallback, useEffect, useState } from "react";

import { useBalance } from "@/components/providers/balance-provider";
import { useSession } from "@/components/providers/session-provider";
import { formatSol } from "@/lib/shared/sol";

type Entry = {
  kind: "deposit" | "withdrawal";
  createdAt: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  signature: string | null;
  destination?: string | null;
};

async function fetchEntries(): Promise<Entry[]> {
  const res = await fetch("/api/wallet/transactions", { cache: "no-store" });
  const json = (await res.json()) as
    | { entries: Entry[] }
    | { error: string };
  if (!res.ok || !("entries" in json)) {
    throw new Error(
      ("error" in json && json.error) || "Verlauf fehlgeschlagen",
    );
  }
  return json.entries;
}

/**
 * Recent deposit + withdrawal history for the authenticated wallet. Always
 * scoped server-side by the session cookie.
 */
export function TransactionHistory() {
  const { status } = useSession();
  const { balance } = useBalance();

  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // All setState lives inside async callbacks to satisfy the
  // react-hooks/set-state-in-effect lint rule.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (status !== "authenticated") {
        if (!cancelled) {
          setEntries(null);
          setError(null);
        }
        return;
      }
      try {
        const data = await fetchEntries();
        if (cancelled) return;
        setEntries(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Verlauf fehlgeschlagen",
        );
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // Depend on balance as well so the list refreshes after each bet /
    // deposit / withdrawal.
  }, [status, balance]);

  const reload = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const data = await fetchEntries();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verlauf fehlgeschlagen");
    }
  }, [status]);

  if (status !== "authenticated") {
    return (
      <section
        aria-labelledby="tx-history-heading"
        className="border border-[var(--border)] bg-[var(--muted)] p-5"
      >
        <h2
          id="tx-history-heading"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50"
        >
          Transaktionen
        </h2>
        <p className="mt-2 text-sm text-foreground/60">
          Melde dich an, um deinen Verlauf zu sehen.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="tx-history-heading"
      className="border border-[var(--border)] bg-[var(--muted)] p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="tx-history-heading"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]"
        >
          Transaktionen
        </h2>
        <button
          type="button"
          onClick={() => void reload()}
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/50 transition-colors hover:text-[var(--accent)]"
        >
          Aktualisieren
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 font-mono text-[11px] text-[var(--accent)]">
          {error}
        </p>
      ) : null}

      {entries == null ? (
        <p className="mt-3 text-sm text-foreground/60">Lade …</p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/60">
          Noch keine Ein- oder Auszahlungen.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--border)]">
          {entries.map((e) => (
            <li key={`${e.kind}-${e.signature ?? e.createdAt}`} className="py-3">
              <div className="flex items-start justify-between gap-3 font-mono text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="uppercase tracking-[0.15em] text-foreground/80">
                    {e.kind === "deposit" ? "Einzahlung" : "Auszahlung"}{" "}
                    <StatusDot status={e.status} />
                  </span>
                  <span className="text-[10px] text-foreground/45">
                    {formatDate(e.createdAt)}
                  </span>
                </div>
                <span
                  className={
                    e.kind === "deposit"
                      ? "text-[var(--accent)]"
                      : "text-foreground"
                  }
                >
                  {e.kind === "deposit" ? "+" : "−"}
                  {formatSol(e.amount, 4)} SOL
                </span>
              </div>
              {e.signature ? (
                <p className="mt-1 break-all font-mono text-[10px] text-foreground/40">
                  {e.signature}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusDot({ status }: { status: Entry["status"] }) {
  const color =
    status === "completed"
      ? "bg-[var(--accent)]"
      : status === "pending"
        ? "bg-foreground/40"
        : "bg-red-500";
  const label =
    status === "completed"
      ? "abgeschlossen"
      : status === "pending"
        ? "ausstehend"
        : "fehlgeschlagen";
  return (
    <span
      aria-label={label}
      className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${color}`}
    />
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
