import type { Tool } from "./types";

interface SlackNotifierInput {
  message: string;
  channel?: string;
}

export const slackNotifierTool: Tool<SlackNotifierInput> = {
  name: "slack_notifier",
  description:
    "Send a message to a Slack channel via webhook. Use when you need to notify the team, post updates, or share a summary. Requires SLACK_WEBHOOK_URL to be set.",
  inputSchema: {
    type: "object",
    properties: {
      message: { type: "string", description: "The message text to send to Slack" },
      channel: { type: "string", description: "Optional channel name (if webhook is not channel-specific)" },
    },
    required: ["message"],
  },
  async execute(input) {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) {
      return {
        content:
          "Slack integration not configured. Set SLACK_WEBHOOK_URL in environment to enable posting to Slack.",
        error: true,
      };
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.message.slice(0, 4000),
          ...(input.channel && { channel: input.channel }),
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { content: `Slack error: ${res.status} ${body}`, error: true };
      }
      return { content: "Message sent to Slack." };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to send to Slack"}`,
        error: true,
      };
    }
  },
};
