import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { createTaskBodySchema } from "@/lib/tasks/validate";

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string }> }
) {
  try {
    const { orgId, agentId } = await params;
    await requireOrgAccess(orgId);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, org_id: orgId },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const okrId = searchParams.get("okr_id");

    const tasks = await prisma.task.findMany({
      where: {
        agent_id: agentId,
        ...(status ? { status: status as "planned" | "in_progress" | "blocked" | "completed" | "failed" } : {}),
        ...(okrId ? { okr_id: okrId } : {}),
      },
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      include: {
        okr: { select: { id: true, objective: true } },
      },
    });
    return NextResponse.json(tasks);
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string }> }
) {
  try {
    const { orgId, agentId } = await params;
    await requireOrgAccess(orgId);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, org_id: orgId },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const raw = await req.json();
    const body = createTaskBodySchema.parse(raw);

    const task = await prisma.task.create({
      data: {
        agent_id: agentId,
        okr_id: body.okr_id ?? null,
        parent_task_id: body.parent_task_id ?? null,
        title: body.title,
        description: body.description ?? null,
        priority: (body.priority as "critical" | "high" | "medium" | "low") ?? "medium",
      },
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
