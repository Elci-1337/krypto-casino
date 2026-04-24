export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-6 text-xs text-foreground/50 sm:flex-row sm:items-center">
        <p className="font-mono uppercase tracking-wider">
          &copy; {new Date().getFullYear()} Krypto Casino
        </p>
        <p className="font-mono uppercase tracking-wider">
          Powered by <span className="text-[var(--accent)]">Solana</span> &middot;{" "}
          Provably Fair
        </p>
      </div>
    </footer>
  );
}
