import type { Tool } from "./types";
import { prisma } from "@/lib/db/client";

function sanitizePath(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/\/+/g, "/").trim();
  if (normalized.includes("..") || normalized.startsWith("/")) {
    return "";
  }
  return normalized.slice(0, 512) || "";
}

interface ReadFileInput {
  path: string;
}

interface WriteFileInput {
  path: string;
  content: string;
}

export const readFileTool: Tool<ReadFileInput> = {
  name: "read_file",
  description:
    "Read a file from this agent's sandboxed workspace. Path is relative (e.g. 'drafts/post1.md'). Use to load previously saved content.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to the file" },
    },
    required: ["path"],
  },
  async execute(input, context) {
    if (!context.agentId || !context.orgId) {
      return { content: "Agent and org context required.", error: true };
    }
    const path = sanitizePath(input.path);
    if (!path) {
      return { content: "Invalid path (no '..' or absolute paths).", error: true };
    }
    try {
      const row = await prisma.agentFile.findUnique({
        where: { agent_id_path: { agent_id: context.agentId, path } },
      });
      if (!row) return { content: `File not found: ${path}` };
      return { content: row.content };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to read file"}`,
        error: true,
      };
    }
  },
};

export const writeFileTool: Tool<WriteFileInput> = {
  name: "write_file",
  description:
    "Write content to a file in this agent's sandboxed workspace. Path is relative (e.g. 'drafts/post1.md'). Creates or overwrites.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path for the file" },
      content: { type: "string", description: "File content" },
    },
    required: ["path", "content"],
  },
  async execute(input, context) {
    if (!context.agentId || !context.orgId) {
      return { content: "Agent and org context required.", error: true };
    }
    const path = sanitizePath(input.path);
    if (!path) {
      return { content: "Invalid path (no '..' or absolute paths).", error: true };
    }
    const content = String(input.content).slice(0, 500000);
    try {
      await prisma.agentFile.upsert({
        where: { agent_id_path: { agent_id: context.agentId, path } },
        create: { agent_id: context.agentId, org_id: context.orgId, path, content },
        update: { content },
      });
      return { content: `Wrote ${path}.` };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to write file"}`,
        error: true,
      };
    }
  },
};
