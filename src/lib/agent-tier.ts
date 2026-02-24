/**
 * Maps monthly budget (cents) to model, token cap, and proactive run frequency.
 * Higher budget = smarter model + more tokens + more runs per day.
 */
export interface AgentTier {
  model: string;
  maxTokensPerMonth: number;
  maxTokensPerRequest: number;
  runsPerDay: number;
  label: string;
}

const TIERS: Array<{ minCents: number; tier: AgentTier }> = [
  { minCents: 0, tier: { model: "claude-3-5-haiku-20241022", maxTokensPerMonth: 50_000, maxTokensPerRequest: 4096, runsPerDay: 1, label: "Starter" } },
  { minCents: 999, tier: { model: "claude-3-5-sonnet-20241022", maxTokensPerMonth: 200_000, maxTokensPerRequest: 8192, runsPerDay: 2, label: "Standard" } },
  { minCents: 4999, tier: { model: "claude-sonnet-4-20250514", maxTokensPerMonth: 1_000_000, maxTokensPerRequest: 8192, runsPerDay: 6, label: "Pro" } },
  { minCents: 19999, tier: { model: "claude-sonnet-4-20250514", maxTokensPerMonth: 5_000_000, maxTokensPerRequest: 16384, runsPerDay: 24, label: "Business" } },
  { minCents: 99999, tier: { model: "claude-opus-4-20250514", maxTokensPerMonth: 20_000_000, maxTokensPerRequest: 16384, runsPerDay: 96, label: "Enterprise" } },
];

export function getTierFromBudgetCents(monthlyBudgetCents: number | null | undefined): AgentTier {
  if (monthlyBudgetCents == null || monthlyBudgetCents <= 0) {
    return TIERS[0].tier;
  }
  let chosen = TIERS[0].tier;
  for (const { minCents, tier } of TIERS) {
    if (monthlyBudgetCents >= minCents) chosen = tier;
  }
  return chosen;
}
