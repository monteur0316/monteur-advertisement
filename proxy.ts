import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
])

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isOrgRoute = createRouteMatcher(["/org/(.*)"])

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) {
      return
    }

    const { userId, orgId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    const orgType = sessionClaims?.orgType as string | undefined

    if (isAdminRoute(req) && orgType !== "master") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    if (isOrgRoute(req) && !orgId) {
      return NextResponse.redirect(new URL("/org-selection", req.url))
    }
  },
  {
    organizationSyncOptions: {
      organizationPatterns: ["/org/:slug", "/org/:slug/(.*)"],
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
