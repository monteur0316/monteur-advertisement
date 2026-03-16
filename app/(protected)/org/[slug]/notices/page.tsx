import { getAuthContext } from "@/src/lib/auth"
import { getNotices } from "@/src/actions/notices"
import { redirect } from "next/navigation"
import { NoticeTable } from "./_components/notice-table"
import { CreateNoticeDialog } from "./_components/create-notice-dialog"

export default async function OrgNoticesPage() {
  const ctx = await getAuthContext()

  if (!ctx.orgId) {
    redirect("/org-selection")
  }

  const result = await getNotices({ orgId: ctx.orgId })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공지사항</h1>
          <p className="text-sm text-muted-foreground">
            조직의 공지사항을 확인합니다.
          </p>
        </div>
        {ctx.isMaster && <CreateNoticeDialog />}
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : (
        <NoticeTable notices={result.data?.notices ?? []} isMaster={ctx.isMaster} />
      )}
    </div>
  )
}
