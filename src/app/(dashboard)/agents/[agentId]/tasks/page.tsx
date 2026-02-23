import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/tasks/TaskList";

export default async function AgentTasksPage({
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

  const tasks = await prisma.task.findMany({
    where: { agent_id: agentId },
    orderBy: [{ status: "asc" }, { created_at: "desc" }],
    include: { okr: { select: { id: true, objective: true } } },
  });

  const tasksJson = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    output: t.output,
    tools_used: t.tools_used,
    started_at: t.started_at?.toISOString() ?? null,
    completed_at: t.completed_at?.toISOString() ?? null,
    created_at: t.created_at.toISOString(),
    okr: t.okr,
  }));

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/agents/${agentId}`}>← {agent.display_name}</Link>
        </Button>
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Tasks</h1>
      <TaskList agentId={agentId} orgId={orgId} initialTasks={tasksJson} />
    </div>
  );
}
