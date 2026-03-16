"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { createOrganizationSchema, createChildAccountSchema } from "@/src/schemas/organization"
import type { OrgType } from "@/src/types/globals"
import { getAuthContext } from "@/src/lib/auth"
import {
  getOrgHierarchy,
  getChildOrgs,
  getDescendantOrgIds,
  getAllowedChildTypes,
  createOrgHierarchy,
  isAncestorOf,
  getAllOrgs,
} from "@/src/db/queries/organization-hierarchy"

type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}

export async function createOrganizationWithType(input: {
  name: string
  orgType: OrgType
  parentOrgId?: string
}): Promise<ApiResponse<{ orgId: string; slug: string }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    return { data: null, error: "UNAUTHORIZED", message: "Not authenticated" }
  }

  if (!ctx.orgId || !ctx.orgType) {
    return { data: null, error: "FORBIDDEN", message: "Organization access required" }
  }

  // Validate parent-child type relationship
  const allowedChildTypes = getAllowedChildTypes(ctx.orgType)
  if (!allowedChildTypes.includes(input.orgType)) {
    return {
      data: null,
      error: "FORBIDDEN",
      message: `${ctx.orgType} cannot create ${input.orgType} organizations`,
    }
  }

  const parsed = createOrganizationSchema.safeParse({
    ...input,
    parentOrgId: input.parentOrgId ?? ctx.orgId,
  })
  if (!parsed.success) {
    return {
      data: null,
      error: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    }
  }

  try {
    const client = await clerkClient()
    const org = await client.organizations.createOrganization({
      name: parsed.data.name,
      createdBy: ctx.userId,
    })

    await client.organizations.updateOrganizationMetadata(org.id, {
      publicMetadata: { orgType: parsed.data.orgType },
    })

    // Insert hierarchy record
    await createOrgHierarchy({
      clerkOrgId: org.id,
      orgType: parsed.data.orgType,
      parentClerkOrgId: parsed.data.parentOrgId ?? null,
    })

    return {
      data: { orgId: org.id, slug: org.slug! },
      error: null,
      message: "Organization created successfully",
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "Failed to create organization",
    }
  }
}

export async function getOrganizationList(input?: {
  limit?: number
  offset?: number
}): Promise<
  ApiResponse<{
    organizations: Array<{
      id: string
      name: string
      slug: string
      orgType: OrgType | null
      parentClerkOrgId: string | null
      membersCount: number | null
      createdAt: number
    }>
    totalCount: number
  }>
> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "Not authenticated" }
  }

  try {
    // Get org IDs this user can see based on hierarchy
    let visibleOrgIds: string[]

    if (ctx.isMaster) {
      // Master sees all
      const allOrgs = await getAllOrgs()
      visibleOrgIds = allOrgs.map((o) => o.clerkOrgId)
    } else {
      // Non-master sees self + descendants
      const descendantIds = await getDescendantOrgIds(ctx.orgId)
      visibleOrgIds = [ctx.orgId, ...descendantIds]
    }

    const client = await clerkClient()
    const response = await client.organizations.getOrganizationList({
      limit: input?.limit ?? 20,
      offset: input?.offset ?? 0,
    })

    // Build hierarchy lookup
    const hierarchyMap = new Map<string, { orgType: OrgType | null; parentClerkOrgId: string | null }>()
    for (const orgId of visibleOrgIds) {
      const h = await getOrgHierarchy(orgId)
      if (h) {
        hierarchyMap.set(orgId, { orgType: h.orgType as OrgType, parentClerkOrgId: h.parentClerkOrgId })
      }
    }

    const organizations = response.data
      .filter((org) => visibleOrgIds.includes(org.id))
      .map((org) => {
        const hierarchy = hierarchyMap.get(org.id)
        return {
          id: org.id,
          name: org.name,
          slug: org.slug!,
          orgType: hierarchy?.orgType ?? null,
          parentClerkOrgId: hierarchy?.parentClerkOrgId ?? null,
          membersCount: org.membersCount ?? null,
          createdAt: org.createdAt,
        }
      })

    return {
      data: { organizations, totalCount: organizations.length },
      error: null,
      message: null,
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "Failed to fetch organization list",
    }
  }
}

export async function createChildOrgAccount(input: {
  orgName: string
  username: string
  password: string
  firstName: string
  childOrgType?: OrgType
  adQuantity?: number
  memo?: string
}): Promise<ApiResponse<{ orgId: string; userId: string }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId || !ctx.orgType) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  const allowedChildTypes = getAllowedChildTypes(ctx.orgType)
  if (allowedChildTypes.length === 0) {
    return {
      data: null,
      error: "FORBIDDEN",
      message: "하위 계정을 생성할 수 없는 조직 유형입니다",
    }
  }

  // Master can choose child type; others use the single allowed type
  const allowedChildType = input.childOrgType && allowedChildTypes.includes(input.childOrgType)
    ? input.childOrgType
    : allowedChildTypes[0]

  const parsed = createChildAccountSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다",
    }
  }

  const client = await clerkClient()
  let createdUserId: string | null = null
  let createdOrgId: string | null = null

  try {
    // 1. Create Clerk user
    const user = await client.users.createUser({
      username: parsed.data.username,
      password: parsed.data.password,
      firstName: parsed.data.firstName,
      privateMetadata: { initialPassword: parsed.data.password },
    })
    createdUserId = user.id

    // 2. Create Clerk organization
    const org = await client.organizations.createOrganization({
      name: parsed.data.orgName,
      createdBy: user.id,
    })
    createdOrgId = org.id

    // 3. Set org metadata
    await client.organizations.updateOrganizationMetadata(org.id, {
      publicMetadata: { orgType: allowedChildType },
    })

    // 4. Update membership role to admin (createdBy already adds as member)
    await client.organizations.updateOrganizationMembership({
      organizationId: org.id,
      userId: user.id,
      role: "org:admin",
    })

    // 5. Create hierarchy record
    await createOrgHierarchy({
      clerkOrgId: org.id,
      orgType: allowedChildType,
      parentClerkOrgId: ctx.orgId,
      adQuantity: parsed.data.adQuantity ?? 0,
      memo: parsed.data.memo ?? null,
    })

    return {
      data: { orgId: org.id, userId: user.id },
      error: null,
      message: "계정이 생성되었습니다",
    }
  } catch (err) {
    // Rollback: clean up partially created resources
    try {
      if (createdOrgId) {
        await client.organizations.deleteOrganization(createdOrgId)
      }
      if (createdUserId) {
        await client.users.deleteUser(createdUserId)
      }
    } catch {
      // Ignore rollback errors
    }

    console.error("[createChildOrgAccount] Error:", JSON.stringify(err, null, 2))
    if (err && typeof err === "object" && "errors" in err) {
      console.error("[createChildOrgAccount] Clerk errors:", JSON.stringify((err as { errors: unknown }).errors, null, 2))
    }

    let message = "계정 생성에 실패했습니다"
    const clerkErrors = err && typeof err === "object" && "errors" in err
      ? (err as { errors: Array<{ code: string; message: string }> }).errors
      : []

    const firstCode = clerkErrors[0]?.code
    if (firstCode === "form_identifier_exists" || firstCode === "form_param_value_invalid") {
      message = "이미 사용 중인 아이디입니다"
    } else if (firstCode === "form_password_pwned") {
      message = "보안에 취약한 비밀번호입니다. 다른 비밀번호를 사용해주세요."
    } else if (firstCode === "form_password_length_too_short") {
      message = "비밀번호는 8자 이상이어야 합니다"
    } else if (firstCode?.startsWith("form_password")) {
      message = "비밀번호 조건이 맞지 않습니다"
    }

    return { data: null, error: "INTERNAL_ERROR", message }
  }
}

export async function getChildOrgAccounts(): Promise<
  ApiResponse<{
    accounts: Array<{
      orgId: string
      orgName: string
      orgSlug: string
      orgType: OrgType
      parentOrgName: string | null
      userId: string
      username: string
      password: string
      firstName: string | null
      adQuantity: number
      memo: string | null
      createdAt: number
    }>
  }>
> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  try {
    // Master sees all descendants, others see direct children only
    let targetOrgs: Awaited<ReturnType<typeof getChildOrgs>>
    if (ctx.isMaster) {
      const descendantIds = await getDescendantOrgIds(ctx.orgId)
      if (descendantIds.length === 0) {
        return { data: { accounts: [] }, error: null, message: null }
      }
      // Fetch hierarchy records for all descendants
      const allOrgs = await getAllOrgs()
      targetOrgs = allOrgs.filter((o) => descendantIds.includes(o.clerkOrgId))
    } else {
      targetOrgs = await getChildOrgs(ctx.orgId)
    }

    if (targetOrgs.length === 0) {
      return { data: { accounts: [] }, error: null, message: null }
    }

    const client = await clerkClient()

    // Build parent org name lookup
    const parentOrgIds = [...new Set(targetOrgs.map((o) => o.parentClerkOrgId).filter(Boolean))] as string[]
    const parentOrgNames = new Map<string, string>()
    for (const parentId of parentOrgIds) {
      try {
        const parentOrg = await client.organizations.getOrganization({ organizationId: parentId })
        parentOrgNames.set(parentId, parentOrg.name)
      } catch {
        parentOrgNames.set(parentId, "-")
      }
    }

    const accounts = await Promise.all(
      targetOrgs.map(async (hierarchy) => {
        const org = await client.organizations.getOrganization({
          organizationId: hierarchy.clerkOrgId,
        })

        const memberships =
          await client.organizations.getOrganizationMembershipList({
            organizationId: hierarchy.clerkOrgId,
          })

        const adminMembership = memberships.data[0]
        let username = ""
        let firstName: string | null = null
        let password = ""

        if (adminMembership?.publicUserData?.userId) {
          const user = await client.users.getUser(
            adminMembership.publicUserData.userId
          )
          username = user.username ?? ""
          firstName = user.firstName
          password = (user.privateMetadata as { initialPassword?: string })?.initialPassword ?? ""
        }

        return {
          orgId: hierarchy.clerkOrgId,
          orgName: org.name,
          orgSlug: org.slug ?? "",
          orgType: hierarchy.orgType as OrgType,
          parentOrgName: hierarchy.parentClerkOrgId
            ? parentOrgNames.get(hierarchy.parentClerkOrgId) ?? null
            : null,
          userId: adminMembership?.publicUserData?.userId ?? "",
          username,
          password,
          firstName,
          adQuantity: hierarchy.adQuantity ?? 0,
          memo: hierarchy.memo ?? null,
          createdAt: org.createdAt,
        }
      })
    )

    return { data: { accounts }, error: null, message: null }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "하위 계정 목록을 불러오는데 실패했습니다",
    }
  }
}

export async function deleteChildOrgAccount(input: {
  orgId: string
}): Promise<ApiResponse<{ success: boolean }>> {
  const ctx = await getAuthContext()

  if (!ctx.userId || !ctx.orgId) {
    return { data: null, error: "UNAUTHORIZED", message: "인증이 필요합니다" }
  }

  // Verify the target is a direct child of the current org
  const hierarchy = await getOrgHierarchy(input.orgId)
  if (!hierarchy || hierarchy.parentClerkOrgId !== ctx.orgId) {
    return {
      data: null,
      error: "FORBIDDEN",
      message: "이 조직을 삭제할 권한이 없습니다",
    }
  }

  // Check for grandchildren — cannot delete if children exist
  const children = await getChildOrgs(input.orgId)
  if (children.length > 0) {
    return {
      data: null,
      error: "HAS_CHILDREN",
      message: "하위 조직이 있는 계정은 삭제할 수 없습니다",
    }
  }

  try {
    const client = await clerkClient()

    // Delete all members (users) of the org
    const memberships =
      await client.organizations.getOrganizationMembershipList({
        organizationId: input.orgId,
      })

    for (const membership of memberships.data) {
      if (membership.publicUserData?.userId) {
        await client.users.deleteUser(membership.publicUserData.userId)
      }
    }

    // Delete the organization
    await client.organizations.deleteOrganization(input.orgId)

    // Delete hierarchy record
    const { eq } = await import("drizzle-orm")
    const { db } = await import("@/src/db")
    const { organizationHierarchy } = await import(
      "@/src/db/schema/organization-hierarchy"
    )
    await db
      .delete(organizationHierarchy)
      .where(eq(organizationHierarchy.clerkOrgId, input.orgId))

    return {
      data: { success: true },
      error: null,
      message: "계정이 삭제되었습니다",
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "계정 삭제에 실패했습니다",
    }
  }
}
