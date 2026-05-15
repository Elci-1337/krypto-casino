import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/site";

// Fonts as CSS variables — replace later with deine CI-Schrift (z.B. via
// next/font/local für eine self-hosted Display-Font).
const sans = Inter({
  variable: "--font-sans-stack",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-stack",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.brand} — ${site.tagline}`,
    template: `%s | ${site.brand}`,
  },
  description: site.description,
  keywords: [
    "Brand Mentions",
    "Listicles SEO",
    "AI Overviews SEO",
    "Backlinks kaufen",
    "Local SEO Offpage",
    "Offpage SEO Agentur",
    "Generative Engine Optimization",
    "GEO SEO",
    "Levent Elci",
  ],
  authors: [{ name: site.brand, url: site.url }],
  creator: site.brand,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: site.url,
    siteName: site.brand,
    title: `${site.brand} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.brand} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={site.language}
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-[var(--accent)] focus:text-[var(--accent-foreground)] focus:px-3 focus:py-1 focus:font-mono focus:text-xs"
        >
          Zum Inhalt springen
        </a>
        <SiteHeader />
        <main id="main" className="flex-1 w-full">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
