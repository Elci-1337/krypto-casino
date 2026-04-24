import Link from "next/link";
import { WalletButton } from "@/components/wallet-button";
import { WalletBalance } from "@/components/wallet-balance";
import { DepositDialog } from "@/components/deposit-dialog";
import { WithdrawDialog } from "@/components/withdraw-dialog";
import { AuthButton } from "@/components/auth-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="kartengluecksspiel.com Startseite"
        >
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-sm bg-[var(--accent)]"
          />
          <span className="font-mono text-lg font-bold tracking-tight">
            KARTEN<span className="text-[var(--accent)]">.</span>GLÜCK
          </span>
        </Link>

        <nav
          aria-label="Primäre Navigation"
          className="hidden items-center gap-6 text-sm font-medium sm:flex"
        >
          <a
            href="#spiele"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            Spiele
          </a>
          <a
            href="#fairness"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            Fairness
          </a>
          <a
            href="#faq"
            className="text-foreground/70 transition-colors hover:text-[var(--accent)]"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <WalletBalance />
          <DepositDialog />
          <WithdrawDialog />
          <AuthButton />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
