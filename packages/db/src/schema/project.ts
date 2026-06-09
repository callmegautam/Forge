import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { domain } from "./domains";
import { deployment } from "./deployments";

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "inactive",
  "archived",
]);

export const project = pgTable(
  "project",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    repoUrl: text("repo_url"),
    branch: text("branch").default("main").notNull(),
    framework: text("framework"),
    status: projectStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("project_userId_idx").on(table.userId)],
);

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  domains: many(domain),
  deployments: many(deployment),
}));
