import { relations } from "drizzle-orm";
import { boolean, pgTable, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";
import { project } from "./project";

export const domain = pgTable(
  "domain",
  {
    id: uuid("id").primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 255 }).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    verified: boolean("verified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("domain_projectId_idx").on(table.projectId)],
);

export const domainRelations = relations(domain, ({ one }) => ({
  project: one(project, {
    fields: [domain.projectId],
    references: [project.id],
  }),
}));
