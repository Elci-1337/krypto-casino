"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { CardFace } from "@/components/card-face";
import type { Card } from "@/lib/shared/cards";
import {
  type Direction,
  type Outcome,
  STAKE_OPTIONS,
  winMultiplier,
} from "@/lib/shared/high-low";

import {
  resolveHighLowRound,
  startHighLowRound,
} from "./actions";
import type { ResolvedRoundPayload, StartedRound } from "@/lib/server/high-low-engine";

type Phase = "idle" | "placing" | "revealed";

type HistoryEntry = {
  id: string;
  outcome: Outcome;
  payout: number;
  stake: number;
  direction: Direction;
};

export function HighLowGame() {
  const { connected } = useWallet();
  const [stake, setStake] = useState<number>(STAKE_OPTIONS[0]);
  const [round, setRound] = useState<StartedRound | null>(null);
  const [resolved, setResolved] = useState<ResolvedRoundPayload | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const phase: Phase = resolved ? "revealed" : round ? "placing" : "idle";

  const higherMultiplier = useMemo(
    () => (round ? winMultiplier(round.current, "higher") : 0),
    [round],
  );
  const lowerMultiplier = useMemo(
    () => (round ? winMultiplier(round.current, "lower") : 0),
    [round],
  );

  const handleStart = useCallback(() => {
    setError(null);
    setResolved(null);
    startTransition(async () => {
      const res = await startHighLowRound();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRound(res.round);
    });
  }, []);

  const handleBet = useCallback(
    (direction: Direction) => {
      if (!round) return;
      setError(null);
      startTransition(async () => {
        const res = await resolveHighLowRound({
          roundId: round.roundId,
          direction,
          stake,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setResolved(res.round);
        setHistory((prev) =>
          [
            {
              id: res.round.roundId,
              outcome: res.round.outcome,
              payout: res.round.payout,
              stake: res.round.stake,
              direction: res.round.direction,
            },
            ...prev,
          ].slice(0, 5),
        );
      });
    },
    [round, stake],
  );

  const handleReset = useCallback(() => {
    setRound(null);
    setResolved(null);
    setError(null);
  }, []);

  const currentCard: Card | undefined = resolved?.current ?? round?.current;
  const nextCard: Card | undefined = resolved?.next;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* --- Table ------------------------------------------------------- */}
      <div className="flex flex-col gap-6 border border-[var(--border)] bg-[var(--muted)] p-6 sm:p-8">
        <StakePicker
          stake={stake}
          onChange={setStake}
          disabled={phase === "placing" || isPending}
        />

        <div className="flex flex-wrap items-center justify-center gap-6 py-4">
          <CardFace card={currentCard} glow size="lg" />
          <div
            aria-hidden="true"
            className="font-mono text-3xl text-foreground/30"
          >
            vs.
          </div>
          <CardFace card={nextCard} faceDown={!resolved} glow={!!resolved} size="lg" />
        </div>

        <ActionRow
          phase={phase}
          isPending={isPending}
          connected={connected}
          higherMultiplier={higherMultiplier}
          lowerMultiplier={lowerMultiplier}
          blocked={round?.blocked ?? null}
          onStart={handleStart}
          onBet={handleBet}
          onReset={handleReset}
        />

        {error ? (
          <p
            role="alert"
            className="border border-[var(--accent)] bg-black px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--accent)]"
          >
            {error}
          </p>
        ) : null}

        {resolved ? <ResultPanel resolved={resolved} /> : null}
      </div>

      {/* --- Side panel -------------------------------------------------- */}
      <aside className="flex flex-col gap-6">
        <FairnessPanel round={round} resolved={resolved} />
        <HistoryPanel history={history} />
      </aside>
    </div>
  );
}

/* --- Subcomponents ------------------------------------------------------- */

function StakePicker({
  stake,
  onChange,
  disabled,
}: {
  stake: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
        Einsatz
      </legend>
      <div className="flex flex-wrap gap-2">
        {STAKE_OPTIONS.map((v) => {
          const active = v === stake;
          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => onChange(v)}
              className={[
                "inline-flex h-11 items-center justify-center border px-5 font-mono text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                  : "border-[var(--border)] bg-transparent text-foreground hover:border-[var(--accent)] hover:text-[var(--accent)]",
              ].join(" ")}
            >
              {v} SOL
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ActionRow({
  phase,
  isPending,
  connected,
  higherMultiplier,
  lowerMultiplier,
  blocked,
  onStart,
  onBet,
  onReset,
}: {
  phase: Phase;
  isPending: boolean;
  connected: boolean;
  higherMultiplier: number;
  lowerMultiplier: number;
  blocked: Direction | null;
  onStart: () => void;
  onBet: (d: Direction) => void;
  onReset: () => void;
}) {
  if (phase === "idle") {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={isPending}
          className="inline-flex h-12 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-6 font-mono text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {isPending ? "Mische Deck …" : "Neue Runde starten"}
        </button>
        {!connected ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/50">
            Tipp: verbinde deine Wallet, um echte Einsätze zu spielen.
          </p>
        ) : null}
      </div>
    );
  }

  if (phase === "placing") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <BetButton
          direction="higher"
          multiplier={higherMultiplier}
          disabled={
            blocked === "higher" || higherMultiplier === 0 || isPending
          }
          pending={isPending}
          onClick={() => onBet("higher")}
        />
        <BetButton
          direction="lower"
          multiplier={lowerMultiplier}
          disabled={blocked === "lower" || lowerMultiplier === 0 || isPending}
          pending={isPending}
          onClick={() => onBet("lower")}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onReset}
      className="inline-flex h-12 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-6 font-mono text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)]"
    >
      Nächste Runde
    </button>
  );
}

function BetButton({
  direction,
  multiplier,
  disabled,
  pending,
  onClick,
}: {
  direction: Direction;
  multiplier: number;
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  const label = direction === "higher" ? "Höher ↑" : "Niedriger ↓";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex h-14 flex-col items-center justify-center border border-[var(--border)] bg-transparent px-6 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-foreground"
    >
      <span>{pending ? "…" : label}</span>
      <span className="mt-0.5 text-[10px] font-medium tracking-[0.2em] text-foreground/50 group-hover:text-[var(--accent)]/70">
        {multiplier > 0 ? `× ${multiplier.toFixed(2)}` : "nicht möglich"}
      </span>
    </button>
  );
}

function ResultPanel({ resolved }: { resolved: ResolvedRoundPayload }) {
  const tone =
    resolved.outcome === "win"
      ? "border-[var(--accent)] text-[var(--accent)]"
      : resolved.outcome === "push"
        ? "border-white/40 text-foreground"
        : "border-white/20 text-foreground/60";

  const label =
    resolved.outcome === "win"
      ? "Gewonnen"
      : resolved.outcome === "push"
        ? "Push"
        : "Verloren";

  return (
    <div className={`flex flex-col gap-1 border bg-black px-4 py-3 ${tone}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em]">
        Ergebnis
      </p>
      <p className="text-lg font-bold">
        {label}{" "}
        <span className="text-foreground/60">
          &middot; Auszahlung {resolved.payout.toFixed(4)} SOL
        </span>
      </p>
    </div>
  );
}

function FairnessPanel({
  round,
  resolved,
}: {
  round: StartedRound | null;
  resolved: ResolvedRoundPayload | null;
}) {
  if (!round && !resolved) {
    return (
      <div className="border border-[var(--border)] bg-[var(--muted)] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
          Fairness
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          Starte eine Runde, um den Commitment-Hash zu sehen.
        </p>
      </div>
    );
  }

  const commit = resolved?.serverSeedHash ?? round!.serverSeedHash;
  const clientSeed = resolved?.clientSeed ?? round!.clientSeed;
  const serverSeed = resolved?.serverSeed ?? null;

  return (
    <div className="border border-[var(--border)] bg-[var(--muted)] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
        Fairness
      </p>
      <dl className="mt-3 space-y-3 text-xs">
        <Field label="Commit (SHA-256)" value={commit} />
        <Field label="Client Seed" value={clientSeed} />
        <Field
          label="Server Seed"
          value={serverSeed ?? "· · · wird nach der Runde offengelegt · · ·"}
          hint={!serverSeed ? "commit bindet den Server an diesen Seed" : undefined}
        />
      </dl>
    </div>
  );
}

function Field({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-[11px] leading-relaxed text-foreground/85">
        {value}
      </dd>
      {hint ? (
        <p className="mt-0.5 text-[10px] italic text-foreground/50">{hint}</p>
      ) : null}
    </div>
  );
}

function HistoryPanel({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--muted)] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
        Letzte Runden
      </p>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-foreground/60">
          Noch keine Runde gespielt.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--border)]">
          {history.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between gap-3 py-2 font-mono text-xs"
            >
              <span className="uppercase tracking-[0.15em] text-foreground/60">
                {h.direction === "higher" ? "↑" : "↓"} {h.stake} SOL
              </span>
              <span
                className={
                  h.outcome === "win"
                    ? "text-[var(--accent)]"
                    : h.outcome === "push"
                      ? "text-foreground/70"
                      : "text-foreground/40"
                }
              >
                {h.outcome.toUpperCase()} &middot; {h.payout.toFixed(4)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
