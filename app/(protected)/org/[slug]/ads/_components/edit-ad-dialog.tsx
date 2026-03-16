"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Ad } from "@/src/db/schema/ads"
import { updateAd } from "@/src/actions/ads"

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function EditAdDialog({
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
  const [quantity, setQuantity] = useState(String(ad.quantity))
  const [days, setDays] = useState(String(ad.days))
  const [workStartDate, setWorkStartDate] = useState(
    formatDateForInput(ad.workStartDate)
  )
  const [workEndDate, setWorkEndDate] = useState(
    formatDateForInput(ad.workEndDate)
  )
  const [productUrl, setProductUrl] = useState(ad.productUrl)
  const [priceCompareUrl, setPriceCompareUrl] = useState(
    ad.priceCompareUrl ?? ""
  )
  const [mainKeyword, setMainKeyword] = useState(ad.mainKeyword)
  const [memo, setMemo] = useState(ad.memo ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateAd({
        id: ad.id,
        quantity: Number(quantity),
        days: Number(days),
        workStartDate,
        workEndDate,
        productUrl,
        priceCompareUrl: priceCompareUrl || undefined,
        mainKeyword,
        memo: memo || undefined,
      })

      if (result.error) {
        setError(result.message ?? "수정에 실패했습니다")
        return
      }

      setError(null)
      onSuccess()
      router.refresh()
    })
  }

  const isValid =
    quantity && days && workStartDate && workEndDate && productUrl && mainKeyword

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>광고 수정</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">수량</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="수량"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">일수</label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="일수"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">일수합계</label>
              <Input
                value={
                  Number(quantity) > 0 && Number(days) > 0
                    ? String(Number(quantity) * Number(days))
                    : ""
                }
                readOnly
                disabled
                placeholder="-"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">작업시작일</label>
              <Input
                type="date"
                value={workStartDate}
                onChange={(e) => setWorkStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">작업종료일</label>
              <Input
                type="date"
                value={workEndDate}
                onChange={(e) => setWorkEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">메인키워드</label>
            <Input
              value={mainKeyword}
              onChange={(e) => setMainKeyword(e.target.value)}
              placeholder="메인키워드"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">상품 URL</label>
            <Input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://example.com/product"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              가격비교 URL{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Input
              type="url"
              value={priceCompareUrl}
              onChange={(e) => setPriceCompareUrl(e.target.value)}
              placeholder="https://example.com/compare"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              메모{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력해주세요"
              rows={3}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? "수정 중..." : "수정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
