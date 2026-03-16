"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Ad } from "@/src/db/schema/ads"
import { extendAd } from "@/src/actions/ads"

export function ExtendAdDialog({
  ad,
  open,
  onClose,
  onSuccess,
}: {
  ad: Ad
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const router = useRouter()
  const [additionalDays, setAdditionalDays] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const days = Number(additionalDays)
  const newEndDate =
    days > 0
      ? (() => {
          const d = new Date(ad.workEndDate)
          d.setDate(d.getDate() + days)
          return d.toLocaleDateString("ko-KR")
        })()
      : null

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await extendAd({
        id: ad.id,
        additionalDays: days,
      })

      if (result.error) {
        setError(result.message ?? "연장에 실패했습니다")
        return
      }

      setError(null)
      setAdditionalDays("")
      onSuccess()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setAdditionalDays("")
          setError(null)
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>광고 연장</DialogTitle>
          <DialogDescription>
            &quot;{ad.mainKeyword}&quot; 광고의 기간을 연장합니다.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">현재 일수</span>
              <p className="font-medium">{ad.days}일</p>
            </div>
            <div>
              <span className="text-muted-foreground">현재 종료일</span>
              <p className="font-medium">
                {ad.workEndDate.toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">연장 일수</label>
            <Input
              type="number"
              value={additionalDays}
              onChange={(e) => setAdditionalDays(e.target.value)}
              placeholder="연장할 일수를 입력하세요"
              min={1}
            />
          </div>

          {newEndDate && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">변경 후 일수</span>
                  <p className="font-medium">{ad.days + days}일</p>
                </div>
                <div>
                  <span className="text-muted-foreground">변경 후 종료일</span>
                  <p className="font-medium">{newEndDate}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={days <= 0 || isPending}>
            {isPending ? "연장 중..." : "연장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
