"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/src/db"
import { faqs } from "@/src/db/schema/faqs"
import type { Faq } from "@/src/db/schema/faqs"
import { eq, asc, max } from "drizzle-orm"
import { getAuthContext } from "@/src/lib/auth"
import {
  createFaqSchema,
  updateFaqSchema,
  deleteFaqSchema,
  reorderFaqsSchema,
} from "@/src/schemas/faq"

type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}

// getFaqs — FAQ 전체 목록 조회
export async function getFaqs(): Promise<ApiResponse<{ faqs: Faq[] }>> {
  const { userId } = await auth()

  if (!userId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  try {
    const rows = await db
      .select()
      .from(faqs)
      .orderBy(asc(faqs.sortOrder))

    return { data: { faqs: rows }, error: null, message: null }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// getFaq — FAQ 단건 조회
export async function getFaq(input: {
  id: number
}): Promise<ApiResponse<{ faq: Faq }>> {
  const { userId } = await auth()

  if (!userId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  try {
    const row = await db
      .select()
      .from(faqs)
      .where(eq(faqs.id, input.id))
      .get()

    if (!row) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "FAQ를 찾을 수 없습니다",
      }
    }

    return { data: { faq: row }, error: null, message: null }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// createFaq — FAQ 신규 생성 (마스터만)
export async function createFaq(input: {
  question: string
  answer: string
}): Promise<ApiResponse<{ faq: Faq }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  const parsed = createFaqSchema.safeParse(input)
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

    const maxResult = await db
      .select({ maxOrder: max(faqs.sortOrder) })
      .from(faqs)
      .get()
    const nextOrder = (maxResult?.maxOrder ?? -1) + 1

    const row = await db
      .insert(faqs)
      .values({
        question: parsed.data.question,
        answer: parsed.data.answer,
        sortOrder: nextOrder,
        authorId: ctx.userId,
        authorName,
      })
      .returning()
      .get()

    return { data: { faq: row }, error: null, message: "FAQ가 등록되었습니다" }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// updateFaq — FAQ 수정 (마스터만)
export async function updateFaq(input: {
  id: number
  question?: string
  answer?: string
}): Promise<ApiResponse<{ faq: Faq }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  const parsed = updateFaqSchema.safeParse(input)
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
      .from(faqs)
      .where(eq(faqs.id, parsed.data.id))
      .get()

    if (!existing) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "FAQ를 찾을 수 없습니다",
      }
    }

    const { id, ...updateFields } = parsed.data
    const row = await db
      .update(faqs)
      .set(updateFields)
      .where(eq(faqs.id, id))
      .returning()
      .get()

    return { data: { faq: row }, error: null, message: "FAQ가 수정되었습니다" }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// deleteFaq — FAQ 삭제 (마스터만)
export async function deleteFaq(input: {
  id: number
}): Promise<ApiResponse<{ id: number }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  const parsed = deleteFaqSchema.safeParse(input)
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
      .from(faqs)
      .where(eq(faqs.id, parsed.data.id))
      .get()

    if (!existing) {
      return {
        data: null,
        error: "NOT_FOUND",
        message: "FAQ를 찾을 수 없습니다",
      }
    }

    await db.delete(faqs).where(eq(faqs.id, parsed.data.id))

    return {
      data: { id: parsed.data.id },
      error: null,
      message: "FAQ가 삭제되었습니다",
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다",
    }
  }
}

// reorderFaqs — FAQ 순서 변경 (마스터만)
export async function reorderFaqs(input: {
  items: Array<{ id: number; sortOrder: number }>
}): Promise<ApiResponse<{ success: boolean }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  if (!ctx.isMaster) {
    return { data: null, error: "FORBIDDEN", message: "권한이 없습니다" }
  }

  const parsed = reorderFaqsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다",
    }
  }

  try {
    await Promise.all(
      parsed.data.items.map((item) =>
        db
          .update(faqs)
          .set({ sortOrder: item.sortOrder })
          .where(eq(faqs.id, item.id))
      )
    )

    return {
      data: { success: true },
      error: null,
      message: "순서가 변경되었습니다",
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
