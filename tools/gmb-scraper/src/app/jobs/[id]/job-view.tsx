"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Place {
  id: number;
  name: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  domain: string | null;
  rating: number | null;
  review_count: number | null;
  maps_url: string | null;
  dns_status: string | null;
  rdap_status: string | null;
  is_available: boolean | null;
}

interface Job {
  id: string;
  keyword: string;
  location: string;
  status: string;
  error: string | null;
  max_results: number;
  apify_run_id: string | null;
}

interface Stats {
  total: number;
  with_domain: number;
  checked: number;
  available: number;
}

interface JobResponse {
  job: Job;
  stats: Stats;
  places: Place[];
}

export function JobView({
  jobId,
  initialKeyword,
  initialLocation,
}: {
  jobId: string;
  initialKeyword: string;
  initialLocation: string;
}) {
  const [data, setData] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState<{ checked: number; total: number } | null>(null);
  const [filter, setFilter] = useState<"all" | "with_domain" | "available">("all");

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const json = (await res.json()) as JobResponse | { error: string };
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : "Fehler");
        return;
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    if (!data) return;
    if (data.job.status === "running" || data.job.status === "fetching" || data.job.status === "pending") {
      const t = setTimeout(fetchJob, 5000);
      return () => clearTimeout(t);
    }
  }, [data, fetchJob]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "with_domain") return data.places.filter((p) => !!p.domain);
    if (filter === "available") return data.places.filter((p) => p.is_available === true);
    return data.places;
  }, [data, filter]);

  async function runDomainCheck() {
    setChecking(true);
    setError(null);
    try {
      while (true) {
        const res = await fetch(`/api/jobs/${jobId}/check-domains?limit=50`, { method: "POST" });
        const json = (await res.json()) as {
          checked_now: number;
          done: boolean;
          total: number;
          with_domain: number;
          checked: number;
          available: number;
        };
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          break;
        }
        setCheckProgress({ checked: json.checked, total: json.with_domain });
        if (json.done || json.checked_now === 0) break;
      }
      await fetchJob();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setChecking(false);
      setCheckProgress(null);
    }
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">{initialKeyword}</h1>
        <p className="text-foreground/60">{initialLocation}</p>
        <p className="mt-4 text-sm text-foreground/50">
          {error ? `Fehler: ${error}` : "Lade Job…"}
        </p>
      </div>
    );
  }

  const { job, stats } = data;
  const busy = job.status === "running" || job.status === "fetching" || job.status === "pending";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{job.keyword}</h1>
        <p className="text-foreground/60">{job.location}</p>
        {job.apify_run_id && (
          <p className="text-xs text-foreground/40 mt-1">
            Apify Run:{" "}
            <a
              className="underline"
              target="_blank"
              rel="noreferrer"
              href={`https://console.apify.com/actors/runs/${job.apify_run_id}`}
            >
              {job.apify_run_id}
            </a>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Status" value={job.status} />
        <Stat label="Profile" value={`${stats.total} / ${job.max_results}`} />
        <Stat label="Mit Website" value={String(stats.with_domain)} />
        <Stat label="Domains geprüft" value={`${stats.checked} / ${stats.with_domain}`} />
        <Stat
          label="Frei verfügbar"
          value={String(stats.available)}
          highlight={stats.available > 0}
        />
      </div>

      {job.error && (
        <div className="text-sm text-danger border border-danger/40 rounded p-3">{job.error}</div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={runDomainCheck}
          disabled={checking || busy || stats.with_domain === 0 || stats.checked >= stats.with_domain}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover rounded text-white text-sm disabled:opacity-50"
        >
          {checking
            ? checkProgress
              ? `Prüfe ${checkProgress.checked}/${checkProgress.total}…`
              : "Prüfe Domains…"
            : stats.checked >= stats.with_domain && stats.with_domain > 0
              ? "Alle Domains geprüft"
              : "Domain-Verfügbarkeit prüfen"}
        </button>
        <button
          onClick={fetchJob}
          className="px-3 py-1.5 border border-border hover:border-foreground/40 rounded text-sm"
        >
          Aktualisieren
        </button>
        <a
          href={`/api/jobs/${jobId}/csv`}
          className="px-3 py-1.5 border border-border hover:border-foreground/40 rounded text-sm"
        >
          CSV (alle)
        </a>
        <a
          href={`/api/jobs/${jobId}/csv?onlyAvailable=1`}
          className={`px-3 py-1.5 rounded text-sm ${
            stats.available > 0
              ? "bg-success/20 border border-success/40 text-success"
              : "border border-border opacity-50 pointer-events-none"
          }`}
        >
          CSV (nur freie Domains)
        </a>

        <div className="ml-auto flex gap-1 text-sm">
          <FilterChip current={filter} value="all" onChange={setFilter}>
            Alle
          </FilterChip>
          <FilterChip current={filter} value="with_domain" onChange={setFilter}>
            Mit Website
          </FilterChip>
          <FilterChip current={filter} value="available" onChange={setFilter}>
            Frei verfügbar
          </FilterChip>
        </div>
      </div>

      {error && (
        <div className="text-sm text-danger border border-danger/40 rounded p-3">{error}</div>
      )}

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-foreground/60 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Adresse</th>
              <th className="px-3 py-2">Kontakt</th>
              <th className="px-3 py-2">Bewertung</th>
              <th className="px-3 py-2">Domain</th>
              <th className="px-3 py-2">Verfügbarkeit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-foreground/50">{p.category}</div>
                </td>
                <td className="px-3 py-2 text-foreground/70">
                  {p.address}
                  {p.maps_url && (
                    <>
                      <br />
                      <a
                        href={p.maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:text-accent-hover"
                      >
                        Maps ↗
                      </a>
                    </>
                  )}
                </td>
                <td className="px-3 py-2 text-foreground/70 whitespace-nowrap">
                  {p.phone && <div>{p.phone}</div>}
                  {p.email && <div className="text-xs">{p.email}</div>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {p.rating != null ? (
                    <>
                      <span className="font-medium">{p.rating.toFixed(1)}</span>{" "}
                      <span className="text-xs text-foreground/50">
                        ({p.review_count ?? 0})
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground/40">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {p.website ? (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:text-accent-hover break-all"
                    >
                      {p.domain ?? p.website}
                    </a>
                  ) : (
                    <span className="text-foreground/40">—</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <DomainBadge place={p} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-foreground/50">
                  {busy ? "Job läuft – noch keine Ergebnisse." : "Keine Treffer."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border border-border rounded-lg p-3 ${highlight ? "bg-success/10 border-success/40" : "bg-muted/40"}`}
    >
      <div className="text-xs uppercase tracking-wider text-foreground/50">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function FilterChip({
  current,
  value,
  onChange,
  children,
}: {
  current: string;
  value: "all" | "with_domain" | "available";
  onChange: (v: "all" | "with_domain" | "available") => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onChange(value)}
      className={`px-3 py-1.5 rounded text-sm border ${
        active ? "border-accent text-accent" : "border-border text-foreground/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function DomainBadge({ place }: { place: Place }) {
  if (!place.domain) return <span className="text-foreground/40">—</span>;
  if (place.is_available === true) {
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-success/20 text-success font-medium">
        FREI ({place.rdap_status})
      </span>
    );
  }
  if (place.is_available === false) {
    return <span className="text-xs text-foreground/60">registriert</span>;
  }
  return <span className="text-xs text-foreground/40">ungeprüft</span>;
}
