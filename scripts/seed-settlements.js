/**
 * 기존 데이터를 settlements + settlement_logs 테이블로 마이그레이션
 *
 * 1. ads 테이블 → settlements (현재 정산 상태)
 * 2. old_settlement_admin → settlement_logs (변경 이력)
 */
const { config } = require("dotenv")
config({ path: ".env.local" })
const { createClient } = require("@libsql/client")

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function main() {
  // === 1. ads → settlements ===
  console.log("=== Step 1: ads → settlements ===")

  const ads = await client.execute("SELECT * FROM ads")
  console.log(`Found ${ads.rows.length} ads`)

  // 조직 계층 정보 로드
  const hierRows = await client.execute("SELECT * FROM organization_hierarchy")
  const hierMap = new Map()
  hierRows.rows.forEach((h) => hierMap.set(h.clerk_org_id, h))

  let settlementCount = 0
  for (const ad of ads.rows) {
    const hier = hierMap.get(ad.org_id)

    let agencyOrgId = null
    let agencyName = null
    let advertiserOrgId = null
    let advertiserName = null

    if (hier) {
      if (hier.org_type === "advertiser") {
        advertiserOrgId = ad.org_id
        advertiserName = ad.author_name
        agencyOrgId = hier.parent_clerk_org_id
      } else if (hier.org_type === "agency") {
        agencyOrgId = ad.org_id
        agencyName = ad.author_name
      }
    }

    // status 결정: 레거시 status 활용, 없으면 날짜 기반 판단
    let status = "pending"
    if (ad.status === "ended" || ad.status === "refunded") {
      status = ad.status === "refunded" ? "refunded" : "confirmed"
    } else if (ad.work_end_date && ad.work_end_date < Math.floor(Date.now() / 1000)) {
      status = "confirmed" // 종료일이 지난 경우 확정 처리
    }

    await client.execute({
      sql: `INSERT INTO settlements (ad_id, org_id, agency_org_id, agency_name, advertiser_org_id, advertiser_name, quantity, start_date, end_date, total_days, status, memo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        ad.id,
        ad.org_id,
        agencyOrgId,
        agencyName,
        advertiserOrgId,
        advertiserName,
        ad.quantity,
        ad.work_start_date,
        ad.work_end_date,
        ad.days,
        status,
        ad.memo,
        ad.created_at,
        ad.updated_at ?? ad.created_at,
      ],
    })
    settlementCount++
  }
  console.log(`Inserted ${settlementCount} settlements`)

  // === 2. old_settlement_admin → settlement_logs ===
  console.log("\n=== Step 2: old_settlement_admin → settlement_logs ===")

  const oldLogs = await client.execute(
    "SELECT * FROM old_settlement_admin ORDER BY created_at ASC"
  )
  console.log(`Found ${oldLogs.rows.length} old settlement records`)

  // old_advertisements_admin에서 ad_id → org_id 매핑 시도
  // ads 테이블에 old_user_id가 있으므로 이를 활용
  const adsByOldId = new Map()
  ads.rows.forEach((ad) => {
    if (ad.old_user_id) {
      // old_user_id + 유사 조건으로 매핑
      if (!adsByOldId.has(ad.old_user_id)) adsByOldId.set(ad.old_user_id, [])
      adsByOldId.get(ad.old_user_id).push(ad)
    }
  })

  // ads.id 기반 매핑 (old_settlement_admin.ad_id → ads에서 old_user_id 기반 검색)
  const adsById = new Map()
  ads.rows.forEach((ad) => adsById.set(ad.id, ad))

  // old_advertisements_admin에서 ad_id 매핑
  let oldAdMap = new Map()
  try {
    const oldAds = await client.execute("SELECT ad_id, user_id FROM old_advertisements_admin")
    oldAds.rows.forEach((oa) => oldAdMap.set(oa.ad_id, oa.user_id))
  } catch {
    console.log("old_advertisements_admin not available, using fallback mapping")
  }

  let logCount = 0
  let skipped = 0
  for (const log of oldLogs.rows) {
    // ad_id로 현재 ads 테이블의 매칭 시도
    let orgId = null
    const matchedAd = adsById.get(log.ad_id)
    if (matchedAd) {
      orgId = matchedAd.org_id
    }

    // orgId를 찾을 수 없으면 old_user_id 기반으로 시도
    if (!orgId) {
      const userId = log.advertiser_user_id || log.agency_user_id
      if (userId) {
        const candidates = adsByOldId.get(userId)
        if (candidates && candidates.length > 0) {
          orgId = candidates[0].org_id
        }
      }
    }

    if (!orgId) {
      skipped++
      continue
    }

    // period를 unix timestamp로 변환
    let periodStart = null
    let periodEnd = null
    if (log.period_start) {
      periodStart = Math.floor(new Date(log.period_start).getTime() / 1000)
    }
    if (log.period_end) {
      periodEnd = Math.floor(new Date(log.period_end).getTime() / 1000)
    }

    const createdAt = Math.floor(new Date(log.created_at).getTime() / 1000)

    await client.execute({
      sql: `INSERT INTO settlement_logs (ad_id, org_id, type, quantity, period_start, period_end, total_days, memo, performed_by_user_id, performed_by_user_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        log.ad_id,
        orgId,
        log.settlement_type,
        log.quantity,
        periodStart,
        periodEnd,
        log.total_days,
        log.ad_product_nm,
        String(log.performed_by_user_id ?? "unknown"),
        "레거시 사용자",
        createdAt,
      ],
    })
    logCount++
  }

  console.log(`Inserted ${logCount} settlement_logs`)
  if (skipped > 0) console.log(`Skipped ${skipped} records (no matching org)`)

  // === 검증 ===
  console.log("\n=== Verification ===")
  const sCount = await client.execute("SELECT COUNT(*) as cnt FROM settlements")
  const lCount = await client.execute("SELECT COUNT(*) as cnt FROM settlement_logs")
  console.log(`settlements: ${sCount.rows[0].cnt} rows`)
  console.log(`settlement_logs: ${lCount.rows[0].cnt} rows`)
  console.log("\nDone!")
}

main().catch(console.error)
