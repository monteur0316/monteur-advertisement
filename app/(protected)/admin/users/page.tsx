import { getAuthContext } from "@/src/lib/auth"
import { redirect } from "next/navigation"
import { getUserList } from "@/src/actions/user"
import { UserTable } from "./_components/user-table"
import { AccessDenied } from "@/src/components/access-denied"

export default async function AdminUsersPage() {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    redirect("/sign-in")
  }

  if (!ctx.isMaster) {
    return <AccessDenied />
  }

  const result = await getUserList({ limit: 50 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-sm text-muted-foreground">
          사용자 목록을 조회합니다.
        </p>
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : (
        <UserTable
          users={result.data?.users ?? []}
          currentUserId={ctx.userId}
        />
      )}
    </div>
  )
}
