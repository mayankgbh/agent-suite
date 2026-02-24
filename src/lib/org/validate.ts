import { z } from "zod";

export const updateOrgBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  website_url: z
    .string()
    .optional()
    .nullable()
    .transform((s) => {
      const t = (s ?? "").trim();
      if (!t) return null;
      if (/^https?:\/\//i.test(t)) return t;
      return `https://${t}`;
    })
    .pipe(z.union([z.string().url(), z.null()])),
  industry: z.string().max(255).nullable().optional(),
  company_size: z.string().max(100).nullable().optional(),
  icp_description: z.string().max(5000).nullable().optional(),
  business_context: z.record(z.string(), z.unknown()).nullable().optional(),
  onboarding_status: z.enum(["pending", "in_progress", "complete"]).optional(),
});

export type UpdateOrgBody = z.infer<typeof updateOrgBodySchema>;
