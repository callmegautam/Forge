import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { project } from "./project";

export const deploymentStatusEnum = pgEnum("deployment_status", [
  "queued",
  "building",
  "live",
  "failed",
]);

export const deploymentTriggerEnum = pgEnum("deployment_trigger", [
  "manual",
  "webhook",
  "rollback",
]);

export const deployment = pgTable(
  "deployment",
  {
    id: uuid("id").primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    status: deploymentStatusEnum("status").default("queued").notNull(),
    commitHash: varchar("commit_hash", { length: 40 }),
    commitMessage: varchar("commit_message", { length: 500 }),
    branch: varchar("branch", { length: 255 }),
    triggeredBy: deploymentTriggerEnum("triggered_by").default("manual").notNull(),
    artifactPath: varchar("artifact_path", { length: 500 }),
    buildDuration: integer("build_duration"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("deployment_projectId_idx").on(table.projectId)],
);

export const deploymentRelations = relations(deployment, ({ one }) => ({
  project: one(project, {
    fields: [deployment.projectId],
    references: [project.id],
  }),
}));
