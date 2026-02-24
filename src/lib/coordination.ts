import type { PrismaClient } from "@prisma/client";

const DEFAULT_LIMIT = 20;

export interface CoordinationMessageRow {
  id: string;
  from_agent_id: string;
  from_agent_display_name: string;
  to_agent_ids: string | null;
  content: string;
  intent: string | null;
  created_at: Date;
}

export async function getRecentCoordination(
  prisma: PrismaClient,
  orgId: string,
  options: { excludeFromAgentId?: string; forAgentId?: string; limit?: number } = {}
): Promise<CoordinationMessageRow[]> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const messages = await prisma.coordinationMessage.findMany({
    where: { org_id: orgId },
    orderBy: { created_at: "desc" },
    take: limit,
    include: {
      from_agent: { select: { display_name: true } },
    },
  });
  let filtered = messages;
  if (options.excludeFromAgentId) {
    filtered = filtered.filter((m) => m.from_agent_id !== options.excludeFromAgentId);
  }
  if (options.forAgentId) {
    filtered = filtered.filter((m) => {
      if (m.to_agent_ids == null) return true;
      try {
        const ids = JSON.parse(m.to_agent_ids) as string[];
        return ids.includes(options.forAgentId!);
      } catch {
        return true;
      }
    });
  }
  return filtered.slice(0, limit).map((m) => ({
    id: m.id,
    from_agent_id: m.from_agent_id,
    from_agent_display_name: m.from_agent.display_name,
    to_agent_ids: m.to_agent_ids,
    content: m.content,
    intent: m.intent,
    created_at: m.created_at,
  }));
}

export function formatCoordinationSummary(rows: CoordinationMessageRow[]): string {
  if (rows.length === 0) return "";
  const lines = rows.map(
    (r) =>
      `- [${r.created_at.toISOString()}] ${r.from_agent_display_name}${r.intent ? ` (${r.intent})` : ""}: ${r.content}`
  );
  return "Recent updates from other agents (use this to stay in harmony):\n" + lines.join("\n");
}

export async function postCoordination(
  prisma: PrismaClient,
  data: {
    org_id: string;
    from_agent_id: string;
    to_agent_ids?: string[] | null;
    content: string;
    intent?: string | null;
  }
): Promise<{ id: string }> {
  const row = await prisma.coordinationMessage.create({
    data: {
      org_id: data.org_id,
      from_agent_id: data.from_agent_id,
      to_agent_ids: data.to_agent_ids == null ? null : JSON.stringify(data.to_agent_ids),
      content: data.content,
      intent: data.intent ?? null,
    },
    select: { id: true },
  });
  return row;
}
