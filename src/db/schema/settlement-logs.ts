import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

// INSERT-only 감사 로그 테이블 — 수정/삭제 없이 이력만 추가
export const settlementLogs = sqliteTable(
  "settlement_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    adId: integer("ad_id").notNull(),
    orgId: text("org_id").notNull(),
    type: text("type").notNull(), // order | extend | update | refund | cancel
    quantity: integer("quantity"),
    periodStart: integer("period_start", { mode: "timestamp" }),
    periodEnd: integer("period_end", { mode: "timestamp" }),
    totalDays: integer("total_days"),
    memo: text("memo"),
    performedByUserId: text("performed_by_user_id").notNull(),
    performedByUserName: text("performed_by_user_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_settlement_logs_org_id").on(table.orgId),
    index("idx_settlement_logs_ad_id").on(table.adId),
    index("idx_settlement_logs_org_created").on(table.orgId, table.createdAt),
  ]
)

export type SettlementLog = typeof settlementLogs.$inferSelect
export type NewSettlementLog = typeof settlementLogs.$inferInsert
