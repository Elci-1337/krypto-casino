import {
  supa,
  type Job,
  type JobStatus,
  type Place,
  type PlaceWithCheck,
} from "./db";

export async function createJob(input: {
  keyword: string;
  location: string;
  country_code: string;
  language: string;
  max_results: number;
}): Promise<Job> {
  const { data, error } = await supa()
    .from("jobs")
    .insert({
      keyword: input.keyword,
      location: input.location,
      country_code: input.country_code,
      language: input.language,
      max_results: input.max_results,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Job;
}

export async function getJob(id: string): Promise<Job | null> {
  const { data, error } = await supa().from("jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Job | null) ?? null;
}

export async function listJobs(): Promise<Job[]> {
  const { data, error } = await supa()
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Job[];
}

export async function updateJob(
  id: string,
  patch: Partial<
    Pick<Job, "status" | "apify_run_id" | "apify_dataset_id" | "error">
  >,
): Promise<void> {
  const { error } = await supa()
    .from("jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function setJobStatus(
  id: string,
  status: JobStatus,
  errorMsg?: string | null,
): Promise<void> {
  await updateJob(id, { status, error: errorMsg ?? null });
}

export async function insertPlaces(
  jobId: string,
  rows: Omit<Place, "id" | "job_id">[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const payload = rows.map((r) => ({ job_id: jobId, ...r }));
  const { data, error } = await supa()
    .from("places")
    .upsert(payload, { onConflict: "job_id,place_id", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function listPlaces(
  jobId: string,
  opts?: { onlyAvailable?: boolean },
): Promise<PlaceWithCheck[]> {
  const { data: places, error } = await supa()
    .from("places")
    .select("*")
    .eq("job_id", jobId)
    .order("id", { ascending: true });
  if (error) throw error;
  const rows = (places ?? []) as Place[];
  const domains = Array.from(
    new Set(rows.map((r) => r.domain).filter((d): d is string => !!d)),
  );
  const checkMap = new Map<string, { dns_status: string | null; rdap_status: string | null; is_available: boolean | null; checked_at: string | null }>();
  if (domains.length > 0) {
    const { data: checks, error: cErr } = await supa()
      .from("domain_checks")
      .select("domain, dns_status, rdap_status, is_available, checked_at")
      .in("domain", domains);
    if (cErr) throw cErr;
    for (const c of checks ?? []) {
      checkMap.set(c.domain, {
        dns_status: c.dns_status,
        rdap_status: c.rdap_status,
        is_available: c.is_available,
        checked_at: c.checked_at,
      });
    }
  }
  const merged: PlaceWithCheck[] = rows.map((r) => {
    const c = r.domain ? checkMap.get(r.domain) : undefined;
    return {
      ...r,
      dns_status: c?.dns_status ?? null,
      rdap_status: c?.rdap_status ?? null,
      is_available: c?.is_available ?? null,
      checked_at: c?.checked_at ?? null,
    };
  });
  return opts?.onlyAvailable ? merged.filter((p) => p.is_available === true) : merged;
}

export async function distinctUncheckedDomains(jobId: string, limit: number): Promise<string[]> {
  const { data: domainsRows, error } = await supa()
    .from("places")
    .select("domain")
    .eq("job_id", jobId)
    .not("domain", "is", null);
  if (error) throw error;
  const all = Array.from(
    new Set(
      (domainsRows ?? [])
        .map((r) => (r as { domain: string | null }).domain)
        .filter((d): d is string => !!d && d.length > 0),
    ),
  );
  if (all.length === 0) return [];
  const { data: existing, error: cErr } = await supa()
    .from("domain_checks")
    .select("domain")
    .in("domain", all);
  if (cErr) throw cErr;
  const checked = new Set(((existing ?? []) as { domain: string }[]).map((c) => c.domain));
  return all.filter((d) => !checked.has(d)).slice(0, limit);
}

export async function upsertDomainCheck(
  domain: string,
  patch: {
    dns_status: string | null;
    rdap_status: string | null;
    is_available: boolean | null;
    error: string | null;
  },
): Promise<void> {
  const { error } = await supa()
    .from("domain_checks")
    .upsert(
      {
        domain,
        dns_status: patch.dns_status,
        rdap_status: patch.rdap_status,
        is_available: patch.is_available,
        error: patch.error,
        checked_at: new Date().toISOString(),
      },
      { onConflict: "domain" },
    );
  if (error) throw error;
}

export async function upsertDomainChecksBulk(
  rows: {
    domain: string;
    dns_status: string | null;
    rdap_status: string | null;
    is_available: boolean | null;
    error: string | null;
  }[],
): Promise<void> {
  if (rows.length === 0) return;
  const now = new Date().toISOString();
  const { error } = await supa()
    .from("domain_checks")
    .upsert(
      rows.map((r) => ({ ...r, checked_at: now })),
      { onConflict: "domain" },
    );
  if (error) throw error;
}

export async function jobStats(jobId: string) {
  const { count: totalCount } = await supa()
    .from("places")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId);

  const { data: domainsRows } = await supa()
    .from("places")
    .select("domain")
    .eq("job_id", jobId)
    .not("domain", "is", null);
  const domains = Array.from(
    new Set(
      (domainsRows ?? [])
        .map((r) => (r as { domain: string | null }).domain)
        .filter((d): d is string => !!d && d.length > 0),
    ),
  );

  let checked = 0;
  let available = 0;
  if (domains.length > 0) {
    const { data: checks } = await supa()
      .from("domain_checks")
      .select("domain, is_available")
      .in("domain", domains);
    checked = checks?.length ?? 0;
    available = (checks ?? []).filter((c) => c.is_available === true).length;
  }

  return {
    total: totalCount ?? 0,
    with_domain: domains.length,
    checked,
    available,
  };
}
