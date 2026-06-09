import { db } from "@forge/db";
import { project } from "@forge/db/schema/project";
import { domain } from "@forge/db/schema/domains";
import { deployment } from "@forge/db/schema/deployments";
import { extractRepoName } from "../utils/domain.util";
import {
  findProjectByRepoUrl,
  findProjectById,
  findProjectsByUserId,
  updateProjectById,
  deleteProjectById,
} from "../db/projects.db";
import { findUniqueDomain } from "../db/domain.db";
import { AppError } from "../utils/errors";

export async function createProject(
  userId: string,
  input: {
    repoUrl: string;
    branch?: string;
    framework?: string;
  },
) {
  const existing = await findProjectByRepoUrl(input.repoUrl);
  if (existing) {
    throw new AppError("Repository already exists", 409);
  }

  const name = extractRepoName(input.repoUrl);
  const baseSlug = extractRepoName(input.repoUrl);
  const uniqueDomain = await findUniqueDomain(baseSlug);

  return db.transaction(async (tx) => {
    const [newProject] = await tx
      .insert(project)
      .values({
        id: crypto.randomUUID(),
        userId,
        name,
        repoUrl: input.repoUrl,
        branch: input.branch ?? "main",
        framework: input.framework ?? null,
      })
      .returning();

    if (!newProject) {
      throw new AppError("Failed to create project", 500);
    }

    const [newDomain] = await tx
      .insert(domain)
      .values({
        id: crypto.randomUUID(),
        projectId: newProject.id,
        domain: uniqueDomain,
        isPrimary: true,
        verified: false,
      })
      .returning();

    if (!newDomain) {
      throw new AppError("Failed to create domain", 500);
    }

    const [newDeployment] = await tx
      .insert(deployment)
      .values({
        id: crypto.randomUUID(),
        projectId: newProject.id,
        status: "queued",
        branch: input.branch ?? "main",
        triggeredBy: "manual",
      })
      .returning();

    if (!newDeployment) {
      throw new AppError("Failed to create deployment", 500);
    }

    return { project: newProject, domain: newDomain, deployment: newDeployment };
  });
}

export async function getProject(id: string, userId: string) {
  const result = await findProjectById(id);
  if (!result) {
    throw new AppError("Project not found", 404);
  }
  if (result.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }
  return result;
}

export async function listUserProjects(userId: string) {
  return findProjectsByUserId(userId);
}

export async function updateProject(
  id: string,
  userId: string,
  data: {
    name?: string;
    repoUrl?: string;
    branch?: string;
    framework?: string;
    status?: "active" | "inactive" | "archived";
  },
) {
  const existing = await findProjectById(id);
  if (!existing) {
    throw new AppError("Project not found", 404);
  }
  if (existing.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  if (data.repoUrl) {
    const duplicate = await findProjectByRepoUrl(data.repoUrl);
    if (duplicate && duplicate.id !== id) {
      throw new AppError("Repository URL already in use", 409);
    }
  }

  const updated = await updateProjectById(id, data);
  return updated;
}

export async function deleteProject(id: string, userId: string) {
  const existing = await findProjectById(id);
  if (!existing) {
    throw new AppError("Project not found", 404);
  }
  if (existing.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  const deleted = await deleteProjectById(id);
  return deleted;
}
