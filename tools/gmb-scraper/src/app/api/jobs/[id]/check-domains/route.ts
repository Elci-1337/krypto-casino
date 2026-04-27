import { NextResponse } from "next/server";
import {
  distinctUncheckedDomains,
  getJob,
  jobStats,
  upsertDomainChecksBulk,
} from "@/lib/jobs";
import { checkDomainsBatch } from "@/lib/domain-check";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const url = new URL(req.url);
  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT),
  );

  const todo = await distinctUncheckedDomains(id, limit);
  if (todo.length === 0) {
    const stats = await jobStats(id);
    return NextResponse.json({ checked_now: 0, done: true, ...stats });
  }

  const results = await checkDomainsBatch(todo, 25);
  const rows = Array.from(results.entries()).map(([domain, r]) => ({
    domain,
    dns_status: r.dns,
    rdap_status: r.rdap,
    is_available: r.available,
    error: r.error ?? null,
  }));
  await upsertDomainChecksBulk(rows);

  const stats = await jobStats(id);
  return NextResponse.json({
    checked_now: rows.length,
    done: stats.checked >= stats.with_domain,
    ...stats,
  });
}
