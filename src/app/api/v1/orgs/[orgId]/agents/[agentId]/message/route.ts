import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { sendMessageBodySchema } from "@/lib/agents/message-validate";
import { getAgentDefinition } from "@/agents/registry";
import { buildSystemPrompt } from "@/engine/context-builder";
import { runConversationTurn } from "@/engine/conversation-handler";
import { getTierFromBudgetCents } from "@/lib/agent-tier";
import {
  getCurrentUsage,
  recordUsage,
  ensureUsageReset,
} from "@/lib/agent-usage";
import {
  getRecentCoordination,
  formatCoordinationSummary,
} from "@/lib/coordination";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string }> }
) {
  try {
    const { orgId, agentId } = await params;
    const { org } = await getOrCreateCurrentUser();
    if (org.id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const raw = await req.json();
    const body = sendMessageBodySchema.parse(raw);

    const [agent, organization] = await Promise.all([
      prisma.agent.findFirst({
        where: { id: agentId, org_id: orgId },
        select: {
          id: true,
          agent_type: true,
          context_snapshot: true,
          monthly_budget_cents: true,
          token_usage_current_month: true,
          token_usage_reset_at: true,
        },
      }),
      prisma.organization.findUniqueOrThrow({
        where: { id: orgId },
      }),
    ]);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const definition = getAgentDefinition(agent.agent_type);
    const companyContext =
      organization.business_context && typeof organization.business_context === "object"
        ? JSON.stringify(organization.business_context, null, 2)
        : organization.icp_description ?? "No context yet.";
    const contextSnapshot = (agent.context_snapshot as Record<string, unknown>) ?? null;
    const onboardingAnswers =
      contextSnapshot && typeof contextSnapshot.onboardingAnswers === "object"
        ? (contextSnapshot.onboardingAnswers as Record<string, string>)
        : undefined;

    const coordinationRows = await getRecentCoordination(prisma, orgId, {
      forAgentId: agentId,
      excludeFromAgentId: agentId,
      limit: 15,
    });
    const coordinationSummary = formatCoordinationSummary(coordinationRows);

    const systemPrompt = buildSystemPrompt({
      companyName: organization.name,
      companyContext,
      agentDefinition: definition,
      contextSnapshot,
      onboardingAnswers,
      coordinationSummary,
    });

    const recentMessages = await prisma.agentMessage.findMany({
      where: { agent_id: agentId },
      orderBy: { created_at: "asc" },
      take: 30,
      select: { role: true, content: true },
    });

    const conversationMessages = [
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: body.content },
    ];

    await prisma.agentMessage.create({
      data: {
        agent_id: agentId,
        org_id: orgId,
        role: "user",
        content: body.content,
        message_type: body.message_type,
      },
    });

    const tier = getTierFromBudgetCents(agent.monthly_budget_cents);
    await ensureUsageReset(prisma, agentId);
    const currentUsage = await getCurrentUsage(prisma, agentId);
    if (currentUsage >= tier.maxTokensPerMonth) {
      return NextResponse.json(
        {
          error:
            "Monthly token limit reached. Increase this agent’s monthly budget to continue.",
        },
        { status: 429 }
      );
    }

    const { content: assistantContent, usage } = await runConversationTurn({
      systemPrompt,
      messages: conversationMessages,
      allowedTools: definition.allowedTools,
      agentId,
      orgId,
      model: tier.model,
      maxTokens: Math.min(
        tier.maxTokensPerRequest,
        tier.maxTokensPerMonth - currentUsage
      ),
    });

    const totalTokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
    if (totalTokens > 0) {
      await recordUsage(prisma, agentId, totalTokens);
    }

    const assistantMessage = await prisma.agentMessage.create({
      data: {
        agent_id: agentId,
        org_id: orgId,
        role: "agent",
        content: assistantContent,
        message_type: "answer",
      },
      select: {
        id: true,
        role: true,
        content: true,
        message_type: true,
        created_at: true,
      },
    });

    return NextResponse.json(assistantMessage);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const zodError = e && typeof e === "object" && "flatten" in e;
    return NextResponse.json(
      {
        error: zodError
          ? "Validation failed"
          : e instanceof Error
            ? e.message
            : "Bad request",
      },
      { status: 400 }
    );
  }
}
