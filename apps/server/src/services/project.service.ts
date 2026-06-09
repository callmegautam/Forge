import { db } from "@forge/db";
import { project } from "@forge/db/schema/project";
import { domain } from "@forge/db/schema/domains";
import { extractRepoName } from "../helpers/domain.helper";
import { findUniqueDomain } from "../db/projects.db";

export async function createProject(
  userId: string,
  input: {
    repoUrl: string;
    branch?: string;
    framework?: string;
  },
) {
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
      throw new Error("Failed to create project");
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
      throw new Error("Failed to create domain");
    }

    return { project: newProject, domain: newDomain };
  });
}
