import type { Tool } from "./types";
import { postCoordination } from "@/lib/coordination";
import { prisma } from "@/lib/db/client";

interface PostCoordinationInput {
  content: string;
  intent?: string;
  to_agent_ids?: string[];
}

export const postCoordinationMessageTool: Tool<PostCoordinationInput> = {
  name: "post_coordination_message",
  description:
    "Share an update with other agents in your organization so they can stay in harmony. Use for: what you're working on, what you completed, blockers, or decisions that affect others. Leave to_agent_ids empty to broadcast to all agents.",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "Short update for other agents (e.g. 'Launching campaign X next week; avoid overlapping promos')",
      },
      intent: {
        type: "string",
        description: "Optional: working_on | completed | blocked | decision",
      },
      to_agent_ids: {
        type: "array",
        items: { type: "string" },
        description: "Optional: specific agent IDs to notify; omit to notify all",
      },
    },
    required: ["content"],
  },
  async execute(input, context) {
    if (!context.agentId || !context.orgId) {
      return { content: "Agent and org context required for coordination.", error: true };
    }
    const content = String(input.content).slice(0, 2000);
    try {
      await postCoordination(prisma, {
        org_id: context.orgId,
        from_agent_id: context.agentId,
        content,
        intent: input.intent ?? null,
        to_agent_ids: input.to_agent_ids ?? null,
      });
      return { content: "Coordination message posted; other agents will see it." };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to post coordination"}`,
        error: true,
      };
    }
  },
};
