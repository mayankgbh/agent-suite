import type { Tool } from "./types";

interface WebSearchInput {
  query: string;
  max_results?: number;
}

export const webSearchTool: Tool<WebSearchInput> = {
  name: "web_search",
  description:
    "Search the web for current information. Use when you need to research topics, find recent news, or look up facts. Requires TAVILY_API_KEY or SERPER_API_KEY.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      max_results: { type: "number", description: "Max results to return (default 5)" },
    },
    required: ["query"],
  },
  async execute(input) {
    const maxResults = Math.min(input.max_results ?? 5, 10);
    const tavilyKey = process.env.TAVILY_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;

    if (tavilyKey) {
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: input.query,
            max_results: maxResults,
            include_answer: true,
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          return { content: `Tavily error: ${res.status} ${t}`, error: true };
        }
        const data = (await res.json()) as {
          answer?: string;
          results?: Array<{ title: string; url: string; content: string }>;
        };
        const parts: string[] = [];
        if (data.answer) parts.push(`Answer: ${data.answer}`);
        if (data.results?.length) {
          parts.push(
            ...data.results.map(
              (r) => `[${r.title}](${r.url})\n${r.content?.slice(0, 300) ?? ""}`
            )
          );
        }
        return { content: parts.join("\n\n") || "No results." };
      } catch (e) {
        return {
          content: `Error: ${e instanceof Error ? e.message : "Web search failed"}`,
          error: true,
        };
      }
    }

    if (serperKey) {
      try {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
          body: JSON.stringify({ q: input.query, num: maxResults }),
        });
        if (!res.ok) {
          const t = await res.text();
          return { content: `Serper error: ${res.status} ${t}`, error: true };
        }
        const data = (await res.json()) as {
          organic?: Array<{ title: string; link: string; snippet: string }>;
        };
        const results = data.organic ?? [];
        const content = results
          .map((r) => `[${r.title}](${r.link})\n${r.snippet}`)
          .join("\n\n");
        return { content: content || "No results." };
      } catch (e) {
        return {
          content: `Error: ${e instanceof Error ? e.message : "Web search failed"}`,
          error: true,
        };
      }
    }

    return {
      content:
        "Web search not configured. Set TAVILY_API_KEY or SERPER_API_KEY in environment to enable.",
      error: true,
    };
  },
};
