import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung — Platzhalter.",
  alternates: { canonical: "/datenschutz" },
};

export default function DatenschutzPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Datenschutz</h1>
      <p className="mt-4 text-sm text-[var(--foreground-muted)]">
        Platzhalter — finale Datenschutzerklärung folgt. Bitte durch geprüften Text
        deines Datenschutzbeauftragten ersetzen.
      </p>

      <section className="mt-10 space-y-4 text-[var(--foreground)]/90">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Verantwortlicher
        </h2>
        <p>REPLACE_ME — siehe Impressum.</p>

        <h2 className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Welche Daten werden verarbeitet?
        </h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          Aktuell werden auf dieser Seite keine personenbezogenen Daten über Tracking
          oder Cookies erhoben. Bei Kontaktaufnahme per E-Mail gelten die üblichen
          Speicherfristen.
        </p>
      </section>
    </article>
  );
}
