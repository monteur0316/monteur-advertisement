import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/src/components/public-header"
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

export default async function Home() {
  const { userId, orgId, orgSlug, sessionClaims } = await auth()
  const orgType = (sessionClaims?.orgType as OrgType) ?? null
  const isMaster = orgType === "master"

  // 로그인된 사용자: 사이드바 포함 레이아웃
  if (userId) {
    const allGroups = [
      ...(orgSlug ? getOrgNavigationGroups(orgSlug) : []),
    ]
    const groups = filterNavigationByAccess(allGroups, orgType, isMaster)

    return (
      <SidebarProvider>
        <AppSidebar groups={groups} hasOrg={!!orgId} />
        <SidebarInset>
          <MobileHeader />
          <main className="flex-1 p-4">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-24 text-center">
              <h1 className="text-4xl font-bold tracking-tight">
                Monteur Advertisement
              </h1>
              <p className="max-w-md text-lg text-muted-foreground">
                광고주와 대행사를 위한 광고 관리 플랫폼
              </p>
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">다시 오신 것을 환영합니다!</p>
                <div className="flex gap-3">
                  {orgSlug && (
                    <Button asChild>
                      <Link href={`/org/${orgSlug}/dashboard`}>
                        대시보드로 이동
                      </Link>
                    </Button>
                  )}
                  {!orgSlug && (
                    <Button asChild>
                      <Link href="/org-selection">조직 선택</Link>
                    </Button>
                  )}
                  {isMaster && (
                    <Button asChild variant="outline">
                      <Link href="/admin">관리자 패널</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // 비로그인 사용자: 공개 랜딩 페이지
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Monteur Advertisement
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          광고주와 대행사를 위한 광고 관리 플랫폼
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/sign-in">로그인</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">회원가입</Link>
          </Button>
        </div>
      </main>
    </>
  )
}
