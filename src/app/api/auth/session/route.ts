import { NextResponse } from "next/server";

import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ address: null });
  return NextResponse.json({ address: session.wallet });
}
