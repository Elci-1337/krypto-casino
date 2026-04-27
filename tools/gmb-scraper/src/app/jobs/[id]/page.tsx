import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs";
import { JobView } from "./job-view";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-foreground/60 hover:text-foreground">
        ← Zurück
      </Link>
      <JobView jobId={id} initialKeyword={job.keyword} initialLocation={job.location} />
    </div>
  );
}
