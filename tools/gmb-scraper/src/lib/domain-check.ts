import { promises as dns } from "node:dns";

export type DnsStatus = "resolved" | "nxdomain" | "no_records" | "error";
export type RdapStatus = "registered" | "available" | "unsupported_tld" | "error";

const RDAP_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
let bootstrapCache: { fetchedAt: number; map: Map<string, string[]> } | null = null;

async function loadRdapBootstrap(): Promise<Map<string, string[]>> {
  if (bootstrapCache && Date.now() - bootstrapCache.fetchedAt < 24 * 3600_000) {
    return bootstrapCache.map;
  }
  const res = await fetch(RDAP_BOOTSTRAP_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`RDAP bootstrap fetch failed: ${res.status}`);
  const json = (await res.json()) as { services: [string[], string[]][] };
  const map = new Map<string, string[]>();
  for (const [tlds, urls] of json.services) {
    for (const tld of tlds) {
      map.set(tld.toLowerCase(), urls);
    }
  }
  bootstrapCache = { fetchedAt: Date.now(), map };
  return map;
}

export async function checkDns(domain: string): Promise<DnsStatus> {
  try {
    const records = await Promise.allSettled([dns.resolve4(domain), dns.resolve6(domain)]);
    const hasA = records.some(
      (r) => r.status === "fulfilled" && Array.isArray(r.value) && r.value.length > 0,
    );
    if (hasA) return "resolved";
    try {
      const ns = await dns.resolveNs(domain);
      if (ns.length > 0) return "resolved";
    } catch {
      // fall through
    }
    return "no_records";
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      try {
        const ns = await dns.resolveNs(domain);
        if (ns.length > 0) return "resolved";
      } catch {
        // ignore
      }
      return "nxdomain";
    }
    return "error";
  }
}

export async function checkRdap(domain: string): Promise<RdapStatus> {
  const tld = domain.split(".").pop()?.toLowerCase();
  if (!tld) return "error";
  const bootstrap = await loadRdapBootstrap();
  const baseUrls = bootstrap.get(tld);
  if (!baseUrls || baseUrls.length === 0) return "unsupported_tld";

  for (const base of baseUrls) {
    const url = `${base.replace(/\/$/, "")}/domain/${encodeURIComponent(domain)}`;
    try {
      const res = await fetch(url, {
        headers: { accept: "application/rdap+json" },
        cache: "no-store",
      });
      if (res.status === 200) return "registered";
      if (res.status === 404) return "available";
    } catch {
      // try next base url
    }
  }
  return "error";
}

export interface CheckResult {
  dns: DnsStatus;
  rdap: RdapStatus | null;
  available: boolean;
}

export async function checkDomain(domain: string): Promise<CheckResult> {
  const dnsStatus = await checkDns(domain);
  if (dnsStatus === "resolved") {
    return { dns: dnsStatus, rdap: null, available: false };
  }
  const rdapStatus = await checkRdap(domain);
  return {
    dns: dnsStatus,
    rdap: rdapStatus,
    available: rdapStatus === "available",
  };
}

export async function checkDomainsBatch(
  domains: string[],
  concurrency = 20,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, CheckResult & { error?: string }>> {
  const results = new Map<string, CheckResult & { error?: string }>();
  const queue = [...domains];
  let done = 0;
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const d = queue.shift();
          if (!d) break;
          try {
            results.set(d, await checkDomain(d));
          } catch (err) {
            results.set(d, {
              dns: "error",
              rdap: null,
              available: false,
              error: err instanceof Error ? err.message : String(err),
            });
          } finally {
            done++;
            onProgress?.(done, domains.length);
          }
        }
      })(),
    );
  }
  await Promise.all(workers);
  return results;
}
