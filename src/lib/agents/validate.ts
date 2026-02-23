import { z } from "zod";

export const createAgentBodySchema = z.object({
  agent_type: z.enum(["marketing", "sales", "engineering", "finance"]),
  display_name: z.string().min(1).max(255).optional(),
});

export type CreateAgentBody = z.infer<typeof createAgentBodySchema>;

export const updateAgentBodySchema = z.object({
  display_name: z.string().min(1).max(255).optional(),
  status: z.enum(["onboarding", "active", "paused", "archived"]).optional(),
  personality_config: z.record(z.string(), z.unknown()).nullable().optional(),
  system_prompt_override: z.string().max(10000).nullable().optional(),
});

export type UpdateAgentBody = z.infer<typeof updateAgentBodySchema>;
