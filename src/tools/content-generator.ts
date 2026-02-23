import type { Tool } from "./types";

interface ContentInput {
  topic: string;
  format?: string;
  length?: string;
}

export const contentGeneratorTool: Tool<ContentInput> = {
  name: "content_generator",
  description:
    "Generate marketing content (blog outline, social post, email draft) on a given topic. Use when the user or OKR requires content creation.",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Topic or headline for the content" },
      format: {
        type: "string",
        description: "Format: blog_outline, social_post, email_draft",
      },
      length: { type: "string", description: "Rough length: short, medium, long" },
    },
    required: ["topic"],
  },
  async execute(input) {
    const format = input.format ?? "blog_outline";
    const length = input.length ?? "medium";
    return {
      content: `[Generated ${format} – ${length}]\n\nTopic: ${input.topic}\n\n(Content generation would be implemented with an LLM or template in production. This is a placeholder result.)`,
    };
  },
};
