import { z } from "zod";

export const createDeploymentSchema = z.object({
  branch: z.string().min(1).max(255).optional(),
});

export const webhookDeploymentSchema = z.object({
  commitHash: z.string().length(40).optional(),
  commitMessage: z.string().max(500).optional(),
  branch: z.string().min(1).max(255).optional(),
});

export const deploymentParamsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  deploymentId: z.string().uuid("Invalid deployment ID"),
});

export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;
export type WebhookDeploymentInput = z.infer<typeof webhookDeploymentSchema>;
export type DeploymentParams = z.infer<typeof deploymentParamsSchema>;
