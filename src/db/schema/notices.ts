import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const notices = sqliteTable(
  "notices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orgId: text("org_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    authorId: text("author_id").notNull(),
    authorName: text("author_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_notices_org_id").on(table.orgId),
    index("idx_notices_org_pinned_created").on(
      table.orgId,
      table.isPinned,
      table.createdAt
    ),
  ]
)

export type Notice = typeof notices.$inferSelect
export type NewNotice = typeof notices.$inferInsert
