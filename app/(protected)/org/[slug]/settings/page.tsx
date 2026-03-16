import { getAuthContext } from "@/src/lib/auth"
import { redirect } from "next/navigation"
import { OrganizationProfile } from "@clerk/nextjs"

export default async function OrgSettingsPage() {
  const ctx = await getAuthContext()

  if (!ctx.orgId) {
    redirect("/org-selection")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">조직 설정</h1>
        <p className="text-sm text-muted-foreground">
          조직 프로필과 환경설정을 관리합니다.
        </p>
      </div>

      <OrganizationProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "shadow-none border",
          },
        }}
      />
    </div>
  )
}
