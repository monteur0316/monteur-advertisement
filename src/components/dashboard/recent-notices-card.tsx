import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Pin } from "lucide-react"

interface RecentNotice {
  id: number
  title: string
  isPinned: boolean
  createdAt: Date
}

interface RecentNoticesCardProps {
  notices: RecentNotice[]
  orgSlug: string
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date)
}

export function RecentNoticesCard({ notices, orgSlug }: RecentNoticesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">최근 공지사항</CardTitle>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">공지사항이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {notices.map((notice) => (
              <li key={notice.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {notice.isPinned && (
                    <Pin className="size-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm truncate">{notice.title}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(notice.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={`/org/${orgSlug}/notices`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          전체보기 &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
