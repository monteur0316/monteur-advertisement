import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Building2, Handshake, Megaphone } from "lucide-react"

interface OrgCountCardProps {
  counts: {
    distributor: number
    agency: number
    advertiser: number
  }
}

const orgItems = [
  { key: "distributor" as const, label: "총판사", icon: Building2 },
  { key: "agency" as const, label: "대행사", icon: Handshake },
  { key: "advertiser" as const, label: "광고주", icon: Megaphone },
]

export function OrgCountCard({ counts }: OrgCountCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">조직 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orgItems.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm">{label}</span>
              </div>
              <span className="text-sm font-bold">{counts[key]}개</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
