"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewJobForm() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("Bayern, Deutschland");
  const [country, setCountry] = useState("DE");
  const [language, setLanguage] = useState("de");
  const [maxResults, setMaxResults] = useState(200);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          location,
          country_code: country,
          language,
          max_results: maxResults,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? json.error ?? "Fehler");
        return;
      }
      router.push(`/jobs/${json.job.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted/40"
    >
      <label className="space-y-1 md:col-span-2">
        <span className="text-xs uppercase tracking-wider text-foreground/60">
          Branche / Keyword
        </span>
        <input
          required
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="z. B. Solaranlagen"
          className="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-accent"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wider text-foreground/60">Region</span>
        <input
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="z. B. Bayern, Deutschland"
          className="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-accent"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wider text-foreground/60">Max. Profile</span>
        <input
          required
          type="number"
          min={1}
          max={5000}
          value={maxResults}
          onChange={(e) => setMaxResults(Number(e.target.value))}
          className="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-accent"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wider text-foreground/60">Country Code</span>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          maxLength={2}
          className="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-accent"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wider text-foreground/60">Sprache</span>
        <input
          value={language}
          onChange={(e) => setLanguage(e.target.value.toLowerCase())}
          maxLength={5}
          className="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-accent"
        />
      </label>
      <div className="md:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-accent hover:bg-accent-hover rounded text-white disabled:opacity-50"
        >
          {submitting ? "Starte…" : "Job starten"}
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </form>
  );
}
