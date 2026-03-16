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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createAd } from "@/src/actions/ads"

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days - 1)
  return formatDate(date)
}

export function CreateAdDialog() {
  const router = useRouter()
  const today = formatDate(new Date())
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState("")
  const [days, setDays] = useState("")
  const [workStartDate, setWorkStartDate] = useState(today)
  const [workEndDate, setWorkEndDate] = useState("")
  const [productUrl, setProductUrl] = useState("")
  const [priceCompareUrl, setPriceCompareUrl] = useState("")
  const [mainKeyword, setMainKeyword] = useState("")
  const [memo, setMemo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateEndDate = (startDate: string, numDays: string) => {
    const d = Number(numDays)
    if (startDate && d > 0) {
      setWorkEndDate(addDays(startDate, d))
    }
  }

  const handleDaysChange = (value: string) => {
    setDays(value)
    updateEndDate(workStartDate, value)
  }

  const handleStartDateChange = (value: string) => {
    setWorkStartDate(value)
    updateEndDate(value, days)
  }

  const resetForm = () => {
    setQuantity("")
    setDays("")
    setWorkStartDate(today)
    setWorkEndDate("")
    setProductUrl("")
    setPriceCompareUrl("")
    setMainKeyword("")
    setMemo("")
    setError(null)
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createAd({
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
        setError(result.message ?? "등록에 실패했습니다")
        return
      }

      resetForm()
      setOpen(false)
      router.refresh()
    })
  }

  const isValid =
    quantity && days && workStartDate && workEndDate && productUrl && mainKeyword

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">광고 등록</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>광고 등록</DialogTitle>
          <DialogDescription>새로운 광고를 등록합니다.</DialogDescription>
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
                onChange={(e) => handleDaysChange(e.target.value)}
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
                onChange={(e) => handleStartDateChange(e.target.value)}
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? "등록 중..." : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
