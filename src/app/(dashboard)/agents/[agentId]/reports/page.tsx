import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { DailyReportList } from "@/components/reports/DailyReportList";

export default async function AgentReportsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  let orgId: string;
  try {
    const { org } = await getOrCreateCurrentUser();
    orgId = org.id;
  } catch {
    redirect("/sign-in");
  }

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, org_id: orgId },
    select: { id: true, display_name: true },
  });
  if (!agent) notFound();

  const reports = await prisma.dailyReport.findMany({
    where: { agent_id: agentId },
    orderBy: { report_date: "desc" },
    take: 30,
  });

  const reportsJson = reports.map((r) => ({
    id: r.id,
    report_date: r.report_date.toISOString().slice(0, 10),
    summary: r.summary,
    okr_progress: r.okr_progress,
    tasks_completed: r.tasks_completed,
    tasks_in_progress: r.tasks_in_progress,
    blockers: r.blockers,
    recommendations: r.recommendations,
    created_at: r.created_at.toISOString(),
  }));

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/agents/${agentId}`}>← {agent.display_name}</Link>
        </Button>
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Daily reports</h1>
      <DailyReportList agentId={agentId} orgId={orgId} initialReports={reportsJson} />
    </div>
  );
}
