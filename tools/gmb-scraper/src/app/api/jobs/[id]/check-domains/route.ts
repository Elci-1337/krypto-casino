import { NextResponse } from "next/server";
import { distinctDomainsForJob, getJob, jobStats, upsertDomainCheck } from "@/lib/jobs";
import { checkDomainsBatch } from "@/lib/domain-check";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const domains = distinctDomainsForJob(id);
  if (domains.length === 0) {
    return NextResponse.json({ checked: 0, available: 0, total_domains: 0 });
  }

  const results = await checkDomainsBatch(domains, 25);
  for (const [domain, r] of results) {
    upsertDomainCheck(domain, {
      dns_status: r.dns,
      rdap_status: r.rdap,
      is_available: r.available ? 1 : 0,
      error: r.error ?? null,
    });
  }
  return NextResponse.json({ total_domains: domains.length, ...jobStats(id) });
}
