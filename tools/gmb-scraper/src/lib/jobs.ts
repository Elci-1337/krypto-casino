import { randomUUID } from "node:crypto";
import { db, type Job, type JobStatus, type Place, type PlaceWithCheck } from "./db";

export function createJob(input: {
  keyword: string;
  location: string;
  country_code: string;
  language: string;
  max_results: number;
}): Job {
  const id = randomUUID();
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO jobs (id, keyword, location, country_code, language, max_results, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    )
    .run(id, input.keyword, input.location, input.country_code, input.language, input.max_results, now, now);
  return getJob(id)!;
}

export function getJob(id: string): Job | null {
  return (db().prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as Job) ?? null;
}

export function listJobs(): Job[] {
  return db().prepare(`SELECT * FROM jobs ORDER BY created_at DESC LIMIT 100`).all() as Job[];
}

export function updateJob(
  id: string,
  patch: Partial<Pick<Job, "status" | "apify_run_id" | "apify_dataset_id" | "error">>,
) {
  const fields = Object.keys(patch);
  if (fields.length === 0) return;
  const sets = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => (patch as Record<string, unknown>)[f]);
  db()
    .prepare(`UPDATE jobs SET ${sets}, updated_at = ? WHERE id = ?`)
    .run(...values, Date.now(), id);
}

export function setJobStatus(id: string, status: JobStatus, error?: string | null) {
  updateJob(id, { status, error: error ?? null });
}

export function insertPlaces(jobId: string, places: Omit<Place, "id" | "job_id">[]) {
  const stmt = db().prepare(
    `INSERT OR IGNORE INTO places
     (job_id, place_id, name, category, address, city, postal_code, country_code,
      phone, email, website, domain, rating, review_count, lat, lng, maps_url, raw)
     VALUES (@job_id, @place_id, @name, @category, @address, @city, @postal_code, @country_code,
             @phone, @email, @website, @domain, @rating, @review_count, @lat, @lng, @maps_url, @raw)`,
  );
  const tx = db().transaction((rows: Omit<Place, "id" | "job_id">[]) => {
    let inserted = 0;
    for (const r of rows) {
      const res = stmt.run({ job_id: jobId, ...r });
      inserted += res.changes;
    }
    return inserted;
  });
  return tx(places);
}

export function listPlaces(jobId: string, opts?: { onlyAvailable?: boolean }): PlaceWithCheck[] {
  const where = opts?.onlyAvailable ? `AND dc.is_available = 1` : ``;
  return db()
    .prepare(
      `SELECT p.*, dc.dns_status, dc.rdap_status, dc.is_available, dc.checked_at
       FROM places p
       LEFT JOIN domain_checks dc ON dc.domain = p.domain
       WHERE p.job_id = ? ${where}
       ORDER BY p.id ASC`,
    )
    .all(jobId) as PlaceWithCheck[];
}

export function distinctDomainsForJob(jobId: string): string[] {
  return (
    db()
      .prepare(
        `SELECT DISTINCT domain FROM places WHERE job_id = ? AND domain IS NOT NULL AND domain <> ''`,
      )
      .all(jobId) as { domain: string }[]
  ).map((r) => r.domain);
}

export function upsertDomainCheck(
  domain: string,
  patch: { dns_status: string | null; rdap_status: string | null; is_available: number | null; error: string | null },
) {
  db()
    .prepare(
      `INSERT INTO domain_checks (domain, dns_status, rdap_status, is_available, checked_at, error)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(domain) DO UPDATE SET
         dns_status = excluded.dns_status,
         rdap_status = excluded.rdap_status,
         is_available = excluded.is_available,
         checked_at = excluded.checked_at,
         error = excluded.error`,
    )
    .run(domain, patch.dns_status, patch.rdap_status, patch.is_available, Date.now(), patch.error);
}

export function jobStats(jobId: string) {
  const totals = db()
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN domain IS NOT NULL AND domain <> '' THEN 1 ELSE 0 END) AS with_domain
       FROM places WHERE job_id = ?`,
    )
    .get(jobId) as { total: number; with_domain: number };
  const checks = db()
    .prepare(
      `SELECT
         SUM(CASE WHEN dc.checked_at IS NOT NULL THEN 1 ELSE 0 END) AS checked,
         SUM(CASE WHEN dc.is_available = 1 THEN 1 ELSE 0 END) AS available
       FROM places p
       LEFT JOIN domain_checks dc ON dc.domain = p.domain
       WHERE p.job_id = ? AND p.domain IS NOT NULL AND p.domain <> ''`,
    )
    .get(jobId) as { checked: number | null; available: number | null };
  return {
    total: totals.total ?? 0,
    with_domain: totals.with_domain ?? 0,
    checked: checks.checked ?? 0,
    available: checks.available ?? 0,
  };
}
