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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Notice } from "@/src/db/schema/notices"
import { deleteNotice } from "@/src/actions/notices"
import { EditNoticeDialog } from "./edit-notice-dialog"

export function NoticeDetailDialog({
  notice,
  isMaster,
  onClose,
}: {
  notice: Notice | null
  isMaster: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const handleDelete = () => {
    if (!notice) return
    startTransition(async () => {
      const result = await deleteNotice({ id: notice.id })
      if (!result.error) {
        setShowDeleteConfirm(false)
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <>
      <Dialog open={!!notice && !showEdit} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {notice?.isPinned && <Badge variant="secondary">중요</Badge>}
              <DialogTitle>{notice?.title}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{notice?.authorName}</span>
              <span>
                {notice?.createdAt.toLocaleDateString("ko-KR")}
              </span>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {notice?.content}
            </div>
          </div>

          {notice && isMaster && (
            <div className="flex justify-end gap-2 pt-4">
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
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{notice?.title}&quot; 공지사항을 삭제하시겠습니까? 이 작업은
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

      {/* Edit Dialog */}
      {notice && showEdit && (
        <EditNoticeDialog
          notice={notice}
          open={showEdit}
          onClose={() => {
            setShowEdit(false)
          }}
          onSuccess={() => {
            setShowEdit(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
