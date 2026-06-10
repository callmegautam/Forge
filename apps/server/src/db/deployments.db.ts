import { db } from "@forge/db";
import { deployment } from "@forge/db/schema/deployments";
import { eq } from "drizzle-orm";

export async function findQueuedDeployments() {
  return db.query.deployment.findMany({
    where: eq(deployment.status, "queued"),
    with: { project: true },
  });
}

export async function findDeploymentById(id: string) {
  return db.query.deployment.findFirst({
    where: eq(deployment.id, id),
  });
}

export async function createDeployment(
  data: {
    projectId: string;
    branch: string;
    triggeredBy: "manual" | "webhook" | "rollback";
    commitHash?: string | null;
    commitMessage?: string | null;
  },
) {
  const [created] = await db
    .insert(deployment)
    .values({
      id: crypto.randomUUID(),
      projectId: data.projectId,
      status: "queued",
      branch: data.branch,
      triggeredBy: data.triggeredBy,
      commitHash: data.commitHash ?? null,
      commitMessage: data.commitMessage ?? null,
    })
    .returning();
  return created;
}

export async function updateDeployment(
  id: string,
  data: Partial<typeof deployment.$inferInsert>,
) {
  const [updated] = await db
    .update(deployment)
    .set(data)
    .where(eq(deployment.id, id))
    .returning();
  return updated;
}
