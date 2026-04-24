import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/server/supabase-admin";
import { verifyDepositSignature } from "@/lib/server/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_DEPOSIT_LAMPORTS = 1_000_000n; // 0.001 SOL

type Body = { signature?: unknown; walletAddress?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signature =
    typeof body.signature === "string" ? body.signature.trim() : "";
  const walletAddress =
    typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";

  if (!signature || !walletAddress) {
    return NextResponse.json(
      { error: "signature and walletAddress are required" },
      { status: 400 },
    );
  }

  let verified;
  try {
    verified = await verifyDepositSignature({
      signature,
      expectedSender: walletAddress,
      minLamports: MIN_DEPOSIT_LAMPORTS,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to verify transaction",
      },
      { status: 400 },
    );
  }

  const supa = supabaseAdmin();
  const { data: newBalance, error } = await supa.rpc("credit_deposit", {
    p_signature: verified.signature,
    p_wallet: verified.sender,
    p_amount: verified.sol,
    p_slot: verified.slot,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    signature: verified.signature,
    credited: verified.sol,
    balance: Number(newBalance),
  });
}
