import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WalletContextProvider } from "@/components/providers/wallet-provider";
import { BalanceProvider } from "@/components/providers/balance-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const siteUrl = "https://kartengluecksspiel.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "Kartenglücksspiel 2.0 – Sicher, Fair & Direkt mit Krypto | kartengluecksspiel.com",
    template: "%s | kartengluecksspiel.com",
  },
  description:
    "Kartenglücksspiel neu gedacht: Provably Fair, anonym und direkt mit Krypto. Poker, Blackjack und Baccarat on-chain – keine Wartezeiten, keine KYC-Hürden, sofortige Auszahlungen über Solana.",
  keywords: [
    "Kartenglücksspiel",
    "Kartenspiele online",
    "Krypto Casino",
    "Provably Fair",
    "Solana Casino",
    "Online Blackjack",
    "Online Poker",
    "Anonym spielen",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "kartengluecksspiel.com",
    title:
      "Kartenglücksspiel 2.0 – Sicher, Fair & Direkt mit Krypto",
    description:
      "Provably Fair Kartenglücksspiel auf Solana. Anonym, sofort, ohne Mittelsmann.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kartenglücksspiel 2.0 – Sicher, Fair & Direkt mit Krypto",
    description:
      "Provably Fair Kartenglücksspiel auf Solana. Anonym, sofort, ohne Mittelsmann.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <WalletContextProvider>
          <BalanceProvider>
            <SiteHeader />
            <main id="main" className="flex-1 w-full">
              {children}
            </main>
            <SiteFooter />
          </BalanceProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
