import { NextResponse } from "next/server";

import { getBalance } from "@/lib/server/high-low-engine";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const balance = await getBalance(session.wallet);
    return NextResponse.json({ address: session.wallet, balance });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read balance" },
      { status: 500 },
    );
  }
}
