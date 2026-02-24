/**
 * MCP server configuration from environment.
 * Set MCP_SERVERS to a JSON array of { name, url, authorization_token? }.
 * Example: MCP_SERVERS='[{"name":"fetch","url":"https://mcp.example.com/sse"}]'
 */
export interface McpServerConfig {
  name: string;
  url: string;
  authorization_token?: string;
}

export function getMcpServersFromEnv(): McpServerConfig[] {
  const raw = process.env.MCP_SERVERS;
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is McpServerConfig =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as McpServerConfig).name === "string" &&
        typeof (s as McpServerConfig).url === "string" &&
        (s as McpServerConfig).url.startsWith("https://")
    );
  } catch {
    return [];
  }
}

export function getMcpToolsConfig(servers: McpServerConfig[]): Array<{ type: "mcp_toolset"; mcp_server_name: string }> {
  return servers.map((s) => ({
    type: "mcp_toolset" as const,
    mcp_server_name: s.name,
  }));
}
