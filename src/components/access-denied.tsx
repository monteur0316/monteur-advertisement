import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AccessDenied() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="size-4" />
        <AlertTitle>접근 거부</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>
            이 페이지에 접근할 권한이 없습니다. 올바른 조직으로
            전환하거나 관리자에게 문의해주세요.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">홈으로 이동</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/org-selection">조직 전환</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
