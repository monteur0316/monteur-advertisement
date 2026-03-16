import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const settlements = sqliteTable(
  "settlements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    adId: integer("ad_id").notNull(),
    orgId: text("org_id").notNull(),
    agencyOrgId: text("agency_org_id"),
    agencyName: text("agency_name"),
    advertiserOrgId: text("advertiser_org_id"),
    advertiserName: text("advertiser_name"),
    quantity: integer("quantity").notNull(),
    startDate: integer("start_date", { mode: "timestamp" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp" }).notNull(),
    totalDays: integer("total_days").notNull(),
    status: text("status").notNull().default("pending"), // pending | confirmed | refunded
    confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
    confirmedByUserId: text("confirmed_by_user_id"),
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
    index("idx_settlements_org_id").on(table.orgId),
    index("idx_settlements_org_created").on(table.orgId, table.createdAt),
    index("idx_settlements_status").on(table.status),
    index("idx_settlements_ad_id").on(table.adId),
  ]
)

export type Settlement = typeof settlements.$inferSelect
export type NewSettlement = typeof settlements.$inferInsert
