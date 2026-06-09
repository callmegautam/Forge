import { z } from "zod";

export const createDeploymentSchema = z.object({
  branch: z.string().min(1).max(255).optional(),
});

export const webhookDeploymentSchema = z.object({
  commitHash: z.string().length(40).optional(),
  commitMessage: z.string().max(500).optional(),
  branch: z.string().min(1).max(255).optional(),
});

export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;
export type WebhookDeploymentInput = z.infer<typeof webhookDeploymentSchema>;
