import type { Request, Response} from "express";
import { createProjectSchema } from "../validation/project";
import { repoExists, createProjectService } from "../services/project.service";

export const createProject = async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      issues: parsed.error.issues,
    });
    return;
  }

  const { repoUrl, branch, framework } = parsed.data;

  const exists = await repoExists(repoUrl);
  if (exists) {
    res.status(409).json({ error: "Repository already exists" });
    return;
  }

  const result = await createProjectService(req.userId!, {
    repoUrl,
    branch,
    framework,
  });

  res.status(201).json(result);
};
