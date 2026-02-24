import Anthropic from "@anthropic-ai/sdk";
import {
  getToolDefinitionsForClaude,
  executeTool,
} from "@/tools/registry";
import {
  getMcpServersFromEnv,
  getMcpToolsConfig,
} from "@/lib/mcp/config";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

export interface RunTurnInput {
  systemPrompt: string;
  messages: ConversationMessage[];
  allowedTools?: string[];
  maxTokens?: number;
  model?: string;
  agentId?: string;
  orgId?: string;
}

export interface RunTurnResult {
  content: string;
  stopReason: string;
  usage?: { inputTokens: number; outputTokens: number };
}

function isToolUseBlock(block: { type: string }): block is ToolUseBlock {
  return block.type === "tool_use";
}

/**
 * Run one conversation turn with optional tool use. If the model requests tools,
 * executes them and continues until a final text response.
 * Framework-agnostic.
 */
export async function runConversationTurn(input: RunTurnInput): Promise<RunTurnResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const anthropic = new Anthropic({ apiKey });

  const allowedTools = input.allowedTools ?? [];
  const nativeToolDefs =
    allowedTools.length > 0
      ? getToolDefinitionsForClaude(allowedTools).map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        }))
      : [];

  const mcpServers = getMcpServersFromEnv();
  const mcpToolsConfig = getMcpToolsConfig(mcpServers);
  const useMcp = mcpServers.length > 0 && mcpToolsConfig.length > 0;
  const tools =
    nativeToolDefs.length > 0 || useMcp
      ? ([...nativeToolDefs, ...mcpToolsConfig] as Parameters<typeof anthropic.messages.create>[0]["tools"])
      : undefined;

  const context = { agentId: input.agentId, orgId: input.orgId };

  const anthropicMessages = input.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let currentMessages: Array<{ role: "user" | "assistant"; content: string | unknown[] }> = [
    ...anthropicMessages,
  ];
  type MessageResponse = {
    content?: Array<{ type: string; text?: string }>;
    stop_reason?: string | null;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  let lastResponse: MessageResponse = { content: [], stop_reason: null };
  const maxToolRounds = 5;
  let round = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const model = input.model ?? "claude-sonnet-4-20250514";

  while (round < maxToolRounds) {
    const baseParams = {
      model,
      max_tokens: input.maxTokens ?? 4096,
      system: input.systemPrompt,
      messages: currentMessages as Array<{ role: "user" | "assistant"; content: string | unknown[] }>,
      ...(tools && tools.length > 0 ? { tools } : {}),
    };

    const raw = useMcp
      ? await (anthropic as { beta: { messages: { create: (p: typeof baseParams & { mcp_servers: unknown[]; betas: string[] }) => Promise<MessageResponse> } } }).beta.messages.create({
          ...baseParams,
          mcp_servers: mcpServers.map((s) => ({
            type: "url" as const,
            url: s.url,
            name: s.name,
            ...(s.authorization_token && { authorization_token: s.authorization_token }),
          })),
          betas: ["mcp-client-2025-11-20"],
        })
      : await anthropic.messages.create(baseParams as Parameters<typeof anthropic.messages.create>[0]);
    const response = raw && typeof raw === "object" && "content" in raw ? (raw as MessageResponse) : lastResponse;
    lastResponse = response;
    if (response.usage) {
      totalInputTokens += response.usage.input_tokens ?? 0;
      totalOutputTokens += response.usage.output_tokens ?? 0;
    }

    const contentBlocks = (lastResponse.content ?? []) as Array<{ type: string; id?: string; name?: string; input?: unknown; text?: string }>;
    const toolUseBlocks = contentBlocks.filter(isToolUseBlock);
    if (toolUseBlocks.length === 0) {
      const textBlock = contentBlocks.find((b) => b.type === "text");
      const content = textBlock && "text" in textBlock ? textBlock.text ?? "" : "";
      return {
        content,
        stopReason: lastResponse.stop_reason ?? "end_turn",
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
      };
    }

    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }> = [];
    for (const block of toolUseBlocks) {
      const result = await executeTool(block.name, block.input, context);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result.content,
        is_error: result.error ?? false,
      });
    }

    currentMessages = [
      ...currentMessages,
      { role: "assistant" as const, content: lastResponse.content ?? [] },
      { role: "user" as const, content: toolResults },
    ];
    round++;
  }

  const contentBlocks = (lastResponse.content ?? []) as Array<{ type: string; text?: string }>;
  const textBlock = contentBlocks.find((b) => b.type === "text");
  const content = textBlock && "text" in textBlock ? textBlock.text ?? "" : "";
  return {
    content,
    stopReason: lastResponse.stop_reason ?? "end_turn",
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
  };
}
