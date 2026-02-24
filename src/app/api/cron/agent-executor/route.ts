import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getTierFromBudgetCents } from "@/lib/agent-tier";
import { enqueueAgentExecution } from "@/workers/agent-executor.worker";

/**
 * Called by Vercel Cron (or similar) to enqueue proactive runs for agents that are due.
 * Set CRON_SECRET in env and configure cron to send: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agents = await prisma.agent.findMany({
      where: { status: "active" },
      select: {
        id: true,
        monthly_budget_cents: true,
        last_execution_at: true,
      },
    });

    const now = Date.now();
    let enqueued = 0;

    for (const agent of agents) {
      const tier = getTierFromBudgetCents(agent.monthly_budget_cents);
      const runsPerDay = Math.max(1, tier.runsPerDay);
      const intervalMs = (24 * 60 * 60 * 1000) / runsPerDay;
      const lastRun = agent.last_execution_at?.getTime() ?? 0;
      if (now - lastRun >= intervalMs) {
        await enqueueAgentExecution(agent.id);
        enqueued++;
      }
    }

    return NextResponse.json({ ok: true, enqueued, total: agents.length });
  } catch (e) {
    console.error("Cron agent-executor error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cron failed" },
      { status: 500 }
    );
  }
}
