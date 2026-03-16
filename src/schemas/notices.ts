import { z } from "zod"

export const createNoticeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요")
    .max(200, "제목은 200자 이하로 입력해주세요"),
  content: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요")
    .max(10000, "내용은 10000자 이하로 입력해주세요"),
  isPinned: z.boolean().optional().default(false),
})
export type CreateNoticeInput = z.infer<typeof createNoticeSchema>

export const updateNoticeSchema = z.object({
  id: z.number().int().positive("유효하지 않은 공지사항 ID입니다"),
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요")
    .max(200, "제목은 200자 이하로 입력해주세요")
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요")
    .max(10000, "내용은 10000자 이하로 입력해주세요")
    .optional(),
  isPinned: z.boolean().optional(),
})
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>

export const deleteNoticeSchema = z.object({
  id: z.number().int().positive("유효하지 않은 공지사항 ID입니다"),
})
export type DeleteNoticeInput = z.infer<typeof deleteNoticeSchema>
