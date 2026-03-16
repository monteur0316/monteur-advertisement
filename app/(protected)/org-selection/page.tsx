"use client"

import { useOrganizationList } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, Loader2 } from "lucide-react"

export default function OrgSelectionPage() {
  const router = useRouter()
  const [switching, setSwitching] = useState<string | null>(null)
  const { isLoaded, userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  })

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const memberships = userMemberships.data ?? []

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-8 px-4 py-24">
      <div className="text-center">
        <Building2 className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">조직 선택</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          계속하려면 조직을 선택하거나, 초대를 기다려주세요.
        </p>
      </div>

      {memberships.length > 0 ? (
        <div className="w-full space-y-2">
          {memberships.map((membership) => (
            <button
              key={membership.id}
              className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
              disabled={switching === membership.id}
              onClick={async () => {
                setSwitching(membership.id)
                await setActive?.({
                  organization: membership.organization.id,
                })
                router.push(`/org/${membership.organization.slug}/dashboard`)
              }}
            >
              <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-sm font-bold">
                  {membership.organization.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium">{membership.organization.name}</p>
                <p className="text-xs text-muted-foreground">
                  멤버
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="w-full rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            아직 소속된 조직이 없습니다.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            관리자에게 연락하여 초대를 받아주세요.
          </p>
        </div>
      )}

      <Button variant="outline" onClick={() => router.push("/")}>
        홈으로 돌아가기
      </Button>
    </div>
  )
}
