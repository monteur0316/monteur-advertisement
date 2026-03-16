import { db } from "@/src/db"
import { organizationHierarchy } from "@/src/db/schema/organization-hierarchy"
import { eq, sql } from "drizzle-orm"
import type { OrgType } from "@/src/types/globals"
import type { NewOrganizationHierarchy } from "@/src/db/schema/organization-hierarchy"

const ALLOWED_CHILD_TYPES: Record<string, OrgType[]> = {
  master: ["distributor", "agency", "advertiser"],
  distributor: ["agency"],
  agency: ["advertiser"],
  advertiser: [],
}

const ORG_TYPE_DEPTH: Record<string, number> = {
  master: 0,
  distributor: 1,
  agency: 2,
  advertiser: 3,
}

export async function getOrgHierarchy(clerkOrgId: string) {
  const result = await db
    .select()
    .from(organizationHierarchy)
    .where(eq(organizationHierarchy.clerkOrgId, clerkOrgId))
    .limit(1)

  return result[0] ?? null
}

export async function getChildOrgs(clerkOrgId: string) {
  return db
    .select()
    .from(organizationHierarchy)
    .where(eq(organizationHierarchy.parentClerkOrgId, clerkOrgId))
}

export async function getDescendantOrgIds(clerkOrgId: string): Promise<string[]> {
  const result = await db.all<{ clerk_org_id: string }>(sql`
    WITH RECURSIVE descendants AS (
      SELECT clerk_org_id, parent_clerk_org_id
      FROM organization_hierarchy
      WHERE parent_clerk_org_id = ${clerkOrgId}
      UNION ALL
      SELECT oh.clerk_org_id, oh.parent_clerk_org_id
      FROM organization_hierarchy oh
      INNER JOIN descendants d ON oh.parent_clerk_org_id = d.clerk_org_id
    )
    SELECT clerk_org_id FROM descendants
  `)

  return result.map((r) => r.clerk_org_id)
}

export async function isAncestorOf(
  ancestorOrgId: string,
  descendantOrgId: string
): Promise<boolean> {
  if (ancestorOrgId === descendantOrgId) return true

  const result = await db.all<{ found: number }>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT clerk_org_id, parent_clerk_org_id
      FROM organization_hierarchy
      WHERE clerk_org_id = ${descendantOrgId}
      UNION ALL
      SELECT oh.clerk_org_id, oh.parent_clerk_org_id
      FROM organization_hierarchy oh
      INNER JOIN ancestors a ON oh.clerk_org_id = a.parent_clerk_org_id
    )
    SELECT 1 as found FROM ancestors
    WHERE clerk_org_id = ${ancestorOrgId}
    LIMIT 1
  `)

  return result.length > 0
}

export function getAllowedChildTypes(orgType: OrgType): OrgType[] {
  return ALLOWED_CHILD_TYPES[orgType] ?? []
}

export function getDepthForType(orgType: OrgType): number {
  return ORG_TYPE_DEPTH[orgType] ?? 0
}

export async function createOrgHierarchy(
  data: Omit<NewOrganizationHierarchy, "id" | "createdAt" | "updatedAt" | "depth">
) {
  const depth = getDepthForType(data.orgType as OrgType)
  return db.insert(organizationHierarchy).values({ ...data, depth }).returning()
}

export async function getOrgsByType(orgType: OrgType) {
  return db
    .select()
    .from(organizationHierarchy)
    .where(eq(organizationHierarchy.orgType, orgType))
}

export async function getAllOrgs() {
  return db.select().from(organizationHierarchy)
}
