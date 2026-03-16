import { auth } from "@clerk/nextjs/server"
import type { OrgType } from "@/src/types/globals"
import { isAncestorOf } from "@/src/db/queries/organization-hierarchy"

/** Clerk JWT may serialize booleans as strings */
export function isTruthy(value: unknown): boolean {
  return value === true || value === "true"
}

export interface AuthContext {
  userId: string | null
  orgId: string | null
  orgSlug: string | null
  orgType: OrgType | null
  isMaster: boolean
  isOrgMember: boolean
}

export async function getAuthContext(): Promise<AuthContext> {
  const { userId, orgId, orgSlug, sessionClaims } = await auth()
  const orgType = (sessionClaims?.orgType as OrgType) ?? null

  return {
    userId,
    orgId: orgId ?? null,
    orgSlug: orgSlug ?? null,
    orgType,
    isMaster: orgType === "master",
    isOrgMember: !!orgId,
  }
}

export async function requireMaster(): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx.isMaster) {
    throw new Error("Access denied: master organization required")
  }
  return ctx
}

export async function requireOrgAccess(slug?: string): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx.orgId) {
    throw new Error("Access denied: organization required")
  }
  if (slug && ctx.orgSlug !== slug) {
    throw new Error("Access denied: organization mismatch")
  }
  return ctx
}

export async function requireHierarchyAccess(targetOrgId: string): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx.orgId) {
    throw new Error("Access denied: organization required")
  }
  const hasAccess = await isAncestorOf(ctx.orgId, targetOrgId)
  if (!hasAccess) {
    throw new Error("Access denied: no hierarchy access to target organization")
  }
  return ctx
}

export async function requireOrgTypes(types: OrgType[]): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx.orgType || !types.includes(ctx.orgType)) {
    throw new Error(`Access denied: requires one of [${types.join(", ")}]`)
  }
  return ctx
}
