"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { deleteChildOrgAccount } from "@/src/actions/organization"
import type { OrgType } from "@/src/types/globals"

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  master: "마스터",
  distributor: "총판사",
  agency: "대행사",
  advertiser: "광고주",
}

export type ChildAccount = {
  orgId: string
  orgName: string
  orgSlug: string
  orgType: OrgType
  parentOrgName: string | null
  userId: string
  username: string
  password: string
  firstName: string | null
  adQuantity: number
  memo: string | null
  createdAt: number
}

export function MemberTable({
  accounts,
}: {
  accounts: ChildAccount[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<ChildAccount | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteChildOrgAccount({ orgId: deleteTarget.orgId })
      if (result.error) {
        setError(result.message ?? "삭제에 실패했습니다")
        setDeleteTarget(null)
        return
      }
      setError(null)
      setDeleteTarget(null)
      router.refresh()
    })
  }

  if (accounts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        하위 계정이 없습니다.
      </p>
    )
  }

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>소속</TableHead>
            <TableHead>조직명</TableHead>
            <TableHead>아이디</TableHead>
            <TableHead>비밀번호</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>광고수량</TableHead>
            <TableHead>메모</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.orgId}>
              <TableCell className="text-muted-foreground">{account.parentOrgName || "-"}</TableCell>
              <TableCell className="font-medium">{account.orgName}</TableCell>
              <TableCell>{account.username}</TableCell>
              <TableCell>{account.password || "-"}</TableCell>
              <TableCell>{account.firstName ?? "-"}</TableCell>
              <TableCell>{ORG_TYPE_LABELS[account.orgType]}</TableCell>
              <TableCell>{account.adQuantity}</TableCell>
              <TableCell>{account.memo || "-"}</TableCell>
              <TableCell>
                {new Date(account.createdAt).toLocaleDateString("ko-KR")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(account)}
                  disabled={isPending}
                >
                  삭제
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.orgName} 계정을 삭제하시겠습니까? 이 작업은 되돌릴
              수 없으며, 해당 조직과 사용자가 모두 삭제됩니다.
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
    </>
  )
}
