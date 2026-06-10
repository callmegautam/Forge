import { db } from "@forge/db";
import { project } from "@forge/db/schema/project";
import { eq } from "drizzle-orm";

export async function findProjectByRepoUrl(repoUrl: string) {
  return db.query.project.findFirst({
    where: eq(project.repoUrl, repoUrl),
  });
}

export async function findProjectById(id: string) {
  return db.query.project.findFirst({
    where: eq(project.id, id),
  });
}

export async function findProjectsByUserId(userId: string) {
  return db.query.project.findMany({
    where: eq(project.userId, userId),
  });
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

export async function deleteProjectById(id: string) {
  const [deleted] = await db
    .delete(project)
    .where(eq(project.id, id))
    .returning();
  return deleted;
}
