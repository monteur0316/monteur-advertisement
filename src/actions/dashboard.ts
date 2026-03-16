"use server"

import { db } from "@/src/db"
import { ads } from "@/src/db/schema/ads"
import { settlements } from "@/src/db/schema/settlements"
import { notices } from "@/src/db/schema/notices"
import { organizationHierarchy } from "@/src/db/schema/organization-hierarchy"
import { and, count, eq, desc, inArray, gte, or } from "drizzle-orm"
import { getAuthContext } from "@/src/lib/auth"
import {
  getDescendantOrgIds,
  getChildOrgs,
  getOrgHierarchy,
} from "@/src/db/queries/organization-hierarchy"

type SettlementsByStatus = {
  pending: number
  confirmed: number
  refunded: number
}

type RecentNotice = {
  id: number
  title: string
  isPinned: boolean
  createdAt: Date
}

export type MasterDashboardStats = {
  orgCounts: { distributor: number; agency: number; advertiser: number }
  totalAds: number
  settlementsByStatus: SettlementsByStatus
  recentNotices: RecentNotice[]
}

export type DistributorDashboardStats = {
  childAgencyCount: number
  totalAds: number
  settlementsByStatus: SettlementsByStatus
  recentNotices: RecentNotice[]
}

export type AgencyDashboardStats = {
  childAdvertiserCount: number
  activeAdsCount: number
  settlementsByStatus: SettlementsByStatus
  recentNotices: RecentNotice[]
}

export type AdvertiserDashboardStats = {
  activeAds: {
    id: number
    mainKeyword: string
    quantity: number
    workEndDate: Date
  }[]
  totalAdsCount: number
  activeAdsCount: number
  settlementsByStatus: SettlementsByStatus
  adQuota: number
  recentNotices: RecentNotice[]
}

async function getSettlementCounts(orgIds: string[]): Promise<SettlementsByStatus> {
  if (orgIds.length === 0) {
    return { pending: 0, confirmed: 0, refunded: 0 }
  }

  const rows = await db
    .select({
      status: settlements.status,
      count: count(),
    })
    .from(settlements)
    .where(inArray(settlements.orgId, orgIds))
    .groupBy(settlements.status)

  const result: SettlementsByStatus = { pending: 0, confirmed: 0, refunded: 0 }
  for (const row of rows) {
    if (row.status === "pending" || row.status === "confirmed" || row.status === "refunded") {
      result[row.status] = row.count
    }
  }
  return result
}

async function getRecentNoticesForOrg(orgId: string): Promise<RecentNotice[]> {
  const rows = await db
    .select({
      id: notices.id,
      title: notices.title,
      isPinned: notices.isPinned,
      createdAt: notices.createdAt,
    })
    .from(notices)
    .where(or(eq(notices.orgId, orgId), eq(notices.orgId, "__all__")))
    .orderBy(desc(notices.isPinned), desc(notices.createdAt))
    .limit(5)

  return rows
}

export async function getMasterDashboardStats(): Promise<MasterDashboardStats> {
  const ctx = await getAuthContext()
  if (!ctx.isMaster || !ctx.orgId) {
    throw new Error("Access denied")
  }

  const [orgCountRows, totalAdsResult, settlementRows, recentNotices] = await Promise.all([
    db
      .select({
        orgType: organizationHierarchy.orgType,
        count: count(),
      })
      .from(organizationHierarchy)
      .groupBy(organizationHierarchy.orgType),
    db.select({ count: count() }).from(ads),
    db
      .select({
        status: settlements.status,
        count: count(),
      })
      .from(settlements)
      .groupBy(settlements.status),
    db
      .select({
        id: notices.id,
        title: notices.title,
        isPinned: notices.isPinned,
        createdAt: notices.createdAt,
      })
      .from(notices)
      .orderBy(desc(notices.isPinned), desc(notices.createdAt))
      .limit(5),
  ])

  const orgCounts = { distributor: 0, agency: 0, advertiser: 0 }
  for (const row of orgCountRows) {
    if (row.orgType === "distributor" || row.orgType === "agency" || row.orgType === "advertiser") {
      orgCounts[row.orgType] = row.count
    }
  }

  const settlementsByStatus: SettlementsByStatus = { pending: 0, confirmed: 0, refunded: 0 }
  for (const row of settlementRows) {
    if (row.status === "pending" || row.status === "confirmed" || row.status === "refunded") {
      settlementsByStatus[row.status] = row.count
    }
  }

  return {
    orgCounts,
    totalAds: totalAdsResult[0]?.count ?? 0,
    settlementsByStatus,
    recentNotices,
  }
}

export async function getDistributorDashboardStats(): Promise<DistributorDashboardStats> {
  const ctx = await getAuthContext()
  if (!ctx.orgId || ctx.orgType !== "distributor") {
    throw new Error("Access denied")
  }

  const [childOrgs, descendantIds] = await Promise.all([
    getChildOrgs(ctx.orgId),
    getDescendantOrgIds(ctx.orgId),
  ])

  const allOrgIds = [ctx.orgId, ...descendantIds]

  const [totalAdsResult, settlementsByStatus, recentNotices] = await Promise.all([
    descendantIds.length > 0
      ? db.select({ count: count() }).from(ads).where(inArray(ads.orgId, allOrgIds))
      : Promise.resolve([{ count: 0 }]),
    getSettlementCounts(allOrgIds),
    getRecentNoticesForOrg(ctx.orgId),
  ])

  return {
    childAgencyCount: childOrgs.length,
    totalAds: totalAdsResult[0]?.count ?? 0,
    settlementsByStatus,
    recentNotices,
  }
}

export async function getAgencyDashboardStats(): Promise<AgencyDashboardStats> {
  const ctx = await getAuthContext()
  if (!ctx.orgId || ctx.orgType !== "agency") {
    throw new Error("Access denied")
  }

  const childOrgs = await getChildOrgs(ctx.orgId)
  const childIds = childOrgs.map((o) => o.clerkOrgId)
  const allOrgIds = [ctx.orgId, ...childIds]

  const now = new Date()

  const [activeAdsResult, settlementsByStatus, recentNotices] = await Promise.all([
    allOrgIds.length > 0
      ? db
          .select({ count: count() })
          .from(ads)
          .where(and(inArray(ads.orgId, allOrgIds), gte(ads.workEndDate, now)))
      : Promise.resolve([{ count: 0 }]),
    getSettlementCounts(allOrgIds),
    getRecentNoticesForOrg(ctx.orgId),
  ])

  return {
    childAdvertiserCount: childOrgs.length,
    activeAdsCount: activeAdsResult[0]?.count ?? 0,
    settlementsByStatus,
    recentNotices,
  }
}

export async function getAdvertiserDashboardStats(): Promise<AdvertiserDashboardStats> {
  const ctx = await getAuthContext()
  if (!ctx.orgId || ctx.orgType !== "advertiser") {
    throw new Error("Access denied")
  }

  const now = new Date()

  const [activeAdsRows, totalAdsResult, activeAdsCountResult, settlementsByStatus, orgHierarchy, recentNotices] =
    await Promise.all([
      db
        .select({
          id: ads.id,
          mainKeyword: ads.mainKeyword,
          quantity: ads.quantity,
          workEndDate: ads.workEndDate,
        })
        .from(ads)
        .where(and(eq(ads.orgId, ctx.orgId), gte(ads.workEndDate, now)))
        .orderBy(desc(ads.createdAt))
        .limit(5),
      db.select({ count: count() }).from(ads).where(eq(ads.orgId, ctx.orgId)),
      db
        .select({ count: count() })
        .from(ads)
        .where(and(eq(ads.orgId, ctx.orgId), gte(ads.workEndDate, now))),
      getSettlementCounts([ctx.orgId]),
      getOrgHierarchy(ctx.orgId),
      getRecentNoticesForOrg(ctx.orgId),
    ])

  return {
    activeAds: activeAdsRows,
    totalAdsCount: totalAdsResult[0]?.count ?? 0,
    activeAdsCount: activeAdsCountResult[0]?.count ?? 0,
    settlementsByStatus,
    adQuota: orgHierarchy?.adQuantity ?? 0,
    recentNotices,
  }
}
