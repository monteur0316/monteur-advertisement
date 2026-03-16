import { getAuthContext } from "@/src/lib/auth"
import { redirect } from "next/navigation"
import { Megaphone, Building2 } from "lucide-react"

export default async function OrgDashboardPage() {
  const ctx = await getAuthContext()

  if (!ctx.orgId) {
    redirect("/org-selection")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {ctx.orgType === "advertiser" ? (
          <Megaphone className="size-6 text-muted-foreground" />
        ) : (
          <Building2 className="size-6 text-muted-foreground" />
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {ctx.orgType === "advertiser"
              ? "광고주 대시보드"
              : ctx.orgType === "agency"
                ? "대행사 대시보드"
                : "대시보드"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ctx.orgType === "master" ? "마스터" : ctx.orgType === "distributor" ? "총판사" : ctx.orgType === "agency" ? "대행사" : ctx.orgType === "advertiser" ? "광고주" : ""}
          </p>
        </div>
      </div>

      {ctx.orgType === "advertiser" && (
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">광고주 개요</h2>
          <p className="text-sm text-muted-foreground">
            광고 캠페인과 성과 지표를 관리합니다.
          </p>
        </div>
      )}

      {ctx.orgType === "agency" && (
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">대행사 개요</h2>
          <p className="text-sm text-muted-foreground">
            클라이언트 계정과 캠페인 운영을 관리합니다.
          </p>
        </div>
      )}
    </div>
  )
}
