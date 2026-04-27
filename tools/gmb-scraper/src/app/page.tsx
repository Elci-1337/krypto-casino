import Link from "next/link";
import { listJobs } from "@/lib/jobs";
import { NewJobForm } from "./new-job-form";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-foreground/10 text-foreground/70",
    running: "bg-warn/20 text-warn",
    fetching: "bg-warn/20 text-warn",
    completed: "bg-success/20 text-success",
    failed: "bg-danger/20 text-danger",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${map[status] ?? "bg-foreground/10"}`}>
      {status}
    </span>
  );
}

export default function HomePage() {
  const jobs = listJobs();
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold mb-2">Neuer Scrape-Job</h1>
        <p className="text-sm text-foreground/60 mb-4">
          Branche &amp; Region eingeben. Der Apify-Actor{" "}
          <code className="px-1 bg-muted rounded">compass/crawler-google-places</code> sammelt
          Profile von Google Maps. Im Anschluss kannst du die hinterlegten Domains auf Verfügbarkeit
          prüfen.
        </p>
        <NewJobForm />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-foreground/50">Noch keine Jobs.</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-foreground/60 text-left">
                <tr>
                  <th className="px-3 py-2">Keyword</th>
                  <th className="px-3 py-2">Region</th>
                  <th className="px-3 py-2">Max</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Erstellt</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-t border-border">
                    <td className="px-3 py-2">{j.keyword}</td>
                    <td className="px-3 py-2">{j.location}</td>
                    <td className="px-3 py-2">{j.max_results}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="px-3 py-2 text-foreground/60">
                      {new Date(j.created_at).toLocaleString("de-DE")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/jobs/${j.id}`}
                        className="text-accent hover:text-accent-hover"
                      >
                        Öffnen →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
