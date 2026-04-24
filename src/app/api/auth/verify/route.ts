import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

import {
  buildChallengeMessage,
  consumeChallenge,
  createSession,
} from "@/lib/server/session";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { address?: unknown; signature?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawAddress =
    typeof body.address === "string" ? body.address.trim() : "";
  const rawSignature =
    typeof body.signature === "string" ? body.signature.trim() : "";
  if (!rawAddress || !rawSignature) {
    return NextResponse.json(
      { error: "address and signature are required" },
      { status: 400 },
    );
  }

  let address: string;
  let pubkeyBytes: Uint8Array;
  try {
    const pk = new PublicKey(rawAddress);
    address = pk.toBase58();
    pubkeyBytes = pk.toBytes();
  } catch {
    return NextResponse.json(
      { error: "Invalid Solana wallet address" },
      { status: 400 },
    );
  }

  // Pull the nonce out of the cookie and invalidate it immediately — even on
  // signature-verify failure we don't leave a challenge lying around.
  let nonce: string;
  try {
    const challenge = await consumeChallenge(address);
    nonce = challenge.nonce;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Challenge verification failed",
      },
      { status: 401 },
    );
  }

  const message = buildChallengeMessage(nonce);
  const messageBytes = new TextEncoder().encode(message);

  let sigBytes: Uint8Array;
  try {
    sigBytes = bs58.decode(rawSignature);
  } catch {
    return NextResponse.json(
      { error: "Signature must be base58-encoded" },
      { status: 400 },
    );
  }
  if (sigBytes.length !== 64) {
    return NextResponse.json(
      { error: "Invalid signature length" },
      { status: 400 },
    );
  }

  const ok = nacl.sign.detached.verify(messageBytes, sigBytes, pubkeyBytes);
  if (!ok) {
    return NextResponse.json(
      { error: "Signature does not match this wallet" },
      { status: 401 },
    );
  }

  // Signature is valid; establish the session and seed the profile so later
  // balance reads don't 500 on a missing row.
  await createSession(address);

  try {
    const { error } = await supabaseAdmin().rpc("ensure_profile", {
      p_wallet: address,
    });
    if (error) {
      // Not fatal for login; log and continue.
      console.warn("ensure_profile failed:", error.message);
    }
  } catch (err) {
    console.warn(
      "Supabase not configured for ensure_profile:",
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json({ ok: true, address });
}
