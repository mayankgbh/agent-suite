import { z } from "zod";

export const createTaskBodySchema = z.object({
  okr_id: z.string().uuid().optional().nullable(),
  parent_task_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

export const updateTaskBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(["planned", "in_progress", "blocked", "completed", "failed"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  output: z.record(z.string(), z.unknown()).nullable().optional(),
  tools_used: z.array(z.string()).optional(),
});

export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
