import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

interface ActiveAd {
  id: number
  mainKeyword: string
  quantity: number
  workEndDate: Date
}

interface ActiveAdsCardProps {
  ads: ActiveAd[]
  orgSlug: string
}

function getDaysRemaining(endDate: Date): number {
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function ActiveAdsCard({ ads, orgSlug }: ActiveAdsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">활성 광고</CardTitle>
      </CardHeader>
      <CardContent>
        {ads.length === 0 ? (
          <p className="text-sm text-muted-foreground">활성 광고가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => {
              const daysLeft = getDaysRemaining(ad.workEndDate)
              return (
                <div key={ad.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ad.mainKeyword}</p>
                    <p className="text-xs text-muted-foreground">{ad.quantity}건</p>
                  </div>
                  <span className={`text-xs shrink-0 font-medium ${daysLeft <= 3 ? "text-red-500" : "text-muted-foreground"}`}>
                    D-{daysLeft}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={`/org/${orgSlug}/ads`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          전체보기 &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
