import type { Tool } from "./types";

interface EmailSenderInput {
  to: string;
  subject: string;
  body: string;
}

export const emailSenderTool: Tool<EmailSenderInput> = {
  name: "email_sender",
  description:
    "Send an email to a recipient. Use for outreach, follow-ups, or notifications. Requires RESEND_API_KEY (and optionally FROM_EMAIL) to be set.",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient email address" },
      subject: { type: "string", description: "Email subject line" },
      body: { type: "string", description: "Plain text or HTML body of the email" },
    },
    required: ["to", "subject", "body"],
  },
  async execute(input) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return {
        content:
          "Email integration not configured. Set RESEND_API_KEY (and optionally FROM_EMAIL) in environment to enable sending email.",
        error: true,
      };
    }
    const from = process.env.FROM_EMAIL ?? "Agent Suite <onboarding@resend.dev>";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          html: input.body.replace(/\n/g, "<br>"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          content: `Email error: ${res.status} ${(data as { message?: string }).message ?? JSON.stringify(data)}`,
          error: true,
        };
      }
      return { content: `Email sent to ${input.to}.` };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Failed to send email"}`,
        error: true,
      };
    }
  },
};
