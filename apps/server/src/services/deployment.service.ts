import { findProjectById } from "../db/projects.db";
import { findDeploymentById, createDeployment } from "../db/deployments.db";
import { AppError } from "../utils/errors";

export async function redeployProject(
  userId: string,
  projectId: string,
  branch?: string,
) {
  const project = await findProjectById(projectId);
  if (!project) throw new AppError("Project not found", 404);
  if (project.userId !== userId) throw new AppError("Forbidden", 403);

  return createDeployment({
    projectId,
    branch: branch ?? project.branch,
    triggeredBy: "manual",
  });
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

  return createDeployment({
    projectId,
    branch: data.branch ?? project.branch,
    triggeredBy: "webhook",
    commitHash: data.commitHash,
    commitMessage: data.commitMessage,
  });
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
