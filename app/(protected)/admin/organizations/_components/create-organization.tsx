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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createOrganizationWithType } from "@/src/actions/organization"
import type { OrgType } from "@/src/types/globals"

export function CreateOrganization() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [orgType, setOrgType] = useState<OrgType | "">("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!name || !orgType) return

    startTransition(async () => {
      const result = await createOrganizationWithType({
        name,
        orgType: orgType as OrgType,
      })

      if (result.error) {
        setError(result.message ?? "조직 생성에 실패했습니다")
        return
      }

      setName("")
      setOrgType("")
      setError(null)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">조직 생성</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>조직 생성</DialogTitle>
          <DialogDescription>
            새 조직을 생성합니다.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">조직명</label>
            <Input
              placeholder="조직명을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">조직 유형</label>
            <Select
              value={orgType}
              onValueChange={(val) => setOrgType(val as OrgType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="master">마스터</SelectItem>
                <SelectItem value="distributor">총판사</SelectItem>
                <SelectItem value="agency">대행사</SelectItem>
                <SelectItem value="advertiser">광고주</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !orgType || isPending}
          >
            {isPending ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
