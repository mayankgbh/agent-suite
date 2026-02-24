import { redirect, notFound } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { getTierFromBudgetCents } from "@/lib/agent-tier";
import { AgentBudgetSettings } from "./AgentBudgetSettings";

const BUDGET_PRESETS_CENTS = [
  { value: 0, label: "Starter ($0)", sublabel: "Haiku · 50K tokens/mo" },
  { value: 999, label: "Standard ($9.99/mo)", sublabel: "Sonnet · 200K tokens · 2 runs/day" },
  { value: 4999, label: "Pro ($49.99/mo)", sublabel: "Sonnet 4 · 1M tokens · 6 runs/day" },
  { value: 19999, label: "Business ($199.99/mo)", sublabel: "Sonnet 4 · 5M tokens · 24 runs/day" },
  { value: 99999, label: "Enterprise ($999.99/mo)", sublabel: "Opus 4 · 20M tokens · 96 runs/day" },
];

export default async function AgentSettingsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  let orgId: string;
  try {
    const { org } = await getOrCreateCurrentUser();
    orgId = org.id;
  } catch {
    redirect("/sign-in");
  }

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, org_id: orgId },
    select: {
      id: true,
      monthly_budget_cents: true,
      token_usage_current_month: true,
      token_usage_reset_at: true,
    },
  });

  if (!agent) notFound();

  const tier = getTierFromBudgetCents(agent.monthly_budget_cents);
  const currentCents = agent.monthly_budget_cents ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h2 className="text-lg font-semibold mb-1">Monthly budget</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Higher budget = smarter model, more tokens, and more proactive runs per day.
      </p>
      <AgentBudgetSettings
        orgId={orgId}
        agentId={agentId}
        initialBudgetCents={currentCents}
        initialUsage={agent.token_usage_current_month}
        tierLabel={tier.label}
        tierMaxTokens={tier.maxTokensPerMonth}
        presets={BUDGET_PRESETS_CENTS}
      />
    </div>
  );
}
