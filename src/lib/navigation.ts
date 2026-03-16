import type { OrgType } from "@/src/types/globals"

export type IconName = "LayoutDashboard" | "Users" | "Bell" | "HelpCircle" | "ShoppingCart" | "Calculator"

export interface NavigationItem {
  href: string
  label: string
  icon: IconName
  orgTypes?: OrgType[]
  masterOnly?: boolean
}

export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

export const orgTypeLabel: Record<OrgType, string> = {
  master: "마스터",
  distributor: "총판사",
  agency: "대행사",
  advertiser: "광고주",
}

export function getOrgNavigationGroups(slug: string): NavigationGroup[] {
  return [
    {
      label: "일반",
      items: [
        {
          href: `/org/${slug}/dashboard`,
          label: "대시보드",
          icon: "LayoutDashboard",
        },
        {
          href: `/org/${slug}/notices`,
          label: "공지사항",
          icon: "Bell",
        },
        {
          href: `/org/${slug}/faq`,
          label: "자주묻는 질문",
          icon: "HelpCircle",
        },
        {
          href: `/org/${slug}/members`,
          label: "계정관리",
          icon: "Users",
          orgTypes: ["master", "distributor", "agency"],
        },
      ],
    },
    {
      label: "광고",
      items: [
        {
          href: `/org/${slug}/ads`,
          label: "광고 관리",
          icon: "ShoppingCart",
        },
        {
          href: `/org/${slug}/settlements`,
          label: "정산관리",
          icon: "Calculator",
          orgTypes: ["master", "distributor", "agency"],
        },
      ],
    },
  ]
}


export function filterNavigationByAccess(
  groups: NavigationGroup[],
  orgType: OrgType | null,
  isMaster: boolean
): NavigationGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.masterOnly && !isMaster) return false
        if (item.orgTypes && orgType && !item.orgTypes.includes(orgType))
          return false
        if (item.orgTypes && !orgType) return false
        return true
      }),
    }))
    .filter((group) => group.items.length > 0)
}
