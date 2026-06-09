import { db } from "@forge/db";
import { deployment } from "@forge/db/schema/deployments";
import { findProjectById } from "../db/projects.db";
import { AppError } from "../utils/errors";

export async function redeployProject(
  userId: string,
  projectId: string,
  branch?: string,
) {
  const project = await findProjectById(projectId);
  if (!project) throw new AppError("Project not found", 404);
  if (project.userId !== userId) throw new AppError("Forbidden", 403);

  const [newDeployment] = await db
    .insert(deployment)
    .values({
      id: crypto.randomUUID(),
      projectId,
      status: "queued",
      branch: branch ?? project.branch,
      triggeredBy: "manual",
    })
    .returning();

  return newDeployment;
}

export async function webhookDeploy(
  userId: string,
  projectId: string,
  data: {
    branch?: string;
    commitHash?: string;
    commitMessage?: string;
  },
) {
  const project = await findProjectById(projectId);
  if (!project) throw new AppError("Project not found", 404);
  if (project.userId !== userId) throw new AppError("Forbidden", 403);

  const [newDeployment] = await db
    .insert(deployment)
    .values({
      id: crypto.randomUUID(),
      projectId,
      status: "queued",
      branch: data.branch ?? project.branch,
      commitHash: data.commitHash ?? null,
      commitMessage: data.commitMessage ?? null,
      triggeredBy: "webhook",
    })
    .returning();

  return newDeployment;
}
