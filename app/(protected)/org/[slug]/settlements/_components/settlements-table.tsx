"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SettlementRecord } from "@/src/actions/settlements"
import { SettlementDetailDialog } from "./settlement-detail-dialog"

const ITEMS_PER_PAGE = 20

function getStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          확정
        </Badge>
      )
    case "refunded":
      return <Badge variant="destructive">환불</Badge>
    default:
      return <Badge variant="secondary">대기중</Badge>
  }
}

export function SettlementsTable({
  settlements,
}: {
  settlements: SettlementRecord[]
}) {
  const [selected, setSelected] = useState<SettlementRecord | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [startDateFrom, setStartDateFrom] = useState("")
  const [startDateTo, setStartDateTo] = useState("")
  const [createdDateFrom, setCreatedDateFrom] = useState("")
  const [createdDateTo, setCreatedDateTo] = useState("")

  const hasFilter =
    search ||
    statusFilter ||
    startDateFrom ||
    startDateTo ||
    createdDateFrom ||
    createdDateTo

  const resetFilters = () => {
    setSearch("")
    setStatusFilter("")
    setStartDateFrom("")
    setStartDateTo("")
    setCreatedDateFrom("")
    setCreatedDateTo("")
    setCurrentPage(1)
  }

  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        const matchAgency = s.agencyName?.toLowerCase().includes(q)
        const matchAdvertiser = s.advertiserName?.toLowerCase().includes(q)
        const matchMemo = s.memo?.toLowerCase().includes(q)
        if (!matchAgency && !matchAdvertiser && !matchMemo) return false
      }

      if (statusFilter && s.status !== statusFilter) return false

      if (startDateFrom) {
        const from = new Date(startDateFrom)
        if (s.startDate < from) return false
      }

      if (startDateTo) {
        const to = new Date(startDateTo)
        to.setHours(23, 59, 59, 999)
        if (s.startDate > to) return false
      }

      if (createdDateFrom) {
        const from = new Date(createdDateFrom)
        if (s.createdAt < from) return false
      }

      if (createdDateTo) {
        const to = new Date(createdDateTo)
        to.setHours(23, 59, 59, 999)
        if (s.createdAt > to) return false
      }

      return true
    })
  }, [
    settlements,
    search,
    statusFilter,
    startDateFrom,
    startDateTo,
    createdDateFrom,
    createdDateTo,
  ])

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, startDateFrom, startDateTo, createdDateFrom, createdDateTo])

  const totalPages = Math.max(1, Math.ceil(filteredSettlements.length / ITEMS_PER_PAGE))
  const paginatedSettlements = filteredSettlements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  if (settlements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        정산 내역이 없습니다.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">키워드 검색</label>
            <div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="대행사, 광고주, 메모"
                className="w-[200px]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">상태</label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="confirmed">확정</SelectItem>
                <SelectItem value="refunded">환불</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">시작일</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={startDateFrom}
                onChange={(e) => setStartDateFrom(e.target.value)}
                className="w-[150px]"
              />
              <span className="text-xs text-muted-foreground">~</span>
              <Input
                type="date"
                value={startDateTo}
                onChange={(e) => setStartDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">생성일</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={createdDateFrom}
                onChange={(e) => setCreatedDateFrom(e.target.value)}
                className="w-[150px]"
              />
              <span className="text-xs text-muted-foreground">~</span>
              <Input
                type="date"
                value={createdDateTo}
                onChange={(e) => setCreatedDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>
          </div>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              초기화
            </Button>
          )}
        </div>

        {hasFilter && (
          <p className="text-sm text-muted-foreground">
            검색결과: {filteredSettlements.length}건
          </p>
        )}
      </div>

      <div className="mt-4" />

      {filteredSettlements.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          검색 결과가 없습니다.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">상태</TableHead>
              <TableHead className="w-[120px]">대행사</TableHead>
              <TableHead className="w-[120px]">광고주</TableHead>
              <TableHead className="w-[70px]">수량</TableHead>
              <TableHead className="w-[180px]">기간</TableHead>
              <TableHead className="w-[90px]">일수합계</TableHead>
              <TableHead className="w-[110px]">시작일</TableHead>
              <TableHead className="w-[110px]">생성일시</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSettlements.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => setSelected(s)}
              >
                <TableCell>{getStatusBadge(s.status)}</TableCell>
                <TableCell className="font-medium">{s.agencyName}</TableCell>
                <TableCell>{s.advertiserName}</TableCell>
                <TableCell>{s.quantity}</TableCell>
                <TableCell>
                  {s.startDate.toLocaleDateString("ko-KR")} ~{" "}
                  {s.endDate.toLocaleDateString("ko-KR")}
                </TableCell>
                <TableCell>{s.totalDays}일</TableCell>
                <TableCell>
                  {s.startDate.toLocaleDateString("ko-KR")}
                </TableCell>
                <TableCell>
                  {s.createdAt.toLocaleDateString("ko-KR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages} 페이지 (총 {filteredSettlements.length}건)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            다음
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <SettlementDetailDialog
        settlement={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
