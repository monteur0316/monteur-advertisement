import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const organizationHierarchy = sqliteTable(
  "organization_hierarchy",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clerkOrgId: text("clerk_org_id").notNull(),
    orgType: text("org_type", {
      enum: ["master", "distributor", "agency", "advertiser"],
    }).notNull(),
    parentClerkOrgId: text("parent_clerk_org_id"),
    depth: integer("depth").notNull().default(0),
    adQuantity: integer("ad_quantity").notNull().default(0),
    memo: text("memo"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_org_hierarchy_clerk_org_id").on(table.clerkOrgId),
    index("idx_org_hierarchy_parent").on(table.parentClerkOrgId),
    index("idx_org_hierarchy_type").on(table.orgType),
  ]
)

export type OrganizationHierarchy = typeof organizationHierarchy.$inferSelect
export type NewOrganizationHierarchy = typeof organizationHierarchy.$inferInsert
