"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Notice } from "@/src/db/schema/notices"

export function AllNoticesTable({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        등록된 공지사항이 없습니다.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>조직 ID</TableHead>
          <TableHead className="w-[40%]">제목</TableHead>
          <TableHead>작성자</TableHead>
          <TableHead>작성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {notices.map((notice) => (
          <TableRow key={notice.id}>
            <TableCell className="font-mono text-xs">
              {notice.orgId === "__all__" ? (
                <Badge variant="default">전체 조직</Badge>
              ) : (
                notice.orgId
              )}
            </TableCell>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {notice.isPinned && (
                  <Badge variant="secondary" className="shrink-0">
                    중요
                  </Badge>
                )}
                <span className="truncate">{notice.title}</span>
              </div>
            </TableCell>
            <TableCell>{notice.authorName}</TableCell>
            <TableCell>
              {notice.createdAt.toLocaleDateString("ko-KR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
