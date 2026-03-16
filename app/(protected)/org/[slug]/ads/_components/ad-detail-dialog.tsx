"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { Ad } from "@/src/db/schema/ads"
import { deleteAd } from "@/src/actions/ads"
import { EditAdDialog } from "./edit-ad-dialog"
import { ExtendAdDialog } from "./extend-ad-dialog"

export function AdDetailDialog({
  ad,
  onClose,
}: {
  ad: Ad | null
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showExtend, setShowExtend] = useState(false)

  const handleDelete = () => {
    if (!ad) return
    startTransition(async () => {
      const result = await deleteAd({ id: ad.id })
      if (!result.error) {
        setShowDeleteConfirm(false)
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <>
      <Dialog
        open={!!ad && !showEdit && !showExtend}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>광고 상세</DialogTitle>
          </DialogHeader>

          {ad && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">메인키워드</span>
                  <p className="font-medium">{ad.mainKeyword}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">작성자</span>
                  <p className="font-medium">{ad.authorName}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">수량</span>
                  <p className="font-medium">{ad.quantity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">일수</span>
                  <p className="font-medium">{ad.days}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">일수합계</span>
                  <p className="font-medium">{ad.quantity * ad.days}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">작업시작일</span>
                  <p className="font-medium">
                    {ad.workStartDate.toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">작업종료일</span>
                  <p className="font-medium">
                    {ad.workEndDate.toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground block mb-1">상품 URL</span>
                <p>
                  <a
                    href={ad.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {ad.productUrl}
                  </a>
                </p>
              </div>

              {ad.priceCompareUrl && (
                <div className="text-sm">
                  <span className="text-muted-foreground block mb-1">가격비교 URL</span>
                  <p>
                    <a
                      href={ad.priceCompareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {ad.priceCompareUrl}
                    </a>
                  </p>
                </div>
              )}

              {ad.memo && (
                <div className="text-sm">
                  <span className="text-muted-foreground block mb-1">메모</span>
                  <p className="whitespace-pre-wrap">{ad.memo}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                등록일: {ad.createdAt.toLocaleDateString("ko-KR")}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtend(true)}
                >
                  연장
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEdit(true)}
                >
                  수정
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  삭제
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>광고 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{ad?.mainKeyword}&quot; 광고를 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {ad && showEdit && (
        <EditAdDialog
          ad={ad}
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false)
            onClose()
          }}
        />
      )}

      {ad && showExtend && (
        <ExtendAdDialog
          ad={ad}
          open={showExtend}
          onClose={() => setShowExtend(false)}
          onSuccess={() => {
            setShowExtend(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
