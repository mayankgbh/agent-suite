import Anthropic from "@anthropic-ai/sdk";

export interface OKRForPlanning {
  objective: string;
  key_results: Array<{ description: string; metric?: string; unit?: string }>;
}

export interface PlannedTask {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
}

/**
 * Given an OKR, ask Claude to break it into concrete tasks. Framework-agnostic.
 */
export async function planTasksFromOKR(okr: OKRForPlanning): Promise<PlannedTask[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a planning assistant. Given an OKR (Objective and Key Results), output a list of concrete, actionable tasks that would help achieve it.
Output valid JSON only, no markdown or extra text. Format: [{"title": string, "description": string, "priority": "critical"|"high"|"medium"|"low"}]
Keep tasks focused and 3-10 items.`;

  const userContent = `OKR to break into tasks:\n${JSON.stringify(okr, null, 2)}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content?.find((b) => b.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text : "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (t): t is PlannedTask =>
          t &&
          typeof t === "object" &&
          "title" in t &&
          typeof (t as PlannedTask).title === "string"
      )
      .map((t) => ({
        title: (t as PlannedTask).title,
        description: typeof (t as PlannedTask).description === "string" ? (t as PlannedTask).description : "",
        priority: ["critical", "high", "medium", "low"].includes((t as PlannedTask).priority)
          ? (t as PlannedTask).priority
          : "medium",
      }));
  } catch {
    return [];
  }
}
