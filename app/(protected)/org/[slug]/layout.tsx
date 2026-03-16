import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { orgId, orgSlug } = await auth()
  const { slug } = await params

  if (!orgId) {
    redirect("/org-selection")
  }

  if (orgSlug !== slug) {
    redirect(`/org/${orgSlug}/dashboard`)
  }

  return <>{children}</>
}
