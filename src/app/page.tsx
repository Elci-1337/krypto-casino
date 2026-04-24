import type { Metadata } from "next";
import { PlayingCard } from "@/components/playing-card";

export const metadata: Metadata = {
  title:
    "Kartenglücksspiel 2.0 – Sicher, Fair & Direkt mit Krypto",
  description:
    "Kartenglücksspiel neu gedacht: Provably Fair, anonym und direkt mit Krypto. Blackjack, Poker und Baccarat on-chain – ohne KYC, ohne Wartezeit, ohne Mittelsmann.",
  alternates: { canonical: "/" },
};

const faq: { q: string; a: string }[] = [
  {
    q: "Was ist Kartenglücksspiel mit Krypto?",
    a: "Kartenglücksspiel mit Krypto bedeutet, dass klassische Kartenspiele wie Blackjack, Poker oder Baccarat direkt über eine Blockchain-Wallet gespielt werden. Einsätze, Gewinne und Auszahlungen laufen on-chain ab – ohne Bank, ohne Zahlungsanbieter und ohne Wartezeit.",
  },
  {
    q: "Was bedeutet Provably Fair bei Kartenspielen?",
    a: "Provably Fair ist ein kryptografisches Verfahren, mit dem jede Spielrunde verifizierbar fair gemischt wird. Server-Seed, Client-Seed und Nonce werden vor der Runde festgelegt und danach offengelegt. Spieler können so jederzeit selbst nachrechnen, dass keine Karte manipuliert wurde.",
  },
  {
    q: "Ist Online-Kartenglücksspiel in Deutschland legal?",
    a: "Die Rechtslage für Online-Kartenglücksspiel ist je nach Bundesland unterschiedlich. Spieler sind selbst verantwortlich zu prüfen, ob die Teilnahme an Online-Glücksspiel in ihrer Region erlaubt ist. kartengluecksspiel.com richtet sich ausschließlich an volljährige Personen in Regionen, in denen Krypto-Glücksspiel zulässig ist.",
  },
  {
    q: "Welche Kartenspiele kann ich mit Krypto spielen?",
    a: "Zum Start stehen die Klassiker bereit: Blackjack, Video Poker, Baccarat und Hi-Lo. Alle Spiele laufen Provably Fair und werden mit SOL oder gängigen SPL-Token auf Solana abgerechnet.",
  },
  {
    q: "Brauche ich KYC oder eine Identitätsprüfung?",
    a: "Nein. Für das Kartenglücksspiel auf kartengluecksspiel.com reicht eine Solana-Wallet wie Phantom. Es werden keine Ausweisdaten, keine Bankverbindung und keine persönlichen Angaben gespeichert.",
  },
  {
    q: "Wie schnell erhalte ich meine Auszahlung?",
    a: "Auszahlungen erfolgen on-chain und sind in der Regel innerhalb weniger Sekunden auf der Wallet bestätigt. Es gibt keine manuellen Prüfungen, keine Auszahlungslimits durch Drittanbieter und keine versteckten Gebühren.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "kartengluecksspiel.com",
  url: "https://kartengluecksspiel.com",
  inLanguage: "de-DE",
  description:
    "Provably Fair Kartenglücksspiel auf Solana – Blackjack, Poker und Baccarat direkt mit Krypto.",
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
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(faqJsonLd) }}
      />

      {/* --- HERO --------------------------------------------------------- */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden border-b border-[var(--border)]"
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-24 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="flex flex-col gap-6">
            <p className="inline-flex w-fit items-center gap-2 border border-[var(--accent)] px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
              />
              Provably Fair &middot; Solana
            </p>

            <h1
              id="hero-heading"
              className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Kartenglücksspiel 2.0{" "}
              <span className="text-[var(--accent)]">–</span> Sicher, Fair &amp;
              Direkt mit Krypto
            </h1>

            <p className="max-w-xl text-base text-foreground/75 sm:text-lg">
              Blackjack, Poker und Baccarat on-chain. Ohne KYC, ohne
              Mittelsmann, ohne Wartezeit – jede Karte kryptografisch
              überprüfbar.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#spiele"
                className="inline-flex h-12 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-7 font-mono text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)]"
              >
                Sofort spielen
              </a>
              <a
                href="#fairness"
                className="inline-flex h-12 items-center justify-center border border-[var(--border)] bg-transparent px-7 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Fairness prüfen
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end">
            <PlayingCard />
          </div>
        </div>
      </section>

      {/* --- INTRO (~200 words) ------------------------------------------- */}
      <section
        aria-labelledby="intro-heading"
        className="border-b border-[var(--border)]"
      >
        <article className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2
            id="intro-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Warum Kartenglücksspiel mit Krypto?
          </h2>

          <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground/80 sm:text-lg">
            <p>
              <strong className="text-foreground">Kartenglücksspiel</strong>{" "}
              hat sich in den letzten Jahren radikal verändert. Wo früher
              Banken, Lizenzprüfer und intransparente Zufallsgeneratoren
              zwischen Spieler und Auszahlung standen, setzen moderne
              Krypto-Plattformen auf drei klare Vorteile: Provably Fair,
              Anonymität und sofortige Settlements.
            </p>
            <p>
              <strong className="text-[var(--accent)]">Provably Fair</strong>{" "}
              bedeutet, dass jede Karte, die gezogen wird, mathematisch
              überprüfbar ist. Server-Seed, Client-Seed und Nonce werden vor
              der Runde festgelegt und nach dem Spiel veröffentlicht – wer
              will, rechnet nach und sieht sofort, ob das Haus ehrlich war. Ein
              klassisches Online-Casino kann diese Garantie nicht bieten.
            </p>
            <p>
              <strong className="text-[var(--accent)]">Anonymität</strong>{" "}
              entsteht, weil weder Bankverbindung noch Ausweis nötig sind. Wer
              eine Solana-Wallet besitzt, kann in Sekunden ein- und auszahlen –
              ohne KYC-Hürden, ohne Wartezeiten, ohne dass sensible Daten auf
              fremden Servern liegen.
            </p>
            <p>
              Beim Kartenglücksspiel auf kartengluecksspiel.com wird jede Wette
              direkt mit der Wallet abgewickelt. Einzahlungen sind in unter
              einer Minute bestätigt, Auszahlungen laufen automatisch on-chain
              – keine Zwischenkonten, keine versteckten Gebühren, keine Limits
              durch dritte Dienstleister.
            </p>
            <p>
              Das Ergebnis: Klassiker wie Blackjack, Poker und Baccarat – aber
              mit der Transparenz, Geschwindigkeit und Kontrolle, die nur
              Krypto ermöglicht. Kartenglücksspiel 2.0.
            </p>
          </div>
        </article>
      </section>

      {/* --- SPIELE / Scroll-Target -------------------------------------- */}
      <section
        id="spiele"
        aria-labelledby="spiele-heading"
        className="scroll-mt-16 border-b border-[var(--border)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="flex items-end justify-between gap-4">
            <h2
              id="spiele-heading"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Kartenspiele
            </h2>
            <p className="hidden font-mono text-xs uppercase tracking-[0.2em] text-foreground/50 sm:block">
              Demnächst verfügbar
            </p>
          </div>

          <ul className="mt-8 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Blackjack",
                desc: "Schlage den Dealer bei 21 – mit verifizierbarem Shuffle.",
                suit: "♠",
              },
              {
                name: "Video Poker",
                desc: "Jacks or Better, provably fair, 1:1 on-chain Payout.",
                suit: "♥",
              },
              {
                name: "Baccarat",
                desc: "Punto, Banco oder Tie. Eine Karte entscheidet.",
                suit: "♦",
              },
              {
                name: "Hi-Lo",
                desc: "Höher oder tiefer? Die reinste Form von Kartenglück.",
                suit: "♣",
              },
              {
                name: "Texas Hold'em",
                desc: "PvP-Tische on-chain, mit Smart-Contract-Pot.",
                suit: "♠",
              },
              {
                name: "War",
                desc: "Eine Karte, ein Sieger. Kein Einstieg ist direkter.",
                suit: "♥",
              },
            ].map((g) => (
              <li key={g.name} className="bg-background p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold">{g.name}</h3>
                  <span
                    aria-hidden="true"
                    className="text-2xl text-[var(--accent)]"
                  >
                    {g.suit}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground/65">{g.desc}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Soon
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- FAIRNESS ----------------------------------------------------- */}
      <section
        id="fairness"
        aria-labelledby="fairness-heading"
        className="scroll-mt-16 border-b border-[var(--border)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2
            id="fairness-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            So funktioniert Provably Fair
          </h2>
          <ol className="mt-8 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Commit",
                text: "Der Server veröffentlicht den SHA-256 Hash seines Seeds – vor deiner Wette.",
              },
              {
                step: "02",
                title: "Play",
                text: "Du setzt deinen eigenen Client-Seed und bestätigst die Runde mit deiner Wallet.",
              },
              {
                step: "03",
                title: "Reveal",
                text: "Nach der Runde wird der Server-Seed offengelegt. Jede Karte ist nachrechenbar.",
              },
            ].map((s) => (
              <li key={s.step} className="bg-background p-6">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                  {s.step}
                </p>
                <p className="mt-2 text-lg font-bold">{s.title}</p>
                <p className="mt-1 text-sm text-foreground/65">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- FAQ ---------------------------------------------------------- */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="scroll-mt-16"
      >
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2
            id="faq-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Häufige Fragen zum Kartenglücksspiel online
          </h2>

          <div className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {faq.map(({ q, a }) => (
              <details
                key={q}
                className="group px-2 py-5 open:bg-[var(--muted)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold sm:text-lg">
                  <span>{q}</span>
                  <span
                    aria-hidden="true"
                    className="font-mono text-[var(--accent)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-foreground/75 sm:text-base">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
