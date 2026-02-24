import type { PrismaClient } from "@prisma/client";
import { getAgentDefinition } from "@/agents/registry";
import { planTasksFromOKR } from "./planner";
import { postCoordination } from "@/lib/coordination";

/**
 * Execute one cycle for an agent: ensure accepted OKRs have tasks, optionally update OKR status.
 * Framework-agnostic; receives Prisma from caller (e.g. worker).
 * Idempotent: safe to run multiple times (only creates tasks for OKRs that have none).
 */
export async function execute(agentId: string, prisma: PrismaClient): Promise<void> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { organization: true },
  });
  if (!agent || agent.status === "archived" || agent.status === "paused") {
    return;
  }

  await postCoordination(prisma, {
    org_id: agent.org_id,
    from_agent_id: agentId,
    content: `Running task planning for OKRs (${agent.display_name}).`,
    intent: "working_on",
  });

  const acceptedOKRs = await prisma.oKR.findMany({
    where: { agent_id: agentId, status: { in: ["accepted", "in_progress"] } },
  });

  for (const okr of acceptedOKRs) {
    const existingTasks = await prisma.task.count({
      where: { okr_id: okr.id },
    });
    if (existingTasks > 0) continue;

    const keyResults = (okr.key_results as Array<{ description: string; metric?: string; unit?: string }>) ?? [];
    const planned = await planTasksFromOKR({
      objective: okr.objective,
      key_results: keyResults,
    });

    for (const task of planned) {
      await prisma.task.create({
        data: {
          agent_id: agentId,
          okr_id: okr.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
        },
      });
    }

    if (okr.status === "accepted") {
      await prisma.oKR.update({
        where: { id: okr.id },
        data: { status: "in_progress" },
      });
    }
  }

  await postCoordination(prisma, {
    org_id: agent.org_id,
    from_agent_id: agentId,
    content: `Task planning cycle completed (${agent.display_name}).`,
    intent: "completed",
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { last_execution_at: new Date() },
  });
}
