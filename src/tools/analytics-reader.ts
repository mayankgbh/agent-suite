import type { Tool } from "./types";

interface AnalyticsReaderInput {
  metric?: string;
  period?: string;
}

/**
 * Reads metrics the agent or user has recorded via metrics_record, or reports how to connect real analytics.
 */
export const analyticsReaderTool: Tool<AnalyticsReaderInput> = {
  name: "analytics_reader",
  description:
    "Read stored metrics (e.g. traffic, conversions) that were recorded with metrics_record, or get instructions to connect Google Analytics. Use when you need to report on or reference key metrics.",
  inputSchema: {
    type: "object",
    properties: {
      metric: { type: "string", description: "Optional: specific metric name (e.g. mrr, sessions)" },
      period: { type: "string", description: "Optional: period (e.g. 2025-01, last_week)" },
    },
  },
  async execute(input, context) {
    if (!context.agentId) {
      return { content: "Agent context required.", error: true };
    }
    const { prisma } = await import("@/lib/db/client");
    const prefix = "metric:";
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
    const keyStart = input.metric
      ? `${prefix}${sanitize(input.metric)}${input.period ? `:${sanitize(input.period)}` : ""}`
      : prefix;
    const rows = await prisma.agentMemory.findMany({
      where: {
        agent_id: context.agentId,
        key: keyStart.length > prefix.length ? { startsWith: keyStart } : { startsWith: prefix },
      },
      orderBy: { updated_at: "desc" },
      take: 20,
    });
    if (rows.length === 0) {
      return {
        content:
          "No stored metrics found. Use metrics_record to save metrics the user provides, or ask the user to connect Google Analytics (ANALYTICS_* env) or use an analytics MCP server.",
      };
    }
    const content = rows
      .map((r) => `${r.key.replace(prefix, "")}: ${r.value}`)
      .join("\n");
    return { content };
  },
};
