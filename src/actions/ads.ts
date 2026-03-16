"use server"

import { db } from "@/src/db"
import { ads } from "@/src/db/schema/ads"
import type { Ad } from "@/src/db/schema/ads"
import { eq, and, desc, count, inArray } from "drizzle-orm"
import { getAuthContext } from "@/src/lib/auth"
import {
  isAncestorOf,
  getDescendantOrgIds,
} from "@/src/db/queries/organization-hierarchy"
import {
  createAdSchema,
  updateAdSchema,
  extendAdSchema,
  deleteAdSchema,
} from "@/src/schemas/ads"

type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}

// 광고 목록 조회
export async function getAds(input: {
  orgId: string
  page?: number
  limit?: number
}): Promise<ApiResponse<{ ads: Ad[]; total: number }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  const isSameOrg = ctx.orgId === input.orgId
  const isAncestor =
    !isSameOrg && (await isAncestorOf(ctx.orgId, input.orgId))

  if (!isSameOrg && !isAncestor) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  try {
    // 마스터: 자신 + 모든 하위 조직 광고 조회
    // 비마스터: 요청한 orgId 광고만 조회
    let orgFilter
    if (ctx.isMaster) {
      const descendantIds = await getDescendantOrgIds(ctx.orgId)
      const allOrgIds = [ctx.orgId, ...descendantIds]
      orgFilter = inArray(ads.orgId, allOrgIds)
    } else {
      orgFilter = eq(ads.orgId, input.orgId)
    }

    let query = db
      .select()
      .from(ads)
      .where(orgFilter)
      .orderBy(desc(ads.createdAt))

    if (input.limit) {
      const page = input.page ?? 1
      const offset = (page - 1) * input.limit
      query = query.limit(input.limit).offset(offset) as typeof query
    }

    const [rows, totalResult] = await Promise.all([
      query,
      db.select({ count: count() }).from(ads).where(orgFilter),
    ])

    return {
      data: { ads: rows, total: totalResult[0]?.count ?? 0 },
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

// 광고 단건 조회
export async function getAd(input: {
  id: number
  orgId: string
}): Promise<ApiResponse<{ ad: Ad }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  const isSameOrg = ctx.orgId === input.orgId
  const isAncestor =
    !isSameOrg && (await isAncestorOf(ctx.orgId, input.orgId))

  if (!isSameOrg && !isAncestor) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  try {
    const row = await db
      .select()
      .from(ads)
      .where(and(eq(ads.id, input.id), eq(ads.orgId, input.orgId)))
      .get()

    if (!row) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "광고를 찾을 수 없습니다",
      }
    }

    return { data: { ad: row }, error: null, message: null }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// 광고 생성
export async function createAd(input: {
  quantity: number
  days: number
  workStartDate: string
  workEndDate: string
  productUrl: string
  priceCompareUrl?: string
  mainKeyword: string
  memo?: string
}): Promise<ApiResponse<{ ad: Ad }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  const parsed = createAdSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다",
    }
  }

  try {
    const { firstName, lastName } = await getClerkUserName(ctx.userId)
    const authorName =
      [firstName, lastName].filter(Boolean).join(" ") || "Unknown"

    const row = await db
      .insert(ads)
      .values({
        orgId: ctx.orgId,
        authorId: ctx.userId,
        authorName,
        quantity: parsed.data.quantity,
        days: parsed.data.days,
        workStartDate: new Date(parsed.data.workStartDate),
        workEndDate: new Date(parsed.data.workEndDate),
        productUrl: parsed.data.productUrl,
        priceCompareUrl: parsed.data.priceCompareUrl || null,
        mainKeyword: parsed.data.mainKeyword,
        memo: parsed.data.memo || null,
      })
      .returning()
      .get()

    return { data: { ad: row }, error: null, message: "광고가 등록되었습니다" }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// 광고 수정
export async function updateAd(input: {
  id: number
  quantity?: number
  days?: number
  workStartDate?: string
  workEndDate?: string
  productUrl?: string
  priceCompareUrl?: string
  mainKeyword?: string
  memo?: string
}): Promise<ApiResponse<{ ad: Ad }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  const parsed = updateAdSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다",
    }
  }

  try {
    const existing = await db
      .select()
      .from(ads)
      .where(and(eq(ads.id, parsed.data.id), eq(ads.orgId, ctx.orgId)))
      .get()

    if (!existing) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "광고를 찾을 수 없습니다",
      }
    }

    const { id, ...updateFields } = parsed.data
    const updateValues: Record<string, unknown> = {}

    if (updateFields.quantity !== undefined)
      updateValues.quantity = updateFields.quantity
    if (updateFields.days !== undefined) updateValues.days = updateFields.days
    if (updateFields.workStartDate !== undefined)
      updateValues.workStartDate = new Date(updateFields.workStartDate)
    if (updateFields.workEndDate !== undefined)
      updateValues.workEndDate = new Date(updateFields.workEndDate)
    if (updateFields.productUrl !== undefined)
      updateValues.productUrl = updateFields.productUrl
    if (updateFields.priceCompareUrl !== undefined)
      updateValues.priceCompareUrl = updateFields.priceCompareUrl || null
    if (updateFields.mainKeyword !== undefined)
      updateValues.mainKeyword = updateFields.mainKeyword
    if (updateFields.memo !== undefined)
      updateValues.memo = updateFields.memo || null

    const row = await db
      .update(ads)
      .set(updateValues)
      .where(eq(ads.id, id))
      .returning()
      .get()

    return { data: { ad: row }, error: null, message: "광고가 수정되었습니다" }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// 광고 연장
export async function extendAd(input: {
  id: number
  additionalDays: number
}): Promise<ApiResponse<{ ad: Ad }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  const parsed = extendAdSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다",
    }
  }

  try {
    const existing = await db
      .select()
      .from(ads)
      .where(and(eq(ads.id, parsed.data.id), eq(ads.orgId, ctx.orgId)))
      .get()

    if (!existing) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "광고를 찾을 수 없습니다",
      }
    }

    const newDays = existing.days + parsed.data.additionalDays
    const newEndDate = new Date(existing.workEndDate)
    newEndDate.setDate(newEndDate.getDate() + parsed.data.additionalDays)

    const row = await db
      .update(ads)
      .set({ days: newDays, workEndDate: newEndDate })
      .where(eq(ads.id, parsed.data.id))
      .returning()
      .get()

    return {
      data: { ad: row },
      error: null,
      message: `${parsed.data.additionalDays}일 연장되었습니다`,
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// 광고 삭제
export async function deleteAd(input: {
  id: number
}): Promise<ApiResponse<{ success: boolean }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  const parsed = deleteAdSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다",
    }
  }

  try {
    const existing = await db
      .select()
      .from(ads)
      .where(and(eq(ads.id, parsed.data.id), eq(ads.orgId, ctx.orgId)))
      .get()

    if (!existing) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "광고를 찾을 수 없습니다",
      }
    }

    await db.delete(ads).where(eq(ads.id, parsed.data.id))

    return {
      data: { success: true },
      error: null,
      message: "광고가 삭제되었습니다",
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// Helper: Get user name from Clerk
async function getClerkUserName(userId: string) {
  const { clerkClient } = await import("@clerk/nextjs/server")
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  return {
    firstName: user.firstName,
    lastName: user.lastName,
  }
}
