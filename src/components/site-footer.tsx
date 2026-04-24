export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-background">
      {/* --- Verantwortungsvolles Spiel --------------------------------- */}
      <section
        aria-labelledby="responsible-gambling-heading"
        className="border-b border-[var(--border)]"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center">
          <span
            role="img"
            aria-label="Nur für Personen ab 18 Jahren"
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-black font-mono text-lg font-bold text-[var(--accent)] shadow-[0_0_24px_-4px_rgba(255,69,0,0.6)]"
          >
            18+
          </span>

          <div className="flex-1">
            <h2
              id="responsible-gambling-heading"
              className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]"
            >
              Verantwortungsvolles Spiel
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Kartenglücksspiel kann süchtig machen. Spiele nur mit Geld, dessen
              Verlust du dir leisten kannst, und setze dir feste Einsatz- und
              Zeitlimits. Angebote richten sich ausschließlich an volljährige
              Personen (18+) in Regionen, in denen Online-Glücksspiel erlaubt
              ist.
            </p>
            <p className="mt-2 text-xs text-foreground/55">
              Hilfe bei Spielsucht:{" "}
              <a
                href="https://www.bzga.de"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--accent)] decoration-2 underline-offset-2 hover:text-[var(--accent)]"
              >
                bzga.de
              </a>{" "}
              &middot;{" "}
              <a
                href="tel:08003722700"
                className="underline decoration-[var(--accent)] decoration-2 underline-offset-2 hover:text-[var(--accent)]"
              >
                0800 1 372 700
              </a>{" "}
              (kostenlose Beratung, Deutschland)
            </p>
          </div>
        </div>
      </section>

      {/* --- Copyright ---------------------------------------------------- */}
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-6 text-xs text-foreground/50 sm:flex-row sm:items-center">
        <p className="font-mono uppercase tracking-wider">
          &copy; {new Date().getFullYear()} kartengluecksspiel.com
        </p>
        <p className="font-mono uppercase tracking-wider">
          Powered by <span className="text-[var(--accent)]">Solana</span> &middot;{" "}
          Provably Fair
        </p>
      </div>
    </footer>
  );
}
