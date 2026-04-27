import { NextResponse } from "next/server";
import { createJob, listJobs, setJobStatus, updateJob } from "@/lib/jobs";
import { startRun } from "@/lib/apify";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const jobs = await listJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { keyword, location, country_code, language, max_results } = (body ?? {}) as Record<
    string,
    unknown
  >;
  if (typeof keyword !== "string" || !keyword.trim()) {
    return NextResponse.json({ error: "keyword_required" }, { status: 400 });
  }
  if (typeof location !== "string" || !location.trim()) {
    return NextResponse.json({ error: "location_required" }, { status: 400 });
  }
  const max = Math.max(1, Math.min(5000, Number(max_results) || 100));
  const cc = (typeof country_code === "string" && country_code.trim()) || "DE";
  const lang = (typeof language === "string" && language.trim()) || "de";

  const job = await createJob({
    keyword: keyword.trim(),
    location: location.trim(),
    country_code: cc,
    language: lang,
    max_results: max,
  });

  try {
    const run = await startRun({
      keyword: job.keyword,
      location: job.location,
      countryCode: job.country_code,
      language: job.language,
      maxResults: job.max_results,
    });
    await updateJob(job.id, {
      apify_run_id: run.runId,
      apify_dataset_id: run.datasetId,
      status: "running",
    });
    return NextResponse.json({
      job: { ...job, apify_run_id: run.runId, apify_dataset_id: run.datasetId, status: "running" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await setJobStatus(job.id, "failed", msg);
    return NextResponse.json({ error: "apify_start_failed", message: msg }, { status: 500 });
  }
}
