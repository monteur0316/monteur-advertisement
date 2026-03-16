"use client"

import { useState, useTransition } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const ERROR_MESSAGES: Record<string, string> = {
  form_identifier_not_found: "등록되지 않은 아이디입니다.",
  form_password_incorrect: "비밀번호가 올바르지 않습니다.",
  too_many_attempts: "너무 많은 시도입니다. 잠시 후 다시 시도해주세요.",
  form_password_pwned:
    "이 비밀번호는 보안에 취약합니다. 다른 비밀번호를 사용해주세요.",
  session_exists: "이미 로그인되어 있습니다.",
}

export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    startTransition(async () => {
      try {
        setError(null)
        const result = await signIn.create({
          identifier,
          password,
        })

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId })
          router.push("/")
        } else {
          setError("추가 인증이 필요합니다.")
        }
      } catch (err: unknown) {
        const clerkError = err as {
          errors?: Array<{ code: string; message: string }>
        }
        const code = clerkError.errors?.[0]?.code ?? ""
        setError(ERROR_MESSAGES[code] ?? "로그인에 실패했습니다.")
      }
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">로그인</CardTitle>
        <CardDescription>
          아이디와 비밀번호를 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier">아이디</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="아이디를 입력하세요"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!identifier || !password || isPending}
          >
            {isPending ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
