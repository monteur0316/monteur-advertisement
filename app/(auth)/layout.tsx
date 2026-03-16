import { PublicHeader } from "@/src/components/public-header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PublicHeader />
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        {children}
      </div>
    </>
  )
}
