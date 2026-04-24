import type { Metadata } from "next";
import { HighLowGame } from "./high-low-game";

export const metadata: Metadata = {
  title: "Higher or Lower – Provably Fair Kartenspiel mit Solana",
  description:
    "Spiele Higher or Lower on-chain: Wette 0.01, 0.1 oder 0.5 SOL, ob die nächste Karte höher oder niedriger ist. Jede Runde ist Provably Fair.",
  alternates: { canonical: "/play/high-low" },
  robots: { index: true, follow: true },
};

export default function HighLowPage() {
  return (
    <section
      aria-labelledby="high-low-heading"
      className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:py-16"
    >
      <header className="flex flex-col gap-3">
        <p className="inline-flex w-fit items-center gap-2 border border-[var(--accent)] px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
          />
          Provably Fair
        </p>
        <h1
          id="high-low-heading"
          className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl"
        >
          Higher or Lower <span className="text-[var(--accent)]">–</span> eine
          Karte entscheidet.
        </h1>
        <p className="max-w-2xl text-base text-foreground/70 sm:text-lg">
          Der Server committed vor der Runde auf einen Seed. Du wählst Einsatz
          und Richtung. Nach der Runde wird der Seed veröffentlicht &ndash; jede
          Karte ist nachrechenbar.
        </p>
      </header>

      <HighLowGame />
    </section>
  );
}
