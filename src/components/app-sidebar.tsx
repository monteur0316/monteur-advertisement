"use client"

import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOut, ChevronsUpDown, Sun, Moon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OrgSwitcherSidebar } from "@/src/components/org-switcher-sidebar"
import { NavGroup } from "@/src/components/nav-group"
import type { NavigationGroup } from "@/src/lib/navigation"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groups: NavigationGroup[]
  hasOrg?: boolean
}

export function AppSidebar({ groups, hasOrg, ...props }: AppSidebarProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { setTheme } = useTheme()
  const router = useRouter()

  return (
    <Sidebar collapsible="icon" {...props}>
      <OrgSwitcherSidebar hasOrg={hasOrg} />
      <SidebarContent>
        {groups.map((group, index) => (
          <NavGroup key={group.label} group={group} isFirst={index === 0} />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="size-6 shrink-0 rounded-full"
                    />
                  ) : (
                    <div className="bg-muted size-6 shrink-0 rounded-full" />
                  )}
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Sun className="size-4 scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
                    <Moon className="absolute size-4 scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
                    테마
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="size-4" />
                      라이트
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="size-4" />
                      다크
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut()
                    router.push("/sign-in")
                  }}
                >
                  <LogOut className="size-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
