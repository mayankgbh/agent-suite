import Anthropic from "@anthropic-ai/sdk";

export interface ProposedOKR {
  objective: string;
  key_results: Array<{
    description: string;
    metric?: string;
    target?: string | number;
    current?: string | number;
    unit?: string;
  }>;
  time_horizon?: "weekly" | "monthly" | "quarterly";
  due_date?: string;
}

export interface OKREvaluation {
  feasibilityScore: number;
  feedback: string;
  suggestedRevisions: Array<{
    field: string;
    original: string;
    suggested: string;
    reason: string;
  }> | null;
  approved: boolean;
  counterProposal: ProposedOKR | null;
}

export interface NegotiatorContext {
  companyName: string;
  companyContext: string;
  agentType: string;
  agentMemory: Record<string, unknown> | null;
}

/**
 * Evaluate a proposed OKR using Claude. Returns feasibility, feedback, and optional counter-proposal.
 * Framework-agnostic.
 */
export async function evaluateProposedOKR(
  proposedOKR: ProposedOKR,
  context: NegotiatorContext
): Promise<OKREvaluation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const anthropic = new Anthropic({ apiKey });

  const companyContextStr =
    typeof context.companyContext === "string"
      ? context.companyContext
      : JSON.stringify(context.companyContext ?? {}, null, 2);
  const memoryStr = context.agentMemory && Object.keys(context.agentMemory).length > 0
    ? JSON.stringify(context.agentMemory, null, 2)
    : "None yet.";

  const systemPrompt = `You are the ${context.agentType} agent for ${context.companyName}. You are an expert ${context.agentType} professional.
Your job is to evaluate proposed OKRs and provide honest, constructive feedback.

Company context:
${companyContextStr}

Your current understanding (onboarding, prior context):
${memoryStr}

EVALUATION CRITERIA:
- Is this achievable given current resources and timeline?
- Are the key results measurable and specific?
- Does this align with the company's current situation?
- What risks or dependencies exist?

Be direct. If something is unrealistic, say so and propose an alternative. If it's good, endorse it enthusiastically.
Always provide a feasibility score from 0 to 1 (1 = fully achievable and well-scoped).

Respond with valid JSON only, no markdown or extra text, in this exact shape:
{"feasibilityScore": number, "feedback": string, "suggestedRevisions": [{"field": string, "original": string, "suggested": string, "reason": string}] or null, "approved": boolean, "counterProposal": {"objective": string, "key_results": [{"description": string, "metric": string, "target": string, "current": string, "unit": string}], "time_horizon": "weekly"|"monthly"|"quarterly"|null, "due_date": string|null} or null}`;

  const userContent = `Evaluate this proposed OKR:\n${JSON.stringify(proposedOKR, null, 2)}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content?.find((b) => b.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text : "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      feasibilityScore: 0.5,
      feedback: text || "Unable to parse evaluation.",
      suggestedRevisions: null,
      approved: false,
      counterProposal: null,
    };
  }

  const p = parsed as Record<string, unknown>;
  return {
    feasibilityScore: typeof p.feasibilityScore === "number" ? p.feasibilityScore : 0.5,
    feedback: typeof p.feedback === "string" ? p.feedback : "",
    suggestedRevisions: Array.isArray(p.suggestedRevisions) ? (p.suggestedRevisions as OKREvaluation["suggestedRevisions"]) : null,
    approved: Boolean(p.approved),
    counterProposal: p.counterProposal && typeof p.counterProposal === "object"
      ? (p.counterProposal as ProposedOKR)
      : null,
  };
}
