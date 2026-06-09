import { z } from "zod";

export const createProjectSchema = z.object({
  repoUrl: z.string().url("Invalid repository URL"),
  branch: z.string().min(1).max(255).optional(),
  framework: z.string().min(1).max(100).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
