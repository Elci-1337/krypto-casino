import {
  type Card,
  isRedSuit,
  rankLabel,
  suitGlyph,
} from "@/lib/shared/cards";

type Props = {
  card?: Card;
  faceDown?: boolean;
  glow?: boolean;
  size?: "md" | "lg";
};

/**
 * Reusable playing-card face. Shares the same orange glow primitive as the
 * hero ace on the landing page (see `.motion-glow` keyframe in globals.css).
 */
export function CardFace({
  card,
  faceDown = false,
  glow = false,
  size = "md",
}: Props) {
  const dims =
    size === "lg"
      ? "w-[180px] h-[252px] sm:w-[220px] sm:h-[308px]"
      : "w-[140px] h-[196px] sm:w-[160px] sm:h-[224px]";

  return (
    <div className={`relative flex items-center justify-center ${dims}`}>
      {glow ? (
        <div
          aria-hidden="true"
          className="motion-glow absolute inset-0 -z-10 rounded-[28px] bg-[var(--accent)] blur-3xl"
          style={{ animation: "card-glow 4s ease-in-out infinite" }}
        />
      ) : null}

      {faceDown || !card ? (
        <CardBack />
      ) : (
        <CardFront card={card} size={size} />
      )}
    </div>
  );
}

function CardFront({ card, size }: { card: Card; size: "md" | "lg" }) {
  const red = isRedSuit(card.suit);
  const rank = rankLabel(card.rank);
  const glyph = suitGlyph(card.suit);
  const centerSize =
    size === "lg"
      ? "text-[120px] sm:text-[150px]"
      : "text-[80px] sm:text-[100px]";

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white to-[#f2f2f2] text-black shadow-[0_20px_45px_-20px_rgba(255,69,0,0.45)]"
      role="img"
      aria-label={`${rank} ${card.suit}`}
    >
      <div className="absolute left-3 top-2 flex flex-col items-center leading-none">
        <span
          className={`font-mono font-bold ${size === "lg" ? "text-2xl" : "text-xl"} ${red ? "text-[#c0392b]" : "text-black"}`}
        >
          {rank}
        </span>
        <span
          aria-hidden="true"
          className={`${size === "lg" ? "text-xl" : "text-lg"} ${red ? "text-[#c0392b]" : "text-black"}`}
        >
          {glyph}
        </span>
      </div>
      <div className="absolute right-3 bottom-2 flex flex-col items-center leading-none rotate-180">
        <span
          className={`font-mono font-bold ${size === "lg" ? "text-2xl" : "text-xl"} ${red ? "text-[#c0392b]" : "text-black"}`}
        >
          {rank}
        </span>
        <span
          aria-hidden="true"
          className={`${size === "lg" ? "text-xl" : "text-lg"} ${red ? "text-[#c0392b]" : "text-black"}`}
        >
          {glyph}
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          aria-hidden="true"
          className={`${centerSize} leading-none ${red ? "text-[#c0392b]" : "text-black"} drop-shadow-[0_4px_0_rgba(255,69,0,0.25)]`}
        >
          {glyph}
        </span>
      </div>

      <div className="absolute left-0 top-0 h-1.5 w-16 bg-[var(--accent)]" />
      <div className="absolute right-0 bottom-0 h-1.5 w-16 bg-[var(--accent)]" />
    </div>
  );
}

function CardBack() {
  return (
    <div
      aria-label="Verdeckte Spielkarte"
      role="img"
      className="relative h-full w-full overflow-hidden rounded-2xl border border-[var(--accent)]/60 bg-black"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,69,0,0.25) 0 8px, transparent 8px 16px)",
        }}
      />
      <div className="absolute inset-3 flex items-center justify-center rounded-xl border border-[var(--accent)]/40">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
          Krypto
        </span>
      </div>
    </div>
  );
}
