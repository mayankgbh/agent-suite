import type { Tool } from "./types";
import { prisma } from "@/lib/db/client";

interface MetricsRecordInput {
  name: string;
  value: string;
  period?: string;
}

function sanitizeKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
}

export const metricsRecordTool: Tool<MetricsRecordInput> = {
  name: "metrics_record",
  description:
    "Record a metric (e.g. MRR, demos booked, sessions) for this agent to reference later. Use when the user shares a number or you agree on a target.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Metric name (e.g. mrr, demos_booked, sessions)" },
      value: { type: "string", description: "Value (e.g. 18.4k, 9, 50K)" },
      period: { type: "string", description: "Optional period (e.g. 2025-01, last_week)" },
    },
    required: ["name", "value"],
  },
  async execute(input, context) {
    if (!context.agentId) {
      return { content: "Agent context required.", error: true };
    }
    const key = `metric:${sanitizeKey(input.name)}${input.period ? `:${sanitizeKey(input.period)}` : ""}`;
    const value = String(input.value).slice(0, 500);
    try {
      await prisma.agentMemory.upsert({
        where: { agent_id_key: { agent_id: context.agentId, key } },
        create: { agent_id: context.agentId, key, value },
        update: { value },
      });
      return { content: `Recorded ${input.name} = ${value}${input.period ? ` for ${input.period}` : ""}.` };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to record metric"}`,
        error: true,
      };
    }
  },
};
