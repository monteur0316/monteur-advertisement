import { getAuthContext } from "@/src/lib/auth"
import { AccessDenied } from "@/src/components/access-denied"

export default async function AdminPage() {
  const ctx = await getAuthContext()

  if (!ctx.isMaster) {
    return <AccessDenied />
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>
      <p className="text-muted-foreground">
        사용자, 조직 및 시스템 설정을 관리합니다.
      </p>
    </div>
  )
}
