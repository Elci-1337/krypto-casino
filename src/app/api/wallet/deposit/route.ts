import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/server/supabase-admin";
import { verifyDepositSignature } from "@/lib/server/solana";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_DEPOSIT_LAMPORTS = 1_000_000n; // 0.001 SOL

type Body = { signature?: unknown };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signature =
    typeof body.signature === "string" ? body.signature.trim() : "";
  if (!signature) {
    return NextResponse.json(
      { error: "signature is required" },
      { status: 400 },
    );
  }

  let verified;
  try {
    // Bind the deposit to the session wallet: the signer of the transaction
    // must match the authenticated wallet. Prevents a logged-in user from
    // submitting someone else's signature to poison the state.
    verified = await verifyDepositSignature({
      signature,
      expectedSender: session.wallet,
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
