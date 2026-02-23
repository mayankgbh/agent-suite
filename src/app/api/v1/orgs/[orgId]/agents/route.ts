import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { createAgentBodySchema } from "@/lib/agents/validate";
import { listAgentTypes, getAgentType } from "@/agents/registry";

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
  return org.id;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgAccess(orgId);
    const agents = await prisma.agent.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        agent_type: true,
        display_name: true,
        status: true,
        created_at: true,
      },
    });
    return NextResponse.json(agents);
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
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgAccess(orgId);
    const raw = await req.json();
    const body = createAgentBodySchema.parse(raw);
    const agentType = getAgentType(body.agent_type);
    if (!agentType) {
      return NextResponse.json({ error: "Invalid agent_type" }, { status: 400 });
    }
    const displayName =
      body.display_name ?? `${body.agent_type.charAt(0).toUpperCase() + body.agent_type.slice(1)} Agent`;
    const agent = await prisma.agent.create({
      data: {
        org_id: orgId,
        agent_type: agentType,
        display_name: displayName,
        status: "onboarding",
      },
      select: {
        id: true,
        agent_type: true,
        display_name: true,
        status: true,
        created_at: true,
      },
    });
    return NextResponse.json(agent);
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
