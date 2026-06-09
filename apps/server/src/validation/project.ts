import { z } from "zod";

export const createProjectSchema = z.object({
  repoUrl: z.string().url("Invalid repository URL"),
  branch: z.string().min(1).max(255).optional(),
  framework: z.string().min(1).max(100).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  repoUrl: z.string().url("Invalid repository URL").optional(),
  branch: z.string().min(1).max(255).optional(),
  framework: z.string().min(1).max(100).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
});

export const projectParamsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectParams = z.infer<typeof projectParamsSchema>;
