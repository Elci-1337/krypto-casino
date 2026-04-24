import { NextResponse } from "next/server";

import { getBalance } from "@/lib/server/high-low-engine";

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

  try {
    const balance = await getBalance(address);
    return NextResponse.json({ address, balance });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read balance" },
      { status: 400 },
    );
  }
}
