"use server"

import { db } from "@/src/db"
import { settlements } from "@/src/db/schema/settlements"
import { settlementLogs } from "@/src/db/schema/settlement-logs"
import { organizationHierarchy } from "@/src/db/schema/organization-hierarchy"
import { eq, desc, count, inArray } from "drizzle-orm"
import { getAuthContext } from "@/src/lib/auth"
import {
  getDescendantOrgIds,
  isAncestorOf,
} from "@/src/db/queries/organization-hierarchy"

type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}

export interface SettlementRecord {
  id: number
  adId: number
  agencyName: string | null
  advertiserName: string | null
  quantity: number
  startDate: Date
  endDate: Date
  totalDays: number
  status: string
  memo: string | null
  createdAt: Date
}

export interface SettlementLogRecord {
  id: number
  adId: number
  type: string
  quantity: number | null
  periodStart: Date | null
  periodEnd: Date | null
  totalDays: number | null
  memo: string | null
  performedByUserName: string
  createdAt: Date
}

// 정산 목록 조회 (settlements 테이블 기반)
export async function getSettlements(input: {
  orgId: string
  page?: number
  limit?: number
}): Promise<ApiResponse<{ settlements: SettlementRecord[]; total: number }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    const isSameOrg = ctx.orgId === input.orgId
    const isAncestor =
      !isSameOrg && (await isAncestorOf(ctx.orgId, input.orgId))

    if (!isSameOrg && !isAncestor) {
      return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
    }
  }

  try {
    // 마스터: 전체 정산 조회, 비마스터: 자신 + 하위 조직만
    let orgFilter
    if (ctx.isMaster) {
      orgFilter = undefined
    } else {
      const descendantIds = await getDescendantOrgIds(input.orgId)
      const orgIds = [input.orgId, ...descendantIds]
      orgFilter = inArray(settlements.orgId, orgIds)
    }

    let query = db
      .select()
      .from(settlements)
      .orderBy(desc(settlements.createdAt))

    if (orgFilter) {
      query = query.where(orgFilter) as typeof query
    }

    if (input.limit) {
      const page = input.page ?? 1
      const offset = (page - 1) * input.limit
      query = query.limit(input.limit).offset(offset) as typeof query
    }

    const countQuery = orgFilter
      ? db.select({ count: count() }).from(settlements).where(orgFilter)
      : db.select({ count: count() }).from(settlements)

    const [rows, totalResult] = await Promise.all([
      query,
      countQuery,
    ])

    const result: SettlementRecord[] = rows.map((row) => ({
      id: row.id,
      adId: row.adId,
      agencyName: row.agencyName,
      advertiserName: row.advertiserName,
      quantity: row.quantity,
      startDate: row.startDate,
      endDate: row.endDate,
      totalDays: row.totalDays,
      status: row.status,
      memo: row.memo,
      createdAt: row.createdAt,
    }))

    return {
      data: { settlements: result, total: totalResult[0]?.count ?? 0 },
      error: null,
      message: null,
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// 정산 생성 (광고 등록 시 호출)
export async function createSettlement(input: {
  adId: number
  orgId: string
  quantity: number
  startDate: Date
  endDate: Date
  totalDays: number
  memo?: string
}): Promise<ApiResponse<{ id: number }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  try {
    // 조직 계층 정보로 대행사/광고주 이름 조회
    const hierRows = await db
      .select()
      .from(organizationHierarchy)
      .where(eq(organizationHierarchy.clerkOrgId, input.orgId))

    const hier = hierRows[0]
    let agencyOrgId: string | null = null
    let agencyName: string | null = null
    let advertiserOrgId: string | null = null
    let advertiserName: string | null = null

    const orgNameMap = await getOrgNames(
      [input.orgId, hier?.parentClerkOrgId].filter(
        (id): id is string => !!id
      )
    )

    if (hier?.orgType === "advertiser") {
      advertiserOrgId = input.orgId
      advertiserName = orgNameMap.get(input.orgId) ?? null
      agencyOrgId = hier.parentClerkOrgId
      agencyName = hier.parentClerkOrgId
        ? orgNameMap.get(hier.parentClerkOrgId) ?? null
        : null
    } else if (hier?.orgType === "agency") {
      agencyOrgId = input.orgId
      agencyName = orgNameMap.get(input.orgId) ?? null
    }

    const [settlement] = await db
      .insert(settlements)
      .values({
        adId: input.adId,
        orgId: input.orgId,
        agencyOrgId,
        agencyName,
        advertiserOrgId,
        advertiserName,
        quantity: input.quantity,
        startDate: input.startDate,
        endDate: input.endDate,
        totalDays: input.totalDays,
        memo: input.memo,
      })
      .returning({ id: settlements.id })

    // 감사 로그 기록
    const userName = await getUserName(ctx.userId)
    await db.insert(settlementLogs).values({
      adId: input.adId,
      orgId: input.orgId,
      type: "order",
      quantity: input.quantity,
      periodStart: input.startDate,
      periodEnd: input.endDate,
      totalDays: input.totalDays,
      memo: input.memo,
      performedByUserId: ctx.userId,
      performedByUserName: userName,
    })

    return {
      data: { id: settlement.id },
      error: null,
      message: "정산이 생성되었습니다",
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// 정산 상태 변경 (확정/환불)
export async function updateSettlementStatus(input: {
  settlementId: number
  status: "confirmed" | "refunded"
  memo?: string
}): Promise<ApiResponse<null>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  try {
    const [existing] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.id, input.settlementId))

    if (!existing) {
      return { data: null, error: "NOT_FOUND", message: "정산을 찾을 수 없습니다" }
    }

    // 권한 확인 (마스터는 전체 접근)
    if (!ctx.isMaster) {
      const isSameOrg = ctx.orgId === existing.orgId
      const isAncestor =
        !isSameOrg && (await isAncestorOf(ctx.orgId, existing.orgId))

      if (!isSameOrg && !isAncestor) {
        return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
      }
    }

    await db
      .update(settlements)
      .set({
        status: input.status,
        confirmedAt: new Date(),
        confirmedByUserId: ctx.userId,
        memo: input.memo ?? existing.memo,
      })
      .where(eq(settlements.id, input.settlementId))

    // 감사 로그 기록
    await db.insert(settlementLogs).values({
      adId: existing.adId,
      orgId: existing.orgId,
      type: input.status === "refunded" ? "refund" : "update",
      quantity: existing.quantity,
      periodStart: existing.startDate,
      periodEnd: existing.endDate,
      totalDays: existing.totalDays,
      memo: input.memo ?? `상태 변경: ${input.status}`,
      performedByUserId: ctx.userId,
      performedByUserName: await getUserName(ctx.userId!),
    })

    const message =
      input.status === "confirmed"
        ? "정산이 확정되었습니다"
        : "환불 처리되었습니다"

    return { data: null, error: null, message }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// 정산 이력 조회 (특정 광고의 변경 이력)
export async function getSettlementLogs(input: {
  adId: number
  orgId: string
}): Promise<ApiResponse<SettlementLogRecord[]>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    const isSameOrg = ctx.orgId === input.orgId
    const isAncestor =
      !isSameOrg && (await isAncestorOf(ctx.orgId, input.orgId))

    if (!isSameOrg && !isAncestor) {
      return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
    }
  }

  try {
    const rows = await db
      .select()
      .from(settlementLogs)
      .where(eq(settlementLogs.adId, input.adId))
      .orderBy(desc(settlementLogs.createdAt))

    const result: SettlementLogRecord[] = rows.map((row) => ({
      id: row.id,
      adId: row.adId,
      type: row.type,
      quantity: row.quantity,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      totalDays: row.totalDays,
      memo: row.memo,
      performedByUserName: row.performedByUserName,
      createdAt: row.createdAt,
    }))

    return { data: result, error: null, message: null }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// 정산 기간 연장
export async function extendSettlement(input: {
  settlementId: number
  newEndDate: Date
  newTotalDays: number
  memo?: string
}): Promise<ApiResponse<null>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  try {
    const [existing] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.id, input.settlementId))

    if (!existing) {
      return { data: null, error: "NOT_FOUND", message: "정산을 찾을 수 없습니다" }
    }

    if (!ctx.isMaster) {
      const isSameOrg = ctx.orgId === existing.orgId
      const isAncestor =
        !isSameOrg && (await isAncestorOf(ctx.orgId, existing.orgId))

      if (!isSameOrg && !isAncestor) {
        return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
      }
    }

    await db
      .update(settlements)
      .set({
        endDate: input.newEndDate,
        totalDays: input.newTotalDays,
      })
      .where(eq(settlements.id, input.settlementId))

    // 감사 로그 기록
    await db.insert(settlementLogs).values({
      adId: existing.adId,
      orgId: existing.orgId,
      type: "extend",
      quantity: existing.quantity,
      periodStart: existing.startDate,
      periodEnd: input.newEndDate,
      totalDays: input.newTotalDays,
      memo: input.memo ?? `기간 연장: ${input.newEndDate.toISOString().split("T")[0]}까지`,
      performedByUserId: ctx.userId,
      performedByUserName: await getUserName(ctx.userId!),
    })

    return { data: null, error: null, message: "기간이 연장되었습니다" }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// Helper: Clerk에서 사용자 이름 조회
async function getUserName(userId: string): Promise<string> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server")
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown"
  } catch {
    return "Unknown"
  }
}

// Helper: Clerk에서 조직 이름을 일괄 조회
async function getOrgNames(orgIds: string[]): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>()
  if (orgIds.length === 0) return nameMap

  const { clerkClient } = await import("@clerk/nextjs/server")
  const client = await clerkClient()

  await Promise.all(
    orgIds.map(async (orgId) => {
      try {
        const org = await client.organizations.getOrganization({
          organizationId: orgId,
        })
        nameMap.set(orgId, org.name)
      } catch {
        nameMap.set(orgId, "Unknown")
      }
    })
  )

  return nameMap
}
