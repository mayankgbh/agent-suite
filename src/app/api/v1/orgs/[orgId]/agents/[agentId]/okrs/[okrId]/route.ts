import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { updateOKRBodySchema } from "@/lib/okrs/validate";

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string; okrId: string }> }
) {
  try {
    const { orgId, agentId, okrId } = await params;
    await requireOrgAccess(orgId);
    const okr = await prisma.oKR.findFirst({
      where: { id: okrId, agent_id: agentId, org_id: orgId },
    });
    if (!okr) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(okr);
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
  { params }: { params: Promise<{ orgId: string; agentId: string; okrId: string }> }
) {
  try {
    const { orgId, agentId, okrId } = await params;
    await requireOrgAccess(orgId);
    const raw = await req.json();
    const body = updateOKRBodySchema.parse(raw);

    const data: Parameters<typeof prisma.oKR.update>[0]["data"] = {};
    if (body.objective !== undefined) data.objective = body.objective;
    if (body.key_results !== undefined) data.key_results = body.key_results as object[];
    if (body.status !== undefined) data.status = body.status;
    if (body.time_horizon !== undefined) data.time_horizon = body.time_horizon;
    if (body.due_date !== undefined) data.due_date = body.due_date ? new Date(body.due_date) : null;

    const okr = await prisma.oKR.findFirst({
      where: { id: okrId, agent_id: agentId, org_id: orgId },
    });
    if (!okr) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.oKR.update({
      where: { id: okrId },
      data,
    });
    return NextResponse.json(updated);
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
