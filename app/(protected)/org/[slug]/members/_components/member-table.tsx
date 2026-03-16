"use client"

import { useState, useTransition, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { ChevronDown, ChevronRight, Search, Users } from "lucide-react"

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  master: "마스터",
  distributor: "총판사",
  agency: "대행사",
  advertiser: "광고주",
}

const ORG_TYPE_BADGE_STYLES: Record<OrgType, string> = {
  master: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  distributor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  agency: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  advertiser: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
}

export type ChildAccount = {
  orgId: string
  orgName: string
  orgSlug: string
  orgType: OrgType
  parentOrgId: string | null
  parentOrgName: string | null
  userId: string
  username: string
  password: string
  firstName: string | null
  adQuantity: number
  memo: string | null
  createdAt: number
}

type TreeNode = ChildAccount & {
  children: TreeNode[]
  depth: number
}

function buildTree(accounts: ChildAccount[]): TreeNode[] {
  const accountMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // Create nodes
  for (const account of accounts) {
    accountMap.set(account.orgId, { ...account, children: [], depth: 0 })
  }

  // Build tree
  for (const node of accountMap.values()) {
    if (node.parentOrgId && accountMap.has(node.parentOrgId)) {
      const parent = accountMap.get(node.parentOrgId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort: by type depth then by name
  const sortNodes = (nodes: TreeNode[]) => {
    const typeOrder: Record<OrgType, number> = { master: 0, distributor: 1, agency: 2, advertiser: 3 }
    nodes.sort((a, b) => typeOrder[a.orgType] - typeOrder[b.orgType] || a.orgName.localeCompare(b.orgName))
    for (const node of nodes) {
      sortNodes(node.children)
    }
  }
  sortNodes(roots)

  return roots
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

function filterAccounts(accounts: ChildAccount[], query: string): ChildAccount[] {
  if (!query.trim()) return accounts
  const q = query.toLowerCase()
  return accounts.filter(
    (a) =>
      a.orgName.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      (a.firstName?.toLowerCase().includes(q)) ||
      (a.parentOrgName?.toLowerCase().includes(q)) ||
      ORG_TYPE_LABELS[a.orgType].includes(q) ||
      (a.memo?.toLowerCase().includes(q))
  )
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
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const filteredAccounts = useMemo(
    () => filterAccounts(accounts, searchQuery),
    [accounts, searchQuery]
  )

  const tree = useMemo(() => buildTree(filteredAccounts), [filteredAccounts])
  const flatNodes = useMemo(() => flattenTree(tree), [tree])

  // Check if we have any hierarchy (multi-level)
  const hasHierarchy = accounts.some((a) => a.parentOrgId && accounts.some((b) => b.orgId === a.parentOrgId))

  // Group by parent for summary stats
  const typeStats = useMemo(() => {
    const stats: Record<OrgType, number> = { master: 0, distributor: 0, agency: 0, advertiser: 0 }
    for (const a of accounts) {
      stats[a.orgType]++
    }
    return Object.entries(stats).filter(([, count]) => count > 0) as [OrgType, number][]
  }, [accounts])

  const toggleGroup = (orgId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(orgId)) {
        next.delete(orgId)
      } else {
        next.add(orgId)
      }
      return next
    })
  }

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

  // Check if a node's ancestors are collapsed
  const isNodeVisible = (node: TreeNode): boolean => {
    if (!hasHierarchy) return true
    // Check if any ancestor is collapsed
    let current = node
    for (const possibleParent of flatNodes) {
      if (possibleParent.orgId === current.parentOrgId) {
        if (collapsedGroups.has(possibleParent.orgId)) return false
        current = possibleParent
      }
    }
    return true
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
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>전체 {accounts.length}개</span>
        </div>
        <div className="h-4 w-px bg-border" />
        {typeStats.map(([type, count]) => (
          <div key={type} className="flex items-center gap-1.5">
            <Badge variant="outline" className={ORG_TYPE_BADGE_STYLES[type]}>
              {ORG_TYPE_LABELS[type]}
            </Badge>
            <span className="text-sm text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="조직명, 아이디, 이름, 유형으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {filteredAccounts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          검색 결과가 없습니다.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">조직명</TableHead>
                <TableHead className="w-[80px]">유형</TableHead>
                <TableHead>소속</TableHead>
                <TableHead>아이디</TableHead>
                <TableHead>비밀번호</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>광고수량</TableHead>
                <TableHead>메모</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatNodes.map((node) => {
                if (!isNodeVisible(node)) return null
                const hasChildren = node.children.length > 0
                const isCollapsed = collapsedGroups.has(node.orgId)

                return (
                  <TableRow
                    key={node.orgId}
                    className={node.depth > 0 ? "bg-muted/20" : ""}
                  >
                    <TableCell>
                      <div
                        className="flex items-center gap-1"
                        style={{ paddingLeft: hasHierarchy ? `${node.depth * 20}px` : undefined }}
                      >
                        {hasHierarchy && hasChildren ? (
                          <button
                            onClick={() => toggleGroup(node.orgId)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        ) : hasHierarchy ? (
                          <span className="w-5 shrink-0" />
                        ) : null}
                        <span className="font-medium">{node.orgName}</span>
                        {hasChildren && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({node.children.length})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ORG_TYPE_BADGE_STYLES[node.orgType]}
                      >
                        {ORG_TYPE_LABELS[node.orgType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {node.parentOrgName || "-"}
                    </TableCell>
                    <TableCell>{node.username}</TableCell>
                    <TableCell className="font-mono text-xs">{node.password || "-"}</TableCell>
                    <TableCell>{node.firstName ?? "-"}</TableCell>
                    <TableCell>{node.adQuantity}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground">
                      {node.memo || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(node.createdAt).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(node)}
                        disabled={isPending}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

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
