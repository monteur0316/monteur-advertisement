"use strict"

import { z } from "zod"

export const orgTypeSchema = z.enum(["master", "distributor", "agency", "advertiser"])
export type OrgType = z.infer<typeof orgTypeSchema>

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  orgType: orgTypeSchema,
  parentOrgId: z.string().optional(),
}).refine(
  (data) => data.orgType === "master" || !!data.parentOrgId,
  { message: "Parent organization is required for non-master types", path: ["parentOrgId"] }
)
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const createChildAccountSchema = z.object({
  orgName: z.string().min(2, "조직명은 2자 이상이어야 합니다"),
  username: z
    .string()
    .min(4, "아이디는 4자 이상이어야 합니다")
    .max(30, "아이디는 30자 이하여야 합니다")
    .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문, 숫자, 밑줄만 사용 가능합니다"),
  password: z.string().min(7, "비밀번호는 7자 이상이어야 합니다"),
  firstName: z.string().min(1, "이름을 입력해주세요"),
  adQuantity: z.coerce.number().int().min(0, "광고수량은 0 이상이어야 합니다").default(0),
  memo: z.string().optional(),
})
export type CreateChildAccountInput = z.infer<typeof createChildAccountSchema>
