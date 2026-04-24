/**
 * CSS-only animated Ace of Spades. Pure server component, zero JS.
 * Honors prefers-reduced-motion via the `.motion-*` classes in globals.css.
 */
export function PlayingCard() {
  return (
    <div
      aria-hidden="true"
      className="relative flex items-center justify-center w-[240px] h-[336px] sm:w-[280px] sm:h-[392px]"
    >
      {/* Ambient orange glow behind the card */}
      <div
        className="motion-glow absolute inset-0 -z-10 rounded-[32px] bg-[var(--accent)] blur-3xl"
        style={{ animation: "card-glow 4s ease-in-out infinite" }}
      />

      {/* The card */}
      <div
        className="motion-card relative h-full w-full rounded-2xl border border-white/15 bg-gradient-to-b from-white to-[#f2f2f2] text-black shadow-[0_30px_60px_-20px_rgba(255,69,0,0.45)] overflow-hidden"
        style={{ animation: "card-float 6s ease-in-out infinite" }}
      >
        {/* Top-left rank + suit */}
        <div className="absolute left-4 top-3 flex flex-col items-center leading-none">
          <span className="font-mono text-3xl font-bold">A</span>
          <span className="text-2xl" aria-hidden="true">
            ♠
          </span>
        </div>

        {/* Bottom-right rank + suit (rotated) */}
        <div className="absolute right-4 bottom-3 flex flex-col items-center leading-none rotate-180">
          <span className="font-mono text-3xl font-bold">A</span>
          <span className="text-2xl" aria-hidden="true">
            ♠
          </span>
        </div>

        {/* Center suit */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="text-[140px] sm:text-[170px] leading-none text-black drop-shadow-[0_6px_0_rgba(255,69,0,0.35)]"
          >
            ♠
          </span>
        </div>

        {/* Accent corner tag */}
        <div className="absolute left-0 top-0 h-2 w-24 bg-[var(--accent)]" />
        <div className="absolute right-0 bottom-0 h-2 w-24 bg-[var(--accent)]" />

        {/* Shine sweep */}
        <div
          className="motion-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          style={{ animation: "card-shine 5s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
