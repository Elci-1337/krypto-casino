import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GMB Domain Finder",
  description: "Scrape Google Maps Profile und finde freie Domains",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen">
        <header className="border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="font-semibold text-lg tracking-tight">
              GMB Domain Finder
            </a>
            <span className="text-xs text-foreground/50">via Apify · DNS · RDAP</span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
