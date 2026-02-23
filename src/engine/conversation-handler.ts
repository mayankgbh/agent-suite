import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./context-builder";
import {
  getToolDefinitionsForClaude,
  executeTool,
} from "@/tools/registry";

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
  agentId?: string;
  orgId?: string;
}

export interface RunTurnResult {
  content: string;
  stopReason: string;
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
  const tools = allowedTools.length > 0
    ? getToolDefinitionsForClaude(allowedTools).map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      }))
    : undefined;

  const context = { agentId: input.agentId, orgId: input.orgId };

  const anthropicMessages = input.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let currentMessages: Array<{ role: "user" | "assistant"; content: string | unknown[] }> = [
    ...anthropicMessages,
  ];
  let lastResponse: { content?: Array<{ type: string; text?: string }>; stop_reason?: string | null } = {
    content: [],
    stop_reason: null,
  };
  const maxToolRounds = 5;
  let round = 0;

  while (round < maxToolRounds) {
    const createParams = {
      model: "claude-sonnet-4-20250514" as const,
      max_tokens: input.maxTokens ?? 4096,
      system: input.systemPrompt,
      messages: currentMessages as Parameters<typeof anthropic.messages.create>[0]["messages"],
      ...(tools && tools.length > 0 ? { tools } : {}),
    };

    const response = await anthropic.messages.create(createParams);
    lastResponse = response;

    const contentBlocks = (response.content ?? []) as Array<{ type: string; id?: string; name?: string; input?: unknown; text?: string }>;
    const toolUseBlocks = contentBlocks.filter(isToolUseBlock);
    if (toolUseBlocks.length === 0) {
      const textBlock = contentBlocks.find((b) => b.type === "text");
      const content = textBlock && "text" in textBlock ? textBlock.text ?? "" : "";
      return {
        content,
        stopReason: response.stop_reason ?? "end_turn",
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
      { role: "assistant" as const, content: response.content ?? [] },
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
  };
}
