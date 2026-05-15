import type { Metadata } from "next";
import Link from "next/link";
import { pillars, site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.brand} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

const stats = [
  { kpi: "DR 0 → 46", label: "in 3 Monaten für einen Kunden" },
  { kpi: "#1", label: "Traffic-Ranking DE · Q2/2024" },
  { kpi: "1 Mio.+", label: "SEO-Traffic generiert" },
  { kpi: "1 Mio.+", label: "Pinterest- & LinkedIn-Views" },
];

const method = [
  {
    step: "01",
    title: "Audit & Zielbild",
    body: "Wir mappen deine Money-Keywords gegen AI-Overviews und Listicle-SERPs. Du bekommst eine Lückenanalyse: wo Wettbewerber zitiert werden — und du nicht.",
  },
  {
    step: "02",
    title: "Mention-Plan",
    body: "Kuratierte Liste an Listicles, Publishern und Local-Citations mit Priorisierung nach Impact (AI-Citation-Wahrscheinlichkeit × Topical Authority).",
  },
  {
    step: "03",
    title: "Execution",
    body: "Outreach, Brand Mentions, Backlinks, NAP-Cleanup. Jede Platzierung mit Beweis-Link, DR/Traffic-Daten und Anchor-Dokumentation.",
  },
  {
    step: "04",
    title: "Tracking",
    body: "Monatliches Reporting: AI-Overview-SOV, Listicle-Positions, Local-Pack-Ranks, Brand-Mention-Velocity. Was du nicht messen kannst, kannst du nicht skalieren.",
  },
];

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.brand,
  url: site.url,
  email: site.email,
  description: site.description,
  areaServed: "DE",
  serviceType: [
    "Brand Mentions",
    "Listicle Placements",
    "Backlinks",
    "Local SEO Offpage",
    "Generative Engine Optimization",
  ],
  sameAs: [site.calendly, "https://www.linkedin.com/in/levent-elci-solutions/"],
  potentialAction: {
    "@type": "ReserveAction",
    target: site.calendly,
    name: "Growth Call buchen",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.brand,
  url: site.url,
  inLanguage: site.locale,
  description: site.description,
};

function escapeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(orgJsonLd) }}
      />

      {/* HERO */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden border-b border-[var(--border)]"
      >
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div className="flex flex-col gap-7">
            <p className="inline-flex w-fit items-center gap-2 border border-[var(--accent)] px-3 py-1 font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Offpage SEO · GEO · AI Overviews
            </p>

            <h1
              id="hero-heading"
              className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Werde dort zitiert,{" "}
              <span className="text-[var(--accent)]">wo Google entscheidet</span>.
            </h1>

            <p className="max-w-xl text-base text-[var(--foreground-muted)] sm:text-lg">
              2026 entscheiden <strong className="text-[var(--foreground)]">Listicles</strong>,{" "}
              <strong className="text-[var(--foreground)]">Brand Mentions</strong>,{" "}
              <strong className="text-[var(--foreground)]">Backlinks</strong> und{" "}
              <strong className="text-[var(--foreground)]">Local Citations</strong>, ob deine
              Marke in AI Overviews, ChatGPT und Perplexity auftaucht — oder nicht. Ich baue dir
              das Offpage-Profil, das LLMs zitieren und Google ranken muss.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href={site.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Growth Call buchen
                <span aria-hidden>→</span>
              </a>
              <Link
                href="#leistungen"
                className="inline-flex items-center gap-2 border border-[var(--border-strong)] px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Leistungen ansehen
              </Link>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="border-l border-[var(--border-strong)] pl-3">
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--foreground-dim)]">
                    {s.label}
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-[var(--foreground)]">
                    {s.kpi}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero side panel — „Today's mentions" mock */}
          <aside
            aria-hidden
            className="hidden md:block"
          >
            <div className="border border-[var(--border-strong)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--foreground-dim)]">
                <span>Live · Mention-Feed</span>
                <span className="text-[var(--success)]">● connected</span>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  { type: "LISTICLE", host: "t3n.de", text: "Top 10 SEO-Tools 2026 — Position 3" },
                  { type: "BRAND MENTION", host: "horizont.net", text: "„… Strategien wie die von Elci …“" },
                  { type: "BACKLINK", host: "omr.com", text: "DR 89 · do-follow · contextual" },
                  { type: "LOCAL", host: "Berlin · GBP", text: "Map Pack #2 → #1 (week-over-week)" },
                  { type: "AI CITATION", host: "ChatGPT", text: "Zitiert in Antwort auf „beste Offpage-Agentur“" },
                ].map((row) => (
                  <li
                    key={row.text}
                    className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--accent)]">
                        {row.type}
                      </p>
                      <p className="mt-1 text-[var(--foreground)]">{row.text}</p>
                    </div>
                    <span className="font-mono text-[0.7rem] text-[var(--foreground-dim)] whitespace-nowrap">
                      {row.host}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* TRUST BAR */}
      <section
        aria-label="Vertrauenssignale"
        className="border-b border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-6 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--foreground-dim)]">
          <span>Sichtbar in</span>
          <span>Google AI Overview</span>
          <span>ChatGPT</span>
          <span>Perplexity</span>
          <span>Gemini</span>
          <span>Claude</span>
          <span>Google Maps</span>
        </div>
      </section>

      {/* PILLARS / LEISTUNGEN */}
      <section
        id="leistungen"
        aria-labelledby="leistungen-heading"
        className="border-b border-[var(--border)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 flex flex-col gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
              Leistungen · Vier Hebel
            </p>
            <h2
              id="leistungen-heading"
              className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl"
            >
              Vier Offpage-Hebel — orchestriert, nicht isoliert.
            </h2>
            <p className="max-w-2xl text-[var(--foreground-muted)]">
              Einzelmaßnahmen liefern Einzelresultate. Ich orchestriere Listicles, Brand
              Mentions, Backlinks und Local SEO als ein System, das auf SOV in AI Overviews
              und organische Sichtbarkeit gleichzeitig zahlt.
            </p>
          </div>

          <div className="grid gap-px bg-[var(--border)] md:grid-cols-2">
            {pillars.map((p) => (
              <article
                key={p.id}
                id={p.id}
                className="group relative bg-[var(--background)] p-8 transition hover:bg-[var(--surface)]"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--foreground-dim)]">
                    {p.eyebrow} / {p.title}
                  </p>
                  <span
                    aria-hidden
                    className="font-mono text-xs text-[var(--foreground-dim)] transition group-hover:text-[var(--accent)]"
                  >
                    →
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[var(--foreground)]">
                  {p.headline}
                </h3>
                <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                  {p.description}
                </p>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-[var(--foreground)]/90">
                      <span aria-hidden className="mt-2 inline-block h-1 w-3 shrink-0 bg-[var(--accent)]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section
        id="methode"
        aria-labelledby="methode-heading"
        className="border-b border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 flex flex-col gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
              Methode
            </p>
            <h2
              id="methode-heading"
              className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl"
            >
              Vom Audit zur AI-Citation — in vier Schritten.
            </h2>
          </div>

          <ol className="grid gap-6 md:grid-cols-4">
            {method.map((m) => (
              <li
                key={m.step}
                className="flex flex-col gap-3 border border-[var(--border-strong)] bg-[var(--background)] p-6"
              >
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
                  {m.step}
                </span>
                <h3 className="text-lg font-semibold tracking-tight">{m.title}</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{m.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CASES (placeholder until echte Cases geliefert) */}
      <section
        id="cases"
        aria-labelledby="cases-heading"
        className="border-b border-[var(--border)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
                Cases
              </p>
              <h2
                id="cases-heading"
                className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl"
              >
                Was Kunden bekommen, statt was sie hören.
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                kpi: "DR 0 → 46",
                title: "B2B SaaS",
                body: "Brand-Mention-Programm + kuratiertes Backlink-Set über 3 Monate. Domain Rating in Ahrefs von 0 auf 46.",
              },
              {
                kpi: "#1 DE",
                title: "Vertical Publisher",
                body: "Listicle-Placements + Topical-Coverage-Strategie. Traffic-Ranking #1 Deutschland in Q2/2024.",
              },
              {
                kpi: "1 Mio.+",
                title: "Multi-Channel-Offpage",
                body: "1 Mio.+ generierter SEO-Traffic + 1 Mio.+ Views auf Pinterest und LinkedIn aus orchestrierter Mention-Strategie.",
              },
            ].map((c) => (
              <article
                key={c.title}
                className="border border-[var(--border-strong)] bg-[var(--surface)] p-6"
              >
                <p className="font-mono text-3xl font-bold text-[var(--accent)]">{c.kpi}</p>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / CTA */}
      <section
        id="kontakt"
        aria-labelledby="kontakt-heading"
        className="border-b border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
              Kontakt
            </p>
            <h2
              id="kontakt-heading"
              className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl"
            >
              30 Minuten. Klare Antwort, ob ich helfen kann.
            </h2>
            <p className="mt-4 max-w-xl text-[var(--foreground-muted)]">
              Kein Pitchdeck, kein Discovery-Call-Funnel. Du beschreibst Marke und Ziel — ich
              sage dir direkt, welche Offpage-Hebel realistisch sind und welche nicht.
            </p>
          </div>

          <div className="flex flex-col gap-3 border border-[var(--border-strong)] bg-[var(--background)] p-6">
            <a
              href={site.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between gap-2 bg-[var(--accent)] px-5 py-4 font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-foreground)] transition hover:opacity-90"
            >
              <span>Growth Call buchen</span>
              <span aria-hidden>→</span>
            </a>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center justify-between gap-2 border border-[var(--border-strong)] px-5 py-4 font-mono text-xs uppercase tracking-[0.22em] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <span>{site.email}</span>
              <span aria-hidden>→</span>
            </a>
            <a
              href="https://www.linkedin.com/in/levent-elci-solutions/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between gap-2 border border-[var(--border-strong)] px-5 py-4 font-mono text-xs uppercase tracking-[0.22em] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <span>LinkedIn</span>
              <span aria-hidden>→</span>
            </a>
            <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--foreground-dim)]">
              Calendly · 30 min · DE/EN
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
