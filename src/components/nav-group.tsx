"use client"

import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { NavItem } from "@/src/components/nav-item"
import type { NavigationGroup } from "@/src/lib/navigation"

interface NavGroupProps {
  group: NavigationGroup
  isFirst?: boolean
}

export function NavGroup({ group, isFirst = false }: NavGroupProps) {
  const pathname = usePathname()
  const hasActiveItem = group.items.some((item) => pathname === item.href)

  return (
    <SidebarGroup>
      {!isFirst && <SidebarSeparator className="mb-2" />}
      <SidebarGroupLabel
        className={
          hasActiveItem
            ? "text-xs uppercase tracking-wider font-semibold text-sidebar-foreground"
            : "text-xs uppercase tracking-wider text-muted-foreground"
        }
      >
        {group.label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
