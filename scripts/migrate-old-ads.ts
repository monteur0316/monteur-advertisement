/**
 * old_advertisements_admin → ads 테이블 데이터 마이그레이션 스크립트
 *
 * 실행: npx tsx scripts/migrate-old-ads.ts
 */

import { createClient } from "@libsql/client"
import { config } from "dotenv"
config({ path: ".env.local" })

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

function parseDate(dateStr: string): number {
  // "2026-02-20" → unix timestamp (seconds)
  return Math.floor(new Date(dateStr + "T00:00:00+09:00").getTime() / 1000)
}

function parseDatetime(datetimeStr: string): number {
  // "2026-02-19 15:25:39" → unix timestamp (seconds), KST 기준
  return Math.floor(
    new Date(datetimeStr.replace(" ", "T") + "+09:00").getTime() / 1000
  )
}

async function main() {
  console.log("=== old_advertisements_admin → ads 마이그레이션 시작 ===\n")

  // 1. 기존 ads 데이터 건수 확인
  const beforeCount = await client.execute("SELECT COUNT(*) as cnt FROM ads")
  console.log(`마이그레이션 전 ads 테이블: ${beforeCount.rows[0].cnt}건`)

  // 2. old_advertisements_admin 전체 조회
  const oldData = await client.execute(
    "SELECT * FROM old_advertisements_admin"
  )
  console.log(`old_advertisements_admin: ${oldData.rows.length}건\n`)

  if (oldData.rows.length === 0) {
    console.log("마이그레이션할 데이터가 없습니다.")
    return
  }

  // 3. 트랜잭션으로 INSERT
  const insertSql = `
    INSERT INTO ads (
      org_id, author_id, author_name, quantity, days,
      work_start_date, work_end_date, product_url, price_compare_url,
      main_keyword, memo, created_at, updated_at,
      old_user_id, status, price_comparison, plus,
      product_name, product_mid, price_comparison_mid,
      affiliation, \`rank\`, slot
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  let successCount = 0
  let errorCount = 0

  const tx = await client.transaction("write")

  try {
    for (const row of oldData.rows) {
      try {
        const startDate = row.start_date
          ? parseDate(row.start_date as string)
          : Math.floor(Date.now() / 1000)
        const endDate = row.end_date
          ? parseDate(row.end_date as string)
          : Math.floor(Date.now() / 1000)
        const createdAt = row.created_at
          ? parseDatetime(row.created_at as string)
          : Math.floor(Date.now() / 1000)
        const updatedAt = row.updated_at
          ? parseDatetime(row.updated_at as string)
          : Math.floor(Date.now() / 1000)

        await tx.execute({
          sql: insertSql,
          args: [
            "migrated", // org_id
            "migrated", // author_id
            "migrated", // author_name
            (row.slot as number) || 1, // quantity ← slot
            (row.work_days as number) || 0, // days
            startDate, // work_start_date
            endDate, // work_end_date
            (row.store_url as string) || "", // product_url
            (row.shopping_url as string) || null, // price_compare_url
            (row.main_keyword as string) || "", // main_keyword
            (row.memo as string) || null, // memo
            createdAt, // created_at
            updatedAt, // updated_at
            row.user_id as number, // old_user_id
            row.status as string, // status
            row.price_comparison as number, // price_comparison
            row.plus as number, // plus
            row.product_name as string, // product_name
            row.product_mid as string, // product_mid
            (row.price_comparison_mid as string) || null, // price_comparison_mid
            row.affiliation as string, // affiliation
            row.rank as number, // rank
            row.slot as number, // slot
          ],
        })
        successCount++
      } catch (e) {
        errorCount++
        console.error(`  ERROR (ad_id=${row.ad_id}):`, (e as Error).message)
      }
    }

    await tx.commit()
    console.log(`\n트랜잭션 커밋 완료`)
  } catch (e) {
    await tx.rollback()
    console.error(`\n트랜잭션 롤백:`, (e as Error).message)
    return
  }

  // 4. 결과 확인
  const afterCount = await client.execute("SELECT COUNT(*) as cnt FROM ads")
  console.log(`\n=== 마이그레이션 결과 ===`)
  console.log(`성공: ${successCount}건, 실패: ${errorCount}건`)
  console.log(`마이그레이션 후 ads 테이블: ${afterCount.rows[0].cnt}건`)

  // 5. 샘플 데이터 검증
  const sample = await client.execute(
    "SELECT id, org_id, old_user_id, main_keyword, status, affiliation, work_start_date, product_url FROM ads WHERE old_user_id IS NOT NULL LIMIT 3"
  )
  console.log(`\n=== 샘플 데이터 ===`)
  for (const row of sample.rows) {
    console.log(row)
  }
}

main().catch(console.error)
