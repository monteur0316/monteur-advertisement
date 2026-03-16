import { getAuthContext } from "@/src/lib/auth"
import { getFaqs } from "@/src/actions/faq"
import { redirect } from "next/navigation"
import { FaqList } from "./_components/faq-list"
import { FaqSortableList } from "./_components/faq-sortable-list"
import { CreateFaqDialog } from "./_components/create-faq-dialog"

export default async function OrgFaqPage() {
  const ctx = await getAuthContext()

  if (!ctx.orgId) {
    redirect("/org-selection")
  }

  const result = await getFaqs()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">자주묻는 질문</h1>
          <p className="text-sm text-muted-foreground">
            자주묻는 질문과 답변을 확인합니다.
          </p>
        </div>
        {ctx.isMaster && <CreateFaqDialog />}
      </div>

      {result.error ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : ctx.isMaster ? (
        <FaqSortableList faqs={result.data?.faqs ?? []} />
      ) : (
        <FaqList faqs={result.data?.faqs ?? []} />
      )}
    </div>
  )
}
