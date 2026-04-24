"use client";

import { useCallback, useState, type MouseEvent } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { useBalance } from "@/components/providers/balance-provider";
import { formatSol } from "@/lib/shared/sol";

const DEFAULT_AMOUNT_SOL = 0.1;
const HOUSE_ADDRESS = process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS ?? "";

type Phase =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "confirming"; signature: string }
  | { kind: "crediting"; signature: string }
  | { kind: "done"; signature: string; credited: number }
  | { kind: "error"; message: string };

export function DepositDialog() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { refresh } = useBalance();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const houseAddress = HOUSE_ADDRESS || null;
  const houseError = houseAddress
    ? null
    : "NEXT_PUBLIC_HOUSE_WALLET_ADDRESS nicht konfiguriert";

  const close = useCallback(() => {
    if (phase.kind === "signing" || phase.kind === "crediting") return;
    setOpen(false);
    setPhase({ kind: "idle" });
  }, [phase.kind]);

  const sendDeposit = useCallback(async () => {
    if (!publicKey || !houseAddress) return;

    try {
      setPhase({ kind: "signing" });

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(houseAddress),
          lamports: Math.round(DEFAULT_AMOUNT_SOL * LAMPORTS_PER_SOL),
        }),
      );
      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;

      const signature = await sendTransaction(tx, connection);
      setPhase({ kind: "confirming", signature });

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      setPhase({ kind: "crediting", signature });

      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          signature,
          walletAddress: publicKey.toBase58(),
        }),
      });
      const json = (await res.json()) as
        | { ok: true; credited: number; balance: number }
        | { ok?: false; error: string };

      if (!res.ok || !("ok" in json) || json.ok !== true) {
        throw new Error(
          ("error" in json && json.error) || "Gutschrift fehlgeschlagen",
        );
      }

      await refresh();
      setPhase({ kind: "done", signature, credited: json.credited });
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Transaktion abgebrochen",
      });
    }
  }, [connection, houseAddress, publicKey, refresh, sendTransaction]);

  if (!connected) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center border border-[var(--border)] bg-transparent px-3 font-mono text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        Einzahlen
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deposit-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={close}
        >
          <div
            onClick={(e: MouseEvent) => e.stopPropagation()}
            className="w-full max-w-md border border-[var(--border)] bg-black p-6 shadow-[0_30px_80px_-20px_rgba(255,69,0,0.5)]"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="deposit-title"
                className="text-xl font-bold tracking-tight"
              >
                Einzahlen
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
              Teste den Einzahlungs-Flow mit einer Transaktion über{" "}
              <strong className="text-[var(--accent)]">
                {formatSol(DEFAULT_AMOUNT_SOL, 2)} SOL
              </strong>{" "}
              an die House-Wallet. Nach der Bestätigung wird dein Guthaben
              automatisch gutgeschrieben.
            </p>

            <div className="mt-4 border border-[var(--border)] bg-[var(--muted)] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                House Wallet
              </p>
              <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-foreground/85">
                {houseError ?? houseAddress ?? "lade …"}
              </p>
            </div>

            <PhasePanel phase={phase} />

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={
                  phase.kind === "signing" || phase.kind === "crediting"
                }
                className="inline-flex h-10 items-center justify-center border border-[var(--border)] bg-transparent px-4 font-mono text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Schließen
              </button>
              <button
                type="button"
                onClick={sendDeposit}
                disabled={
                  !houseAddress ||
                  phase.kind === "signing" ||
                  phase.kind === "confirming" ||
                  phase.kind === "crediting"
                }
                className="inline-flex h-10 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-5 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {phase.kind === "signing" || phase.kind === "confirming"
                  ? "…"
                  : `0.1 SOL senden`}
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

  if (phase.kind === "signing") {
    return (
      <Notice tone="muted">Wallet-Dialog öffnen und Transaktion bestätigen …</Notice>
    );
  }
  if (phase.kind === "confirming") {
    return (
      <Notice tone="muted">
        Warte auf Bestätigung der Transaktion …
        <Sig value={phase.signature} />
      </Notice>
    );
  }
  if (phase.kind === "crediting") {
    return (
      <Notice tone="muted">
        Verifiziere Transaktion und schreibe Guthaben gut …
        <Sig value={phase.signature} />
      </Notice>
    );
  }
  if (phase.kind === "done") {
    return (
      <Notice tone="success">
        Gutgeschrieben: {formatSol(phase.credited, 4)} SOL
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
