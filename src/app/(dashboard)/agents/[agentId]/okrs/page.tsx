import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { OKRForm } from "@/components/okrs/OKRForm";
import { OKRsList } from "@/components/okrs/OKRsList";

export default async function AgentOKRsPage({
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

  const [agent, okrs] = await Promise.all([
    prisma.agent.findFirst({
      where: { id: agentId, org_id: orgId },
      select: { id: true, display_name: true },
    }),
    prisma.oKR.findMany({
      where: { agent_id: agentId, org_id: orgId },
      orderBy: { created_at: "desc" },
    }),
  ]);

  if (!agent) notFound();

  const okrsJson = okrs.map((o) => ({
    id: o.id,
    objective: o.objective,
    key_results: o.key_results as Array<{ description: string; metric?: string; target?: string | number; current?: string | number; unit?: string }>,
    status: o.status,
    agent_feedback: o.agent_feedback,
    feasibility_score: o.feasibility_score,
    time_horizon: o.time_horizon,
    due_date: o.due_date?.toISOString() ?? null,
    created_at: o.created_at.toISOString(),
  }));

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/agents/${agentId}`}>← {agent.display_name}</Link>
        </Button>
      </div>
      <h1 className="mb-6 text-2xl font-semibold">OKRs</h1>

      <div className="mb-10">
        <h2 className="mb-4 text-lg font-medium">Propose new OKR</h2>
        <OKRFormWithRefresh orgId={orgId} agentId={agentId} />
      </div>

      <h2 className="mb-4 text-lg font-medium">Your OKRs</h2>
      <OKRsList orgId={orgId} agentId={agentId} initialOkrs={okrsJson} />
    </div>
  );
}

function OKRFormWithRefresh({ orgId, agentId }: { orgId: string; agentId: string }) {
  return (
    <OKRForm
      orgId={orgId}
      agentId={agentId}
      onSuccess={() => {
        window.location.reload();
      }}
    />
  );
}
