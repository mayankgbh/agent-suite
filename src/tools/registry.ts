import type { Tool, ToolDefinition } from "./types";
import { contentGeneratorTool } from "./content-generator";
import { webScraperTool } from "./web-scraper";
import { webSearchTool } from "./web-search";
import { slackNotifierTool } from "./slack-notifier";
import { emailSenderTool } from "./email-sender";
import { memoryStoreTool, memoryGetTool } from "./agent-memory";
import { readFileTool, writeFileTool } from "./agent-file";
import { seoAnalyzerTool } from "./seo-analyzer";
import { analyticsReaderTool } from "./analytics-reader";
import { metricsRecordTool } from "./metrics-record";
import { socialPosterTool } from "./social-poster";
import { googleSheetsTool } from "./google-sheets";
import { githubListIssuesTool, githubCreateIssueTool } from "./github";
import { currencyConvertTool } from "./currency-convert";
import { calendarTool } from "./calendar";
import { crmLookupTool } from "./crm-lookup";
import { postCoordinationMessageTool } from "./coordination-message";

const tools: Tool<unknown>[] = [
  contentGeneratorTool as Tool<unknown>,
  webScraperTool as Tool<unknown>,
  webSearchTool as Tool<unknown>,
  slackNotifierTool as Tool<unknown>,
  emailSenderTool as Tool<unknown>,
  memoryStoreTool as Tool<unknown>,
  memoryGetTool as Tool<unknown>,
  readFileTool as Tool<unknown>,
  writeFileTool as Tool<unknown>,
  seoAnalyzerTool as Tool<unknown>,
  analyticsReaderTool as Tool<unknown>,
  metricsRecordTool as Tool<unknown>,
  socialPosterTool as Tool<unknown>,
  googleSheetsTool as Tool<unknown>,
  githubListIssuesTool as Tool<unknown>,
  githubCreateIssueTool as Tool<unknown>,
  currencyConvertTool as Tool<unknown>,
  calendarTool as Tool<unknown>,
  crmLookupTool as Tool<unknown>,
  postCoordinationMessageTool as Tool<unknown>,
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
