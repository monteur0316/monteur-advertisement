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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createChildOrgAccount } from "@/src/actions/organization"
import type { OrgType } from "@/src/types/globals"

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  master: "마스터",
  distributor: "총판사",
  agency: "대행사",
  advertiser: "광고주",
}

export function CreateMember({
  allowedChildTypes,
}: {
  allowedChildTypes: OrgType[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [selectedType, setSelectedType] = useState<OrgType>(allowedChildTypes[0])
  const [orgName, setOrgName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [adQuantity, setAdQuantity] = useState("")
  const [memo, setMemo] = useState("")

  const childLabel = allowedChildTypes.length === 1
    ? ORG_TYPE_LABELS[allowedChildTypes[0]]
    : ORG_TYPE_LABELS[selectedType]

  const resetForm = () => {
    setSelectedType(allowedChildTypes[0])
    setOrgName("")
    setUsername("")
    setPassword("")
    setFirstName("")
    setAdQuantity("")
    setMemo("")
    setError(null)
  }

  const handleSubmit = () => {
    if (!orgName || !username || !password || !firstName) return

    startTransition(async () => {
      const result = await createChildOrgAccount({
        orgName,
        username,
        password,
        firstName,
        childOrgType: selectedType,
        adQuantity: adQuantity ? Number(adQuantity) : 0,
        memo: memo || undefined,
      })

      if (result.error) {
        setError(result.message ?? "계정 생성에 실패했습니다")
        return
      }

      resetForm()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          {allowedChildTypes.length === 1 ? `${childLabel} 계정 생성` : "하위 계정 생성"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {allowedChildTypes.length === 1 ? `${childLabel} 계정 생성` : "하위 계정 생성"}
          </DialogTitle>
          <DialogDescription>
            새로운 {allowedChildTypes.length === 1 ? childLabel : "하위"} 계정을 생성합니다.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {allowedChildTypes.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">계정 유형</label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as OrgType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedChildTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ORG_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">조직명</label>
            <Input
              placeholder={`${childLabel} 조직명`}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">아이디</label>
            <Input
              placeholder="영문, 숫자, 밑줄 (4자 이상)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">비밀번호</label>
            <Input
              type="password"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">이름</label>
            <Input
              placeholder="담당자 이름"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">광고수량</label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={adQuantity}
              onChange={(e) => setAdQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">메모</label>
            <Input
              placeholder="메모 (선택)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!orgName || !username || !password || !firstName || isPending}
          >
            {isPending ? "생성 중..." : "계정 생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
