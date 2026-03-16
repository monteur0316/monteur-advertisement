"use client"

import { useState, useMemo } from "react"
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
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Ad } from "@/src/db/schema/ads"
import { AdDetailDialog } from "./ad-detail-dialog"

const ITEMS_PER_PAGE = 20

export function AdsTable({ ads }: { ads: Ad[] }) {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [startDateFrom, setStartDateFrom] = useState("")
  const [startDateTo, setStartDateTo] = useState("")
  const [author, setAuthor] = useState("")

  const hasFilter = search || startDateFrom || startDateTo || author

  const resetFilters = () => {
    setSearch("")
    setStartDateFrom("")
    setStartDateTo("")
    setAuthor("")
    setCurrentPage(1)
  }

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (search) {
        const q = search.toLowerCase()
        const matchKeyword = ad.mainKeyword.toLowerCase().includes(q)
        const matchUrl = ad.productUrl.toLowerCase().includes(q)
        if (!matchKeyword && !matchUrl) return false
      }

      if (startDateFrom) {
        const from = new Date(startDateFrom)
        if (ad.workStartDate < from) return false
      }

      if (startDateTo) {
        const to = new Date(startDateTo)
        to.setHours(23, 59, 59, 999)
        if (ad.workStartDate > to) return false
      }

      if (author) {
        if (!ad.authorName.toLowerCase().includes(author.toLowerCase()))
          return false
      }

      return true
    })
  }, [ads, search, startDateFrom, startDateTo, author])

  // 필터 변경 시 페이지 리셋
  useMemo(() => {
    setCurrentPage(1)
  }, [search, startDateFrom, startDateTo, author])

  const totalPages = Math.max(1, Math.ceil(filteredAds.length / ITEMS_PER_PAGE))
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  if (ads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        등록된 광고가 없습니다.
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
                placeholder="메인키워드, 상품URL"
                className="w-[200px]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">작업시작일</label>
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
            <label className="text-xs text-muted-foreground">작성자</label>
            <div>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="작성자명"
                className="w-[140px]"
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
            검색결과: {filteredAds.length}건
          </p>
        )}
      </div>

      <div className="mt-4" />

      {filteredAds.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          검색 결과가 없습니다.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>메인키워드</TableHead>
              <TableHead className="w-[70px]">수량</TableHead>
              <TableHead className="w-[70px]">일수</TableHead>
              <TableHead className="w-[90px]">일수합계</TableHead>
              <TableHead className="w-[110px]">작업시작일</TableHead>
              <TableHead className="w-[110px]">작업종료일</TableHead>
              <TableHead>상품URL</TableHead>
              <TableHead className="w-[100px]">작성자</TableHead>
              <TableHead className="w-[110px]">작성일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAds.map((ad) => (
              <TableRow
                key={ad.id}
                className="cursor-pointer"
                onClick={() => setSelectedAd(ad)}
              >
                <TableCell className="font-medium">{ad.mainKeyword}</TableCell>
                <TableCell>{ad.quantity}</TableCell>
                <TableCell>{ad.days}</TableCell>
                <TableCell>{ad.quantity * ad.days}</TableCell>
                <TableCell>
                  {ad.workStartDate.toLocaleDateString("ko-KR")}
                </TableCell>
                <TableCell>
                  {ad.workEndDate.toLocaleDateString("ko-KR")}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  <a
                    href={ad.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {ad.productUrl}
                  </a>
                </TableCell>
                <TableCell>{ad.authorName}</TableCell>
                <TableCell>
                  {ad.createdAt.toLocaleDateString("ko-KR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {filteredAds.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AdDetailDialog
        ad={selectedAd}
        onClose={() => setSelectedAd(null)}
      />
    </>
  )
}
