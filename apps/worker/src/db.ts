import { db } from "@forge/db";
import { deployment } from "@forge/db/schema/deployments";
import { project } from "@forge/db/schema/project";
import { eq } from "drizzle-orm";

export async function findQueuedDeployments() {
  return db.query.deployment.findMany({
    where: eq(deployment.status, "queued"),
    with: { project: true },
  });
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

export async function updateProjectById(
  id: string,
  data: Partial<typeof project.$inferInsert>,
) {
  const [updated] = await db
    .update(project)
    .set(data)
    .where(eq(project.id, id))
    .returning();
  return updated;
}
