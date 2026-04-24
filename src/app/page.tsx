export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
      <section className="flex flex-col gap-6">
        <span className="inline-flex w-fit items-center gap-2 border border-[var(--accent)] px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Scaffold Ready
        </span>
        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
          High stakes.
          <br />
          <span className="text-[var(--accent)]">Zero trust.</span>
          <br />
          Pure code.
        </h1>
        <p className="max-w-xl text-base text-foreground/70 sm:text-lg">
          Provably fair crypto casino built on Solana. Deposits and payouts
          settled on-chain. Every roll verifiable from seed to result.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-6 font-mono text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--accent-hover)]"
          >
            Enter Lobby
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center border border-[var(--border)] bg-transparent px-6 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Verify Fairness
          </button>
        </div>
      </section>

      <section className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        {[
          {
            label: "Chain",
            value: "Solana",
            note: "Fast finality, low fees",
          },
          {
            label: "Fairness",
            value: "HMAC-SHA256",
            note: "Server + client seed + nonce",
          },
          {
            label: "Custody",
            value: "Non-custodial",
            note: "Your wallet, your keys",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-background p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-foreground/60">{stat.note}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
