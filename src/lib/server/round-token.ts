import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Round tokens bind a pre-bet round state to the server via an HMAC. The
 * token is given to the client after `startRound` and replayed at settlement
 * time. The server verifies the signature + expiry, then trusts the payload
 * without needing any per-round state in Redis / a DB table.
 */

type TokenPayload = {
  v: 1;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  currentIndex: number;
  issuedAt: number;
};

const TOKEN_TTL_MS = 5 * 60 * 1000;

function signingSecret(): string {
  // Intentionally read every call: tests can override with setEnv.
  const s = process.env.ROUND_SIGNING_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "ROUND_SIGNING_SECRET must be set to a 32+ char random string",
    );
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
  return createHmac("sha256", signingSecret()).update(payload).digest();
}

export function signRoundToken(
  input: Omit<TokenPayload, "v" | "issuedAt">,
): string {
  const payload: TokenPayload = {
    v: 1,
    issuedAt: Date.now(),
    ...input,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64url(hmac(body));
  return `${body}.${sig}`;
}

export function verifyRoundToken(token: string): TokenPayload {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Malformed round token");

  const expected = hmac(body);
  const provided = b64urlDecode(sig);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    throw new Error("Invalid round token signature");
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString("utf8"));
  } catch {
    throw new Error("Malformed round token payload");
  }

  if (payload.v !== 1) throw new Error("Unsupported round token version");
  if (Date.now() - payload.issuedAt > TOKEN_TTL_MS) {
    throw new Error("Round token expired");
  }

  return payload;
}
