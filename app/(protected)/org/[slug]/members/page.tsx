import { getAuthContext } from "@/src/lib/auth"
import { getChildOrgAccounts } from "@/src/actions/organization"
import { getAllowedChildTypes } from "@/src/db/queries/organization-hierarchy"
import { redirect } from "next/navigation"
import { MemberTable } from "./_components/member-table"
import { CreateMember } from "./_components/create-member"

export default async function OrgMembersPage() {
  const ctx = await getAuthContext()

  if (!ctx.orgId || !ctx.orgType) {
    redirect("/org-selection")
  }

  const allowedChildTypes = getAllowedChildTypes(ctx.orgType)
  const result = await getChildOrgAccounts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">계정 관리</h1>
          <p className="text-sm text-muted-foreground">
            하위 조직과 계정을 관리합니다.
          </p>
        </div>
        {allowedChildTypes.length > 0 && <CreateMember allowedChildTypes={allowedChildTypes} />}
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : (
        <MemberTable accounts={result.data?.accounts ?? []} />
      )}
    </div>
  )
}
