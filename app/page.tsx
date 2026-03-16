import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/src/components/public-header"

export default async function Home() {
  const { userId, orgSlug } = await auth()

  // 로그인된 사용자: 대시보드로 리다이렉트
  if (userId) {
    if (orgSlug) {
      redirect(`/org/${orgSlug}/dashboard`)
    }
    redirect("/org-selection")
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
