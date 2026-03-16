import { z } from "zod"

export const createFaqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "질문을 입력해주세요")
    .max(200, "질문은 200자 이하로 입력해주세요"),
  answer: z
    .string()
    .trim()
    .min(1, "답변을 입력해주세요")
    .max(2000, "답변은 2000자 이하로 입력해주세요"),
})
export type CreateFaqInput = z.infer<typeof createFaqSchema>

export const updateFaqSchema = z.object({
  id: z.number().int().positive("유효하지 않은 FAQ ID입니다"),
  question: z
    .string()
    .trim()
    .min(1, "질문을 입력해주세요")
    .max(200, "질문은 200자 이하로 입력해주세요")
    .optional(),
  answer: z
    .string()
    .trim()
    .min(1, "답변을 입력해주세요")
    .max(2000, "답변은 2000자 이하로 입력해주세요")
    .optional(),
})
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>

export const deleteFaqSchema = z.object({
  id: z.number().int().positive("유효하지 않은 FAQ ID입니다"),
})
export type DeleteFaqInput = z.infer<typeof deleteFaqSchema>

export const reorderFaqsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive("유효하지 않은 FAQ ID입니다"),
        sortOrder: z.number().int().min(0, "정렬 순서는 0 이상이어야 합니다"),
      })
    )
    .min(1, "순서를 변경할 항목이 필요합니다"),
})
export type ReorderFaqsInput = z.infer<typeof reorderFaqsSchema>
