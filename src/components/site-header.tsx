import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="kartengluecksspiel.com Startseite"
        >
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-sm bg-[var(--accent)]"
          />
          <span className="font-mono text-lg font-bold tracking-tight">
            KARTEN<span className="text-[var(--accent)]">.</span>GLÜCK
          </span>
        </Link>

        <nav
          aria-label="Primäre Navigation"
          className="hidden items-center gap-6 text-sm font-medium sm:flex"
        >
          <a
            href="#spiele"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            Spiele
          </a>
          <a
            href="#fairness"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            Fairness
          </a>
          <a
            href="#faq"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            FAQ
          </a>
        </nav>

        <button
          type="button"
          data-wallet-connect
          aria-label="Solana Wallet verbinden (Phantom)"
          className="inline-flex h-9 items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)]"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-black"
          />
          Connect Wallet
        </button>
      </div>
    </header>
  );
}
