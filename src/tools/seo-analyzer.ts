import type { Tool } from "./types";

interface SeoAnalyzerInput {
  url: string;
}

export const seoAnalyzerTool: Tool<SeoAnalyzerInput> = {
  name: "seo_analyzer",
  description:
    "Analyze a URL for basic SEO: title, meta description, headings, word count. Use when evaluating content or competitor pages.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Full URL to analyze" },
    },
    required: ["url"],
  },
  async execute(input) {
    try {
      const res = await fetch(input.url, {
        headers: { "User-Agent": "AgentSuite/1.0" },
      });
      if (!res.ok) {
        return { content: `HTTP ${res.status}`, error: true };
      }
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
        ?? html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
      const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) ?? [];
      const h2Matches = html.match(/<h2[^>]*>([^<]*)<\/h2>/gi) ?? [];
      const text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      const lines: string[] = [];
      lines.push(`Title: ${titleMatch?.[1]?.trim() ?? "(none)"}`);
      lines.push(`Meta description: ${metaDescMatch?.[1]?.trim()?.slice(0, 200) ?? "(none)"}`);
      lines.push(`H1 count: ${h1Matches.length}`);
      if (h1Matches.length > 0) {
        lines.push(`H1s: ${h1Matches.map((h) => h.replace(/<[^>]+>/g, "").trim()).join(" | ")}`);
      }
      lines.push(`H2 count: ${h2Matches.length}`);
      lines.push(`Word count (body): ${wordCount}`);
      return { content: lines.join("\n") };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "SEO analysis failed"}`,
        error: true,
      };
    }
  },
};
