import type { Tool } from "./types";

interface WebScraperInput {
  url: string;
}

export const webScraperTool: Tool<WebScraperInput> = {
  name: "web_scraper",
  description:
    "Fetch and extract main text content from a URL. Use when you need to research a website or get current content from a page.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Full URL to fetch (e.g. https://example.com)" },
    },
    required: ["url"],
  },
  async execute(input) {
    try {
      const res = await fetch(input.url, {
        headers: { "User-Agent": "AgentSuite/1.0" },
      });
      if (!res.ok) {
        return { content: `Error: HTTP ${res.status}`, error: true };
      }
      const html = await res.text();
      const text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
      return { content: text || "(No text content extracted)" };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to fetch"}`,
        error: true,
      };
    }
  },
};
