import { getAuthContext } from "@/src/lib/auth"
import { redirect } from "next/navigation"
import { orgTypeLabel } from "@/src/lib/navigation"
import {
  Building2,
  Megaphone,
  Handshake,
  ShoppingCart,
  BarChart3,
} from "lucide-react"
import {
  getMasterDashboardStats,
  getDistributorDashboardStats,
  getAgencyDashboardStats,
  getAdvertiserDashboardStats,
} from "@/src/actions/dashboard"
import { StatCard } from "@/src/components/dashboard/stat-card"
import { SettlementStatusCard } from "@/src/components/dashboard/settlement-status-card"
import { RecentNoticesCard } from "@/src/components/dashboard/recent-notices-card"
import { ActiveAdsCard } from "@/src/components/dashboard/active-ads-card"
import { OrgCountCard } from "@/src/components/dashboard/org-count-card"

export default async function OrgDashboardPage() {
  const ctx = await getAuthContext()

  if (!ctx.orgId || !ctx.orgSlug) {
    redirect("/org-selection")
  }

  const roleIcon = ctx.orgType === "advertiser" ? Megaphone : Building2
  const RoleIcon = roleIcon

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RoleIcon className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">
            {ctx.orgType ? `${orgTypeLabel[ctx.orgType]} 대시보드` : "대시보드"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ctx.orgType ? orgTypeLabel[ctx.orgType] : ""}
          </p>
        </div>
      </div>

      {ctx.orgType === "master" && (
        <MasterDashboard orgSlug={ctx.orgSlug} />
      )}
      {ctx.orgType === "distributor" && (
        <DistributorDashboard orgSlug={ctx.orgSlug} />
      )}
      {ctx.orgType === "agency" && (
        <AgencyDashboard orgSlug={ctx.orgSlug} />
      )}
      {ctx.orgType === "advertiser" && (
        <AdvertiserDashboard orgSlug={ctx.orgSlug} />
      )}
    </div>
  )
}

async function MasterDashboard({ orgSlug }: { orgSlug: string }) {
  const stats = await getMasterDashboardStats()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="총판사"
          value={stats.orgCounts.distributor}
          icon={Building2}
          description="등록된 총판사"
        />
        <StatCard
          title="대행사"
          value={stats.orgCounts.agency}
          icon={Handshake}
          description="등록된 대행사"
        />
        <StatCard
          title="광고주"
          value={stats.orgCounts.advertiser}
          icon={Megaphone}
          description="등록된 광고주"
        />
        <StatCard
          title="전체 광고"
          value={stats.totalAds}
          icon={ShoppingCart}
          description="등록된 광고 수"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettlementStatusCard {...stats.settlementsByStatus} />
        <RecentNoticesCard notices={stats.recentNotices} orgSlug={orgSlug} />
      </div>
    </div>
  )
}

async function DistributorDashboard({ orgSlug }: { orgSlug: string }) {
  const stats = await getDistributorDashboardStats()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="하위 대행사"
          value={stats.childAgencyCount}
          icon={Handshake}
          description="관리 중인 대행사"
        />
        <StatCard
          title="전체 광고"
          value={stats.totalAds}
          icon={ShoppingCart}
          description="하위 조직 포함"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettlementStatusCard {...stats.settlementsByStatus} />
        <RecentNoticesCard notices={stats.recentNotices} orgSlug={orgSlug} />
      </div>
    </div>
  )
}

async function AgencyDashboard({ orgSlug }: { orgSlug: string }) {
  const stats = await getAgencyDashboardStats()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="하위 광고주"
          value={stats.childAdvertiserCount}
          icon={Megaphone}
          description="관리 중인 광고주"
        />
        <StatCard
          title="활성 광고"
          value={stats.activeAdsCount}
          icon={BarChart3}
          description="진행 중인 광고"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettlementStatusCard {...stats.settlementsByStatus} />
        <RecentNoticesCard notices={stats.recentNotices} orgSlug={orgSlug} />
      </div>
    </div>
  )
}

async function AdvertiserDashboard({ orgSlug }: { orgSlug: string }) {
  const stats = await getAdvertiserDashboardStats()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="활성 광고"
          value={stats.activeAdsCount}
          icon={BarChart3}
          description="진행 중인 광고"
        />
        <StatCard
          title="전체 광고"
          value={stats.totalAdsCount}
          icon={ShoppingCart}
          description="등록된 광고 수"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActiveAdsCard ads={stats.activeAds} orgSlug={orgSlug} />
        <SettlementStatusCard {...stats.settlementsByStatus} />
      </div>
      <RecentNoticesCard notices={stats.recentNotices} orgSlug={orgSlug} />
    </div>
  )
}
