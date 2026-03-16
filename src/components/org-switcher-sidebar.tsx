"use client"

import { useState, useEffect } from "react"
import { Building2, ChevronsUpDown, Check } from "lucide-react"
import { useOrganization, useOrganizationList } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { orgTypeLabel } from "@/src/lib/navigation"
import type { OrgType } from "@/src/types/globals"

function CollapsedLogo({
  icon,
}: {
  icon: React.ReactNode
}) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className="hidden w-full cursor-pointer items-center justify-center py-1.5 group-data-[collapsible=icon]:flex"
    >
      {icon}
    </button>
  )
}

export function OrgSwitcherSidebar({ hasOrg }: { hasOrg?: boolean }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { organization: currentOrg } = useOrganization()
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoIcon = (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <span className="text-xs font-bold">M</span>
    </div>
  )

  const orgIcon = (
    <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
      <Building2 className="size-4" />
    </div>
  )

  if (!hasOrg) {
    return (
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2">
                {logoIcon}
                <span className="truncate text-sm font-semibold">
                  Monteur
                </span>
              </div>
              <SidebarTrigger />
            </div>
            <CollapsedLogo icon={logoIcon} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    )
  }

  const memberships = userMemberships.data ?? []
  const currentOrgType = (currentOrg?.publicMetadata as { orgType?: OrgType })?.orgType

  const orgTriggerContent = (
    <>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="text-xs font-bold">
          {currentOrg?.name?.charAt(0).toUpperCase() ?? "?"}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">
          {currentOrg?.name ?? "조직 선택"}
        </span>
        {currentOrgType && (
          <span className="text-xs text-muted-foreground">
            {orgTypeLabel[currentOrgType]}
          </span>
        )}
      </div>
      <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
    </>
  )

  return (
    <SidebarHeader className="border-b border-sidebar-border">
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center justify-between group-data-[collapsible=icon]:hidden">
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-sidebar-accent focus-visible:outline-none">
                  {orgTriggerContent}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {memberships.map((membership) => {
                    const org = membership.organization
                    const type = (org.publicMetadata as { orgType?: OrgType })?.orgType
                    const isActive = currentOrg?.id === org.id

                    return (
                      <DropdownMenuItem
                        key={membership.id}
                        onClick={async () => {
                          if (isActive) return
                          await setActive?.({ organization: org.id })
                          router.push(`/org/${org.slug}/dashboard`)
                        }}
                        className="flex items-center gap-2"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                          <span className="text-xs font-bold">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">{org.name}</span>
                          {type && (
                            <span className="text-xs text-muted-foreground">
                              {orgTypeLabel[type]}
                            </span>
                          )}
                        </div>
                        {isActive && <Check className="size-4 shrink-0 text-primary" />}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5">
                {orgTriggerContent}
              </div>
            )}
            <SidebarTrigger className="shrink-0" />
          </div>
          <CollapsedLogo icon={orgIcon} />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
