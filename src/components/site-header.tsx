import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-[var(--accent)]" />
          <span className="font-mono text-lg font-bold tracking-tight">
            KRYPTO<span className="text-[var(--accent)]">.</span>CASINO
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link
            href="/"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            Lobby
          </Link>
          <Link
            href="/"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            Fairness
          </Link>
          <Link
            href="/"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            Wallet
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-none border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)]"
        >
          Connect
        </button>
      </div>
    </header>
  );
}
