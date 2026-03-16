/**
 * 기존 settlements 데이터에 agency_name, agency_org_id 백필
 *
 * 문제: advertiser가 생성한 정산에 agency_name이 null로 저장됨
 * 해결: organization_hierarchy에서 부모 agency를 찾고, Clerk API로 이름 조회 후 업데이트
 */
const { config } = require("dotenv")
config({ path: ".env.local" })
const { createClient } = require("@libsql/client")
const { createClerkClient } = require("@clerk/backend")

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

async function main() {
  console.log("=== agency_name 백필 시작 ===\n")

  // 1. agency_name이 null인 정산 조회
  const nullAgency = await client.execute(
    "SELECT id, org_id, agency_org_id, agency_name FROM settlements WHERE agency_name IS NULL"
  )
  console.log(`agency_name이 null인 정산: ${nullAgency.rows.length}건`)

  if (nullAgency.rows.length === 0) {
    console.log("백필할 데이터가 없습니다.")
    return
  }

  // 2. organization_hierarchy 로드
  const hierRows = await client.execute("SELECT clerk_org_id, parent_clerk_org_id, org_type FROM organization_hierarchy")
  const hierMap = new Map()
  hierRows.rows.forEach((h) => hierMap.set(h.clerk_org_id, h))

  // 3. 필요한 agency org_id 수집
  const agencyOrgIds = new Set()
  for (const row of nullAgency.rows) {
    const hier = hierMap.get(row.org_id)
    if (hier?.org_type === "advertiser" && hier.parent_clerk_org_id) {
      // advertiser의 부모가 agency
      agencyOrgIds.add(hier.parent_clerk_org_id)
    } else if (hier?.org_type === "agency") {
      // agency 자신
      agencyOrgIds.add(row.org_id)
    } else if (!hier) {
      // hierarchy에 없는 경우 (master 등) — parent를 찾아봄
      const children = hierRows.rows.filter((h) => h.parent_clerk_org_id === row.org_id)
      if (children.length > 0) {
        console.log(`  org ${row.org_id}는 hierarchy에 parent로만 존재 (master/distributor) — 스킵`)
      }
    }
  }

  console.log(`Clerk에서 조회할 agency 조직: ${agencyOrgIds.size}개`)

  // 4. Clerk API로 agency 이름 일괄 조회
  const agencyNameMap = new Map()
  for (const orgId of agencyOrgIds) {
    try {
      const org = await clerk.organizations.getOrganization({ organizationId: orgId })
      agencyNameMap.set(orgId, org.name)
      console.log(`  ${orgId} → ${org.name}`)
    } catch (err) {
      console.log(`  ${orgId} → 조회 실패: ${err.message}`)
      agencyNameMap.set(orgId, null)
    }
  }

  // 5. settlements 업데이트
  let updated = 0
  let skipped = 0
  for (const row of nullAgency.rows) {
    const hier = hierMap.get(row.org_id)
    let agencyOrgId = null
    let agencyName = null

    if (hier?.org_type === "advertiser" && hier.parent_clerk_org_id) {
      agencyOrgId = hier.parent_clerk_org_id
      agencyName = agencyNameMap.get(hier.parent_clerk_org_id) ?? null
    } else if (hier?.org_type === "agency") {
      agencyOrgId = row.org_id
      agencyName = agencyNameMap.get(row.org_id) ?? null
    }

    if (!agencyName) {
      skipped++
      continue
    }

    await client.execute({
      sql: "UPDATE settlements SET agency_org_id = ?, agency_name = ? WHERE id = ?",
      args: [agencyOrgId, agencyName, row.id],
    })
    updated++
  }

  console.log(`\n=== 결과 ===`)
  console.log(`업데이트: ${updated}건`)
  console.log(`스킵: ${skipped}건 (agency 매핑 불가)`)

  // 6. 검증
  const verify = await client.execute(
    "SELECT agency_name, count(*) as cnt FROM settlements GROUP BY agency_name"
  )
  console.log(`\n=== 검증: agency_name별 정산 수 ===`)
  verify.rows.forEach((r) => console.log(`  ${r.agency_name ?? "(null)"}: ${r.cnt}건`))

  console.log("\n완료!")
}

main().catch(console.error)
