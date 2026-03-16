import { getAuthContext } from "@/src/lib/auth"
import { getSettlements } from "@/src/actions/settlements"
import { redirect } from "next/navigation"
import { SettlementsTable } from "./_components/settlements-table"

export default async function OrgSettlementsPage() {
  const ctx = await getAuthContext()

  if (!ctx.orgId) {
    redirect("/org-selection")
  }

  const result = await getSettlements({ orgId: ctx.orgId })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">정산관리</h1>
        <p className="text-sm text-muted-foreground">
          광고 기록을 바탕으로 정산 내역을 확인합니다.
        </p>
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : (
        <SettlementsTable settlements={result.data?.settlements ?? []} />
      )}
    </div>
  )
}
