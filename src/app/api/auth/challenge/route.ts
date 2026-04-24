import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { issueChallenge } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address")?.trim() ?? "";

  if (!address) {
    return NextResponse.json(
      { error: "address query param required" },
      { status: 400 },
    );
  }

  let canonical: string;
  try {
    canonical = new PublicKey(address).toBase58();
  } catch {
    return NextResponse.json(
      { error: "Invalid Solana wallet address" },
      { status: 400 },
    );
  }

  const { nonce, message } = await issueChallenge(canonical);
  return NextResponse.json({ address: canonical, nonce, message });
}
