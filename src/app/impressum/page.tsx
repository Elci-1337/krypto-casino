import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Impressum",
  description: `Impressum & rechtliche Angaben von ${site.legalName}.`,
  alternates: { canonical: "/impressum" },
};

export default function ImpressumPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Impressum</h1>
      <p className="mt-4 text-sm text-[var(--foreground-muted)]">
        Angaben gemäß § 5 TMG · Stand: Platzhalter (vom Inhaber zu finalisieren).
      </p>

      <section className="mt-10 space-y-4 text-[var(--foreground)]/90">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Anbieter
        </h2>
        <p>
          {site.legalName}
          <br />
          REPLACE_ME Straße / Hausnummer
          <br />
          REPLACE_ME PLZ / Ort
          <br />
          REPLACE_ME Land
        </p>

        <h2 className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Kontakt
        </h2>
        <p>
          E-Mail:{" "}
          <a className="hover:text-[var(--accent)]" href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </p>

        <h2 className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Verantwortlich i.S.d. § 18 Abs. 2 MStV
        </h2>
        <p>{site.brand}, Adresse wie oben.</p>

        <h2 className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Haftungsausschluss
        </h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          REPLACE_ME — Standard-Klauseln zu Haftung für Inhalte, Links und Urheberrecht
          hier einfügen (bitte durch geprüften Text deines Anwalts ersetzen).
        </p>
      </section>
    </article>
  );
}
