"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { SettlementRecord } from "@/src/actions/settlements"

function getStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          확정
        </Badge>
      )
    case "refunded":
      return <Badge variant="destructive">환불</Badge>
    default:
      return <Badge variant="secondary">대기중</Badge>
  }
}

export function SettlementDetailDialog({
  settlement,
  onClose,
}: {
  settlement: SettlementRecord | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={!!settlement}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>정산 상세</DialogTitle>
        </DialogHeader>

        {settlement && (
          <div className="space-y-4">
            <div className="text-sm">
              <span className="text-muted-foreground">상태</span>
              <div className="mt-1">{getStatusBadge(settlement.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">대행사</span>
                <p className="font-medium">{settlement.agencyName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">광고주</span>
                <p className="font-medium">{settlement.advertiserName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">수량</span>
                <p className="font-medium">{settlement.quantity}</p>
              </div>
              <div>
                <span className="text-muted-foreground">일수합계</span>
                <p className="font-medium">{settlement.totalDays}일</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">시작일</span>
                <p className="font-medium">
                  {settlement.startDate.toLocaleDateString("ko-KR")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">종료일</span>
                <p className="font-medium">
                  {settlement.endDate.toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>

            <div className="text-sm">
              <span className="text-muted-foreground">기간</span>
              <p className="font-medium">
                {settlement.startDate.toLocaleDateString("ko-KR")} ~{" "}
                {settlement.endDate.toLocaleDateString("ko-KR")}
              </p>
            </div>

            {settlement.memo && (
              <div className="text-sm">
                <span className="text-muted-foreground">메모</span>
                <p className="font-medium whitespace-pre-wrap">
                  {settlement.memo}
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              등록일: {settlement.createdAt.toLocaleDateString("ko-KR")}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
