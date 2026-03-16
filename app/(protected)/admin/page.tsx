import { getAuthContext } from "@/src/lib/auth"
import { AccessDenied } from "@/src/components/access-denied"
import { getMasterDashboardStats } from "@/src/actions/dashboard"
import { Building2, Handshake, Megaphone, ShoppingCart } from "lucide-react"
import { StatCard } from "@/src/components/dashboard/stat-card"
import { SettlementStatusCard } from "@/src/components/dashboard/settlement-status-card"
import { OrgCountCard } from "@/src/components/dashboard/org-count-card"

export default async function AdminPage() {
  const ctx = await getAuthContext()

  if (!ctx.isMaster) {
    return <AccessDenied />
  }

  const stats = await getMasterDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="text-sm text-muted-foreground">
          사용자, 조직 및 시스템 설정을 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="총판사"
          value={stats.orgCounts.distributor}
          icon={Building2}
        />
        <StatCard
          title="대행사"
          value={stats.orgCounts.agency}
          icon={Handshake}
        />
        <StatCard
          title="광고주"
          value={stats.orgCounts.advertiser}
          icon={Megaphone}
        />
        <StatCard
          title="전체 광고"
          value={stats.totalAds}
          icon={ShoppingCart}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OrgCountCard counts={stats.orgCounts} />
        <SettlementStatusCard {...stats.settlementsByStatus} />
      </div>
    </div>
  )
}
