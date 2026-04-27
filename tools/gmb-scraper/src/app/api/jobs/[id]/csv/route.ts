import { getJob, listPlaces } from "@/lib/jobs";
import { placesToCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = await getJob(id);
  if (!job) return new Response("not_found", { status: 404 });

  const url = new URL(req.url);
  const onlyAvailable = url.searchParams.get("onlyAvailable") === "1";
  const places = await listPlaces(id, { onlyAvailable });
  const csv = placesToCsv(places);

  const slug = job.keyword.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40);
  const suffix = onlyAvailable ? "-free-domains" : "";
  const filename = `gmb-${slug}-${id.slice(0, 8)}${suffix}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
