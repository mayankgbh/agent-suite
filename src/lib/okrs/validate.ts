import { z } from "zod";

export const keyResultSchema = z.object({
  description: z.string(),
  metric: z.string().optional(),
  target: z.union([z.string(), z.number()]).optional(),
  current: z.union([z.string(), z.number()]).optional(),
  unit: z.string().optional(),
});

export const createOKRBodySchema = z.object({
  objective: z.string().min(1).max(2000),
  key_results: z.array(keyResultSchema).min(1).max(10),
  time_horizon: z.enum(["weekly", "monthly", "quarterly"]).optional(),
  due_date: z.string().datetime().optional().or(z.string().refine((s) => !isNaN(Date.parse(s)))),
});

export type CreateOKRBody = z.infer<typeof createOKRBodySchema>;

export const updateOKRBodySchema = z.object({
  objective: z.string().min(1).max(2000).optional(),
  key_results: z.array(keyResultSchema).min(1).max(10).optional(),
  status: z.enum(["proposed", "negotiating", "accepted", "in_progress", "completed", "failed"]).optional(),
  time_horizon: z.enum(["weekly", "monthly", "quarterly"]).nullable().optional(),
  due_date: z.string().nullable().optional(),
});

export type UpdateOKRBody = z.infer<typeof updateOKRBodySchema>;
