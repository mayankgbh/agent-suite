import type { PrismaClient } from "@prisma/client";

const START_OF_MONTH = 1; // day of month we consider "billing" reset

function startOfCurrentBillingMonth(): Date {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return new Date(y, m, START_OF_MONTH, 0, 0, 0, 0);
}

export async function ensureUsageReset(prisma: PrismaClient, agentId: string): Promise<void> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { token_usage_reset_at: true },
  });
  if (!agent) return;
  const resetAt = agent.token_usage_reset_at;
  const start = startOfCurrentBillingMonth();
  if (resetAt == null || resetAt < start) {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        token_usage_current_month: 0,
        token_usage_reset_at: start,
      },
    });
  }
}

export async function getCurrentUsage(prisma: PrismaClient, agentId: string): Promise<number> {
  await ensureUsageReset(prisma, agentId);
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { token_usage_current_month: true },
  });
  return agent?.token_usage_current_month ?? 0;
}

export async function recordUsage(
  prisma: PrismaClient,
  agentId: string,
  tokensUsed: number
): Promise<void> {
  await ensureUsageReset(prisma, agentId);
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      token_usage_current_month: { increment: tokensUsed },
    },
  });
}
