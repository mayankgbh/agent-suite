import type { AgentTypeDefinition } from "@/agents/types";

export interface BuildContextInput {
  companyName: string;
  companyContext: string;
  agentDefinition: AgentTypeDefinition;
  contextSnapshot: Record<string, unknown> | null;
  onboardingAnswers?: Record<string, string>;
  /** Recent updates from other agents (coordination); included in system prompt when set */
  coordinationSummary?: string;
}

/**
 * Build system prompt for the agent from template + org context + onboarding.
 * Framework-agnostic (no Next.js).
 */
export function buildSystemPrompt(input: BuildContextInput): string {
  const { companyName, companyContext, agentDefinition, contextSnapshot, onboardingAnswers, coordinationSummary } =
    input;
  const companyContextStr =
    typeof companyContext === "string"
      ? companyContext
      : JSON.stringify(companyContext ?? {}, null, 2);
  const snapshotStr =
    contextSnapshot && Object.keys(contextSnapshot).length > 0
      ? JSON.stringify(contextSnapshot, null, 2)
      : "None yet.";
  const onboardingStr =
    onboardingAnswers && Object.keys(onboardingAnswers).length > 0
      ? JSON.stringify(onboardingAnswers, null, 2)
      : "Not yet provided.";

  let out = agentDefinition.systemPromptTemplate
    .replace(/\{\{companyName\}\}/g, companyName)
    .replace(/\{\{companyContext\}\}/g, companyContextStr)
    .replace(/\{\{onboardingAnswers\}\}/g, onboardingStr)
    .replace(/\{\{contextSnapshot\}\}/g, snapshotStr)
    .trim();
  if (coordinationSummary && coordinationSummary.length > 0) {
    out += "\n\n" + coordinationSummary;
  }
  return out;
}
