import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/src/components/app-sidebar"
import { MobileHeader } from "@/src/components/mobile-header"
import type { OrgType } from "@/src/types/globals"
import {
  getOrgNavigationGroups,
  filterNavigationByAccess,
} from "@/src/lib/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, orgId, orgSlug, sessionClaims } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const orgType = (sessionClaims?.orgType as OrgType) ?? null
  const isMaster = orgType === "master"

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
