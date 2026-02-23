import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { createOKRBodySchema } from "@/lib/okrs/validate";
import { getAgentDefinition } from "@/agents/registry";
import { evaluateProposedOKR } from "@/engine/negotiator";

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string }> }
) {
  try {
    const { orgId, agentId } = await params;
    await requireOrgAccess(orgId);
    const okrs = await prisma.oKR.findMany({
      where: { agent_id: agentId, org_id: orgId },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(okrs);
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
      include: { organization: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const raw = await req.json();
    const body = createOKRBodySchema.parse(raw);
    const dueDate = body.due_date ? new Date(body.due_date) : undefined;

    const proposedOKR = {
      objective: body.objective,
      key_results: body.key_results,
      time_horizon: body.time_horizon ?? undefined,
      due_date: body.due_date ?? undefined,
    };

    const definition = getAgentDefinition(agent.agent_type);
    const companyContext =
      agent.organization.business_context && typeof agent.organization.business_context === "object"
        ? JSON.stringify(agent.organization.business_context, null, 2)
        : agent.organization.icp_description ?? "No context yet.";
    const contextSnapshot = (agent.context_snapshot as Record<string, unknown>) ?? null;

    const evaluation = await evaluateProposedOKR(proposedOKR, {
      companyName: agent.organization.name,
      companyContext,
      agentType: agent.agent_type,
      agentMemory: contextSnapshot,
    });

    const status = evaluation.approved ? "accepted" : "negotiating";
    const okr = await prisma.oKR.create({
      data: {
        agent_id: agentId,
        org_id: orgId,
        objective: body.objective,
        key_results: JSON.parse(JSON.stringify(body.key_results)),
        status,
        agent_feedback: evaluation.feedback,
        feasibility_score: evaluation.feasibilityScore,
        time_horizon: body.time_horizon ?? null,
        due_date: dueDate ?? null,
      },
    });
    return NextResponse.json({
      okr,
      evaluation: {
        feasibilityScore: evaluation.feasibilityScore,
        feedback: evaluation.feedback,
        suggestedRevisions: evaluation.suggestedRevisions,
        approved: evaluation.approved,
        counterProposal: evaluation.counterProposal,
      },
    });
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
