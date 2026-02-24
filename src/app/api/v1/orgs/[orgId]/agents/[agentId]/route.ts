import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { updateAgentBodySchema } from "@/lib/agents/validate";
import { getTierFromBudgetCents } from "@/lib/agent-tier";

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
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, org_id: orgId },
      select: {
        id: true,
        org_id: true,
        agent_type: true,
        display_name: true,
        status: true,
        personality_config: true,
        context_snapshot: true,
        system_prompt_override: true,
        monthly_budget_cents: true,
        token_usage_current_month: true,
        token_usage_reset_at: true,
        created_at: true,
        activated_at: true,
        updated_at: true,
      },
    });
    if (!agent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const tier = getTierFromBudgetCents(agent.monthly_budget_cents);
    return NextResponse.json({
      ...agent,
      tier: {
        label: tier.label,
        model: tier.model,
        maxTokensPerMonth: tier.maxTokensPerMonth,
        runsPerDay: tier.runsPerDay,
      },
    });
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
  { params }: { params: Promise<{ orgId: string; agentId: string }> }
) {
  try {
    const { orgId, agentId } = await params;
    await requireOrgAccess(orgId);
    const raw = await req.json();
    const body = updateAgentBodySchema.parse(raw);
    const data: Parameters<typeof prisma.agent.update>[0]["data"] = {};
    if (body.display_name !== undefined) data.display_name = body.display_name;
    if (body.status !== undefined) data.status = body.status;
    if (body.personality_config !== undefined)
      data.personality_config = body.personality_config as object;
    if (body.system_prompt_override !== undefined)
      data.system_prompt_override = body.system_prompt_override;
    if (body.monthly_budget_cents !== undefined)
      data.monthly_budget_cents = body.monthly_budget_cents;
    const agent = await prisma.agent.update({
      where: { id: agentId },
      data,
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string }> }
) {
  try {
    const { orgId, agentId } = await params;
    await requireOrgAccess(orgId);
    await prisma.agent.updateMany({
      where: { id: agentId, org_id: orgId },
      data: { status: "archived" },
    });
    return NextResponse.json({ ok: true });
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
