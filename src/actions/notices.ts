"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/src/db"
import { notices } from "@/src/db/schema/notices"
import type { Notice } from "@/src/db/schema/notices"
import { eq, and, or, desc, count } from "drizzle-orm"
import { getAuthContext } from "@/src/lib/auth"
import { isAncestorOf } from "@/src/db/queries/organization-hierarchy"
import {
  createNoticeSchema,
  updateNoticeSchema,
  deleteNoticeSchema,
} from "@/src/schemas/notices"

type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}

// T012: getNotices — 조직의 공지사항 목록 조회
export async function getNotices(input: {
  orgId: string
  page?: number
  limit?: number
}): Promise<ApiResponse<{ notices: Notice[]; total: number }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  // Allow if same org or ancestor org
  const isSameOrg = ctx.orgId === input.orgId
  const isAncestor = !isSameOrg && await isAncestorOf(ctx.orgId, input.orgId)

  if (!isSameOrg && !isAncestor) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  const page = input.page ?? 1
  const limit = input.limit ?? 20
  const offset = (page - 1) * limit

  try {
    const orgFilter = or(
      eq(notices.orgId, input.orgId),
      eq(notices.orgId, "__all__")
    )

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(notices)
        .where(orgFilter)
        .orderBy(desc(notices.isPinned), desc(notices.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(notices)
        .where(orgFilter),
    ])

    return {
      data: { notices: rows, total: totalResult[0]?.count ?? 0 },
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

// T013: getNotice — 공지사항 단건 조회
export async function getNotice(input: {
  id: number
  orgId: string
}): Promise<ApiResponse<{ notice: Notice }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  const isSameOrg = ctx.orgId === input.orgId
  const isAncestor = !isSameOrg && await isAncestorOf(ctx.orgId, input.orgId)

  if (!isSameOrg && !isAncestor) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  try {
    const row = await db
      .select()
      .from(notices)
      .where(and(eq(notices.id, input.id), eq(notices.orgId, input.orgId)))
      .get()

    if (!row) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "공지사항을 찾을 수 없습니다",
      }
    }

    return { data: { notice: row }, error: null, message: null }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// T017: createNotice — 새 공지사항 생성
export async function createNotice(input: {
  title: string
  content: string
  isPinned?: boolean
  orgId?: string
}): Promise<ApiResponse<{ notice: Notice }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  // Master can specify orgId explicitly, otherwise use session orgId
  const targetOrgId = (ctx.isMaster && input.orgId) ? input.orgId : ctx.orgId

  const parsed = createNoticeSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다",
    }
  }

  try {
    const { firstName, lastName } = await getClerkUserName(ctx.userId)
    const authorName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown"

    const row = await db
      .insert(notices)
      .values({
        orgId: targetOrgId,
        title: parsed.data.title,
        content: parsed.data.content,
        isPinned: parsed.data.isPinned,
        authorId: ctx.userId,
        authorName,
      })
      .returning()
      .get()

    return { data: { notice: row }, error: null, message: "공지사항이 등록되었습니다" }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// T020: updateNotice — 기존 공지사항 수정
export async function updateNotice(input: {
  id: number
  title?: string
  content?: string
  isPinned?: boolean
}): Promise<ApiResponse<{ notice: Notice }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  const parsed = updateNoticeSchema.safeParse(input)
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
      .from(notices)
      .where(eq(notices.id, parsed.data.id))
      .get()

    if (!existing) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "공지사항을 찾을 수 없습니다",
      }
    }

    const { id, ...updateFields } = parsed.data
    const row = await db
      .update(notices)
      .set(updateFields)
      .where(eq(notices.id, id))
      .returning()
      .get()

    return { data: { notice: row }, error: null, message: "공지사항이 수정되었습니다" }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// T023: deleteNotice — 공지사항 삭제
export async function deleteNotice(input: {
  id: number
}): Promise<ApiResponse<{ success: boolean }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  const parsed = deleteNoticeSchema.safeParse(input)
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
      .from(notices)
      .where(eq(notices.id, parsed.data.id))
      .get()

    if (!existing) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "공지사항을 찾을 수 없습니다",
      }
    }

    await db.delete(notices).where(eq(notices.id, parsed.data.id))

    return {
      data: { success: true },
      error: null,
      message: "공지사항이 삭제되었습니다",
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// T025: getAllNotices — 마스터 전체 공지사항 조회
export async function getAllNotices(input?: {
  page?: number
  limit?: number
}): Promise<ApiResponse<{ notices: Notice[]; total: number }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  const page = input?.page ?? 1
  const limit = input?.limit ?? 20
  const offset = (page - 1) * limit

  try {
    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(notices)
        .orderBy(desc(notices.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(notices),
    ])

    return {
      data: { notices: rows, total: totalResult[0]?.count ?? 0 },
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
