/**
 * ads 테이블의 "migrated" 값을 실제 Clerk org_id, author_id, author_name으로 수정
 *
 * old_user_id → username 매핑:
 *   6  = 마스터 계정
 *   52 = galee200
 *   54 = loneque
 *   57 = mingmary1203
 *   61 = gudwns9
 *   62 = yudong
 *   64 = clean
 *   65 = eplus
 *
 * 실행: npx tsx scripts/fix-ads-migration-mapping.ts
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@libsql/client"
import { createClerkClient } from "@clerk/backend"

const OLD_USER_ID_TO_USERNAME: Record<number, string> = {
  // 6은 마스터 계정 → 별도 처리
  52: "galee200",
  54: "loneque",
  57: "mingmary1203",
  61: "gudwns9",
  62: "yudong",
  64: "clean",
  65: "eplus",
}

type Mapping = {
  oldUserId: number
  username: string
  clerkUserId: string
  clerkOrgId: string
  authorName: string
}

async function main() {
  console.log("=== ads 테이블 migrated → 실제 값 매핑 수정 시작 ===\n")

  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  })

  const dbClient = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })

  // 1. 수정 대상 건수 확인
  const beforeCount = await dbClient.execute(
    "SELECT COUNT(*) as cnt FROM ads WHERE org_id = 'migrated'"
  )
  console.log(`수정 대상: ${beforeCount.rows[0].cnt}건 (org_id = 'migrated')\n`)

  if (Number(beforeCount.rows[0].cnt) === 0) {
    console.log("수정할 데이터가 없습니다.")
    return
  }

  // 2. 마스터 조직 찾기
  console.log("Step 1: 마스터 조직 조회...")
  const allOrgs = await clerkClient.organizations.getOrganizationList({ limit: 100 })
  const masterOrg = allOrgs.data.find((org) => {
    const metadata = org.publicMetadata as { orgType?: string }
    return metadata?.orgType === "master"
  })

  if (!masterOrg) {
    console.error("ERROR: 마스터 조직을 찾을 수 없습니다.")
    process.exit(1)
  }
  console.log(`  마스터 조직: ${masterOrg.name} (${masterOrg.id})\n`)

  // 3. 마스터 조직의 관리자 사용자 조회 (old_user_id=6 매핑용)
  console.log("Step 2: 마스터 계정 사용자 조회...")
  const masterMemberships = await clerkClient.organizations.getOrganizationMembershipList({
    organizationId: masterOrg.id,
  })
  const masterMember = masterMemberships.data[0]
  if (!masterMember?.publicUserData?.userId) {
    console.error("ERROR: 마스터 조직 멤버를 찾을 수 없습니다.")
    process.exit(1)
  }

  const masterUser = await clerkClient.users.getUser(masterMember.publicUserData.userId)
  console.log(`  마스터 사용자: ${masterUser.firstName ?? masterUser.username} (${masterUser.id})\n`)

  // 4. 각 username으로 Clerk 사용자 → 조직 매핑 구성
  console.log("Step 3: 사용자별 Clerk 매핑 조회...")
  const mappings: Mapping[] = []

  // 마스터 계정 매핑
  mappings.push({
    oldUserId: 6,
    username: "마스터",
    clerkUserId: masterUser.id,
    clerkOrgId: masterOrg.id,
    authorName: masterUser.firstName ?? masterUser.username ?? "마스터",
  })
  console.log(`  ✅ old_user_id=6 → ${masterUser.id} / ${masterOrg.id} / ${masterUser.firstName ?? "마스터"}`)

  // 일반 사용자 매핑
  const allUsers = await clerkClient.users.getUserList({ limit: 100 })

  for (const [oldUserIdStr, username] of Object.entries(OLD_USER_ID_TO_USERNAME)) {
    const oldUserId = Number(oldUserIdStr)

    // username으로 사용자 검색
    const user = allUsers.data.find((u) => u.username === username)
    if (!user) {
      console.error(`  ❌ old_user_id=${oldUserId}: username="${username}" 사용자를 찾을 수 없음`)
      continue
    }

    // 사용자의 조직 멤버십 조회
    const userOrgMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId: user.id,
    })

    if (userOrgMemberships.data.length === 0) {
      console.error(`  ❌ old_user_id=${oldUserId}: ${username} 조직 멤버십 없음`)
      continue
    }

    // 첫 번째 조직 사용 (각 사용자는 보통 하나의 조직에 속함)
    const orgId = userOrgMemberships.data[0].organization.id
    const authorName = user.firstName ?? username

    mappings.push({
      oldUserId,
      username,
      clerkUserId: user.id,
      clerkOrgId: orgId,
      authorName,
    })

    console.log(`  ✅ old_user_id=${oldUserId} (${username}) → ${user.id} / ${orgId} / ${authorName}`)
  }

  console.log(`\n총 ${mappings.length}개 매핑 확보\n`)

  // 5. old_user_id별 대상 건수 확인
  console.log("Step 4: old_user_id별 대상 건수 확인...")
  const oldUserIdCounts = await dbClient.execute(
    "SELECT old_user_id, COUNT(*) as cnt FROM ads WHERE org_id = 'migrated' GROUP BY old_user_id"
  )
  for (const row of oldUserIdCounts.rows) {
    const mapping = mappings.find((m) => m.oldUserId === Number(row.old_user_id))
    console.log(
      `  old_user_id=${row.old_user_id}: ${row.cnt}건 → ${mapping ? mapping.username : "❌ 매핑 없음"}`
    )
  }

  // 6. 트랜잭션으로 UPDATE 실행
  console.log("\nStep 5: DB 업데이트 실행...")
  const tx = await dbClient.transaction("write")

  try {
    let totalUpdated = 0

    for (const mapping of mappings) {
      const result = await tx.execute({
        sql: `UPDATE ads SET org_id = ?, author_id = ?, author_name = ? WHERE old_user_id = ? AND org_id = 'migrated'`,
        args: [mapping.clerkOrgId, mapping.clerkUserId, mapping.authorName, mapping.oldUserId],
      })
      const affected = result.rowsAffected
      totalUpdated += affected
      console.log(`  old_user_id=${mapping.oldUserId} (${mapping.username}): ${affected}건 업데이트`)
    }

    await tx.commit()
    console.log(`\n트랜잭션 커밋 완료 (총 ${totalUpdated}건 업데이트)`)
  } catch (e) {
    await tx.rollback()
    console.error("\n트랜잭션 롤백:", (e as Error).message)
    process.exit(1)
  }

  // 7. 결과 검증
  console.log("\n=== 검증 ===")
  const afterCount = await dbClient.execute(
    "SELECT COUNT(*) as cnt FROM ads WHERE org_id = 'migrated'"
  )
  console.log(`남은 'migrated' 건수: ${afterCount.rows[0].cnt}건`)

  const sample = await dbClient.execute(
    "SELECT id, org_id, author_id, author_name, old_user_id, main_keyword FROM ads WHERE old_user_id IS NOT NULL LIMIT 5"
  )
  console.log("\n=== 샘플 데이터 ===")
  for (const row of sample.rows) {
    console.log(row)
  }
}

main().catch(console.error)
