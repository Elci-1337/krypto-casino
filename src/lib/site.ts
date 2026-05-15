/**
 * Single source of truth for site-wide constants. Edit here, propagates
 * everywhere (metadata, header, footer, JSON-LD).
 */
export const site = {
  url: "https://leventelci.de",
  name: "Levent Elci",
  brand: "Levent Elci",
  tagline: "Offpage SEO für das AI-Overview-Zeitalter",
  description:
    "Listicles, Brand Mentions, Backlinks und Local SEO Offpage — die vier Hebel, die deine Marke in Google AI Overviews, ChatGPT und Perplexity sichtbar machen.",
  email: "info@leventelci.de",
  calendly: "https://calendly.com/elci-levent/growth-call",
  legalName: "Elci Solutions Agency FZCO",
  twitter: "@leventelci",
  locale: "de-DE",
  language: "de",
} as const;

export const nav = [
  { href: "/#leistungen", label: "Leistungen" },
  { href: "/#methode", label: "Methode" },
  { href: "/#cases", label: "Cases" },
  { href: "/#kontakt", label: "Kontakt" },
] as const;

export const pillars = [
  {
    id: "listicles",
    eyebrow: "01",
    title: "Listicles",
    headline: "Platzierungen in „Best of“-Artikeln, die in AI Overviews zitiert werden.",
    description:
      "Ich identifiziere Listicles, die für deine Keywords ranken und in Google AI Overviews sowie ChatGPT-Antworten erscheinen — und sorge für die Aufnahme deiner Marke als gelistete Option.",
    bullets: [
      "Listicle-Recherche entlang deiner Money-Keywords",
      "Outreach an Publisher mit redaktioneller Hand",
      "Tracking: SOV in AI-Overviews + Position im Listicle",
    ],
  },
  {
    id: "brand-mentions",
    eyebrow: "02",
    title: "Brand Mentions",
    headline: "Markenerwähnungen, die Ranking-Signale UND AI-Citations liefern.",
    description:
      "Unverlinkte und verlinkte Erwähnungen auf themenrelevanten Domains. Brand Mentions sind der unterschätzte Hebel: sie wirken auf klassisches SEO und füttern gleichzeitig die Knowledge Layer hinter ChatGPT, Perplexity & Co.",
    bullets: [
      "PR-Portale, Branchenmagazine, Fachblogs",
      "Authoritative Domains mit Topical Trust",
      "Co-Mentions mit Wettbewerbern (Vergleichbarkeit erzeugen)",
    ],
  },
  {
    id: "backlinks",
    eyebrow: "03",
    title: "Backlinks",
    headline: "Saubere Backlinks von Domains, die echten Traffic & Autorität tragen.",
    description:
      "Keine Linkfarmen, keine PBNs. Themen-relevante Domains mit organischem Traffic, redaktionellem Kontext und nachvollziehbarer Platzierung — auditierbar in Ahrefs.",
    bullets: [
      "DR 30–80, organischer Traffic > 1.000/Monat",
      "Themen-Match per topical authority check",
      "Anchor-Profil-Steuerung gegen Penalty-Risiko",
    ],
  },
  {
    id: "local-seo",
    eyebrow: "04",
    title: "Local SEO Offpage",
    headline: "Citations, GBP-Signale und lokale Erwähnungen für Map-Pack-Rankings.",
    description:
      "Für lokale Unternehmen entscheidet das Offpage-Profil über das Map Pack. Konsistente NAP-Daten, qualifizierte Local Citations und lokale Brand Mentions pushen dich in den Drei-Pack.",
    bullets: [
      "NAP-Audit + Cleanup über alle relevanten Verzeichnisse",
      "Local Brand Mentions in regionalen Medien",
      "GBP-Signale: Reviews, Q&A, Posts orchestriert",
    ],
  },
] as const;

export type PillarId = (typeof pillars)[number]["id"];
