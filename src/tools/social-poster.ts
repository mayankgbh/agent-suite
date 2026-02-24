import type { Tool } from "./types";

interface SocialPosterInput {
  platform: string;
  content: string;
  draft_only?: boolean;
}

export const socialPosterTool: Tool<SocialPosterInput> = {
  name: "social_poster",
  description:
    "Draft or post to social (LinkedIn, Twitter/X). Use for thought leadership or campaign content. Without API keys this saves a draft and returns instructions.",
  inputSchema: {
    type: "object",
    properties: {
      platform: { type: "string", description: "Platform: linkedin, twitter" },
      content: { type: "string", description: "Post text (and optional link)" },
      draft_only: { type: "boolean", description: "If true, only save as draft" },
    },
    required: ["platform", "content"],
  },
  async execute(input) {
    const hasTwitter = Boolean(process.env.TWITTER_BEARER_TOKEN || process.env.TWITTER_API_KEY);
    const hasLinkedIn = Boolean(process.env.LINKEDIN_ACCESS_TOKEN);
    if (input.draft_only || (!hasTwitter && !hasLinkedIn)) {
      const instructions =
        !hasTwitter && !hasLinkedIn
          ? " Set TWITTER_* or LINKEDIN_ACCESS_TOKEN to enable posting. Use content_generator to refine; user can post manually."
          : "";
      return {
        content: `[Draft for ${input.platform}]\n\n${input.content.slice(0, 2000)}\n\n---\nSave this draft or post manually.${instructions}`,
      };
    }
    if (input.platform.toLowerCase() === "twitter" && hasTwitter) {
      try {
        const res = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          },
          body: JSON.stringify({ text: input.content.slice(0, 280) }),
        });
        if (!res.ok) {
          const t = await res.text();
          return { content: `Twitter API error: ${res.status} ${t}`, error: true };
        }
        const data = (await res.json()) as { data?: { id: string } };
        return { content: `Posted to Twitter. Tweet ID: ${data.data?.id ?? "ok"}.` };
      } catch (e) {
        return {
          content: `Error: ${e instanceof Error ? e.message : "Twitter post failed"}`,
          error: true,
        };
      }
    }
    if (input.platform.toLowerCase() === "linkedin" && hasLinkedIn) {
      try {
        const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            author: `urn:li:person:${process.env.LINKEDIN_PERSON_URN ?? "me"}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: input.content.slice(0, 3000) },
                shareMediaCategory: "NONE",
              },
            },
            visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          return { content: `LinkedIn API error: ${res.status} ${t}`, error: true };
        }
        return { content: "Posted to LinkedIn." };
      } catch (e) {
        return {
          content: `Error: ${e instanceof Error ? e.message : "LinkedIn post failed"}`,
          error: true,
        };
      }
    }
    return {
      content: `[Draft for ${input.platform}]\n\n${input.content.slice(0, 2000)}\n\nPost manually or set API keys.`,
    };
  },
};
