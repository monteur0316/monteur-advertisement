"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Bell,
  HelpCircle,
  ShoppingCart,
  Calculator,
} from "lucide-react"
import {
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import type { NavigationItem, IconName } from "@/src/lib/navigation"

const iconMap: Record<IconName, typeof LayoutDashboard> = {
  LayoutDashboard,
  Users,
  Bell,
  HelpCircle,
  ShoppingCart,
  Calculator,
}

interface NavItemProps {
  item: NavigationItem
  isActive: boolean
}

export function NavItem({ item, isActive }: NavItemProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const Icon = iconMap[item.icon]

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className={
          isActive
            ? "border-l-2 border-sidebar-primary rounded-l-none font-medium"
            : ""
        }
        onClick={() => {
          if (isMobile) setOpenMobile(false)
        }}
      >
        <Link href={item.href}>
          <Icon className="size-4" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
