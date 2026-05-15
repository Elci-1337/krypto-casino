import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em]">
            <span aria-hidden className="inline-block h-2 w-2 bg-[var(--accent)]" />
            <span>{site.brand}</span>
          </div>
          <p className="mt-4 max-w-md text-sm text-[var(--foreground-muted)]">
            {site.tagline}. Brand Mentions, Listicles, Backlinks, Local SEO —
            für Marken, die in Google AI Overviews und LLM-Antworten zitiert
            werden wollen.
          </p>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
            Leistungen
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-[var(--accent)]" href="/#listicles">Listicles</Link></li>
            <li><Link className="hover:text-[var(--accent)]" href="/#brand-mentions">Brand Mentions</Link></li>
            <li><Link className="hover:text-[var(--accent)]" href="/#backlinks">Backlinks</Link></li>
            <li><Link className="hover:text-[var(--accent)]" href="/#local-seo">Local SEO Offpage</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
            Kontakt
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                className="hover:text-[var(--accent)]"
                href={site.calendly}
                target="_blank"
                rel="noopener noreferrer"
              >
                Growth Call (Calendly)
              </a>
            </li>
            <li>
              <a className="hover:text-[var(--accent)]" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
            <li><Link className="hover:text-[var(--accent)]" href="/impressum">Impressum</Link></li>
            <li><Link className="hover:text-[var(--accent)]" href="/datenschutz">Datenschutz</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--foreground-dim)] md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} {site.legalName}</span>
          <span>Made for AI Overviews · Built on Next.js</span>
        </div>
      </div>
    </footer>
  );
}
