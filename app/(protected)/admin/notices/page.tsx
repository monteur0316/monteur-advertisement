import { getAuthContext } from "@/src/lib/auth"
import { redirect } from "next/navigation"
import { AccessDenied } from "@/src/components/access-denied"
import { getAllNotices } from "@/src/actions/notices"
import { AllNoticesTable } from "./_components/all-notices-table"
import { AdminCreateNoticeDialog } from "./_components/admin-create-notice-dialog"

export default async function AdminNoticesPage() {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    redirect("/sign-in")
  }

  if (!ctx.isMaster) {
    return <AccessDenied />
  }

  const result = await getAllNotices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공지사항</h1>
          <p className="text-sm text-muted-foreground">
            전체 조직의 공지사항을 조회합니다.
          </p>
        </div>
        <AdminCreateNoticeDialog />
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : (
        <AllNoticesTable notices={result.data?.notices ?? []} />
      )}
    </div>
  )
}
