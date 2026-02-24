import type { Tool } from "./types";

interface GitHubListIssuesInput {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  limit?: number;
}

interface GitHubCreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
}

export const githubListIssuesTool: Tool<GitHubListIssuesInput> = {
  name: "github_list_issues",
  description:
    "List GitHub issues for a repo. Use to see open work, bugs, or feature requests. Requires GITHUB_TOKEN.",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "Repo owner (org or user)" },
      repo: { type: "string", description: "Repo name" },
      state: { type: "string", description: "open, closed, or all" },
      limit: { type: "number", description: "Max issues to return (default 10)" },
    },
    required: ["owner", "repo"],
  },
  async execute(input) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return {
        content: "Set GITHUB_TOKEN to list issues. Or use a GitHub MCP server.",
        error: true,
      };
    }
    const state = (input.state ?? "open") as string;
    const limit = Math.min(input.limit ?? 10, 30);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${input.owner}/${input.repo}/issues?state=${state}&per_page=${limit}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" } }
      );
      if (!res.ok) {
        const t = await res.text();
        return { content: `GitHub API ${res.status}: ${t}`, error: true };
      }
      const data = (await res.json()) as Array<{ number: number; title: string; state: string; html_url: string }>;
      const lines = data.map((i) => `#${i.number} [${i.title}](${i.html_url}) (${i.state})`);
      return { content: lines.length ? lines.join("\n") : "No issues found." };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "GitHub request failed"}`,
        error: true,
      };
    }
  },
};

export const githubCreateIssueTool: Tool<GitHubCreateIssueInput> = {
  name: "github_create_issue",
  description:
    "Create a GitHub issue. Use to log bugs, feature requests, or tasks. Requires GITHUB_TOKEN.",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "Repo owner" },
      repo: { type: "string", description: "Repo name" },
      title: { type: "string", description: "Issue title" },
      body: { type: "string", description: "Issue body (markdown)" },
      labels: { type: "object", description: "Array of label names" },
    },
    required: ["owner", "repo", "title"],
  },
  async execute(input) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return {
        content: "Set GITHUB_TOKEN to create issues. Or use a GitHub MCP server.",
        error: true,
      };
    }
    try {
      const res = await fetch(
        `https://api.github.com/repos/${input.owner}/${input.repo}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: input.title,
            body: input.body ?? "",
            labels: Array.isArray(input.labels) ? input.labels : undefined,
          }),
        }
      );
      if (!res.ok) {
        const t = await res.text();
        return { content: `GitHub API ${res.status}: ${t}`, error: true };
      }
      const data = (await res.json()) as { number: number; html_url: string };
      return { content: `Created issue #${data.number}: ${data.html_url}` };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "GitHub request failed"}`,
        error: true,
      };
    }
  },
};
