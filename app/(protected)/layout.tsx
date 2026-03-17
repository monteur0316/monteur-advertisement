import { redirect } from "next/navigation"
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/src/components/app-sidebar"
import { MobileHeader } from "@/src/components/mobile-header"
import {
  getOrgNavigationGroups,
  filterNavigationByAccess,
} from "@/src/lib/navigation"
import { getAuthContext } from "@/src/lib/auth"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    redirect("/sign-in")
  }

  const { orgId, orgSlug, orgType, isMaster } = ctx

  const allGroups = [
    ...(orgSlug ? getOrgNavigationGroups(orgSlug) : []),
  ]

  const groups = filterNavigationByAccess(
    allGroups,
    orgType,
    isMaster
  )

  if (groups.length === 0) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar groups={groups} hasOrg={!!orgId} />
      <SidebarInset>
        <MobileHeader />
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
