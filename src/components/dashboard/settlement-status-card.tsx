import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SettlementStatusCardProps {
  pending: number
  confirmed: number
  refunded: number
}

export function SettlementStatusCard({ pending, confirmed, refunded }: SettlementStatusCardProps) {
  const total = pending + confirmed + refunded

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">정산 현황</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">정산 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800">
                  대기
                </Badge>
              </div>
              <span className="text-sm font-medium">{pending}건</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                  확정
                </Badge>
              </div>
              <span className="text-sm font-medium">{confirmed}건</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                  환불
                </Badge>
              </div>
              <span className="text-sm font-medium">{refunded}건</span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">합계</span>
              <span className="text-sm font-bold">{total}건</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
