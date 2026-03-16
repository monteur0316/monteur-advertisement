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
import type { OrgType } from "@/src/types/globals"
import { orgTypeLabel } from "@/src/lib/navigation"

type Organization = {
  id: string
  name: string
  slug: string
  orgType: OrgType | null
  parentClerkOrgId: string | null
  membersCount: number | null
  createdAt: number
}

const orgTypeBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  master: "default",
  distributor: "default",
  agency: "secondary",
  advertiser: "outline",
}

export function OrgTable({
  organizations,
}: {
  organizations: Organization[]
}) {
  if (organizations.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조직을 찾을 수 없습니다.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>슬러그</TableHead>
          <TableHead>유형</TableHead>
          <TableHead>멤버</TableHead>
          <TableHead>생성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell className="font-medium">{org.name}</TableCell>
            <TableCell className="text-muted-foreground">{org.slug}</TableCell>
            <TableCell>
              {org.orgType ? (
                <Badge variant={orgTypeBadgeVariant[org.orgType] ?? "outline"}>
                  {orgTypeLabel[org.orgType] ?? org.orgType}
                </Badge>
              ) : (
                <Badge variant="outline">미설정</Badge>
              )}
            </TableCell>
            <TableCell>{org.membersCount ?? "-"}</TableCell>
            <TableCell>
              {new Date(org.createdAt).toLocaleDateString("ko-KR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
