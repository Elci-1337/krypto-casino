import Link from "next/link";
import { nav, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_82%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em]"
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 bg-[var(--accent)]"
          />
          <span>{site.brand}</span>
        </Link>

        <nav className="hidden md:block" aria-label="Hauptnavigation">
          <ul className="flex items-center gap-7 font-mono text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={site.calendly}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent-foreground)] transition hover:bg-transparent hover:text-[var(--accent)]"
        >
          Growth Call
          <span aria-hidden>→</span>
        </a>
      </div>
    </header>
  );
}
