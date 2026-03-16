import { getAuthContext } from "@/src/lib/auth"
import { getAds } from "@/src/actions/ads"
import { redirect } from "next/navigation"
import { AdsTable } from "./_components/ads-table"
import { CreateAdDialog } from "./_components/create-ad-dialog"

export default async function OrgAdsPage() {
  const ctx = await getAuthContext()

  if (!ctx.orgId) {
    redirect("/org-selection")
  }

  const result = await getAds({ orgId: ctx.orgId })
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">광고 관리</h1>
          <CreateAdDialog />
        </div>
        <p className="text-sm text-muted-foreground">
          광고를 등록하고 관리합니다.
        </p>
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : (
        <AdsTable ads={result.data?.ads ?? []} />
      )}
    </div>
  )
}
