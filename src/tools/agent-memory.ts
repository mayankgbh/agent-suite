import type { Tool } from "./types";
import { prisma } from "@/lib/db/client";

interface MemoryStoreInput {
  key: string;
  value: string;
}

interface MemoryGetInput {
  key: string;
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256);
}

export const memoryStoreTool: Tool<MemoryStoreInput> = {
  name: "memory_store",
  description:
    "Store a fact or note in this agent's long-term memory. Use for important context, decisions, or facts to remember across conversations. Key should be a short identifier.",
  inputSchema: {
    type: "object",
    properties: {
      key: { type: "string", description: "Short key for this memory (e.g. 'primary_competitor')" },
      value: { type: "string", description: "Content to store" },
    },
    required: ["key", "value"],
  },
  async execute(input, context) {
    if (!context.agentId) {
      return { content: "Agent context required for memory.", error: true };
    }
    const key = sanitizeKey(input.key);
    const value = String(input.value).slice(0, 50000);
    try {
      await prisma.agentMemory.upsert({
        where: {
          agent_id_key: { agent_id: context.agentId, key },
        },
        create: { agent_id: context.agentId, key, value },
        update: { value },
      });
      return { content: `Stored memory under key "${key}".` };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to store memory"}`,
        error: true,
      };
    }
  },
};

export const memoryGetTool: Tool<MemoryGetInput> = {
  name: "memory_get",
  description:
    "Retrieve a previously stored memory by key. Use when you need to recall something this agent stored earlier.",
  inputSchema: {
    type: "object",
    properties: {
      key: { type: "string", description: "Key of the memory to retrieve" },
    },
    required: ["key"],
  },
  async execute(input, context) {
    if (!context.agentId) {
      return { content: "Agent context required for memory.", error: true };
    }
    const key = sanitizeKey(input.key);
    try {
      const row = await prisma.agentMemory.findUnique({
        where: { agent_id_key: { agent_id: context.agentId, key } },
      });
      if (!row) return { content: `No memory found for key "${key}".` };
      return { content: row.value };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to get memory"}`,
        error: true,
      };
    }
  },
};
