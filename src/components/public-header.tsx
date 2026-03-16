"use client"

import { SignedIn, SignedOut, useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/src/components/theme-toggle"

export function PublicHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Monteur</span>
        </div>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <SignedOut>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">로그인</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </nav>
      </div>
    </header>
  )
}

function UserMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="size-6 rounded-full"
            />
          ) : (
            <div className="bg-muted size-6 rounded-full" />
          )}
          <span className="max-w-32 truncate text-sm">
            {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            await signOut()
            router.push("/sign-in")
          }}
        >
          <LogOut className="size-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
