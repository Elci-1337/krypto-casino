import { NextResponse } from "next/server";
import { getJob, insertPlaces, jobStats, listPlaces, setJobStatus, updateJob } from "@/lib/jobs";
import { fetchDatasetItems, getRunStatus, normalizePlace } from "@/lib/apify";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (job.status === "running" && job.apify_run_id) {
    try {
      const run = await getRunStatus(job.apify_run_id);
      if (run && run.status !== "RUNNING" && run.status !== "READY") {
        if (run.status === "SUCCEEDED" || run.status === "TIMING-OUT") {
          await updateJob(id, { status: "fetching" });
          const datasetId = job.apify_dataset_id ?? run.defaultDatasetId;
          if (datasetId) {
            const items = await fetchDatasetItems(datasetId);
            const normalized = items.map((p) => normalizePlace(p, job.country_code));
            await insertPlaces(id, normalized);
          }
          await setJobStatus(id, "completed");
        } else {
          await setJobStatus(id, "failed", `Apify run status: ${run.status}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await setJobStatus(id, "failed", msg);
    }
  }

  const fresh = (await getJob(id))!;
  const [stats, places] = await Promise.all([jobStats(id), listPlaces(id)]);
  return NextResponse.json({ job: fresh, stats, places });
}
