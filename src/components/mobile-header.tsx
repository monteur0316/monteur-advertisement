"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const pageTitleMap: Record<string, string> = {
  dashboard: "대시보드",
  notices: "공지사항",
  members: "계정관리",
  clients: "클라이언트",
  admin: "관리자 대시보드",
  users: "사용자 관리",
  organizations: "조직 관리",
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]

  if (lastSegment && pageTitleMap[lastSegment]) {
    return pageTitleMap[lastSegment]
  }

  return ""
}

export function MobileHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 md:hidden">
      <SidebarTrigger className="-ml-1" />
      {title && (
        <>
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="text-sm font-medium">{title}</span>
        </>
      )}
    </header>
  )
}
