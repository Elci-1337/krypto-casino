/**
 * SOL <-> lamport helpers. Runtime-agnostic: used on the server for on-chain
 * verification and on the client for UI formatting.
 */

export const LAMPORTS_PER_SOL = 1_000_000_000n;

export function solToLamports(sol: number): bigint {
  // Go via string to avoid binary-float drift at 9 decimals.
  const [whole = "0", frac = ""] = sol.toFixed(9).split(".");
  const fracPadded = (frac + "000000000").slice(0, 9);
  return BigInt(whole) * LAMPORTS_PER_SOL + BigInt(fracPadded || "0");
}

export function lamportsToSol(lamports: bigint | number): number {
  const n = typeof lamports === "bigint" ? lamports : BigInt(lamports);
  const whole = n / LAMPORTS_PER_SOL;
  const frac = n % LAMPORTS_PER_SOL;
  return Number(whole) + Number(frac) / 1e9;
}

export function formatSol(value: number | string, decimals = 4): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0.0000";
  return n.toFixed(decimals);
}
