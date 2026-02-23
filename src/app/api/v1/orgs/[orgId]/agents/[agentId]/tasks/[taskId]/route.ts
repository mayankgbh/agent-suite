import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { updateTaskBodySchema } from "@/lib/tasks/validate";

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string; taskId: string }> }
) {
  try {
    const { orgId, agentId, taskId } = await params;
    await requireOrgAccess(orgId);
    const task = await prisma.task.findFirst({
      where: { id: taskId, agent_id: agentId },
      include: {
        okr: { select: { id: true, objective: true, status: true } },
      },
    });
    if (!task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const agent = await prisma.agent.findFirst({
      where: { id: task.agent_id, org_id: orgId },
    });
    if (!agent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string; taskId: string }> }
) {
  try {
    const { orgId, agentId, taskId } = await params;
    await requireOrgAccess(orgId);
    const existing = await prisma.task.findFirst({
      where: { id: taskId, agent_id: agentId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, org_id: orgId },
    });
    if (!agent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const raw = await req.json();
    const body = updateTaskBodySchema.parse(raw);

    const data: Parameters<typeof prisma.task.update>[0]["data"] = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "in_progress" && !existing.started_at) {
        data.started_at = new Date();
      }
      if ((body.status === "completed" || body.status === "failed") && !existing.completed_at) {
        data.completed_at = new Date();
      }
    }
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.output !== undefined) data.output = body.output as object;
    if (body.tools_used !== undefined) data.tools_used = body.tools_used;

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });
    return NextResponse.json(task);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const zodError = e && typeof e === "object" && "flatten" in e;
    return NextResponse.json(
      { error: zodError ? "Validation failed" : (e instanceof Error ? e.message : "Bad request") },
      { status: 400 }
    );
  }
}
