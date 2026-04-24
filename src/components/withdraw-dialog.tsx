"use client";

import { useCallback, useState, type MouseEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useBalance } from "@/components/providers/balance-provider";
import { useSession } from "@/components/providers/session-provider";
import { formatSol } from "@/lib/shared/sol";

const MIN_WITHDRAW = 0.01;

type Phase =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done"; signature: string; amount: number }
  | { kind: "error"; message: string };

export function WithdrawDialog() {
  const { publicKey } = useWallet();
  const { status } = useSession();
  const { balance, refresh } = useBalance();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("0.1");
  const [destination, setDestination] = useState<string>(
    publicKey?.toBase58() ?? "",
  );
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const close = useCallback(() => {
    if (phase.kind === "submitting") return;
    setOpen(false);
    setPhase({ kind: "idle" });
  }, [phase.kind]);

  const handleOpen = useCallback(() => {
    setDestination(publicKey?.toBase58() ?? "");
    setOpen(true);
  }, [publicKey]);

  const submit = useCallback(async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < MIN_WITHDRAW) {
      setPhase({
        kind: "error",
        message: `Mindestauszahlung ${MIN_WITHDRAW} SOL`,
      });
      return;
    }
    if (balance != null && parsed > balance) {
      setPhase({
        kind: "error",
        message: `Nicht genug Guthaben: ${formatSol(balance)} SOL verfügbar`,
      });
      return;
    }

    setPhase({ kind: "submitting" });
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: parsed,
          destination: destination.trim(),
        }),
      });
      const json = (await res.json()) as
        | { ok: true; signature: string; amount: number }
        | { error: string };
      if (!res.ok || !("ok" in json)) {
        throw new Error(
          ("error" in json && json.error) || "Auszahlung fehlgeschlagen",
        );
      }
      await refresh();
      setPhase({
        kind: "done",
        signature: json.signature,
        amount: json.amount,
      });
    } catch (err) {
      setPhase({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Auszahlung fehlgeschlagen",
      });
    }
  }, [amount, balance, destination, refresh]);

  if (status !== "authenticated") return null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex h-9 items-center justify-center border border-[var(--border)] bg-transparent px-3 font-mono text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        Auszahlen
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={close}
        >
          <div
            onClick={(e: MouseEvent) => e.stopPropagation()}
            className="w-full max-w-md border border-[var(--border)] bg-black p-6 shadow-[0_30px_80px_-20px_rgba(255,69,0,0.5)]"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="withdraw-title" className="text-xl font-bold tracking-tight">
                Auszahlen
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Dialog schließen"
                className="font-mono text-foreground/50 transition-colors hover:text-[var(--accent)]"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-sm text-foreground/65">
              Zieh dein Guthaben direkt on-chain auf eine Solana-Wallet ab. Die
              Transaktion wird vom Casino-Treasury signiert und an das von dir
              gewählte Ziel geschickt.
            </p>

            <div className="mt-4 border border-[var(--border)] bg-[var(--muted)] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                Aktuelles Guthaben
              </p>
              <p className="mt-1 font-mono text-lg text-foreground">
                {balance != null ? formatSol(balance, 6) : "…"} SOL
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                  Betrag (SOL)
                </span>
                <input
                  type="number"
                  min={MIN_WITHDRAW}
                  step={0.01}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={phase.kind === "submitting"}
                  className="mt-1 h-10 w-full border border-[var(--border)] bg-black px-3 font-mono text-sm text-foreground outline-none focus:border-[var(--accent)]"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                  Ziel-Adresse
                </span>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={phase.kind === "submitting"}
                  spellCheck={false}
                  className="mt-1 h-10 w-full border border-[var(--border)] bg-black px-3 font-mono text-xs text-foreground outline-none focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <PhasePanel phase={phase} />

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={phase.kind === "submitting"}
                className="inline-flex h-10 items-center justify-center border border-[var(--border)] bg-transparent px-4 font-mono text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Schließen
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={
                  phase.kind === "submitting" ||
                  !destination.trim() ||
                  !amount
                }
                className="inline-flex h-10 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-5 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {phase.kind === "submitting" ? "…" : "Auszahlen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PhasePanel({ phase }: { phase: Phase }) {
  if (phase.kind === "idle") return null;
  if (phase.kind === "submitting") {
    return (
      <Notice tone="muted">
        Treasury signiert und sendet die Transaktion …
      </Notice>
    );
  }
  if (phase.kind === "done") {
    return (
      <Notice tone="success">
        Ausgezahlt: {formatSol(phase.amount, 4)} SOL
        <Sig value={phase.signature} />
      </Notice>
    );
  }
  return <Notice tone="error">{phase.message}</Notice>;
}

function Notice({
  tone,
  children,
}: {
  tone: "muted" | "success" | "error";
  children: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "border-[var(--accent)] text-[var(--accent)]"
      : tone === "error"
        ? "border-[var(--accent)] text-[var(--accent)]"
        : "border-[var(--border)] text-foreground/70";
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`mt-4 border ${cls} bg-black px-3 py-2 font-mono text-[11px] leading-relaxed`}
    >
      {children}
    </div>
  );
}

function Sig({ value }: { value: string }) {
  return (
    <div className="mt-1 break-all text-[10px] text-foreground/50">{value}</div>
  );
}
