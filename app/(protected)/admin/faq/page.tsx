import { getAuthContext } from "@/src/lib/auth"
import { redirect } from "next/navigation"
import { AccessDenied } from "@/src/components/access-denied"
import { getFaqs } from "@/src/actions/faq"
import { FaqSortableList } from "@/app/(protected)/org/[slug]/faq/_components/faq-sortable-list"
import { CreateFaqDialog } from "@/app/(protected)/org/[slug]/faq/_components/create-faq-dialog"

export default async function AdminFaqPage() {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    redirect("/sign-in")
  }

  if (!ctx.isMaster) {
    return <AccessDenied />
  }

  const result = await getFaqs()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">자주묻는 질문</h1>
          <p className="text-sm text-muted-foreground">
            FAQ 항목을 관리합니다.
          </p>
        </div>
        <CreateFaqDialog />
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : (
        <FaqSortableList faqs={result.data?.faqs ?? []} />
      )}
    </div>
  )
}
