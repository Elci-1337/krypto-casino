import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Session + challenge cookies for Sign-In-With-Solana.
 *
 * Both cookies are HTTP-only, SameSite=Lax (so top-level navigation to the
 * site keeps the session while cross-site POSTs don't carry it) and Secure
 * in production. Neither contains PII beyond the wallet address (public).
 *
 * Challenge cookie (`kg_challenge`)
 *   Short-lived (5 min). Binds `{ nonce, walletAddress }` so the verify step
 *   cannot be tricked into accepting a nonce issued for a different wallet.
 *
 * Session cookie (`kg_session`)
 *   7-day TTL. Holds the verified wallet address. Replayed on every request
 *   by the browser. All protected routes pull the wallet from this cookie
 *   rather than trusting client input.
 */

const SESSION_COOKIE = "kg_session";
const CHALLENGE_COOKIE = "kg_challenge";
const CHALLENGE_TTL_S = 5 * 60; // 5 minutes
const SESSION_TTL_S = 7 * 24 * 60 * 60; // 7 days

type ChallengePayload = {
  v: 1;
  nonce: string;
  wallet: string;
  iat: number;
};

type SessionPayload = {
  v: 1;
  wallet: string;
  iat: number;
  exp: number;
};

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set to a 32+ char random string");
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function hmac(payload: string): Buffer {
  return createHmac("sha256", sessionSecret()).update(payload).digest();
}

function signToken(payload: object): string {
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64url(hmac(body));
  return `${body}.${sig}`;
}

function verifyToken<T>(token: string): T {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Malformed token");
  const expected = hmac(body);
  const provided = b64urlDecode(sig);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    throw new Error("Invalid token signature");
  }
  try {
    return JSON.parse(b64urlDecode(body).toString("utf8")) as T;
  } catch {
    throw new Error("Malformed token payload");
  }
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/* --- Challenge cookie ----------------------------------------------------- */

export function buildChallengeMessage(nonce: string): string {
  return `Anmelden bei kartengluecksspiel.com mit Nonce: ${nonce}`;
}

export async function issueChallenge(
  walletAddress: string,
): Promise<{ nonce: string; message: string }> {
  const nonce = randomBytes(16).toString("hex");
  const payload: ChallengePayload = {
    v: 1,
    nonce,
    wallet: walletAddress,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = signToken(payload);

  const store = await cookies();
  store.set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/api/auth",
    maxAge: CHALLENGE_TTL_S,
  });

  return { nonce, message: buildChallengeMessage(nonce) };
}

export async function consumeChallenge(
  walletAddress: string,
): Promise<ChallengePayload> {
  const store = await cookies();
  const raw = store.get(CHALLENGE_COOKIE)?.value;
  if (!raw) throw new Error("No challenge in progress");

  const payload = verifyToken<ChallengePayload>(raw);

  const now = Math.floor(Date.now() / 1000);
  if (payload.v !== 1) throw new Error("Unsupported challenge version");
  if (now - payload.iat > CHALLENGE_TTL_S) {
    throw new Error("Challenge expired");
  }
  if (payload.wallet !== walletAddress) {
    throw new Error("Challenge / wallet mismatch");
  }

  // One-shot: clear the cookie so the same nonce cannot be re-used.
  store.delete(CHALLENGE_COOKIE);
  return payload;
}

/* --- Session cookie ------------------------------------------------------- */

export async function createSession(walletAddress: string): Promise<void> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    v: 1,
    wallet: walletAddress,
    iat,
    exp: iat + SESSION_TTL_S,
  };
  const token = signToken(payload);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  let payload: SessionPayload;
  try {
    payload = verifyToken<SessionPayload>(raw);
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.v !== 1 || payload.exp < now) return null;
  return payload;
}

/** Convenience: resolves or throws with a 401-shaped error. */
export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) {
    const err = new Error("Not authenticated");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  return s;
}
