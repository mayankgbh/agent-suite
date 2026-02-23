/**
 * Simple website scraper for Phase 1. Fetches URL and extracts text from HTML.
 * Replace with Firecrawl or similar in production.
 */

export async function scrapeWebsite(url: string): Promise<{ content: string; title?: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AgentSuite/1.0 (Company context enrichment)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  const html = await res.text();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const text = stripHtml(html);
  return { content: text.slice(0, 50000), title };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
