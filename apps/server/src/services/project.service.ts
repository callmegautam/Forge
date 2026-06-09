import { db } from "@forge/db";
import { project } from "@forge/db/schema/project";
import { domain } from "@forge/db/schema/domains";
import { eq } from "drizzle-orm";
import { extractRepoName } from "../helpers/domain.helper";
import {
  generateDomainSlug,
  generateRandomSuffix,
  makeUniqueDomainCandidate,
} from "../helpers/domain.helper";

export async function repoExists(repoUrl: string): Promise<boolean> {
  const existing = await db.query.project.findFirst({
    where: eq(project.repoUrl, repoUrl),
  });
  return !!existing;
}

export async function domainExists(domainName: string): Promise<boolean> {
  const existing = await db.query.domain.findFirst({
    where: eq(domain.domain, domainName),
  });
  return !!existing;
}

export async function findUniqueDomain(baseSlug: string): Promise<string> {
  let candidate = baseSlug;

  while (await domainExists(candidate)) {
    candidate = makeUniqueDomainCandidate(baseSlug, generateRandomSuffix());
  }

  return candidate;
}

export async function createProjectService(
  userId: string,
  input: {
    repoUrl: string;
    branch?: string;
    framework?: string;
  },
) {
  return db.transaction(async (tx) => {
    const name = extractRepoName(input.repoUrl);

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

    const baseSlug = generateDomainSlug(input.repoUrl);
    const uniqueDomain = await findUniqueDomain(baseSlug);

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
