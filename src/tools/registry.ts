import type { Tool, ToolDefinition } from "./types";
import { contentGeneratorTool } from "./content-generator";
import { webScraperTool } from "./web-scraper";

const tools: Tool<unknown>[] = [
  contentGeneratorTool as Tool<unknown>,
  webScraperTool as Tool<unknown>,
];
const byName = new Map(tools.map((t) => [t.name, t]));

export function getTool(name: string): Tool | undefined {
  return byName.get(name);
}

export function getToolsForAgent(allowedToolNames: string[]): Tool[] {
  return allowedToolNames
    .map((name) => byName.get(name))
    .filter((t): t is Tool => Boolean(t));
}

export function getToolDefinitionsForClaude(allowedToolNames: string[]): ToolDefinition[] {
  return getToolsForAgent(allowedToolNames).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));
}

export async function executeTool(
  name: string,
  input: unknown,
  context: { agentId?: string; orgId?: string }
): Promise<{ content: string; error?: boolean }> {
  const tool = byName.get(name);
  if (!tool) {
    return { content: `Unknown tool: ${name}`, error: true };
  }
  return tool.execute(input as never, context);
}
