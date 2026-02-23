import { z } from "zod";

export const sendMessageBodySchema = z.object({
  content: z.string().min(1).max(50000),
  message_type: z
    .enum([
      "onboarding_question",
      "okr_negotiation",
      "status_update",
      "daily_report",
      "question",
      "answer",
      "deliverable",
    ])
    .optional()
    .default("question"),
});

export type SendMessageBody = z.infer<typeof sendMessageBodySchema>;
