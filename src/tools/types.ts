export interface ToolResult {
  content: string;
  error?: boolean;
}

export interface Tool<T = unknown> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
  execute: (input: T, context: { agentId?: string; orgId?: string }) => Promise<ToolResult>;
}

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
};
