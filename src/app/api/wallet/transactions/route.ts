import { NextResponse } from "next/server";

import { getSession } from "@/lib/server/session";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TxEntry = {
  kind: "deposit" | "withdrawal";
  createdAt: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  signature: string | null;
  destination?: string | null;
};

/**
 * Unified deposit + withdrawal history for the authenticated wallet. Always
 * scoped to the session wallet via the profile id — never trusts query args.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supa = supabaseAdmin();

  const { data: profile, error: profileErr } = await supa
    .from("profiles")
    .select("id")
    .eq("wallet_address", session.wallet)
    .maybeSingle();
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ entries: [] });
  }

  const [depositsRes, withdrawalsRes] = await Promise.all([
    supa
      .from("deposits")
      .select("signature, amount, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supa
      .from("withdrawals")
      .select("id, signature, amount, destination_address, status, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (depositsRes.error) {
    return NextResponse.json(
      { error: depositsRes.error.message },
      { status: 500 },
    );
  }
  if (withdrawalsRes.error) {
    return NextResponse.json(
      { error: withdrawalsRes.error.message },
      { status: 500 },
    );
  }

  const entries: TxEntry[] = [
    ...(depositsRes.data ?? []).map(
      (d): TxEntry => ({
        kind: "deposit",
        createdAt: d.created_at,
        amount: Number(d.amount),
        status: "completed",
        signature: d.signature,
      }),
    ),
    ...(withdrawalsRes.data ?? []).map(
      (w): TxEntry => ({
        kind: "withdrawal",
        createdAt: w.created_at,
        amount: Number(w.amount),
        status: w.status as TxEntry["status"],
        signature: w.signature,
        destination: w.destination_address,
      }),
    ),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);

  return NextResponse.json({ entries });
}
