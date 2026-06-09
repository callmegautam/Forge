import { db } from "@forge/db";
import { deployment } from "@forge/db/schema/deployments";
import { findProjectById } from "../db/projects.db";
import { findDeploymentById } from "../db/deployments.db";
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

export async function getDeployment(
  userId: string,
  projectId: string,
  deploymentId: string,
) {
  const project = await findProjectById(projectId);
  if (!project) throw new AppError("Project not found", 404);
  if (project.userId !== userId) throw new AppError("Forbidden", 403);

  const dep = await findDeploymentById(deploymentId);
  if (!dep || dep.projectId !== projectId) {
    throw new AppError("Deployment not found", 404);
  }

  return dep;
}
