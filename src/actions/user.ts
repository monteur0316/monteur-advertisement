"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { getAuthContext } from "@/src/lib/auth"

type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}

export async function getUserList(input?: {
  query?: string
  limit?: number
  offset?: number
}): Promise<
  ApiResponse<{
    users: Array<{
      id: string
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string
      createdAt: string
      lastSignInAt: string | null
    }>
    totalCount: number
  }>
> {
  const ctx = await getAuthContext()

  if (!ctx.userId) {
    return { data: null, error: "UNAUTHORIZED", message: "Not authenticated" }
  }

  if (!ctx.isMaster) {
    return {
      data: null,
      error: "FORBIDDEN",
      message: "Master organization access required",
    }
  }

  try {
    const client = await clerkClient()
    const response = await client.users.getUserList({
      limit: input?.limit ?? 10,
      offset: input?.offset ?? 0,
      query: input?.query || undefined,
    })

    const users = response.data.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      imageUrl: user.imageUrl,
      createdAt: user.createdAt.toString(),
      lastSignInAt: user.lastSignInAt?.toString() ?? null,
    }))

    return {
      data: { users, totalCount: response.totalCount },
      error: null,
      message: null,
    }
  } catch {
    return {
      data: null,
      error: "INTERNAL_ERROR",
      message: "Failed to fetch user list",
    }
  }
}
