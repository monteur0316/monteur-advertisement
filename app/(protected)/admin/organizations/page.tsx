import { getAuthContext } from "@/src/lib/auth"
import { getOrganizationList } from "@/src/actions/organization"
import { AccessDenied } from "@/src/components/access-denied"
import { OrgTable } from "./_components/org-table"
import { CreateOrganization } from "./_components/create-organization"

export default async function AdminOrganizationsPage() {
  const ctx = await getAuthContext()

  if (!ctx.isMaster) {
    return <AccessDenied />
  }

  const result = await getOrganizationList({ limit: 50 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">조직 관리</h1>
          <p className="text-sm text-muted-foreground">
            조직과 유형을 관리합니다.
          </p>
        </div>
        <CreateOrganization />
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : (
        <OrgTable organizations={result.data?.organizations ?? []} />
      )}
    </div>
  )
}
