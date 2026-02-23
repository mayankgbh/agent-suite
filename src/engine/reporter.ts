import Anthropic from "@anthropic-ai/sdk";
import type { PrismaClient } from "@prisma/client";

export interface DailyReportData {
  summary: string;
  okr_progress: Array<{ okr_id: string; progress_delta: string; notes: string }>;
  tasks_completed: string[];
  tasks_in_progress: string[];
  blockers: Array<{ description: string; severity: string; needs_human: boolean }>;
  recommendations: string[];
}

/**
 * Generate daily report for an agent. Framework-agnostic.
 */
export async function generateDailyReport(
  agentId: string,
  prisma: PrismaClient,
  reportDate?: Date
): Promise<DailyReportData | null> {
  const date = reportDate ?? new Date();
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { organization: true },
  });
  if (!agent) return null;

  const [okrs, tasks] = await Promise.all([
    prisma.oKR.findMany({
      where: { agent_id: agentId, status: { in: ["accepted", "in_progress"] } },
    }),
    prisma.task.findMany({
      where: { agent_id: agentId },
      orderBy: { updated_at: "desc" },
      take: 50,
    }),
  ]);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are the ${agent.agent_type} agent for ${agent.organization.name}. Generate a brief daily standup report.
Output valid JSON only, no markdown. Use this exact shape:
{"summary": string (2-4 sentences), "okr_progress": [{"okr_id": string, "progress_delta": string, "notes": string}], "tasks_completed": [task_id string], "tasks_in_progress": [task_id string], "blockers": [{"description": string, "severity": "low"|"medium"|"high", "needs_human": boolean}], "recommendations": [string]}`;

  const completedIds = tasks.filter((t) => t.status === "completed").map((t) => t.id);
  const inProgressIds = tasks.filter((t) => t.status === "in_progress").map((t) => t.id);

  const userContent = `Report date: ${date.toISOString().slice(0, 10)}
OKRs: ${JSON.stringify(okrs.map((o) => ({ id: o.id, objective: o.objective, status: o.status })))}
Tasks (recent): ${JSON.stringify(tasks.slice(0, 15).map((t) => ({ id: t.id, title: t.title, status: t.status })))}
Tasks completed today (IDs): ${completedIds.join(", ") || "none"}
Tasks in progress (IDs): ${inProgressIds.join(", ") || "none"}

Generate the daily report JSON.`;

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
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "No summary.",
      okr_progress: Array.isArray(parsed.okr_progress)
        ? (parsed.okr_progress as DailyReportData["okr_progress"])
        : [],
      tasks_completed: Array.isArray(parsed.tasks_completed) ? (parsed.tasks_completed as string[]) : [],
      tasks_in_progress: Array.isArray(parsed.tasks_in_progress) ? (parsed.tasks_in_progress as string[]) : [],
      blockers: Array.isArray(parsed.blockers) ? (parsed.blockers as DailyReportData["blockers"]) : [],
      recommendations: Array.isArray(parsed.recommendations) ? (parsed.recommendations as string[]) : [],
    };
  } catch {
    return {
      summary: "Report generation failed.",
      okr_progress: [],
      tasks_completed: completedIds,
      tasks_in_progress: inProgressIds,
      blockers: [],
      recommendations: [],
    };
  }
}

/**
 * Generate and persist daily report for an agent. Idempotent per (agent, date).
 */
export async function createDailyReport(
  agentId: string,
  prisma: PrismaClient,
  reportDate?: Date
): Promise<{ id: string } | null> {
  const date = reportDate ?? new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const data = await generateDailyReport(agentId, prisma, date);
  if (!data) return null;

  const report = await prisma.dailyReport.upsert({
    where: {
      agent_id_report_date: { agent_id: agentId, report_date: dateOnly },
    },
    create: {
      agent_id: agentId,
      org_id: (await prisma.agent.findUnique({ where: { id: agentId }, select: { org_id: true } }))!.org_id,
      report_date: dateOnly,
      summary: data.summary,
      okr_progress: data.okr_progress as object,
      tasks_completed: data.tasks_completed,
      tasks_in_progress: data.tasks_in_progress,
      blockers: data.blockers as object,
      recommendations: data.recommendations as object,
    },
    update: {
      summary: data.summary,
      okr_progress: data.okr_progress as object,
      tasks_completed: data.tasks_completed,
      tasks_in_progress: data.tasks_in_progress,
      blockers: data.blockers as object,
      recommendations: data.recommendations as object,
    },
  });
  return { id: report.id };
}
