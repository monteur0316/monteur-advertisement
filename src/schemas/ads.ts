import { z } from "zod"

export const createAdSchema = z
  .object({
    quantity: z
      .number()
      .int("수량은 정수로 입력해주세요")
      .positive("수량은 1 이상이어야 합니다"),
    days: z
      .number()
      .int("일수는 정수로 입력해주세요")
      .positive("일수는 1 이상이어야 합니다"),
    workStartDate: z.string().min(1, "작업시작일을 선택해주세요"),
    workEndDate: z.string().min(1, "작업종료일을 선택해주세요"),
    productUrl: z
      .string()
      .trim()
      .min(1, "상품 URL을 입력해주세요")
      .url("유효한 URL을 입력해주세요"),
    priceCompareUrl: z
      .string()
      .trim()
      .url("유효한 URL을 입력해주세요")
      .optional()
      .or(z.literal("")),
    mainKeyword: z
      .string()
      .trim()
      .min(1, "메인키워드를 입력해주세요")
      .max(100, "메인키워드는 100자 이하로 입력해주세요"),
    memo: z
      .string()
      .trim()
      .max(2000, "메모는 2000자 이하로 입력해주세요")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.workStartDate || !data.workEndDate) return true
      return new Date(data.workEndDate) >= new Date(data.workStartDate)
    },
    {
      message: "작업종료일은 작업시작일 이후여야 합니다",
      path: ["workEndDate"],
    }
  )
export type CreateAdInput = z.infer<typeof createAdSchema>

export const updateAdSchema = z
  .object({
    id: z.number().int().positive("유효하지 않은 광고 ID입니다"),
    quantity: z
      .number()
      .int("수량은 정수로 입력해주세요")
      .positive("수량은 1 이상이어야 합니다")
      .optional(),
    days: z
      .number()
      .int("일수는 정수로 입력해주세요")
      .positive("일수는 1 이상이어야 합니다")
      .optional(),
    workStartDate: z.string().min(1).optional(),
    workEndDate: z.string().min(1).optional(),
    productUrl: z
      .string()
      .trim()
      .min(1, "상품 URL을 입력해주세요")
      .url("유효한 URL을 입력해주세요")
      .optional(),
    priceCompareUrl: z
      .string()
      .trim()
      .url("유효한 URL을 입력해주세요")
      .optional()
      .or(z.literal("")),
    mainKeyword: z
      .string()
      .trim()
      .min(1, "메인키워드를 입력해주세요")
      .max(100, "메인키워드는 100자 이하로 입력해주세요")
      .optional(),
    memo: z
      .string()
      .trim()
      .max(2000, "메모는 2000자 이하로 입력해주세요")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.workStartDate || !data.workEndDate) return true
      return new Date(data.workEndDate) >= new Date(data.workStartDate)
    },
    {
      message: "작업종료일은 작업시작일 이후여야 합니다",
      path: ["workEndDate"],
    }
  )
export type UpdateAdInput = z.infer<typeof updateAdSchema>

export const extendAdSchema = z.object({
  id: z.number().int().positive("유효하지 않은 광고 ID입니다"),
  additionalDays: z
    .number()
    .int("연장 일수는 정수로 입력해주세요")
    .positive("연장 일수는 1 이상이어야 합니다"),
})
export type ExtendAdInput = z.infer<typeof extendAdSchema>

export const deleteAdSchema = z.object({
  id: z.number().int().positive("유효하지 않은 광고 ID입니다"),
})
export type DeleteAdInput = z.infer<typeof deleteAdSchema>
