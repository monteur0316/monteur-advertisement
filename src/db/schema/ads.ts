import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const ads = sqliteTable(
  "ads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orgId: text("org_id").notNull(),
    authorId: text("author_id").notNull(),
    authorName: text("author_name").notNull(),
    quantity: integer("quantity").notNull(),
    days: integer("days").notNull(),
    workStartDate: integer("work_start_date", { mode: "timestamp" }).notNull(),
    workEndDate: integer("work_end_date", { mode: "timestamp" }).notNull(),
    productUrl: text("product_url").notNull(),
    priceCompareUrl: text("price_compare_url"),
    mainKeyword: text("main_keyword").notNull(),
    memo: text("memo"),
    // 레거시 마이그레이션 컬럼 (old_advertisements_admin)
    oldUserId: integer("old_user_id"),
    status: text("status"),
    priceComparison: integer("price_comparison"),
    plus: integer("plus"),
    productName: text("product_name"),
    productMid: text("product_mid"),
    priceComparisonMid: text("price_comparison_mid"),
    affiliation: text("affiliation"),
    rank: integer("rank"),
    slot: integer("slot"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_ads_org_id").on(table.orgId),
    index("idx_ads_org_created").on(table.orgId, table.createdAt),
  ]
)

export type Ad = typeof ads.$inferSelect
export type NewAd = typeof ads.$inferInsert
