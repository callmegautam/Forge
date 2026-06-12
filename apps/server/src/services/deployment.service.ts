import { findProjectById } from "../db/projects.db";
import { findDeploymentById, createDeployment } from "../db/deployments.db";
import { AppError } from "../utils/errors";
import { deploymentQueue } from "@forge/queue";

export async function redeployProject(
  userId: string,
  projectId: string,
  branch?: string,
) {
  const project = await findProjectById(projectId);
  if (!project) throw new AppError("Project not found", 404);
  if (project.userId !== userId) throw new AppError("Forbidden", 403);

  const dep = await createDeployment({
    projectId,
    branch: branch ?? project.branch,
    triggeredBy: "manual",
  });
  if (!dep) throw new AppError("Failed to create deployment", 500);
  if (!project.repoUrl) throw new AppError("Project has no repository URL", 400);

  await deploymentQueue.add("deploy", {
    deploymentId: dep.id,
    projectId: dep.projectId,
    repoUrl: project.repoUrl,
    branch: dep.branch ?? project.branch,
  });

  return dep;
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

  const dep = await createDeployment({
    projectId,
    branch: data.branch ?? project.branch,
    triggeredBy: "webhook",
    commitHash: data.commitHash,
    commitMessage: data.commitMessage,
  });
  if (!dep) throw new AppError("Failed to create deployment", 500);
  if (!project.repoUrl) throw new AppError("Project has no repository URL", 400);

  await deploymentQueue.add("deploy", {
    deploymentId: dep.id,
    projectId: dep.projectId,
    repoUrl: project.repoUrl,
    branch: dep.branch ?? project.branch,
  });

  return dep;
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
