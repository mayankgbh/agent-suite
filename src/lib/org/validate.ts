import { z } from "zod";

export const updateOrgBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  website_url: z.string().url().nullable().optional(),
  industry: z.string().max(255).nullable().optional(),
  company_size: z.string().max(100).nullable().optional(),
  icp_description: z.string().max(5000).nullable().optional(),
  business_context: z.record(z.string(), z.unknown()).nullable().optional(),
  onboarding_status: z.enum(["pending", "in_progress", "complete"]).optional(),
});

export type UpdateOrgBody = z.infer<typeof updateOrgBodySchema>;
