"use client"

import { useState, useTransition, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createNotice } from "@/src/actions/notices"
import { getOrganizationList } from "@/src/actions/organization"

type Org = {
  id: string
  name: string
  slug: string
}

export function AdminCreateNoticeDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [orgId, setOrgId] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isPinned, setIsPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [orgsLoading, setOrgsLoading] = useState(false)

  useEffect(() => {
    if (open && orgs.length === 0) {
      setOrgsLoading(true)
      getOrganizationList({ limit: 100 }).then((result) => {
        if (result.data) {
          setOrgs(
            result.data.organizations.map((o) => ({
              id: o.id,
              name: o.name,
              slug: o.slug,
            }))
          )
        }
        setOrgsLoading(false)
      })
    }
  }, [open, orgs.length])

  const handleSubmit = () => {
    if (!orgId) {
      setError("조직을 선택해주세요")
      return
    }

    startTransition(async () => {
      const result = await createNotice({ title, content, isPinned, orgId })

      if (result.error) {
        setError(result.message ?? "등록에 실패했습니다")
        return
      }

      setOrgId("")
      setTitle("")
      setContent("")
      setIsPinned(false)
      setError(null)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">공지 작성</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>공지사항 작성</DialogTitle>
          <DialogDescription>
            선택한 조직에 새로운 공지사항을 작성합니다.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">조직</label>
            <Select value={orgId} onValueChange={setOrgId} disabled={orgsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={orgsLoading ? "불러오는 중..." : "조직을 선택해주세요"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">전체 조직</SelectItem>
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지사항 제목"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">내용</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="공지사항 내용을 입력해주세요"
              rows={8}
              maxLength={10000}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">중요 공지 (상단 고정)</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!orgId || !title || !content || isPending}
          >
            {isPending ? "등록 중..." : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
