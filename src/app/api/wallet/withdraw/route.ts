import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { getSession } from "@/lib/server/session";
import { supabaseAdmin } from "@/lib/server/supabase-admin";
import { payoutSol } from "@/lib/server/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_WITHDRAW_SOL = 0.01;
const MAX_WITHDRAW_SOL = 100;

type Body = { amount?: unknown; destination?: unknown };

/**
 * Withdrawal flow:
 *   1. Auth check (SIWS session).
 *   2. Validate input.
 *   3. Supabase `request_withdrawal` RPC: locks profile row, verifies
 *      balance >= amount, debits balance, inserts pending withdrawal. All
 *      atomic inside Postgres.
 *   4. Submit the on-chain transfer from the house wallet. NEVER reuses the
 *      user's wallet — payouts are signed by SOLANA_HOUSE_SECRET_KEY.
 *   5. Mark the withdrawal completed (+ signature) or failed (+ refund).
 */
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

  const amountRaw = body.amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string"
        ? Number(amountRaw)
        : NaN;
  const destinationRaw =
    typeof body.destination === "string" ? body.destination.trim() : "";

  if (!Number.isFinite(amount) || amount < MIN_WITHDRAW_SOL) {
    return NextResponse.json(
      { error: `Mindestauszahlung ${MIN_WITHDRAW_SOL} SOL` },
      { status: 400 },
    );
  }
  if (amount > MAX_WITHDRAW_SOL) {
    return NextResponse.json(
      { error: `Maximalauszahlung ${MAX_WITHDRAW_SOL} SOL` },
      { status: 400 },
    );
  }

  let destination: string;
  try {
    destination = new PublicKey(destinationRaw).toBase58();
  } catch {
    return NextResponse.json(
      { error: "Ungültige Ziel-Wallet-Adresse" },
      { status: 400 },
    );
  }

  const supa = supabaseAdmin();

  // Resolve the profile id from the session wallet.
  const { data: userId, error: profileErr } = await supa.rpc(
    "ensure_profile",
    { p_wallet: session.wallet },
  );
  if (profileErr || !userId) {
    return NextResponse.json(
      { error: profileErr?.message ?? "Profile lookup failed" },
      { status: 500 },
    );
  }

  // Atomic debit + pending insert.
  const { data: withdrawalId, error: reqErr } = await supa.rpc(
    "request_withdrawal",
    {
      p_user_id: userId as string,
      p_amount: amount,
      p_destination: destination,
    },
  );
  if (reqErr || !withdrawalId) {
    const msg = reqErr?.message ?? "Failed to start withdrawal";
    const status = /insufficient balance/i.test(msg) ? 402 : 400;
    return NextResponse.json(
      { error: /insufficient balance/i.test(msg) ? "Guthaben reicht nicht" : msg },
      { status },
    );
  }

  // On-chain transfer. Any failure after this point must flip the withdrawal
  // row to 'failed' + refund, so the user does not lose funds.
  try {
    const payout = await payoutSol({ destination, sol: amount });

    const { error: completeErr } = await supa.rpc(
      "mark_withdrawal_completed",
      {
        p_withdrawal_id: withdrawalId as string,
        p_signature: payout.signature,
      },
    );
    if (completeErr) {
      // The funds left the treasury but bookkeeping failed. This is the
      // worst-case path — log loudly so reconciliation can pick it up.
      console.error(
        "mark_withdrawal_completed failed after on-chain transfer:",
        completeErr.message,
        "withdrawalId=",
        withdrawalId,
        "signature=",
        payout.signature,
      );
    }

    return NextResponse.json({
      ok: true,
      id: withdrawalId,
      amount: payout.sol,
      destination,
      signature: payout.signature,
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "On-chain transfer failed";
    console.error(
      "Payout failed for withdrawal",
      withdrawalId,
      ":",
      msg,
    );

    const { error: failErr } = await supa.rpc("mark_withdrawal_failed", {
      p_withdrawal_id: withdrawalId as string,
      p_error: msg.slice(0, 500),
    });
    if (failErr) {
      console.error(
        "mark_withdrawal_failed also failed:",
        failErr.message,
        "withdrawalId=",
        withdrawalId,
      );
    }

    return NextResponse.json(
      {
        error:
          "Auszahlung fehlgeschlagen. Guthaben wurde automatisch erstattet.",
      },
      { status: 502 },
    );
  }
}
